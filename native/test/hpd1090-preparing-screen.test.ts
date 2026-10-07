import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/types";
import { heyPreparingCopy } from "../src/hey-preparing";

// HPD-1090: after the purchase and until the runtime is ready, web and app
// show a preparing screen in the HPD-1085 paywall design and switch to chat
// by themselves.

test("the preparing copy exists in all eight languages, with the accent inside the title", () => {
  for (const locale of appLocales) {
    const copy = heyPreparingCopy(locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}.${key}`);
    assert.ok(copy.title.includes(copy.titleAccent), locale);
    assert.notEqual(copy.body, copy.appBody, locale);
    assert.match(copy.body, /2.{1,3}3/, locale);
  }
  assert.equal(heyPreparingCopy("de").title, "Dein Hermes wird eingerichtet");
  assert.equal(heyPreparingCopy("en").body, "This usually takes 2–3 minutes. We’ll email you when it’s ready — you can close this page.");
  for (const locale of appLocales.filter((locale) => locale !== "en")) {
    assert.notEqual(heyPreparingCopy(locale).title, heyPreparingCopy("en").title, locale);
  }
});

test("the app replaces the locked chat with a full preparing screen and polls until ready", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(surface, /PendingProductAccessModal/);
  assert.match(surface, /if \(pendingProductAccess \|\| productAccessScreen === "no_access"\) \{[\s\S]*?<HeyPreparingPanel/);
  assert.match(surface, /const timer = setInterval\(\(\) => void refreshProductAccess\(\), 5_000\);/);
  // Leaving the preparing screen reloads the full snapshot, which carries the
  // greeting the server persists only once the runtime is ready.
  assert.match(surface, /if \(wasPreparingRef\.current\) \{\s*wasPreparingRef\.current = false;\s*void refresh\(true\);/);
});

// HPD-1090 follow-ups (review of #128): a never-paid account sees no
// preparing promise, and the ready email is promised only while the account's
// email notifications are on.
import { heyNoAccessCopy, heyPreparingBody, heyReadyEmailPromised } from "../src/hey-preparing";
import { mobilePendingAccessCopy } from "../src/appI18n";
import { mobileProductAccessScreen } from "../src/mobile-product-access";

const emailWord = /mail|correo|メール|이메일|écrirons/i;

test("the email sentence is conditional on email notifications, in all eight languages", () => {
  for (const locale of appLocales) {
    for (const surface of ["web", "app"] as const) {
      assert.match(heyPreparingBody(locale, { surface, email: true }), emailWord, `${locale}.${surface}`);
      assert.doesNotMatch(heyPreparingBody(locale, { surface, email: false }), emailWord, `${locale}.${surface}`);
    }
    assert.match(mobilePendingAccessCopy(locale, "capacity", { email: true }).body, emailWord, locale);
    assert.doesNotMatch(mobilePendingAccessCopy(locale, "capacity", { email: false, waitlistPosition: 3 }).body, emailWord, locale);
    const noAccess = heyNoAccessCopy(locale);
    for (const value of Object.values(noAccess)) assert.ok(value.trim(), locale);
    assert.doesNotMatch(noAccess.body, emailWord, locale);
  }
  assert.equal(heyReadyEmailPromised({ notificationPreferences: { emailEnabled: true } }), true);
  assert.equal(heyReadyEmailPromised({ notificationPreferences: { emailEnabled: false } }), false);
  assert.equal(heyReadyEmailPromised({}), false);
});

test("a never-paid account gets the no-access state, not the preparing screen", () => {
  const snapshot = (status: string, comped = false) => ({
    me: { id: "acct_1" }, workspace: { id: "ws_1" }, entitlement: { status, comped },
  }) as never;
  const base = { standalone: true, status: null };
  assert.equal(mobileProductAccessScreen({ ...base, ios: false, showPaywallOnboarding: false, snapshot: snapshot("none") }), "no_access");
  assert.equal(mobileProductAccessScreen({ ...base, ios: true, showPaywallOnboarding: false, snapshot: snapshot("expired") }), "no_access");
  assert.equal(mobileProductAccessScreen({ ...base, ios: true, showPaywallOnboarding: true, snapshot: snapshot("none") }), "purchase");
  assert.equal(mobileProductAccessScreen({ ...base, ios: false, showPaywallOnboarding: false, snapshot: snapshot("active") }), "preparing");
  assert.equal(mobileProductAccessScreen({ ...base, ios: false, showPaywallOnboarding: false, snapshot: snapshot("none", true) }), "preparing");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /if \(pendingProductAccess \|\| productAccessScreen === "no_access"\)/);
  assert.match(surface, /heyPreparingBody\(locale, \{ surface: "app", email: readyEmail \}\)/);
});
