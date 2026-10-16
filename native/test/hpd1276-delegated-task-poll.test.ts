import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { HermesDelegatedTask } from "../core/hermes-api";
import {
  DELEGATED_TASK_POLL_ACTIVE_MS,
  DELEGATED_TASK_POLL_IDLE_MS,
  createDelegatedTaskPollLoop,
  nextDelegatedTasks,
} from "../src/delegated-task-poll";

// HPD-1276: HODL 9.37 was slow while Hermes was active. The delegated-task
// poll set a new array every 2.5 s, which re-rendered the whole Hermes surface
// (including the long Home chat) even with another tab open or the app in the
// background.

function task(overrides: Partial<HermesDelegatedTask> = {}): HermesDelegatedTask {
  return {
    taskId: "task-synthetic-1",
    name: "Synthetic task",
    conversationId: "conversation-synthetic-1",
    sourceRunId: "run-synthetic-1",
    sourceConversationId: "home-synthetic",
    resultMessageId: null,
    runId: "run_delegated_synthetic-1",
    state: "completed",
    startedAt: "2026-10-16T10:00:00.000Z",
    updatedAt: "2026-10-16T10:01:00.000Z",
    completedAt: "2026-10-16T10:01:00.000Z",
    ...overrides,
  };
}

/** A fake clock: timers run only when the test advances time. */
function fakeTimers() {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; run: () => void }>();
  return {
    timers: {
      setTimeout: (run: () => void, ms: number) => {
        const id = nextId++;
        pending.set(id, { at: now + ms, run });
        return id;
      },
      clearTimeout: (id: unknown) => {
        pending.delete(id as number);
      },
    },
    pendingCount: () => pending.size,
    async advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const due = [...pending.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        pending.delete(due[0]);
        now = due[1].at;
        due[1].run();
        await new Promise((resolve) => setImmediate(resolve));
      }
      now = end;
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

test("an unchanged poll result causes no state update", () => {
  const first = task();
  const second = task({ taskId: "task-synthetic-2", state: "running", completedAt: null });
  const previous = [first, second];
  // The server answers with fresh objects that carry the same values.
  const sameAgain = previous.map((item) => ({ ...item }));
  assert.equal(nextDelegatedTasks(previous, sameAgain), previous, "same values keep the same array, so React skips the render");
  const empty: HermesDelegatedTask[] = [];
  assert.equal(nextDelegatedTasks(empty, []), empty, "an empty answer keeps an empty list");

  // React's useState skips a render only when the next value is the previous one.
  let state: HermesDelegatedTask[] = previous;
  let renders = 0;
  const setState = (update: (current: HermesDelegatedTask[]) => HermesDelegatedTask[]) => {
    const next = update(state);
    if (!Object.is(next, state)) renders += 1;
    state = next;
  };
  for (let round = 0; round < 10; round += 1) {
    const answer = previous.map((item) => ({ ...item }));
    setState((current) => nextDelegatedTasks(current, answer));
  }
  assert.equal(renders, 0, "ten identical polls render nothing");

  for (const change of [
    { state: "completed" as const },
    { updatedAt: "2026-10-16T10:02:00.000Z" },
    { resultMessageId: "message-synthetic-result" },
    { name: "Renamed" },
  ]) {
    const changed: HermesDelegatedTask[] = [first, { ...second, ...change }];
    assert.equal(nextDelegatedTasks(previous, changed), changed, `a change of ${Object.keys(change)[0]} is taken over`);
  }
  assert.notEqual(nextDelegatedTasks(previous, previous.slice(0, 1)), previous, "a removed task is taken over");
  assert.notEqual(nextDelegatedTasks(previous, [...previous].reverse()), previous, "a new order is taken over");
});

test("the poll stops while the Hermes surface is hidden or the app is in the background", async () => {
  const clock = fakeTimers();
  let polls = 0;
  const loop = createDelegatedTaskPollLoop({
    poll: async () => {
      polls += 1;
      return [task({ state: "running", completedAt: null })];
    },
    timers: clock.timers,
  });
  loop.setConditions({ inView: true, urgent: false });
  await clock.advance(0);
  assert.equal(polls, 1, "in view: one read at once");
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS * 2);
  assert.equal(polls, 3, "a running task keeps the 2.5 s cadence");

  loop.setConditions({ inView: false, urgent: false });
  assert.equal(clock.pendingCount(), 0, "no timer stays armed while hidden");
  await clock.advance(10 * 60_000);
  assert.equal(polls, 3, "no read for ten minutes while hidden");

  loop.stop();
  loop.setConditions({ inView: true, urgent: false });
  await clock.advance(60_000);
  assert.equal(polls, 3, "a stopped loop never reads again");
});

