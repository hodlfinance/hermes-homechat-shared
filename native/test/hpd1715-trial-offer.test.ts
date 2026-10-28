import assert from "node:assert/strict";
import test from "node:test";
import { appLocales } from "../core/types";
import { trialOfferBannerAllowed, trialOfferCopy, trialOfferView } from "../core/trial-offer";
import { mobilePersonalPurchaseCanStart } from "../src/revenuecat-purchases";

// HPD-1715: an account on emergency or press access gets a deadline to start a real
// store trial. While it runs the app shows "Start free trial" although access is active,
// and the normal store purchase may start. Without the deadline nothing changes.

const ACCOUNT = "acct_synthetic_1715";
const DEADLINE = "2026-10-29T10:00:00.000Z";
const NOW = Date.parse("2026-10-27T10:00:00.000Z");

function state(over: { status?: string; provider?: string | null; trialOffer?: { deadlineAt: string } | null } = {}) {
  return {
    accountId: ACCOUNT,
    entitlement: { accountId: ACCOUNT, status: over.status ?? "active", provider: over.provider ?? "manual", revenueCatCustomerId: null, storeProductId: null },
    workspaceAccess: { runtimeAccess: "enabled" },
    trialOffer: over.trialOffer === undefined ? { deadlineAt: DEADLINE } : over.trialOffer,
    lastWebhookEvent: null,
  };
}

test("the offer names the deadline and says Probezeit starten in German", () => {
  const view = trialOfferView({ trialOffer: { deadlineAt: DEADLINE } }, "de", (value) => `<${value}>`, NOW);
  assert.ok(view);
  assert.equal(view.cta, "Probezeit starten");
  assert.ok(view.body.includes(`<${DEADLINE}>`));
  assert.equal(trialOfferView({ trialOffer: { deadlineAt: DEADLINE } }, "en", String, NOW)?.cta, "Start free trial");
});

test("no offer without the server's field, once taken, or past the deadline", () => {
  assert.equal(trialOfferView({}, "en", String, NOW), null);
  assert.equal(trialOfferView({ trialOffer: null }, "en", String, NOW), null);
  assert.equal(trialOfferView({ trialOffer: { deadlineAt: DEADLINE } }, "en", String, Date.parse(DEADLINE)), null);
});

test("every locale carries the date once", () => {
  for (const locale of appLocales) assert.equal(trialOfferCopy(locale).body.split("{date}").length, 2, locale);
});

test("the store purchase may start for a manual entitlement only while the deadline runs", () => {
  // Today's behaviour is unchanged: running access hides the purchase.
  assert.equal(mobilePersonalPurchaseCanStart(ACCOUNT, state({ trialOffer: null }), null, NOW), false);
  assert.equal(mobilePersonalPurchaseCanStart(ACCOUNT, state(), null, NOW), true);
  assert.equal(mobilePersonalPurchaseCanStart(ACCOUNT, state({ trialOffer: { deadlineAt: DEADLINE } }), null, Date.parse(DEADLINE)), false);
  // A store subscription already running is never offered a second purchase, deadline or not.
  assert.equal(mobilePersonalPurchaseCanStart(ACCOUNT, state({ status: "trialing", provider: "revenuecat" }), null, NOW), false);
  // A purchase finished in this session blocks another one.
  assert.equal(mobilePersonalPurchaseCanStart(ACCOUNT, state(), { accountId: ACCOUNT, expirationAt: null }, NOW), false);
});

test("the banner shows only in the Hey app with a store, never in HODL, LiveQuote or Fin", () => {
  assert.equal(trialOfferBannerAllowed({ sessionMode: "standalone", storePlatform: "app_store" }), true);
  assert.equal(trialOfferBannerAllowed({ sessionMode: "standalone", storePlatform: null }), false);
  assert.equal(trialOfferBannerAllowed({ sessionMode: "external", storePlatform: "app_store" }), false);
  assert.equal(trialOfferBannerAllowed({ sessionMode: "external", storePlatform: "play_store" }), false);
});

test("the surface gates the banner on the Hey host", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /const trialOffer = productAccessScreen === "home" && trialOfferBannerAllowed\(\{ sessionMode: host\.session\.mode, storePlatform \}\)/);
});
