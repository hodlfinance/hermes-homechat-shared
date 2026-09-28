import assert from "node:assert/strict";
import test from "node:test";
import {
  chatRunStatusFromEvent,
  chatRunStatusWithOpenClarify,
  visibleChatClarifyRequests,
  type ChatRunEvent,
} from "../core/index";

const now = Date.parse("2026-09-28T12:00:00.000Z");
function event(runId: string, id: string, type: ChatRunEvent["type"], payload: ChatRunEvent["payload"]): ChatRunEvent {
  return { id, runId, type, payload, createdAt: "2026-09-28T11:59:00.000Z" };
}
function question(runId: string, id: string): ChatRunEvent {
  return event(runId, `event-${id}`, "message_delta", {
    requiresUserReply: true,
    clarifyRequest: {
      id, question: "Choose one", choices: ["First", "Second"], allowOther: true,
      expiresAt: "2026-09-28T12:10:00.000Z",
    },
  });
}

test("the shared public core reveals a clarify before the next status poll", () => {
  const delta = question("run-a", "clarify-a");
  assert.equal(chatRunStatusFromEvent(delta), "waiting_for_approval");
  assert.equal(chatRunStatusWithOpenClarify("running", [delta], { now }), "waiting_for_approval");
  assert.deepEqual(visibleChatClarifyRequests(
    { "run-a": "running", "run-b": "completed" },
    { "run-a": [delta], "run-b": [question("run-b", "clarify-b")] },
    { now },
  ).map(({ runId, clarify }) => [runId, clarify.id]), [["run-a", "clarify-a"]]);
});

test("resolution removes only the answered run's card after replay", () => {
  const resolved = event("run-a", "resolved", "status", {
    status: "running", clarifyId: "clarify-a", clarifyResolved: true,
  });
  assert.equal(chatRunStatusFromEvent(resolved), "running");
  assert.deepEqual(visibleChatClarifyRequests(
    { "run-a": "waiting_for_approval", "run-b": "waiting_for_approval" },
    { "run-a": [question("run-a", "clarify-a"), resolved], "run-b": [question("run-b", "clarify-b")] },
    { now },
  ).map(({ runId }) => runId), ["run-b"]);
});
