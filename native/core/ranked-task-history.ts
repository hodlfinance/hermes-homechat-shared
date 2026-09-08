import type { NativeRankedTaskProjection } from "./ranked-task-projection";

/**
 * One stored ranking, and the way back to it.
 *
 * HPD-405, Justus' first concern about the pilot flow: „ich hab Angst, dass in
 * einem LLM-Turn praktisch aus Versehen die gesamte To-do-Liste geloescht wird".
 * Half of that was already answered on the storage side — every run writes per
 * task, nothing in the projection write path deletes, and a task a run does not
 * name keeps its stored value. The other half is this: a customer who looks at a
 * bad ranking can name an earlier one and get it back.
 *
 * A stand is exactly one completed ranker run. They were already stored, one row
 * per run in `ranked_task_projection_runs`; until now nothing could list them and
 * nothing could make an earlier one current again.
 */
export interface RankedTaskRankingSnapshot {
  /** The ranker execution that produced this stand. */
  readonly runId: string;
  /** When the run finished, as the run itself reported it. */
  readonly completedAt: string;
  /** When this plane stored it. */
  readonly storedAt: string;
  readonly cardCount: number;
  readonly findingCount: number;
  /** The first few titles, in the stand's own order, so two stands can be told apart. */
  readonly leadingTitles: readonly string[];
  readonly current: boolean;
  /** Every stand but the current one can be made current again. */
  readonly restorable: boolean;
}

/**
 * One restore that happened. It is kept so a restore is visible rather than
 * silent, and so the stand it replaced can be named and picked again: HPD-409
 * was a one-way door, and this must not be a second one.
 */
export interface RankedTaskRankingRestoreRecord {
  readonly restoredRunId: string;
  readonly replacedRunId: string | null;
  readonly createdAt: string;
}

export interface RankedTaskRankingHistory {
  readonly currentRunId: string | null;
  /** Newest stand first. */
  readonly snapshots: readonly RankedTaskRankingSnapshot[];
  /** Newest restore first. */
  readonly restores: readonly RankedTaskRankingRestoreRecord[];
}

export interface RankedTaskStoredRanking {
  readonly runId: string;
  readonly storedAt: string;
  readonly projection: NativeRankedTaskProjection;
}

/** How many titles a stand shows. Enough to recognise it, short enough to read. */
export const rankedTaskSnapshotTitleCount = 3;

function leadingTitles(projection: NativeRankedTaskProjection): readonly string[] {
  const rows = [...projection.tasks, ...(projection.candidates ?? [])]
    .slice()
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
  return Object.freeze(rows
    .slice(0, rankedTaskSnapshotTitleCount)
    .map((row) => row.title));
}

/**
 * Build the history a customer reads, from what the plane stores.
 *
 * The order is by the run's own completion time and then by the identity, so two
 * runs that report the same instant still have one stable order rather than
 * whatever the database happened to return.
 */
export function rankedTaskRankingHistory(input: {
  readonly rankings: readonly RankedTaskStoredRanking[];
  readonly currentRunId: string | null;
  readonly restores: readonly RankedTaskRankingRestoreRecord[];
}): RankedTaskRankingHistory {
  const seen = new Set<string>();
  const snapshots = input.rankings
    .filter((ranking) => {
      if (seen.has(ranking.runId)) return false;
      seen.add(ranking.runId);
      return true;
    })
    .slice()
    .sort((left, right) => (
      right.projection.completedAt.localeCompare(left.projection.completedAt)
      || right.runId.localeCompare(left.runId)
    ))
    .map((ranking) => {
      const current = ranking.runId === input.currentRunId;
      return Object.freeze({
        runId: ranking.runId,
        completedAt: ranking.projection.completedAt,
        storedAt: ranking.storedAt,
        cardCount: ranking.projection.tasks.length,
        findingCount: (ranking.projection.candidates ?? []).length,
        leadingTitles: leadingTitles(ranking.projection),
        current,
        restorable: !current,
      });
    });
  const restores = input.restores
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((restore) => Object.freeze({ ...restore }));
  return Object.freeze({
    currentRunId: input.currentRunId,
    snapshots: Object.freeze(snapshots),
    restores: Object.freeze(restores),
  });
}

export const rankedTaskRankingHistoryLabels = Object.freeze({
  title: "Ranking history",
  description: "Every ranking run leaves a stored ranking. An earlier one can be brought back.",
  current: "Current",
  restore: "Bring this one back",
  confirmRestore: "Confirm",
  cards: "Cards",
  findings: "Findings",
  restoredAt: "Brought back",
  empty: "No ranking run has been stored yet.",
  keepsManual: "Your own ratings and everything you marked done or deleted stay as you set them.",
} as const);
