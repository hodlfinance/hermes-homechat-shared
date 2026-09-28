import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAutomationThreadReadAnswer,
  automationThreadReadTarget,
  automationThreadUnreadBadge,
  automationThreads,
  mobileDrawerSections,
  type AutomationThreadSession,
} from "@hodlfinance/hermes-homechat-shared/native/automation-thread-navigation";
import {
  FINHERMES_SUGGESTIONS,
  emptyFinSuggestionsState,
  finHermesSuggestionDraft,
  finSuggestionCardQualification,
} from "@hodlfinance/hermes-homechat-shared/native/fin-suggestions";

type WebSession = AutomationThreadSession & { surfaceOrigin: "finhermes" };

function session(id: string, overrides: Partial<WebSession> = {}): WebSession {
  return {
    id,
    title: id,
    role: "chat",
    status: "active",
    automationJobId: `job-${id}`,
    unreadCount: 2,
    lastMessageAt: "2026-09-28T12:00:00.000Z",
    updatedAt: "2026-09-28T12:00:00.000Z",
    createdAt: "2026-09-28T11:00:00.000Z",
    surfaceOrigin: "finhermes",
    ...overrides,
  };
}

test("Web hosts receive the native drawer order and canonical automation-thread selection", () => {
  assert.deepEqual(mobileDrawerSections({ suggestions: true, connectGmail: false }),
    ["primary", "automationThreads", "pages", "newPage", "suggestions"]);
  const sessions = [
    session("home", { role: "home" }),
    session("older", { lastMessageAt: "2026-09-27T12:00:00.000Z" }),
    session("chat", { automationJobId: null }),
    session("unknown-status", { status: undefined }),
    session("archived", { status: "archived" }),
    session("newer"),
  ];
  assert.deepEqual(automationThreads(sessions).map((entry) => entry.id), ["newer", "older"]);
  assert.equal(automationThreadUnreadBadge("newer", undefined, "en"), null);
  assert.equal(automationThreadUnreadBadge("newer", 120, "en")?.label, "99+");
});

test("Web read acknowledgement requires the visible rendered message and ignores a stale answer", () => {
  const thread = session("thread");
  const first = { id: "message-1", conversationSessionId: thread.id, createdAt: "2026-09-28T12:00:00.000Z" };
  const second = { id: "message-2", conversationSessionId: thread.id, createdAt: "2026-09-28T12:01:00.000Z" };
  const input = {
    session: thread,
    activeConversationId: thread.id,
    inFront: true,
    renderedMessages: [first, second, { ...second, id: "optimistic", optimistic: true }],
    acknowledgedMessageId: null,
  };
  assert.deepEqual(automationThreadReadTarget(input), { conversationId: thread.id, messageId: second.id });
  assert.equal(automationThreadReadTarget({ ...input, inFront: false }), null);
  assert.equal(automationThreadReadTarget({ ...input, session: session("thread", { unreadCount: undefined }) }), null);
  assert.equal(automationThreadReadTarget({ ...input, acknowledgedMessageId: second.id }), null);

  const current = applyAutomationThreadReadAnswer([thread], { id: thread.id, unreadCount: 0 }, {
    messageId: second.id,
    acknowledgedMessageId: second.id,
  });
  assert.equal(current[0]?.unreadCount, 0);
  assert.equal(current[0]?.surfaceOrigin, "finhermes");
  assert.equal(applyAutomationThreadReadAnswer(current, { id: thread.id }, {
    messageId: second.id,
    acknowledgedMessageId: second.id,
  }), current, "an answer without the server count cannot clear a badge");
  assert.equal(applyAutomationThreadReadAnswer(current, { id: thread.id, unreadCount: 2 }, {
    messageId: first.id,
    acknowledgedMessageId: second.id,
  }), current);
});

test("the separate Fin suggestion export keeps a draft editable and has no account storage", () => {
  const suggestion = FINHERMES_SUGGESTIONS[0];
  assert.ok(suggestion);
  const draft = finHermesSuggestionDraft(suggestion);
  assert.ok(draft.includes(suggestion.opener));
  assert.equal(finSuggestionCardQualification(emptyFinSuggestionsState(), {
    now: new Date("2026-09-28T12:00:00.000Z"),
    automationCount: null,
  }), "automations_unknown");
});
