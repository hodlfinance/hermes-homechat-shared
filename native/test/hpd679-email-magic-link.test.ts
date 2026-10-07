import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createApiClient } from "../core/index";
import { authUiCopy } from "../core/auth-ui-copy";
import {
  EmailMagicLinkAbuseError,
  emailMagicLinkTokenFromUrl,
  requestEmailMagicLinkWithAbuseProof,
  solveEmailMagicLinkAbuseChallenge,
} from "../src/mobile-email-magic-link";

const validToken = "A".repeat(48);

test("the iPhone accepts the owned production Universal Link and its isolated LOCAL scheme only", () => {
  assert.equal(
    emailMagicLinkTokenFromUrl(`https://heyhermes.app/api/auth/email-magic-link/open#${validToken}`),
    validToken,
  );
  assert.equal(
    emailMagicLinkTokenFromUrl(`heyhermes-local-locala1b2c3d4://auth/email-magic-link?token=${validToken}`),
    validToken,
  );
  assert.equal(emailMagicLinkTokenFromUrl(`heyhermes://auth/email-magic-link?token=${validToken}`), null);
  assert.equal(emailMagicLinkTokenFromUrl(`https://heyhermes.app/api/auth/email-magic-link/open?token=${validToken}`), null);
  assert.equal(emailMagicLinkTokenFromUrl(`https://example.test/email-magic-link?token=${validToken}`), null);
  assert.equal(emailMagicLinkTokenFromUrl("heyhermes-local-locala1b2c3d4://auth/email-magic-link?token=short"), null);
});

test("the native proof solver produces a server-verifiable leading-zero proof", async () => {
  const challenge = {
    challenge: "C".repeat(48),
    difficulty: 8,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    id: "proof_test",
  };
  const proof = await solveEmailMagicLinkAbuseChallenge(challenge, { yieldEvery: 256 });
  const digest = createHash("sha256").update(`${proof.challenge}.${proof.nonce}`).digest();
  assert.equal(digest[0], 0);
  assert.equal(proof.challengeId, challenge.id);
});

test("the native client obtains abuse proof before the public request and supports deletion reauthentication", async () => {
  const requests: Array<{ body: Record<string, unknown>; url: string }> = [];
  const abuseProof = { challenge: "C".repeat(48), challengeId: "proof_test", nonce: 42 };
  const client = createApiClient({
    baseUrl: "https://example.test/api",
    fetchImpl: async (url, init) => {
      requests.push({ body: JSON.parse(String(init?.body ?? "{}")), url: String(url) });
      if (String(url).endsWith("/auth/email-magic-link/challenge")) {
        return new Response(JSON.stringify({
          challenge: abuseProof.challenge,
          difficulty: 8,
          expiresAt: "2026-09-14T12:00:00.000Z",
          id: abuseProof.challengeId,
        }), { status: 200 });
      }
      if (String(url).endsWith("/auth/email-magic-link/start")) {
        return new Response(JSON.stringify({ accepted: true, message: "neutral" }), { status: 202 });
      }
      if (String(url).endsWith("/account/deletion/email-reauthentication/start")) {
        return new Response(JSON.stringify({ accepted: true, message: "fresh" }), { status: 202 });
      }
      return new Response(JSON.stringify({
        account: { id: "acct_test", role: "member", status: "active" },
        expiresAt: "2026-09-14T12:00:00.000Z",
        purpose: "login",
        token: "session-token",
      }), { status: 200 });
    },
  });
  await client.emailMagicLinkAbuseChallenge({ surface: "ios" });
  await client.startEmailMagicLink({ abuseProof, email: "new@example.com", surface: "ios", website: "" });
  await client.completeEmailMagicLink({ surface: "ios", token: validToken });
  await client.startHeyAccountDeletionEmailReauthentication({ surface: "ios" });
  assert.deepEqual(requests, [
    {
      body: { surface: "ios" },
      url: "https://example.test/api/auth/email-magic-link/challenge",
    },
    {
      body: { abuseProof, email: "new@example.com", surface: "ios", website: "" },
      url: "https://example.test/api/auth/email-magic-link/start",
    },
    {
      body: { surface: "ios", token: validToken },
      url: "https://example.test/api/auth/email-magic-link/session",
    },
    {
      body: { surface: "ios" },
      url: "https://example.test/api/account/deletion/email-reauthentication/start",
    },
  ]);
});

