import type { AppLocale } from "../core/index";

/**
 * HPD-1243: Hey Hermes on Android.
 *
 * One switch decides whether an Android build of Hey sells and signs in through
 * its store: the host's `policy.heyAndroidLaunchEnabled` (Hey mobile reads it
 * from EXPO_PUBLIC_HEY_ANDROID_LAUNCH_ENABLED). While it is off, Android behaves
 * as it did before this change: email link only, no paywall, no RevenueCat
 * binding, no Google button, no sales status, and every sign-in request names
 * the surface "ios". iOS never reads the switch.
 */
export type HeyStorePlatform = "ios" | "android";

/** The store whose paywall, purchases, provider sign-in and sales status are on; null when none is. */
export function heyStorePlatform(os: string, androidLaunchEnabled: boolean | undefined): HeyStorePlatform | null {
  if (os === "ios") return "ios";
  if (os === "android" && androidLaunchEnabled === true) return "android";
  return null;
}

/** The `surface` a sign-in request names. Android names "android" only once the switch is on. */
export function heySignInSurface(os: string, androidLaunchEnabled: boolean | undefined): HeyStorePlatform {
  return heyStorePlatform(os, androidLaunchEnabled) === "android" ? "android" : "ios";
}

export const ANDROID_PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

/**
 * HPD-1243: may this Android build sell its Google Play product?
 *
 * The build sells the product named by its own build value; the Plane's
 * catalog accepts the product in HERMES_REVENUECAT_PERSONAL_ANDROID_STORE_IDENTIFIER.
 * With two different ids Google takes the payment and the Plane's webhook
 * matches no catalog entry, so the buyer pays and gets nothing. The Plane
 * states its id in the sales status; the app sells only when both are the same
 * string, character for character.
 *
 *  - "pending": the sales status has not been answered yet.
 *  - "match": sell.
 *  - "mismatch": the status is unreadable (an old Plane, a network error), the
 *    Plane names no Play product, or it names another one. Nothing is sold.
 *
 * iOS never asks: its product id is a constant of the app and of the Plane.
 */
export type HeyPlayProductGuard = "pending" | "match" | "mismatch";
export function heyPlayProductGuard(input: {
  buildProductId: string;
  salesStatusSettled: boolean;
  salesStatus: { playStorePersonalProductId: string | null } | null;
}): HeyPlayProductGuard {
  if (!input.salesStatusSettled) return "pending";
  const expected = input.salesStatus?.playStorePersonalProductId ?? null;
  return expected !== null && input.buildProductId !== "" && expected === input.buildProductId ? "match" : "mismatch";
}

// The purchase texts were written for the App Store. On Android the same texts
// are shown with the store named correctly; nothing else in a sentence changes
// and nothing is cut. Each list is ordered: the specific phrase first, the bare
// name last. iOS never passes through these rules.
const rules: Record<AppLocale, ReadonlyArray<readonly [string, string]>> = {
  en: [
    ["Apple ID's", "Google account's"],
    ["an Apple trial", "a Google Play trial"],
    ["Apple's", "Google Play's"],
    ["in your App Store settings", "in your Google Play subscriptions"],
    ["in App Store settings", "in Google Play subscriptions"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  de: [
    ["dieser Apple-ID", "dieses Google-Kontos"],
    ["in den App-Store-Einstellungen", "in den Google-Play-Abos"],
    ["auf dem iPhone", "auf Android"],
    ["App-Store-", "Google-Play-"],
    ["App Store", "Google Play"],
    ["Apple-", "Google-Play-"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  fr: [
    ["cet identifiant Apple", "ce compte Google"],
    ["les réglages de l’App Store", "les abonnements Google Play"],
    ["les réglages App Store", "les abonnements Google Play"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  es: [
    ["este Apple ID", "esta cuenta de Google"],
    ["los ajustes del App Store", "las suscripciones de Google Play"],
    ["del App Store", "de Google Play"],
    ["en el iPhone", "en Android"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  it: [
    ["questo ID Apple", "questo account Google"],
    ["nelle impostazioni dell’App Store", "negli abbonamenti di Google Play"],
    ["nelle impostazioni App Store", "negli abbonamenti di Google Play"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  "pt-BR": [
    ["deste ID Apple", "desta conta do Google"],
    ["nos ajustes da App Store", "nas assinaturas do Google Play"],
    ["A Apple", "O Google Play"],
    ["pela Apple", "pelo Google Play"],
    ["da Apple", "do Google Play"],
    ["da App Store", "do Google Play"],
    ["na App Store", "no Google Play"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  ja: [
    ["Apple ID", "Googleアカウント"],
    ["App Storeの設定", "Google Playの定期購入"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone", "Android"],
  ],
  ko: [
    ["Apple ID", "Google 계정"],
    ["Apple이", "Google Play가"],
    ["App Store 설정", "Google Play 정기 결제"],
    ["App Store", "Google Play"],
    ["Apple", "Google Play"],
    ["iPhone과", "Android와"],
    ["iPhone", "Android"],
  ],
};

/** One purchase text as the given store shows it. The identity on iOS. */
export function heyStoreWording(text: string, locale: AppLocale, store: HeyStorePlatform): string {
  if (store !== "android" || !text) return text;
  let worded = text;
  for (const [from, to] of rules[locale] ?? rules.en) worded = worded.split(from).join(to);
  // A text that fell back to English inside another locale still names the right store.
  if (locale !== "en") for (const [from, to] of rules.en) worded = worded.split(from).join(to);
  return worded;
}

/**
 * A whole paywall view as the given store shows it: every text re-worded, links
 * left alone, and the manage link pointing at the store that sold the plan.
 * On iOS the very same object comes back.
 */
export function heyStoreWordedView<T>(view: T, locale: AppLocale, store: HeyStorePlatform): T {
  if (store !== "android") return view;
  const walk = (value: unknown, key: string | null): unknown => {
    if (typeof value === "string") {
      if (key === "manageUrl") return ANDROID_PLAY_SUBSCRIPTIONS_URL;
      return /^https?:\/\//.test(value) ? value : heyStoreWording(value, locale, store);
    }
    if (Array.isArray(value)) return value.map((item) => walk(item, null));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, walk(item, name)]));
    }
    return value;
  };
  return walk(view, null) as T;
}
