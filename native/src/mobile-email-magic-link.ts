import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import type { EmailMagicLinkAbuseChallenge, EmailMagicLinkAbuseProof } from "../core/types";

const productionMagicLinkHost = "heyhermes.app";
const productionMagicLinkPath = "/api/auth/email-magic-link/open";
const localMagicLinkScheme = /^heyhermes-local-[a-z0-9]+:$/;
const magicToken = /^[A-Za-z0-9_-]{32,256}$/;

/**
 * Production login authority arrives only through the HTTPS Universal Link
 * owned by heyhermes.app. A custom URL scheme is intentionally accepted only
 * for an isolated LOCAL build, whose per-worktree scheme never carries a
 * production credential.
 */
export function emailMagicLinkTokenFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === productionMagicLinkHost &&
      parsed.port === "" &&
      parsed.pathname === productionMagicLinkPath &&
      !parsed.search
    ) {
      const token = decodeURIComponent(parsed.hash.slice(1)).trim();
      return magicToken.test(token) ? token : null;
    }
    if (
      localMagicLinkScheme.test(parsed.protocol) &&
      parsed.hostname === "auth" &&
      parsed.pathname === "/email-magic-link" &&
      !parsed.hash
    ) {
      const token = parsed.searchParams.get("token")?.trim() ?? "";
      return magicToken.test(token) ? token : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function emailMagicLinkDigestMeetsDifficulty(digest: Uint8Array, difficulty: number) {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > digest.length * 8) return false;
  const wholeBytes = Math.floor(difficulty / 8);
  const remainingBits = difficulty % 8;
  for (let index = 0; index < wholeBytes; index += 1) {
    if (digest[index] !== 0) return false;
  }
  if (!remainingBits) return true;
  const mask = 0xff << (8 - remainingBits);
  return ((digest[wholeBytes] ?? 0xff) & mask) === 0;
}

export type EmailMagicLinkAbuseFailure = "expired" | "aborted" | "timeout" | "unsolvable";

/** A typed failure so callers can tell an expired puzzle from a hard error. */
export class EmailMagicLinkAbuseError extends Error {
  readonly reason: EmailMagicLinkAbuseFailure;
  constructor(reason: EmailMagicLinkAbuseFailure, message: string) {
    super(message);
    this.name = "EmailMagicLinkAbuseError";
    this.reason = reason;
  }
}

export interface EmailMagicLinkSolveOptions {
  /** Hashes per batch between cooperative yields. */
  yieldEvery?: number;
  yieldControl?: () => Promise<void>;
  /** Stops the solver at the next batch boundary. */
  signal?: AbortSignal;
  now?: () => number;
}

const digitBytes = utf8ToBytes("0123456789");

/** Writes the decimal nonce after the fixed prefix and returns the used length. */
function writeNonce(buffer: Uint8Array, offset: number, nonce: number) {
  let length = 1;
  for (let rest = nonce; rest >= 10; rest = Math.floor(rest / 10)) length += 1;
  let value = nonce;
  for (let index = offset + length - 1; index >= offset; index -= 1) {
    buffer[index] = digitBytes[value % 10]!;
    value = Math.floor(value / 10);
  }
  return offset + length;
}

/**
 * Hashcash-style proof for the public mail endpoint. Work is deliberately
 * performed on-device and yielded in batches so it raises the cost of
 * automated abuse without freezing the React Native UI.
 *
 * iOS suspends JavaScript timers while the app is in the background, so a
 * yield can return long after the challenge expired. The expiry and the abort
 * signal are therefore re-checked after every yield; a stale challenge is
 * never solved to completion.
 */
