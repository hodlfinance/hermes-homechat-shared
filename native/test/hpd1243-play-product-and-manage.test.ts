import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/index";
import { parseHeyHermesSalesStatus } from "../core/hermes-api";
import { ANDROID_PLAY_SUBSCRIPTIONS_URL, heyPlayProductGuard, heyStoreWording } from "../src/hey-store-platform";
import { IOS_APP_STORE_SUBSCRIPTIONS_URL, iosPaywallCopy } from "../src/ios-paywall";
import { staticUiMessage } from "../src/static-ui-copy";
import {
  appStoreManagedSentence,
  mobileStoreNotice,
  mobileSubscriptionManageAction,
  mobileSubscriptionManagementTarget,
} from "../src/subscription-management";

// HPD-1243, phase 2.
//
// 1. Product id guard. The Android build sells the product named by its own
//    build value; the Plane's catalog accepts the product it holds. Nothing
//    compared the two: with different ids Google takes the payment and the
//    Plane matches no catalog entry. The Plane now states its id in the sales
//    status and the Android paywall sells only when both are the same string.
// 2. "Manage" follows the store that holds the plan, not the phone in the hand.
//
// Both are Android-or-Play only. The iOS purchase effect and the iOS manage
// path for an App Store or web plan are what they were.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const PRODUCT = "hey_personal:monthly";
const status = (playStorePersonalProductId: unknown) => ({
  schemaVersion: "heyhermes.sales-status/v1", open: true, reason: "open", mayPurchase: true,
  invitation: null, waitlist: null, checkedAt: "2026-10-13T20:00:00.000Z", playStorePersonalProductId,
});

test("the sales status carries the Plane's Play product, and an old or odd answer is 'not stated', not a broken status", () => {
  assert.equal(parseHeyHermesSalesStatus(status(PRODUCT))?.playStorePersonalProductId, PRODUCT);
  for (const absent of [undefined, null, "", "   ", 7, { id: PRODUCT }, [PRODUCT]]) {
    const parsed = parseHeyHermesSalesStatus(status(absent));
    assert.ok(parsed, `the rest of the status still parses for ${JSON.stringify(absent)}`);
    assert.equal(parsed.playStorePersonalProductId, null);
    assert.equal(parsed.mayPurchase, true);
  }
  // An old Plane sends no such field at all.
  const { playStorePersonalProductId: _dropped, ...old } = status(PRODUCT);
  assert.equal(parseHeyHermesSalesStatus(old)?.playStorePersonalProductId, null);
});

test("Android sells only when the build's product is the Plane's, character for character", () => {
  const settled = (playStorePersonalProductId: string | null) => ({ buildProductId: PRODUCT, salesStatusSettled: true, salesStatus: { playStorePersonalProductId } });
  assert.equal(heyPlayProductGuard(settled(PRODUCT)), "match");
  for (const other of ["hey_personal:monthly-v2", "hey_personal:Monthly", " hey_personal:monthly", "hey_personal:monthly ", "hey_personal", "app.heyhermes.personal.monthly.v3", null]) {
    assert.equal(heyPlayProductGuard(settled(other)), "mismatch", String(other));
  }
  // No answer from the Plane (old server, network error): nothing is sold.
  assert.equal(heyPlayProductGuard({ buildProductId: PRODUCT, salesStatusSettled: true, salesStatus: null }), "mismatch");
  // A build without a product never matches, not even an empty answer.
  assert.equal(heyPlayProductGuard({ buildProductId: "", salesStatusSettled: true, salesStatus: { playStorePersonalProductId: "" as unknown as string } }), "mismatch");
  // Before the Plane answered: wait, sell nothing yet.
  assert.equal(heyPlayProductGuard({ buildProductId: PRODUCT, salesStatusSettled: false, salesStatus: null }), "pending");
  assert.equal(heyPlayProductGuard({ buildProductId: PRODUCT, salesStatusSettled: false, salesStatus: { playStorePersonalProductId: PRODUCT } }), "pending");
});

test("the surface binds, loads and sells nothing on Android until the guard says match; iOS never asks", () => {
  assert.match(surface, /const playProductGuard = storePlatform === "android"\s*\? heyPlayProductGuard\(\{ buildProductId: mobilePurchasesController\.personalProduct\.id, salesStatusSettled, salesStatus \}\)\s*: "match";/);
  const effect = surface.slice(surface.indexOf("const playProductGuard = storePlatform"), surface.indexOf("async function reconcileMobileSubscription("));
  // The refusal stands before RevenueCat is bound and before any plan is loaded.
  const refusal = effect.indexOf('if (playProductGuard !== "match") {');
  assert.ok(refusal > 0 && refusal < effect.indexOf("void bindMobilePurchasesAccount(accountId)"), "the guard must run before the binding");
  assert.match(effect, /if \(playProductGuard !== "match"\) \{[^}]*mobilePurchasesController\.suspend\(\);\s*setMobilePurchasePlans\(\[\]\);\s*setMobilePurchaseAccountReady\(false\);\s*setMobilePurchasePhase\(playProductGuard === "pending" \? "loading" : "unavailable"\);\s*setMobilePurchaseNotice\(playProductGuard === "pending" \? null : "App Store purchases are not configured in this build\."\);\s*return;\s*\}/);
  // The effect runs again when the Plane's answer arrives.
  assert.match(effect, /\}, \[snapshot\?\.me\.id, playProductGuard, serverPlanTiersKey\]\);/); // HPD-1534
  // The status is settled by an answer and by a failure alike, and reset with the session.
  assert.match(surface, /setSalesStatus\(null\);\s*setSalesStatusSettled\(false\);\s*if \(!token \|\| host\.session\.mode !== "standalone" \|\| !storePlatform\) return;\s*let cancelled = false;\s*void readHeySalesStatus\(storePlatform, \(options\) => api\.salesStatus\(options\), \{ cancelled: \(\) => cancelled \}\)\.then\(\(status\) => \{\s*if \(cancelled\) return;\s*setSalesStatus\(status\);\s*setSalesStatusSettled\(true\);/);
});

