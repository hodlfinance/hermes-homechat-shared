import assert from "node:assert/strict";
import test from "node:test";
import { appLocales } from "../core/types";
import { heyPaywallOfferCopy, iosPaywallView } from "../src/ios-paywall";
import type { MobilePurchasePlan } from "../src/revenuecat-purchases";

// HPD-1085: the free week leads only when the Store confirms eligibility.

function plan(trialEligibility: MobilePurchasePlan["trialEligibility"]): MobilePurchasePlan {
  return {
    packageId: "personal_monthly",
    productId: "app.heyhermes.personal.monthly.v3",
    displayName: "Personal",
    title: "Hey Hermes Personal",
    description: "",
    priceString: "CHF 29.00",
    trialEligibility,
  } as MobilePurchasePlan;
}

function view(locale: (typeof appLocales)[number], p: MobilePurchasePlan | null, storeState?: "loading" | "ready" | "unavailable") {
  return iosPaywallView({ locale, plan: p, comped: false, entitlementStatus: "none", runtimeAccess: "enabled", storeState });
}

test("an eligible account sees the free week, its price after the trial and Apple's renewal terms", () => {
  const offer = view("en", plan("eligible")).offer;
  assert.equal(offer.kind, "trial");
  assert.equal(offer.title, "Try Hey Hermes free for 7 days");
  assert.equal(offer.ctaLabel, "Start your free week");
  assert.equal(offer.ctaSubline, "then CHF 29.00 per month · cancel anytime");
  assert.match(offer.termsText, /7 days free, then CHF 29\.00\/month\. Renews automatically/);
  assert.match(offer.termsText, /Guardian consent is required where local law says so\./);
});

test("an ineligible account never sees a free-week promise", () => {
  for (const eligibility of ["ineligible", "unavailable"] as const) {
    const offer = view("de", plan(eligibility)).offer;
    assert.equal(offer.kind, "subscribe");
    assert.equal(offer.ctaLabel, "Abonnieren für CHF 29.00/Monat");
    assert.equal(offer.waitlistTitle, offer.title);
    assert.doesNotMatch(`${offer.title} ${offer.ctaLabel} ${offer.ctaSubline} ${offer.termsText}`, /gratis|kostenlos/i);
  }
});

test("unknown eligibility shows the plan and leaves the trial decision to Apple's sheet", () => {
  const offer = view("en", plan("unknown")).offer;
  assert.equal(offer.kind, "subscribe");
  assert.match(offer.termsText, /Apple will confirm eligibility in the purchase sheet/);
});

test("without a Store package the button says what the Store is doing and no price is doubled", () => {
  for (const locale of appLocales) {
    const terms = view(locale, null, "unavailable").offer.termsText;
    assert.doesNotMatch(terms, /month\/month|\/mois\/mois|月額月額|월 월|\{price\}/, locale);
  }
  assert.equal(view("en", null, "loading").offer.ctaLabel, "Checking the App Store price...");
  assert.equal(view("en", null, "unavailable").offer.ctaLabel, "The App Store price is unavailable right now.");
});

test("every app language has a complete offer", () => {
  for (const locale of appLocales) {
    const copy = heyPaywallOfferCopy(locale);
    assert.ok(copy.trialTitle.includes(copy.trialTitleAccent), `${locale} trial accent`);
    assert.ok(copy.planTitle.includes(copy.planTitleAccent), `${locale} plan accent`);
    assert.equal(copy.benefits.length, 4, locale);
    for (const key of ["subscribeCta", "trialThen", "trialTerms", "subscribeTerms"] as const) {
      assert.ok(copy[key].includes("{price}"), `${locale} ${key}`);
    }
    if (locale !== "en") assert.notEqual(copy.trialCta, heyPaywallOfferCopy("en").trialCta, locale);
  }
});
