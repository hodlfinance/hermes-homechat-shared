import assert from "node:assert/strict";
import test from "node:test";
import {
  rankedTaskCompletionSections,
  rankedTaskListView,
  type RankedTaskListRow,
  type RankedTaskListView,
} from "../core/ranked-task-list-view";
import { buildRankedTaskList } from "../core/ranked-tasks";

test("native Ranked Tasks shows open by default, completed on demand, and never dismissed", () => {
  const row = (
    id: string,
    nativeStatus: RankedTaskListRow["nativeStatus"],
    candidateState: RankedTaskListRow["candidateState"],
  ) => Object.freeze({ id, nativeStatus, candidateState, rank: null }) as RankedTaskListRow;
  const open = row("open", "open", null);
  const done = row("done", "done", null);
  const finding = row("finding", null, "suggested");
  const completed = row("completed", null, "completed");
  const dismissed = row("dismissed", "dismissed", null);
  const dismissedFinding = row("dismissed-finding", null, "dismissed");
  const pendingRows = Object.freeze([
    Object.freeze({ id: "pending", title: "Pending", nativeStatus: "open" as const }),
    Object.freeze({ id: "pending-done", title: "Done", nativeStatus: "done" as const }),
    Object.freeze({ id: "pending-archived", title: "Archived", nativeStatus: "dismissed" as const }),
  ]);
  const rows = Object.freeze([open, done, finding, completed, dismissed, dismissedFinding]);
  const view: RankedTaskListView = Object.freeze({
    rows,
    pendingRows,
    sources: [],
    collectedAt: null,
    dispatchable: false,
  });

  const sections = rankedTaskCompletionSections(view);
  assert.deepEqual(sections.rows, [open, finding]);
  assert.deepEqual(sections.completedRows, [done, completed]);
  assert.deepEqual(sections.pendingRows, [pendingRows[0]]);
  assert.deepEqual(sections.completedPendingRows, [pendingRows[1]]);
  assert.equal(view.rows, rows);
});

test("native raw candidate projection keeps a completed and dismissed finding dismissed", () => {
  const now = "2026-09-13T08:00:00.000Z";
  const tasks = buildRankedTaskList({
    nativeTasks: [],
    metadata: [],
    candidates: [{
      id: `ranked_${"d".repeat(64)}`,
      source: "vault",
      sourceLabel: "Vault",
      title: "Do not reopen this finding",
      urgency: { value: 3, origin: "inferred" },
      importance: { value: 3, origin: "inferred" },
      time: { kind: "none", nextReviewAt: "2026-09-14T08:00:00.000Z" },
      observedAt: now,
      createdAt: now,
      updatedAt: now,
      completed: true,
      dismissed: true,
    }],
  });
  const sections = rankedTaskCompletionSections(rankedTaskListView({
    tasks,
    sources: (["kanban", "email_triage", "vault", "memory"] as const).map((source) => ({
      source,
      state: "unavailable" as const,
      observedAt: null,
    })),
    collectedAt: now,
    dispatchable: false,
  }));

  assert.equal(tasks[0]?.candidateState, "dismissed");
  assert.deepEqual(sections.rows, []);
  assert.deepEqual(sections.completedRows, []);
});