test("the poll resumes at once on focus and polls rarely when nothing runs", async () => {
  const clock = fakeTimers();
  let polls = 0;
  let answer: HermesDelegatedTask[] = [task()];
  const loop = createDelegatedTaskPollLoop({
    poll: async () => {
      polls += 1;
      return answer;
    },
    timers: clock.timers,
  });
  loop.setConditions({ inView: false, urgent: false });
  await clock.advance(60_000);
  assert.equal(polls, 0, "never in view: no read");

  loop.setConditions({ inView: true, urgent: false });
  await clock.advance(0);
  assert.equal(polls, 1, "focus reads at once");
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS * 4);
  assert.equal(polls, 1, "only finished tasks: no 2.5 s cadence");
  await clock.advance(DELEGATED_TASK_POLL_IDLE_MS);
  assert.equal(polls, 2, "only finished tasks: one read per 30 s");

  // A chat run is going on: a delegation may start any moment.
  loop.setConditions({ inView: true, urgent: true });
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS);
  assert.equal(polls, 3, "an urgent condition returns to the 2.5 s cadence");

  answer = [task({ state: "running", completedAt: null })];
  loop.setConditions({ inView: true, urgent: false });
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS);
  assert.equal(polls, 4);
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS);
  assert.equal(polls, 5, "a running task read by the poll keeps the 2.5 s cadence");

  loop.setConditions({ inView: false, urgent: false });
  await clock.advance(60_000);
  loop.setConditions({ inView: true, urgent: false });
  await clock.advance(0);
  assert.equal(polls, 6, "returning to the front reads at once again");
  loop.stop();
});

test("a failed or hanging read never stops the loop", async () => {
  const clock = fakeTimers();
  let polls = 0;
  const loop = createDelegatedTaskPollLoop({
    poll: () => {
      polls += 1;
      if (polls === 1) return Promise.reject(new Error("synthetic network failure"));
      return new Promise<never>(() => undefined);
    },
    timers: clock.timers,
  });
  loop.setConditions({ inView: true, urgent: true });
  await clock.advance(DELEGATED_TASK_POLL_ACTIVE_MS * 3);
  assert.equal(polls, 4, "the next read is armed when a read starts, not when it ends");
  loop.stop();
});

test("native wiring: the surface polls through the loop with the host visibility and app state", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /setInterval\(poll, 2_500\)/, "no fixed 2.5 s interval");
  assert.doesNotMatch(source, /setDelegatedTasks\(tasks\)/, "no unconditional state update");
  assert.match(source, /setDelegatedTasks\(\(previous\) => nextDelegatedTasks\(previous, tasks\)\)/);
  assert.match(source, /createDelegatedTaskPollLoop\(\{/);
  assert.match(source, /inView: hostVisible && appInFront/);
  assert.match(source, /delegatedTaskPollLoopRef\.current\?\.setConditions\(delegatedTaskPollConditions\)/);
});

test("native wiring: chat bubbles skip renders when their message did not change", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /const MessageBubble = memo\(function MessageBubble\(/);
});

test("native wiring: the running-work clock ticks only while a task is active", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const indicator = source.slice(source.indexOf("const [nowMs, setNowMs] = useState(() => Date.now());"));
  assert.match(indicator.slice(0, 600), /if \(!activeTaskCount\) return;/);
  assert.match(indicator.slice(0, 600), /\}, \[activeTaskCount\]\);/);
});

test("hiding or stopping while a read is in flight arms nothing afterwards", async () => {
  const clock = fakeTimers();
  let polls = 0;
  let finish: (tasks: HermesDelegatedTask[]) => void = () => undefined;
  const loop = createDelegatedTaskPollLoop({
    poll: () => {
      polls += 1;
      return new Promise<HermesDelegatedTask[]>((resolve) => { finish = resolve; });
    },
    timers: clock.timers,
  });
  loop.setConditions({ inView: true, urgent: false });
  loop.setConditions({ inView: false, urgent: false });
  finish([task({ state: "running", completedAt: null })]);
  await clock.advance(0);
  assert.equal(clock.pendingCount(), 0, "a running task read after hiding does not re-arm the loop");
  await clock.advance(10 * 60_000);
  assert.equal(polls, 1);

  loop.setConditions({ inView: true, urgent: false });
  assert.equal(polls, 2);
  loop.stop();
  finish([task({ state: "running", completedAt: null })]);
  await clock.advance(10 * 60_000);
  assert.equal(clock.pendingCount(), 0, "a read that lands after stop arms nothing");
  assert.equal(polls, 2);
});
