import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { mock } from "node:test";
import {
  chatCalendarDayKey,
  chatCalendarDaysBefore,
  chatMessageDayDistance,
  chatYesterdayLabel,
  formatChatMessageTime,
  msUntilNextChatDay,
  startChatClockDayWatch,
} from "../src/chat-message-time";

// HPD-1215 (Justus, 2026-10-12): an older chat message showed only "3:23 PM".
// ICU writes a narrow no-break space before AM/PM; compare on plain spaces.
const plain = (value: string) => value.replace(/[  ]/g, " ");
const fmt = (value: string, locale: string, now: string, timeZone: string) =>
  plain(formatChatMessageTime(value, locale, { now: new Date(now), timeZone }));

const BERLIN = "Europe/Berlin";
// Monday, 12 October 2026, 18:00 in Berlin (CEST, UTC+2).
const NOW = "2026-10-12T16:00:00Z";

test("today: the time only", () => {
  assert.equal(fmt("2026-10-12T13:23:00Z", "de", NOW, BERLIN), "15:23");
  assert.equal(fmt("2026-10-12T13:23:00Z", "en", NOW, BERLIN), "03:23 PM");
  // Just after local midnight is still today.
  assert.equal(fmt("2026-10-11T22:00:00Z", "de", NOW, BERLIN), "00:00");
});

test("yesterday: the localized word plus the time", () => {
  assert.equal(fmt("2026-10-11T13:23:00Z", "en", NOW, BERLIN), "Yesterday 03:23 PM");
  assert.equal(fmt("2026-10-11T13:23:00Z", "de", NOW, BERLIN), "Gestern 15:23");
  assert.equal(fmt("2026-10-11T13:23:00Z", "fr", NOW, BERLIN), "Hier 15:23");
  assert.equal(fmt("2026-10-11T13:23:00Z", "es", NOW, BERLIN), "Ayer 15:23");
  assert.equal(fmt("2026-10-11T13:23:00Z", "pt-BR", NOW, BERLIN), "Ontem 15:23");
  assert.equal(fmt("2026-10-11T13:23:00Z", "ja", NOW, BERLIN), "昨日 15:23");
  // One minute before local midnight is yesterday, though it is under 24 hours ago.
  assert.equal(fmt("2026-10-11T21:59:00Z", "de", NOW, BERLIN), "Gestern 23:59");
});

test("the last seven days: the weekday plus the time", () => {
  // Saturday 10 October and Tuesday 6 October 2026.
  assert.equal(fmt("2026-10-10T13:23:00Z", "en", NOW, BERLIN), "Saturday 03:23 PM");
  assert.equal(fmt("2026-10-10T13:23:00Z", "de", NOW, BERLIN), "Samstag, 15:23");
  assert.equal(fmt("2026-10-06T13:23:00Z", "de", NOW, BERLIN), "Dienstag, 15:23");
  assert.match(fmt("2026-10-06T13:23:00Z", "es", NOW, BERLIN), /^martes,? 15:23$/);
});

test("older: the date plus the time, no year in the current year", () => {
  // Seven days back is Monday again, so it reads as a date.
  assert.equal(fmt("2026-10-05T13:23:00Z", "en", NOW, BERLIN), "Oct 5, 03:23 PM");
  assert.equal(fmt("2026-10-05T13:23:00Z", "de", NOW, BERLIN), "5. Okt., 15:23");
  assert.equal(fmt("2026-03-01T14:00:00Z", "de", NOW, BERLIN), "1. März, 15:00");
});

test("older from an earlier year carries the year", () => {
  assert.equal(fmt("2025-12-24T17:30:00Z", "de", NOW, BERLIN), "24. Dez. 2025, 18:30");
  assert.equal(fmt("2025-12-24T17:30:00Z", "en", NOW, BERLIN), "Dec 24, 2025, 06:30 PM");
});

test("year boundary: New Year's Eve is yesterday, then a weekday, then a dated year", () => {
  const newYear = "2027-01-01T09:00:00Z"; // Friday 1 January 2027, 10:00 Berlin
  assert.equal(fmt("2026-12-31T20:00:00Z", "de", newYear, BERLIN), "Gestern 21:00");
  assert.equal(fmt("2026-12-29T20:00:00Z", "de", newYear, BERLIN), "Dienstag, 21:00");
  assert.equal(fmt("2026-12-20T20:00:00Z", "de", newYear, BERLIN), "20. Dez. 2026, 21:00");
  assert.equal(fmt("2026-12-20T20:00:00Z", "en", newYear, BERLIN), "Dec 20, 2026, 09:00 PM");
});

test("the time zone decides the day, not UTC", () => {
  // 23:30 UTC on 11 October is already 12 October in Berlin and Tokyo, still 11 October in New York.
  const message = "2026-10-11T23:30:00Z";
  const now = "2026-10-12T12:00:00Z";
  assert.equal(fmt(message, "de", now, BERLIN), "01:30");
  assert.equal(fmt(message, "ja", now, "Asia/Tokyo"), "08:30");
  assert.equal(fmt(message, "en", now, "America/New_York"), "Yesterday 07:30 PM");
  assert.equal(chatCalendarDayKey(new Date(message), "UTC"), "2026-10-11");
  assert.equal(chatCalendarDayKey(new Date(message), BERLIN), "2026-10-12");
});

test("daylight saving change does not shift the day count", () => {
  // Berlin leaves summer time on Sunday 25 October 2026.
  const now = new Date("2026-10-26T08:00:00Z");
  assert.equal(chatCalendarDaysBefore(new Date("2026-10-24T22:30:00Z"), now, BERLIN), 1);
  assert.equal(chatMessageDayDistance(new Date("2026-10-24T21:30:00Z"), now, BERLIN), "this-week");
});

