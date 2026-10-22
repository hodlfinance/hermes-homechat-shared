import type { AppLocale } from "../core/index";
import type { SelfManagedView } from "../core/types";

export type { SelfManagedUnavailableReason, SelfManagedView } from "../core/types";

/**
 * HPD-1196 "Manage model and memory myself" and HPD-1197 "daily check-in",
 * shared by the app and the web. Pure model and copy; the screens only render it.
 *
 * Placement (Justus, 2026-10-12, 1b): the switch sits under Account, next to
 * server access (SSH). The run-81 check-in is a card in the chat, not a
 * setting; AI Access carries one read-only line about it.
 * Wording: handoffs/2026-10-12-hpd1196-1197-settings-proposal.html.
 */

export interface SelfManagedCopy {
  sectionTitle: string;
  switchLabel: string;
  switchDescription: string;
  confirmTitle: string;
  confirmBody: string;
  confirmPoints: string[];
  confirmCheckbox: string;
  confirmCancel: string;
  confirmTurnOn: string;
  badge: string;
  bannerText: string;
  restore: string;
  restoreConfirm: string;
  restoreCancel: string;
  restoreAction: string;
  needsSsh: string;
  modelNote: string;
  usageInaccurate: string;
  failed: string;
}

export interface DailyCheckInCopy {
  title: (afterMessages: number) => string;
  body: string;
  continueAnyway: string;
  notNow: string;
  settingsLine: (afterMessages: number) => string;
  settingsDetail: string;
}

const en: SelfManagedCopy = {
  sectionTitle: "Advanced",
  switchLabel: "Manage model and memory myself",
  switchDescription:
    "Hey stops resetting your model, memory and compression settings. Hermes then runs with whatever its own configuration says, as if you had installed it yourself.",
  confirmTitle: "Manage model and memory yourself?",
  confirmBody: "From now on, changes you make in the chat or over SSH stay as they are. Hey no longer checks or repairs them.",
  confirmPoints: [
    "A wrong setting can stop Hey from answering. You fix it yourself over SSH, or with “Restore Hey defaults”.",
    "Usage figures in the app may be inaccurate.",
    "Your included AI keeps its weekly budget.",
    "Gmail, Calendar and Drive keep running through Hey's protected AI route only.",
  ],
  confirmCheckbox: "I understand that I may cause errors and fix them myself over SSH.",
  confirmCancel: "Cancel",
  confirmTurnOn: "Turn on",
  badge: "Self-managed",
  bannerText: "You manage model and memory yourself. Hey does not change them.",
  restore: "Restore Hey defaults",
  restoreConfirm:
    "Hey sets model, memory and compression back to its defaults before your next message. Your chats stay. Memories saved with another memory service stay there, but Hey will not use them.",
  restoreCancel: "Cancel",
  restoreAction: "Restore",
  needsSsh: "Needs server access (SSH).",
  modelNote: "Hermes' own configuration decides the model. Change it in the chat with /model or over SSH.",
  usageInaccurate: "usage may be inaccurate",
  failed: "That did not work. Try again.",
};

