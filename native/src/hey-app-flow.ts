import type { AppLocale } from "../core/index";
import type { HeyHermesAppWaitlistState, HeyHermesSalesStatus } from "../core/hermes-api";

/**
 * HPD-1762: Hey Hermes App 1.1 sign-up, waitlist, purchase and upgrade screens.
 *
 * Copy is the English mockup text Justus approved on 2026-10-26 (index-en.html), with his two changes:
 * the value line reads "Your own AI agent on your own private server. Text it or talk to it, like a
 * friend." and the word is "spot". German follows the German mockup. The other six languages read
 * English until they are translated (the sign-in and paywall catalogs fall back the same way). The US
 * English text names no place, city, country or server location (Justus/coordinator 2026-10-26); only the German variant keeps "in Europa".
 *
 * No screen of this file shows a position number or says who "gets the spot": that urgency line is
 * only in the release message (email, push, in-app card) and on the card of the released state.
 */
export type HeyAppFlowCopy = {
  valueLine: string;
  welcome: { intro: string; talk: string; examples: readonly [lead: string, items: readonly string[]]; runs: string; price: string; start: string; login: string; code: string; codeLabel: string; cancel: string };
  signUp: { title: string; sentTitle: string; sentBody: string; sentTo: string; google: string; apple: string; orEmail: string; emailPlaceholder: string; sendLink: string; hint: string; haveAccount: string; logIn: string };
  /** Returning users (mockups 14, 15, 17, 18): the login screen, the check-your-email screen and the logged-in-as row. */
  login: { title: string; body: string; sendLink: string; google: string; apple: string; newHere: string; getStarted: string; sentTitle: string; sentBody: string; wrongAddress: string; loggedInAs: string; notYou: string };
  waitlist: { title: string; body: string; writeTo: string; codeQuestion: string; codePlaceholder: string; redeem: string; redeeming: string; invalid: string; subscribe: string };
  invite: { banner: string };
  release: { title: string; body: string; urgency: string; cta: string };
  taken: { title: string; body: string; back: string };
  purchase: { title: string; trialLine: string; plainLine: string; trialCta: string; plainCta: string; trialTerms: string; plainTerms: string };
  limit: { title: string; body: string; cta: string };
  pro: { title: string; body: string; name: string; perMonth: string; feature: string; noTrial: string; cta: string; later: string; ownKey: string };
};

