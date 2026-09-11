import assert from "node:assert/strict";
import test from "node:test";
import { createHomechatClientController } from "../../src/index";
import { reconcileMobileRunBoundMessages } from "../src/mobile-run-binding";
import {
  mobileQueuedFollowUpNoticeVisible,
  mobileQueuedFollowUpSnapshotAfterStatus,
  mobileQueuedFollowUpShouldEnterTranscript,
} from "../src/mobile-message-send";
import type { ChatRunStatus } from "../core/index";

test("a server running event removes a queue card before another snapshot arrives", () => {
  assert.equal(mobileQueuedFollowUpNoticeVisible({
    activeRunId: null,
    queued: { runId: "follow-up", status: "queued" },
    runStatus: "running",
  }), false);
});

test("takeover reuses canonical messages and rejects other-run, queued, and late terminal transitions", () => {
  const queued = { id: "follow-up", status: "queued" as ChatRunStatus, messages: [] };
  for (const status of ["queued", "completed", "cancelled", "failed"] as const) {
    assert.equal(mobileQueuedFollowUpSnapshotAfterStatus(queued, queued.id, status), null);
  }
  assert.equal(mobileQueuedFollowUpSnapshotAfterStatus(queued, "other", "running"), null);
  assert.equal(mobileQueuedFollowUpSnapshotAfterStatus(null, queued.id, "running"), null);
  for (const status of ["completed", "cancelled", "failed", "running"] as const) {
    assert.equal(mobileQueuedFollowUpSnapshotAfterStatus({ ...queued, status }, queued.id, "running"), null);
  }
  for (const status of ["running", "waiting_for_approval"] as const) {
    const adopted = mobileQueuedFollowUpSnapshotAfterStatus(queued, queued.id, status)!;
    assert.equal(adopted.messages, queued.messages);
    assert.equal(adopted.status, status);
    assert.equal(mobileQueuedFollowUpShouldEnterTranscript(adopted), true);
  }
});

test("an open status stream promotes a saved follow-up exactly once without waiting for completion or polling", async () => {
  const user = { id: "saved-user", runId: "follow-up", conversationSessionId: "home", role: "user" as const, content: "Synthetic question" };
  const queued = { id: "follow-up", status: "queued" as ChatRunStatus, messages: [user] };
  let snapshot: typeof queued | null = null;
  let visible: typeof user[] = [];
  let promotions = 0;
  let release!: () => void;
  let observed!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const runningObserved = new Promise<void>((resolve) => { observed = resolve; });
  const controller = createHomechatClientController({
    transport: {
      getRun: async () => { throw new Error("No polling before terminal"); },
      streamRun: async (_id, context) => {
        await context.onEvent({ type: "run.status", runId: queued.id, payload: {} });
        await context.onEvent({ type: "run.status", runId: queued.id, payload: { action: "chat.tool_exposure" } });
        assert.deepEqual(visible, []);
        assert.equal(promotions, 0);
        await context.onEvent({ type: "run.status", runId: queued.id, payload: { status: "running" } });
        await context.onEvent({ type: "run.status", runId: queued.id, payload: { status: "running" } });
        observed();
        await held;
        await context.onEvent({ type: "run.status", runId: queued.id, payload: { status: "completed" } });
      },
    },
    onSnapshot: (run: typeof queued) => { snapshot = run; },
    onEvent: (event) => {
      if (event.type !== "run.status") return;
      const adopted = mobileQueuedFollowUpSnapshotAfterStatus(snapshot, event.runId!, event.payload.status as ChatRunStatus);
      if (!adopted) return;
      snapshot = adopted;
      promotions += 1;
      visible = reconcileMobileRunBoundMessages({ conversationSessionId: "home", current: visible, incoming: adopted.messages });
    },
  });
  const following = controller.follow(queued);
  try {
    await runningObserved;
    assert.deepEqual(visible, [user]);
    assert.equal(promotions, 1);
  } finally { release(); }
  await following;
  assert.equal(promotions, 1);
});
