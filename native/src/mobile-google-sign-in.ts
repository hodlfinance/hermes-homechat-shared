// HPD-1042: one bounded Google sign-in attempt on iOS.
//
// The Expo Google hook exchanges the authorization code for an id_token on its
// own and drops any exchange failure without a result, and the in-app Google
// sheet has no deadline. Either way the app waited forever and nothing reached
// the server. This module runs the whole attempt as one awaited call so every
// path ends in exactly one outcome: an id_token, a cancel, a timeout or a
// failure. The caller always re-enables its buttons afterwards.

export const googleTokenEndpoint = "https://oauth2.googleapis.com/token";
export const googleSignInBrowserTimeoutMs = 3 * 60_000;
export const googleSignInExchangeTimeoutMs = 30_000;

export type GoogleSignInOutcome =
  | { kind: "id_token"; idToken: string }
  | { kind: "cancelled" }
  | { kind: "timed_out"; step: "browser" | "exchange" }
  | { kind: "failed"; reason: string };

export type GoogleSignInRequestShape = {
  clientId?: unknown;
  codeVerifier?: unknown;
  extraParams?: unknown;
  redirectUri?: unknown;
  url?: unknown;
} | null | undefined;

type FetchLike = (input: string, init: { body: string; headers: Record<string, string>; method: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type GoogleSignInDependencies = {
  prompt: () => Promise<unknown>;
  request: GoogleSignInRequestShape;
  fetchImpl: FetchLike;
  dismissBrowser?: () => void;
  browserTimeoutMs?: number;
  exchangeTimeoutMs?: number;
};

function stringField(source: unknown, key: string): string | null {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * The request carries the nonce Google will sign into the id_token. The app
 * mints the challenge first and the Expo hook rebuilds the request afterwards,
 * so for a moment the button could start Google with the previous nonce. Only
 * offer Google once the loaded request carries the current challenge nonce.
 */
export function googleAuthRequestMatchesChallenge(
  request: GoogleSignInRequestShape,
  challenge: { nonce: string } | null | undefined,
): boolean {
  if (!request || !challenge) return false;
  if (!stringField(request, "url")) return false;
  return stringField(request.extraParams, "nonce") === challenge.nonce;
}

type Timed<T> = { timedOut: true } | { timedOut: false; value: T };

function withDeadline<T>(work: Promise<T>, ms: number, onTimeout?: () => void): Promise<Timed<T>> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        onTimeout?.();
      } catch {
        // Dismissal is best effort; the timeout outcome stands either way.
      }
      resolve({ timedOut: true });
    }, ms);
    work.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ timedOut: false, value });
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function exchangeCode(
  code: string,
  request: GoogleSignInRequestShape,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<GoogleSignInOutcome> {
  const clientId = stringField(request, "clientId");
  const redirectUri = stringField(request, "redirectUri");
  const codeVerifier = stringField(request, "codeVerifier");
  if (!clientId || !redirectUri || !codeVerifier) {
    return { kind: "failed", reason: "request_incomplete" };
  }
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  }).toString();
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const exchanged = await withDeadline(
    fetchImpl(googleTokenEndpoint, {
      body,
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      signal: controller?.signal,
    }).then(async (response) => ({ ok: response.ok, status: response.status, payload: await response.json().catch(() => null) })),
    timeoutMs,
    () => controller?.abort(),
  );
  if (exchanged.timedOut) return { kind: "timed_out", step: "exchange" };
  const { ok, status, payload } = exchanged.value;
  if (!ok) return { kind: "failed", reason: stringField(payload, "error") ?? `token_http_${status}` };
  const idToken = stringField(payload, "id_token");
  return idToken ? { kind: "id_token", idToken } : { kind: "failed", reason: "no_id_token" };
}

/** Runs one Google attempt to a single, final outcome. Never throws. */
export async function runGoogleIdTokenSignIn(deps: GoogleSignInDependencies): Promise<GoogleSignInOutcome> {
  const browserTimeoutMs = deps.browserTimeoutMs ?? googleSignInBrowserTimeoutMs;
  const exchangeTimeoutMs = deps.exchangeTimeoutMs ?? googleSignInExchangeTimeoutMs;
  try {
    const prompted = await withDeadline(deps.prompt(), browserTimeoutMs, deps.dismissBrowser);
    if (prompted.timedOut) return { kind: "timed_out", step: "browser" };
    const result = prompted.value;
    const type = stringField(result, "type");
    if (type === "cancel" || type === "dismiss" || type === "locked") return { kind: "cancelled" };
    const params = result && typeof result === "object" ? (result as Record<string, unknown>).params : null;
    if (type === "error") return { kind: "failed", reason: stringField(params, "error") ?? "provider_error" };
    if (type !== "success") return { kind: "failed", reason: `unexpected_${type ?? "result"}` };
    const directIdToken = stringField(params, "id_token")
      ?? stringField((result as Record<string, unknown>).authentication, "idToken");
    if (directIdToken) return { kind: "id_token", idToken: directIdToken };
    const code = stringField(params, "code");
    if (!code) return { kind: "failed", reason: "no_code" };
    return await exchangeCode(code, deps.request, deps.fetchImpl, exchangeTimeoutMs);
  } catch (caught) {
    return { kind: "failed", reason: caught instanceof Error && caught.name === "AbortError" ? "aborted" : "exception" };
  }
}

/** Plain user copy for every outcome that is not an id_token. */
export function googleSignInOutcomeMessage(outcome: GoogleSignInOutcome): string | null {
  switch (outcome.kind) {
    case "id_token":
      return null;
    case "cancelled":
      return "Google sign-in was cancelled. Nothing was changed. You can try again.";
    case "timed_out":
      return "Google did not finish signing you in. Nothing was changed. Try again, or use another sign-in method.";
    case "failed":
      return "Google sign-in failed. Nothing was changed. Try again, or use another sign-in method.";
  }
}
