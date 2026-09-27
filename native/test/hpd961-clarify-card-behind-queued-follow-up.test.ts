import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ChatRunEvent } from "../core/index";
import {
  mobileChatRunStatusWithOpenClarify,
  mobileVisibleChatClarifyRequest,
} from "../src/mobile-chat-user-decision";

// HPD-961, part (b). Justus' Hey guest, 27.09.2026 02:06Z, Hey iOS 111 on
// shared 3adc2d9f: run_QZ35NyyprPeEqL asked a clarifying question while a
// follow-up (run_u3xgXnLlIM_q59) was queued behind it. The app had fetched the
// run's events, the clarify among them, but it never read that older run's
// status again after the follow-up was queued. Its last known status stayed
// "running", `mobileVisibleChatClarifyRequest` returned null, and the chat
// said "Waiting for you" with no card to answer.
//
// The plane writes the clarify event and holds the run on
// waiting_for_approval in one transaction (store.holdChatRunForClarify), and
// every answer leaves a clarifyResolved status event. An unresolved, unexpired
// clarify in a run's events is therefore itself proof that the run waits, as
// long as the run is not known to be finished.

const now = Date.parse("2026-09-27T02:07:00.000Z");
const createdAt = "2026-09-27T02:06:31.381Z";

function event(id: string, type: ChatRunEvent["type"], payload: ChatRunEvent["payload"]): ChatRunEvent {
  return { id, runId: "run_QZ35NyyprPeEqL", createdAt, type, payload };
}

const answerSnapshot = event("evt_answer", "message_delta", {
  source: "hermes_gateway",
  messageId: "hhw_78a944a1fa044741",
  segmentId: "seg_1",
  replace: true,
  content: "Die Symptome halten meist an, bis sie von selbst ver",
});

function clarifyEvent(expiresAt = "2026-09-27T03:06:31.000Z"): ChatRunEvent {
  return event("evt_clarify", "message_delta", {
    source: "hermes_gateway",
    messageId: "hhw_clarify_54d5740ec6ab",
    content: "Soll ich Dir einen Termin eintragen?",
    requiresUserReply: true,
    clarifyId: "54d5740ec6",
    clarifyRequest: {
      id: "54d5740ec6",
      question: "Soll ich Dir einen Termin eintragen?",
      choices: ["Ja", "Nein"],
      allowOther: true,
      expiresAt,
    },
  });
}

test("the card shows from the clarify event when the run's last known status is a stale running", () => {
  const events = [answerSnapshot, clarifyEvent()];
  assert.equal(mobileVisibleChatClarifyRequest("running", events, { now })?.id, "54d5740ec6");
  assert.equal(mobileChatRunStatusWithOpenClarify("running", events, { now }), "waiting_for_approval");
});

test("the card shows when the app never read the run's status at all", () => {
  const events = [answerSnapshot, clarifyEvent()];
  assert.equal(mobileVisibleChatClarifyRequest(undefined, events, { now })?.id, "54d5740ec6");
  assert.equal(mobileChatRunStatusWithOpenClarify(undefined, events, { now }), "waiting_for_approval");
});

test("late text of the same answer after the clarify does not hide the card", () => {
  const lateSnapshot = { ...answerSnapshot, id: "evt_late", payload: { ...answerSnapshot.payload, content: `${answerSnapshot.payload.content}schwinden.` } };
  assert.equal(mobileVisibleChatClarifyRequest("running", [answerSnapshot, clarifyEvent(), lateSnapshot], { now })?.id, "54d5740ec6");
});

test("a finished run never shows the card", () => {
  for (const status of ["completed", "failed", "cancelled"] as const) {
    assert.equal(mobileVisibleChatClarifyRequest(status, [clarifyEvent()], { now }), null);
    assert.equal(mobileChatRunStatusWithOpenClarify(status, [clarifyEvent()], { now }), status);
  }
});

test("an answered clarify stays hidden, from the plane's receipt or from the app's own answer", () => {
  const resolved = event("evt_resolved", "status", { status: "running", clarifyId: "54d5740ec6", clarifyResolved: true });
  assert.equal(mobileVisibleChatClarifyRequest("running", [clarifyEvent(), resolved], { now }), null);
  const answered = new Set(["54d5740ec6"]);
  assert.equal(mobileVisibleChatClarifyRequest("running", [clarifyEvent()], { now, answeredClarifyIds: answered }), null);
  assert.equal(
    mobileVisibleChatClarifyRequest("waiting_for_approval", [clarifyEvent()], { now, answeredClarifyIds: answered }),
    null,
  );
  assert.equal(mobileChatRunStatusWithOpenClarify("running", [clarifyEvent()], { now, answeredClarifyIds: answered }), "running");
});

test("an expired clarify does not turn a stale status into a waiting one", () => {
  const expired = clarifyEvent("2026-09-27T02:06:59.000Z");
  assert.equal(mobileVisibleChatClarifyRequest("running", [expired], { now }), null);
  assert.equal(mobileChatRunStatusWithOpenClarify("running", [expired], { now }), "running");
  // A run the plane itself reports waiting keeps its card; the card says it expired.
  assert.equal(mobileVisibleChatClarifyRequest("waiting_for_approval", [expired], { now })?.id, "54d5740ec6");
});

test("the surface shows, answers and reads back the waiting run from its events", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const visible = surface.slice(surface.indexOf("const visibleChatClarifyRequests"), surface.indexOf("const chatGptPanel"));
  assert.match(visible, /answeredClarifyIds/, "the visible card must know which questions this app already answered");
  const submit = surface.slice(surface.indexOf("async function submitMobileClarify("), surface.indexOf("async function decideFinanceActionApproval("));
  assert.match(submit, /mobileChatRunStatusWithOpenClarify\(/, "answering must accept a run its events prove waiting");
  assert.match(submit, /markClarifyAnswered\(/, "an answered question must leave the screen at once");
  assert.match(surface, /readBackRunsWithOpenClarify/, "a run shown waiting from its events must have its status read back");
  const readBack = surface.slice(surface.indexOf("const readBackRunsWithOpenClarify"), surface.indexOf("readBackRunsWithOpenClarify();"));
  assert.match(readBack, /\.catch\(\(\) => \{[\s\S]*readBackOpenClarifyRunIdsRef\.current\.delete\(runId\)/, "a failed readback must be retried later");
});
