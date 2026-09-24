import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  heyDelegatedActivityPreviewLimit,
  heyDelegatedActivityReasoningLimit,
  heyDelegatedActivityTargetLimit,
  heyDelegatedActivityTimeline,
  heyLiveRunDetail,
  heyLiveRunDetailLimit,
  heyLiveRunPresentation,
  type ChatRunEvent,
} from "../core/index";
import { mobileLiveRunActivityView } from "../src/mobile-live-run-status";

// HPD-874/876 phase 2, Justus' decision of 24.09.2026 ("Ja, gefiltert"). The
// guest and the plane filter a step's target, its result excerpt and each
// model call's thinking; the app reads them as plain text, bounds them again,
// and shows them collapsed. Mail, Google, finance and secret steps show a
// count only, even if an event carried more.

let sequence = 0;
function child(phase: string, payload: Record<string, unknown>): ChatRunEvent {
  sequence += 1;
  return {
    id: `evt_${sequence}`,
    runId: "run_delegated_000000000000000000000000",
    type: "status",
    payload: { source: "hermes_gateway", phase, ...payload },
    createdAt: `2026-09-24T10:00:${String(sequence % 60).padStart(2, "0")}.000Z`,
  };
}

test("a step carries its target, pairs its end by call id, and keeps its result excerpt", () => {
  const timeline = heyDelegatedActivityTimeline([
    child("tool.started", { tool: "web_search", toolCallId: "call_a", content: "is searching the web…", target: "EU solar prices 2026" }),
    child("tool.started", { tool: "web_extract", toolCallId: "call_b", content: "is reading…", target: "example.org/report" }),
    // Ends out of order: the call id, not the newest open step, decides.
    child("tool.completed", {
      tool: "web_search", toolCallId: "call_a", ok: true, durationMs: 3200,
      content: "web_search finished in 3.2s.", resultPreview: "Solar prices fell · Grid report 2026", resultSize: 1800,
    }),
    child("tool.completed", { tool: "web_extract", toolCallId: "call_b", ok: false, content: "web_extract hit an obstacle." }),
  ]);
  const steps = timeline.entries.filter((entry) => entry.kind === "step");
  assert.equal(steps.length, 2);
  const [search, extract] = steps;
  assert.equal(search?.kind === "step" && search.target, "EU solar prices 2026");
  assert.equal(search?.kind === "step" && search.state, "ok");
  assert.equal(search?.kind === "step" && search.durationMs, 3200);
  assert.equal(search?.kind === "step" && search.resultPreview, "Solar prices fell · Grid report 2026");
  assert.equal(search?.kind === "step" && search.resultSize, 1800);
  assert.equal(extract?.kind === "step" && extract.state, "error");
  assert.equal(extract?.kind === "step" && extract.target, "example.org/report");
});

test("a confidential step shows a count only, even when the event carried more", () => {
  const timeline = heyDelegatedActivityTimeline([
    child("tool.started", {
      tool: "google_gmail_read", toolCallId: "call_m", confidential: true,
      content: "is using google_gmail_read…", target: "from:bank hpd874-app-synthetic-mail-0001",
    }),
    child("tool.completed", {
      tool: "google_gmail_read", toolCallId: "call_m", confidential: true, ok: true, resultCount: 7,
      content: "google_gmail_read finished.", resultPreview: "hpd874-app-synthetic-mail-0001", resultSize: 900,
    }),
  ]);
  const serialized = JSON.stringify(timeline);
  assert.doesNotMatch(serialized, /hpd874-app-synthetic/u);
  const [step] = timeline.entries;
  assert.equal(step?.kind, "step");
  if (step?.kind !== "step") return;
  assert.equal(step.confidential, true);
  assert.equal(step.resultCount, 7);
  assert.equal(step.target, null);
  assert.equal(step.resultPreview, null);
  assert.equal(step.resultSize, null);
});

test("each model call's thinking is one bounded block, marked when it was cut", () => {
  const timeline = heyDelegatedActivityTimeline([
    child("reasoning", { modelCall: 1, content: "First I compare the sources.\n\n\n\nThen I check the dates." }),
    child("reasoning", { modelCall: 2, content: "x".repeat(6000) }),
    child("reasoning", { modelCall: 3, content: "Short, but the runtime cut it…", originalLength: 9000 }),
  ]);
  const thoughts = timeline.entries.filter((entry) => entry.kind === "reasoning");
  assert.equal(thoughts.length, 3);
  const [first, second, third] = thoughts;
  assert.equal(first?.kind === "reasoning" && first.text, "First I compare the sources.\n\nThen I check the dates.");
  assert.equal(first?.kind === "reasoning" && first.truncated, false);
  assert.equal(first?.kind === "reasoning" && first.modelCall, 1);
  assert.ok(second?.kind === "reasoning" && second.text.length <= heyDelegatedActivityReasoningLimit);
  assert.equal(second?.kind === "reasoning" && second.truncated, true);
  assert.equal(third?.kind === "reasoning" && third.truncated, true);
});

