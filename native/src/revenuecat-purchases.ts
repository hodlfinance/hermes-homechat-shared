export const MOBILE_REVENUECAT_OFFERING_ID = "default";

export const MOBILE_REVENUECAT_PRODUCTS = {
  personal_monthly: "app.heyhermes.personal.monthly.v3",
} as const;

export type MobileRevenueCatPackageId = keyof typeof MOBILE_REVENUECAT_PRODUCTS;

export type MobileStorePackage = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod: string | null;
    introPrice: {
      price: number;
      period: string;
      periodUnit: string;
      periodNumberOfUnits: number;
    } | null;
  };
  source: unknown;
};

export type MobileTrialEligibility = "eligible" | "ineligible" | "unknown" | "unavailable";

export type MobileStoreOfferings = {
  current: {
    identifier: string;
    availablePackages: MobileStorePackage[];
  } | null;
};

export type MobileCustomerInfo = {
  activeEntitlements: Array<{
    identifier: string;
    productIdentifier: string;
    expirationAt: string | null;
  }>;
};

export type MobilePurchaseCompletion = {
  accountId: string;
  expirationAt: string | null;
};

export type MobilePurchasesAdapter = {
  isConfigured(): Promise<boolean>;
  configure(input: { apiKey: string; appUserID: string }): void;
  getAppUserID(): Promise<string>;
  logIn(appUserID: string): Promise<unknown>;
  getCustomerInfo(): Promise<MobileCustomerInfo>;
  getOfferings(): Promise<MobileStoreOfferings>;
  checkTrialEligibility(productIdentifiers: string[]): Promise<Record<string, MobileTrialEligibility>>;
  purchasePackage(storePackage: MobileStorePackage): Promise<{
    productIdentifier: string;
    customerInfo: MobileCustomerInfo;
  }>;
  restorePurchases(): Promise<unknown>;
};

export type MobilePurchasePlan = {
  packageId: MobileRevenueCatPackageId;
  productId: (typeof MOBILE_REVENUECAT_PRODUCTS)[MobileRevenueCatPackageId];
  displayName: "Personal";
  title: string;
  description: string;
  priceString: string;
  trialEligibility: MobileTrialEligibility;
};

const planDetails: Record<MobileRevenueCatPackageId, Pick<MobilePurchasePlan, "displayName">> = {
  personal_monthly: { displayName: "Personal" },
};

export function mobilePurchasePlanLabel(plan: string) {
  if (plan === "personal") return "Personal";
  if (plan === "trial") return "Trial";
  return "No mobile plan";
}

function exactAccountId(accountId: string) {
  if (!accountId || accountId !== accountId.trim() || accountId.length > 100 || accountId.includes("/")) {
    throw new Error("The signed-in Hey account ID cannot be used for purchases.");
  }
  return accountId;
}

function isAnonymousRevenueCatId(appUserId: string) {
  return appUserId.startsWith("$RCAnonymousID:");
}

