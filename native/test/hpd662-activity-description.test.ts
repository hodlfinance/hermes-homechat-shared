import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { heyLiveRunActivity, type ChatRunEvent } from "../core/index";

function statusEvent(id: string, payload: Record<string, unknown>): ChatRunEvent {
  return {
    id,
    runId: "run-hpd-662",
    type: "status",
    payload,
    createdAt: `2026-09-12T10:0${id}:00.000Z`,
  };
}

const trusted = {
  source: "hermes_gateway",
  platform: "heyhermes_web",
  chatId: "chat-hpd-662",
};

test("the newest approved activity description beats the generic fallback", () => {
  assert.deepEqual(
    heyLiveRunActivity({
      events: [
        statusEvent("1", { ...trusted, content: "is reading…" }),
        statusEvent("2", { ...trusted, content: "is searching files…" }),
      ],
      runStatus: "running",
    }),
    { label: "Searching files" },
  );
});

test("keeps an existing redacted customer-facing preview when the verb permits it", () => {
  assert.deepEqual(
    heyLiveRunActivity({
      events: [statusEvent("1", { ...trusted, content: "is searching the web for museums in Zurich…" })],
      runStatus: "running",
    }),
    { label: "Searching the web for museums in Zurich" },
  );
});

test("private previews and foreign status sources never become UI copy", () => {
  const privateMarker = "PRIVATE_VALUE=redacted-marker https://private.example/run";
  const command = heyLiveRunActivity({
    events: [statusEvent("1", { ...trusted, content: `is running ${privateMarker}…` })],
    runStatus: "running",
  });
  assert.deepEqual(command, { label: "Working", labelKey: "working" });
  assert.equal(JSON.stringify(command).includes("redacted-marker"), false);
  assert.equal(JSON.stringify(command).includes("private.example"), false);

  const foreign = heyLiveRunActivity({
    events: [statusEvent("1", { ...trusted, source: "another_gateway", content: "is reading…" })],
    runStatus: "running",
  });
  assert.deepEqual(foreign, { label: "Working", labelKey: "working" });

  const boundedCommand = heyLiveRunActivity({
    events: [statusEvent("2", { ...trusted, content: "is running cat /etc/private…" })],
    runStatus: "running",
  });
  assert.deepEqual(boundedCommand, { label: "Running" });
  assert.equal(JSON.stringify(boundedCommand).includes("/etc/private"), false);

  const unsafeAllowedPreview = heyLiveRunActivity({
    events: [statusEvent("3", { ...trusted, content: "is searching the web for https://private.example…" })],
    runStatus: "running",
  });
  assert.deepEqual(unsafeAllowedPreview, { label: "Searching the web" });
  assert.equal(JSON.stringify(unsafeAllowedPreview).includes("private.example"), false);

  const unknownTool = heyLiveRunActivity({
    events: [statusEvent("4", { ...trusted, content: "is using custom_tool {raw:payload}…" })],
    runStatus: "running",
  });
  assert.deepEqual(unknownTool, { label: "Working", labelKey: "working" });
  assert.equal(JSON.stringify(unknownTool).includes("raw:payload"), false);
});

test("terminal states clear the transient activity line", () => {
  for (const runStatus of ["completed", "failed", "cancelled"] as const) {
    assert.equal(
      heyLiveRunActivity({
        events: [statusEvent("1", { ...trusted, content: "is reading…" })],
        runStatus,
      }),
      null,
    );
  }
});

test("native presentation remains one compact themed line for long descriptions", () => {
  const shimmer = readFileSync(new URL("../src/mobile-status-shimmer.tsx", import.meta.url), "utf8");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

  assert.match(shimmer, /ellipsizeMode="tail"/);
  assert.match(shimmer, /numberOfLines=\{1\}/);
  assert.match(surface, /bandColor=\{palette\.ink\}/);
  assert.match(surface, /style=\{styles\.activityTrailTitle\}/);
});
