export const MOBILE_REVENUECAT_OFFERING_ID = "default";
/**
 * HPD-1534 (Justus, 2026-10-23): with the plan tiers on, the app sells from the
 * RevenueCat offering `tiers_v1` (packages starter_monthly, personal_monthly and,
 * with Max on, max_monthly). The app reads it only when the server lists the tiers
 * (`webBilling.tiers` of the subscription state); otherwise it sells exactly as
 * before from the current offering with Personal alone.
 */
export const MOBILE_REVENUECAT_TIERS_OFFERING_ID = "tiers_v1";

export const MOBILE_REVENUECAT_PRODUCTS = {
  personal_monthly: "app.heyhermes.personal.monthly.v3",
  starter_monthly: "app.heyhermes.starter.monthly.v1",
  max_monthly: "app.heyhermes.max.monthly.v1",
} as const;

export type MobileRevenueCatPackageId = keyof typeof MOBILE_REVENUECAT_PRODUCTS;
/** HPD-1534: the self-serve plans, cheapest first; the package of each. */
export type MobilePlanTier = "starter" | "personal" | "max";
export const MOBILE_TIER_PACKAGES: Record<MobilePlanTier, MobileRevenueCatPackageId> = {
  starter: "starter_monthly",
  personal: "personal_monthly",
  max: "max_monthly",
};
const TIER_ORDER: readonly MobilePlanTier[] = ["starter", "personal", "max"];
const tierOfPackage = (packageId: MobileRevenueCatPackageId): MobilePlanTier =>
  packageId === "starter_monthly" ? "starter" : packageId === "max_monthly" ? "max" : "personal";

/**
 * HPD-1243: which store this build sells through. The App Store is the default
 * and behaves exactly as before. Google Play differs in three places only:
 * the product id is configured by the host (RevenueCat reports it as
 * `<subscription_id>:<base_plan_id>` in an offering and as the bare
 * subscription id on a purchase and an entitlement), the free week is read
 * from Google's own offer because RevenueCat's eligibility check exists on iOS
 * only, and the errors name the right store.
 */
export type MobilePurchasesStore = "app_store" | "play_store";
export type MobilePurchasesOptions = {
  store?: MobilePurchasesStore;
  /** Required for Google Play, form `<subscription_id>:<base_plan_id>`. Ignored for the App Store. */
  personalMonthlyProductId?: string;
  /** HPD-1534: the Google Play Starter and Max products, same form; empty until configured. */
  starterMonthlyProductId?: string;
  maxMonthlyProductId?: string;
};

/** True when a store-reported product id names the configured product. */
export function mobileStoreProductMatches(reported: string | null | undefined, configured: string, store: MobilePurchasesStore = "app_store") {
  if (!reported || !configured) return false;
  if (reported === configured) return true;
  if (store !== "play_store") return false;
  // Google Play: an offering names `subscription:base-plan`, a purchase and an
  // entitlement name the subscription alone. Only the subscription may be bare.
  const [subscription, basePlan] = configured.split(":");
  return Boolean(basePlan) && reported === subscription;
}

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
  /** HPD-1534: every offering by id (RevenueCat `offerings.all`); absent on older hosts. */
  all?: Record<string, { identifier: string; availablePackages: MobileStorePackage[] }>;
};

/**
 * HPD-1534: a change between plans of the same subscription. On the App Store the
 * plans share one subscription group, so buying the other package is the change
 * (Apple upgrades at once and downgrades at renewal) and nothing extra is passed.
 * Google Play needs the product the subscriber leaves and how to replace it.
 */
export type MobilePlanChange = { oldProductId: string; direction: "upgrade" | "downgrade" };

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
  purchasePackage(storePackage: MobileStorePackage, change?: MobilePlanChange): Promise<{
    productIdentifier: string;
    customerInfo: MobileCustomerInfo;
  }>;
  restorePurchases(): Promise<unknown>;
};

