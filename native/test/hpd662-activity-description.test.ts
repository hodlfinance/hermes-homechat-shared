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

test("private previews and foreign status sources never become UI copy", () => {
  const privateMarker = "PRIVATE_VALUE=redacted-marker https://private.example/run";
  for (const payload of [
    { ...trusted, content: `is running ${privateMarker}…` },
    { ...trusted, source: "another_gateway", content: "is reading…" },
  ]) {
    const view = heyLiveRunActivity({ events: [statusEvent("1", payload)], runStatus: "running" });
    assert.deepEqual(view, { label: "Working", labelKey: "working" });
    assert.equal(JSON.stringify(view).includes("redacted-marker"), false);
    assert.equal(JSON.stringify(view).includes("private.example"), false);
  }
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
