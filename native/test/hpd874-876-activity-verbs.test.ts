import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  appLocales,
  heyActivityStepForTool,
  heyActivityStepFromHermesPhrase,
  heyActivityStepText,
  heyActivityToolKeys,
  heyActivityToolText,
  heyActivityVerbKeys,
  heyActivityVerbText,
  heyDelegatedActivityDurationText,
  heyDelegatedActivityTimeline,
  heyLiveRunPresentation,
  heySteadyLineDecision,
  type ChatRunEvent,
} from "../core/index";
import { mobileLiveRunActivityView } from "../src/mobile-live-run-status";

const trusted = { source: "hermes_gateway", platform: "heyhermes_web", chatId: "chat-hpd-876" };

function status(id: string, payload: Record<string, unknown>): ChatRunEvent {
  return { id, runId: "run-hpd-876", type: "status", payload, createdAt: `2026-09-24T10:00:0${id}.000Z` };
}

function child(id: string, phase: string, content: string): ChatRunEvent {
  return {
    id,
    runId: "run_delegated_000000000000000000000000",
    type: "status",
    payload: { source: "hermes_gateway", status: "running", phase, content },
    createdAt: `2026-09-24T10:00:${String(id).padStart(2, "0")}.000Z`,
  };
}

test("every verb and every tool name is said in all eight app languages", () => {
  assert.equal(appLocales.length, 8);
  for (const locale of appLocales) {
    for (const key of heyActivityVerbKeys) {
      const text = heyActivityVerbText(key, locale);
      assert.ok(text && text.trim().length > 1, `${locale}.${key}`);
    }
    for (const key of heyActivityToolKeys) {
      assert.ok(heyActivityToolText(key, locale).trim(), `${locale}.${key}`);
    }
  }
  // The German words from the issue, verbatim.
  assert.equal(heyActivityVerbText("searchingResearch", "de"), "Sucht Recherche");
  assert.equal(heyActivityVerbText("readingPortfolio", "de"), "Liest dein Portfolio");
  assert.equal(heyActivityVerbText("checkingPrices", "de"), "Prüft Kurse");
  assert.equal(heyActivityVerbText("writingFile", "de"), "Schreibt Datei");
  assert.equal(heyActivityVerbText("startingPage", "de"), "Startet Seite");
  assert.equal(heyActivityVerbText("thinking", "de"), "Denkt nach");
  assert.equal(heyActivityVerbText("summarizing", "de"), "Fasst zusammen");
  assert.equal(heyActivityVerbText("compacting", "de"), "Verdichtet den Verlauf");
  // An unknown locale falls back to English rather than to nothing.
  assert.equal(heyActivityVerbText("thinking", "xx"), "Thinking");
});

test("a tool or a Hermes phrase becomes a verb and a display name, never its input", () => {
  assert.deepEqual(heyActivityStepForTool("hodl_get_portfolio"), { verbKey: "readingPortfolio", toolKey: "portfolio" });
  assert.deepEqual(heyActivityStepForTool("mcp__hodl__get_quotes"), { verbKey: "checkingPrices", toolKey: "marketData" });
  assert.deepEqual(heyActivityStepForTool("research_search"), { verbKey: "searchingResearch", toolKey: "research" });
  assert.deepEqual(heyActivityStepForTool("google_gmail_read"), { verbKey: "readingEmail", toolKey: "gmail" });
  assert.equal(heyActivityStepForTool("custom_private_tool"), null);
  assert.equal(heyActivityStepForTool("rm -rf /"), null);

  assert.deepEqual(
    heyActivityStepFromHermesPhrase("is searching the web for PRIVATE_QUERY_MARKER…"),
    { verbKey: "searchingWeb", toolKey: "web" },
  );
  assert.deepEqual(heyActivityStepFromHermesPhrase("is reading skill…"), { verbKey: "readingSkill", toolKey: "skills" });
  assert.deepEqual(heyActivityStepFromHermesPhrase("is using finance_tool_execute…"), { verbKey: "checkingFinance", toolKey: "finance" });
  assert.deepEqual(
    heyActivityStepFromHermesPhrase("🗜️ Compacting context — summarizing earlier conversation so I can continue..."),
    { verbKey: "compacting", toolKey: "context" },
  );
  assert.equal(heyActivityStepFromHermesPhrase("is using custom_private_tool…"), null);
  assert.equal(heyActivityStepFromHermesPhrase("I will look at API_KEY=marker"), null);

  assert.equal(heyActivityStepText({ verbKey: "searchingWeb", toolKey: "web" }, "de"), "Sucht im Web · Websuche");
  assert.equal(heyActivityStepText({ verbKey: "searchingWeb", toolKey: "web" }, "de", "searchingWeb"), "Websuche");
  assert.equal(heyActivityStepText({ verbKey: "askingYou", toolKey: null }, "en"), "Asking you");
});

