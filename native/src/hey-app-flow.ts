import type { AppLocale } from "../core/index";
import type { HeyHermesAppWaitlistState, HeyHermesSalesStatus } from "../core/hermes-api";

/**
 * HPD-1762: Hey Hermes App 1.1 sign-up, waitlist, purchase and upgrade screens.
 *
 * Copy is the English mockup text Justus approved on 2026-10-26 (index-en.html), with his two changes:
 * the value line reads "Your own AI agent on your own private server. Text it or talk to it, like a
 * friend." and the word is "spot". German follows the German mockup. The other six languages read
 * English until they are translated (the sign-in and paywall catalogs fall back the same way). The US
 * English text names no region; only the German variant keeps "in Europa".
 *
 * No screen of this file shows a position number or says who "gets the spot": that urgency line is
 * only in the release message (email, push, in-app card) and on the card of the released state.
 */
export type HeyAppFlowCopy = {
  valueLine: string;
  welcome: { intro: string; talk: string; examples: readonly [lead: string, items: readonly string[]]; runs: string; price: string; start: string; login: string; code: string };
  signUp: { title: string; sentTitle: string; sentBody: string; sentTo: string };
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
    talk: "Text it or talk to it, like a friend. You can use it right here in the app. It uses its own computer like you do.",
    examples: ["It ", ["prioritizes your to-dos", "reserves a table for Friday", "books a flight to Austin", "spots deals", "builds you little apps"]],
    runs: "It runs on your own private server. You can switch its AI model anytime.",
    price: "30 days free, then {price} a month.",
    start: "Get started",
    login: "I already have an account · Log in",
    code: "Enter invitation code",
  },
  signUp: {
    title: "One more step, then Hey Hermes replies.",
    sentTitle: "We sent you a link.",
    sentBody: "Open it on this device to continue here.",
    sentTo: "Sent to {email}",
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
  valueLine: "Dein eigener KI-Agent auf Deinem eigenen privaten Server. Schreib ihm oder sprich mit ihm, wie mit einem Freund.",
  welcome: {
    intro: "Hey Hermes ist Dein eigener KI-Agent, der lernt, wie Du arbeitest und was Dir wichtig ist.",
    talk: "Schreib ihm oder sprich mit ihm, wie mit einem Freund. Du kannst ihn direkt hier in der App nutzen. Er benutzt seinen eigenen Computer, so wie Du.",
    examples: ["Er ", ["priorisiert Deine To-dos", "reserviert einen Tisch für Freitag", "bucht einen Flug nach Lissabon", "findet Angebote", "baut Dir kleine Apps"]],
    runs: "Er läuft auf Deinem privaten Server in Europa. Du kannst sein KI-Modell jederzeit wechseln.",
    price: "30 Tage gratis, danach {price} im Monat.",
    start: "Los geht’s",
    login: "Ich habe schon ein Konto · Anmelden",
    code: "Einladungscode eingeben",
  },
  signUp: {
    title: "Noch ein Schritt, dann antwortet Hey Hermes.",
    sentTitle: "Wir haben Dir einen Link geschickt.",
    sentBody: "Öffne ihn auf diesem Gerät, um hier weiterzumachen.",
    sentTo: "Gesendet an {email}",
  },
  waitlist: {
    title: "Gerade sind alle Plätze vergeben.",
    body: "Wir öffnen neue Plätze Schritt für Schritt. Sobald Deiner bereit ist, melden wir uns.",
    writeTo: "Wir schreiben an {email} und hier in der App.",
    codeQuestion: "Hast Du einen Einladungscode?",
    codePlaceholder: "Einladungscode",
    redeem: "Einlösen",
    redeeming: "Wird geprüft...",
    invalid: "Bitte prüfe den Code.",
    subscribe: "Oder gleich abonnieren",
  },
  invite: { banner: "Du hast eine Einladung. Dein Platz wartet." },
  release: {
    title: "Dein Platz ist bereit.",
    body: "Wir öffnen neue Plätze Schritt für Schritt. Jetzt bist Du dran.",
    urgency: "Wer zuerst abonniert, bekommt den Platz.",
    cta: "Zum Kauf",
  },
  taken: {
    title: "Dieser Platz ist leider vergeben.",
    body: "Wir öffnen laufend neue Plätze und schreiben Dir, sobald der nächste für Dich bereit ist.",
    back: "Zurück",
  },
  purchase: {
    title: "Starte Hey Hermes.",
    trialLine: "{days} Tage gratis, danach {price}/Monat. Jederzeit kündbar.",
    plainLine: "{price}/Monat. Jederzeit kündbar.",
    trialCta: "{days} Tage gratis starten",
    plainCta: "Abonnieren für {price}/Monat",
    trialTerms: "Heute {zero}. Danach {price} im Monat, bis Du in den App-Store-Einstellungen kündigst. Apple bestätigt die Testphase im Kaufdialog.",
    plainTerms: "{price} im Monat, bis Du in den App-Store-Einstellungen kündigst.",
  },
  limit: {
    title: "Du hast das Kontingent dieser Woche aufgebraucht.",
    body: "Neue Aufgaben mit enthaltener KI pausieren bis Montag. Pro hat ein größeres Wochenkontingent.",
    cta: "Pro ansehen",
  },
  pro: {
    title: "Mehr Spielraum mit Pro.",
    body: "Pro hat ein größeres Wochenkontingent. Dein Server und Deine Daten bleiben, und nichts wird doppelt berechnet.",
    name: "Pro",
    perMonth: "{price} / Monat",
    feature: "Ein größeres Wochenkontingent",
    noTrial: "Keine Testphase. Abrechnung über Dein App-Store-Konto; jederzeit in den App-Store-Einstellungen kündbar.",
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
export type HeyAppEntryScreen = "purchase" | "waitlist" | "release" | "taken";
export function heyAppEntryScreen(status: Pick<HeyHermesSalesStatus, "appWaitlist"> | null, purchaseOpened: boolean): HeyAppEntryScreen {
  const state: HeyHermesAppWaitlistState | null = status?.appWaitlist?.state ?? null;
  if (!state || purchaseOpened) return "purchase";
  return state === "waiting" ? "waitlist" : state === "released" ? "release" : "taken";
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
