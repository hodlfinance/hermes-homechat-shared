import {
  mapNativeTaskStatus,
  type RankedCandidateState,
  type NativeRankedTask,
  RankedTaskCollection,
  RankedTaskRating,
  RankedTaskSource,
  RankedTaskSourceFreshness,
  rankedTaskSources,
  RankedTaskStatus,
  RankedTaskTime,
  RankedTaskView,
} from "./ranked-tasks";

const supportedSources = new Set<RankedTaskSource>(rankedTaskSources);

/**
 * The three buttons every row carries, in this order, in both surfaces:
 * Erledigt, Löschen, Chat. They do not depend on the row's state, on its
 * reminder, or on whether it is a Kanban card or a finding without one - a
 * customer who has learnt one row has learnt them all.
 *
 * Until HPD-410 the set came from the reminder decision and could be
 * `["dismiss", "review_later"]`, `["complete", "dismiss", "review_later"]`,
 * `["complete", "reschedule"]`, or - on a task with no reminder due - nothing.
 * `review_later` and `reschedule` are still in the model, where the cadence and
 * the review state decide when a task comes back; they are simply not something
 * the customer presses.
 */
export const rankedTaskRowActionIds = ["complete", "dismiss", "chat"] as const;
export type RankedTaskRowActionId = (typeof rankedTaskRowActionIds)[number];

const rankedTaskStatuses = new Set<RankedTaskStatus>(["open", "blocked", "running", "done", "dismissed"]);
const candidateStates = new Set<RankedCandidateState>(["suggested", "completed", "dismissed"]);

/**
 * One row type for both kinds of row. A Kanban card carries a native identity
 * and a native status; a finding from mail, the Vault, or a memory system
 * carries neither and instead says whether it is still suggested, done, or
 * dismissed.
 * They share one rank sequence, because a customer reads one list.
 */
export type RankedTaskListRow = Readonly<{
  id: string;
  rank: number | null;
  title: string;
  source: RankedTaskSource;
  sourceLabel: string;
  score: number;
  urgency: RankedTaskRating;
  importance: RankedTaskRating;
  time: RankedTaskTime;
  presentation: "native" | "candidate";
  nativeTaskId: string | null;
  nativeStatus: RankedTaskStatus | null;
  candidateState: RankedCandidateState | null;
  dispatchable: false;
}>;

export type RankedTaskListView = Readonly<{
  rows: readonly RankedTaskListRow[];
  pendingRows: readonly PendingRankedTaskListRow[];
  sources: readonly RankedTaskSourceFreshness[];
  collectedAt: string | null;
  dispatchable: false;
}>;

export type PendingRankedTaskListRow = Readonly<{
  id: string;
  title: string;
  nativeStatus: RankedTaskStatus;
}>;

/** Presentation only: preserve ranking and dismissed semantics while folding Done. */
export function rankedTaskCompletionSections(view: RankedTaskListView) {
  const isDone = (row: RankedTaskListRow) => row.nativeStatus === "done"
    || (row.nativeStatus === null && row.candidateState === "completed");
  return {
    rows: view.rows.filter((row) => !isDone(row)),
    completedRows: view.rows.filter(isDone),
    pendingRows: view.pendingRows.filter((row) => row.nativeStatus !== "done"),
    completedPendingRows: view.pendingRows.filter((row) => row.nativeStatus === "done"),
  };
}

function canonicalInstant(value: string, field: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC timestamp.`);
  }
  return value;
}

function nonEmpty(value: string, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must not be empty.`);
  return value;
}

function rating(value: RankedTaskRating, field: string): RankedTaskRating {
  if (
    !value
    || !Number.isSafeInteger(value.value)
    || value.value < 0
    || value.value > 5
    || (value.origin !== "manual" && value.origin !== "inferred")
  ) {
    throw new Error(`${field} must be an integer from zero through five with an honest origin.`);
  }
  return Object.freeze({ ...value });
}

