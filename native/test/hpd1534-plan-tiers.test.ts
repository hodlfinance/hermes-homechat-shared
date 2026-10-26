// HPD-1534 (Justus, 2026-10-23): Starter (30 days free), Pro (`personal`) and Max in the
// app, only while the server lists the tiers. Synthetic store packages only.
import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_REVENUECAT_PRODUCTS,
  MobilePurchasesController,
  mobileOfferedPlans,
  mobilePlanActiveNotice,
  mobilePlanChangeCanStart,
  mobileServerPlanTiers,
  type MobilePlanChange,
  type MobilePurchasesAdapter,
  type MobileStorePackage,
} from "../src/revenuecat-purchases";
import { iosPaywallView } from "../src/ios-paywall";
import { authUiCopy } from "../core/auth-ui-copy";

function pkg(identifier: string, productId: string, intro: MobileStorePackage["product"]["introPrice"], price = "$12.99"): MobileStorePackage {
  return { identifier, packageType: "CUSTOM", source: { identifier },
    product: { identifier: productId, title: identifier, description: "", price: 0, priceString: price, currencyCode: "USD", subscriptionPeriod: "P1M", introPrice: intro } };
}
const month = { price: 0, period: "P1M", periodUnit: "MONTH", periodNumberOfUnits: 1 };
const week = { price: 0, period: "P7D", periodUnit: "DAY", periodNumberOfUnits: 7 };

function adapter(packages: MobileStorePackage[], current: MobileStorePackage[] = [packages.find((p) => p.identifier === "personal_monthly")!]) {
  const purchases: Array<{ id: string; change?: MobilePlanChange }> = [];
  let productBought = "";
  const value: MobilePurchasesAdapter = {
    isConfigured: async () => true, configure: () => undefined, getAppUserID: async () => "acct_1", logIn: async () => undefined,
    getCustomerInfo: async () => ({ activeEntitlements: [] }),
    getOfferings: async () => ({ current: { identifier: "default", availablePackages: current }, all: { tiers_v1: { identifier: "tiers_v1", availablePackages: packages } } }),
    checkTrialEligibility: async (ids) => Object.fromEntries(ids.map((id) => [id, "eligible" as const])),
    purchasePackage: async (storePackage, change) => {
      purchases.push({ id: storePackage.identifier, change }); productBought = storePackage.product.identifier;
      return { productIdentifier: productBought.split(":")[0]!, customerInfo: { activeEntitlements: [{ identifier: "hey_hermes_access", productIdentifier: productBought.split(":")[0]!, expirationAt: new Date(Date.now() + 86_400_000).toISOString() }] } };
    },
    restorePurchases: async () => undefined,
  };
  return { value, purchases };
}

const iosPackages = [
  pkg("starter_monthly", MOBILE_REVENUECAT_PRODUCTS.starter_monthly, month),
  pkg("personal_monthly", MOBILE_REVENUECAT_PRODUCTS.personal_monthly, week, "$29.00"),
  pkg("max_monthly", MOBILE_REVENUECAT_PRODUCTS.max_monthly, null, "$79.00"),
];

test("without server tiers the app sells Personal from the current offering exactly as before", async () => {
  const { value } = adapter(iosPackages);
  const controller = new MobilePurchasesController(value);
  await controller.bindAccount("acct_1", "key");
  const plans = await controller.loadPlans("acct_1");
  assert.deepEqual(plans.map((plan) => [plan.packageId, plan.plan, plan.trialDays]), [["personal_monthly", "personal", 7]]);
  assert.deepEqual(mobileServerPlanTiers({ webBilling: {} }), []);
  assert.deepEqual(mobileServerPlanTiers(null), []);
});

test("with server tiers: tiers_v1, Personal (starter) first with 30 days, Pro without a trial (HPD-1762), Max without a trial; Max only when listed", async () => {
  const { value } = adapter(iosPackages);
  const controller = new MobilePurchasesController(value);
  await controller.bindAccount("acct_1", "key");
  const three = await controller.loadPlans("acct_1", { tiers: ["starter", "personal", "max"] });
  assert.deepEqual(three.map((plan) => [plan.packageId, plan.trialDays, plan.trialEligibility]),
    [["starter_monthly", 30, "eligible"], ["personal_monthly", 0, "unknown"], ["max_monthly", 0, "unavailable"]]);
  const two = await controller.loadPlans("acct_1", { tiers: mobileServerPlanTiers({ webBilling: { tiers: [{ plan: "starter" }, { plan: "personal" }] } }) });
  assert.deepEqual(two.map((plan) => plan.packageId), ["starter_monthly", "personal_monthly"]);
});

test("an unknown or wrongly mapped package refuses the tier offering (the app then sells Personal as before)", async () => {
  for (const packages of [[...iosPackages, pkg("annual", "x", null)], [pkg("starter_monthly", "wrong.product", month), iosPackages[1]!]]) {
    const { value } = adapter(packages);
    const controller = new MobilePurchasesController(value);
    await controller.bindAccount("acct_1", "key");
    assert.deepEqual((await controller.loadPlans("acct_1", { tiers: ["starter", "personal"] })).map((plan) => plan.packageId), ["personal_monthly"]);
  }
});

