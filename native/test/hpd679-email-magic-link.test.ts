import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createApiClient } from "../core/index";
import {
  emailMagicLinkTokenFromUrl,
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
  assert.match(source, /solveEmailMagicLinkAbuseChallenge\(challenge\)/);
  assert.match(source, /Link per E-Mail senden/);
  assert.match(source, /If this email can be used with Hey Hermes, a sign-in link is on its way/);
  assert.match(source, /Linking\.getInitialURL\(\)/);
  assert.match(source, /Linking\.addEventListener\("url"/);
  assert.match(source, /setAccountDeletionEmailReauthenticationAccountId\(session\.account\.id\)/);
  assert.match(source, /emailReauthenticationCompleted=\{accountDeletionEmailReauthenticationAccountId === snapshot\.me\.id\}/);
  assert.match(source, /signInWithGoogle\(\)/);
  assert.match(source, /AppleAuthenticationButtonType\.SIGN_UP/);
});
