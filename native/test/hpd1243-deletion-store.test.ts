import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type PersonalAccessStore } from "../core/index";
import { heyAccountDeletionStoreCopy, heyStoreWording, type HeyStorePlatform } from "../src/hey-store-platform";
import { mobileText } from "../src/appI18n";

/**
 * HPD-1243: the account deletion texts name the store that manages the plan,
 * as the trial sentence does (App Store, Google Play, or no store for a plan
 * managed on the web). Only the two sentences that name a store change; every
 * other word stays.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const storeWords = /Apple|App.?Store|iPhone|Google.?Play/i;
const stores: Array<PersonalAccessStore | null> = ["app_store", "play_store", "web_billing", null];

/** The rule that shipped in phase 1 (#158), for the iOS comparison. */
function phaseOne<T extends { confirmBody: string; subscriptionKept: string }>(copy: T, locale: (typeof appLocales)[number], platform: HeyStorePlatform | null, store: PersonalAccessStore | null): T {
  const namesGooglePlay = store === "play_store" || (platform === "android" && store !== "app_store");
  return namesGooglePlay
    ? { ...copy, confirmBody: heyStoreWording(copy.confirmBody, locale, "android"), subscriptionKept: heyStoreWording(copy.subscriptionKept, locale, "android") }
    : copy;
}

test("iOS and an Android build without the switch are unchanged for every plan store", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.account.deletion;
    for (const platform of ["ios", null] as const) {
      for (const store of stores) {
        assert.deepEqual(heyAccountDeletionStoreCopy(copy, locale, platform, store), phaseOne(copy, locale, platform, store), `${locale} ${platform} ${store}`);
      }
    }
  }
});

test("Android: App Store plan keeps the App Store sentences, a Play or unknown plan names Google Play", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.account.deletion;
    assert.equal(heyAccountDeletionStoreCopy(copy, locale, "android", "app_store"), copy);
    for (const store of ["play_store", null] as const) {
      const worded = heyAccountDeletionStoreCopy(copy, locale, "android", store);
      assert.match(worded.confirmBody, /Google.Play/, `${locale} ${store}`);
      assert.match(worded.subscriptionKept, /Google.Play/, `${locale} ${store}`);
    }
  }
});

test("Android: a plan managed on the web names no store, and nothing else in the sentences changes", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.account.deletion;
    const web = heyAccountDeletionStoreCopy(copy, locale, "android", "web_billing");
    for (const key of ["confirmBody", "subscriptionKept"] as const) {
      assert.doesNotMatch(web[key], storeWords, `${locale}.${key}: ${web[key]}`);
      assert.notEqual(web[key], copy[key], `${locale}.${key} was re-worded`);
    }
    // The first paragraph of the confirmation is word for word the same.
    assert.equal(web.confirmBody.split("\n\n")[0], copy.confirmBody.split("\n\n")[0], locale);
    for (const key of Object.keys(copy) as Array<keyof typeof copy>) {
      if (key !== "confirmBody" && key !== "subscriptionKept") assert.equal(web[key], copy[key], `${locale}.${key}`);
    }
  }
  const en = heyAccountDeletionStoreCopy(mobileText("en").systemPages.account.deletion, "en", "android", "web_billing");
  assert.equal(en.subscriptionKept, "Your subscription was not cancelled.");
  assert.match(en.confirmBody, /\n\nThis does not cancel your subscription, and it does not touch any other product account or your email address\.$/);
});

test("surface: the deletion screen takes its copy from the one tested function", () => {
  assert.match(surface, /const accountDeletionCopy = heyAccountDeletionStoreCopy\(t\.systemPages\.account\.deletion, appLocale, storePlatform, subscriptionStore\);/);
  assert.match(surface, /copy=\{accountDeletionCopy\}/);
});