test("the create-account surface keeps Google and Apple and adds neutral email signup", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /Create your account with email, Google, or Apple/);
  assert.match(source, /requestEmailMagicLink\(\)/);
  assert.match(source, /requestEmailMagicLinkWithAbuseProof\(\{/);
  assert.match(source, /const run = emailMagicLinkRunRef\.current;\s+if \(!run\) return;\s+\/\/[^\n]*\n[^\n]*\n\s+if \(state === "background"\) \{\s+run\.suspended = true;/);
  assert.match(source, /requestEmailMagicLinkRef\.current\(true\)/);
  // HPD-1087 moved the link wording into the shared copy table, in all eight languages.
  assert.match(source, /staticUiCopy\(appLocale\)\["Email me a sign-in link"\]/);
  assert.equal(authUiCopy("de")["Email me a sign-in link"], "Link per E-Mail senden");
  assert.match(source, /If this email can be used with Hey Hermes, a sign-in link is on its way/);
  assert.match(source, /Linking\.getInitialURL\(\)/);
  assert.match(source, /Linking\.addEventListener\("url"/);
  assert.match(source, /setAccountDeletionEmailReauthenticationAccountId\(session\.account\.id\)/);
  assert.match(source, /emailReauthenticationCompleted=\{accountDeletionEmailReauthenticationAccountId === snapshot\.me\.id\}/);
  assert.match(source, /signInWithGoogle\(\)/);
  assert.match(source, /AppleAuthenticationButtonType\.SIGN_UP/);
});

const proofChallenge = (overrides: Partial<{ challenge: string; difficulty: number; expiresAt: string; id: string }> = {}) => ({
  challenge: "D".repeat(48),
  difficulty: 12,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  id: "proof_fresh",
  ...overrides,
});

test("the solver proves 12-bit and multi-digit nonces exactly like the server hash", async () => {
  for (const difficulty of [12, 14]) {
    const challenge = proofChallenge({ difficulty, challenge: `E${difficulty}`.padEnd(48, "x") });
    const proof = await solveEmailMagicLinkAbuseChallenge(challenge);
    const digest = createHash("sha256").update(`${proof.challenge}.${proof.nonce}`).digest();
    const bits = digest.readUInt16BE(0) >> (16 - difficulty);
    assert.equal(bits, 0, `difficulty ${difficulty} nonce ${proof.nonce}`);
    assert.ok(proof.nonce > 9, "nonce exercises the multi-digit encoder");
  }
});

test("the solver stops at expiresAt after a frozen yield instead of spinning on", async () => {
  let clock = Date.now();
  const challenge = proofChallenge({ difficulty: 24, expiresAt: new Date(clock + 5_000).toISOString() });
  let yields = 0;
  await assert.rejects(
    solveEmailMagicLinkAbuseChallenge(challenge, {
      yieldEvery: 256,
      now: () => clock,
      // iOS background: the timer returns only after the challenge expired.
      yieldControl: async () => { yields += 1; clock += 10_000; },
    }),
    (error: unknown) => error instanceof EmailMagicLinkAbuseError && error.reason === "expired",
  );
  assert.equal(yields, 1);
});

test("the solver stops at the next batch when aborted", async () => {
  const controller = new AbortController();
  await assert.rejects(
    solveEmailMagicLinkAbuseChallenge(proofChallenge({ difficulty: 24 }), {
      yieldEvery: 256,
      signal: controller.signal,
      yieldControl: async () => controller.abort(),
    }),
    (error: unknown) => error instanceof EmailMagicLinkAbuseError && error.reason === "aborted",
  );
});

test("an expired challenge is replaced by exactly one fresh challenge", async () => {
  const fetched: string[] = [];
  const started: string[] = [];
  await requestEmailMagicLinkWithAbuseProof({
    fetchChallenge: async () => {
      const id = `proof_${fetched.length}`;
      fetched.push(id);
      return proofChallenge({ id });
    },
    solve: async (challenge) => {
      if (challenge.id === "proof_0") throw new EmailMagicLinkAbuseError("expired", "expired");
      return { challenge: challenge.challenge, challengeId: challenge.id, nonce: 7 };
    },
    start: async (proof) => { started.push(proof.challengeId); },
  });
  assert.deepEqual(fetched, ["proof_0", "proof_1"]);
  assert.deepEqual(started, ["proof_1"]);

  let fetches = 0;
  await assert.rejects(
    requestEmailMagicLinkWithAbuseProof({
      fetchChallenge: async () => { fetches += 1; return proofChallenge(); },
      solve: async () => { throw new EmailMagicLinkAbuseError("expired", "expired"); },
      start: async () => assert.fail("must not start without a proof"),
    }),
    (error: unknown) => error instanceof EmailMagicLinkAbuseError && error.reason === "expired",
  );
  assert.equal(fetches, 2, "a second expiry ends the attempt instead of looping");
});

test("the whole request ends with a timeout error and stops the solver", async () => {
  let fireTimeout: () => void = () => undefined;
  let solverSignal: AbortSignal | undefined;
  const pending = requestEmailMagicLinkWithAbuseProof({
    fetchChallenge: async () => proofChallenge(),
    solve: (_challenge, options) => {
      solverSignal = options?.signal;
      return new Promise(() => undefined);
    },
    start: async () => assert.fail("must not start"),
    timeoutMs: 30_000,
    setTimer: (callback, ms) => { assert.equal(ms, 30_000); fireTimeout = callback; return 1; },
    clearTimer: () => undefined,
  });
  await new Promise((resolve) => setImmediate(resolve));
  fireTimeout();
  await assert.rejects(pending, (error: unknown) => error instanceof EmailMagicLinkAbuseError && error.reason === "timeout");
  assert.equal(solverSignal?.aborted, true);
});

test("an outside abort (app returning to foreground) ends the stale request", async () => {
  const controller = new AbortController();
  const pending = requestEmailMagicLinkWithAbuseProof({
    fetchChallenge: async () => proofChallenge(),
    solve: () => new Promise(() => undefined),
    start: async () => assert.fail("must not start"),
    signal: controller.signal,
  });
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof EmailMagicLinkAbuseError && error.reason === "aborted");
});

test("HPD-1087: sign-in opens on the email link; the password form sits behind a small link", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const start = source.indexOf("authEntryMode === \"sign_in\" && signInWithPassword ? (");
  assert.ok(start > 0, "the password form is gated on the toggle");
  const block = source.slice(start, source.indexOf("Platform.OS === \"ios\" && (nativeAuthConfig", start));
  const [passwordBranch = "", linkBranch = ""] = block.split(/\n\s+\) : \(\n/);
  assert.match(passwordBranch, /secureTextEntry/);
  assert.match(passwordBranch, /Use a sign-in link instead/);
  assert.doesNotMatch(linkBranch, /secureTextEntry|loginPassword|accessCode/);
  assert.match(linkBranch, /requestEmailMagicLink\(\)/);
  assert.match(linkBranch, /authEntryMode === "sign_in" \? \(\s+<Pressable[\s\S]*setSignInWithPassword\(true\)[\s\S]*"Sign in with password"/);
  assert.match(source, /const \[signInWithPassword, setSignInWithPassword\] = useState\(false\)/);
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = authUiCopy(locale);
    for (const key of ["Sign in with password", "Use a sign-in link instead", "Email me a sign-in link", "We’ll email you a secure sign-in link. No password needed."] as const) {
      assert.ok(copy[key]?.trim(), `${locale}: ${key}`);
    }
  }
  assert.equal(authUiCopy("de")["Sign in with password"], "Mit Passwort anmelden");
});
