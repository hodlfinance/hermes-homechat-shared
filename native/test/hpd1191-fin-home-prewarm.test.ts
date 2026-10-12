import assert from "node:assert/strict";
import test from "node:test";

import { permitsHodlNativeR8Request } from "../policy";

test("HPD-1191: the HODL host may ask for the Home prewarm, and nothing beside it", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/home/prewarm"), true);
  assert.equal(permitsHodlNativeR8Request("GET", "/hermes/home/prewarm"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/home/prewarm/extra"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/home/compact"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/home"), false);
});
