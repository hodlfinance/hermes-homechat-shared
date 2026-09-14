import assert from "node:assert/strict";
import test from "node:test";
import type { ApprovalCard, ChatRunEvent, ChatRunStatus } from "../core/index";
import {
  mobileChatUserDecisionStatusFromEvent,
  mobileVisibleChatApprovalCards,
  mobileVisibleChatClarifyRequest,
} from "../src/mobile-chat-user-decision";

const createdAt = "2026-09-14T12:00:00.000Z";

function event(
  id: string,
  type: ChatRunEvent["type"],
  payload: ChatRunEvent["payload"],
): ChatRunEvent {
  return { id, runId: "run_1", createdAt, type, payload };
}

function approvalCard(): ApprovalCard {
  return {
    id: "approval_1",
    workspaceId: "workspace_1",
    accountId: "account_1",
    runId: "run_1",
    conversationSessionId: "conversation_1",
    kind: "connection_change",
    status: "pending",
    risk: "medium",
    title: "Approve this action?",
    summary: "Hermes is waiting for a decision.",
    target: { type: "service", label: "Example" },
    action: { label: "Continue", capabilityId: "example" },
    preview: {},
    permissions: ["example.write"],
    dataLeavingWorkspace: [],
    secretsUsed: [],
    approveLabel: "Approve Once",
    denyLabel: "Cancel",
    requiresTypedConfirmation: null,
    expiresAt: "2026-09-15T12:00:00.000Z",
    createdAt,
    decidedAt: null,
    executedAt: null,
  };
}

test("a live approval or clarification event immediately enters the visible waiting state", () => {
  const approval = event("event_approval", "message_delta", {
    requiresUserReply: true,
    approvalId: "approval_1",
  });
  const clarify = event("event_clarify", "message_delta", {
    requiresUserReply: true,
    clarifyRequest: {
      id: "clarify_1",
      question: "Which account?",
      choices: ["Personal", "Business"],
      allowOther: true,
      expiresAt: "2026-09-15T12:00:00.000Z",
    },
  });

  for (const incoming of [approval, clarify]) {
    const statuses: Record<string, ChatRunStatus> = { run_1: "running" };
    statuses.run_1 = mobileChatUserDecisionStatusFromEvent(incoming) ?? statuses.run_1;
    assert.equal(statuses.run_1, "waiting_for_approval");
    if (incoming === approval) {
      assert.deepEqual(mobileVisibleChatApprovalCards({
        cards: [approvalCard()],
        conversationSessionId: "conversation_1",
        runStatuses: statuses,
      }).map((card) => card.id), ["approval_1"]);
    } else {
      assert.equal(mobileVisibleChatClarifyRequest(statuses.run_1, [incoming])?.id, "clarify_1");
    }
  }
});

test("resolved clarification stays hidden when the same run later waits for approval", () => {
  const clarify = event("event_clarify", "message_delta", {
    requiresUserReply: true,
    clarifyRequest: {
      id: "clarify_1",
      question: "Which account?",
      choices: ["Personal", "Business"],
      allowOther: true,
      expiresAt: "2026-09-15T12:00:00.000Z",
    },
  });
  const resolved = event("event_resolved", "status", {
    status: "running",
    clarifyId: "clarify_1",
    clarifyResolved: true,
  });
  const laterApproval = event("event_later_approval", "message_delta", {
    requiresUserReply: true,
    approvalId: "approval_1",
  });
  const events = [clarify, resolved, laterApproval];
  const status = mobileChatUserDecisionStatusFromEvent(laterApproval);

  assert.equal(status, "waiting_for_approval");
  assert.equal(mobileVisibleChatClarifyRequest(status, events), null);
  assert.deepEqual(mobileVisibleChatApprovalCards({
    cards: [approvalCard()],
    conversationSessionId: "conversation_1",
    runStatuses: { run_1: status },
  }).map((card) => card.id), ["approval_1"]);
});