export function mobileCustomerInfoActivePersonalExpirationAt(customerInfo: MobileCustomerInfo, timestamp = Date.now()) {
  return customerInfo.activeEntitlements
    .filter(
      (entitlement) =>
        entitlement.identifier === "hey_hermes_access" &&
        entitlement.productIdentifier === MOBILE_REVENUECAT_PRODUCTS.personal_monthly &&
        Boolean(entitlement.expirationAt) &&
        Date.parse(entitlement.expirationAt!) > timestamp,
    )
    .map((entitlement) => entitlement.expirationAt!)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

export function mobileCustomerInfoHasActivePersonalPurchase(customerInfo: MobileCustomerInfo, timestamp = Date.now()) {
  return mobileCustomerInfoActivePersonalExpirationAt(customerInfo, timestamp) !== null;
}

export function assertProductLocalSubscriptionState<T extends {
  accountId: string;
  entitlement: { accountId: string; revenueCatCustomerId?: string | null };
}>(accountId: string, state: T) {
  const expectedAccountId = exactAccountId(accountId);
  if (
    state.accountId !== expectedAccountId ||
    state.entitlement.accountId !== expectedAccountId ||
    (state.entitlement.revenueCatCustomerId !== null &&
      state.entitlement.revenueCatCustomerId !== undefined &&
      state.entitlement.revenueCatCustomerId !== expectedAccountId)
  ) {
    throw new Error("The server returned subscription state for a different Hey account.");
  }
  return state;
}

export function mobileSubscriptionAuthorityConfirmed<T extends {
  accountId: string;
  entitlement: { accountId: string; status: string; revenueCatCustomerId?: string | null };
  workspaceAccess: { runtimeAccess: string };
  lastWebhookEvent?: {
    accountId: string | null;
    appUserId: string | null;
    environment: string | null;
    status: string;
  } | null;
}>(accountId: string, state: T) {
  const exactState = assertProductLocalSubscriptionState(accountId, state);
  if (["active", "trialing", "grace_period"].includes(exactState.entitlement.status)) return true;
  const evidence = exactState.lastWebhookEvent;
  return (
    exactState.workspaceAccess.runtimeAccess === "enabled" &&
    evidence?.status === "applied" &&
    evidence.environment === "SANDBOX" &&
    evidence.accountId === accountId &&
    evidence.appUserId === accountId
  );
}

export function mobilePersonalPurchaseCanStart<T extends {
  accountId: string;
  entitlement: {
    accountId: string;
    status: string;
    provider?: string | null;
    revenueCatCustomerId?: string | null;
    storeProductId?: string | null;
  };
  workspaceAccess: { runtimeAccess: string };
  lastWebhookEvent?: {
    accountId: string | null;
    appUserId: string | null;
    environment: string | null;
    status: string;
    productId?: string | null;
    entitlementId?: string | null;
    type?: string | null;
    expirationAt?: string | null;
  } | null;
}>(accountId: string, state: T, purchaseCompletion: MobilePurchaseCompletion | null, timestamp = Date.now()) {
  const expectedAccountId = exactAccountId(accountId);
  const exactState = assertProductLocalSubscriptionState(expectedAccountId, state);
  if (
    purchaseCompletion?.accountId === expectedAccountId &&
    (purchaseCompletion.expirationAt === null || Date.parse(purchaseCompletion.expirationAt) > timestamp)
  ) return false;

  const entitlement = exactState.entitlement;
  if (["active", "trialing", "grace_period"].includes(entitlement.status)) return false;

  const evidence = exactState.lastWebhookEvent;
  const exactSandboxEvidence =
    evidence?.status === "applied" &&
    evidence.environment === "SANDBOX" &&
    evidence.accountId === expectedAccountId &&
    evidence.appUserId === expectedAccountId &&
    evidence.productId === MOBILE_REVENUECAT_PRODUCTS.personal_monthly &&
    evidence.entitlementId === "hey_hermes_access" &&
    exactState.workspaceAccess.runtimeAccess === "enabled" &&
    Boolean(evidence.expirationAt) &&
    Date.parse(evidence.expirationAt!) > timestamp &&
    ["INITIAL_PURCHASE", "RENEWAL", "CANCELLATION", "UNCANCELLATION", "PRODUCT_CHANGE", "SUBSCRIPTION_EXTENDED"].includes(
      evidence.type ?? "",
    );
  return !exactSandboxEvidence;
}

export class MobilePurchasesController {
  private epoch = 0;
  private boundAccountId: string | null = null;
  private packages = new Map<MobileRevenueCatPackageId, MobileStorePackage>();
  private sdkQueue: Promise<void> = Promise.resolve();

  constructor(private readonly adapter: MobilePurchasesAdapter) {}

  suspend() {
    this.epoch += 1;
    this.boundAccountId = null;
    this.packages.clear();
  }

  async bindAccount(accountId: string, apiKey: string) {
    const exactId = exactAccountId(accountId);
    if (!apiKey.trim()) throw new Error("RevenueCat is not configured for this iPhone build.");

    const epoch = ++this.epoch;
    this.boundAccountId = null;
    this.packages.clear();

    return this.runExclusive(async () => {
      this.assertEpoch(epoch);
      if (!(await this.adapter.isConfigured())) {
        this.adapter.configure({ apiKey, appUserID: exactId });
      } else {
        const currentId = await this.adapter.getAppUserID();
        this.assertEpoch(epoch);
        if (isAnonymousRevenueCatId(currentId)) {
          throw new Error("RevenueCat was configured with an anonymous identity. Sign in again before purchasing.");
        }
        if (currentId !== exactId) await this.adapter.logIn(exactId);
      }

      this.assertEpoch(epoch);
      const confirmedId = await this.adapter.getAppUserID();
      this.assertEpoch(epoch);
      if (confirmedId !== exactId) throw new Error("RevenueCat did not bind to the signed-in Hey account.");
      this.boundAccountId = exactId;
      const customerInfo = await this.adapter.getCustomerInfo();
      await this.assertBoundAccount(exactId, epoch);
      return { personalPurchaseExpirationAt: mobileCustomerInfoActivePersonalExpirationAt(customerInfo) };
    });
  }

  loadPlans(accountId: string): Promise<MobilePurchasePlan[]> {
    const epoch = this.epoch;
    return this.runExclusive(async () => {
      const exactId = await this.assertBoundAccount(accountId, epoch);
      const offerings = await this.adapter.getOfferings();
      await this.assertBoundAccount(exactId, epoch);

      const current = offerings.current;
      if (!current || current.identifier !== MOBILE_REVENUECAT_OFFERING_ID) {
        throw new Error("The approved Hey Hermes offering is unavailable.");
      }
      if (current.availablePackages.length !== 1) {
        throw new Error("The Hey Hermes offering does not contain exactly Personal.");
      }

      const nextPackages = new Map<MobileRevenueCatPackageId, MobileStorePackage>();
      for (const storePackage of current.availablePackages) {
        if (!(storePackage.identifier in MOBILE_REVENUECAT_PRODUCTS)) {
          throw new Error("The Hey Hermes offering contains an unapproved package.");
        }
        const packageId = storePackage.identifier as MobileRevenueCatPackageId;
        if (nextPackages.has(packageId)) throw new Error("The Hey Hermes offering contains a duplicate package.");
        if (storePackage.product.identifier !== MOBILE_REVENUECAT_PRODUCTS[packageId]) {
          throw new Error("A Hey Hermes package is mapped to the wrong App Store product.");
        }
        // `personal_monthly` is an intentional custom RevenueCat package ID, so
        // the SDK reports PACKAGE_TYPE.CUSTOM. The exact package, App Store
        // product, and StoreKit period above/below are the authoritative gates.
        if (storePackage.product.subscriptionPeriod !== "P1M") {
          throw new Error("The Hey Hermes App Store product is not the approved monthly subscription.");
        }
        nextPackages.set(packageId, storePackage);
      }

      const orderedIds: MobileRevenueCatPackageId[] = ["personal_monthly"];
      if (orderedIds.some((packageId) => !nextPackages.has(packageId))) {
        throw new Error("The Hey Hermes offering is missing an approved package.");
      }
      this.assertEpoch(epoch);
      this.packages = nextPackages;

      let trialEligibilityByProduct: Record<string, MobileTrialEligibility> = {};
      try {
        trialEligibilityByProduct = await this.adapter.checkTrialEligibility(
          orderedIds.map((packageId) => MOBILE_REVENUECAT_PRODUCTS[packageId]),
        );
      } catch {
        // Eligibility must fail honestly to unknown without hiding the monthly plan.
        trialEligibilityByProduct = {};
      }
      await this.assertBoundAccount(exactId, epoch);

      return orderedIds.map((packageId) => {
        const storePackage = nextPackages.get(packageId)!;
        const storeEligibility = trialEligibilityByProduct[storePackage.product.identifier] ?? "unknown";
        const intro = storePackage.product.introPrice;
        const hasApprovedSevenDayTrial = Boolean(
          intro &&
          intro.price === 0 &&
          intro.period === "P7D" &&
          intro.periodUnit === "DAY" &&
          intro.periodNumberOfUnits === 7,
        );
        const trialEligibility: MobileTrialEligibility = storeEligibility === "eligible"
          ? hasApprovedSevenDayTrial ? "eligible" : "unknown"
          : storeEligibility;
        return {
          packageId,
          productId: MOBILE_REVENUECAT_PRODUCTS[packageId],
          displayName: planDetails[packageId].displayName,
          title: storePackage.product.title,
          description: storePackage.product.description,
          priceString: storePackage.product.priceString,
          trialEligibility,
        };
      });
    });
  }

  purchase(
    accountId: string,
    packageId: MobileRevenueCatPackageId,
    onStoreTransactionCompleted: () => void = () => undefined,
  ) {
    const epoch = this.epoch;
    return this.runExclusive(async () => {
      await this.assertBoundAccount(accountId, epoch);
      const storePackage = this.packages.get(packageId);
      if (!storePackage) throw new Error("Reload the approved Hey Hermes plans before purchasing.");

      const result = await this.adapter.purchasePackage(storePackage);
      onStoreTransactionCompleted();
      await this.assertBoundAccount(accountId, epoch);
      if (result.productIdentifier !== MOBILE_REVENUECAT_PRODUCTS[packageId]) {
        throw new Error("The App Store returned a different product than the one selected.");
      }
      const personalPurchaseExpirationAt = mobileCustomerInfoActivePersonalExpirationAt(result.customerInfo);
      if (!personalPurchaseExpirationAt) {
        throw new Error("The App Store purchase finished without exact active Personal authority. Do not purchase again.");
      }
      return { productId: result.productIdentifier, personalPurchaseExpirationAt };
    });
  }

  restore(accountId: string) {
    const epoch = this.epoch;
    return this.runExclusive(async () => {
      await this.assertBoundAccount(accountId, epoch);
      await this.adapter.restorePurchases();
      await this.assertBoundAccount(accountId, epoch);
    });
  }

  private assertEpoch(epoch: number) {
    if (epoch !== this.epoch) throw new Error("The signed-in Hey account changed during the purchase operation.");
  }

  private async assertBoundAccount(accountId: string, epoch: number) {
    const exactId = exactAccountId(accountId);
    this.assertEpoch(epoch);
    if (this.boundAccountId !== exactId) {
      throw new Error("Purchases are not bound to the signed-in Hey account.");
    }
    const currentId = await this.adapter.getAppUserID();
    this.assertEpoch(epoch);
    if (currentId !== exactId) throw new Error("RevenueCat is bound to a different Hey account.");
    return exactId;
  }

  private runExclusive<T>(operation: () => Promise<T>) {
    const result = this.sdkQueue.then(operation);
    this.sdkQueue = result.then(() => undefined, () => undefined);
    return result;
  }
}
