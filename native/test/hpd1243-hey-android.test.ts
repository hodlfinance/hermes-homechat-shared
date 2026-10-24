import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { accountPageCopy, appLocales, personalAccessPresentation, personalAccessStore, type Entitlement } from "../core/index";
import {
  ANDROID_PLAY_SUBSCRIPTIONS_URL,
  heySignInSurface,
  heyStorePlatform,
  heyStoreWordedView,
  heyStoreWording,
} from "../src/hey-store-platform";
import {
  heyPaywallOfferCopy,
  IOS_APP_STORE_SUBSCRIPTIONS_URL,
  iosPaywallCopy,
  iosPaywallView,
  iosPaywallWaitlistCopy,
} from "../src/ios-paywall";
import {
  MOBILE_REVENUECAT_PRODUCTS,
  MobilePurchasesController,
  mobileCustomerInfoActivePersonalExpirationAt,
  mobilePersonalPurchaseCanStart,
  mobileStoreProductMatches,
  type MobilePurchasePlan,
  type MobilePurchasesAdapter,
  type MobileStorePackage,
} from "../src/revenuecat-purchases";
import { staticUiMessage } from "../src/static-ui-copy";
import { mobileText } from "../src/appI18n";

/**
 * HPD-1243: Hey Hermes on Android. One switch (the host's
 * policy.heyAndroidLaunchEnabled) opens the paywall, the RevenueCat binding,
 * Google sign-in and the sales status for Android. Off, Android is what it was;
 * iOS is the same with the switch on or off.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const appleWords = /Apple|App.?Store|iPhone|iPad|iTunes/i;

// The purchase notices the surface sets in English and translates when it draws them.
const purchaseNotices = [
  "App Store purchases are not configured in this build.",
  "App Store plans are unavailable.",
  "The App Store purchase finished. Access will appear after server confirmation.",
  "The App Store purchase finished, but server confirmation is still pending. Do not purchase again.",
  "Your App Store purchase is restored for this Hey Hermes account.",
  "Restore finished. The server found no active App Store access for this Hey Hermes account.",
  "App Store purchases could not be restored.",
  "Check App Store subscriptions before trying again.",
];

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function everyPurchaseText(locale: (typeof appLocales)[number]) {
  return [
    ...strings(iosPaywallCopy(locale)),
    ...strings(heyPaywallOfferCopy(locale)),
    ...strings(iosPaywallWaitlistCopy(locale)),
    ...purchaseNotices.map((notice) => staticUiMessage(locale, notice)),
  ];
}

test("the switch: off keeps Android on the email link with the surface it sent before; on opens the store", () => {
  for (const enabled of [undefined, false, true]) {
    assert.equal(heyStorePlatform("ios", enabled), "ios", "iOS never reads the switch");
    assert.equal(heySignInSurface("ios", enabled), "ios");
    assert.equal(heyStorePlatform("web", enabled), null);
    assert.equal(heySignInSurface("web", enabled), "ios", "the web export of the native app keeps what it sent");
  }
  assert.equal(heyStorePlatform("android", undefined), null);
  assert.equal(heyStorePlatform("android", false), null);
  assert.equal(heySignInSurface("android", false), "ios", "off: the email link is asked for exactly as before");
  assert.equal(heyStorePlatform("android", true), "android");
  assert.equal(heySignInSurface("android", true), "android");
  // Only the literal true opens it.
  assert.equal(heyStorePlatform("android", "true" as unknown as boolean), null);
});

test("iOS wording is the identity for every purchase text in every language", () => {
  for (const locale of appLocales) {
    for (const text of everyPurchaseText(locale)) {
      assert.equal(heyStoreWording(text, locale, "ios"), text);
    }
  }
  const view = iosPaywallView({ locale: "en", plan: null, comped: true, entitlementStatus: "none", runtimeAccess: "enabled" });
  assert.equal(heyStoreWordedView(view, "en", "ios"), view, "the very same object");
});

test("Android wording names Google Play in every purchase text of every language and cuts nothing", () => {
  let reworded = 0;
  for (const locale of appLocales) {
    for (const text of everyPurchaseText(locale)) {
      const android = heyStoreWording(text, locale, "android");
      assert.doesNotMatch(android, appleWords, `${locale}: ${android}`);
      if (appleWords.test(text)) {
        reworded += 1;
        assert.match(android, /Google|Android/, `${locale}: ${android}`);
        // Nothing is cut: the sentence keeps its length apart from the names.
        assert.ok(android.length >= text.length - 12, `${locale}: ${text} -> ${android}`);
      } else {
        assert.equal(android, text, `${locale}: a text without a store name is untouched`);
      }
      assert.equal((android.match(/\{price\}/g) ?? []).length, (text.match(/\{price\}/g) ?? []).length);
    }
  }
  assert.ok(reworded >= 8 * 15, `expected the Apple-worded texts of eight languages, saw ${reworded}`);
});

test("Android wording, English and German, read as sentences", () => {
  const en = iosPaywallCopy("en");
  assert.equal(heyStoreWording(en.monthlyAccess, "en", "android"), "One monthly Android subscription. No annual plan.");
  assert.equal(heyStoreWording(en.loadingPrice, "en", "android"), "Checking the Google Play price...");
  assert.equal(heyStoreWording(en.receiptInUse, "en", "android"),
    "This Google account's subscription already belongs to another Hey Hermes account. Sign in with the Hey Hermes account that bought it, or contact Hey Hermes Support.");
  assert.equal(heyStoreWording(en.eligibleTrial, "en", "android"), "Google Play confirms you are eligible: 7 days free, then {price}/month.");
  assert.equal(heyStoreWording(en.renewal, "en", "android"),
    "The subscription renews monthly at Google Play's displayed price until cancelled in Google Play subscriptions.");
  assert.equal(heyStoreWording(en.complimentaryOverlap, "en", "android"),
    "Complimentary access is separate. Starting a Google Play trial or subscription can overlap with it; time does not stack.");
  assert.equal(heyStoreWording(heyPaywallOfferCopy("en").trialTerms, "en", "android"),
    "7 days free, then {price}/month. Renews automatically each month until you cancel in your Google Play subscriptions at least 24 hours before the period ends.");
  const de = iosPaywallCopy("de");
  assert.equal(heyStoreWording(de.receiptInUse, "de", "android"),
    "Das Abo dieses Google-Kontos gehört bereits zu einem anderen Hey-Hermes-Konto. Melde dich mit dem Hey-Hermes-Konto an, mit dem es gekauft wurde, oder wende dich an den Hey-Hermes-Support.");
  assert.equal(heyStoreWording(de.renewal, "de", "android"),
    "Das Abo verlängert sich monatlich zum von Google Play angezeigten Preis, bis du es in den Google-Play-Abos kündigst.");
});

function plan(trialEligibility: MobilePurchasePlan["trialEligibility"]): MobilePurchasePlan {
  return {
    packageId: "personal_monthly", plan: "personal", productId: "hey_personal:monthly", displayName: "Personal", trialDays: trialEligibility === "eligible" ? 7 : 0,
    title: "Hey Hermes Personal", description: "", priceString: "$29.00", trialEligibility,
  };
}

test("the Android paywall states price, period, trial length, what follows and how to cancel before the button", () => {
  for (const locale of appLocales) {
    const view = heyStoreWordedView(iosPaywallView({
      locale, plan: plan("eligible"), comped: false, entitlementStatus: "none", runtimeAccess: "enabled", storeState: "ready",
    }), locale, "android");
    assert.equal(view.offer.kind, "trial");
    assert.match(view.offer.termsText, /7/, `${locale}: the trial length`);
    assert.match(view.offer.termsText, /\$29\.00/, `${locale}: the price after the trial`);
    assert.match(view.offer.termsText, /Google.Play/, `${locale}: where to cancel`);
    assert.doesNotMatch(JSON.stringify(view), appleWords, locale);
    assert.equal(view.actions.manageUrl, ANDROID_PLAY_SUBSCRIPTIONS_URL);
    assert.deepEqual(view.legalLinks.map((link) => link.url), iosPaywallView({
      locale, plan: null, comped: false, entitlementStatus: "none", runtimeAccess: "enabled",
    }).legalLinks.map((link) => link.url), "the legal links are not touched");
  }
  // No free week from Google: the plan and its price, no promise.
  const subscribe = heyStoreWordedView(iosPaywallView({
    locale: "en", plan: plan("ineligible"), comped: false, entitlementStatus: "none", runtimeAccess: "enabled", storeState: "ready",
  }), "en", "android");
  assert.equal(subscribe.offer.kind, "subscribe");
  assert.doesNotMatch(subscribe.offer.termsText, /7 days free/);
  assert.match(subscribe.offer.termsText, /^\$29\.00\/month\. Renews automatically each month until you cancel in your Google Play subscriptions/);
  // The iOS view of the same input still names the App Store and its own link.
  const ios = iosPaywallView({ locale: "en", plan: plan("eligible"), comped: false, entitlementStatus: "none", runtimeAccess: "enabled", storeState: "ready" });
  assert.match(ios.offer.termsText, /App Store settings/);
  assert.equal(ios.actions.manageUrl, IOS_APP_STORE_SUBSCRIPTIONS_URL);
});

const playProduct = "hey_personal:monthly";
const future = new Date(Date.now() + 86_400_000).toISOString();

function playAdapter(overrides: {
  appUserId?: string;
  intro?: MobileStorePackage["product"]["introPrice"];
  offeredProduct?: string;
  purchasedProduct?: string;
  entitledProduct?: string;
} = {}) {
  const calls: string[] = [];
  let appUserId = overrides.appUserId ?? "";
  let configured = Boolean(overrides.appUserId);
  const customerInfo = () => ({
    activeEntitlements: overrides.entitledProduct
      ? [{ identifier: "hey_hermes_access", productIdentifier: overrides.entitledProduct, expirationAt: future }]
      : [],
  });
  const adapter: MobilePurchasesAdapter = {
    isConfigured: async () => configured,
    configure: (input) => { calls.push(`configure:${input.appUserID}`); configured = true; appUserId = input.appUserID; },
    getAppUserID: async () => appUserId,
    logIn: async (id) => { calls.push(`logIn:${id}`); appUserId = id; },
    getCustomerInfo: async () => customerInfo(),
    getOfferings: async () => ({
      current: {
        identifier: "default",
        availablePackages: [{
          identifier: "personal_monthly", packageType: "CUSTOM", source: {},
          product: {
            identifier: overrides.offeredProduct ?? playProduct, title: "Hey Hermes Personal", description: "",
            price: 29, priceString: "$29.00", currencyCode: "USD", subscriptionPeriod: "P1M",
            introPrice: overrides.intro === undefined ? { price: 0, period: "P1W", periodUnit: "WEEK", periodNumberOfUnits: 1 } : overrides.intro,
          },
        }],
      },
    }),
    checkTrialEligibility: async () => { calls.push("checkTrialEligibility"); return {}; },
    purchasePackage: async () => {
      calls.push("purchase");
      return { productIdentifier: overrides.purchasedProduct ?? "hey_personal", customerInfo: customerInfo() };
    },
    restorePurchases: async () => { calls.push("restore"); },
  };
  return { adapter, calls };
}

function playController(overrides: Parameters<typeof playAdapter>[0] = {}, productId = playProduct) {
  const fake = playAdapter(overrides);
  return { ...fake, controller: new MobilePurchasesController(fake.adapter, { store: "play_store", personalMonthlyProductId: productId }) };
}

test("Google Play: RevenueCat is bound to the Hey account before any plan is read or bought", async () => {
  const { controller, calls } = playController({ entitledProduct: "hey_personal" });
  // Nothing is sold to an unbound controller: an anonymous purchase gets access but no server.
  await assert.rejects(controller.loadPlans("acct_1"), /not bound to the signed-in Hey Hermes account/);
  await assert.rejects(controller.purchase("acct_1", "personal_monthly"), /not bound to the signed-in Hey Hermes account/);
  assert.equal(calls.length, 0);
  await controller.bindAccount("acct_1", "goog_key");
  assert.equal(calls.join(","), "configure:acct_1", "configured with the Hey account id, never anonymously");
  const plans = await controller.loadPlans("acct_1");
  assert.equal(plans[0]?.productId, playProduct);
  const bought = await controller.purchase("acct_1", "personal_monthly");
  assert.equal(bought.productId, "hey_personal");
  assert.equal(bought.personalPurchaseExpirationAt, future);
  assert.ok(!calls.includes("checkTrialEligibility"), "RevenueCat's eligibility check is iOS only and is not asked");
});

test("Google Play: an SDK that was configured anonymously is refused, and an unconfigured build sells nothing", async () => {
  const anonymous = playController({ appUserId: "$RCAnonymousID:abc" });
  await assert.rejects(anonymous.controller.bindAccount("acct_1", "goog_key"), /anonymous identity/);
  const noProduct = playController({}, "");
  await assert.rejects(noProduct.controller.bindAccount("acct_1", "goog_key"), /Google Play product is not configured/);
  const noKey = playController();
  await assert.rejects(noKey.controller.bindAccount("acct_1", " "), /not configured for this Android build/);
});

test("Google Play: the free week is read from Google's own offer", async () => {
  const cases: Array<[MobileStorePackage["product"]["introPrice"], MobilePurchasePlan["trialEligibility"]]> = [
    [{ price: 0, period: "P1W", periodUnit: "WEEK", periodNumberOfUnits: 1 }, "eligible"],
    [{ price: 0, period: "P7D", periodUnit: "DAY", periodNumberOfUnits: 7 }, "eligible"],
    [null, "ineligible"],
    [{ price: 0, period: "P3D", periodUnit: "DAY", periodNumberOfUnits: 3 }, "unknown"],
    [{ price: 9, period: "P1W", periodUnit: "WEEK", periodNumberOfUnits: 1 }, "unknown"],
  ];
  for (const [intro, expected] of cases) {
    const { controller } = playController({ intro });
    await controller.bindAccount("acct_1", "goog_key");
    assert.equal((await controller.loadPlans("acct_1"))[0]?.trialEligibility, expected, JSON.stringify(intro));
  }
});

test("Google Play: only the configured product is sold, and the App Store product is not accepted for it", async () => {
  const wrongOffer = playController({ offeredProduct: MOBILE_REVENUECAT_PRODUCTS.personal_monthly });
  await wrongOffer.controller.bindAccount("acct_1", "goog_key");
  await assert.rejects(wrongOffer.controller.loadPlans("acct_1"), /wrong Google Play product/);
  const wrongPurchase = playController({ purchasedProduct: "another_product", entitledProduct: "hey_personal" });
  await wrongPurchase.controller.bindAccount("acct_1", "goog_key");
  await wrongPurchase.controller.loadPlans("acct_1");
  await assert.rejects(wrongPurchase.controller.purchase("acct_1", "personal_monthly"), /Google Play returned a different product/);

  assert.equal(mobileStoreProductMatches("hey_personal:monthly", playProduct, "play_store"), true);
  assert.equal(mobileStoreProductMatches("hey_personal", playProduct, "play_store"), true, "a purchase names the subscription alone");
  assert.equal(mobileStoreProductMatches("hey_personal:yearly", playProduct, "play_store"), false);
  assert.equal(mobileStoreProductMatches("monthly", playProduct, "play_store"), false);
  assert.equal(mobileStoreProductMatches("hey_personal", "hey_personal:monthly", "app_store"), false, "the App Store compares exactly");
  assert.equal(mobileStoreProductMatches("", "", "play_store"), false);
});

test("the App Store controller is unchanged: its product, its eligibility check, its words", async () => {
  const fake = playAdapter({
    offeredProduct: MOBILE_REVENUECAT_PRODUCTS.personal_monthly,
    purchasedProduct: MOBILE_REVENUECAT_PRODUCTS.personal_monthly,
    entitledProduct: MOBILE_REVENUECAT_PRODUCTS.personal_monthly,
    intro: { price: 0, period: "P7D", periodUnit: "DAY", periodNumberOfUnits: 7 },
  });
  fake.adapter.checkTrialEligibility = async (ids) => {
    fake.calls.push(`checkTrialEligibility:${ids.join(",")}`);
    return { [MOBILE_REVENUECAT_PRODUCTS.personal_monthly]: "eligible" };
  };
  const controller = new MobilePurchasesController(fake.adapter);
  assert.deepEqual(controller.personalProduct, { id: "app.heyhermes.personal.monthly.v3", store: "app_store" });
  await assert.rejects(controller.bindAccount("acct_1", ""), /RevenueCat is not configured for this iPhone build\./);
  await controller.bindAccount("acct_1", "appl_key");
  const plans = await controller.loadPlans("acct_1");
  assert.deepEqual(plans, [{
    packageId: "personal_monthly", plan: "personal", productId: "app.heyhermes.personal.monthly.v3", displayName: "Personal", trialDays: 7,
    title: "Hey Hermes Personal", description: "", priceString: "$29.00", trialEligibility: "eligible",
  }]);
  assert.ok(fake.calls.includes("checkTrialEligibility:app.heyhermes.personal.monthly.v3"));
  // On the App Store a week stated as P1W is not the approved seven days, as before.
  const week = playAdapter({ offeredProduct: MOBILE_REVENUECAT_PRODUCTS.personal_monthly });
  week.adapter.checkTrialEligibility = async () => ({ [MOBILE_REVENUECAT_PRODUCTS.personal_monthly]: "eligible" });
  const weekController = new MobilePurchasesController(week.adapter);
  await weekController.bindAccount("acct_1", "appl_key");
  assert.equal((await weekController.loadPlans("acct_1"))[0]?.trialEligibility, "unknown");
  // A Play-shaped product id is not the App Store product.
  const play = playAdapter();
  const strict = new MobilePurchasesController(play.adapter);
  await strict.bindAccount("acct_1", "appl_key");
  await assert.rejects(strict.loadPlans("acct_1"), /A Hey Hermes package is mapped to the wrong App Store product\./);
});

test("an active purchase is recognised per store and the defaults stay the App Store's", () => {
  const info = (productIdentifier: string) => ({ activeEntitlements: [{ identifier: "hey_hermes_access", productIdentifier, expirationAt: future }] });
  assert.equal(mobileCustomerInfoActivePersonalExpirationAt(info("app.heyhermes.personal.monthly.v3")), future);
  assert.equal(mobileCustomerInfoActivePersonalExpirationAt(info("hey_personal")), null);
  assert.equal(mobileCustomerInfoActivePersonalExpirationAt(info("hey_personal"), Date.now(), { id: playProduct, store: "play_store" }), future);
  const state = (productId: string) => ({
    accountId: "acct_1",
    entitlement: { accountId: "acct_1", status: "none", revenueCatCustomerId: "acct_1" },
    workspaceAccess: { runtimeAccess: "enabled" },
    lastWebhookEvent: {
      accountId: "acct_1", appUserId: "acct_1", environment: "SANDBOX", status: "applied",
      productId, entitlementId: "hey_hermes_access", type: "INITIAL_PURCHASE", expirationAt: future,
    },
  });
  // A licence tester's Sandbox purchase that the Plane applied: no second purchase.
  assert.equal(mobilePersonalPurchaseCanStart("acct_1", state("hey_personal:monthly"), null, Date.now(), { id: playProduct, store: "play_store" }), false);
  assert.equal(mobilePersonalPurchaseCanStart("acct_1", state("hey_personal"), null, Date.now(), { id: playProduct, store: "play_store" }), false);
  assert.equal(mobilePersonalPurchaseCanStart("acct_1", state("hey_personal:monthly"), null), true, "the App Store default does not read a Play product");
  assert.equal(mobilePersonalPurchaseCanStart("acct_1", state("app.heyhermes.personal.monthly.v3"), null), false);
});

test("the surface reads the switch once and gates store, sign-in and sales status through it", () => {
  assert.match(surface, /const storePlatform = heyStorePlatform\(Platform\.OS, host\.policy\.heyAndroidLaunchEnabled\);/);
  assert.match(surface, /const signInSurface = heySignInSurface\(Platform\.OS, host\.policy\.heyAndroidLaunchEnabled\);/);
  // Sales status, RevenueCat binding, the paywall decision.
  assert.match(surface, /if \(!token \|\| host\.session\.mode !== "standalone" \|\| !storePlatform\) return;\s*let cancelled = false;\s*void readHeySalesStatus\(storePlatform, \(options\) => api\.salesStatus\(options\), /);
  assert.match(surface, /if \(host\.session\.mode === "external" \|\| !storePlatform \|\| !accountId\) \{\s*mobilePurchasesController\.suspend\(\);/);
  assert.equal(surface.match(/ios: storePlatform !== null,/g)?.length, 2);
  // Binding comes before the plans, and the plans before any purchase button.
  assert.match(surface, /void bindMobilePurchasesAccount\(accountId\)\s*\.then\(\(binding\) => \{[\s\S]*?return mobilePurchasesController\.loadPlans\(accountId, \{ tiers: serverPlanTiers \}\);/); // HPD-1534: tiers only when the server lists them
  // Every sign-in request names the surface from the switch; no literal "ios" is left on that path.
  assert.doesNotMatch(surface, /surface: "ios"/);
  assert.doesNotMatch(surface, /nativeAuthConfig\("ios"\)/);
  assert.equal(surface.match(/surface: signInSurface/g)?.length, 8);
  // Purchases, sign-in and sales no longer ask for iOS by name.
  assert.doesNotMatch(surface, /Platform\.OS !== "ios" \|\| !accountId/);
  assert.doesNotMatch(surface, /Platform\.OS !== "ios"\) return;/);
});

test("Android: Google signs in through the host's native sheet with the Plane's client id; Apple is not offered", () => {
  const start = surface.indexOf("async function signInWithGoogle(");
  const flow = surface.slice(start, surface.indexOf("async function signInWithApple(", start));
  assert.match(flow, /googleNativeSignIn\.signIn\(\{ serverClientId: googleClientId!, nonce: attemptChallenge\.nonce \}\)/);
  assert.match(flow, /completeNativeSignIn\("google", native\.idToken, attemptChallenge, mode\)/);
  assert.match(surface, /const googleClientId = nativeAuthConfig\?\.providers\.google\?\.clientId;/);
  assert.match(surface, /const googleOffered = Boolean\(nativeAuthConfig\?\.providers\.google\) && \(storePlatform === "ios" \|\| Boolean\(googleNativeSignIn\)\);/);
  // Apple: asked for on iOS only, so the button never shows on Android even if the Plane publishes a client.
  assert.match(surface, /if \(storePlatform !== "ios"\) return \(\) => \{ cancelled = true; \};\s*void AppleAuthentication\.isAvailableAsync\(\)/);
  const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
  assert.match(host, /GoogleNative\?: \{\s*signIn\(input: \{ serverClientId: string; nonce: string \}\): Promise<\{ idToken: string \} \| null>;/);
  assert.match(host, /heyAndroidLaunchEnabled\?: boolean;/);
});

test("Android: the paywall colours and its drawing follow the scheme the palette was built for", () => {
  assert.match(surface, /const androidStartsDark = Platform\.OS === "android" && Appearance\?\.getColorScheme\?\.\(\) === "dark";/);
  // iOS keeps its dynamic colours, value for value.
  assert.ok(surface.includes('const paywallBrandColor = Platform.OS === "ios" ? DynamicColorIOS({ light: "#1d4ed8", dark: "#7ea2ff" }) : androidStartsDark ? "#7ea2ff" : "#1d4ed8";'));
  assert.ok(surface.includes('const paywallCtaColor = Platform.OS === "ios" ? DynamicColorIOS({ light: "#1d4ed8", dark: "#3563e9" }) : androidStartsDark ? "#3563e9" : "#1d4ed8";'));
  assert.ok(surface.includes('const paywallCheckBackground = Platform.OS === "ios" ? DynamicColorIOS({ light: "#e8eefc", dark: "#1e2742" }) : androidStartsDark ? "#1e2742" : "#e8eefc";'));
  assert.match(surface, /const dark = Platform\.OS === "ios" \? scheme === "dark" : androidStartsDark;/);
});

test("Android: Manage opens Google Play, a web subscriber still goes to the web, iOS as before", () => {
  const manage = surface.slice(surface.indexOf("async function manageMobileSubscription()"), surface.indexOf("const loadNativeCapabilities"));
  // Phase 2: the store that holds the plan decides (hpd1243-play-product-and-manage.test.ts).
  assert.match(manage, /const action = mobileSubscriptionManageAction\(storePlatform === "android" \? "android" : "ios", target\);/);
  assert.match(manage, /if \(action\.kind === "open"\) await Linking\.openURL\(action\.href\);\s*else await openIosSubscriptionManagement/);
  assert.equal(ANDROID_PLAY_SUBSCRIPTIONS_URL, "https://play.google.com/store/account/subscriptions");
});

test("ios-paywall.ts is not touched: the App Store texts and rules stay where the legal review pinned them", () => {
  const source = readFileSync(new URL("../src/ios-paywall.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Google Play|play_store|android/i);
});

test("the Account page names the store a trial started in; an App Store trial reads as before", () => {
  const trialing = {
    accountId: "a", workspaceId: "w", status: "trialing", plan: "personal", comped: false, provider: "revenuecat",
    revenueCatCustomerId: "a", revenueCatEntitlementId: "hey_hermes_access", trialEndsAt: future, renewsAt: null,
    gracePeriodEndsAt: null, cancelledAt: null, expiresAt: future, storeProductId: null, updatedAt: future,
  } as Entitlement;
  for (const locale of appLocales) {
    const appStore = accountPageCopy(locale).access.trial.explanation;
    assert.match(appStore, /App.Store/);
    assert.equal(personalAccessPresentation(trialing, locale).explanation, appStore);
    assert.equal(personalAccessPresentation(trialing, locale, undefined, null, "app_store").explanation, appStore);
    assert.match(personalAccessPresentation(trialing, locale, undefined, null, "play_store").explanation, /Google.Play/);
    assert.doesNotMatch(personalAccessPresentation(trialing, locale, undefined, null, "web_billing").explanation, appleWords);
  }
  assert.equal(personalAccessStore({ webBilling: { management: "play_store" } }), "play_store");
  assert.equal(personalAccessStore({}), null);
  assert.match(surface, /const subscriptionStore = personalAccessStore\(snapshot\.subscription\);/);
  assert.match(surface, /snapshot\.subscription\.promotionalGrant,\s*\/\/ HPD-1243[^\n]*\n\s*subscriptionStore,/);
});

test("account deletion says which store keeps billing: Google Play for a Play plan, the App Store sentence otherwise", () => {
  for (const locale of appLocales) {
    const deletion = mobileText(locale).systemPages.account.deletion;
    for (const text of [deletion.confirmBody, deletion.subscriptionKept]) {
      assert.match(text, /App.Store/, `${locale}: the sentence names the App Store today`);
      const android = heyStoreWording(text, locale, "android");
      assert.doesNotMatch(android, appleWords, `${locale}: ${android}`);
      assert.match(android, /Google.Play/, locale);
      assert.equal(heyStoreWording(text, locale, "ios"), text);
    }
  }
  assert.equal(heyStoreWording(mobileText("en").systemPages.account.deletion.subscriptionKept, "en", "android"), "Your Google Play subscription was not cancelled.");
  // Only the two sentences that name a store are re-worded; "Apple or Google" sign-in hints are not.
  // The rule moved into heyAccountDeletionStoreCopy; hpd1243-deletion-store.test.ts pins it, iOS included.
  assert.match(surface, /const accountDeletionCopy = heyAccountDeletionStoreCopy\(/);
  assert.match(surface, /copy=\{accountDeletionCopy\}/);
});

test("Android: no Google button before deletion (email link instead), and no challenge for a build that cannot offer Google", () => {
  assert.match(surface, /\{storePlatform === "ios" && linkedProviders\.includes\("google"\) && nativeAuthConfig\?\.providers\.google \? \(/);
  assert.match(surface, /if \(!googleOffered\) return;\s*let cancelled = false;\s*const mode = token \? "link" : "login";/);
  assert.match(surface, /if \(!googleOffered \|\| nativeAuthBusy\) return;\s*const timer = setInterval\(/);
});