test("Google Play: Starter -> Pro replaces the old product as an upgrade; Pro -> Starter as a downgrade; App Store passes nothing", async () => {
  const play = [pkg("starter_monthly", "app.heyhermes.starter:monthly", month), pkg("personal_monthly", "app.heyhermes.personal:monthly", week)];
  const { value, purchases } = adapter(play);
  const controller = new MobilePurchasesController(value, { store: "play_store", personalMonthlyProductId: "app.heyhermes.personal:monthly", starterMonthlyProductId: "app.heyhermes.starter:monthly" });
  await controller.bindAccount("acct_1", "key");
  await controller.loadPlans("acct_1", { tiers: ["starter", "personal"] });
  await controller.purchase("acct_1", "personal_monthly", undefined, { currentProductId: "app.heyhermes.starter:monthly" });
  await controller.purchase("acct_1", "starter_monthly", undefined, { currentProductId: "app.heyhermes.personal:monthly" });
  assert.deepEqual(purchases.map((entry) => entry.change), [
    { oldProductId: "app.heyhermes.starter:monthly", direction: "upgrade" },
    { oldProductId: "app.heyhermes.personal:monthly", direction: "downgrade" },
  ]);
  const ios = adapter(iosPackages);
  const iosController = new MobilePurchasesController(ios.value);
  await iosController.bindAccount("acct_1", "key");
  await iosController.loadPlans("acct_1", { tiers: ["starter", "personal"] });
  await iosController.purchase("acct_1", "personal_monthly", undefined, { currentProductId: MOBILE_REVENUECAT_PRODUCTS.starter_monthly });
  assert.equal(ios.purchases[0]!.change, undefined);
});

test("a plan change starts only from a running plan of another tier bought in this store", () => {
  const controller = new MobilePurchasesController(adapter(iosPackages).value);
  const state = (plan: string, storeProductId: string | null, status = "active") => ({ entitlement: { status, plan, provider: "revenuecat", storeProductId } });
  assert.deepEqual(mobilePlanChangeCanStart(state("starter", MOBILE_REVENUECAT_PRODUCTS.starter_monthly, "trialing"), controller, "personal"),
    { currentProductId: MOBILE_REVENUECAT_PRODUCTS.starter_monthly });
  assert.equal(mobilePlanChangeCanStart(state("starter", MOBILE_REVENUECAT_PRODUCTS.starter_monthly), controller, "starter"), null);
  // A web subscription is changed on the web, not here.
  assert.equal(mobilePlanChangeCanStart(state("starter", "heyhermes_starter_monthly_web"), controller, "personal"), null);
  assert.equal(mobilePlanChangeCanStart(state("starter", MOBILE_REVENUECAT_PRODUCTS.starter_monthly, "expired"), controller, "personal"), null);
});

test("the paywall names the chosen plan and its own trial; the single-plan paywall is unchanged", () => {
  const starter = { packageId: "starter_monthly" as const, plan: "starter" as const, productId: MOBILE_REVENUECAT_PRODUCTS.starter_monthly, displayName: "Personal" as const,
    trialDays: 30, title: "", description: "", priceString: "$12.99", trialEligibility: "eligible" as const };
  const max = { ...starter, packageId: "max_monthly" as const, plan: "max" as const, displayName: "Max" as const, trialDays: 0, priceString: "$79.00", trialEligibility: "unavailable" as const };
  const base = { comped: false, entitlementStatus: "none" as const, runtimeAccess: "enabled" as const, storeState: "ready" as const };
  const de = iosPaywallView({ ...base, locale: "de", plan: starter, tiered: true });
  assert.equal(de.offer.eyebrow, "Hey Hermes Personal");
  assert.equal(de.offer.ctaLabel, "30 Tage gratis starten");
  assert.match(de.offer.title, /30 Tage gratis/);
  const en = iosPaywallView({ ...base, locale: "en", plan: max, tiered: true });
  assert.equal(en.offer.kind, "subscribe");
  assert.doesNotMatch(`${en.offer.title} ${en.offer.termsText} ${en.trialText}`, /free|7 days/);
  assert.throws(() => iosPaywallView({ ...base, locale: "en", plan: starter }));
  const personal = { ...starter, packageId: "personal_monthly" as const, plan: "personal" as const, displayName: "Pro" as const, trialDays: 0, priceString: "$29.00" };
  const single = iosPaywallView({ ...base, locale: "en", plan: personal });
  assert.equal(single.offer.eyebrow, "Hey Hermes Pro");
  assert.equal(single.offer.ctaLabel, "Start your free week");
  assert.equal(iosPaywallView({ ...base, locale: "en", plan: personal, entitlementStatus: "active", entitlementPlan: "starter" }).planLabel, "Personal");
});

