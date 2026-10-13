import type { AppLocale } from "../core/index";
import { ANDROID_PLAY_SUBSCRIPTIONS_URL, heyStoreWording, type HeyStorePlatform } from "./hey-store-platform";
import { IOS_APP_STORE_SUBSCRIPTIONS_URL, iosPaywallCopy } from "./ios-paywall";
import { staticUiMessage } from "./static-ui-copy";

/**
 * HPD-1106: "Manage subscription" on iOS opened the App Store subscriptions for everyone, so a
 * subscriber who bought on the web found nothing there. The Plane's management route
 * (POST /billing/revenuecat/management) names where this account's subscription is managed; this
 * accepts its answer only for the signed-in account and only the two destinations the web accepts:
 * the App Store page, or a RevenueCat Web Billing portal link with its token. Anything else: null,
 * and the caller keeps the App Store. Kept out of ios-paywall.ts, whose content is hash-pinned by
 * the legal review.
 */
export function mobileSubscriptionManagementHref(
  value: unknown,
  identity: { accountId: string; workspaceId: string },
): string | null {
  if (!value || typeof value !== "object") return null;
  const answer = value as { accountId?: unknown; workspaceId?: unknown; platform?: unknown; href?: unknown };
  if (answer.accountId !== identity.accountId || answer.workspaceId !== identity.workspaceId || typeof answer.href !== "string") return null;
  let url: URL;
  try { url = new URL(answer.href); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
  if (answer.platform === "app_store") return url.toString() === IOS_APP_STORE_SUBSCRIPTIONS_URL ? IOS_APP_STORE_SUBSCRIPTIONS_URL : null;
  if (answer.platform === "web_billing") {
    return url.hostname === "billing.revenuecat.com" && url.pathname.split("/").filter(Boolean).length === 2 && url.searchParams.get("token")
      ? url.toString()
      : null;
  }
  return null;
}

/**
 * HPD-1243: the same answer of the Plane, read for every store. The Plane names
 * the store a plan is managed in ("app_store", "play_store", "web_billing");
 * until now only the web answer changed where "Manage" went, so an Android
 * user with an App Store plan was sent to Google Play and an iPhone user with
 * a Google Play plan to the App Store, where neither finds the plan.
 */
export type MobileSubscriptionManagementTarget =
  | { store: "app_store"; href: string }
  | { store: "play_store"; href: string }
  | { store: "web_billing"; href: string };

export function mobileSubscriptionManagementTarget(
  value: unknown,
  identity: { accountId: string; workspaceId: string },
): MobileSubscriptionManagementTarget | null {
  const known = mobileSubscriptionManagementHref(value, identity);
  if (known) return { store: known === IOS_APP_STORE_SUBSCRIPTIONS_URL ? "app_store" : "web_billing", href: known };
  if (!value || typeof value !== "object") return null;
  const answer = value as { accountId?: unknown; workspaceId?: unknown; platform?: unknown; href?: unknown };
  // Google Play: only for the signed-in account, and only the one Play address.
  return answer.accountId === identity.accountId && answer.workspaceId === identity.workspaceId &&
    answer.platform === "play_store" && answer.href === ANDROID_PLAY_SUBSCRIPTIONS_URL
    ? { store: "play_store", href: ANDROID_PLAY_SUBSCRIPTIONS_URL }
    : null;
}

/**
 * What "Manage" does on this device for that answer.
 *
 *  - a web plan: its billing portal, on both devices (HPD-1106);
 *  - a Google Play plan: Google Play's subscriptions page, on both devices
 *    (in a browser on an iPhone, where the user signs in to Google);
 *  - an App Store plan on an iPhone, or no answer on an iPhone: the App Store,
 *    as before;
 *  - an App Store plan on Android: Apple's subscriptions page cannot be opened
 *    on an Android phone, so the app says where the plan is managed instead;
 *  - no answer on Android: Google Play, as before.
 */
export type MobileSubscriptionManageAction =
  | { kind: "open"; href: string }
  | { kind: "ios_app_store" }
  | { kind: "say_app_store" };

export function mobileSubscriptionManageAction(
  device: "ios" | "android",
  target: MobileSubscriptionManagementTarget | null,
): MobileSubscriptionManageAction {
  if (target?.store === "web_billing" || target?.store === "play_store") return { kind: "open", href: target.href };
  if (device === "android") return target?.store === "app_store" ? { kind: "say_app_store" } : { kind: "open", href: ANDROID_PLAY_SUBSCRIPTIONS_URL };
  return { kind: "ios_app_store" };
}

/**
 * The sentence an Android user with an App Store plan reads after "Manage". It
 * is the paywall's existing renewal sentence in its App Store wording ("...
 * until cancelled in App Store settings."), in the user's language. No new text.
 */
export function appStoreManagedSentence(locale: AppLocale): string {
  return iosPaywallCopy(locale).renewal;
}

/**
 * A purchase notice as this build shows it. Notices are written once, App
 * Store worded; iOS shows them untouched and Android names Google Play. The
 * one exception on Android is the sentence above: it names the App Store
 * because the plan is Apple's, and rewording it would send the user to Google
 * Play, where the plan is not.
 */
export function mobileStoreNotice(notice: string | null, locale: AppLocale, store: HeyStorePlatform): string | null {
  if (!notice || store !== "android") return notice;
  if (notice === appStoreManagedSentence(locale)) return notice;
  return heyStoreWording(staticUiMessage(locale, notice), locale, store);
}

/** The web billing portal for a web subscriber; null keeps the App Store. */
export function mobileWebSubscriptionManagementHref(value: unknown, identity: { accountId: string; workspaceId: string }) {
  const href = mobileSubscriptionManagementHref(value, identity);
  return href && href !== IOS_APP_STORE_SUBSCRIPTIONS_URL ? href : null;
}
