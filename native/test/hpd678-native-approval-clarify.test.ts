import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createApiClient } from "../core/index";

const surfaceSource = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the native client resolves a clarification against the exact waiting run", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createApiClient({
    baseUrl: "https://example.invalid",
    token: "test-session",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        ok: true,
        resolved: true,
        runId: "run_exact",
        clarifyId: "clarify_exact",
      }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  assert.deepEqual(
    await client.resolveChatClarify("run_exact", { clarifyId: "clarify_exact", response: "Other answer" }),
    { ok: true, resolved: true, runId: "run_exact", clarifyId: "clarify_exact" },
  );
  assert.equal(calls.length, 1);
  assert.match(calls[0]!.url, /\/chat-runs\/run_exact\/clarify$/);
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    clarifyId: "clarify_exact",
    response: "Other answer",
  });
});

test("the mobile cards expose complete approval metadata, typed confirmation, choices and Other", () => {
  const approvalStart = surfaceSource.indexOf("function MobileChatApprovalCard(");
  const clarifyStart = surfaceSource.indexOf("function MobileChatClarifyCard(", approvalStart);
  const clarifyEnd = surfaceSource.indexOf("const reduceMotionStore", clarifyStart);
  assert.ok(approvalStart > 0 && clarifyStart > approvalStart && clarifyEnd > clarifyStart);
  const approvalCard = surfaceSource.slice(approvalStart, clarifyStart);
  const clarifyCard = surfaceSource.slice(clarifyStart, clarifyEnd);

  assert.match(approvalCard, /Target: \{card\.target\.label\}/);
  assert.match(approvalCard, /Action: \{card\.action\.label\}/);
  assert.match(approvalCard, /card\.preview\.fields\?\.map/);
  assert.match(approvalCard, /Permission:/);
  assert.match(approvalCard, /Data leaving workspace:/);
  assert.match(approvalCard, /Credentials:/);
  assert.match(approvalCard, /requiresTypedConfirmation/);
  assert.match(approvalCard, /typedConfirmation\.trim\(\) === card\.requiresTypedConfirmation/);
  assert.match(surfaceSource, /loadMobileChatSession\(refreshSessionId, \{ force: true, preserveDraft: true \}\)/);

  assert.match(clarifyCard, /clarify\.choices\.map/);
  assert.match(clarifyCard, /clarify\.allowOther \|\| !clarify\.choices\.length/);
  assert.match(clarifyCard, /placeholder="Other answer"/);
  assert.doesNotMatch(clarifyCard, /<ScrollView/);
  assert.match(surfaceSource, /api\.resolveChatClarify\(runId, \{ clarifyId: clarify\.id, response: response\.trim\(\) \}\)/);
});