function taskTime(value: RankedTaskTime): RankedTaskTime {
  if (!value || typeof value !== "object") throw new Error("Ranked-task time is invalid.");
  if (value.kind === "evidenced") {
    canonicalInstant(value.deadlineAt, "Evidenced deadline");
    nonEmpty(value.evidenceLabel, "Evidenced deadline label");
    return Object.freeze({ ...value });
  }
  if (value.kind === "implied") {
    canonicalInstant(value.targetAt, "Implied target");
    canonicalInstant(value.nextReviewAt, "Next review");
    return Object.freeze({ ...value });
  }
  if (value.kind === "none") {
    canonicalInstant(value.nextReviewAt, "Next review");
    if (value.suggestion !== undefined && value.suggestion !== "complete_or_dismiss") {
      throw new Error("Ranked-task review suggestion is invalid.");
    }
    return Object.freeze({ ...value });
  }
  throw new Error("Ranked-task time kind is invalid.");
}

function sourceFreshnessView(sources: readonly RankedTaskSourceFreshness[]) {
  if (!Array.isArray(sources) || sources.length !== supportedSources.size) {
    throw new Error("The ranked list requires exactly four source freshness entries.");
  }

  const seen = new Set<RankedTaskSource>();
  return Object.freeze(sources.map((entry) => {
    if (!entry || !supportedSources.has(entry.source) || seen.has(entry.source)) {
      throw new Error("Ranked-task source freshness must contain each supported source exactly once.");
    }
    seen.add(entry.source);
    if (entry.state !== "complete" && entry.state !== "incomplete" && entry.state !== "unavailable") {
      throw new Error("Ranked-task source freshness state is invalid.");
    }
    if (entry.state === "complete" && entry.observedAt === null) {
      throw new Error("A complete ranked-task source requires an observation time.");
    }
    if (entry.state === "unavailable" && entry.observedAt !== null) {
      throw new Error("An unavailable ranked-task source cannot claim an observation time.");
    }
    if (entry.observedAt !== null) canonicalInstant(entry.observedAt, "Source observation");
    return Object.freeze({ ...entry });
  }));
}

function validatedRowBase(item: RankedTaskView) {
  nonEmpty(item.id, "Ranked item ID");
  nonEmpty(item.title, "Ranked-task title");
  nonEmpty(item.sourceLabel, "Ranked-task source label");
  if (!supportedSources.has(item.source)) throw new Error("Ranked-task source is invalid.");
  if (item.rank !== null && (!Number.isSafeInteger(item.rank) || item.rank < 1)) {
    throw new Error("Ranked-task rank must be a positive integer or null.");
  }
  if (!Number.isSafeInteger(item.scoreTenths) || !Number.isFinite(item.score) || item.score !== item.scoreTenths / 10) {
    throw new Error("Ranked-task score must match its deterministic integer score.");
  }
  return {
    id: item.id,
    rank: item.rank,
    title: item.title,
    source: item.source,
    sourceLabel: item.sourceLabel,
    score: item.score,
    urgency: rating(item.urgency, "Urgency"),
    importance: rating(item.importance, "Importance"),
    time: taskTime(item.time),
  };
}

function nativeRow(item: RankedTaskView): RankedTaskListRow {
  if (item.kind !== "kanban") throw new Error("Expected a native ranked task.");
  if (
    !item.nativeTaskId
    || !rankedTaskStatuses.has(item.status)
    || item.candidateState !== null
    || item.source !== "kanban"
  ) {
    throw new Error("A native ranked task requires its exact native ID and mapped native status.");
  }
  return Object.freeze({
    ...validatedRowBase(item),
    presentation: "native" as const,
    nativeTaskId: nonEmpty(item.nativeTaskId, "Native task ID"),
    nativeStatus: item.status,
    candidateState: null,
    dispatchable: false as const,
  });
}

