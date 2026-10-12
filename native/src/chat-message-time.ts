/**
 * HPD-1215: the time under a chat message says which day it is from.
 *
 * Justus, 2026-10-12: a message from an earlier day showed only "3:23 PM", so
 * nobody could tell which day it was written. One formatter, used by the Hey
 * app, the Hey web chat and Fin in the HODL app, now reads in the interface
 * language and the reader's time zone:
 *
 * - today: the time only ("15:23");
 * - yesterday: "Yesterday" in the interface language plus the time;
 * - the five days before that: the weekday plus the time ("Monday 15:23");
 * - older: the date plus the time, with the year only when it is not the
 *   current year.
 *
 * Seven calendar days back would be today's weekday again, so it already
 * reads as a date. A time stamp from a later calendar day than "now" (a
 * device clock behind the server's) reads as a date too rather than claiming
 * "today".
 *
 * Pure functions only; `use-chat-clock-day.ts` holds the React hook that turns
 * "today" into "yesterday" at midnight without a reload.
 */

export type ChatMessageTimeOptions = {
  /** The reference instant; defaults to the current time. */
  now?: Date;
  /** IANA time zone; defaults to the device or browser time zone. */
  timeZone?: string;
};

export type ChatMessageDayDistance = "today" | "yesterday" | "this-week" | "older";

const yesterdayByLanguage: Record<string, string> = {
  en: "Yesterday",
  de: "Gestern",
  fr: "Hier",
  es: "Ayer",
  it: "Ieri",
  pt: "Ontem",
  ja: "昨日",
  ko: "어제",
};

const DAY_MS = 86_400_000;

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarParts(date: Date, timeZone?: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/** A string naming the calendar day of `date` in `timeZone`, such as "2026-10-12". */
export function chatCalendarDayKey(date: Date, timeZone?: string): string {
  const { year, month, day } = calendarParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Whole calendar days from `date` to `now` in `timeZone`; 1 means yesterday, negative means a later day. */
export function chatCalendarDaysBefore(date: Date, now: Date, timeZone?: string): number {
  const a = calendarParts(date, timeZone);
  const b = calendarParts(now, timeZone);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS);
}

export function chatMessageDayDistance(date: Date, now: Date, timeZone?: string): ChatMessageDayDistance {
  const days = chatCalendarDaysBefore(date, now, timeZone);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days >= 2 && days <= 6) return "this-week";
  return "older";
}

/** "Yesterday" in the interface language; English for a language without a word here. */
export function chatYesterdayLabel(locale: string): string {
  const language = locale.toLowerCase().split(/[-_]/)[0] ?? "en";
  return yesterdayByLanguage[language] ?? yesterdayByLanguage.en!;
}

function safeTimeZone(timeZone?: string): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return timeZone;
  } catch {
    return undefined;
  }
}

/**
 * The time stamp under one chat message. An unreadable value gives "" so the
 * caller can leave the line out, as before.
 */
export function formatChatMessageTime(
  value: string | number | Date | null | undefined,
  locale: string,
  options: ChatMessageTimeOptions = {},
): string {
  const date = toDate(value);
  if (!date) return "";
  const now = toDate(options.now ?? new Date()) ?? new Date();
  const timeZone = safeTimeZone(options.timeZone);
  const time: Intl.DateTimeFormatOptions = { timeZone, hour: "2-digit", minute: "2-digit" };
  switch (chatMessageDayDistance(date, now, timeZone)) {
    case "today":
      return new Intl.DateTimeFormat(locale, time).format(date);
    case "yesterday":
      return `${chatYesterdayLabel(locale)} ${new Intl.DateTimeFormat(locale, time).format(date)}`;
    case "this-week":
      return new Intl.DateTimeFormat(locale, { ...time, weekday: "long" }).format(date);
    case "older": {
      const sameYear = calendarParts(date, timeZone).year === calendarParts(now, timeZone).year;
      return new Intl.DateTimeFormat(locale, {
        ...time,
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" as const }),
      }).format(date);
    }
  }
}

/**
 * Milliseconds until the next calendar day starts in `timeZone`, measured by
 * walking forward to the first minute whose day differs. Always at least one
 * second, so a caller's timer can never spin.
 */
export function msUntilNextChatDay(now: Date, timeZone?: string): number {
  const today = chatCalendarDayKey(now, timeZone);
  // Start from the next full minute and step an hour at a time, then narrow
  // to the minute. At most 26 + 60 + 60 cheap format calls once per day.
  let probe = Math.ceil((now.getTime() + 1) / 60_000) * 60_000;
  let step = 3_600_000;
  while (chatCalendarDayKey(new Date(probe), timeZone) === today) probe += step;
  for (step of [60_000 * 10, 60_000]) {
    while (probe - step > now.getTime() && chatCalendarDayKey(new Date(probe - step), timeZone) !== today) probe -= step;
  }
  return Math.max(1_000, probe - now.getTime());
}
