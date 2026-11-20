// HPD-2216: the paywall suspends the purchase binding while a plan load is still running
// (account switch / sign-out). The load must fail with "account changed", which the app
// keeps out of the paywall alarm, and must not fall back into a second load that fails
// with "not bound". Synthetic store packages only.
import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_REVENUECAT_PRODUCTS,
  MobilePurchasesController,
  type MobilePurchasesAdapter,
  type MobileStorePackage,
} from "../src/revenuecat-purchases";

function pkg(identifier: string, productId: string): MobileStorePackage {
  return { identifier, packageType: "CUSTOM", source: { identifier },
    product: { identifier: productId, title: identifier, description: "", price: 0, priceString: "$12.99", currencyCode: "USD", subscriptionPeriod: "P1M", introPrice: null } };
}
const packages = [
  pkg("starter_monthly", MOBILE_REVENUECAT_PRODUCTS.starter_monthly),
  pkg("personal_monthly", MOBILE_REVENUECAT_PRODUCTS.personal_monthly),
];

function adapter(onOfferings: () => void) {
  let offeringCalls = 0;
  const value: MobilePurchasesAdapter = {
    isConfigured: async () => true, configure: () => undefined, getAppUserID: async () => "acct_1", logIn: async () => undefined,
    getCustomerInfo: async () => ({ activeEntitlements: [] }),
    getOfferings: async () => {
      offeringCalls += 1;
      onOfferings();
      return { current: { identifier: "default", availablePackages: [packages[1]!] }, all: { tiers_v1: { identifier: "tiers_v1", availablePackages: packages } } };
    },
    checkTrialEligibility: async (ids) => Object.fromEntries(ids.map((id) => [id, "eligible" as const])),
    purchasePackage: async () => { throw new Error("not used"); },
    restorePurchases: async () => undefined,
  };
  return { value, calls: () => offeringCalls };
}

for (const tiers of [["starter", "personal"] as const, [] as const]) {
  test(`binding suspended while a ${tiers.length ? "tier" : "Personal"} load runs: fails as "account changed", never "not bound"`, async () => {
    let controller!: MobilePurchasesController;
    const { value, calls } = adapter(() => controller.suspend());
    controller = new MobilePurchasesController(value);
    await controller.bindAccount("acct_1", "key");
    await assert.rejects(controller.loadPlans("acct_1", { tiers }), (error: Error) => {
      assert.match(error.message, /account changed/);
      assert.doesNotMatch(error.message, /not bound|bound to a different/);
      return true;
    });
    assert.equal(calls(), 1, "no second store load after the account changed");
  });
}

test("a broken tier offering without an account change still falls back to Personal", async () => {
  const { value } = adapter(() => undefined);
  const broken: MobilePurchasesAdapter = { ...value, getOfferings: async () => ({
    current: { identifier: "default", availablePackages: [packages[1]!] },
    all: { tiers_v1: { identifier: "tiers_v1", availablePackages: [...packages, pkg("annual", "x")] } },
  }) };
  const controller = new MobilePurchasesController(broken);
  await controller.bindAccount("acct_1", "key");
  const plans = await controller.loadPlans("acct_1", { tiers: ["starter", "personal"] });
  assert.deepEqual(plans.map((plan) => plan.packageId), ["personal_monthly"]);
});
