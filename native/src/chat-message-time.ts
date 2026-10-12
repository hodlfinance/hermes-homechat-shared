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
 * No React here; `use-chat-clock-day.ts` holds the hook that turns "today"
 * into "yesterday" at midnight without a reload, on top of
 * startChatClockDayWatch below.
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

type CalendarParts = { year: number; month: number; day: number };

function localCalendarParts(date: Date): CalendarParts {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * The calendar day of `date`. Without a time zone the device's own local
 * getters answer, which every JavaScript engine has. With a zone, Intl answers;
 * if that engine's Intl cannot (a throw, or parts that are not numbers), the
 * local getters answer instead of a NaN day.
 */
function calendarParts(date: Date, timeZone?: string): CalendarParts {
  if (!timeZone) return localCalendarParts(date);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    const result = { year: read("year"), month: read("month"), day: read("day") };
    if (Number.isFinite(result.year) && Number.isFinite(result.month) && Number.isFinite(result.day)) return result;
  } catch {
    // fall through to the device's local day
  }
  return localCalendarParts(date);
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

function msUntilNextLocalMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Milliseconds until the next calendar day starts in `timeZone`, measured by
 * walking forward to the first minute whose day differs. The walk is capped;
 * if it cannot find the change (an engine whose Intl answers the same day for
 * every instant), it falls back to the next local midnight. Always at least
 * one second, so a caller's timer can never spin.
 */
export function msUntilNextChatDay(now: Date, timeZone?: string): number {
  const fallback = () => Math.max(1_000, msUntilNextLocalMidnight(now));
  if (!Number.isFinite(now.getTime())) return 60_000;
  if (!timeZone) return fallback();
  const today = chatCalendarDayKey(now, timeZone);
  let probe = Math.ceil((now.getTime() + 1) / 60_000) * 60_000;
  // A calendar day is at most 26 hours long, so 27 hourly steps always reach the next one.
  let steps = 0;
  while (chatCalendarDayKey(new Date(probe), timeZone) === today) {
    if (++steps > 27) return fallback();
    probe += 3_600_000;
  }
  // Narrow back to the exact minute: at most 6 ten-minute and 10 one-minute steps.
  for (const step of [600_000, 60_000]) {
    while (probe - step > now.getTime() && chatCalendarDayKey(new Date(probe - step), timeZone) !== today) probe -= step;
  }
  return Math.max(1_000, probe - now.getTime());
}

export type ChatClockDayWatch = {
  /** Called with the new reference "now" when the calendar day has changed. */
  onDayChange: (now: Date) => void;
  timeZone?: string;
  /** The day the caller currently shows; defaults to the current time. */
  shownNow?: Date;
  /**
   * Calls back when the app or tab comes to the front again, and returns its
   * unsubscribe. A timer does not run while a phone or a background tab
   * sleeps; this re-checks the day the moment the chat is visible again.
   */
  subscribeResume?: (onResume: () => void) => () => void;
  /** For tests; defaults to the current time. */
  clock?: () => Date;
};

/**
 * HPD-1215: watches for the calendar day to change. A timer aims at the next
 * midnight, a once-a-minute check and the resume callback cover what a timer
 * misses (sleep over midnight, a changed time zone). `onDayChange` fires only
 * when the day key differs. Returns the cleanup.
 */
export function startChatClockDayWatch({ onDayChange, timeZone, shownNow, subscribeResume, clock = () => new Date() }: ChatClockDayWatch): () => void {
  let stopped = false;
  let dayKey = chatCalendarDayKey(shownNow ?? clock(), timeZone);
  let midnightTimer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    if (stopped) return;
    const current = clock();
    const currentKey = chatCalendarDayKey(current, timeZone);
    if (currentKey !== dayKey) {
      dayKey = currentKey;
      onDayChange(current);
    }
  };
  const aim = () => {
    if (stopped) return;
    midnightTimer = setTimeout(() => {
      check();
      aim();
    }, msUntilNextChatDay(clock(), timeZone) + 250);
  };
  aim();
  const minuteCheck = setInterval(check, 60_000);
  const unsubscribeResume = subscribeResume?.(check);
  // The day may already have changed between the caller's render and now.
  check();
  return () => {
    stopped = true;
    if (midnightTimer) clearTimeout(midnightTimer);
    clearInterval(minuteCheck);
    unsubscribeResume?.();
  };
}

/** Resume on the web: the tab became visible again. No-op where there is no document. */
export function documentVisibilityResume(onResume: () => void): () => void {
  const doc = (globalThis as { document?: { visibilityState?: string; addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void } }).document;
  if (!doc) return () => {};
  const listener = () => {
    if (doc.visibilityState === "visible") onResume();
  };
  doc.addEventListener("visibilitychange", listener);
  return () => doc.removeEventListener("visibilitychange", listener);
}
