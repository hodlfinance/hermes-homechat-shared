import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { rankedTaskListView, rankedTaskCompletionSections } from "../core/ranked-task-list-view";
import { buildRankedTaskChatPrompt, rankedTaskChatContext } from "../core/ranked-task-chat";
import { reconcileMobileRunBoundMessages } from "../src/mobile-run-binding";
import { rankedTaskLastUpdatedText } from "../src/mobile-ranked-task-last-updated";
import type { RankedTaskCollection } from "../core/ranked-tasks";

const now = "2026-09-13T12:00:00.000Z";
const card = (id: string, status: string) => ({ id, title: `Synthetic ${id}`, description: "", assignee: null,
  status: status as "triage", createdAt: now, updatedAt: now });
const collection: RankedTaskCollection = { tasks: [], pendingTasks: [card("t_open", "triage"),
  card("t_done", "done"), card("t_archived", "archived")], merges: [], sources: [], collectedAt: null, dispatchable: false };

function mount() {
  const slots: any[] = [];
  let cursor = 0;
  const jsx = (type: any, props: any) => ({ type, props });
  const react = {
    useState(initial: any) { const i = cursor++; if (!(i in slots)) slots[i] = initial;
      return [slots[i], (next: any) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
    useRef(initial: any) { const i = cursor++; return slots[i] ??= { current: initial }; },
  };
  const exports: any = {};
  // Execute actual component behavior with a lightweight native host renderer.
  const code = ts.transpileModule(readFileSync(new URL("../src/RankedTaskList.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require(name: string) {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "react-native") return { View: "View", Text: "Text", Pressable: "Pressable", Modal: "Modal", StyleSheet: { create: (v: any) => v } };
    if (name.includes("ranked-task-list-view")) return { rankedTaskListView, rankedTaskCompletionSections };
    if (name.includes("mobile-ranked-task-last-updated")) return { rankedTaskLastUpdatedText };
    if (name.includes("mobile-palette")) return { palette: {} };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const calls: { action: string; id: string }[] = [];
  const on = (action: string) => (row: { id: string }) => calls.push({ action, id: row.id });
  function expand(tree: any): any {
    if (!tree || typeof tree !== "object") return tree;
    if (Array.isArray(tree)) return tree.map(expand);
    if (typeof tree.type === "function") return expand(tree.type(tree.props));
    return { ...tree, props: { ...tree.props, children: expand(tree.props?.children) } };
  }
  function render() { cursor = 0; return expand(exports.RankedTaskList({ collection,
    onComplete: on("complete"), onDismiss: on("dismiss"), onChat: on("chat") })); }
  function nodes(tree: any): any[] { if (!tree || typeof tree !== "object") return [];
    if (Array.isArray(tree)) return tree.flatMap(nodes); return [tree, ...nodes(tree.props?.children)]; }
  function label(node: any): string { if (Array.isArray(node)) return node.map(label).join(""); const children = node?.props?.children;
    return Array.isArray(children) ? children.map((v) => typeof v === "object" ? label(v) : v).join("")
      : typeof children === "object" ? label(children) : String(children ?? ""); }
  function button(tree: any, text: string) { const found = nodes(tree).find(n => n.props?.onPress && label(n) === text);
    assert.ok(found, `button ${text} exists`); return found; }
  return { render, nodes, label, button, calls };
}

test("pending card remains unscored and has Done/Dismiss/Chat controls", () => {
  const h = mount();
  let tree = h.render();
  assert.match(h.label(tree), /Not ranked yet/);
  assert.doesNotMatch(h.label(tree), /Synthetic t_done|Synthetic t_archived|Score:/);
  h.button(tree, "Chat").props.onPress();
  assert.deepEqual(h.calls, [{ action: "chat", id: "t_open" }]);
  h.button(tree, "Done").props.onPress();
  assert.equal(h.calls.length, 1);
  h.button(h.render(), "Cancel").props.onPress();
  assert.equal(h.calls.length, 1);
  h.button(h.render(), "Done").props.onPress();
  tree = h.render();
  const modal = h.nodes(tree).find(n => n.type === "Modal" && n.props.visible);
  const confirm = h.button(modal, "Done");
  confirm.props.onPress(); confirm.props.onPress();
  assert.deepEqual(h.calls.at(-1), { action: "complete", id: "t_open" });
  assert.equal(h.calls.length, 2);
  h.button(h.render(), "Dismiss").props.onPress();
  const dismissModal = h.nodes(h.render()).find(n => n.type === "Modal" && n.props.visible);
  h.button(dismissModal, "Dismiss").props.onPress();
  assert.deepEqual(h.calls.at(-1), { action: "dismiss", id: "t_open" });
});

test("pending completed cards retain HPD603 folding; archived stay hidden", () => {
  const h = mount();
  const toggle = h.nodes(h.render()).find(n => n.props?.onPress && h.label(n).includes("Show completed tasks"));
  assert.ok(toggle); toggle.props.onPress();
  const text = h.label(h.render());
  assert.match(text, /Synthetic t_done/);
  assert.doesNotMatch(text, /Synthetic t_archived/);
});

test("pending Chat carries native identity without invented score or time", () => {
  const row = rankedTaskListView(collection).pendingRows[0]!;
  const context = rankedTaskChatContext(row);
  assert.equal(context.kanbanId, "t_open");
  assert.equal(context.score, null);
  assert.equal(context.rank, null);
  assert.equal(context.source, "kanban");
  assert.equal("deadline" in context, false);
  assert.equal("nextReview" in context, false);
  assert.equal(buildRankedTaskChatPrompt(row, "de"), "Kanban-ID: t_open");
});

test("same-ID local summary hydration replaces receipt without duplicate", () => {
  const receipt = { id: "local_summary_1", runId: "run1", conversationSessionId: "conversation1",
    role: "assistant" as const, content: "Local summary available", createdAt: now };
  const hydrated = { ...receipt, content: "Synthetic local scanner summary" };
  const merged = reconcileMobileRunBoundMessages({ conversationSessionId: "conversation1", current: [receipt], incoming: [hydrated] });
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.content, hydrated.content);
  assert.equal(reconcileMobileRunBoundMessages({ conversationSessionId: "other", current: [], incoming: [hydrated] }).length, 0);
});

test("missing source observations remain unavailable while pending cards display", () => {
  const emptySources = rankedTaskListView(collection);
  assert.equal(emptySources.pendingRows.length, 3);
  assert.equal(emptySources.sources.length, 4);
  assert.ok(emptySources.sources.every(s => s.state === "unavailable" && s.observedAt === null));
  const partial = rankedTaskListView({ ...collection, sources: [{ source: "kanban", state: "complete", observedAt: now }] });
  assert.equal(partial.sources.find(s => s.source === "kanban")?.state, "complete");
  assert.ok(partial.sources.filter(s => s.source !== "kanban").every(s => s.state === "unavailable" && s.observedAt === null));
});
