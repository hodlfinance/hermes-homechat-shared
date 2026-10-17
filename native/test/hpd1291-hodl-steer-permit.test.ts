import assert from "node:assert/strict";
import test from "node:test";

import { permitsHodlNativeR8Request } from "../policy";

// HPD-1291: "Send now" on a queued message calls POST /hermes/runs/<run>/steer
// (hermes-api-client steerRun). The HODL transport refused it before the
// network, so the button did nothing in the HODL app.
test("HPD-1291: the HODL host may send a queued message into the running reply, and nothing beside it", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/run_NViCGU-gP8xH3u/steer"), true);
  assert.equal(permitsHodlNativeR8Request("GET", "/hermes/runs/run_NViCGU-gP8xH3u/steer"), false);
  assert.equal(permitsHodlNativeR8Request("PATCH", "/hermes/runs/run_NViCGU-gP8xH3u/steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/run_NViCGU-gP8xH3u/steer/extra"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs//steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/../steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/run%2Fx/steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/runs/run x/steer"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/conversations/c1/steer"), false);
});