const de: SelfManagedCopy = {
  sectionTitle: "Erweitert",
  switchLabel: "Modell und Gedächtnis selbst verwalten",
  switchDescription:
    "Hey setzt Modell, Gedächtnis und Verdichtung nicht mehr zurück. Hermes läuft dann mit seiner eigenen Konfiguration, wie bei einer selbst installierten Version.",
  confirmTitle: "Modell und Gedächtnis selbst verwalten?",
  confirmBody: "Ab jetzt bleiben Änderungen im Chat oder über SSH bestehen. Hey prüft und repariert sie nicht mehr.",
  confirmPoints: [
    "Eine falsche Einstellung kann Hey am Antworten hindern. Du behebst sie selbst über SSH oder mit „Hey-Standard wiederherstellen“.",
    "Verbrauchsanzeigen können ungenau sein.",
    "Die enthaltene KI behält ihr Wochenbudget.",
    "Gmail, Kalender und Drive laufen weiter nur über Heys geschützte KI-Route.",
  ],
  confirmCheckbox: "Mir ist klar, dass ich Fehler verursachen kann und sie selbst über SSH behebe.",
  confirmCancel: "Abbrechen",
  confirmTurnOn: "Einschalten",
  badge: "Selbst verwaltet",
  bannerText: "Du verwaltest Modell und Gedächtnis selbst. Hey ändert sie nicht.",
  restore: "Hey-Standard wiederherstellen",
  restoreConfirm:
    "Hey setzt Modell, Gedächtnis und Verdichtung vor Deiner nächsten Nachricht auf den Standard zurück. Deine Chats bleiben. Erinnerungen bei einem anderen Gedächtnisdienst bleiben dort, Hey nutzt sie aber nicht.",
  restoreCancel: "Abbrechen",
  restoreAction: "Wiederherstellen",
  needsSsh: "Braucht Serverzugang (SSH).",
  modelNote: "Hermes' eigene Konfiguration bestimmt das Modell. Ändere es im Chat mit /model oder über SSH.",
  usageInaccurate: "Verbrauch kann ungenau sein",
  failed: "Das hat nicht geklappt. Versuche es noch einmal.",
};

const checkInEn: DailyCheckInCopy = {
  title: (n) => `That's ${n} messages today`,
  body: "Hey checks in here once a day so a stuck task can't quietly run up costs. Your message is ready to send.",
  continueAnyway: "Continue anyway",
  notNow: "Not now",
  settingsLine: (n) => `Daily check-in after ${n} messages`,
  settingsDetail: "Your included AI has one limit: its weekly budget.",
};

const checkInDe: DailyCheckInCopy = {
  title: (n) => `Das sind heute ${n} Nachrichten`,
  body: "Hey fragt hier einmal am Tag nach, damit eine festgefahrene Aufgabe nicht unbemerkt Kosten macht. Deine Nachricht ist bereit.",
  continueAnyway: "Trotzdem weiter",
  notNow: "Jetzt nicht",
  settingsLine: (n) => `Tägliche Rückfrage nach ${n} Nachrichten`,
  settingsDetail: "Die enthaltene KI hat eine Grenze: ihr Wochenbudget.",
};

// The other app languages fall back to English until their copy is reviewed.
export function selfManagedCopy(locale: AppLocale): SelfManagedCopy {
  return locale === "de" ? de : en;
}

export function dailyCheckInCopy(locale: AppLocale): DailyCheckInCopy {
  return locale === "de" ? checkInDe : checkInEn;
}

/** The section shows for the Owner who may switch it on, or who already did (to restore). */
export function selfManagedSectionVisible(view: SelfManagedView | null | undefined) {
  if (!view) return false;
  if (view.selfManaged) return true;
  return view.available || view.unavailableReason === "server_access_required";
}

/** The row is greyed with "Needs server access (SSH)." when the Owner has no SSH. */
export function selfManagedSwitchEnabled(view: SelfManagedView | null | undefined) {
  return Boolean(view?.available);
}

export function selfManagedBadgeVisible(view: SelfManagedView | null | undefined) {
  return view?.selfManaged === true;
}

/** "Turn on" stays disabled until the box is ticked. */
export function selfManagedTurnOnEnabled(acknowledged: boolean, busy: boolean) {
  return acknowledged && !busy;
}

export const DAILY_CHECK_IN_CODE = "daily_check_in";
const DAILY_CHECK_IN_MESSAGE = /^That's \d+ messages today/;

/** A send the Plane held for the daily check-in (409, code daily_check_in). */
export function isDailyCheckInError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (record.code === DAILY_CHECK_IN_CODE) return true;
  if (typeof record.message === "string" && DAILY_CHECK_IN_MESSAGE.test(record.message)) return true;
  return record.cause !== undefined && record.cause !== error ? isDailyCheckInError(record.cause) : false;
}

/** The check-in line in AI Access shows only to those it applies to. */
export function dailyCheckInLineVisible(view: SelfManagedView | null | undefined, onIncludedAi: boolean) {
  if (!view) return onIncludedAi;
  return view.dailyCheckIn.audience === "all_customers" || onIncludedAi;
}