test("targets and excerpts are bounded again in the app and lose control characters", () => {
  const timeline = heyDelegatedActivityTimeline([
    child("tool.started", { tool: "web_search", toolCallId: "c1", content: "is searching the web…", target: `a\u0007${"q".repeat(500)}` }),
    child("tool.completed", { tool: "web_search", toolCallId: "c1", ok: true, resultPreview: `r\u0000${"p".repeat(900)}` }),
  ]);
  const [step] = timeline.entries;
  assert.equal(step?.kind, "step");
  if (step?.kind !== "step") return;
  assert.ok((step.target ?? "").length <= heyDelegatedActivityTargetLimit);
  assert.ok((step.resultPreview ?? "").length <= heyDelegatedActivityPreviewLimit);
  assert.doesNotMatch(`${step.target}${step.resultPreview}`, /[\u0000-\u0008]/u);
});

test("phase-1 events without the new fields read exactly as before", () => {
  const timeline = heyDelegatedActivityTimeline([
    child("tool.started", { content: "is searching the web…" }),
    child("tool.completed", { content: "web_search finished in 3.2s." }),
  ]);
  const [step] = timeline.entries;
  assert.equal(step?.kind === "step" && step.state, "ok");
  assert.equal(step?.kind === "step" && step.durationMs, 3200);
  assert.equal(step?.kind === "step" && (step.target ?? null), null);
});

test("the foreground live line takes the newest thinking line or step target, one line, and clears when writing", () => {
  const trusted = { source: "hermes_gateway", platform: "heyhermes_web", chatId: "chat-hpd-874" };
  const events: ChatRunEvent[] = [
    { id: "1", runId: "run-fg", type: "status", payload: { ...trusted, status: "processing_started" }, createdAt: "2026-09-24T10:00:01.000Z" },
    { id: "2", runId: "run-fg", type: "status", payload: { ...trusted, content: "is searching the web…", phase: "tool.started", tool: "web_search", target: "EU solar prices" }, createdAt: "2026-09-24T10:00:02.000Z" },
  ];
  assert.equal(heyLiveRunDetail(events), "EU solar prices");
  const withThought: ChatRunEvent[] = [
    ...events,
    { id: "3", runId: "run-fg", type: "status", payload: { source: "hermes_gateway", phase: "reasoning", content: `\n  Compare the two reports ${"z".repeat(300)}\nsecond line` }, createdAt: "2026-09-24T10:00:03.000Z" },
  ];
  const detail = heyLiveRunDetail(withThought) ?? "";
  assert.ok(detail.startsWith("Compare the two reports"));
  assert.ok(detail.length <= heyLiveRunDetailLimit);
  assert.doesNotMatch(detail, /\n|second line/u);
  const presentation = heyLiveRunPresentation({ events: withThought, runStatus: "running" });
  assert.equal(presentation?.detail, detail);
  assert.equal(mobileLiveRunActivityView({ events: withThought, runStatus: "running" })?.detail, detail);

  const confidential: ChatRunEvent[] = [
    ...events,
    { id: "4", runId: "run-fg", type: "status", payload: { ...trusted, phase: "tool.started", tool: "google_gmail_read", confidential: true, target: "hpd874-app-synthetic-mail-0002" }, createdAt: "2026-09-24T10:00:04.000Z" },
  ];
  assert.doesNotMatch(String(heyLiveRunDetail(confidential)), /hpd874-app-synthetic/u);

  const writing: ChatRunEvent[] = [
    ...withThought,
    { id: "5", runId: "run-fg", type: "message_delta", payload: { ...trusted, content: "Here is the answer." }, createdAt: "2026-09-24T10:00:05.000Z" },
  ];
  assert.equal(heyLiveRunDetail(writing), null);
});

test("the sub thread renders excerpts and thinking collapsed, and the live line keeps one steady line", () => {
  const timeline = readFileSync(new URL("../src/mobile-delegated-activity.tsx", import.meta.url), "utf8");
  // Thinking: collapsed by default, one block per model call, opened on tap.
  assert.match(timeline, /entry\.kind === "reasoning"/);
  assert.match(timeline, /thoughtOpen \? \(/);
  assert.match(timeline, /accessibilityState=\{\{ expanded: thoughtOpen \}\}/);
  // Result excerpt: one line until tapped; confidential steps have none.
  assert.match(timeline, /entry\.confidential \? null : entry\.resultPreview/);
  assert.match(timeline, /numberOfLines=\{previewOpen \? undefined : 1\}/);
  // Plain text only, never markup or a web view.
  assert.doesNotMatch(timeline, /dangerouslySetInnerHTML|WebView|Markdown/u);
  for (const word of ["Denkschritte", "Thinking", "Ergebnis zeigen", "Show result"]) assert.match(timeline, new RegExp(word));

  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /view\.detail \? \(stepText \? `\$\{stepText\} · \$\{view\.detail\}` : view\.detail\) : stepText/);
  assert.match(surface, /useSteadyLine\(stepLine && stepLine !== headline \? stepLine : null\)/);
});
