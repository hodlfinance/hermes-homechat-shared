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

/**
 * Hashcash-style proof for the public mail endpoint. Work is deliberately
 * performed on-device and yielded in chunks so it raises the cost of automated
 * abuse without freezing the React Native UI.
 */
export async function solveEmailMagicLinkAbuseChallenge(
  challenge: EmailMagicLinkAbuseChallenge,
  options: { yieldEvery?: number; yieldControl?: () => Promise<void> } = {},
): Promise<EmailMagicLinkAbuseProof> {
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(challenge.challenge)) throw new Error("Invalid email sign-in challenge.");
  if (!Number.isInteger(challenge.difficulty) || challenge.difficulty < 8 || challenge.difficulty > 24) {
    throw new Error("Unsupported email sign-in challenge difficulty.");
  }
  if (Date.parse(challenge.expiresAt) <= Date.now()) throw new Error("The email sign-in challenge expired.");
  const yieldEvery = Math.max(256, options.yieldEvery ?? 4096);
  const yieldControl = options.yieldControl ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  for (let nonce = 0; nonce <= 0xffff_ffff; nonce += 1) {
    const digest = sha256(utf8ToBytes(`${challenge.challenge}.${nonce}`));
    if (emailMagicLinkDigestMeetsDifficulty(digest, challenge.difficulty)) {
      return { challenge: challenge.challenge, challengeId: challenge.id, nonce };
    }
    if (nonce > 0 && nonce % yieldEvery === 0) await yieldControl();
  }
  throw new Error("The email sign-in challenge could not be solved.");
}
