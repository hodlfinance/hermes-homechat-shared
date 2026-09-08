import {
  buildRankedTaskList,
  rankedTaskSources,
  type NativeRankedTask,
  type RankedCandidateTaskView,
  type RankedNativeTaskView,
  type RankedTaskCandidate,
  type RankedTaskMetadata,
  type RankedTaskSource,
  type RankedTaskSourceFreshness,
} from "./ranked-tasks";
import {
  resolveRankedTaskReminder,
  rankedTaskReminderStates,
  type RankedTaskReminderDecision,
  type RankedTaskReminderState,
} from "./ranked-task-reminders";

export interface RankedTaskScannerProvenance {
  readonly resultId: string;
  readonly completedAt: string;
}

export type NativeRankedTaskProjectionRow = RankedNativeTaskView & Readonly<{
  reminder: RankedTaskReminderDecision;
}>;

/**
 * A finding from mail, the Vault, or a memory system that has no Kanban card.
 * It is ranked in the same order as the cards and carries the same score, and
 * it is the only kind of row a customer can dismiss outright.
 */
export type RankedTaskCandidateProjectionRow = RankedCandidateTaskView & Readonly<{
  reminder: RankedTaskReminderDecision;
}>;

/**
 * What the ranker says about one card, and when that card comes back. It no
 * longer names buttons: since HPD-410 every row carries the same three, so a
 * per-reminder action list could only contradict them.
 */
export interface RankedTaskGeneratedReminder {
  readonly nativeTaskId: string;
  readonly state: RankedTaskReminderState;
  readonly prose: string;
}

export interface RankedTaskGeneratedReport {
  readonly body: string;
  readonly reminders: readonly RankedTaskGeneratedReminder[];
  /**
   * How many open entries the run believes the list now holds - its own first-line
   * self-check, as a number rather than buried in prose.
   *
   * Optional, and never trusted: `listedCount` on the projection is what the
   * customer is shown, and it is counted here from the rows that were actually
   * stored. This is kept only so the two can be compared, because a run whose
   * own count disagrees with the list is the symptom HPD-421 was reported for -
   * "4 eigenständige Matters" over a list of six.
   */
  readonly claimedOpen?: number;
}

export interface NativeRankedTaskProjection {
  readonly runId: string;
  readonly completedAt: string;
  /**
   * How many entries this run actually put on the list, counted from the rows
   * stored rather than from anything the ranker said about itself. Optional
   * because projections stored before HPD-421 were written without it.
   */
  readonly listedCount?: number;
  readonly scannerResult: RankedTaskScannerProvenance | null;
  readonly sources: readonly RankedTaskSourceFreshness[];
  readonly tasks: readonly NativeRankedTaskProjectionRow[];
  /**
   * Optional because every projection stored before source-only findings existed
   * was written without this field and is still read back as it was.
   */
  readonly candidates?: readonly RankedTaskCandidateProjectionRow[];
  readonly report: RankedTaskGeneratedReport;
  readonly reconstructible: true;
  readonly dispatchable: false;
}