test("the foreground headline is a localized verb and the live line names the newest step without inputs", () => {
  const events = [
    status("1", { status: "processing_started" }),
    status("2", { ...trusted, content: "is searching the web for PRIVATE_QUERY_MARKER…" }),
    status("3", { ...trusted, content: "is using hodl_get_portfolio…" }),
  ];
  const presentation = heyLiveRunPresentation({ events, runStatus: "running" });
  assert.equal(presentation?.verbKey, "readingPortfolio");
  assert.deepEqual(presentation?.step, { verbKey: "readingPortfolio", toolKey: "portfolio" });

  const view = mobileLiveRunActivityView({ events, runStatus: "running" });
  assert.equal(view?.summary?.verbKey, "readingPortfolio");
  assert.deepEqual(view?.step, { verbKey: "readingPortfolio", toolKey: "portfolio" });
  // What the native trail draws: the verb, and under it the step.
  const drawn = [
    heyActivityVerbText(view!.summary!.verbKey!, "de"),
    heyActivityStepText(view!.step!, "de", view!.summary!.verbKey),
  ];
  assert.deepEqual(drawn, ["Liest dein Portfolio", "Portfolio"]);
  const searching = heyLiveRunPresentation({ events: events.slice(0, 2), runStatus: "running" });
  assert.deepEqual(searching?.step, { verbKey: "searchingWeb", toolKey: "web" });
  assert.equal(JSON.stringify([searching?.verbKey, searching?.step]).includes("PRIVATE_QUERY_MARKER"), false);

  // A narration keeps its words as the headline; the step stays underneath.
  const narrated = heyLiveRunPresentation({
    events: [...events, status("4", { ...trusted, status: "assistant_commentary", content: "Now I compare the two positions." })],
    runStatus: "running",
  });
  assert.equal(narrated?.activity.label, "Now I compare the two positions.");
  assert.equal(narrated?.verbKey, null);
  assert.deepEqual(narrated?.step, { verbKey: "readingPortfolio", toolKey: "portfolio" });
});

test("a short answer without a tool says only thinking, then writing", () => {
  const thinking = heyLiveRunPresentation({ events: [status("1", { status: "processing_started" })], runStatus: "running" });
  assert.equal(thinking?.verbKey, "thinking");
  assert.equal(thinking?.step, null);

  const writing = heyLiveRunPresentation({
    assistantText: "Hier ist die Antwort.",
    events: [
      status("1", { ...trusted, content: "is searching the web…" }),
      { id: "2", runId: "run-hpd-876", type: "message_delta", payload: { content: "Hier ist die Antwort." }, createdAt: "2026-09-24T10:00:02.000Z" },
    ],
    runStatus: "running",
  });
  assert.equal(writing?.verbKey, "writing");
  assert.equal(writing?.step, null);

  assert.equal(heyLiveRunPresentation({ events: [], runStatus: "completed" }), null);
});

test("a line stays at least 1.2 seconds and then shows only the newest", () => {
  const shown = { shown: "Sucht im Web", shownAt: 1_000 };
  assert.deepEqual(heySteadyLineDecision(shown, "Sucht im Web", 1_100), { change: false, waitMs: 0 });
  assert.deepEqual(heySteadyLineDecision(shown, "Liest", 1_500), { change: false, waitMs: 700 });
  assert.deepEqual(heySteadyLineDecision(shown, "Prüft Kurse", 2_200), { change: true, waitMs: 0 });
  assert.deepEqual(heySteadyLineDecision({ shown: null, shownAt: 0 }, "Denkt nach", 5), { change: true, waitMs: 0 });
});

test("a background task's steps become a timeline with duration and outcome, never output text", () => {
  const events: ChatRunEvent[] = [
    child("1", "tool.started", "is searching the web…"),
    child("2", "tool.completed", "web_search finished in 3.2s."),
    child("3", "delegate.progress", "Step: Compared three providers\nFinding: Two offer a free tier"),
    child("4", "tool.started", "is using hodl_get_portfolio…"),
    child("5", "tool.completed", "hodl_get_portfolio hit an obstacle: PRIVATE_TOOL_OUTPUT_MARKER"),
    child("6", "tool.started", "is running…"),
    // Replayed after a reconnect: the same event id is one entry.
    child("6", "tool.started", "is running…"),
    { id: "7", runId: "x", type: "status", payload: { source: "other", phase: "tool.started", content: "is reading…" }, createdAt: "2026-09-24T10:00:07.000Z" },
  ];
  const timeline = heyDelegatedActivityTimeline(events);
  assert.equal(timeline.omitted, 0);
  assert.deepEqual(
    timeline.entries.map((entry) => entry.kind === "step"
      ? [entry.verbKey, entry.toolKey, entry.state, entry.durationMs]
      : ["note", entry.text]),
    [
      ["searchingWeb", "web", "ok", 3200],
      ["note", "Step: Compared three providers\nFinding: Two offer a free tier"],
      ["readingPortfolio", "portfolio", "error", null],
      ["runningCommand", "terminal", "running", null],
    ],
  );
  assert.equal(JSON.stringify(timeline).includes("PRIVATE_TOOL_OUTPUT_MARKER"), false);
  assert.equal(heyDelegatedActivityDurationText(3200), "3.2 s");
  assert.equal(heyDelegatedActivityDurationText(64_000), "1:04 min");
  assert.equal(heyDelegatedActivityDurationText(null), null);
});

test("the timeline is capped and a long note is cut", () => {
  const many = Array.from({ length: 260 }, (_, index) => child(String(index), "tool.started", "is reading…"));
  const capped = heyDelegatedActivityTimeline(many);
  assert.equal(capped.entries.length, 200);
  assert.equal(capped.omitted, 60);

  const long = heyDelegatedActivityTimeline([child("1", "delegate.progress", `Step: ${"x".repeat(900)}`)]);
  const note = long.entries[0];
  assert.equal(note?.kind, "note");
  assert.ok(note?.kind === "note" && note.truncated && note.text.length <= 500 && note.text.endsWith("…"));
});

test("the surfaces draw the verb, the live line, and the sub thread timeline", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /heyActivityVerbText\(summary\.verbKey, locale\)/);
  assert.match(surface, /useSteadyLine\(/);
  assert.match(surface, /<MobileDelegatedActivityTimeline/);
});