const en: HeyAppFlowCopy = {
  valueLine: "Your own AI agent on your own private server. Text it or talk to it, like a friend.",
  welcome: {
    intro: "Hey Hermes is your own AI agent that learns how you work and what matters to you.",
    talk: "Text it or talk to it, like a friend. It uses its own computer like you do.",
    examples: ["It ", ["prioritizes your to-dos", "reserves a table for Friday", "books your next flight", "spots deals", "builds you little apps"]],
    runs: "It runs on your own private server. You can switch its AI model anytime.",
    price: "30 days free, then {price} a month.",
    start: "Get started",
    login: "Log in",
    code: "I have an invitation code",
    codeLabel: "Invitation code",
    cancel: "Cancel",
  },
  signUp: {
    title: "One more step, then Hey Hermes replies.",
    sentTitle: "We sent you a link.",
    sentBody: "Open it on this device to continue here.",
    sentTo: "Sent to {email}",
    google: "Continue with Google",
    apple: "Continue with Apple",
    orEmail: "or with email",
    emailPlaceholder: "you@example.com",
    sendLink: "Send link",
    hint: "No password needed. We’ll email you a link.",
    haveAccount: "Already have an account?",
    logIn: "Log in",
  },
  login: {
    title: "Welcome back.",
    body: "Log in to your Hey Hermes account.",
    sendLink: "Send login link",
    google: "Sign in with Google",
    apple: "Sign in with Apple",
    newHere: "New to Hey Hermes?",
    getStarted: "Get started",
    sentTitle: "Check your email.",
    sentBody: "We sent a login link to {email}. Open it on this device to log in.",
    wrongAddress: "Wrong address? Go back",
    loggedInAs: "Logged in as {email}",
    notYou: "Not you? Log out",
  },
  waitlist: {
    title: "All spots are taken right now.",
    body: "We’re opening new spots step by step. As soon as yours is ready, we’ll let you know.",
    writeTo: "We’ll write to {email} and here in the app.",
    codeQuestion: "Do you have an invitation code?",
    codePlaceholder: "Invitation code",
    redeem: "Redeem",
    redeeming: "Checking...",
    invalid: "Please check the code.",
    subscribe: "Or subscribe right away",
  },
  invite: { banner: "You have an invite. Your spot is waiting." },
  release: {
    title: "Your spot is ready.",
    body: "We’re opening new spots step by step. Now it’s your turn.",
    urgency: "Whoever subscribes first gets the spot.",
    cta: "Go to purchase",
  },
  taken: {
    title: "That spot has been taken, sorry.",
    body: "We keep opening spots and will write to you as soon as the next one is ready for you.",
    back: "Back",
  },
  purchase: {
    title: "Start Hey Hermes.",
    trialLine: "{days} days free, then {price}/month. Cancel anytime.",
    plainLine: "{price}/month. Cancel anytime.",
    trialCta: "Start {days} days free",
    plainCta: "Subscribe for {price}/month",
    trialTerms: "Today {zero}. Then {price} a month until you cancel in App Store settings. Apple confirms the trial in the purchase sheet.",
    plainTerms: "{price} a month until you cancel in App Store settings.",
  },
  limit: {
    title: "You've used this week's allowance.",
    body: "New tasks with included AI pause until Monday. Pro has a larger weekly allowance.",
    cta: "See Pro",
  },
  pro: {
    title: "More room with Pro.",
    body: "Pro has a larger weekly allowance. Your server and data stay, and nothing is charged twice.",
    name: "Pro",
    perMonth: "{price} / month",
    feature: "A larger weekly allowance",
    noTrial: "No free trial. Billed through your App Store account; cancel any time in App Store settings.",
    cta: "Switch to Pro · {price} a month",
    later: "Not now",
    ownKey: "Or use your own OpenRouter key",
  },
};

