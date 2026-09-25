import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  chatRunEventFromHermesEvent,
  createHomechatEventStreamDecoder,
  heyDelegatedActivityTimeline,
  normalizeHermesRunEvent,
  type ChatRunEvent,
} from "../core/index";
import { delegatedStreamChunkText, mergeDelegatedRunEvents } from "../src/mobile-delegated-run-events";

// HPD-874, reopened 25.09. (Justus, HODL): the sub thread "Remove the phantom
// TSLA entry ..." showed only "Thinking" for four minutes while the plane held
// 46 detail events for run_delegated_d5470d061b3731d0f97c4895 (15 reasoning,
// 16 tool.started, 15 tool.completed; source hermes_gateway, status
// activity_detail). The chat's own observation of the run was polling it every
// ~1.9 s (GET /hermes/runs/<id>, 114 reads), and each poll carried the newest
// events; the step timeline read only from its own stream and stayed empty.

const runId = "run_delegated_synthetic";
// The stored shape of the plane's chat_events rows for a sub order, with
// synthetic text: exactly the keys measured on the live rows.
function stored(index: number, payload: Record<string, unknown>) {
  return {
    id: `evt_${String(index).padStart(3, "0")}`,
    runId,
    type: "status",
    createdAt: new Date(Date.UTC(2026, 8, 25, 3, 49, index)).toISOString(),
    payload: { status: "activity_detail", label: "Hermes activity detail", detail: "Hermes activity detail", source: "hermes_gateway", ...payload },
  };
}
const rows = [
  stored(1, { phase: "reasoning", content: "Check the synthetic portfolio first.", modelCall: 1 }),
  stored(2, { phase: "tool.started", content: "Reading the portfolio", tool: "hodl_get_portfolio", toolCallId: "call_1", confidential: true }),
  stored(3, { phase: "tool.completed", content: "hodl_get_portfolio finished", tool: "hodl_get_portfolio", toolCallId: "call_1", ok: true, durationMs: 812, confidential: true }),
  stored(4, { phase: "reasoning", content: "The entry is not in the list.", modelCall: 2, originalLength: 4100 }),
  stored(5, { phase: "tool.started", content: "Searching the web", tool: "web_search", toolCallId: "call_2", target: "synthetic query" }),
  stored(6, { phase: "tool.completed", content: "web_search finished", tool: "web_search", toolCallId: "call_2", ok: true, durationMs: 1400, resultSize: 2300, resultPreview: "Synthetic result line." }),
  stored(7, { phase: "tool.started", content: "Running a command", tool: "terminal", toolCallId: "call_3", target: "cat" }),
  stored(8, { phase: "tool.completed", content: "terminal finished", tool: "terminal", toolCallId: "call_3", ok: false, durationMs: 20, resultSize: 60 }),
];

// What the plane writes for each row, on the stream and in a polled run.
const wire = rows.map((row) => normalizeHermesRunEvent(row)!);
const fromWire = (items: typeof wire) =>
  items.map((item) => chatRunEventFromHermesEvent(item)).filter((event): event is ChatRunEvent => Boolean(event));

test("HPD-874: the real event form survives the plane's projection into a full timeline", () => {
  const timeline = heyDelegatedActivityTimeline(fromWire(wire));
  assert.deepEqual(timeline.entries.map((entry) => entry.kind), ["reasoning", "step", "reasoning", "step", "step"]);
  const steps = timeline.entries.filter((entry) => entry.kind === "step");
  assert.deepEqual(steps.map((step) => step.kind === "step" && step.state), ["ok", "ok", "error"]);
  const search = steps[1];
  assert.equal(search?.kind === "step" && search.target, "synthetic query");
  assert.equal(search?.kind === "step" && search.resultPreview, "Synthetic result line.");
});

test("HPD-874: with no stream at all, the chat's polled events alone fill the timeline as the run goes", () => {
  // Each poll carries the run's newest events (the plane sends the last 24).
  let held: ChatRunEvent[] = [];
  for (const upTo of [2, 5, 8]) {
    const poll = fromWire(wire.slice(Math.max(0, upTo - 24), upTo));
    held = mergeDelegatedRunEvents(held, poll, runId) ?? held;
  }
  assert.equal(held.length, 8);
  assert.equal(heyDelegatedActivityTimeline(held).entries.length, 5);
});

test("HPD-874: stream and polling events merge once each, in the order they happened", () => {
  const events = fromWire(wire);
  const streamed = [events[0]!, events[1]!, events[4]!];
  const polled = [events[3]!, events[1]!, events[2]!];
  const merged = mergeDelegatedRunEvents(streamed, polled, runId)!;
  assert.deepEqual(merged.map((event) => event.id), ["evt_001", "evt_002", "evt_003", "evt_004", "evt_005"]);
  assert.equal(mergeDelegatedRunEvents(merged, polled, runId), null, "nothing new, no new array");
  assert.equal(mergeDelegatedRunEvents([], [{ ...events[0]!, runId: "run_other" }], runId), null, "another run's events stay out");
  assert.equal(mergeDelegatedRunEvents([], events, runId, 3)!.length, 3);
});

test("HPD-874: the SSE bytes of the stream decode to the same events, whether a chunk is bytes or text", () => {
  const sse = `retry: 1500\n\n${wire.map((item) => `id: ${item.id}\nevent: ${item.type}\ndata: ${JSON.stringify(item)}\n\n`).join("")}`;
  const bytes = new TextEncoder().encode(sse);
  const decoder = createHomechatEventStreamDecoder({ cursor: null });
  const text = new TextDecoder();
  const parsed = [
    ...decoder.push(delegatedStreamChunkText(bytes.slice(0, 900), text)).events,
    ...decoder.push(delegatedStreamChunkText(bytes.slice(900), text)).events,
    ...decoder.finish().events,
  ];
  assert.equal(parsed.length, 8);
  assert.equal(delegatedStreamChunkText("already text", null), "already text");
  assert.equal(delegatedStreamChunkText(bytes, null), "");
});

test("HPD-874: the sub thread hands the timeline the chat's events of that run, and never holds two streams", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /knownEvents=\{openDelegatedTask\.runId \? chatEventsByRunId\[openDelegatedTask\.runId\] : undefined\}/);
  const hook = readFileSync(new URL("../src/mobile-delegated-activity.tsx", import.meta.url), "utf8");
  const connect = hook.slice(hook.indexOf("const connect = async () => {"));
  assert.match(connect.slice(0, 400), /controller\?\.abort\(\);\s*controller = new AbortController\(\);/);
  assert.match(hook, /\}, \[runId\]\);\n\n  \/\/ After the reset above/, "the stream restarts only for another run, and the chat's events are added after its reset");
});
