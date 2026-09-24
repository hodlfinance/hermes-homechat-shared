import assert from "node:assert/strict";
import test from "node:test";

import type { HermesApiConversation, HermesApiRun } from "../core/index";
import { createNativeR8CanonicalController } from "../src/hermes-canonical";
import {
  mobileHomeChatActiveRunRecovery,
  mobileRunIsForeground,
  type MobileHomeChatActiveRunReference,
} from "../src/mobile-home-chat-startup";
import {
  mobileBlockingRunId,
  mobileStopRunUnlessFinished,
  mobileStoppedRunStatus,
} from "../src/mobile-stop-target";

// HPD-871. After an app reload during a scheduled job, the app took the job's
// run as the reply it was waiting for: Working and Stop stayed on after the
// customer's own reply had finished, and his next question was labelled queued.
// The plane's run payload (hey-hermes apps/api/src/app.ts canonicalRunFromChat)
// carries sourceJobId/sourceExecutionId for a job; delivery and helper runs
// carry no source field and are recognised by their id prefix.

const home = "session_home";

function run(
  id: string,
  status: MobileHomeChatActiveRunReference["status"],
  createdAt: string,
  extra: Partial<MobileHomeChatActiveRunReference> = {},
): MobileHomeChatActiveRunReference {
  return { id, status, createdAt, conversationSessionId: home, startedAt: createdAt, ...extra };
}

test("HPD-871: a reload while a job runs and the customer's reply has completed recovers no active run", () => {
  const recovery = mobileHomeChatActiveRunRecovery([
    run("run_job_3f9a0c", "running", "2026-09-24T06:00:00.000Z", { sourceJobId: "job_morning", sourceExecutionId: "exec_1" }),
    run("run_Llia8JeTURv9rP", "completed", "2026-09-24T06:29:40.000Z"),
  ], home);

  assert.equal(recovery.primaryRun, null);
  assert.deepEqual(recovery.queuedFollowUps, []);
});

test("HPD-871: a job run is recognised by its source field even without the id prefix", () => {
  const recovery = mobileHomeChatActiveRunRecovery([
    run("run_legacy_job", "running", "2026-09-24T06:00:00.000Z", { sourceJobId: "job_morning" }),
  ], home);
  assert.equal(recovery.primaryRun, null);
  assert.equal(mobileRunIsForeground({ id: "run_x", sourceExecutionId: "exec_1" }), false);
  assert.equal(mobileRunIsForeground({ id: "run_x", source_job_id: "job_1" } as { id: string }), false);
});

test("HPD-871: the customer's running reply is still recovered, ahead of an older job run", () => {
  const foreground = run("run_Llia8JeTURv9rP", "running", "2026-09-24T06:29:40.000Z");
  const followUp = run("run_followup", "queued", "2026-09-24T06:29:50.000Z", { startedAt: null });
  const recovery = mobileHomeChatActiveRunRecovery([
    run("run_job_3f9a0c", "running", "2026-09-24T06:00:00.000Z", { sourceJobId: "job_morning" }),
    foreground,
    followUp,
  ], home);

  assert.equal(recovery.primaryRun?.id, foreground.id);
  assert.deepEqual(recovery.queuedFollowUps.map((item) => item.id), [followUp.id]);
});

test("HPD-871: delivery and helper runs are ignored", () => {
  const recovery = mobileHomeChatActiveRunRecovery([
    run("run_delivery_9d2e11", "running", "2026-09-24T06:00:00.000Z"),
    run("run_delegated_77aa01", "running", "2026-09-24T06:01:00.000Z"),
    run("run_delivery_9d2e12", "queued", "2026-09-24T06:02:00.000Z", { startedAt: null }),
  ], home);
  assert.equal(recovery.primaryRun, null);

  const withoutPreference = mobileHomeChatActiveRunRecovery([
    run("run_delivery_9d2e11", "running", "2026-09-24T06:00:00.000Z"),
  ]);
  assert.equal(withoutPreference.primaryRun, null);
  assert.equal(mobileRunIsForeground({ id: "run_Llia8JeTURv9rP", sourceJobId: null }), true);
});

test("HPD-871: Stop never picks a job, delivery or helper run as the blocking run", () => {
  const statuses = {
    run_job_3f9a0c: "running",
    run_delivery_9d2e11: "running",
    run_delegated_77aa01: "waiting_for_approval",
    run_clarify: "waiting_for_approval",
  } as const;
  assert.equal(
    mobileBlockingRunId(statuses, ["run_job_3f9a0c", "run_delivery_9d2e11", "run_delegated_77aa01"], null),
    null,
  );
  assert.equal(
    mobileBlockingRunId(statuses, ["run_job_3f9a0c", "run_clarify"], null),
    "run_clarify",
  );
});

