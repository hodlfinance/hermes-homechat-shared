import { IOS_APP_STORE_SUBSCRIPTIONS_URL } from "./ios-paywall";

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

/** The web billing portal for a web subscriber; null keeps the App Store. */
export function mobileWebSubscriptionManagementHref(value: unknown, identity: { accountId: string; workspaceId: string }) {
  const href = mobileSubscriptionManagementHref(value, identity);
  return href && href !== IOS_APP_STORE_SUBSCRIPTIONS_URL ? href : null;
}
