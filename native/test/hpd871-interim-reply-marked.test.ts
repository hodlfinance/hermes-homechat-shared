import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { appLocales } from "../core/index";
import { mobileText } from "../src/appI18n";
import { mobileInterimReplyLabel, mobileInterimReplyMark } from "../src/mobile-interim-reply";

// HPD-871. Run run_JCh4lzmu9_uIqi posted four interim texts between 06:49 and
// 06:51Z on 2026-09-24 and never completed; they looked exactly like an answer
// and were read as one. An interim text is now marked while its run works,
// and the mark says so when the run was stopped or failed instead.

const home = "session_home";
const runId = "run_JCh4lzmu9_uIqi";
const interimTexts = ["06:49:02", "06:49:40", "06:50:31", "06:51:12"].map((time, index) => ({
  id: `msg_interim_${index}`,
  role: "assistant" as const,
  runId,
  conversationSessionId: home,
  content: `Zwischenstand ${index + 1}`,
  createdAt: `2026-09-24T${time}.000Z`,
}));

function marks(runStatus: Parameters<typeof mobileInterimReplyMark>[0]["runStatus"], activeRunId: string | null = null) {
  return interimTexts.map((message) => mobileInterimReplyMark({ message, runStatus, activeRunId, openConversationId: home }));
}

test("HPD-871: every interim text is marked while its run is still running", () => {
  assert.deepEqual(marks("running"), ["working", "working", "working", "working"]);
  assert.deepEqual(marks("waiting_for_approval"), ["working", "working", "working", "working"]);
  // Right after a reload the run is the chat's active run before its status is read.
  assert.deepEqual(marks(undefined, runId), ["working", "working", "working", "working"]);
});

test("HPD-871: the mark clears when the run completes, and the last text stands as the answer", () => {
  assert.deepEqual(marks("completed"), [null, null, null, null]);
  assert.deepEqual(marks("completed", runId), [null, null, null, null]);
});

test("HPD-871: a stopped run's texts read stopped, a failed run's texts read interrupted", () => {
  assert.deepEqual(marks("cancelled"), ["stopped", "stopped", "stopped", "stopped"]);
  assert.deepEqual(marks("failed"), ["interrupted", "interrupted", "interrupted", "interrupted"]);

  const de = mobileText("de").chat;
  const en = mobileText("en").chat;
  assert.equal(mobileInterimReplyLabel("working", de), "Arbeitet noch");
  assert.equal(mobileInterimReplyLabel("stopped", de), "Abgebrochen");
  assert.equal(mobileInterimReplyLabel("interrupted", de), "Unterbrochen");
  assert.equal(mobileInterimReplyLabel("working", en), "Still working");
  assert.equal(mobileInterimReplyLabel("stopped", en), "Stopped");
  assert.equal(mobileInterimReplyLabel("interrupted", en), "Interrupted");
});

test("HPD-871: customer texts, finished runs and job or delivery results are never marked", () => {
  const base = { runStatus: "running" as const, activeRunId: null, openConversationId: home };
  assert.equal(mobileInterimReplyMark({ ...base, message: { ...interimTexts[0]!, role: "user" } }), null);
  assert.equal(mobileInterimReplyMark({ ...base, message: { ...interimTexts[0]!, runId: "run_job_3f9a0c" } }), null);
  assert.equal(mobileInterimReplyMark({ ...base, message: { ...interimTexts[0]!, runId: "run_delivery_9d2e11" } }), null);
  // A text whose run this chat is not following carries no mark.
  assert.equal(mobileInterimReplyMark({ ...base, runStatus: undefined, message: interimTexts[0]! }), null);
  // A helper's texts are interim in its own sub-chat only.
  const helper = { ...interimTexts[0]!, runId: "run_delegated_77aa01", conversationSessionId: "session_helper" };
  assert.equal(mobileInterimReplyMark({ ...base, message: helper, openConversationId: "session_helper" }), "working");
  assert.equal(mobileInterimReplyMark({ ...base, message: helper }), null);
});

// Hey Hermes and HODL (Fin) render the same MessageBubble from the shared
// surface. HODL fixes the locale through host.presentation.appLocale; Hey
// follows the account's locale. Both therefore need every locale's copy, the
// mark must not sit behind a host or policy switch, and its colours must come
// from the palette each host paints in.
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("HPD-871 contract: every locale either host can show carries the three labels", () => {
  for (const locale of appLocales) {
    const chat = mobileText(locale).chat;
    for (const key of ["interimWorking", "interimStopped", "interimInterrupted"] as const) {
      assert.ok(chat[key]?.trim(), `${locale}.${key}`);
    }
    assert.notEqual(chat.interimWorking, chat.interimStopped, locale);
    assert.notEqual(chat.interimStopped, chat.interimInterrupted, locale);
  }
});

test("HPD-871 contract: both hosts render the mark on every message, from the palette, apart from Working and Stop", () => {
  const list = surface.slice(surface.indexOf("{visibleMobileMessages.map((message) => ("), surface.indexOf("{visibleChatApprovalCards.map("));
  assert.match(list, /<MessageBubble[\s\S]*interimMark=\{mobileInterimReplyMark\(\{[\s\S]*runStatus: message\.runId \? chatRunStatusesById\[message\.runId\] : null,[\s\S]*activeRunId: activeChatRunId,[\s\S]*openConversationId: activeConversationSessionId,/);
  assert.doesNotMatch(list, /host\.|policy\./);

  const bubble = surface.slice(surface.indexOf("function MessageBubble({"), surface.indexOf("function MobileChatApprovalCard("));
  assert.match(bubble, /!isUser && interimMark \? \(/);
  assert.match(bubble, /accessibilityLabel=\{mobileInterimReplyLabel\(interimMark, copy\)\}/);
  assert.match(bubble, /style=\{interimMark \? styles\.interimReplyText : undefined\}/);
  assert.doesNotMatch(bubble, /host\.|policy\./);

  const styles = surface.slice(surface.indexOf("  interimReplyBadge: {"), surface.indexOf("  messageTime: {\n    alignSelf"));
  assert.ok(styles.length > 0);
  assert.doesNotMatch(styles, /#[0-9a-fA-F]{3,8}\b/, "no fixed colour: each host's palette paints the mark");
  assert.match(styles, /interimReplyText: \{\s*opacity: 0\.62,/);

  // Working and Stop stay in the pending row below the messages, never inside a bubble.
  assert.doesNotMatch(bubble, /PendingAssistantMessage|stopReply/);
  assert.ok(surface.indexOf("{pendingAssistantText || activeChatRunActivityView ? (") > surface.indexOf("{visibleMobileMessages.map((message) => ("));
});
