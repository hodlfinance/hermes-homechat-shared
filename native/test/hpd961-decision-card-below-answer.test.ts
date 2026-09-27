import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-961, HODL Build 87, 27.09.2026 (run_wn2BRZm9VEWWcA): Hermes wrote a
// long answer and then asked a clarifying question. The clarify card was drawn
// before the live answer bubble, so it sat above 5,400 characters of text and
// the chat, scrolled to the latest line, showed "Waiting for you" with no card
// in sight. A question Hermes is waiting on belongs after the words it follows.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("decision cards come after the live answer bubble in the transcript", () => {
  const live = surface.indexOf("<PendingAssistantMessage locale={appLocale}");
  const clarify = surface.indexOf("{visibleChatClarifyRequests.map(");
  const approval = surface.indexOf("{visibleChatApprovalCards.map(");
  const lastMessage = surface.indexOf("{visibleMobileMessages.map((message) => (");
  assert.ok(live > 0 && clarify > 0 && approval > 0 && lastMessage > 0);
  assert.ok(lastMessage < live, "the transcript precedes the live bubble");
  assert.ok(live < approval, "the approval card follows the live answer bubble");
  assert.ok(live < clarify, "the clarify card follows the live answer bubble");
  assert.ok(approval < clarify, "approval before clarify, as before");
  assert.equal(surface.split("{visibleChatClarifyRequests.map(").length - 1, 1, "drawn once");
  assert.equal(surface.split("{visibleChatApprovalCards.map(").length - 1, 1, "drawn once");
});