test("the refusal is the existing sentence, named Google Play on Android", () => {
  const existing = "App Store purchases are not configured in this build.";
  assert.equal(surface.split(`"${existing}"`).length - 1, 2, "one sentence, used for the missing key and for the product mismatch");
  assert.equal(mobileStoreNotice(existing, "en", "android"), "Google Play purchases are not configured in this build.");
  assert.equal(mobileStoreNotice(existing, "en", "ios"), existing);
});

test("the Plane's management answer is read for every store, for the signed-in account only", () => {
  const identity = { accountId: "acct_1", workspaceId: "ws_1" };
  const web = "https://billing.revenuecat.com/synthetic-app/portal?token=synthetic";
  assert.deepEqual(mobileSubscriptionManagementTarget({ ...identity, platform: "app_store", href: IOS_APP_STORE_SUBSCRIPTIONS_URL }, identity), { store: "app_store", href: IOS_APP_STORE_SUBSCRIPTIONS_URL });
  assert.deepEqual(mobileSubscriptionManagementTarget({ ...identity, platform: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL }, identity), { store: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL });
  assert.deepEqual(mobileSubscriptionManagementTarget({ ...identity, platform: "web_billing", href: web }, identity), { store: "web_billing", href: web });
  for (const refused of [
    { ...identity, accountId: "acct_2", platform: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL },
    { ...identity, workspaceId: "ws_2", platform: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL },
    { ...identity, platform: "play_store", href: "https://play.google.com/store/account/subscriptions?sku=x" },
    { ...identity, platform: "play_store", href: "https://evil.example/store/account/subscriptions" },
    { ...identity, platform: "play_store", href: IOS_APP_STORE_SUBSCRIPTIONS_URL },
    { ...identity, platform: "app_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL },
    { ...identity, platform: "amazon", href: ANDROID_PLAY_SUBSCRIPTIONS_URL },
    null, "play_store", {},
  ]) assert.equal(mobileSubscriptionManagementTarget(refused, identity), null, JSON.stringify(refused));
});

test("Manage goes to the store that holds the plan", () => {
  const appStore = { store: "app_store", href: IOS_APP_STORE_SUBSCRIPTIONS_URL } as const;
  const play = { store: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL } as const;
  const web = { store: "web_billing", href: "https://billing.revenuecat.com/synthetic-app/portal?token=synthetic" } as const;
  // iPhone: as before for the App Store, the web and no answer; new for a Google Play plan.
  assert.deepEqual(mobileSubscriptionManageAction("ios", appStore), { kind: "ios_app_store" });
  assert.deepEqual(mobileSubscriptionManageAction("ios", null), { kind: "ios_app_store" });
  assert.deepEqual(mobileSubscriptionManageAction("ios", web), { kind: "open", href: web.href });
  assert.deepEqual(mobileSubscriptionManageAction("ios", play), { kind: "open", href: ANDROID_PLAY_SUBSCRIPTIONS_URL });
  // Android: Google Play for a Play plan and for no answer, the web for a web plan,
  // and for an App Store plan a sentence, because Apple's page does not open there.
  assert.deepEqual(mobileSubscriptionManageAction("android", play), { kind: "open", href: ANDROID_PLAY_SUBSCRIPTIONS_URL });
  assert.deepEqual(mobileSubscriptionManageAction("android", null), { kind: "open", href: ANDROID_PLAY_SUBSCRIPTIONS_URL });
  assert.deepEqual(mobileSubscriptionManageAction("android", web), { kind: "open", href: web.href });
  assert.deepEqual(mobileSubscriptionManageAction("android", appStore), { kind: "say_app_store" });

  const manage = surface.slice(surface.indexOf("async function manageMobileSubscription()"), surface.indexOf("const loadNativeCapabilities"));
  assert.match(manage, /if \(action\.kind === "say_app_store"\) \{[^}]*setMobilePurchaseNotice\(appStoreManagedSentence\(appLocale\)\);\s*return;\s*\}/);
});

test("an Android user with an App Store plan reads the existing renewal sentence, still naming the App Store, in every language", () => {
  assert.equal(appStoreManagedSentence("en"), "The subscription renews monthly at Apple's displayed price until cancelled in App Store settings.");
  for (const locale of appLocales) {
    const sentence = appStoreManagedSentence(locale);
    assert.equal(sentence, iosPaywallCopy(locale).renewal, locale);
    assert.match(sentence, /App[ -]?Store/, locale);
    // As a notice it is not reworded to Google Play ...
    assert.equal(mobileStoreNotice(sentence, locale, "android"), sentence, locale);
    assert.equal(mobileStoreNotice(sentence, locale, "ios"), sentence, locale);
    // ... while every other notice on Android still is, exactly as before.
    const other = "Restore finished. The server found no active App Store access for this Hey account.";
    assert.equal(mobileStoreNotice(other, locale, "android"), heyStoreWording(staticUiMessage(locale, other), locale, "android"), locale);
    assert.equal(mobileStoreNotice(other, locale, "ios"), other, locale);
  }
  assert.equal(mobileStoreNotice(null, "en", "android"), null);
  // Both places that show a purchase notice go through the same function.
  assert.equal(surface.split("mobileStoreNotice(").length - 1, 2);
  assert.doesNotMatch(surface, /heyStoreWording\(staticUiMessage\((?:appLocale|locale), (?:mobilePurchaseNotice|rawNotice)\)/);
});
