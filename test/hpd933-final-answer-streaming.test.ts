import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomechatClientState,
  homechatDraftIsReplacedSnapshots,
  homechatStreamingTextFromPayloads,
  reconcileHomechatFinalAnswer,
  reduceHomechatClientState,
  streamingTextFromHomechatEvents,
  type SharedHomechatClientState,
} from "../src/index.js";

// HPD-933. The runtime now streams the answer word by word. Every delta is the
// whole current draft (`replace`). Text a model call wrote before it called a
// tool is withdrawn by an empty `retracted` delta when the tool starts; the
// completed answer is authoritative. Synthetic payload shapes as the Hey Hermes
// gateway adapter posts them to the plane.
const delta = (index: number, content: string, segmentId: string, extra: Record<string, unknown> = {}) => ({
  id: `evt_${index}`,
  runId: "run_synthetic",
  type: "message_delta",
  createdAt: `2026-09-26T12:00:${String(10 + index).padStart(2, "0")}.000Z`,
  payload: {
    chatId: "session_default_ws_synthetic",
    content,
    delta: content,
    messageId: `hhw_${segmentId}`,
    platform: "heyhermes_web",
    source: "hermes_gateway",
    replace: true,
    segmentId,
    ...extra,
  },
});
const retract = (index: number, segmentId: string) => delta(index, "", segmentId, { retracted: true });

const interim = "Ich schaue kurz in Deinen Kalender.";
const final = "Morgen hast Du zwei Termine: 9 Uhr Zahnarzt und 14 Uhr Steuerberater.";
const events = [
  delta(1, "Ich schaue", "seg_1"),
  delta(2, interim, "seg_1"),
  retract(3, "seg_1"),
  delta(4, "Morgen hast Du", "seg_2"),
  delta(5, "Morgen hast Du zwei Termine: 9 Uhr", "seg_2"),
  delta(6, final, "seg_2"),
];

test("HPD-933: replace deltas are whole drafts and a retraction empties the draft", () => {
  assert.equal(homechatStreamingTextFromPayloads(events.slice(0, 2).map((event) => event.payload)), interim);
  assert.equal(homechatStreamingTextFromPayloads(events.slice(0, 3).map((event) => event.payload)), "");
  assert.equal(homechatStreamingTextFromPayloads(events.map((event) => event.payload)), final);
  assert.equal(streamingTextFromHomechatEvents(events.slice(0, 3)), "");
  assert.equal(streamingTextFromHomechatEvents(events), final);
});

test("HPD-933: a replace snapshot that shrinks is taken as it is, never merged", () => {
  const payloads = [delta(1, "Die Antwort ist lang.", "seg_1").payload, delta(2, "Die Antwort", "seg_1").payload];
  assert.equal(homechatStreamingTextFromPayloads(payloads), "Die Antwort");
});

test("HPD-933: the completed answer is authoritative over a replaced draft", () => {
  const payloads = events.map((event) => event.payload);
  assert.equal(homechatDraftIsReplacedSnapshots(payloads), true);
  // A plane that already normalised the answer sends a different final text.
  const normalized = `${final}\n\nI added "Kalender" to your sidebar.`;
  assert.equal(
    reconcileHomechatFinalAnswer(normalized, `${interim}${final}`, { finalIsAuthoritative: true }),
    normalized,
  );
  // An empty answer never erases the draft; a plain delta is no snapshot.
  assert.equal(reconcileHomechatFinalAnswer("", interim, { finalIsAuthoritative: true }), interim);
  assert.equal(homechatDraftIsReplacedSnapshots([{ content: "old", delta: "old" }]), false);
});

test("HPD-933: the app state never shows interim text next to the answer", () => {
  let state: SharedHomechatClientState = reduceHomechatClientState(createHomechatClientState(), {
    type: "run.started",
    runId: "run_synthetic",
  });
  const seen: string[] = [];
  for (const event of events) {
    state = reduceHomechatClientState(state, { type: "run.event", event });
    seen.push(state.streamingText);
    assert.ok(
      !(state.streamingText.includes(interim) && state.streamingText.includes("Morgen")),
      `draft mixes interim and answer: ${state.streamingText}`,
    );
  }
  assert.deepEqual(seen, ["Ich schaue", interim, "", "Morgen hast Du", "Morgen hast Du zwei Termine: 9 Uhr", final]);
  assert.equal(state.phase, "streaming");
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: {
      id: "evt_done",
      runId: "run_synthetic",
      type: "message_completed",
      createdAt: "2026-09-26T12:00:30.000Z",
      payload: { content: final, messageId: "msg_final" },
    },
  });
  const assistant = state.messages.filter((message) => message.role === "assistant");
  assert.equal(assistant.length, 1);
  assert.equal(assistant[0]!.content, final);
});

test("HPD-933: after a retraction the run is working again, not replying", () => {
  let state = reduceHomechatClientState(createHomechatClientState(), { type: "run.started", runId: "run_synthetic" });
  for (const event of events.slice(0, 3)) state = reduceHomechatClientState(state, { type: "run.event", event });
  assert.equal(state.streamingText, "");
  assert.notEqual(state.phase, "streaming");
});

test("HPD-933: a completed answer that differs from the replaced draft replaces it in the app", () => {
  let state = reduceHomechatClientState(createHomechatClientState(), { type: "run.started", runId: "run_synthetic" });
  for (const event of events) state = reduceHomechatClientState(state, { type: "run.event", event });
  const rewritten = "Du hast morgen zwei Termine.";
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "evt_done", runId: "run_synthetic", type: "message_completed", payload: { content: rewritten, messageId: "msg_final" } },
  });
  const assistant = state.messages.filter((message) => message.role === "assistant");
  assert.deepEqual(assistant.map((message) => message.content), [rewritten]);
});
