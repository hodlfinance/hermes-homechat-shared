import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/index";
import { HEY_SUPPORT_PROBLEM_MAX_LENGTH, supportProblemContainsLikelySecret } from "../core/support-request";
import {
  HEY_REPLY_REPORT_NOTE_MAX_LENGTH,
  HEY_REPLY_REPORT_REASONS,
  heyReplyReportCopy,
  heyReplyReportEnabled,
  heyReplyReportProblem,
  heyReplyReportable,
} from "../src/hey-reply-report";

/**
 * HPD-1243 F3: "Report this reply" (Google Play, AI-generated content policy).
 * A long-press on a finished Hermes reply on Android, behind the Android launch
 * switch, sends a report through the existing support route. The report names
 * the message, never copies its text or the conversation.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const sheet = readFileSync(new URL("../src/ReplyReportSheet.tsx", import.meta.url), "utf8");

test("the report is on only for Android with the launch switch; iOS never, with the switch on or off", () => {
  assert.equal(heyReplyReportEnabled("android", true), true);
  assert.equal(heyReplyReportEnabled("android", false), false);
  assert.equal(heyReplyReportEnabled("android", undefined), false);
  for (const value of [true, false, undefined]) {
    assert.equal(heyReplyReportEnabled("ios", value), false, `ios with switch ${String(value)}`);
    assert.equal(heyReplyReportEnabled("web", value), false, `web with switch ${String(value)}`);
  }
});

test("only a finished Hermes reply can be reported: not the user's own message, not a running or optimistic one", () => {
  assert.equal(heyReplyReportable({ role: "assistant" }, null), true);
  assert.equal(heyReplyReportable({ role: "assistant" }, "stopped"), true);
  assert.equal(heyReplyReportable({ role: "assistant" }, "interrupted"), true);
  assert.equal(heyReplyReportable({ role: "assistant" }, "working"), false);
  assert.equal(heyReplyReportable({ role: "assistant", optimistic: true }, null), false);
  assert.equal(heyReplyReportable({ role: "user" }, null), false);
});

test("the report names reason, message, conversation, run and reply time, and carries no reply text", () => {
  const problem = heyReplyReportProblem({
    reason: "offensive",
    messageId: "msg_123",
    conversationId: "conv_9",
    runId: "run_7",
    messageCreatedAt: "2026-10-14T08:00:00.000Z",
    note: "  This was rude.  ",
  });
  assert.equal(problem, [
    "Report of a Hermes reply (in-app report).",
    "Reason: offensive",
    "Message: msg_123",
    "Conversation: conv_9",
    "Run: run_7",
    "Reply time: 2026-10-14T08:00:00.000Z",
    "Note: This was rude.",
  ].join("\n"));
  const bare = heyReplyReportProblem({ reason: "other", messageId: "m", conversationId: null, runId: "", messageCreatedAt: "x", note: "" });
  assert.match(bare, /^Conversation: unknown$/m);
  assert.match(bare, /^Run: unknown$/m);
  assert.match(bare, /^Note: none$/m);
});

test("the composed report stays inside the support limit and strips control characters from ids", () => {
  const problem = heyReplyReportProblem({
    reason: "misleading",
    messageId: `a\u0000b${"x".repeat(500)}`,
    conversationId: "c".repeat(500),
    runId: "r".repeat(500),
    messageCreatedAt: "t".repeat(500),
    note: "n".repeat(HEY_REPLY_REPORT_NOTE_MAX_LENGTH + 500),
  });
  assert.ok(problem.length <= HEY_SUPPORT_PROBLEM_MAX_LENGTH, String(problem.length));
  assert.doesNotMatch(problem, /\u0000/);
  assert.equal(supportProblemContainsLikelySecret(problem), false);
});

test("report texts exist in every app language, with three reasons", () => {
  assert.deepEqual([...HEY_REPLY_REPORT_REASONS], ["offensive", "misleading", "other"]);
  const keys = Object.keys(heyReplyReportCopy("en")).sort();
  for (const locale of appLocales) {
    const copy = heyReplyReportCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys, locale);
    for (const [key, value] of Object.entries(copy)) {
      if (typeof value === "string") assert.ok(value.trim(), `${locale}.${key}`);
    }
    for (const reason of HEY_REPLY_REPORT_REASONS) assert.ok(copy.reasons[reason].trim(), `${locale}.reasons.${reason}`);
    if (locale !== "en") assert.notEqual(copy.action, heyReplyReportCopy("en").action, `${locale} is translated`);
  }
  // The sheet says what is and is not sent.
  assert.match(heyReplyReportCopy("en").boundary, /not sent/);
});

test("surface: the bubble gets the report only through the switch, by long-press and as an accessibility action", () => {
  assert.match(surface, /const replyReportEnabled = heyReplyReportEnabled\(Platform\.OS, host\.policy\.heyAndroidLaunchEnabled\);/);
  assert.match(surface, /onReport=\{replyReportEnabled \? openReplyReport : undefined\}/);
  assert.match(surface, /const report = onReport && heyReplyReportable\(message, interimMark\) \? onReport : undefined;/);
  assert.match(surface, /onLongPress=\{report \? \(\) => confirmReplyReport\(\) : undefined\}/);
  assert.match(surface, /accessibilityActions=\{report \? \[\{ name: "report", label: reportCopy\.action \}\] : undefined\}/);
  // Sent through the existing support client; no new route.
  assert.match(surface, /<MobileReplyReportSheet[\s\S]{0,400}client=\{supportRequestClient\}/);
  // The Android back button closes the sheet; the composed text is the only problem text sent.
  assert.match(sheet, /onRequestClose=\{onClose\}/);
  assert.match(sheet, /problem: heyReplyReportProblem\(\{/);
  assert.doesNotMatch(sheet, /message\.content/);
});

test("iOS is unchanged: without a report the bubble is the plain View it was", () => {
  assert.match(surface, /const BubbleContainer = \(onReport \? Pressable : View\) as typeof Pressable;/);
  assert.doesNotMatch(surface, /heyReplyReportEnabled\("ios"/);
  assert.match(surface, /accessible=\{onReport \? Boolean\(report\) : undefined\}/);
  assert.match(surface, /accessible=\{onReport \? Boolean\(report\) : undefined\}/);
});
