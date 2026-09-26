import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { HermesDelegatedTask } from "../core/index";
import { delegatedTasksView } from "../core/delegated-tasks-view";
import { automationThreadViewAllLabel } from "../src/mobile-automation-threads";

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const now = Date.parse("2026-09-25T07:00:00.000Z");

function task(taskId: string, sourceConversationId: string | null | undefined): HermesDelegatedTask {
  return {
    taskId,
    name: `Task ${taskId}`,
    conversationId: `session_child_${taskId}`,
    sourceRunId: `run_${taskId}`,
    sourceConversationId,
    state: "running",
    startedAt: "2026-09-25T06:59:00.000Z",
    updatedAt: "2026-09-25T06:59:30.000Z",
    completedAt: null,
  } as HermesDelegatedTask;
}

// HPD-897: a task started in Home stood in an automation thread's bar.
test("HPD-897: each conversation's bar shows only the background tasks started in it", () => {
  const tasks = [task("home1", "session_home"), task("home2", "session_home"), task("thread1", "session_thread")];
  assert.deepEqual(delegatedTasksView(tasks, now, "session_home")?.rows.map((row) => row.taskId), ["home1", "home2"]);
  assert.deepEqual(delegatedTasksView(tasks, now, "session_thread")?.rows.map((row) => row.taskId), ["thread1"]);
  assert.equal(delegatedTasksView([task("home1", "session_home")], now, "session_thread"), null, "no bar at all in the other conversation");
  // A plane that does not say where a task started: shown, as before.
  assert.deepEqual(delegatedTasksView([task("old", undefined)], now, "session_thread")?.rows.map((row) => row.taskId), ["old"]);
});

test("HPD-897: the chat hands the bar the conversation on screen", () => {
  assert.match(source, /<MobileDelegatedTasksIndicator locale=\{appLocale\}\s*tasks=\{delegatedTasks\}\s*conversationId=\{activeConversationSessionId\}/);
  assert.match(source, /delegatedTasksView\(\s*tasks\.filter\(\(task\) => !dismissedTaskIds\.includes\(task\.taskId\)\),\s*nowMs,\s*conversationId,\s*\)/);
});

// HPD-898, Justus' wording: "View all automations" / "Alle Automationen anzeigen".
test("HPD-898: an automation thread's menu offers View all automations in every app language", () => {
  assert.equal(automationThreadViewAllLabel("en"), "View all automations");
  assert.equal(automationThreadViewAllLabel("de"), "Alle Automationen anzeigen");
  const labels = (["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const).map(automationThreadViewAllLabel);
  assert.equal(new Set(labels).size, 8);
  // HPD-924: the entry now sits in the open thread's top-right options.
  assert.match(source, /extraAction=\{\{ label: automationThreadViewAllLabel\(appLocale\), onPress: \(\) => selectMobileScreen\("automations"\) \}\}/);
  const row = readFileSync(new URL("../src/mobile-page-menu-row.tsx", import.meta.url), "utf8");
  assert.match(row, /const options = extraAction \? \[copy\.cancel, extraAction\.label, copy\.remove\] : \[copy\.cancel, copy\.remove\];/);
});
