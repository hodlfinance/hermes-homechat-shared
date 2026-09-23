import assert from "node:assert/strict";
import test from "node:test";

import { permitsHodlNativeR8Request } from "../policy";
import { createNativeR8Transport } from "../transport";

// HPD-841: HODL shows running background tasks with an X that stops them. The
// X calls the plane route `POST /hermes/delegated-tasks/:taskId/stop`
// (hey-hermes apps/api action-boundaries.ts). HODL's transport and the Fin BFF
// both refuse every route that is not in this allow-list.
const planeStopRoute = "/hermes/delegated-tasks/:taskId/stop";
const taskId = "20260923_133823_494044";

test("HPD-841: stopping a running background task is a permitted HODL route", () => {
  assert.equal(permitsHodlNativeR8Request("POST", planeStopRoute.replace(":taskId", taskId)), true);

  for (const [method, path] of [
    ["GET", `/hermes/delegated-tasks/${taskId}/stop`],
    ["DELETE", `/hermes/delegated-tasks/${taskId}`],
    ["POST", `/hermes/delegated-tasks/${taskId}`],
    ["POST", "/hermes/delegated-tasks/stop"],
    ["POST", `/hermes/delegated-tasks/${taskId}/extra/stop`],
    ["POST", "/hermes/delegated-tasks/../stop"],
    ["POST", "/hermes/delegated-tasks/%2e%2e/stop"],
    ["POST", "/hermes/delegated-tasks/a%2fb/stop"],
  ] as const) {
    assert.equal(permitsHodlNativeR8Request(method, path), false, `${method} ${path}`);
  }
});

test("HPD-841: the shared chat's stop request passes the HODL allow-list with the exact plane route", async () => {
  const requests: Array<{ method: string; path: string; search: string }> = [];
  const baseUrl = "https://finhermes.test/api";
  const transport = createNativeR8Transport({
    baseUrl,
    identity: { surface: "finhermes", channel: "hodl_mobile", allowedSurfaces: ["finhermes"] },
    // The same gate HODL's nativeR8Transport applies before any network call.
    fetch: async (input, init) => {
      const url = new URL(String(input));
      const path = url.pathname.slice(new URL(baseUrl).pathname.length);
      const method = (init?.method ?? "GET").toUpperCase();
      if (!permitsHodlNativeR8Request(method, path)) {
        throw new Error("This operation belongs to the HODL account flow or is unavailable in Fin Hermes.");
      }
      requests.push({ method, path, search: url.search });
      return new Response(JSON.stringify({
        contractVersion: 1,
        task: {
          taskId,
          name: "SAP research overview",
          conversationId: "session_child",
          sourceRunId: "run_parent",
          state: "cancelled",
          startedAt: "2026-09-23T11:38:23.411Z",
          updatedAt: "2026-09-23T11:38:40.000Z",
          completedAt: "2026-09-23T11:38:40.000Z",
        },
      }), { headers: { "content-type": "application/json" } });
    },
  });
  const hermes = transport.createCanonicalClient({ baseUrl, token: "test-session" });

  const stopped = await hermes.stopDelegatedTask(taskId);

  assert.equal(stopped.state, "cancelled");
  assert.deepEqual(requests, [{
    method: "POST",
    path: planeStopRoute.replace(":taskId", taskId),
    search: "?surface=finhermes",
  }]);
});
