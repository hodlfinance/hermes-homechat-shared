import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { permitsHodlNativeR8Request } from "../policy";
import { mobileMarkdownBlocks } from "../src/mobile-markdown";
import { mobileBlockingRunId } from "../src/mobile-stop-target";

// Build 45 fixes from Justus' device check of Build 44 (2026-09-23).

test("HPD-807: the HODL host may send a clarify answer, and only that", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/chat-runs/run_j5HhWaWXr56_o-/clarify"), true);
  assert.equal(permitsHodlNativeR8Request("GET", "/chat-runs/run_j5HhWaWXr56_o-/clarify"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/chat-runs/run_x/clarify/extra"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/chat-runs//clarify"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/chat-runs/../admin/clarify"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/chat-runs/run_x/approve"), false);
});

test("HPD-807: Stop goes to the run holding the conversation, not the newest queued one", () => {
  // Justus, 00:55Z: the clarify run waited, three runs queued behind it, and
  // the app had resumed the newest one ("Bist Du da?") as the active run.
  const statuses = {
    run_j5HhWaWXr56_o: "waiting_for_approval",
    run_zqfZl8bNjCFnoA: "queued",
    run_QKvtjD9_OEVgX0: "queued",
  } as const;
  const conversation = Object.keys(statuses);
  assert.equal(mobileBlockingRunId(statuses, conversation, "run_QKvtjD9_OEVgX0"), "run_j5HhWaWXr56_o");
  // The active run is itself the one waiting: the normal Stop path handles it.
  assert.equal(mobileBlockingRunId(statuses, conversation, "run_j5HhWaWXr56_o"), null);
  // A running run ahead of a queued active run holds the conversation too.
  assert.equal(mobileBlockingRunId({ a: "running", b: "queued" }, ["a", "b"], "b"), "a");
  // Finished runs never block; runs of other conversations are not passed in.
  assert.equal(mobileBlockingRunId({ a: "completed", b: "cancelled", c: "queued" }, ["a", "b", "c"], "c"), null);
  assert.equal(mobileBlockingRunId({}, [], null), null);
});

test("HPD-807: the Stop control reaches the blocking run through the API before the active-run path", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const stop = surface.slice(surface.indexOf("async function stopReply()"), surface.indexOf("async function resumeChatRun("));
  const blocking = stop.indexOf("mobileBlockingRunId(chatRunStatusesById, Object.keys(chatEventsByRunId), activeChatRunId,");
  const apiStop = stop.indexOf("await hermesApi.stopRun(blockingRunId, {})");
  const activePath = stop.indexOf("if (!activeChatRunId) {");
  assert.ok(blocking > 0 && apiStop > blocking && activePath > apiStop);
});

test("HPD-807: the clarify card's answer field has a visible placeholder", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const card = surface.slice(surface.indexOf("function MobileChatClarifyCard("), surface.indexOf("const reduceMotionStore"));
  assert.match(card, /placeholder="Other answer"\s+placeholderTextColor=\{palette\.muted\}/);
});

test("HPD-822: the stop control is an outline circle with a filled square, never red", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(surface, /#dc2626/i);
  const style = surface.slice(surface.indexOf("  stopButton: {"), surface.indexOf("  disabledButton: {"));
  assert.match(style, /backgroundColor: "transparent"/);
  assert.match(style, /borderColor: palette\.ink/);
  assert.match(style, /borderWidth: 2/);
  assert.match(surface, /<Square size=\{14\} color=\{palette\.ink\} fill=\{palette\.ink\} \/>/);
});

test("HPD-808: bullet and numbered lists become list blocks with their inline marks", () => {
  const blocks = mobileMarkdownBlocks("**Buy/positiv:**\n- **Bank of America** – Buy *(marketscreener, 21.09.)*\n- **Berenberg** – Buy\n\n1. first\n2. second\n  continued");
  assert.deepEqual(blocks.map((block) => block.kind), ["paragraph", "list", "list"]);
  const bullets = blocks[1] as Extract<(typeof blocks)[number], { kind: "list" }>;
  assert.equal(bullets.ordered, false);
  assert.equal(bullets.items.length, 2);
  assert.deepEqual(bullets.items[0], [
    { kind: "bold", text: "Bank of America" },
    { kind: "plain", text: " – Buy " },
    { kind: "italic", text: "(marketscreener, 21.09.)" },
  ]);
  const numbered = blocks[2] as Extract<(typeof blocks)[number], { kind: "list" }>;
  assert.equal(numbered.ordered, true);
  assert.deepEqual(numbered.items.map((item) => item.map((segment) => segment.text).join("")), ["first", "second\ncontinued"]);
});

test("HPD-808: single-marker emphasis is italic only where it is emphasis", () => {
  const segments = (value: string) => {
    const [block] = mobileMarkdownBlocks(value);
    return block && "segments" in block ? block.segments : [];
  };
  assert.deepEqual(segments("*(Reuters, 14.09.)* ok"), [
    { kind: "italic", text: "(Reuters, 14.09.)" },
    { kind: "plain", text: " ok" },
  ]);
  assert.deepEqual(segments("**bold** and _it_"), [
    { kind: "bold", text: "bold" },
    { kind: "plain", text: " and " },
    { kind: "italic", text: "it" },
  ]);
  for (const unchanged of ["snake_case_name stays", "2*3*4 stays", "a * b * c stays", "_leading only", "x * not closed"]) {
    assert.deepEqual(segments(unchanged), [{ kind: "plain", text: unchanged }], unchanged);
  }
});

test("HPD-808: both renderers draw lists and italic", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const card = readFileSync(new URL("../src/FinanceArtifactCard.tsx", import.meta.url), "utf8");
  for (const source of [surface, card]) {
    assert.match(source, /block\.kind === "list"/);
    assert.match(source, /block\.ordered \? `\$\{itemIndex \+ 1\}\.` : "•"/);
    assert.match(source, /fontStyle: "italic"/);
  }
});
