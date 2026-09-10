import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createMobileRankedTaskObserver, mobileRankedTaskNoticeAfterRead } from "../src/mobile-ranked-task-observer";

test("visible unranked task receives completed projection without navigation or a second start", async () => {
  let visible = true;
  let collection = { pendingTasks: ["synthetic-task"], rank: null as number | null, collectedAt: "old" };
  let calls = 0;
  let finishRead!: () => void;
  const observer = createMobileRankedTaskObserver({
    shouldObserve: () => visible,
    reload: async () => {
      calls += 1;
      await new Promise<void>((resolve) => { finishRead = resolve; });
      collection = { pendingTasks: [], rank: 2, collectedAt: "new" };
    },
  });
  const first = observer.observe();
  await observer.observe();
  assert.equal(calls, 1, "overlapping shell ticks do not duplicate reads");
  assert.equal(collection.collectedAt, "old", "existing collection remains visible during read");
  finishRead();
  await first;
  assert.deepEqual(collection, { pendingTasks: [], rank: 2, collectedAt: "new" });
  visible = false;
  await observer.observe();
  assert.equal(calls, 1, "leaving Tasks stops observation");
});

test("scheduled projection updates an already ranked list with no pending tasks", async () => {
  let collection = { pendingTasks: [], rank: 2, collectedAt: "previous-projection" };
  let serverCollection = collection;
  const observer = createMobileRankedTaskObserver({
    shouldObserve: () => true,
    reload: async () => { collection = serverCollection; },
  });
  await observer.observe();
  assert.equal(collection.collectedAt, "previous-projection");
  serverCollection = { pendingTasks: [], rank: 1, collectedAt: "scheduled-projection" };
  await observer.observe();
  assert.deepEqual(collection, { pendingTasks: [], rank: 1, collectedAt: "scheduled-projection" });
});

test("failed read releases observation without discarding valid rows", async () => {
  let calls = 0;
  const collection = { pendingTasks: ["synthetic-task"], collectedAt: "old" };
  const observer = createMobileRankedTaskObserver({
    shouldObserve: () => true,
    reload: async () => { calls += 1; if (calls === 1) throw new Error("read failed"); },
  });
  await assert.rejects(observer.observe(), /read failed/);
  assert.equal(collection.collectedAt, "old");
  await observer.observe();
  assert.equal(calls, 2);
});

test("native wiring reuses the existing tick and guards account and request identity", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const loader = source.slice(source.indexOf("  const loadRankedTasks ="), source.indexOf("  const pluginCatalogRequestRef"));
  assert.match(loader, /if \(!background\) setRankedTaskState\(\{ phase: "loading" \}\)/);
  assert.match(loader, /if \(!background\) setRankedTaskState\(\{ phase: "error" \}\)/);
  assert.match(loader, /rankedTaskRequestRef.current !== requestId/);
  assert.match(loader, /accountSessionGenerationRef.current !== sessionGeneration/);
  assert.match(loader, /accountSessionTokenRef.current !== requestToken/);
  assert.match(loader, /reload: \(\) => loadRankedTasks\(true\)/);
  assert.match(source, /const poll = \(\) => \{[\s\S]*?rankedTaskObserver.observe\(\)[\s\S]*?hermesApi.delegatedTasks/);
  assert.match(source, /rankedTasksVisibleRef.current = tab === "tasks" && rankedTaskState.phase === "ready";/);
});

test("background reads preserve mutation errors while clearing only recovered read errors", () => {
  for (const outcome of ["started", "succeeded", "failed"] as const) {
    assert.equal(mobileRankedTaskNoticeAfterRead("change_error", outcome, true), "change_error");
  }
  assert.equal(mobileRankedTaskNoticeAfterRead("load_error", "started", true), "load_error");
  assert.equal(mobileRankedTaskNoticeAfterRead("load_error", "succeeded", true), null);
  assert.equal(mobileRankedTaskNoticeAfterRead(null, "failed", true), "load_error");
  assert.equal(mobileRankedTaskNoticeAfterRead("change_error", "started", false), null);
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const loader = source.slice(source.indexOf("  const loadRankedTasks ="), source.indexOf("  const rankedTaskObserver ="));
  for (const outcome of ["started", "succeeded", "failed"]) {
    assert.ok(loader.includes(`mobileRankedTaskNoticeAfterRead(previous, "${outcome}", background)`));
  }
  assert.doesNotMatch(loader, /setTaskNotice\((?:null|"load_error")\)/);
});