export type MobilePurchasePlan = {
  packageId: MobileRevenueCatPackageId;
  /** HPD-1534: the tier this package sells. */
  plan: MobilePlanTier;
  /** The App Store product id, or the host-configured Google Play one. */
  productId: string;
  displayName: "Personal" | "Starter" | "Max";
  /**
   * HPD-1534: the free days the store offer carries for this buyer as far as it is known
   * (Starter 30, Pro 7 until the switch-on removes it, Max none); 0 = no trial wording.
   */
  trialDays: number;
  title: string;
  description: string;
  priceString: string;
  trialEligibility: MobileTrialEligibility;
};

const planDetails: Record<MobileRevenueCatPackageId, Pick<MobilePurchasePlan, "displayName">> = {
  personal_monthly: { displayName: "Personal" },
  starter_monthly: { displayName: "Starter" },
  max_monthly: { displayName: "Max" },
};

/**
 * HPD-1043: RevenueCat's RECEIPT_ALREADY_IN_USE_ERROR (code "7" in
 * react-native-purchases' PURCHASES_ERROR_CODE). The receipt of this Apple ID
 * belongs to another App User ID and the project's transfer rule did not move
 * it. Matched by code, readable code, or the SDK's own sentence, because the
 * shared package has no direct dependency on the SDK enum.
 */
export function isMobileReceiptAlreadyInUse(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; readableErrorCode?: unknown; userInfo?: { readableErrorCode?: unknown }; message?: unknown };
  if (candidate.code === "7" || candidate.code === 7) return true;
  if (candidate.readableErrorCode === "RECEIPT_ALREADY_IN_USE_ERROR" ||
      candidate.userInfo?.readableErrorCode === "RECEIPT_ALREADY_IN_USE_ERROR") return true;
  return typeof candidate.message === "string" &&
    /already another active subscriber using the same receipt/i.test(candidate.message);
}

export function mobilePurchasePlanLabel(plan: string) {
  if (plan === "personal") return "Personal";
  if (plan === "starter") return "Starter";
  if (plan === "max") return "Max";
  if (plan === "trial") return "Trial";
  return "No mobile plan";
}

function exactAccountId(accountId: string) {
  if (!accountId || accountId !== accountId.trim() || accountId.length > 100 || accountId.includes("/")) {
    throw new Error("The signed-in Hey Hermes account ID cannot be used for purchases.");
  }
  return accountId;
}

function isAnonymousRevenueCatId(appUserId: string) {
  return appUserId.startsWith("$RCAnonymousID:");
}

