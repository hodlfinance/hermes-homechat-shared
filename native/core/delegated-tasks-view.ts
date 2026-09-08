import type { HermesDelegatedTask, HermesDelegatedTaskState } from "./index";

const activeStates = new Set<HermesDelegatedTaskState>([
  "running",
  "human_gate",
]);

export type DelegatedTaskRow = HermesDelegatedTask & {
  elapsed: string;
  statusLabel: string;
  terminal: boolean;
};

export type DelegatedTasksView = {
  animated: boolean;
  rows: DelegatedTaskRow[];
};

export function mobileDelegatedTaskElapsed(startedAt: string, nowMs: number) {
  const seconds = Math.max(0, Math.floor((nowMs - Date.parse(startedAt)) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function mobileDelegatedTaskIsTerminal(state: HermesDelegatedTaskState) {
  return !activeStates.has(state);
}

export function mobileDelegatedTaskStatusLabel(state: HermesDelegatedTaskState) {
  if (state === "running") return "Working";
  if (state === "human_gate") return "Waiting for you";
  if (state === "failed") return "Failed";
  if (state === "cancelled") return "Cancelled";
  return "Completed";
}

export function delegatedTasksView(
  tasks: HermesDelegatedTask[],
  nowMs: number,
): DelegatedTasksView | null {
  const rows = tasks
    // The compact indicator describes work that is still running. Terminal
    // results remain in the task's persistent conversation, but never keep the
    // composer or the running-work affordance alive.
    .filter((task) => activeStates.has(task.state))
    .map((task) => {
      const terminal = mobileDelegatedTaskIsTerminal(task.state);
      return {
        ...task,
        elapsed: mobileDelegatedTaskElapsed(
          task.startedAt,
          nowMs,
        ),
        statusLabel: mobileDelegatedTaskStatusLabel(task.state),
        terminal,
      };
    });
  if (!rows.length) return null;
  return {
    animated: rows.some((task) => task.state === "running"),
    rows,
  };
}
