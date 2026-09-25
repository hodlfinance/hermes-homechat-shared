import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomechatClientState,
  homechatStreamingTextFromPayloads,
  isHomechatClarifyDelta,
  reconcileHomechatFinalAnswer,
  reduceHomechatClientState,
  streamingTextFromHomechatEvents,
} from "../src/index.js";

// HPD-896, Justus on HODL, 25.09.2026 06:29-06:32Z (run_LPTto8EJAOzzF-): three
// clarify questions arrived as message deltas that carry their request. They
// showed in the "Hermes needs one detail" card and, glued together, again as
// reply text under it ("...detail?Shall I create..."); the stored answer was
// the three questions (215 chars) followed by the reply (762). The question
// belongs to the card only.

// The measured payload keys of a clarify delta on the plane, synthetic text.
const clarify = (index: number, question: string) => ({
  id: `evt_clarify_${index}`,
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: `2026-09-25T06:29:${10 + index}.000Z`,
  payload: {
    chatId: "session_default_ws_synthetic",
    clarifyId: `hhw_clarify_${index}`,
    clarifyRequest: { id: `hhw_clarify_${index}`, question, choices: ["Yes", "No"] },
    content: question,
    delta: question,
    messageId: `hhw_clarify_${index}`,
    platform: "heyhermes_web",
    requiresUserReply: true,
    source: "hermes_gateway",
  },
});
const reply = {
  id: "evt_reply",
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: "2026-09-25T06:32:21.000Z",
  payload: { chatId: "session_default_ws_synthetic", content: "Done: the daily brief is set up.", delta: "Done: the daily brief is set up.", messageId: "m1", platform: "heyhermes_web", source: "hermes_gateway" },
};
const events = [
  clarify(1, "Which stocks should the digest cover, and how much detail?"),
  clarify(2, "Shall I create the daily brief?"),
  clarify(3, "Which time should it run?"),
  reply,
];

test("HPD-896: a clarify delta is recognised by its request, an ordinary delta is not", () => {
  assert.equal(isHomechatClarifyDelta(events[0]!.payload), true);
  assert.equal(isHomechatClarifyDelta({ clarifyId: "hhw_clarify_9" }), true);
  assert.equal(isHomechatClarifyDelta(reply.payload), false);
  assert.equal(isHomechatClarifyDelta(null), false);
});

test("HPD-896: clarify questions never become reply text, live or in the final answer", () => {
  assert.equal(streamingTextFromHomechatEvents(events), "Done: the daily brief is set up.");
  assert.equal(homechatStreamingTextFromPayloads(events.map((event) => event.payload)), "Done: the daily brief is set up.");
  assert.equal(
    reconcileHomechatFinalAnswer("Done: the daily brief is set up.", streamingTextFromHomechatEvents(events)),
    "Done: the daily brief is set up.",
  );
});

test("HPD-896: the chat state keeps the clarify events for the card but streams no question text", () => {
  let state = reduceHomechatClientState(createHomechatClientState(), { type: "run.started", runId: "run_synthetic" });
  for (const event of events.slice(0, 3)) state = reduceHomechatClientState(state, { type: "run.event", event });
  assert.equal(state.streamingText, "");
  assert.equal(state.events.length, 3, "the card still reads its question from the events");
  state = reduceHomechatClientState(state, { type: "run.event", event: reply });
  assert.equal(state.streamingText, "Done: the daily brief is set up.");
});
