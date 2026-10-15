import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/types";
import { heyPaywallOfferCopy, iosPaywallView } from "../src/ios-paywall";
import { mobileProductAccessScreen } from "../src/mobile-product-access";
import type { MobilePurchasePlan } from "../src/revenuecat-purchases";

// HPD-1265 (follows HODL's HPD-1255): Apple Guideline 3.1.2(c). The billed
// amount must be the most clear and conspicuous pricing element; the free
// trial must be subordinate to it in position and size.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

function functionBody(name: string) {
  const start = surface.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const next = surface.indexOf("\nfunction ", start + 1);
  return surface.slice(start, next < 0 ? undefined : next);
}

function style(name: string) {
  const match = surface.match(new RegExp(`\\n  ${name}: \\{([^}]*)\\}`));
  assert.ok(match, `style ${name} exists`);
  const block = match[1] ?? "";
  const fontSize = Number(block.match(/fontSize: (\d+)/)?.[1]);
  return { block, fontSize };
}

function plan(trialEligibility: MobilePurchasePlan["trialEligibility"]): MobilePurchasePlan {
  return {
    packageId: "personal_monthly",
    productId: "app.heyhermes.personal.monthly.v3",
    displayName: "Personal",
    title: "Hey Hermes Personal",
    description: "",
    priceString: "$29.00",
    trialEligibility,
  } as MobilePurchasePlan;
}

function offer(locale: (typeof appLocales)[number], trialEligibility: MobilePurchasePlan["trialEligibility"]) {
  return iosPaywallView({ locale, plan: plan(trialEligibility), comped: false, entitlementStatus: "none", runtimeAccess: "enabled" }).offer;
}

test("a trial-eligible account sees the plan headline and the billed monthly price, the trial only in the smaller note", () => {
  const en = offer("en", "eligible");
  assert.equal(en.kind, "trial");
  assert.equal(en.title, "An AI that works for you. And belongs to you.");
  assert.equal(en.titleAccent, "And belongs to you.");
  assert.equal(en.priceLine, "$29.00 / month");
  assert.equal(en.priceNote, "7 days free, then billed monthly · cancel anytime");
  assert.equal(en.ctaLabel, "Start your free week");
  assert.equal(en.ctaSubline, null);
  for (const locale of appLocales) {
    const copy = heyPaywallOfferCopy(locale);
    const view = offer(locale, "eligible");
    assert.equal(view.title, copy.planTitle, `${locale}: plain plan headline`);
    assert.equal(view.titleAccent, copy.planTitleAccent, locale);
    assert.ok(view.priceLine?.includes("$29.00"), `${locale}: the price line carries the billed amount`);
    assert.ok(view.priceNote && !view.priceNote.includes("$29.00"), `${locale}: the trial note carries no second price`);
    assert.match(view.priceNote ?? "", /7/, `${locale}: the trial length stays on screen`);
    assert.doesNotMatch(view.title, /7/, `${locale}: no trial words in the headline`);
    assert.match(view.termsText, /\$29\.00/, `${locale}: the renewal terms keep the price`);
  }
});

test("without a confirmed trial the offer reads exactly as before", () => {
  for (const eligibility of ["ineligible", "unavailable", "unknown"] as const) {
    const view = offer("en", eligibility);
    assert.equal(view.kind, "subscribe");
    assert.equal(view.title, "An AI that works for you. And belongs to you.");
    assert.equal(view.ctaLabel, "Subscribe for $29.00/month");
    assert.equal(view.ctaSubline, "Monthly · cancel anytime");
    assert.equal(view.priceLine, null);
    assert.equal(view.priceNote, null);
  }
});

test("the billed price sits above the trial note and the button, and is the largest price text", () => {
  const body = functionBody("IosPaywallOfferPanel");
  const price = body.indexOf("{offer.priceLine}");
  const note = body.indexOf("{offer.priceNote}");
  const button = body.indexOf("<Text style={styles.paywallCtaText}>{offer.ctaLabel}</Text>");
  assert.ok(price > 0 && note > price && button > note, "price, then trial note, then the button");
  assert.match(body, /<Text style=\{styles\.paywallBilledPrice\}[^>]*>\{offer\.priceLine\}<\/Text>/);
  assert.match(body, /<Text style=\{styles\.paywallBilledPriceNote\}>\{offer\.priceNote\}<\/Text>/);

  const billed = style("paywallBilledPrice");
  const trialNote = style("paywallBilledPriceNote");
  const ctaText = style("paywallCtaText");
  const subline = style("paywallCtaSubline");
  assert.ok(billed.fontSize > trialNote.fontSize, "trial note is smaller than the price");
  assert.ok(billed.fontSize > ctaText.fontSize, "the button that names the free week is smaller than the price");
  assert.ok(billed.fontSize > subline.fontSize, "no other price line is larger");
  assert.match(billed.block, /fontWeight: "800"/);
  assert.doesNotMatch(trialNote.block, /fontWeight: "(7|8|9)00"/, "the trial note is not bold");
  assert.doesNotMatch(trialNote.block, /paywallBrandColor/, "the trial note is not in the accent colour");
});

test("the web purchase screen's trial words are unchanged", () => {
  // apps/web WebPersonalSubscriptionPanel reads these keys directly.
  const en = heyPaywallOfferCopy("en");
  assert.equal(en.trialTitle, "Try Hey Hermes free for 7 days");
  assert.equal(en.trialThen, "then {price} per month · cancel anytime");
  assert.equal(heyPaywallOfferCopy("de").trialTitle, "Teste Hey Hermes 7 Tage gratis");
});

test("HODL never reaches this purchase screen: an external host always lands on home", () => {
  const snapshot = { me: {}, workspace: {}, entitlement: { status: "none" }, serverDeletion: null } as never;
  for (const showPaywallOnboarding of [true, false]) {
    assert.equal(mobileProductAccessScreen({ standalone: false, ios: true, showPaywallOnboarding, snapshot, status: null }), "home");
  }
  assert.match(surface, /const productAccessScreen = mobileProductAccessScreen\(\{\s*standalone: host\.session\.mode === "standalone",/);
  // The offer panel has one caller, the full-screen branch of IosPaywallPanel.
  assert.equal(surface.match(/<IosPaywallOfferPanel\b/g)?.length, 1);
  assert.ok(functionBody("IosPaywallPanel").includes("<IosPaywallOfferPanel"));
  // The only full-screen IosPaywallPanel is behind the "purchase" / "deleted" access screen.
  const fullScreen = surface.indexOf('if (productAccessScreen === "purchase" || (productAccessScreen === "deleted"');
  assert.ok(fullScreen > 0);
  const usages = [...surface.matchAll(/<IosPaywallPanel\b/g)].map((m) => m.index ?? 0);
  assert.equal(usages.length, 2);
  for (const at of usages) {
    const isCompact = /^[^>]*?\bcompact\b/s.test(surface.slice(at, at + 400));
    assert.ok(isCompact || (at > fullScreen && at - fullScreen < 600), "every full-screen use sits behind the access gate");
  }
});