test("a later day than now, and unreadable values", () => {
  assert.equal(chatMessageDayDistance(new Date("2026-10-13T10:00:00Z"), new Date(NOW), BERLIN), "older");
  assert.equal(formatChatMessageTime("not a date", "en", { now: new Date(NOW) }), "");
  assert.equal(formatChatMessageTime("", "en"), "");
  assert.equal(formatChatMessageTime(null, "en"), "");
  // An unknown time zone falls back to the device zone instead of throwing.
  assert.notEqual(formatChatMessageTime("2026-10-12T13:23:00Z", "en", { now: new Date(NOW), timeZone: "Mars/Olympus" }), "");
});

test("every app locale has its own word for yesterday", () => {
  const words = ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"].map(chatYesterdayLabel);
  assert.deepEqual(words, ["Yesterday", "Gestern", "Hier", "Ayer", "Ieri", "Ontem", "昨日", "어제"]);
  assert.equal(chatYesterdayLabel("nl"), "Yesterday");
});

test("the next day starts exactly at local midnight", () => {
  assert.equal(msUntilNextChatDay(new Date(NOW), BERLIN), 6 * 3_600_000);
  assert.equal(msUntilNextChatDay(new Date("2026-10-12T21:59:30Z"), BERLIN), 30_000);
  assert.equal(msUntilNextChatDay(new Date(NOW), "Asia/Kolkata"), (2 * 60 + 30) * 60_000);
  // Never less than a second, so a timer cannot spin.
  assert.equal(msUntilNextChatDay(new Date("2026-10-12T21:59:59.900Z"), BERLIN), 1_000);
});

test("the app's message bubble uses the shared formatter and the midnight clock", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /const chatClockNow = useChatClockDay\(\{ subscribeResume: appStateResume \}\);/);
  assert.match(surface, /AppState\.addEventListener\("change"/);
  assert.match(surface, /now=\{chatClockNow\}/);
  assert.match(surface, /formatMessageTime\(message\.createdAt, locale, now\)/);
  assert.match(surface, /formatChatMessageTime\(createdAt, locale, \{ now \}\)/);
  assert.doesNotMatch(surface, /function formatMessageTime[^}]*hour: "2-digit"/);
});

test("a broken Intl.formatToParts cannot hang the midnight timer or give a NaN day", () => {
  const original = Intl.DateTimeFormat.prototype.formatToParts;
  try {
    // An engine whose parts are not numbers: the local getters answer instead.
    Intl.DateTimeFormat.prototype.formatToParts = function () { return []; };
    const key = chatCalendarDayKey(new Date(NOW), BERLIN);
    assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
    const started = Date.now();
    const ms = msUntilNextChatDay(new Date(NOW), BERLIN);
    assert.ok(ms >= 1_000 && ms <= 26 * 3_600_000, `got ${ms}`);
    // An engine that answers the same day for every instant: the walk is capped.
    Intl.DateTimeFormat.prototype.formatToParts = function () {
      return [
        { type: "month", value: "1" },
        { type: "literal", value: "/" },
        { type: "day", value: "1" },
        { type: "literal", value: "/" },
        { type: "year", value: "2026" },
      ];
    };
    const capped = msUntilNextChatDay(new Date(NOW), BERLIN);
    assert.ok(capped >= 1_000 && capped <= 26 * 3_600_000, `got ${capped}`);
    // And a throwing one.
    Intl.DateTimeFormat.prototype.formatToParts = function () { throw new RangeError("no"); };
    assert.ok(msUntilNextChatDay(new Date(NOW), BERLIN) >= 1_000);
    assert.ok(Date.now() - started < 1_000, "bounded time");
  } finally {
    Intl.DateTimeFormat.prototype.formatToParts = original;
  }
});

test("the clock watch fires once at midnight, re-checks on resume, and cleans up", () => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"], now: new Date("2026-10-12T21:30:00Z") });
  try {
    const changes: string[] = [];
    let resume: (() => void) | null = null;
    let unsubscribed = false;
    const stop = startChatClockDayWatch({
      timeZone: BERLIN,
      onDayChange: (now) => changes.push(now.toISOString()),
      subscribeResume: (onResume) => {
        resume = onResume;
        return () => { unsubscribed = true; };
      },
    });
    // 23:30 Berlin: nothing for 29 minutes.
    mock.timers.tick(29 * 60_000);
    assert.deepEqual(changes, []);
    // Midnight Berlin (22:00Z) plus the 250 ms margin.
    mock.timers.tick(60_000 + 250);
    assert.equal(changes.length, 1);
    assert.equal(chatCalendarDayKey(new Date(changes[0]!), BERLIN), "2026-10-13");
    // Minute checks and a resume on the same day change nothing.
    mock.timers.tick(10 * 60_000);
    resume!();
    assert.equal(changes.length, 1);
    stop();
    assert.equal(unsubscribed, true);
    // After cleanup no timer fires, even across the next midnight.
    mock.timers.tick(26 * 3_600_000);
    resume!();
    assert.equal(changes.length, 1);
  } finally {
    mock.timers.reset();
  }
});

test("the clock watch catches a day missed while asleep on resume", () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-12T20:00:00Z") });
  try {
    const changes: Date[] = [];
    let resume: (() => void) | null = null;
    const stop = startChatClockDayWatch({
      timeZone: BERLIN,
      onDayChange: (now) => changes.push(now),
      subscribeResume: (onResume) => { resume = onResume; return () => {}; },
    });
    // The clock jumps (the device slept); no timer ran.
    mock.timers.setTime(new Date("2026-10-13T06:00:00Z").getTime());
    resume!();
    assert.equal(changes.length, 1);
    stop();
  } finally {
    mock.timers.reset();
  }
});