export function mobileCustomerInfoActivePersonalExpirationAt(
  customerInfo: MobileCustomerInfo,
  timestamp = Date.now(),
  product: { id: string; store: MobilePurchasesStore } = { id: MOBILE_REVENUECAT_PRODUCTS.personal_monthly, store: "app_store" },
) {
  return customerInfo.activeEntitlements
    .filter(
      (entitlement) =>
        entitlement.identifier === "hey_hermes_access" &&
        mobileStoreProductMatches(entitlement.productIdentifier, product.id, product.store) &&
        Boolean(entitlement.expirationAt) &&
        Date.parse(entitlement.expirationAt!) > timestamp,
    )
    .map((entitlement) => entitlement.expirationAt!)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

/** HPD-1534: the latest active expiry over several products (all tiers this build sells). */
export function mobileCustomerInfoActiveExpirationAt(
  customerInfo: MobileCustomerInfo,
  timestamp: number,
  products: ReadonlyArray<{ id: string; store: MobilePurchasesStore }>,
) {
  return products.map((product) => mobileCustomerInfoActivePersonalExpirationAt(customerInfo, timestamp, product))
    .filter((value): value is string => Boolean(value))
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
    throw new Error("The server returned subscription state for a different Hey Hermes account.");
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
}>(
  accountId: string,
  state: T,
  purchaseCompletion: MobilePurchaseCompletion | null,
  timestamp = Date.now(),
  product: { id: string; store: MobilePurchasesStore } = { id: MOBILE_REVENUECAT_PRODUCTS.personal_monthly, store: "app_store" },
) {
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
    mobileStoreProductMatches(evidence.productId, product.id, product.store) &&
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

  private readonly store: MobilePurchasesStore;
  private readonly personalMonthlyProductId: string;
  /** HPD-1534: the product of every tier in this store; an empty id is not configured. */
  private readonly tierProductIds: Record<MobilePlanTier, string>;

  constructor(private readonly adapter: MobilePurchasesAdapter, options: MobilePurchasesOptions = {}) {
    this.store = options.store ?? "app_store";
    this.personalMonthlyProductId = this.store === "play_store"
      ? (options.personalMonthlyProductId ?? "").trim()
      : MOBILE_REVENUECAT_PRODUCTS.personal_monthly;
    this.tierProductIds = this.store === "play_store"
      ? { starter: (options.starterMonthlyProductId ?? "").trim(), personal: this.personalMonthlyProductId, max: (options.maxMonthlyProductId ?? "").trim() }
      : { starter: MOBILE_REVENUECAT_PRODUCTS.starter_monthly, personal: MOBILE_REVENUECAT_PRODUCTS.personal_monthly, max: MOBILE_REVENUECAT_PRODUCTS.max_monthly };
  }

  /** HPD-1534: the product of a tier in this store, with the store; empty id = not configured. */
  tierProduct(tier: MobilePlanTier): { id: string; store: MobilePurchasesStore } {
    return { id: this.tierProductIds[tier], store: this.store };
  }

  /** HPD-1534: every configured tier product, for "does this buyer already hold one?". */
  private get knownProducts() {
    return TIER_ORDER.map((tier) => this.tierProduct(tier)).filter((product) => Boolean(product.id));
  }

  /** HPD-1534: which tier a store-reported product id is, or null. */
  tierOfProduct(productId: string | null | undefined): MobilePlanTier | null {
    return TIER_ORDER.find((tier) => this.tierProductIds[tier] && mobileStoreProductMatches(productId, this.tierProductIds[tier], this.store)) ?? null;
  }

  /** The product this build may sell, with its store. Empty id: Google Play is not configured. */
  get personalProduct(): { id: string; store: MobilePurchasesStore } {
    return { id: this.personalMonthlyProductId, store: this.store };
  }

  private get storeName() {
    return this.store === "play_store" ? "Google Play" : "App Store";
  }

  suspend() {
    this.epoch += 1;
    this.boundAccountId = null;
    this.packages.clear();
  }

  async bindAccount(accountId: string, apiKey: string) {
    const exactId = exactAccountId(accountId);
    if (!apiKey.trim()) {
      throw new Error(this.store === "play_store"
        ? "RevenueCat is not configured for this Android build."
        : "RevenueCat is not configured for this iPhone build.");
    }
    if (!this.personalMonthlyProductId) throw new Error("The Google Play product is not configured for this Android build.");

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
      if (confirmedId !== exactId) throw new Error("RevenueCat did not bind to the signed-in Hey Hermes account.");
      this.boundAccountId = exactId;
      const customerInfo = await this.adapter.getCustomerInfo();
      await this.assertBoundAccount(exactId, epoch);
      // HPD-1534: a Starter or Max subscription counts as this buyer's purchase too.
      return { personalPurchaseExpirationAt: mobileCustomerInfoActiveExpirationAt(customerInfo, Date.now(), this.knownProducts) };
    });
  }

  /**
   * The plans to sell. Without `tiers` (the server lists none: switch off, older server)
   * exactly as before: the current offering with Personal alone. With `tiers` (HPD-1534):
   * the `tiers_v1` offering, the listed tiers in their order, each package mapped to this
   * store's configured product; a tier whose product is not configured in this build is
   * left out, an unknown package refuses the whole offering.
   */
  loadPlans(accountId: string, input: { tiers?: readonly MobilePlanTier[] } = {}): Promise<MobilePurchasePlan[]> {
    const epoch = this.epoch;
    const tiers = (input.tiers ?? []).filter((tier, index, list) => TIER_ORDER.includes(tier) && list.indexOf(tier) === index);
    // Review of #185: a missing or broken tier offering never leaves the paywall empty;
    // the app then sells Personal from the current offering as before.
    if (tiers.length > 0) return this.loadTierPlans(accountId, epoch, tiers).catch(() => this.loadPlans(accountId));
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
        if (storePackage.product.identifier !== this.personalMonthlyProductId) {
          throw new Error(`A Hey Hermes package is mapped to the wrong ${this.storeName} product.`);
        }
        // `personal_monthly` is an intentional custom RevenueCat package ID, so
        // the SDK reports PACKAGE_TYPE.CUSTOM. The exact package, App Store
        // product, and StoreKit period above/below are the authoritative gates.
        if (storePackage.product.subscriptionPeriod !== "P1M") {
          throw new Error(`The Hey Hermes ${this.storeName} product is not the approved monthly subscription.`);
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
      // HPD-1243: RevenueCat's eligibility check exists on iOS only. Google
      // Play decides by the offer it returns for this buyer (below).
      if (this.store === "app_store") {
        try {
          trialEligibilityByProduct = await this.adapter.checkTrialEligibility(
            orderedIds.map((packageId) => MOBILE_REVENUECAT_PRODUCTS[packageId]),
          );
        } catch {
          // Eligibility must fail honestly to unknown without hiding the monthly plan.
          trialEligibilityByProduct = {};
        }
        await this.assertBoundAccount(exactId, epoch);
      }

      return orderedIds.map((packageId) => {
        const storePackage = nextPackages.get(packageId)!;
        const storeEligibility = trialEligibilityByProduct[storePackage.product.identifier] ?? "unknown";
        const intro = storePackage.product.introPrice;
        const sevenDays = Boolean(intro && intro.period === "P7D" && intro.periodUnit === "DAY" && intro.periodNumberOfUnits === 7);
        // Google Play may state the same seven days as one week.
        const oneWeek = Boolean(this.store === "play_store" && intro && intro.period === "P1W" && intro.periodUnit === "WEEK" && intro.periodNumberOfUnits === 1);
        const hasApprovedSevenDayTrial = Boolean(intro && intro.price === 0 && (sevenDays || oneWeek));
        // Google Play returns a free phase only to a buyer it will give it to,
        // so its presence is the eligibility. Any other intro offer (a paid
        // one, another length) promises nothing: unknown, the sheet decides.
        const trialEligibility: MobileTrialEligibility = this.store === "play_store"
          ? hasApprovedSevenDayTrial ? "eligible" : intro ? "unknown" : "ineligible"
          : storeEligibility === "eligible"
            ? hasApprovedSevenDayTrial ? "eligible" : "unknown"
            : storeEligibility;
        return {
          packageId,
          plan: "personal" as const,
          productId: this.personalMonthlyProductId,
          displayName: planDetails[packageId].displayName,
          trialDays: hasApprovedSevenDayTrial && trialEligibility !== "ineligible" && trialEligibility !== "unavailable" ? 7 : 0,
          title: storePackage.product.title,
          description: storePackage.product.description,
          priceString: storePackage.product.priceString,
          trialEligibility,
        };
      });
    });
  }

  private loadTierPlans(accountId: string, epoch: number, tiers: readonly MobilePlanTier[]): Promise<MobilePurchasePlan[]> {
    return this.runExclusive(async () => {
      const exactId = await this.assertBoundAccount(accountId, epoch);
      const offerings = await this.adapter.getOfferings();
      await this.assertBoundAccount(exactId, epoch);
      const offering = offerings.all?.[MOBILE_REVENUECAT_TIERS_OFFERING_ID];
      if (!offering || offering.identifier !== MOBILE_REVENUECAT_TIERS_OFFERING_ID) {
        throw new Error("The approved Hey Hermes plans are unavailable.");
      }
      const nextPackages = new Map<MobileRevenueCatPackageId, MobileStorePackage>();
      for (const storePackage of offering.availablePackages) {
        if (!(storePackage.identifier in MOBILE_REVENUECAT_PRODUCTS)) throw new Error("The Hey Hermes offering contains an unapproved package.");
        const packageId = storePackage.identifier as MobileRevenueCatPackageId;
        if (nextPackages.has(packageId)) throw new Error("The Hey Hermes offering contains a duplicate package.");
        const tier = tierOfPackage(packageId);
        if (!tiers.includes(tier) || !this.tierProductIds[tier]) continue;
        if (storePackage.product.identifier !== this.tierProductIds[tier]) throw new Error(`A Hey Hermes package is mapped to the wrong ${this.storeName} product.`);
        if (storePackage.product.subscriptionPeriod !== "P1M") throw new Error(`The Hey Hermes ${this.storeName} product is not the approved monthly subscription.`);
        nextPackages.set(packageId, storePackage);
      }
      const ordered = tiers.map((tier) => MOBILE_TIER_PACKAGES[tier]).filter((packageId) => nextPackages.has(packageId));
      // Personal is the plan every build sells; without it nothing is offered.
      if (!ordered.includes("personal_monthly")) throw new Error("The Hey Hermes offering is missing an approved package.");
      this.assertEpoch(epoch);
      this.packages = nextPackages;

      let eligibility: Record<string, MobileTrialEligibility> = {};
      if (this.store === "app_store") {
        try { eligibility = await this.adapter.checkTrialEligibility(ordered.map((packageId) => nextPackages.get(packageId)!.product.identifier)); }
        catch { eligibility = {}; }
        await this.assertBoundAccount(exactId, epoch);
      }
      return ordered.map((packageId) => {
        const storePackage = nextPackages.get(packageId)!;
        const tier = tierOfPackage(packageId);
        const offeredDays = freeTrialDays(storePackage.product.introPrice);
        // HPD-1534: only Starter has a decided trial (30 days); Pro keeps its 7 until the
        // switch-on removes the store offer; Max has none. Any other free phase promises
        // nothing (unknown: the store sheet decides).
        const decided = tier === "starter" ? offeredDays === 30 : tier === "personal" ? offeredDays === 7 : false;
        const storeEligibility = eligibility[storePackage.product.identifier] ?? "unknown";
        const trialEligibility: MobileTrialEligibility = offeredDays === 0 ? "unavailable"
          : this.store === "play_store" ? (decided ? "eligible" : "unknown")
            : storeEligibility === "eligible" ? (decided ? "eligible" : "unknown") : storeEligibility;
        return {
          packageId,
          plan: tier,
          productId: storePackage.product.identifier,
          displayName: planDetails[packageId].displayName,
          trialDays: decided && trialEligibility !== "ineligible" && trialEligibility !== "unavailable" ? offeredDays : 0,
          title: storePackage.product.title,
          description: storePackage.product.description,
          priceString: storePackage.product.priceString,
          trialEligibility,
        };
      });
    });
  }

  /**
   * Buy a package. `currentProductId` (HPD-1534) is the plan this buyer holds in this
   * store when changing plans: Google Play then replaces it (an upgrade at once with the
   * price difference, a downgrade at renewal); the App Store does it by group level.
   */
  purchase(
    accountId: string,
    packageId: MobileRevenueCatPackageId,
    onStoreTransactionCompleted: () => void = () => undefined,
    options: { currentProductId?: string | null } = {},
  ) {
    const epoch = this.epoch;
    return this.runExclusive(async () => {
      await this.assertBoundAccount(accountId, epoch);
      const storePackage = this.packages.get(packageId);
      if (!storePackage) throw new Error("Reload the approved Hey Hermes plans before purchasing.");
      const target = this.tierProduct(tierOfPackage(packageId));
      const currentTier = this.tierOfProduct(options.currentProductId);
      const targetTier = tierOfPackage(packageId);
      // The direction holds in both stores; only Google Play is told about the change.
      const direction = currentTier && currentTier !== targetTier
        ? (TIER_ORDER.indexOf(targetTier) > TIER_ORDER.indexOf(currentTier) ? "upgrade" as const : "downgrade" as const)
        : null;
      const change: MobilePlanChange | undefined = this.store === "play_store" && currentTier && direction
        ? { oldProductId: this.tierProductIds[currentTier], direction }
        : undefined;

      const result = await this.adapter.purchasePackage(storePackage, change);
      onStoreTransactionCompleted();
      await this.assertBoundAccount(accountId, epoch);
      // A downgrade starts at renewal; the store may report the product the buyer keeps
      // until then, or none. The active-entitlement check below still decides.
      const downgrade = direction === "downgrade" && currentTier;
      const reportedOk = mobileStoreProductMatches(result.productIdentifier, target.id, this.store) ||
        (downgrade && (!result.productIdentifier || mobileStoreProductMatches(result.productIdentifier, this.tierProductIds[currentTier!], this.store)));
      if (!reportedOk) {
        throw new Error(`${this.store === "play_store" ? "Google Play" : "The App Store"} returned a different product than the one selected.`);
      }
      // A downgrade starts at renewal: until then the current plan stays the active one.
      const personalPurchaseExpirationAt = mobileCustomerInfoActiveExpirationAt(result.customerInfo, Date.now(),
        downgrade ? [this.tierProduct(currentTier!), target] : [target]);
      if (!personalPurchaseExpirationAt) {
        throw new Error(`The ${this.storeName} purchase finished without exact active Personal authority. Do not purchase again.`);
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
    if (epoch !== this.epoch) throw new Error("The signed-in Hey Hermes account changed during the purchase operation.");
  }

  private async assertBoundAccount(accountId: string, epoch: number) {
    const exactId = exactAccountId(accountId);
    this.assertEpoch(epoch);
    if (this.boundAccountId !== exactId) {
      throw new Error("Purchases are not bound to the signed-in Hey Hermes account.");
    }
    const currentId = await this.adapter.getAppUserID();
    this.assertEpoch(epoch);
    if (currentId !== exactId) throw new Error("RevenueCat is bound to a different Hey Hermes account.");
    return exactId;
  }

  private runExclusive<T>(operation: () => Promise<T>) {
    const result = this.sdkQueue.then(operation);
    this.sdkQueue = result.then(() => undefined, () => undefined);
    return result;
  }
}

/** HPD-1534: the free days of a store intro offer (price 0), or 0 when it is not free. */
function freeTrialDays(intro: MobileStorePackage["product"]["introPrice"]): number {
  if (!intro || intro.price !== 0) return 0;
  const units = intro.periodNumberOfUnits;
  if (intro.periodUnit === "DAY") return units;
  if (intro.periodUnit === "WEEK") return units * 7;
  // A one-month free phase is the 30 days the copy promises (RevenueCat and Google
  // state Starter's trial as one month).
  if (intro.periodUnit === "MONTH") return units === 1 ? 30 : units * 30;
  return 0;
}

/**
 * HPD-1534: may this buyer change to `target` in this store now? Only a running paid
 * plan of another tier bought in this same store (a web or other-store subscription
 * changes where it was bought); the target must differ from the current tier.
 */
export function mobilePlanChangeCanStart(
  state: { entitlement: { status: string; plan: string; storeProductId?: string | null; provider?: string | null; expiresAt?: string | null } },
  controller: Pick<MobilePurchasesController, "tierOfProduct">,
  target: MobilePlanTier,
  timestamp = Date.now(),
  /**
   * Review of #185: a purchase or change finished in this session and not yet in the
   * server's state (a downgrade stays invisible until the renewal) blocks another one.
   */
  purchaseCompletion: { accountId: string } | null = null,
): { currentProductId: string } | null {
  if (purchaseCompletion) return null;
  const entitlement = state.entitlement;
  if (entitlement.provider !== "revenuecat" || !["active", "trialing", "grace_period"].includes(entitlement.status)) return null;
  if (entitlement.expiresAt && Date.parse(entitlement.expiresAt) <= timestamp) return null;
  const current = controller.tierOfProduct(entitlement.storeProductId);
  if (!current || current === target || !entitlement.storeProductId) return null;
  return { currentProductId: entitlement.storeProductId };
}

/**
 * HPD-1534: the tiers the server lists for this account (`webBilling.tiers` of the
 * subscription state), in order, or none: then the app sells Personal exactly as before.
 * The server sends the list only while HEY_PLAN_TIERS_ENABLED is on and RevenueCat
 * confirmed the plans.
 */
export function mobileServerPlanTiers(state: unknown): MobilePlanTier[] {
  const billing = state && typeof state === "object" ? (state as { webBilling?: { tiers?: unknown } }).webBilling : undefined;
  const tiers = billing && Array.isArray(billing.tiers) ? billing.tiers : [];
  const plans = tiers.map((tier) => (tier && typeof tier === "object" ? (tier as { plan?: unknown }).plan : null));
  return plans.every((plan) => plan === "starter" || plan === "personal" || plan === "max") && plans.includes("personal")
    ? plans as MobilePlanTier[] : [];
}