const de: HeyAppFlowCopy = {
  valueLine: "Dein eigener KI-Agent auf deinem eigenen privaten Server. Schreib ihm oder sprich mit ihm, wie mit einem Freund.",
  welcome: {
    intro: "Hey Hermes ist dein eigener KI-Agent, der lernt, wie du arbeitest und was dir wichtig ist.",
    talk: "Schreib ihm oder sprich mit ihm, wie mit einem Freund. Er nutzt seinen eigenen Computer, genau wie du.",
    examples: ["Er ", ["priorisiert deine To-dos", "reserviert einen Tisch für Freitag", "bucht einen Flug nach Lissabon", "findet Angebote", "baut dir kleine Apps"]],
    runs: "Er läuft auf deinem privaten Server in Europa. Du kannst sein KI-Modell jederzeit wechseln.",
    price: "30 Tage gratis, danach {price} im Monat.",
    start: "Los geht’s",
    login: "Anmelden",
    code: "Ich habe einen Einladungscode",
    codeLabel: "Einladungscode",
    cancel: "Abbrechen",
  },
  signUp: {
    title: "Noch ein Schritt, dann antwortet Hey Hermes.",
    sentTitle: "Wir haben dir einen Link geschickt.",
    sentBody: "Öffne ihn auf diesem Gerät, um hier weiterzumachen.",
    sentTo: "Gesendet an {email}",
    google: "Weiter mit Google",
    apple: "Weiter mit Apple",
    orEmail: "oder mit E-Mail",
    emailPlaceholder: "du@beispiel.de",
    sendLink: "Link senden",
    hint: "Kein Passwort nötig. Wir schicken dir einen Link.",
    haveAccount: "Schon ein Konto?",
    logIn: "Anmelden",
  },
  login: {
    title: "Willkommen zurück.",
    body: "Melde dich in deinem Hey-Hermes-Konto an.",
    sendLink: "Anmeldelink senden",
    google: "Mit Google anmelden",
    apple: "Mit Apple anmelden",
    newHere: "Neu bei Hey Hermes?",
    getStarted: "Los geht’s",
    sentTitle: "Schau in dein Postfach.",
    sentBody: "Wir haben einen Anmeldelink an {email} geschickt. Öffne ihn auf diesem Gerät, um dich anzumelden.",
    wrongAddress: "Falsche Adresse? Zurück",
    loggedInAs: "Angemeldet als {email}",
    notYou: "Nicht du? Abmelden",
  },
  waitlist: {
    title: "Gerade sind alle Plätze vergeben.",
    body: "Wir öffnen neue Plätze Schritt für Schritt. Sobald deiner bereit ist, melden wir uns.",
    writeTo: "Wir schreiben an {email} und hier in der App.",
    codeQuestion: "Hast du einen Einladungscode?",
    codePlaceholder: "Einladungscode",
    redeem: "Einlösen",
    redeeming: "Wird geprüft...",
    invalid: "Bitte prüfe den Code.",
    subscribe: "Oder gleich abonnieren",
  },
  invite: { banner: "Du hast eine Einladung. Dein Platz wartet." },
  release: {
    title: "Dein Platz ist bereit.",
    body: "Wir öffnen neue Plätze Schritt für Schritt. Jetzt bist du dran.",
    urgency: "Wer zuerst abonniert, bekommt den Platz.",
    cta: "Zum Kauf",
  },
  taken: {
    title: "Dieser Platz ist leider vergeben.",
    body: "Wir öffnen laufend neue Plätze und schreiben dir, sobald der nächste für dich bereit ist.",
    back: "Zurück",
  },
  purchase: {
    title: "Starte Hey Hermes.",
    trialLine: "{days} Tage gratis, danach {price}/Monat. Jederzeit kündbar.",
    plainLine: "{price}/Monat. Jederzeit kündbar.",
    trialCta: "{days} Tage gratis starten",
    plainCta: "Abonnieren für {price}/Monat",
    trialTerms: "Heute {zero}. Danach {price} im Monat, bis du in den App-Store-Einstellungen kündigst. Apple bestätigt die Testphase im Kaufdialog.",
    plainTerms: "{price} im Monat, bis du in den App-Store-Einstellungen kündigst.",
  },
  limit: {
    title: "Du hast das Kontingent dieser Woche aufgebraucht.",
    body: "Neue Aufgaben mit enthaltener KI pausieren bis Montag. Pro hat ein größeres Wochenkontingent.",
    cta: "Pro ansehen",
  },
  pro: {
    title: "Mehr Spielraum mit Pro.",
    body: "Pro hat ein größeres Wochenkontingent. Dein Server und deine Daten bleiben, und nichts wird doppelt berechnet.",
    name: "Pro",
    perMonth: "{price} / Monat",
    feature: "Ein größeres Wochenkontingent",
    noTrial: "Keine Testphase. Abrechnung über dein App-Store-Konto; jederzeit in den App-Store-Einstellungen kündbar.",
    cta: "Zu Pro wechseln · {price} im Monat",
    later: "Jetzt nicht",
    ownKey: "Oder eigenen OpenRouter-Schlüssel nutzen",
  },
};

export function heyAppFlowCopy(locale: AppLocale): HeyAppFlowCopy {
  return locale === "de" ? de : en;
}

export const heyAppFlowFill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template);

/** The price shown before sign-in, when no store has answered yet. The purchase screen always shows the store's own price. */
export const HEY_PERSONAL_PRICE_FALLBACK = "$12.99";

/**
 * Which screen leads for an account without access, from the server's sales status.
 * Unknown status or no gate: the purchase screen, as in 1.0 (buying is possible).
 */