function canonicalInstant(value: string, field: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp.`);
  }
  return value;
}

function boundedIdentity(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 180) throw new Error(`${field} must be a bounded non-empty identity.`);
  return trimmed;
}

function boundedProse(value: string, field: string, maximum: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum || /[\u0000\u007f]/u.test(trimmed)) {
    throw new Error(`${field} must be bounded ranker-generated prose.`);
  }
  return trimmed;
}

export function buildNativeRankedTaskProjection(input: {
  readonly runId: string;
  readonly completedAt: string;
  readonly scannerResult: RankedTaskScannerProvenance | null;
  readonly sources: readonly RankedTaskSourceFreshness[];
  readonly nativeTasks: readonly NativeRankedTask[];
  readonly metadata: readonly RankedTaskMetadata[];
  readonly candidates?: readonly RankedTaskCandidate[];
  readonly report: RankedTaskGeneratedReport;
}): NativeRankedTaskProjection {
  const allowedFields = new Set([
    "runId", "completedAt", "scannerResult", "sources", "nativeTasks", "metadata", "candidates", "report",
  ]);
  const unknownField = Object.keys(input).find((field) => !allowedFields.has(field));
  if (unknownField) throw new Error(`Native Ranked projection does not accept ${unknownField}.`);
  const runId = boundedIdentity(input.runId, "runId");
  const completedAt = canonicalInstant(input.completedAt, "completedAt");
  const scannerResult = input.scannerResult
    ? Object.freeze({
        resultId: boundedIdentity(input.scannerResult.resultId, "scannerResult.resultId"),
        completedAt: canonicalInstant(input.scannerResult.completedAt, "scannerResult.completedAt"),
      })
    : null;
  const supportedSources: readonly RankedTaskSource[] = rankedTaskSources;
  if (!Array.isArray(input.sources) || input.sources.length !== supportedSources.length) {
    throw new Error("Native Ranked projection requires exactly four source freshness entries.");
  }
  const seenSources = new Set<RankedTaskSource>();
  const sources = input.sources.map((source) => {
    if (!supportedSources.includes(source.source) || seenSources.has(source.source)) {
      throw new Error("Native Ranked projection source freshness must contain each supported source exactly once.");
    }
    seenSources.add(source.source);
    if (!(["complete", "incomplete", "unavailable"] as const).includes(source.state)) {
      throw new Error("Native Ranked projection source freshness state is invalid.");
    }
    if (source.state === "complete" && source.observedAt === null) {
      throw new Error("A complete Ranked source requires an observation time.");
    }
    if (source.state === "unavailable" && source.observedAt !== null) {
      throw new Error("An unavailable Ranked source cannot claim an observation time.");
    }
    if (source.observedAt !== null) canonicalInstant(source.observedAt, "source.observedAt");
    return Object.freeze({ ...source });
  });
  const emailSource = sources.find((source) => source.source === "email_triage")!;
  if (scannerResult) {
    if (emailSource.state !== "complete" || emailSource.observedAt !== scannerResult.completedAt) {
      throw new Error("Email freshness must reference the exact completed scanner result.");
    }
  } else if (emailSource.state !== "unavailable") {
    throw new Error("Email freshness cannot be available without a completed scanner result.");
  }
  // Cards and findings are ranked in one list, so that a mail that matters more
  // than every open card can say so. They are stored apart because only one of
  // them has a native identity to reconcile against.
  const ranked = buildRankedTaskList({
    nativeTasks: input.nativeTasks,
    metadata: input.metadata,
    candidates: input.candidates ?? [],
  }).map((row) => Object.freeze({
    ...row,
    reminder: resolveRankedTaskReminder({ now: completedAt, time: row.time }),
  }));
  const tasks = ranked.filter((row): row is NativeRankedTaskProjectionRow => {
    if (row.kind !== "kanban") return false;
    if (!row.nativeTaskId) throw new Error("Native Ranked projection encountered a card without a native identity.");
    return true;
  });
  const candidates = ranked.filter((row): row is RankedTaskCandidateProjectionRow => row.kind === "candidate");
  const taskById = new Map(tasks.map((task) => [task.nativeTaskId, task]));
  const reminderIds = new Set<string>();
  // HPD-464: a run that is due no reminder sends no reminders. The tool asks for
  // reminder prose "only where a reminder is actually due now", so an absent
  // list means none this run - exactly what an absent `candidates` already means
  // one layer up. Reading it as a list that is not there threw the raw
  // `Cannot read properties of undefined (reading 'map')` at the customer path
  // and refused an otherwise complete ranking; measured once on ws_NR_n6sWuGl8V
  // at 2026-08-25 01:48:39. A reminder that is present is validated exactly as
  // before.
  const submittedReminders = Array.isArray(input.report?.reminders) ? input.report.reminders : [];
  const reminders = submittedReminders.map((reminder) => {
    const nativeTaskId = boundedIdentity(reminder.nativeTaskId, "report.reminder.nativeTaskId");
    if (reminderIds.has(nativeTaskId)) throw new Error("Ranker report contains a duplicate reminder task.");
    reminderIds.add(nativeTaskId);
    const task = taskById.get(nativeTaskId);
    if (!task) throw new Error("Ranker report reminder must reference a projected native Kanban task.");
    if (!rankedTaskReminderStates.includes(reminder.state)) throw new Error("Ranker report reminder state is invalid.");
    // The structured state is derived here from the task's own deadline, so the
    // ranker cannot change it. Requiring it to also predict it byte for byte
    // rejected an otherwise complete ranking over a value it could not compute;
    // take the derived value and keep only its prose. An `actionIds` field from
    // a ranker installed before HPD-410 is read and dropped for the same reason:
    // the buttons are fixed and no longer come from a run.
    return Object.freeze({
      nativeTaskId,
      state: task.reminder.state,
      prose: boundedProse(reminder.prose, "report.reminder.prose", 2_000),
    });
  });
  return Object.freeze({
    runId,
    completedAt,
    scannerResult,
    sources: Object.freeze(sources),
    tasks: Object.freeze(tasks),
    candidates: Object.freeze(candidates),
    // The number the customer is shown, counted here from what this projection
    // actually holds. The ranker's own count is kept beside it and never used
    // in its place.
    //
    // HPD-490: counted from the rank, not from the row count. `tasks.length +
    // candidates.length` counted every stored row, done and dismissed ones
    // included, so it was not the number the comment above claims. Measured on
    // ws_NR_n6sWuGl8V on 2026-08-25 in run cron_152e7e48988c_20260825_153956:
    // 5 cards and 6 findings gave 11, while the customer's list held 6 ranked
    // entries - one done card and four finished or dismissed findings made up
    // the difference. `buildRankedTaskList` gives a rank to the active rows and
    // null to the rest (ranked-tasks.ts:408), so the rank is what separates a
    // row the customer sees from a row this projection merely keeps.
    //
    // It is the comparand for `report.claimedOpen`, and the run is asked "how
    // many entries the list holds now". A run that answered that truthfully was
    // compared against a larger number and flagged for being right.
    listedCount: [...tasks, ...candidates].filter((row) => row.rank !== null).length,
    report: Object.freeze({
      body: boundedProse(input.report.body, "report.body", 20_000),
      reminders: Object.freeze(reminders),
      ...(Number.isSafeInteger(input.report.claimedOpen) && (input.report.claimedOpen as number) >= 0
        ? { claimedOpen: input.report.claimedOpen as number }
        : {}),
    }),
    reconstructible: true as const,
    dispatchable: false as const,
  });
}

export function settleNativeRankedTaskProjection(input: {
  readonly previous: NativeRankedTaskProjection | null;
  readonly attempt:
    | Readonly<{ status: "completed"; projection: NativeRankedTaskProjection }>
    | Readonly<{ status: "failed" | "incomplete" }>;
}): NativeRankedTaskProjection | null {
  return input.attempt.status === "completed" ? input.attempt.projection : input.previous;
}
