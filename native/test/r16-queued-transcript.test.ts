import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createMobileHomeChatSingleFlight } from "../src/mobile-home-chat-startup";
import { reconcileMobileRunBoundMessages } from "../src/mobile-run-binding";
import {
  mobileQueuedFollowUpNoticeVisible,
  mobileQueuedFollowUpShouldEnterTranscript,
} from "../src/mobile-message-send";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("a queued follow-up enters the transcript only after takeover", () => {
  assert.equal(mobileQueuedFollowUpShouldEnterTranscript({ status: "queued", startedAt: null }), false);
  assert.equal(mobileQueuedFollowUpShouldEnterTranscript({ status: "queued", startedAt: "2026-09-10T12:00:00.000Z" }), true);
  assert.equal(mobileQueuedFollowUpShouldEnterTranscript({ status: "running", startedAt: null }), true);
});

test("the queue card leaves when the follow-up is running", () => {
  assert.equal(mobileQueuedFollowUpNoticeVisible({
    activeRunId: null,
    queued: { runId: "run-follow-up", status: "running" },
    runStatus: "running",
  }), false);
});

test("background follow-up sessions do not merge queued messages through live presentation", () => {
  assert.match(surface, /if \(reflectLiveProgress && ownsVisibleConversation\(\)\)/);
  assert.match(surface, /promoteQueuedFollowUpToTranscript\(queued, run\)/);
});

test("a terminal recovered queue preserves its reply after an older foreground refresh", async () => {
  const user = { id: "queued-user", runId: "queued", conversationSessionId: "home", role: "user" as const, content: "queued question", createdAt: "2026-09-10T18:00:01Z" };
  const answer = { ...user, id: "queued-answer", role: "assistant" as const, content: "answer", createdAt: "2026-09-10T18:00:02Z" };
  const completed = [user, answer];
  let visible = completed;
  let releaseOldRead!: () => void;
  const oldRead = new Promise<void>((resolve) => { releaseOldRead = resolve; });
  const refreshes = createMobileHomeChatSingleFlight();
  const foreground = refreshes.run(async () => { await oldRead; visible = []; });
  const followUp = refreshes.runAfterCurrent(async () => {
    visible = reconcileMobileRunBoundMessages({ conversationSessionId: "home", current: visible, incoming: completed });
  });
  releaseOldRead();
  await Promise.all([foreground, followUp]);
  assert.deepEqual(visible, completed);
  assert.deepEqual(reconcileMobileRunBoundMessages({ conversationSessionId: "home", current: visible, incoming: completed }), completed);
  const finish = surface.slice(surface.indexOf("async function finishQueuedFollowUp"), surface.indexOf("function recoverQueuedFollowUp"));
  assert.match(finish, /incoming: finalState\.messages/);
  assert.match(finish, /await refresh\(true\)/);
});
