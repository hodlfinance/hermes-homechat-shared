import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileTranscriptWithoutUnsentFollowUps } from "../src/mobile-message-send";

// HPD-891, Justus on HODL Build 61: a second question sent while the first was
// answering showed "1. Follow-up queued" with Cancel AND a sent bubble in the
// chat. The plane saves a queued follow-up's message at once, and every read of
// the conversation brought it into the transcript. It belongs only in the
// queue until it is sent; Cancel leaves no trace.

const first = { id: "msg_1", runId: "run_first", role: "user", content: "Warum ist die Allianz-Aktie heute gefallen?" };
const answer = { id: "msg_2", runId: "run_first", role: "assistant", content: "..." };
const queuedMessage = { id: "msg_3", runId: "run_queued", role: "user", content: "Lohnt sich ein Einstieg bei ASML?" };
const transcript = [first, answer, queuedMessage];

test("HPD-891: a queued follow-up is not a chat bubble while it waits", () => {
  for (const status of ["queueing", "queued", "cancelling", "cancelled"] as const) {
    assert.deepEqual(
      mobileTranscriptWithoutUnsentFollowUps(transcript, [{ runId: "run_queued", status }]).map((message) => message.id),
      ["msg_1", "msg_2"],
      status,
    );
  }
});

test("HPD-891: it becomes a bubble once it is sent, and a failed one stays visible", () => {
  for (const status of ["running", "failed"] as const) {
    assert.deepEqual(
      mobileTranscriptWithoutUnsentFollowUps(transcript, [{ runId: "run_queued", status }]).map((message) => message.id),
      ["msg_1", "msg_2", "msg_3"],
      status,
    );
  }
  // Completed follow-ups leave the queue; their messages are ordinary history.
  assert.equal(mobileTranscriptWithoutUnsentFollowUps(transcript, []).length, 3);
});

test("HPD-891: a follow-up cancelled before it was sent never comes back from a later read", () => {
  assert.deepEqual(
    mobileTranscriptWithoutUnsentFollowUps(transcript, [], new Set(["run_queued"])).map((message) => message.id),
    ["msg_1", "msg_2"],
  );
});

test("HPD-891: the chat draws its transcript through that filter, and Cancel records the withdrawn run", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /homechatTranscriptMessages\(\s*mobileTranscriptWithoutUnsentFollowUps\(messages, queuedFollowUps, withdrawnFollowUpRunIds\)/);
  const cancel = source.slice(source.indexOf("async function cancelQueuedFollowUp("));
  const beforeStart = cancel.slice(0, cancel.indexOf("updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: \"cancelling\" });"));
  assert.match(beforeStart, /setWithdrawnFollowUpRunIds\(\(current\) => new Set\(\[\.\.\.current, withdrawnRunId\]\)\)/);
});
