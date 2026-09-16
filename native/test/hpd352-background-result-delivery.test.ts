import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { HermesDelegatedTask } from "../core/hermes-api";
import { mobileDelegatedTaskResultObservationUntil } from "../core/delegated-tasks-view";

function task(state: HermesDelegatedTask["state"]): HermesDelegatedTask {
  return {
    taskId: "delegation-1",
    name: "Research the flight",
    conversationId: "session_child",
    sourceRunId: "run_parent",
    state,
    startedAt: "2026-09-16T04:00:00.000Z",
    updatedAt: "2026-09-16T04:01:00.000Z",
    completedAt: state === "running" || state === "human_gate"
      ? null
      : "2026-09-16T04:01:00.000Z",
  };
}

test("native chat keeps observing persisted replies while delegated work runs and briefly after it finishes", () => {
  const now = Date.parse("2026-09-16T04:01:00.000Z");
  const activeUntil = mobileDelegatedTaskResultObservationUntil([task("running")], now, 0);
  assert.equal(activeUntil, now + 60_000);

  const completedUntil = mobileDelegatedTaskResultObservationUntil(
    [task("completed")],
    now + 2_500,
    activeUntil,
  );
  assert.equal(completedUntil, activeUntil);

  assert.equal(
    mobileDelegatedTaskResultObservationUntil([task("completed")], activeUntil + 1, activeUntil),
    0,
  );
  assert.equal(mobileDelegatedTaskResultObservationUntil([task("completed")], now, 0), 0);
});

test("native task observer refreshes the visible transcript independently of push permission", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const observer = surface.slice(
    surface.indexOf("const poll = () =>"),
    surface.indexOf("poll();"),
  );
  assert.match(observer, /mobileDelegatedTaskResultObservationUntil/);
  assert.match(observer, /chatConversationController\.refreshMessages/);
  assert.match(observer, /mergeHomechatMessages/);
  assert.doesNotMatch(observer, /Notifications|mobilePush/);
});
