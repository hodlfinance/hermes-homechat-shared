import assert from "node:assert/strict";
import test from "node:test";

// HPD-1215: without an explicit time zone the device zone decides the day.
// This file sets the process zone before the module reads any date.
process.env.TZ = "America/New_York";

const { formatChatMessageTime, chatCalendarDayKey, msUntilNextChatDay } = await import("../src/chat-message-time");
const plain = (value: string) => value.replace(/[  ]/g, " ");

test("no time zone given: the process zone decides today and yesterday", () => {
  // 02:30 UTC on 12 October is 22:30 on 11 October in New York.
  const message = "2026-10-12T02:30:00Z";
  const now = new Date("2026-10-12T16:00:00Z"); // 12:00 New York
  assert.equal(chatCalendarDayKey(new Date(message)), "2026-10-11");
  assert.equal(plain(formatChatMessageTime(message, "en", { now })), "Yesterday 10:30 PM");
  assert.equal(plain(formatChatMessageTime("2026-10-12T15:00:00Z", "de", { now })), "11:00");
});

test("no time zone given: the timer aims at local midnight", () => {
  // 12:00 New York, twelve hours before midnight.
  assert.equal(msUntilNextChatDay(new Date("2026-10-12T16:00:00Z")), 12 * 3_600_000);
});
