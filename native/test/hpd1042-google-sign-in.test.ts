import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  googleAuthRequestMatchesChallenge,
  googleSignInOutcomeMessage,
  googleTokenEndpoint,
  runGoogleIdTokenSignIn,
  type GoogleSignInRequestShape,
} from "../src/mobile-google-sign-in";

const request: GoogleSignInRequestShape = {
  clientId: "ios-client.apps.googleusercontent.com",
  codeVerifier: "verifier-a",
  extraParams: { nonce: "nonce-a", prompt: "select_account" },
  redirectUri: "app.heyhermes.ios:/oauthredirect",
  url: "https://accounts.google.com/o/oauth2/v2/auth?nonce=nonce-a",
};

function jsonResponse(status: number, payload: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

const neverFetch = async () => {
  throw new Error("fetch must not run");
};

test("a code result is exchanged with the attempt's own verifier and yields the id_token", async () => {
  const calls: Array<{ url: string; body: URLSearchParams }> = [];
  const outcome = await runGoogleIdTokenSignIn({
    fetchImpl: async (url, init) => {
      calls.push({ url, body: new URLSearchParams(init.body) });
      return jsonResponse(200, { id_token: "id-token-1", access_token: "ignored" });
    },
    prompt: async () => ({ type: "success", params: { code: "code-1" } }),
    request,
  });
  assert.deepEqual(outcome, { kind: "id_token", idToken: "id-token-1" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, googleTokenEndpoint);
  assert.equal(calls[0]?.body.get("code"), "code-1");
  assert.equal(calls[0]?.body.get("code_verifier"), "verifier-a");
  assert.equal(calls[0]?.body.get("redirect_uri"), "app.heyhermes.ios:/oauthredirect");
  assert.equal(calls[0]?.body.get("grant_type"), "authorization_code");
  assert.equal(calls[0]?.body.get("client_id"), "ios-client.apps.googleusercontent.com");
});

test("a direct id_token is used without a token exchange", async () => {
  const outcome = await runGoogleIdTokenSignIn({
    fetchImpl: neverFetch,
    prompt: async () => ({ type: "success", params: { id_token: "id-token-2" } }),
    request,
  });
  assert.deepEqual(outcome, { kind: "id_token", idToken: "id-token-2" });
});

test("cancel, dismiss and locked end the attempt as cancelled with a clear message", async () => {
  for (const type of ["cancel", "dismiss", "locked"]) {
    const outcome = await runGoogleIdTokenSignIn({ fetchImpl: neverFetch, prompt: async () => ({ type }), request });
    assert.deepEqual(outcome, { kind: "cancelled" });
    assert.match(googleSignInOutcomeMessage(outcome) ?? "", /cancelled/);
  }
});

test("a Google sheet that never returns is dismissed after the deadline", async () => {
  let dismissed = 0;
  const outcome = await runGoogleIdTokenSignIn({
    browserTimeoutMs: 20,
    dismissBrowser: () => {
      dismissed += 1;
    },
    fetchImpl: neverFetch,
    prompt: () => new Promise(() => {}),
    request,
  });
  assert.deepEqual(outcome, { kind: "timed_out", step: "browser" });
  assert.equal(dismissed, 1);
  assert.match(googleSignInOutcomeMessage(outcome) ?? "", /did not finish/);
});

test("a failed or hanging code exchange ends the attempt instead of waiting forever", async () => {
  const rejected = await runGoogleIdTokenSignIn({
    fetchImpl: async () => jsonResponse(400, { error: "invalid_grant" }),
    prompt: async () => ({ type: "success", params: { code: "code-3" } }),
    request,
  });
  assert.deepEqual(rejected, { kind: "failed", reason: "invalid_grant" });

  const thrown = await runGoogleIdTokenSignIn({
    fetchImpl: async () => {
      throw new TypeError("Network request failed");
    },
    prompt: async () => ({ type: "success", params: { code: "code-4" } }),
    request,
  });
  assert.equal(thrown.kind, "failed");

  let aborted = false;
  const hanging = await runGoogleIdTokenSignIn({
    exchangeTimeoutMs: 20,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        aborted = true;
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }),
    prompt: async () => ({ type: "success", params: { code: "code-5" } }),
    request,
  });
  assert.deepEqual(hanging, { kind: "timed_out", step: "exchange" });
  assert.equal(aborted, true);

  const noToken = await runGoogleIdTokenSignIn({
    fetchImpl: async () => jsonResponse(200, { access_token: "only" }),
    prompt: async () => ({ type: "success", params: { code: "code-6" } }),
    request,
  });
  assert.deepEqual(noToken, { kind: "failed", reason: "no_id_token" });
});

test("a provider error or a thrown prompt becomes a failure, never a hang", async () => {
  const providerError = await runGoogleIdTokenSignIn({
    fetchImpl: neverFetch,
    prompt: async () => ({ type: "error", params: { error: "access_denied" } }),
    request,
  });
  assert.deepEqual(providerError, { kind: "failed", reason: "access_denied" });

  const thrown = await runGoogleIdTokenSignIn({
    fetchImpl: neverFetch,
    prompt: async () => {
      throw new Error("Another web browser is already open");
    },
    request,
  });
  assert.equal(thrown.kind, "failed");
  assert.match(googleSignInOutcomeMessage(thrown) ?? "", /failed/);
});

