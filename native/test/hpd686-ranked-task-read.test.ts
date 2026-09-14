import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RankedTaskCollection } from "../core/ranked-tasks";
import { mobileRankedTaskRead } from "../src/mobile-ranked-task-read";

const emptyCollection: RankedTaskCollection = {
  tasks: [],
  pendingTasks: [],
  sources: [
    { source: "kanban", state: "complete", observedAt: "2026-09-14T13:30:00.000Z" },
    { source: "email_triage", state: "unavailable", observedAt: null },
    { source: "vault", state: "unavailable", observedAt: null },
    { source: "memory", state: "unavailable", observedAt: null },
  ],
  collectedAt: null,
  dispatchable: false,
  projection: null,
};

describe("HPD-686 mobile Ranked Tasks response boundary", () => {
  it("accepts the intentional pre-first-publish empty collection", () => {
    const result = mobileRankedTaskRead(emptyCollection);
    assert.equal(result.phase, "ready");
    if (result.phase === "ready") {
      assert.deepEqual(result.view.rows, []);
      assert.deepEqual(result.view.pendingRows, []);
    }
  });

  for (const [name, payload] of [
    ["null response", null],
    ["partial response", {}],
    ["dispatchable response", { ...emptyCollection, dispatchable: true }],
    ["missing task array", { ...emptyCollection, tasks: null }],
    ["invalid collection time", { ...emptyCollection, collectedAt: "not-an-instant" }],
  ] as const) {
    it(`turns ${name} into a recoverable error state`, () => {
      assert.deepEqual(mobileRankedTaskRead(payload), { phase: "error" });
    });
  }

  it("accepts an empty source inventory for a fresh workspace", () => {
    const result = mobileRankedTaskRead({ ...emptyCollection, sources: [] });
    assert.equal(result.phase, "ready");
    if (result.phase === "ready") assert.equal(result.view.sources.length, 4);
  });

  it("still accepts a normal populated pending inventory", () => {
    const result = mobileRankedTaskRead({
      ...emptyCollection,
      pendingTasks: [{
        id: "task_1",
        title: "Check the release",
        description: "",
        assignee: null,
        status: "triage",
        createdAt: "2026-09-14T13:30:00.000Z",
        updatedAt: "2026-09-14T13:31:00.000Z",
      }],
    });
    assert.equal(result.phase, "ready");
    if (result.phase === "ready") {
      assert.deepEqual(result.view.pendingRows, [{
        id: "task_1",
        title: "Check the release",
        nativeStatus: "open",
      }]);
    }
  });
});
