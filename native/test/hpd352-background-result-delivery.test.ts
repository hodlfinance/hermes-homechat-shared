import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { HermesDelegatedTask } from "../core/hermes-api";
import { mobileDelegatedTaskResultMessageIds } from "../core/delegated-tasks-view";

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

test("native chat observes only exact persisted delegation replies for the visible conversation", () => {
  const delivered = {
    ...task("completed"),
    sourceConversationId: "session_home",
    resultMessageId: "msg_delivery_exact",
  };
  assert.deepEqual(
    mobileDelegatedTaskResultMessageIds([delivered], "session_home", new Set()),
    ["msg_delivery_exact"],
  );
  assert.deepEqual(
    mobileDelegatedTaskResultMessageIds([delivered], "session_other", new Set()),
    [],
  );
  assert.deepEqual(
    mobileDelegatedTaskResultMessageIds([delivered], "session_home", new Set(["msg_delivery_exact"])),
    [],
  );
  assert.deepEqual(
    mobileDelegatedTaskResultMessageIds([{ ...delivered, resultMessageId: null }], "session_home", new Set()),
    [],
  );
});

test("native task observer refreshes the visible transcript independently of push permission", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const observer = surface.slice(
    surface.indexOf("const poll = () =>"),
    surface.indexOf("poll();"),
  );
  assert.match(observer, /mobileDelegatedTaskResultMessageIds/);
  assert.match(observer, /chatConversationController\.refreshMessages/);
  assert.match(observer, /mergeHomechatMessages/);
  assert.match(observer, /receivedIds\.has\(resultMessageId\)/);
  assert.doesNotMatch(observer, /Notifications|mobilePush/);
});
