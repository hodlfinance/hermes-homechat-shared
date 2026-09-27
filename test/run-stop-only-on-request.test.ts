import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomechatClientController,
  createHomechatRunController,
  SharedHomechatRunControllerError,
  type SharedHomechatMessage,
  type SharedHomechatRunTransport,
} from "../src/index.js";

// Justus' Fin chat, Build 89, 2026-09-27: run_QuAjbhlJV1zavf was stopped at
// 10:34:34Z right after nine GET .../events in the same second, twelve seconds
// after the HODL access gate had re-resolved and remounted the chat. A stop is
// the customer's wish and nothing else: following a run, losing its event
// stream, or being torn down with the screen must never send one.

type Run = { id: string; status: string; messages: SharedHomechatMessage[] };

function recordingTransport(statuses: string[]) {
  const calls = { stop: 0, stream: 0, get: 0 };
  const transport: SharedHomechatRunTransport<Run, { message: string }> = {
    createRun: async () => ({ id: "run_synthetic", status: "running", messages: [] }),
    getRun: async (id) => {
      calls.get += 1;
      return { id, status: statuses[Math.min(calls.get - 1, statuses.length - 1)] ?? "running", messages: [] };
    },
    stopRun: async (id) => {
      calls.stop += 1;
      return { id, status: "cancelled", messages: [] };
    },
    streamRun: async () => {
      calls.stream += 1;
      return { cursor: null, terminal: false };
    },
  };
  return { calls, transport };
}

test("a stream that disconnects nine times ends in polling, never in a stop", async () => {
  const { calls, transport } = recordingTransport(["running", "running", "completed"]);
  const controller = createHomechatClientController({
    transport,
    runController: createHomechatRunController(transport, { sleep: async () => undefined }),
  });

  await controller.reconnect("run_synthetic", { reconnectDelayMs: 0 });

  assert.equal(calls.stream, 9, "one stream plus eight reconnects, as measured");
  assert.equal(calls.stop, 0);
  assert.equal(controller.getState().status, "completed");
});

test("tearing the screen down aborts the observation and leaves the run running", async () => {
  const { calls, transport } = recordingTransport(["running"]);
  const unmount = new AbortController();
  const hanging: SharedHomechatRunTransport<Run, { message: string }> = {
    ...transport,
    streamRun: (_runId, context) => new Promise((_resolve, reject) => {
      calls.stream += 1;
      context.signal?.addEventListener("abort", () => reject(new Error("aborted by unmount")), { once: true });
    }),
  };
  const controller = createHomechatClientController({
    transport: hanging,
    runController: createHomechatRunController(hanging, { sleep: async () => undefined }),
  });

  const following = controller.reconnect("run_synthetic", { signal: unmount.signal });
  await new Promise((resolve) => setImmediate(resolve));
  unmount.abort();

  await assert.rejects(
    following,
    (error) => error instanceof SharedHomechatRunControllerError && error.code === "aborted",
  );
  assert.equal(calls.stop, 0);
  assert.notEqual(controller.getState().phase, "stopped");
});

test("only an explicit stop reaches the stop endpoint", async () => {
  const { calls, transport } = recordingTransport(["running"]);
  const controller = createHomechatClientController({
    transport,
    runController: createHomechatRunController(transport, { sleep: async () => undefined }),
  });

  await controller.stop("run_synthetic");

  assert.equal(calls.stop, 1);
});
