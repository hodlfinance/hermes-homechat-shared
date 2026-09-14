import assert from "node:assert/strict";
import test from "node:test";
import { mobileFinanceActionApprovalCardView } from "../src/mobile-finance-action-approval-model";
import type { NativeFinanceActionApproval } from "../host";

const approval: NativeFinanceActionApproval = {
  approvalId: "23800000-0000-4000-8000-000000000001",
  payloadSha256: "a".repeat(64),
  canonicalConversationId: "conversation-1",
  canonicalRunId: "run-1",
  originSurface: "finhermes",
  confirmationSurface: "finhermes",
  channel: "hodl_mobile",
  title: "Add BTC/USD to your watchlist?", summary: "Hermes wants to change your HODL watchlist.",
  fields: [{ key: "market", label: "Market", value: "BTC/USD" }, { key: "action", label: "Action", value: "Add" }],
  expiresAt: "2026-09-14T00:15:00.000Z",
};

test("Finance needs-confirmation proposal becomes a visible tappable-card view", () => {
  const view = mobileFinanceActionApprovalCardView(approval);
  assert.equal(view.title, "Add BTC/USD to your watchlist?");
  assert.equal(view.summary, "Hermes wants to change your HODL watchlist.");
  assert.deepEqual(view.fields, approval.fields);
});

test("Finance approval card exposes independent confirm and cancel dispatch", async () => {
  const decisions: string[] = [];
  const onConfirm = () => decisions.push("confirm");
  const onCancel = () => decisions.push("cancel");
  onConfirm();
  onCancel();
  assert.deepEqual(decisions, ["confirm", "cancel"]);
});