export type HeyAppEntryScreen = "purchase" | "waitlist" | "release" | "taken" | "unknown";
type AppEntryStatus = Pick<HeyHermesSalesStatus, "appWaitlist"> & Partial<Pick<HeyHermesSalesStatus, "mayPurchase">>;
export function heyAndroidPurchaseAllowed(status: AppEntryStatus | null): boolean {
  return status?.mayPurchase === true && (!status.appWaitlist || status.appWaitlist.state === "released");
}
export function heyAppEntryScreen(status: AppEntryStatus | null, purchaseOpened: boolean, platform?: "android" | "ios"): HeyAppEntryScreen {
  const state: HeyHermesAppWaitlistState | null = status?.appWaitlist?.state ?? null;
  if (platform === "android") {
    if (!status) return "unknown";
    if (state === "waiting") return "waitlist";
    if (state === "taken") return "taken";
    if (!heyAndroidPurchaseAllowed(status)) return "unknown";
    return state === "released" && !purchaseOpened ? "release" : "purchase";
  }
  if (!state || purchaseOpened) return "purchase";
  return state === "waiting" ? "waitlist" : state === "released" ? "release" : "taken";
}

export function heyAppStatusCopy(locale: string) {
  return locale === "de" ? {
    loading: "Dein Zugang wird geprüft …", error: "Dein Zugangsstatus konnte nicht geladen werden. Bitte versuche es erneut.", retry: "Erneut versuchen",
  } : {
    loading: "Checking your access…", error: "Your access status could not be loaded. Please try again.", retry: "Try again",
  };
}

/**
 * An invitation code in a link: https://heyhermes.app/i/<code> (Universal Link on iOS, App Link on Android),
 * or the app's own scheme heyhermes://i/<code>. Codes are 4-12 characters of A-Z and 0-9, upper-cased here.
 */
export function heyInviteCodeFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    let path: string | null = null;
    if (parsed.protocol === "https:" && parsed.hostname === "heyhermes.app" && parsed.port === "") path = parsed.pathname;
    else if (parsed.protocol === "heyhermes:") path = `/${parsed.hostname}${parsed.pathname}`.replace(/^\/\//, "/");
    const match = path ? /^\/i\/([A-Za-z0-9-]{4,13})\/?$/.exec(path) : null;
    const code = match ? match[1]!.replace(/-/g, "").toUpperCase() : null;
    return code && /^[A-Z0-9]{4,12}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** A typed code: spaces and dashes dropped, upper-cased; null when it cannot be a code. */
export function heyNormalizeInviteCode(value: string): string | null {
  const code = value.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(code) ? code : null;
}

/** Server answers of POST /me/invite/redeem that let the account in (the invite is held, the purchase opens). */
export function heyInviteRedeemAccepted(status: string): boolean {
  return status === "pending" || status === "counted" || status === "own";
}

/**
 * Pro is shown only in context: the limit card in the chat appears when the included weekly allowance is used up
 * and the account holds the Personal plan (so Pro is a change, never a first purchase). Anything else: no card.
 */
export function heyShowLimitCard(input: { remainingIncludedPercent: number | null; plan: string | null; proOffered: boolean }): boolean {
  return input.proOffered && input.plan === "starter" && input.remainingIncludedPercent !== null && input.remainingIncludedPercent <= 0;
}

/** HPD-1762: Android push needs the Firebase config in the build; the build says so with extra.androidPush === true. */
export function heyAndroidPushAvailable(androidPush: unknown): boolean {
  return androidPush === true;
}

/** HPD-1762: a reply that is one short plain line hugs its text in the iMessage bubble; anything longer or structured keeps the definite width. */
export function heyIsShortReply(text: string): boolean {
  return text.length > 0 && text.length <= 60 && !/[\n`*#>|]|^\s*(?:[-+]|\d+[.)])\s/.test(text);
}
