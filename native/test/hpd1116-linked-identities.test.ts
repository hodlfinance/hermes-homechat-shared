import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  accountPageCopy,
  createApiClient,
  linkedIdentityConfirmation,
  linkedIdentityLine,
} from "../core/index";

const locales = ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const;

test("HPD-1116: the native client reads the account's active linked identities", async () => {
  const client = createApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async (url) => {
      assert.match(String(url), /\/account\/linked-identities$/);
      return new Response(JSON.stringify({ identities: [{ provider: "google", email: "person@example.com" }] }), { status: 200 });
    },
  });
  assert.deepEqual(await client.heyLinkedIdentities(), {
    identities: [{ provider: "google", email: "person@example.com" }],
  });
});

test("HPD-1116: a linked row reads provider, address and state in every language", () => {
  assert.equal(linkedIdentityLine("de", { provider: "google", email: "person@example.com" }), "Google · person@example.com · verknüpft");
  assert.equal(linkedIdentityLine("en", { provider: "apple", email: null }), "Apple · linked");
  assert.equal(linkedIdentityConfirmation("de", "google"), "Google ist jetzt mit diesem Konto verknüpft.");
  for (const locale of locales) {
    const copy = accountPageCopy(locale);
    assert.ok(copy.linkedState.trim(), `${locale} has no linked state`);
    assert.match(copy.linkedConfirmation("Google"), /Google/, `${locale} confirmation drops the provider`);
  }
  assert.notEqual(accountPageCopy("de").linkedState, accountPageCopy("en").linkedState);
});

test("HPD-1116: the app's Linked accounts section shows linked rows and offers only unlinked providers", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const section = surface.match(/accountPage\.linkedAccountsTitle[\s\S]*?<\/MobileSystemSection>/)?.[0] ?? "";
  assert.match(surface, /heyLinkedIdentities\(\)/);
  assert.match(section, /linkedIdentityLine\(appLocale, identity\)/);
  assert.match(section, /!linkedProviders\.has\("google"\)/);
  assert.match(section, /!linkedProviders\.has\("apple"\)/);
  assert.match(section, /linkConfirmation/);
  // No unlink route exists on the API (HPD-1116), so the app offers none.
  assert.doesNotMatch(section, /unlink|Trennen/i);
  // After a successful link the list is read again and a short confirmation shows.
  assert.match(surface, /if \(mode === "link"\) \{[\s\S]{0,200}setLinkConfirmation\(linkedIdentityConfirmation\(appLocale, provider\)\)/);
});
