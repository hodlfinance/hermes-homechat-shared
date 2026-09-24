import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createHermesApiClient, HermesApiClientError } from "../core/hermes-api-client";
import {
  SharedHomechatObservationError,
  SharedHomechatTransportError,
  createHomechatClientController,
  createHomechatRunController,
} from "@hodlfinance/hermes-homechat-shared/core";
import {
  createMobileQueuedFollowUpCollectionOwner,
  mobileQueuedFollowUpKeepsOwnershipAfterBackgroundError,
} from "../src/mobile-message-send";

test("native Hermes API errors preserve permanent HTTP status for observation classification", async () => {
  const client = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => new Response(JSON.stringify({ error: "Run not found" }), { status: 404 }),
  });

  await assert.rejects(
    client.run("missing-run"),
    (error) => error instanceof HermesApiClientError &&
      error.status === 404 &&
      error.retryable === false &&
      error.message === "Run not found",
  );
});

test("native Hermes API errors classify temporary HTTP and network failures as retryable", async () => {
  const unavailable = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => new Response("unavailable", { status: 503 }),
  });
  await assert.rejects(
    unavailable.run("active-run"),
    (error) => error instanceof HermesApiClientError && error.status === 503 && error.retryable === true,
  );

  const offline = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => { throw new TypeError("Network request failed"); },
  });
  await assert.rejects(
    offline.run("active-run"),
    (error) => error instanceof HermesApiClientError &&
      error.status === undefined &&
      error.retryable === true &&
      error.cause instanceof TypeError,
  );
});

test("native queued ownership survives follow:false observation loss and cancel stops the real run", async () => {
  type Run = { id: string; status: string; messages: [] };
  const runId = "native-owned-run";
  let stoppedRunId: string | null = null;
  const transport = {
    createRun: async (_request: { message: string }): Promise<Run> => ({ id: runId, status: "queued", messages: [] }),
    getRun: async (): Promise<Run> => {
      throw new SharedHomechatTransportError("Run read unavailable", { status: 404 });
    },
    stopRun: async (ownedRunId: string): Promise<Run> => {
      stoppedRunId = ownedRunId;
      return { id: ownedRunId, status: "cancelled", messages: [] };
    },
  };
  const session = createHomechatClientController({
    transport,
    runController: createHomechatRunController(transport, { sleep: async () => undefined }),
  });
  const owner = createMobileQueuedFollowUpCollectionOwner();
  const ownershipToken = owner.admit();
  const refs = new Map([[ownershipToken, { runId }]]);

  await session.send({ message: "Keep going" }, { follow: false });
  let observationError: unknown;
  try {
    await session.waitForBackgroundFollow();
  } catch (error) {
    observationError = error;
  }

  assert.ok(observationError instanceof SharedHomechatObservationError);
  assert.equal(mobileQueuedFollowUpKeepsOwnershipAfterBackgroundError(observationError), true);
  assert.equal(owner.owns(ownershipToken), true);
  assert.equal(refs.get(ownershipToken)?.runId, runId);

  await session.stop(refs.get(ownershipToken)!.runId);
  assert.equal(stoppedRunId, runId);

  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const finish = surface.slice(surface.indexOf("async function finishQueuedFollowUp"), surface.indexOf("function recoverQueuedFollowUp"));
  assert.match(finish, /keepOwnership = mobileQueuedFollowUpKeepsOwnershipAfterBackgroundError\(error\)/);
  assert.match(finish, /if \(!keepOwnership && queuedFollowUpOwner\.owns/);
});
