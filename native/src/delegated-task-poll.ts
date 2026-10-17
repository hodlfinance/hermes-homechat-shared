import type { HermesDelegatedTask } from "../core/index";
import { mobileDelegatedTaskIsTerminal } from "../core/delegated-tasks-view";

/**
 * HPD-1276. The delegated-task read used to run every 2.5 s and set a new
 * array each time, even when nothing had changed. Every tick re-rendered the
 * whole Hermes surface with the long Home chat -- also with another HODL tab
 * open and with the app in the background. This module keeps the read, but:
 *
 * - an answer with the same values keeps the previous array, so React skips
 *   the render;
 * - nothing is read while the surface is out of view or the app is not in
 *   front, and coming back reads at once;
 * - the 2.5 s cadence holds only while a task runs or something urgent is on
 *   screen (a chat run that may delegate, the ranked Tasks list); otherwise
 *   one read per 30 s.
 */
export const DELEGATED_TASK_POLL_ACTIVE_MS = 2_500;
export const DELEGATED_TASK_POLL_IDLE_MS = 30_000;

function sameDelegatedTask(left: HermesDelegatedTask, right: HermesDelegatedTask) {
  if (left === right) return true;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export function sameDelegatedTasks(
  previous: readonly HermesDelegatedTask[],
  next: readonly HermesDelegatedTask[],
) {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  return previous.every((task, index) => {
    const other = next[index];
    return other !== undefined && sameDelegatedTask(task, other);
  });
}

/** For `setDelegatedTasks(previous => ...)`: the previous array when nothing changed. */
export function nextDelegatedTasks(
  previous: HermesDelegatedTask[],
  next: HermesDelegatedTask[],
): HermesDelegatedTask[] {
  return sameDelegatedTasks(previous, next) ? previous : next;
}

export type DelegatedTaskPollConditions = {
  /** The surface is visible in its host and the app is in front. */
  inView: boolean;
  /** Something on screen needs the fast cadence even without a running task. */
  urgent: boolean;
};

type PollTimers = {
  setTimeout: (run: () => void, ms: number) => unknown;
  clearTimeout: (timer: unknown) => void;
};

const defaultTimers: PollTimers = {
  setTimeout: (run, ms) => setTimeout(run, ms),
  clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export function createDelegatedTaskPollLoop(input: {
  /** One read. Resolves with the tasks it read; a failure only skips this round. */
  poll: () => Promise<readonly HermesDelegatedTask[] | null | undefined> | void;
  timers?: PollTimers;
}) {
  const timers = input.timers ?? defaultTimers;
  let conditions: DelegatedTaskPollConditions = { inView: false, urgent: false };
  let lastTasks: readonly HermesDelegatedTask[] = [];
  let timer: unknown = null;
  let stopped = false;

  const fast = () => conditions.urgent || lastTasks.some((task) => !mobileDelegatedTaskIsTerminal(task.state));
  const clear = () => {
    if (timer !== null) timers.clearTimeout(timer);
    timer = null;
  };
  const schedule = () => {
    clear();
    if (stopped || !conditions.inView) return;
    timer = timers.setTimeout(run, fast() ? DELEGATED_TASK_POLL_ACTIVE_MS : DELEGATED_TASK_POLL_IDLE_MS);
  };
  function run() {
    timer = null;
    if (stopped || !conditions.inView) return;
    // The next read is armed now, so a hanging request never stops the loop.
    schedule();
    let pending: ReturnType<typeof input.poll>;
    try {
      pending = input.poll();
    } catch {
      return;
    }
    Promise.resolve(pending).then((tasks) => {
      if (stopped || !tasks) return;
      const wasFast = fast();
      lastTasks = tasks;
      // A task that just started shortens the wait; a finished one lengthens
      // it only after the read already armed.
      if (!wasFast && fast()) schedule();
    }).catch(() => undefined);
  }

  return {
    setConditions(next: DelegatedTaskPollConditions) {
      if (stopped) return;
      const wasInView = conditions.inView;
      const wasFast = fast();
      conditions = { inView: next.inView, urgent: next.urgent };
      if (!conditions.inView) {
        clear();
        return;
      }
      if (!wasInView) {
        run();
        return;
      }
      if (!wasFast && fast()) schedule();
    },
    stop() {
      stopped = true;
      clear();
    },
  };
}