test("Google is offered only once the loaded request carries the current challenge nonce", () => {
  assert.equal(googleAuthRequestMatchesChallenge(request, { nonce: "nonce-a" }), true);
  assert.equal(googleAuthRequestMatchesChallenge(request, { nonce: "nonce-b" }), false);
  assert.equal(googleAuthRequestMatchesChallenge(null, { nonce: "nonce-a" }), false);
  assert.equal(googleAuthRequestMatchesChallenge(request, null), false);
  assert.equal(googleAuthRequestMatchesChallenge({ ...request, url: undefined }, { nonce: "nonce-a" }), false);
});

test("surface wiring: both modes run the bounded attempt and always re-enable the buttons", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const hook = surface.match(/const \[googleAuthRequest, , promptGoogleAuth\] = Google\.useIdTokenAuthRequest\(\{([\s\S]*?)\n  \}\);/)?.[1];
  assert.ok(hook, "the sign-in hook no longer exposes the auto-exchanged response");
  assert.match(hook, /shouldAutoExchangeCode: false,/);
  assert.doesNotMatch(surface, /googleAuthResponse/);

  const start = surface.indexOf("async function signInWithGoogle(");
  const end = surface.indexOf("async function signInWithApple(", start);
  const flow = surface.slice(start, end);
  assert.match(flow, /const attemptChallenge = googleChallenge;/);
  assert.match(flow, /const attemptRequest = googleAuthRequest;/);
  assert.match(flow, /runGoogleIdTokenSignIn\(\{/);
  assert.match(flow, /dismissBrowser: \(\) => WebBrowser\.dismissAuthSession\?\.\(\)/);
  assert.match(flow, /setAppError\(googleSignInOutcomeMessage\(outcome\)\)/);
  assert.match(flow, /completeNativeSignIn\("google", outcome\.idToken, attemptChallenge, mode\)/);
  assert.match(flow, /finally \{\s*setNativeAuthBusy\(null\);\s*setGoogleChallengeVersion/);

  for (const mode of ["login", "link"]) {
    assert.ok(
      surface.includes(`disabled={!googleAuthRequest || !googleChallenge || googleChallenge.mode !== "${mode}" || !googleSignInReady || Boolean(nativeAuthBusy)}`),
      `${mode} button waits for a request with the current nonce`,
    );
  }
});

test("the native session call has a deadline and ends with a clear, coded error", async () => {
  const { ApiError, createApiClient, nativeAuthSessionTimeoutCode, nativeAuthSessionTimeoutMs } = await import("../core/index");
  assert.equal(nativeAuthSessionTimeoutMs, 30_000);
  let aborted = false;
  const client = createApiClient({
    baseUrl: "https://example.invalid/api",
    fetchImpl: ((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        aborted = true;
        reject(Object.assign(new Error("The operation was aborted."), { name: "AbortError" }));
      });
    })) as unknown as typeof fetch,
  });
  const body = { challengeId: "c", idToken: "t", mode: "login", nonce: "n", provider: "google", surface: "ios" } as const;
  await assert.rejects(client.nativeAuthSession(body, { timeoutMs: 20 }), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, nativeAuthSessionTimeoutCode);
    assert.match(error.message, /did not answer in time/);
    return true;
  });
  assert.equal(aborted, true);

  // A fetch that ignores the signal still ends at the deadline.
  const deaf = createApiClient({ baseUrl: "https://example.invalid/api", fetchImpl: (() => new Promise(() => {})) as unknown as typeof fetch });
  await assert.rejects(deaf.nativeAuthSession(body, { timeoutMs: 20 }), (error: unknown) => (error as { code?: string }).code === nativeAuthSessionTimeoutCode);

  // A prompt answer is returned unchanged.
  const fast = createApiClient({
    baseUrl: "https://example.invalid/api",
    fetchImpl: (async () => new Response(JSON.stringify({ token: "session-token" }), { status: 200 })) as unknown as typeof fetch,
  });
  assert.deepEqual(await fast.nativeAuthSession(body, { timeoutMs: 1_000 }), { token: "session-token" });
});

test("a timed-out session call reaches the sign-in message and frees the buttons", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const start = surface.indexOf("async function signInWithGoogle(");
  const flow = surface.slice(start, surface.indexOf("async function signInWithApple(", start));
  assert.match(flow, /await completeNativeSignIn\("google"[\s\S]*?catch \(caught\) \{\s*setAppError\(userFacingError\(displayError\(caught/);
  const apple = surface.slice(surface.indexOf("async function signInWithApple("), surface.indexOf("async function reauthenticateAccountDeletionWithGoogle("));
  assert.match(apple, /finally \{\s*setNativeAuthBusy\(null\);/);
});
