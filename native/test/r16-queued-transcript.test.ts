import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
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
