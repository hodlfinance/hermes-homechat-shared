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

test("the reset reads as weekday and local time, and follows the reader's DST", () => {
  const now = Date.parse("2026-10-20T10:00:00.000Z");
  // Saturday 06:00 UTC = 08:00 in Berlin (CEST, UTC+2).
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "en", { timeZone: "Europe/Berlin", now }),
    "Resets Saturday 8:00 AM",
  );
  // A week later Berlin is on CET (UTC+1): the same instant-of-week reads 07:00.
  assert.equal(
    includedAiResetText("2026-10-31T06:00:00.000Z", "en", { timeZone: "Europe/Berlin", now: Date.parse("2026-10-27T10:00:00.000Z") }),
    "Resets Saturday 7:00 AM",
  );
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "en", { timeZone: "America/New_York", now }),
    "Resets Saturday 2:00 AM",
  );
  assert.equal(
    includedAiResetText("2026-10-24T06:00:00.000Z", "de", { timeZone: "Europe/Berlin", now }),
    "Erneuert sich am Samstag um 8:00",
  );
  assert.equal(includedAiResetText(null, "en"), null);
  assert.equal(includedAiResetText("garbage", "en"), null);
});

test("a reset more than a week away names its date, not a weekday", () => {
  const now = Date.parse("2026-10-17T10:00:00.000Z");
  assert.equal(
    includedAiResetText("2026-11-01T00:00:00.000Z", "en", { timeZone: "UTC", now }),
    "Resets Nov 1 12:00 AM",
  );
});
