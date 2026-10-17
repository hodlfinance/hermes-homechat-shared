import assert from "node:assert/strict";
import test from "node:test";
import { includedAiResetText, includedAiWeekWindow, INCLUDED_AI_WEEK_MS } from "../core/included-ai-week";

// HPD-452: the same rule as hey-hermes packages/core/src/included-ai-week.ts.

test("an account that starts mid-week renews exactly seven days later at its own start time", () => {
  // Wednesday 2026-10-14 15:20:05 UTC.
  const anchor = "2026-10-14T15:20:05.000Z";
  assert.deepEqual(includedAiWeekWindow(anchor, anchor), {
    startsAt: "2026-10-14T15:20:05.000Z",
    resetsAt: "2026-10-21T15:20:05.000Z",
  });
  assert.deepEqual(includedAiWeekWindow(anchor, "2026-10-21T15:20:04.999Z"), {
    startsAt: "2026-10-14T15:20:05.000Z",
    resetsAt: "2026-10-21T15:20:05.000Z",
  });
  assert.deepEqual(includedAiWeekWindow(anchor, "2026-10-21T15:20:05.000Z"), {
    startsAt: "2026-10-21T15:20:05.000Z",
    resetsAt: "2026-10-28T15:20:05.000Z",
  });
  // Across the European DST change on 2026-10-25 the window stays 168 hours.
  const late = includedAiWeekWindow(anchor, "2026-10-30T00:00:00.000Z")!;
  assert.equal(Date.parse(late.resetsAt) - Date.parse(late.startsAt), INCLUDED_AI_WEEK_MS);
  assert.equal(late.startsAt, "2026-10-28T15:20:05.000Z");
  assert.equal(includedAiWeekWindow("not a date", anchor), null);
});

// HPD-452, Justus 2026-10-17: the reset line always names weekday, date and time, e.g.
// "Resets Saturday, Oct 25, 8:00 AM", in the reader's language and local time.
test("the reset always reads as weekday, date and local time, and follows the reader's DST", () => {
  // Saturday 06:00 UTC = 08:00 in Berlin (CEST, UTC+2).
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "en", { timeZone: "Europe/Berlin" }),
    "Resets Saturday, Oct 24, 8:00 AM",
  );
  // After the European DST change on 2026-10-25 Berlin is on CET (UTC+1): 07:00.
  assert.equal(
    includedAiResetText("2026-10-31T06:00:00.000Z", "en", { timeZone: "Europe/Berlin" }),
    "Resets Saturday, Oct 31, 7:00 AM",
  );
  // New York changes on 2026-11-01: the same UTC instant reads 2:00 before, 1:00 after.
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "en", { timeZone: "America/New_York" }),
    "Resets Saturday, Oct 24, 2:00 AM",
  );
  assert.equal(
    includedAiResetText("2026-11-07T06:00:00.000Z", "en", { timeZone: "America/New_York" }),
    "Resets Saturday, Nov 7, 1:00 AM",
  );
  // A local date can differ from the UTC date: Sunday 01:30 in Berlin is Saturday in UTC.
  assert.equal(
    includedAiResetText("2026-10-24T23:30:00.000Z", "de", { timeZone: "Europe/Berlin" }),
    "Erneuert sich am Sonntag, 25. Okt. um 1:30",
  );
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "de", { timeZone: "Europe/Berlin" }),
    "Erneuert sich am Samstag, 24. Okt. um 8:00",
  );
  assert.equal(includedAiResetText(null, "en"), null);
  assert.equal(includedAiResetText("garbage", "en"), null);
});

test("every locale names the weekday, the date and the time, near or far", () => {
  const reset = "2026-10-24T06:00:00.000Z";
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const text = includedAiResetText(reset, locale, { timeZone: "Europe/Berlin" })!;
    const part = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { ...options, timeZone: "Europe/Berlin" }).format(Date.parse(reset));
    assert.ok(text.includes(part({ weekday: "long" })), `${locale} weekday: ${text}`);
    assert.ok(text.includes("24"), `${locale} date: ${text}`);
    assert.ok(text.includes("8:00"), `${locale} time: ${text}`);
    assert.ok(!/[\u202f\u00a0]/.test(text), `${locale} plain spaces: ${text}`);
  }
  // A monthly window's reset, weeks away, reads the same way.
  assert.equal(
    includedAiResetText("2026-11-01T00:00:00.000Z", "en", { timeZone: "UTC" }),
    "Resets Sunday, Nov 1, 12:00 AM",
  );
});
