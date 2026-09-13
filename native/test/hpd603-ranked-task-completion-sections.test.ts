import assert from "node:assert/strict";
import test from "node:test";
import {
  rankedTaskCompletionSections,
  type RankedTaskListRow,
  type RankedTaskListView,
} from "../core/ranked-task-list-view";

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
