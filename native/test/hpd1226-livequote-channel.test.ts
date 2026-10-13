import assert from "node:assert/strict";
import { test } from "node:test";
import { createNativeR8Transport } from "../transport";
import type { NativeR8ChannelIdentity } from "../src/hermes-canonical";
import type { LiveVoiceBinding } from "../src/live-voice-client";

// HPD-1226: LiveQuote iOS renders this chat with its own channel,
// `livequote_mobile`. A finance approval is shown only when its channel is the
// one this surface is bound to; HODL and LiveQuote never accept each other's.

const proposal = (channel: string) => ({
  approvalId: "12260000-0000-4000-8000-000000000001",
  actionId: "12260000-0000-4000-8000-000000000001",
  kind: "finance_tool_action",
  family: "hodl",
  tool: "hodl_add_watchlist_item",
  payloadSha256: "a".repeat(64),
  approvalVersion: 1,
  canonicalRunId: "run_a",
  canonicalConversationId: "conversation_a",
  originSurface: "finhermes",
  confirmationSurface: "finhermes",
  channel,
  review: {
    version: 1, family: "hodl", tool: "hodl_add_watchlist_item",
    title: "Add AAPL?", summary: "Hermes wants to update your watchlist.",
    fields: [{ key: "market", label: "Market", value: "AAPL" }],
  },
  expiresAt: "2026-10-13T00:15:00.000Z",
});

const transportFor = (channel: NativeR8ChannelIdentity["channel"], answered: string, calls: Array<{ url: string; init?: RequestInit }> = []) =>
  createNativeR8Transport({
    baseUrl: "https://finhermes.test/api",
    identity: { surface: "finhermes", channel, allowedSurfaces: ["finhermes"] },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      const body = String(url).includes("/tools/action-approvals?")
        ? { status: "ok", approvals: [proposal(answered)], recoveries: [] }
        : { status: "ok" };
      return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    },
  });

const pending = (transport: ReturnType<typeof transportFor>) =>
  transport.listPendingFinanceActionApprovals({ token: "test-session", conversationSessionId: "conversation_a" });

test("a LiveQuote surface shows a finance approval of its own channel and returns that channel", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const transport = transportFor("livequote_mobile", "livequote_mobile", calls);
  const [approval] = await pending(transport);
  assert.ok(approval);
  assert.equal(approval.channel, "livequote_mobile");
  await transport.confirmFinanceActionApproval({ token: "test-session", approval });
  assert.deepEqual(JSON.parse(String(calls[1]!.init?.body)).context, {
    canonicalRunId: "run_a",
    canonicalConversationId: "conversation_a",
    originSurface: "finhermes",
    confirmationSurface: "finhermes",
    channel: "livequote_mobile",
  });
});

test("HODL and LiveQuote never accept each other's finance approval", async () => {
  await assert.rejects(pending(transportFor("livequote_mobile", "hodl_mobile")), /Finance approval response was invalid/);
  await assert.rejects(pending(transportFor("hodl_mobile", "livequote_mobile")), /Finance approval response was invalid/);
  await assert.rejects(pending(transportFor("livequote_mobile", "livequote_web")), /Finance approval response was invalid/);
});

test("HODL keeps its channel", async () => {
  const [approval] = await pending(transportFor("hodl_mobile", "hodl_mobile"));
  assert.equal(approval?.channel, "hodl_mobile");
});

test("live voice may be bound to the LiveQuote channel of the finhermes surface", () => {
  const bindings: LiveVoiceBinding[] = [
    { surface: "finhermes", channel: "hodl_mobile" },
    { surface: "finhermes", channel: "livequote_mobile" },
  ];
  assert.deepEqual(bindings.map((binding) => binding.channel), ["hodl_mobile", "livequote_mobile"]);
});
