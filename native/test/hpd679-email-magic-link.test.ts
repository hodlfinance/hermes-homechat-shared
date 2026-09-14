import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createApiClient } from "../core/index";
import { emailMagicLinkTokenFromUrl } from "../src/mobile-email-magic-link";

const validToken = "A".repeat(48);

test("the iPhone accepts only the exact Hey Hermes email magic-link route", () => {
  assert.equal(
    emailMagicLinkTokenFromUrl(`heyhermes://auth/email-magic-link?token=${validToken}`),
    validToken,
  );
  assert.equal(emailMagicLinkTokenFromUrl(`https://example.test/email-magic-link?token=${validToken}`), null);
  assert.equal(emailMagicLinkTokenFromUrl(`heyhermes://other/email-magic-link?token=${validToken}`), null);
  assert.equal(emailMagicLinkTokenFromUrl("heyhermes://auth/email-magic-link?token=short"), null);
});

test("the native client uses the public request and one-time session endpoints", async () => {
  const requests: Array<{ body: Record<string, unknown>; url: string }> = [];
  const client = createApiClient({
    baseUrl: "https://example.test/api",
    fetchImpl: async (url, init) => {
      requests.push({ body: JSON.parse(String(init?.body ?? "{}")), url: String(url) });
      if (String(url).endsWith("/auth/email-magic-link/start")) {
        return new Response(JSON.stringify({ accepted: true, message: "neutral" }), { status: 202 });
      }
      return new Response(JSON.stringify({
        account: { id: "acct_test", role: "member", status: "active" },
        expiresAt: "2026-09-14T12:00:00.000Z",
        token: "session-token",
      }), { status: 200 });
    },
  });
  await client.startEmailMagicLink({ email: "new@example.com", surface: "ios", website: "" });
  await client.completeEmailMagicLink({ surface: "ios", token: validToken });
  assert.deepEqual(requests, [
    {
      body: { email: "new@example.com", surface: "ios", website: "" },
      url: "https://example.test/api/auth/email-magic-link/start",
    },
    {
      body: { surface: "ios", token: validToken },
      url: "https://example.test/api/auth/email-magic-link/session",
    },
  ]);
});

test("the create-account surface keeps Google and Apple and adds neutral email signup", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /Create your account with email, Google, or Apple/);
  assert.match(source, /requestEmailMagicLink\(\)/);
  assert.match(source, /Link per E-Mail senden/);
  assert.match(source, /If this email can be used with Hey Hermes, a sign-in link is on its way/);
  assert.match(source, /Linking\.getInitialURL\(\)/);
  assert.match(source, /Linking\.addEventListener\("url"/);
  assert.match(source, /signInWithGoogle\(\)/);
  assert.match(source, /AppleAuthenticationButtonType\.SIGN_UP/);
});