test("review of #185: iOS downgrade accepts the plan kept until renewal; a pending completion blocks another change; a broken tier offering falls back to Personal", async () => {
  const ios = adapter(iosPackages);
  // Apple keeps Pro active until the renewal and may report it as the bought product.
  ios.value.purchasePackage = async () => ({ productIdentifier: MOBILE_REVENUECAT_PRODUCTS.personal_monthly, customerInfo: { activeEntitlements: [
    { identifier: "hey_hermes_access", productIdentifier: MOBILE_REVENUECAT_PRODUCTS.personal_monthly, expirationAt: new Date(Date.now() + 86_400_000).toISOString() }] } });
  const controller = new MobilePurchasesController(ios.value);
  await controller.bindAccount("acct_1", "key");
  await controller.loadPlans("acct_1", { tiers: ["starter", "personal"] });
  const result = await controller.purchase("acct_1", "starter_monthly", undefined, { currentProductId: MOBILE_REVENUECAT_PRODUCTS.personal_monthly });
  assert.ok(result.personalPurchaseExpirationAt);
  const state = { entitlement: { status: "active", plan: "personal", provider: "revenuecat", storeProductId: MOBILE_REVENUECAT_PRODUCTS.personal_monthly } };
  assert.equal(mobilePlanChangeCanStart(state, controller, "starter", Date.now(), { accountId: "acct_1" }), null);
  const broken = adapter([pkg("starter_monthly", MOBILE_REVENUECAT_PRODUCTS.starter_monthly, month)], [iosPackages[1]!]);
  const fallback = new MobilePurchasesController(broken.value);
  await fallback.bindAccount("acct_1", "key");
  assert.deepEqual((await fallback.loadPlans("acct_1", { tiers: ["starter", "personal"] })).map((plan) => plan.packageId), ["personal_monthly"]);
});

test("Justus 2026-10-24: the first purchase offers Starter alone; Pro and Max only as a change of a running store plan", () => {
  const controller = new MobilePurchasesController(adapter(iosPackages).value);
  const plans = [{ plan: "starter" as const, id: "s" }, { plan: "personal" as const, id: "p" }, { plan: "max" as const, id: "m" }];
  const state = (status: string, storeProductId: string | null, extra: { provider?: string | null; expiresAt?: string | null } = {}) =>
    ({ entitlement: { status, plan: "starter", provider: "revenuecat", storeProductId, ...extra } });
  const offered = (list: typeof plans, s: ReturnType<typeof state>, tiers = true) => mobileOfferedPlans(list, s, controller, tiers).map((p) => p.id);
  // No plan yet, an expired plan, a web plan, or a grant: Starter alone.
  assert.deepEqual(offered(plans, state("none", null)), ["s"]);
  assert.deepEqual(offered(plans, state("expired", MOBILE_REVENUECAT_PRODUCTS.starter_monthly)), ["s"]);
  assert.deepEqual(offered(plans, state("active", "heyhermes_starter_monthly_web")), ["s"]);
  assert.deepEqual(offered(plans, state("active", null, { provider: null })), ["s"]);
  assert.deepEqual(offered(plans, state("active", MOBILE_REVENUECAT_PRODUCTS.starter_monthly, { expiresAt: new Date(Date.now() - 1000).toISOString() })), ["s"]);
  // A running Starter (also in its free month) or Pro bought in this store: every plan, for the change.
  assert.deepEqual(offered(plans, state("trialing", MOBILE_REVENUECAT_PRODUCTS.starter_monthly)), ["s", "p", "m"]);
  assert.deepEqual(offered(plans, state("active", MOBILE_REVENUECAT_PRODUCTS.personal_monthly)), ["s", "p", "m"]);
  // Review of #189: tiers on but no Starter in this store (Android Starter id unset, broken
  // tier offering that fell back to Personal): the first purchase offers nothing, never Pro.
  assert.deepEqual(offered([plans[1]!], state("none", null)), []);
  assert.deepEqual(offered([plans[1]!, plans[2]!], state("none", null)), []);
  // Without tiers (Personal alone) nothing changes.
  assert.deepEqual(offered([plans[1]!], state("none", null), false), ["p"]);
});

test("review of #189: the purchase notice names the plan bought, and Hey Hermes", () => {
  assert.equal(mobilePlanActiveNotice("starter", true), "Personal is active for this Hey Hermes account.");
  assert.equal(mobilePlanActiveNotice("personal", true), "Pro is active for this Hey Hermes account.");
  assert.equal(mobilePlanActiveNotice("max", true), "Max is active for this Hey Hermes account.");
  assert.equal(mobilePlanActiveNotice("personal", false), "Pro is active for this Hey Hermes account.");
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = authUiCopy(locale) as Record<string, string>;
    for (const tier of ["starter", "personal", "max"] as const) for (const tiered of [true, false]) {
      const key = mobilePlanActiveNotice(tier, tiered);
      assert.ok(copy[key], `${locale}: ${key}`);
      if (tier === "starter") assert.doesNotMatch(copy[key]!, /Pro\b|Starter/, locale);
    }
  }
});
