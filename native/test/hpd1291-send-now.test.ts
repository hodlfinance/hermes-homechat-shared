import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createHermesApiClient } from "../core/hermes-api-client";
import { interactionUiCopy } from "../core/interaction-ui-copy";
import { mobileQueuedFollowUpSteerState } from "../src/mobile-message-send";

// HPD-1291. A queued message gets a "Send now" button in the queue box; a tap
// hands it to the running reply as a Hermes steer through the Plane route
// POST /hermes/runs/:id/steer {queuedRunId} (hey-hermes #1961). Justus,
// 2026-10-17: the button sits in the box of already queued messages; a queued
// message with a photo or file gets no button in the first version (2a).

const ready = {
  queued: { runId: "run_queued_b", status: "queued" as const, hasAttachments: false, steering: false },
  context: { activeRunId: "run_running_a", activeRunStatus: "running" as const, liveVoiceConnected: false },
};

test("the button shows only on a plain queued message behind a running reply", () => {
  assert.deepEqual(mobileQueuedFollowUpSteerState(ready.queued, ready.context), { showSteer: true, steerDisabled: false });
  const hidden = [
    { queued: { ...ready.queued, status: "queueing" as const }, context: ready.context },
    { queued: { ...ready.queued, status: "running" as const }, context: ready.context },
    { queued: { ...ready.queued, status: "cancelling" as const }, context: ready.context },
    { queued: { ...ready.queued, status: "cancelled" as const }, context: ready.context },
    { queued: { ...ready.queued, status: "failed" as const }, context: ready.context },
    { queued: { ...ready.queued, runId: null }, context: ready.context },
    { queued: { ...ready.queued, hasAttachments: true }, context: ready.context },
    { queued: ready.queued, context: { ...ready.context, activeRunId: null } },
    { queued: ready.queued, context: { ...ready.context, activeRunId: "run_queued_b" } },
    { queued: ready.queued, context: { ...ready.context, activeRunStatus: "waiting_for_approval" as const } },
    { queued: ready.queued, context: { ...ready.context, activeRunStatus: "queued" as const } },
    { queued: ready.queued, context: { ...ready.context, activeRunStatus: "completed" as const } },
    { queued: ready.queued, context: { ...ready.context, activeRunStatus: undefined } },
    { queued: ready.queued, context: { ...ready.context, liveVoiceConnected: true } },
  ];
  for (const { queued, context } of hidden) {
    assert.equal(mobileQueuedFollowUpSteerState(queued, context).showSteer, false, JSON.stringify({ queued, context }));
  }
  assert.deepEqual(
    mobileQueuedFollowUpSteerState({ ...ready.queued, steering: true }, ready.context),
    { showSteer: true, steerDisabled: true },
  );
});

test("steerRun posts the queued run to the running run's steer route with the Plane's real answers", async () => {
  const calls: Array<{ url: string; method?: string; body?: string }> = [];
  const answers: Array<[number, unknown]> = [
    [202, { ok: true, state: "accepted", runId: "run_running_a", queuedRunId: "run_queued_b" }],
    [200, { ok: true, state: "delivered", runId: "run_running_a", queuedRunId: "run_queued_b" }],
    [409, { ok: false, reason: "not_running", error: "Hermes could not take this message into the current reply. It stays in the queue." }],
  ];
  const client = createHermesApiClient({
    baseUrl: "https://plane.test/",
    token: "synthetic",
    fetchImpl: (async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method, body: init?.body ? String(init.body) : undefined });
      const [status, body] = answers.shift()!;
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
  assert.deepEqual(await client.steerRun("run_running_a", "run_queued_b"), { state: "accepted" });
  assert.deepEqual(calls[0], {
    url: "https://plane.test/hermes/runs/run_running_a/steer",
    method: "POST",
    body: JSON.stringify({ queuedRunId: "run_queued_b" }),
  });
  assert.deepEqual(await client.steerRun("run_running_a", "run_queued_b"), { state: "delivered" });
  assert.deepEqual(await client.steerRun("run_running_a", "run_queued_b"), { state: "refused", reason: "not_running" });
});

test("steerRun keeps a transport failure an error, not a refusal", async () => {
  const client = createHermesApiClient({
    baseUrl: "https://plane.test",
    fetchImpl: (async () => new Response("bad gateway", { status: 502 })) as typeof fetch,
  });
  await assert.rejects(() => client.steerRun("run_running_a", "run_queued_b"));
});

test("the queue card renders the button and the tap never aborts the queued run", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const card = surface.slice(surface.indexOf("function QueuedFollowUpNotice("));
  assert.match(card, /onSteer/);
  assert.match(card, /\["Send now"\]/);
  assert.match(card, /\["Send this message into the current reply"\]/);
  assert.match(surface, /onSteer=\{\(\) => void steerQueuedFollowUp\(queued\.ownershipToken\)\}/);
  const handler = surface.slice(surface.indexOf("async function steerQueuedFollowUp("));
  const body = handler.slice(0, handler.indexOf("\n  }\n") + 4);
  assert.match(body, /hermesApi\.steerRun\(/);
  // The queued run must stay dispatchable if the steer comes back.
  assert.doesNotMatch(body, /abortController\.abort\(\)/);
  assert.doesNotMatch(body, /queuedFollowUpRef\.current\.delete/);
});

test("every app locale has the new words", () => {
  const keys = [
    "Send now",
    "Send this message into the current reply",
    "Sending into the current reply",
    "Hermes could not take it right now. It stays in the queue.",
  ] as const;
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = interactionUiCopy(locale) as Record<string, string>;
    for (const key of keys) assert.ok(copy[key]?.trim(), `${locale}: ${key}`);
  }
  assert.equal((interactionUiCopy("de") as Record<string, string>)["Send now"], "Jetzt einreichen");
});