function candidateRow(item: RankedTaskView): RankedTaskListRow {
  if (item.kind !== "candidate") throw new Error("Expected a discovered ranked candidate.");
  if (
    item.nativeTaskId !== null
    || item.status !== null
    || !candidateStates.has(item.candidateState)
    || item.source === "kanban"
  ) {
    throw new Error("A discovered ranked candidate has no native identity and must say whether it is done or dismissed.");
  }
  return Object.freeze({
    ...validatedRowBase(item),
    presentation: "candidate" as const,
    nativeTaskId: null,
    nativeStatus: null,
    candidateState: item.candidateState,
    dispatchable: false as const,
  });
}

function taskRows(tasks: readonly RankedTaskView[]) {
  const rankedIds = new Set<string>();
  const nativeIds = new Set<string>();

  /**
   * A finding the customer put away is gone from the list.
   *
   * It used to stay, marked "Dismissed", so that nothing disappeared without a
   * trace. Measured on ws_NR_n6sWuGl8V on 2026-08-24, that is not what it looks
   * like from the outside: the same finding stood three times on Justus's
   * screen — once as a suggestion and twice as "Ausgeblendet" — and pressing
   * Löschen on any of them changed nothing he could see. His words: "Duplikate
   * und Click auf löschen tut nichts."
   *
   * The row keeps its record on the plane. It just stops being an item on a
   * list of things to do.
   */
  const visible = tasks.filter((item) => !(
    item
    && typeof item === "object"
    && item.kind === "candidate"
    && item.candidateState === "dismissed"
  ));

  return Object.freeze(visible.map((item) => {
    if (!item || typeof item !== "object" || item.dispatchable !== false) {
      throw new Error("Every ranked-list row must be explicitly non-dispatchable.");
    }
    if (rankedIds.has(item.id)) throw new Error("Duplicate ranked item ID in the inventory.");
    rankedIds.add(item.id);

    // Until HPD-405 this threw: "Ranked List accepts native Kanban tasks only".
    // The customer asked for mail, Vault, and memory findings in the same list,
    // and a rule that rejected them meant nothing ever wrote one.
    const row = item.kind === "kanban" ? nativeRow(item) : candidateRow(item);

    if (row.nativeTaskId !== null) {
      if (nativeIds.has(row.nativeTaskId)) throw new Error("Duplicate native task ID in the inventory.");
      nativeIds.add(row.nativeTaskId);
    }
    return row;
  }));
}

function pendingTaskRows(
  tasks: readonly NativeRankedTask[],
  rankedNativeIds: ReadonlySet<string>,
) {
  if (!Array.isArray(tasks)) throw new Error("Pending native tasks must be an array.");
  const pendingIds = new Set<string>();
  return Object.freeze(tasks.map((task) => {
    const id = nonEmpty(task.id, "Pending native task ID");
    if (pendingIds.has(id) || rankedNativeIds.has(id)) {
      throw new Error("Pending native tasks must not duplicate another native task ID.");
    }
    pendingIds.add(id);
    canonicalInstant(task.createdAt, "Pending native task createdAt");
    canonicalInstant(task.updatedAt, "Pending native task updatedAt");
    return Object.freeze({
      id,
      title: nonEmpty(task.title, "Pending native task title"),
      nativeStatus: mapNativeTaskStatus(task.status),
    });
  }));
}

export function rankedTaskListView(collection: RankedTaskCollection): RankedTaskListView {
  if (!collection || typeof collection !== "object" || collection.dispatchable !== false) {
    throw new Error("The ranked-task collection must be explicitly non-dispatchable.");
  }
  if (!Array.isArray(collection.tasks)) throw new Error("The ranked-task inventory must be an array.");
  if (collection.collectedAt !== null) canonicalInstant(collection.collectedAt, "Collection time");

  const rows = taskRows(collection.tasks);
  return Object.freeze({
    rows,
    pendingRows: pendingTaskRows(
      collection.pendingTasks ?? [],
      new Set(rows.flatMap((row) => (row.nativeTaskId === null ? [] : [row.nativeTaskId]))),
    ),
    sources: sourceFreshnessView(collection.sources),
    collectedAt: collection.collectedAt,
    dispatchable: false as const,
  });
}