test("HPD-871: Stop reads the run first and sends nothing to a run that has already finished", async () => {
  const calls: string[] = [];
  const outcome = await mobileStopRunUnlessFinished("run_Llia8JeTURv9rP", {
    readRun: async (id) => { calls.push(`GET ${id}`); return { id, status: "completed" as string }; },
    stopRun: async (id) => { calls.push(`POST ${id}/stop`); return { id, status: "cancelled" as string }; },
  });
  assert.deepEqual(calls, ["GET run_Llia8JeTURv9rP"]);
  assert.equal(outcome.sent, false);
  assert.equal(mobileStoppedRunStatus(outcome.run.status), "completed");

  calls.length = 0;
  const running = await mobileStopRunUnlessFinished("run_live", {
    readRun: async (id) => { calls.push(`GET ${id}`); return { id, status: "running" as string }; },
    stopRun: async (id) => { calls.push(`POST ${id}/stop`); return { id, status: "cancelled" as string }; },
  });
  assert.deepEqual(calls, ["GET run_live", "POST run_live/stop"]);
  assert.equal(running.sent, true);
  assert.equal(mobileStoppedRunStatus(running.run.status), "cancelled");
  assert.equal(mobileStoppedRunStatus("running"), "cancelled");

  calls.length = 0;
  const unreadable = await mobileStopRunUnlessFinished("run_live", {
    readRun: async () => { throw new Error("offline"); },
    stopRun: async (id) => { calls.push(`POST ${id}/stop`); return { id, status: "cancelled" as string }; },
  });
  assert.deepEqual(calls, ["POST run_live/stop"]);
  assert.equal(unreadable.sent, true);
});

function apiRun(id: string, status: HermesApiRun["status"], extra: Partial<HermesApiRun> = {}): HermesApiRun {
  return {
    id,
    accountId: "acct_1",
    workspaceId: "ws_1",
    conversationId: home,
    runtimeRunId: null,
    status,
    surface: "hey_hermes",
    channel: "hey_hermes_mobile",
    sensitivity: "general",
    contextReferences: [],
    requestedCapabilityFamilies: [],
    sourceJobId: null,
    sourceExecutionId: null,
    messages: [],
    createdAt: "2026-09-24T06:29:40.000Z",
    startedAt: "2026-09-24T06:29:40.000Z",
    completedAt: status === "completed" ? "2026-09-24T06:29:53.000Z" : null,
    ...extra,
  };
}

function conversation(activeRunId: string | null): HermesApiConversation {
  return {
    id: home,
    workspaceId: "ws_1",
    title: "Home",
    role: "home",
    status: "active",
    surfaceOrigin: "hey_hermes",
    channelOrigin: "hey_hermes_mobile",
    sensitivity: "general",
    allowedSurfaces: ["hey_hermes"],
    visibility: "full",
    safeSummary: null,
    activeRunId,
    messageCount: 4,
    lastMessageAt: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-24T06:29:53.000Z",
  };
}

function canonical(runs: Record<string, HermesApiRun>, activeRunId: string | null, calls: string[]) {
  const client = {
    run: async (runId: string) => { calls.push(`GET /hermes/runs/${runId}`); return { contractVersion: 1, run: runs[runId]! }; },
    stopRun: async (runId: string) => {
      calls.push(`POST /hermes/runs/${runId}/stop`);
      return { contractVersion: 1, run: { ...runs[runId]!, status: "cancelled" } };
    },
    listRuns: async () => {
      calls.push("GET /hermes/runs?active=true");
      const active = Object.values(runs).filter((item) => item.status === "running" || item.status === "queued");
      return { contractVersion: 1, run: active[0] ?? null, runs: active };
    },
    listConversations: async () => ({ contractVersion: 1, conversations: [conversation(activeRunId)] }),
  };
  return createNativeR8CanonicalController(
    client as unknown as Parameters<typeof createNativeR8CanonicalController>[0],
    { surface: "hey_hermes", channel: "hey_hermes_mobile", allowedSurfaces: ["hey_hermes"] },
  );
}

test("HPD-871: the canonical stop sends nothing to the run that completed a second earlier", async () => {
  const calls: string[] = [];
  const hermes = canonical({ run_Llia8JeTURv9rP: apiRun("run_Llia8JeTURv9rP", "completed") }, null, calls);

  const stopped = await hermes.stopRun("run_Llia8JeTURv9rP");

  assert.equal(stopped.status, "completed");
  assert.deepEqual(calls, ["GET /hermes/runs/run_Llia8JeTURv9rP"]);
});

test("HPD-871: the canonical stop still reaches a running reply", async () => {
  const calls: string[] = [];
  const hermes = canonical({ run_live: apiRun("run_live", "running") }, null, calls);

  const stopped = await hermes.stopRun("run_live");

  assert.equal(stopped.status, "cancelled");
  assert.deepEqual(calls, ["GET /hermes/runs/run_live", "POST /hermes/runs/run_live/stop"]);
});

test("HPD-871: opening a chat whose plane-side active run is a job returns the customer's run or none", async () => {
  const job = apiRun("run_job_3f9a0c", "running", { sourceJobId: "job_morning", sourceExecutionId: "exec_1", createdAt: "2026-09-24T06:00:00.000Z" });

  const idle = canonical({ [job.id]: job, run_done: apiRun("run_done", "completed") }, job.id, []);
  assert.equal(await idle.activeRun({ conversationId: home }), null);

  const busy = canonical({ [job.id]: job, run_live: apiRun("run_live", "running") }, job.id, []);
  assert.equal((await busy.activeRun({ conversationId: home }))?.id, "run_live");

  const delivery = apiRun("run_delivery_9d2e11", "running");
  const delivering = canonical({ [delivery.id]: delivery }, delivery.id, []);
  assert.equal(await delivering.activeRun({ conversationId: home }), null);

  const own = canonical({ run_live: apiRun("run_live", "running") }, "run_live", []);
  assert.equal((await own.activeRun({ conversationId: home }))?.id, "run_live");
});