export async function solveEmailMagicLinkAbuseChallenge(
  challenge: EmailMagicLinkAbuseChallenge,
  options: EmailMagicLinkSolveOptions = {},
): Promise<EmailMagicLinkAbuseProof> {
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(challenge.challenge)) throw new Error("Invalid email sign-in challenge.");
  if (!Number.isInteger(challenge.difficulty) || challenge.difficulty < 8 || challenge.difficulty > 24) {
    throw new Error("Unsupported email sign-in challenge difficulty.");
  }
  const now = options.now ?? Date.now;
  const expiresAt = Date.parse(challenge.expiresAt);
  const assertUsable = () => {
    if (options.signal?.aborted) throw new EmailMagicLinkAbuseError("aborted", "Email sign-in was interrupted.");
    if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
      throw new EmailMagicLinkAbuseError("expired", "The email sign-in challenge expired.");
    }
  };
  assertUsable();
  const yieldEvery = Math.max(256, options.yieldEvery ?? 16_384);
  const yieldControl = options.yieldControl ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  // One reusable buffer: the challenge prefix is encoded once, only the
  // decimal nonce is rewritten per attempt (no per-hash string allocation).
  const prefix = utf8ToBytes(`${challenge.challenge}.`);
  const buffer = new Uint8Array(prefix.length + 10);
  buffer.set(prefix);
  for (let nonce = 0; nonce <= 0xffff_ffff; nonce += 1) {
    const end = writeNonce(buffer, prefix.length, nonce);
    const digest = sha256(buffer.subarray(0, end));
    if (emailMagicLinkDigestMeetsDifficulty(digest, challenge.difficulty)) {
      return { challenge: challenge.challenge, challengeId: challenge.id, nonce };
    }
    if (nonce > 0 && nonce % yieldEvery === 0) {
      await yieldControl();
      assertUsable();
    }
  }
  throw new EmailMagicLinkAbuseError("unsolvable", "The email sign-in challenge could not be solved.");
}

export const emailMagicLinkRequestTimeoutMs = 30_000;

export interface EmailMagicLinkRequestDeps {
  fetchChallenge: () => Promise<EmailMagicLinkAbuseChallenge>;
  start: (abuseProof: EmailMagicLinkAbuseProof) => Promise<unknown>;
  signal?: AbortSignal;
  timeoutMs?: number;
  solve?: typeof solveEmailMagicLinkAbuseChallenge;
  solveOptions?: Omit<EmailMagicLinkSolveOptions, "signal">;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

/**
 * Challenge -> proof -> start, bounded end to end. An expired challenge is
 * replaced by exactly one fresh challenge; a second expiry, the overall
 * timeout, or an abort ends the attempt with an EmailMagicLinkAbuseError so
 * the screen can leave "Sending link..." and offer a retry.
 */
export async function requestEmailMagicLinkWithAbuseProof(deps: EmailMagicLinkRequestDeps): Promise<void> {
  const solve = deps.solve ?? solveEmailMagicLinkAbuseChallenge;
  const setTimer = deps.setTimer ?? ((callback: () => void, ms: number) => setTimeout(callback, ms));
  const clearTimer = deps.clearTimer ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const internal = new AbortController();
  const onOuterAbort = () => internal.abort();
  if (deps.signal?.aborted) throw new EmailMagicLinkAbuseError("aborted", "Email sign-in was interrupted.");
  deps.signal?.addEventListener("abort", onOuterAbort);
  let rejectBound: (error: Error) => void = () => undefined;
  const bound = new Promise<never>((_, reject) => { rejectBound = reject; });
  const fail = (error: EmailMagicLinkAbuseError) => {
    internal.abort();
    rejectBound(error);
  };
  const timer = setTimer(
    () => fail(new EmailMagicLinkAbuseError("timeout", "Sending the sign-in link took too long. Please try again.")),
    deps.timeoutMs ?? emailMagicLinkRequestTimeoutMs,
  );
  const onAbortReject = () => fail(new EmailMagicLinkAbuseError("aborted", "Email sign-in was interrupted."));
  deps.signal?.addEventListener("abort", onAbortReject);
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      const challenge = await deps.fetchChallenge();
      if (internal.signal.aborted) throw new EmailMagicLinkAbuseError("aborted", "Email sign-in was interrupted.");
      let proof: EmailMagicLinkAbuseProof;
      try {
        proof = await solve(challenge, { ...deps.solveOptions, signal: internal.signal });
      } catch (caught) {
        if (caught instanceof EmailMagicLinkAbuseError && caught.reason === "expired" && attempt === 0) continue;
        throw caught;
      }
      if (internal.signal.aborted) throw new EmailMagicLinkAbuseError("aborted", "Email sign-in was interrupted.");
      await deps.start(proof);
      return;
    }
  };
  try {
    await Promise.race([run(), bound]);
  } finally {
    clearTimer(timer);
    deps.signal?.removeEventListener("abort", onOuterAbort);
    deps.signal?.removeEventListener("abort", onAbortReject);
  }
}
