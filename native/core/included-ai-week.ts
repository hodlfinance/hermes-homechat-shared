import type { AppLocale } from "./types";

/**
 * HPD-452, decided by Justus on 2026-10-17: the included managed-AI budget is
 * weekly. Each account's week is anchored to the moment the account started,
 * trial or paid alike, and renews exactly seven days after the previous
 * renewal. The arithmetic is plain UTC milliseconds, so a renewal never drifts
 * with a daylight-saving change; the customer's local clock only decides how
 * the next renewal is written ("Resets Saturday 8:00 AM").
 */
export const INCLUDED_AI_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface IncludedAiWeekWindow {
  startsAt: string;
  resetsAt: string;
}

/** The weekly window anchored at `anchorAt` that contains `at`, or null for an unreadable time. */
export function includedAiWeekWindow(anchorAt: string, at: string): IncludedAiWeekWindow | null {
  const anchor = Date.parse(anchorAt);
  const moment = Date.parse(at);
  if (!Number.isFinite(anchor) || !Number.isFinite(moment)) return null;
  const index = Math.floor((moment - anchor) / INCLUDED_AI_WEEK_MS);
  const start = anchor + index * INCLUDED_AI_WEEK_MS;
  return {
    startsAt: new Date(start).toISOString(),
    resetsAt: new Date(start + INCLUDED_AI_WEEK_MS).toISOString(),
  };
}

const resetTemplates: Record<AppLocale, string> = {
  en: "Resets {when} {time}",
  de: "Erneuert sich am {when} um {time}",
  fr: "Se renouvelle {when} à {time}",
  es: "Se renueva el {when} a las {time}",
  it: "Si rinnova {when} alle {time}",
  "pt-BR": "Renova {when} às {time}",
  ja: "{when} {time}にリセット",
  ko: "{when} {time}에 초기화",
};

/**
 * "Resets Saturday 8:00 AM" in the reader's language and local time. A reset
 * more than a week away (a monthly window that has not moved to weekly) names
 * the date instead of a weekday, so it never reads as this week.
 */
export function includedAiResetText(
  resetAt: string | null | undefined,
  locale: AppLocale,
  options: { timeZone?: string; now?: number } = {},
): string | null {
  if (!resetAt) return null;
  const reset = Date.parse(resetAt);
  if (!Number.isFinite(reset)) return null;
  const now = options.now ?? Date.now();
  const timeZone = options.timeZone;
  const withinWeek = reset - now <= INCLUDED_AI_WEEK_MS;
  const when = new Intl.DateTimeFormat(locale, withinWeek
    ? { weekday: "long", timeZone }
    : { month: "short", day: "numeric", timeZone }).format(reset);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(reset);
  // ICU separates "8:00" and "AM" with a narrow no-break space; one plain space reads the same everywhere.
  return (resetTemplates[locale] ?? resetTemplates.en)
    .replace("{when}", when)
    .replace("{time}", time)
    .replace(/[\u202f\u00a0]/g, " ");
}
