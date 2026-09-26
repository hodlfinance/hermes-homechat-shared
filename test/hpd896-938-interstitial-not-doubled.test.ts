import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomechatClientState,
  homechatStreamingTextFromPayloads,
  reconcileHomechatFinalAnswer,
  reduceHomechatClientState,
  streamingTextFromHomechatEvents,
} from "../src/index.js";

// HPD-896 (second finding) and HPD-938.
//
// QA-A, HODL Build 81, 26.09.2026 15:24-15:27 CEST: after a clarify card was
// answered, the reply bubble read "X.Q?X" -- the answer X, the clarify
// question Q glued to it, and X again:
//   "...sobald sie eingerichtet ist.Was soll die Automation für deine Aktien
//    tun und wie oft soll sie laufen?Ich habe die Erstellung ... gestartet ..."
// Before the card was answered, Q also stood as reply text under the card.
//
// fc-e2e-2, Hey web, 26.09.2026 ~13:15Z: the same shape around Hermes'
// compaction notice, "X 🗜️ Compacting context ... X".
//
// Two mechanisms, both measured in the code:
// 1. The model writes the question as ordinary text and then calls the clarify
//    tool with the same question. The ordinary text arrives as a normal delta
//    before the clarify delta, so the filter for clarify deltas lets it through.
// 2. The completed answer ends with the streamed draft (final "QX", draft "X").
//    reconcileHomechatFinalAnswer merged the draft in front of it and kept the
//    longer "X" + "QX".

const question = "Was soll die Automation für deine Aktien tun und wie oft soll sie laufen?";
const answer = "Ich habe die Erstellung der wöchentlichen Watchlist-Automation gestartet.";

const interimQuestion = {
  id: "evt_interim",
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: "2026-09-26T13:24:50.000Z",
  payload: { content: question, messageId: "hhw_interim", platform: "heyhermes_web", source: "hermes_gateway" },
};
const clarifyDelta = {
  id: "evt_clarify",
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: "2026-09-26T13:24:51.000Z",
  payload: {
    clarifyId: "hhw_clarify_1",
    clarifyRequest: { id: "hhw_clarify_1", question, choices: ["Täglich", "Wöchentlich"] },
    content: question,
    delta: question,
    messageId: "hhw_clarify_abc",
    platform: "heyhermes_web",
    requiresUserReply: true,
    source: "hermes_gateway",
  },
};
const replyDelta = {
  id: "evt_reply",
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: "2026-09-26T13:26:10.000Z",
  payload: { content: answer, messageId: "hhw_reply", platform: "heyhermes_web", source: "hermes_gateway" },
};

test("HPD-896: a completed answer that already contains the draft is taken as it is", () => {
  // The exact QA-A shape: the stored answer is Q+X, the live draft is X.
  assert.equal(reconcileHomechatFinalAnswer(`${question}${answer}`, answer), `${question}${answer}`);
  // HPD-938: the same around the compaction notice.
  const notice = "🗜️ Compacting context — summarizing earlier conversation so I can continue...";
  assert.equal(reconcileHomechatFinalAnswer(`${notice}${answer}`, answer), `${notice}${answer}`);
  // Unchanged: a draft that grew past the final answer still wins.
  assert.equal(reconcileHomechatFinalAnswer("Hello", "Hello world"), "Hello world");
});

test("HPD-896: the question written as text right before its clarify card is the card's, not reply text", () => {
  const events = [interimQuestion, clarifyDelta];
  assert.equal(streamingTextFromHomechatEvents(events), "");
  assert.equal(homechatStreamingTextFromPayloads(events.map((event) => event.payload)), "");
  assert.equal(streamingTextFromHomechatEvents([...events, replyDelta]), answer);
  assert.equal(homechatStreamingTextFromPayloads([...events, replyDelta].map((event) => event.payload)), answer);
});

test("HPD-896: text before the question stays, only the question itself leaves the draft", () => {
  const lead = { ...interimQuestion, payload: { ...interimQuestion.payload, content: `Gern. ${question}` } };
  assert.equal(streamingTextFromHomechatEvents([lead, clarifyDelta]), "Gern.");
  const unrelated = { ...interimQuestion, payload: { ...interimQuestion.payload, content: "Ich schaue kurz nach." } };
  assert.equal(streamingTextFromHomechatEvents([unrelated, clarifyDelta]), "Ich schaue kurz nach.");
});

test("HPD-896: the chat shows the question once while waiting and the answer once after it", () => {
  let state = reduceHomechatClientState(createHomechatClientState(), { type: "run.started", runId: "run_synthetic" });
  state = reduceHomechatClientState(state, { type: "run.event", event: interimQuestion });
  state = reduceHomechatClientState(state, { type: "run.event", event: clarifyDelta });
  assert.equal(state.streamingText, "", "the question stands on the card only");
  state = reduceHomechatClientState(state, { type: "run.event", event: replyDelta });
  assert.equal(state.streamingText, answer);
  // The plane's completed answer as stored before the plane fix: Q+X.
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: {
      id: "evt_done",
      runId: "run_synthetic",
      type: "message_completed",
      createdAt: "2026-09-26T13:26:11.000Z",
      payload: { content: `${question}${answer}`, messageId: "msg_done" },
    },
  });
  const bubble = state.messages.find((message) => message.role === "assistant");
  assert.ok(bubble);
  assert.equal(bubble.content.split(answer).length - 1, 1, "the answer appears exactly once");
});
