export const rankedTaskStatuses = ["open", "blocked", "running", "done", "dismissed"] as const;
export const nativeRankedTaskStatuses = [
  "triage",
  "todo",
  "ready",
  "blocked",
  "scheduled",
  "running",
  "review",
  "done",
  "archived",
] as const;

export type RankedTaskStatus = (typeof rankedTaskStatuses)[number];
export type NativeRankedTaskStatus = (typeof nativeRankedTaskStatuses)[number];
// One generic memory source, not one per provider. `memory` is a single runtime
// tool with pluggable providers; `honcho` was one of those plugins and
// `native_memory` was the runtime's own store, and naming either here forced the
// ranker to decide which memory system a finding came from before it could name
// the finding at all. They are one source now, and no provider name is left in
// the product.
export const rankedTaskSources = ["kanban", "email_triage", "vault", "memory"] as const;
export type RankedTaskSource = (typeof rankedTaskSources)[number];
export type RankedTaskCandidateSource = Exclude<RankedTaskSource, "kanban">;

/**
 * Read source freshness that may have been written before the memory sources
 * became one. A projection stored under the old contract carries five entries,
 * two of which are memory, and it is still the current ranking for its
 * workspace. Rather than let those runs disappear from view, the two memory
 * entries are read as the one they always meant: read if either was read, and
 * the later of the two observation times.
 */
export function normalizeRankedTaskSourceFreshness(
  sources: readonly RankedTaskSourceFreshness[],
): readonly RankedTaskSourceFreshness[] {
  const rank: Readonly<Record<RankedTaskSourceState, number>> = { unavailable: 0, incomplete: 1, complete: 2 };
  const retiredMemoryNames: readonly string[] = ["honcho", "native_memory"];
  const merged = new Map<RankedTaskSource, RankedTaskSourceFreshness>();
  const entries: readonly RankedTaskSourceFreshness[] = Array.isArray(sources) ? sources : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const source = (retiredMemoryNames.includes(entry.source) ? "memory" : entry.source) as RankedTaskSource;
    if (!rankedTaskSources.includes(source)) continue;
    const current = merged.get(source);
    if (!current) {
      merged.set(source, { source, state: entry.state, observedAt: entry.observedAt });
      continue;
    }
    const state = rank[entry.state] > rank[current.state] ? entry.state : current.state;
    const observedAt = [current.observedAt, entry.observedAt]
      .filter((value): value is string => typeof value === "string")
      .sort()
      .at(-1) ?? null;
    merged.set(source, { source, state, observedAt: state === "unavailable" ? null : observedAt });
  }
  return Object.freeze(rankedTaskSources.map((source) => Object.freeze(
    merged.get(source) ?? { source, state: "unavailable" as const, observedAt: null },
  )));
}
export type RankedTaskSourceState = "complete" | "incomplete" | "unavailable";
export type RankedTaskRating = Readonly<{ value: number; origin: "manual" | "inferred" }>;
export type RankedTaskTime =
  | Readonly<{ kind: "evidenced"; deadlineAt: string; evidenceLabel: string }>
  | Readonly<{ kind: "implied"; targetAt: string; nextReviewAt: string }>
  | Readonly<{ kind: "none"; nextReviewAt: string; suggestion?: "complete_or_dismiss" }>;

export interface NativeRankedTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly assignee: string | null;
  readonly status: NativeRankedTaskStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RankedTaskMetadata {
  readonly rankedItemId: string;
  readonly nativeTaskId: string;
  readonly source: RankedTaskSource;
  readonly sourceLabel: string;
  readonly urgency: RankedTaskRating;
  readonly importance: RankedTaskRating;
  readonly time: RankedTaskTime;
  /**
   * The customer took this card off his list. The Kanban card itself is
   * untouched - it keeps its own status, and the workspace can still see it -
   * so nothing here destroys work the way HPD-409 describes. Absent means he
   * never pressed it; stored metadata written before HPD-410 has no such field.
   */
  readonly dismissed?: boolean;
}

export interface RankedTaskCandidate {
  readonly id: string;
  readonly title: string;
  readonly source: RankedTaskCandidateSource;
  readonly sourceLabel: string;
  readonly urgency: RankedTaskRating;
  readonly importance: RankedTaskRating;
  readonly time: RankedTaskTime;
  /** The customer finished this finding. There is no card to close, so the row carries it. */
  readonly completed?: boolean;
  readonly dismissed: boolean;
  readonly observedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type RankedTaskViewBase = Readonly<{
  id: string;
  title: string;
  description: string;
  source: RankedTaskSource;
  sourceLabel: string;
  urgency: RankedTaskRating;
  importance: RankedTaskRating;
  scoreTenths: number;
  score: number;
  rank: number | null;
  rankExplanation: string;
  dispatchable: false;
  time: RankedTaskTime;
  createdAt: string;
  updatedAt: string;
}>;

export type RankedNativeTaskView = RankedTaskViewBase & Readonly<{
  kind: "kanban";
  nativeTaskId: string;
  status: RankedTaskStatus;
  candidateState: null;
  assignee: string | null;
}>;

export type RankedCandidateState = "suggested" | "completed" | "dismissed";

export type RankedCandidateTaskView = RankedTaskViewBase & Readonly<{
  kind: "candidate";
  nativeTaskId: null;
  status: null;
  candidateState: RankedCandidateState;
  assignee: null;
}>;

export type RankedTaskView = RankedNativeTaskView | RankedCandidateTaskView;

export interface RankedTaskSourceFreshness {
  readonly source: RankedTaskSource;
  readonly state: RankedTaskSourceState;
  readonly observedAt: string | null;
}

/**
 * One finding a run folded into another, HPD-421.
 *
 * The folded row is not deleted; it is set inactive and kept, so this is a
 * record of a decision the customer can see and reverse rather than a receipt
 * for something that is gone.
 */
export interface RankedTaskCandidateMergeView {
  readonly supersededId: string;
  readonly supersededTitle: string | null;
  readonly mergedIntoId: string;
  readonly mergedIntoTitle: string | null;
  readonly at: string;
}

export interface RankedTaskCollection {
  readonly tasks: readonly RankedTaskView[];
  /** What this run folded together. Absent when nothing was ever folded. */
  readonly merges?: readonly RankedTaskCandidateMergeView[];
  /**
   * Live native Kanban tasks that are absent from the current projection.
   * They are read-only source rows, not scored Ranked records.
   */
  readonly pendingTasks?: readonly NativeRankedTask[];
  readonly sources: readonly RankedTaskSourceFreshness[];
  readonly collectedAt: string | null;
  readonly dispatchable: false;
  readonly projection?: NativeRankedTaskProjection | null;
}

export type RankedTaskMetadataMutation =
  | Readonly<{ urgency: number }>
  | Readonly<{ importance: number }>
  | Readonly<{ completed: boolean }>
  | Readonly<{ dismissed: boolean }>;

export class RankedTaskContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RankedTaskContractError";
  }
}

const supportedIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const activeStatuses = new Set<RankedTaskStatus>(["open", "blocked", "running"]);

export function isActiveRankedTaskStatus(status: RankedTaskStatus): boolean {
  return activeStatuses.has(status);
}

export function isActiveRankedTask(item: RankedTaskView): boolean {
  return item.kind === "candidate"
    ? item.candidateState === "suggested"
    : activeStatuses.has(item.status);
}

// An instant has to name its zone, because a bare date and time means one thing
// in Zurich and another in UTC and nothing at all in a contract. Everything past
// that is formatting: seconds, fractions and an offset are all unambiguous, so
// they are accepted and written back in one form rather than refused.
const instantWithZonePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizedInstant(value: string, field: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!instantWithZonePattern.test(raw)) {
    throw new RankedTaskContractError(
      `${field} must be a UTC ISO timestamp naming its zone, for example 2026-08-28T05:13:06Z.`,
    );
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    throw new RankedTaskContractError(`${field} must be a UTC ISO timestamp naming its zone.`);
  }
  return new Date(parsed).toISOString();
}

function canonicalInstant(value: string, field: string): number {
  return Date.parse(normalizedInstant(value, field));
}

function validId(id: string, field: string): string {
  if (!supportedIdPattern.test(id)) {
    throw new RankedTaskContractError(`${field} must be non-empty and use the supported ID alphabet.`);
  }
  return id;
}

function rating(value: RankedTaskRating, field: string): RankedTaskRating {
  if (!Number.isSafeInteger(value.value) || value.value < 0 || value.value > 5) {
    throw new RankedTaskContractError(`${field} must be an integer from 0 through 5.`);
  }
  if (value.origin !== "manual" && value.origin !== "inferred") {
    throw new RankedTaskContractError(`${field} origin must be manual or inferred.`);
  }
  return Object.freeze({ ...value });
}

function freezeTime(value: RankedTaskTime): RankedTaskTime {
  // The stored value is the normalized one, so what is read back is canonical
  // even when what came in only had to be unambiguous. The ranker writes these,
  // and a model that says 05:13:06Z rather than 05:13:06.000Z is not wrong.
  if (value.kind === "evidenced") {
    const deadlineAt = normalizedInstant(value.deadlineAt, "Evidenced deadline");
    if (!value.evidenceLabel.trim()) throw new RankedTaskContractError("Evidenced deadline label must not be empty.");
    return Object.freeze({ ...value, deadlineAt });
  }
  const nextReviewAt = normalizedInstant(value.nextReviewAt, "Next review");
  if (value.kind === "implied") {
    return Object.freeze({ ...value, nextReviewAt, targetAt: normalizedInstant(value.targetAt, "Implied target") });
  }
  return Object.freeze({ ...value, nextReviewAt });
}

export function mapNativeTaskStatus(status: string): RankedTaskStatus {
  switch (status) {
    case "triage":
    case "todo":
    case "ready":
      return "open";
    case "blocked":
    case "scheduled":
      return "blocked";
    case "running":
    case "review":
      return "running";
    case "done":
      return "done";
    case "archived":
      return "dismissed";
    default:
      throw new RankedTaskContractError(`Encountered unknown native task status: ${status}.`);
  }
}

export function resolveTaskTime(input: {
  readonly now: string;
  readonly workspaceTimeZone?: string;
  readonly evidencedDeadline?: Readonly<{ at: string; label: string }>;
  readonly impliedTargetAt?: string;
}): RankedTaskTime {
  const now = canonicalInstant(input.now, "now");
  if (input.evidencedDeadline) {
    canonicalInstant(input.evidencedDeadline.at, "Evidenced deadline");
    if (!input.evidencedDeadline.label.trim()) {
      throw new RankedTaskContractError("Evidenced deadline label must not be empty.");
    }
    return Object.freeze({
      kind: "evidenced" as const,
      deadlineAt: input.evidencedDeadline.at,
      evidenceLabel: input.evidencedDeadline.label.trim(),
    });
  }

  if (input.impliedTargetAt) {
    const targetInstant = canonicalInstant(input.impliedTargetAt, "Implied target");
    if (targetInstant > now) {
      return Object.freeze({
        kind: "implied" as const,
        targetAt: input.impliedTargetAt,
        nextReviewAt: input.impliedTargetAt,
      });
    }
  }

  return Object.freeze({
    kind: "none" as const,
    nextReviewAt: addWorkspaceLocalDays(now, 6, input.workspaceTimeZone ?? "UTC"),
    ...(input.impliedTargetAt ? { suggestion: "complete_or_dismiss" as const } : {}),
  });
}

function addWorkspaceLocalDays(instant: number, days: number, timeZone: string): string {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new RankedTaskContractError("workspaceTimeZone must be a supported IANA time zone.");
  }

  const localParts = Object.fromEntries(
    formatter
      .formatToParts(new Date(instant))
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
  const desiredWallClock = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day + days,
    localParts.hour,
    localParts.minute,
    localParts.second,
    instant % 1_000,
  );

  let candidate = desiredWallClock;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter(({ type }) => type !== "literal")
        .map(({ type, value }) => [type, Number(value)]),
    ) as typeof localParts;
    const observedWallClock = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
      instant % 1_000,
    );
    const correction = desiredWallClock - observedWallClock;
    candidate += correction;
    if (correction === 0) return new Date(candidate).toISOString();
  }
  throw new RankedTaskContractError("Six-day review time could not be resolved in workspaceTimeZone.");
}

function explainRank(urgency: RankedTaskRating, importance: RankedTaskRating, score: number, time: RankedTaskTime): string {
  const timeReason =
    time.kind === "evidenced"
      ? `evidenced deadline ${time.deadlineAt} (${time.evidenceLabel})`
      : time.kind === "implied"
        ? `implied target ${time.targetAt}`
        : "no target";
  return `Urgency ${urgency.value}/5 ${urgency.origin} × 0.6 + importance ${importance.value}/5 ${importance.origin} × 0.4 = ${score}/5; ${timeReason}.`;
}

function rankRows(rows: readonly RankedTaskView[]): readonly RankedTaskView[] {
  const ordered = [...rows].sort((left, right) => {
    const leftActive = isActiveRankedTask(left);
    const rightActive = isActiveRankedTask(right);
    if (leftActive !== rightActive) return leftActive ? -1 : 1;
    if (leftActive && rightActive) {
      const scoreDifference = right.scoreTenths - left.scoreTenths;
      if (scoreDifference) return scoreDifference;
    }
    return Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id.localeCompare(right.id);
  });

  let rank = 0;
  return Object.freeze(ordered.map((row) => Object.freeze({
    ...row,
    rank: isActiveRankedTask(row) ? ++rank : null,
  })) as RankedTaskView[]);
}

export function buildRankedTaskList(input: {
  readonly nativeTasks: readonly NativeRankedTask[];
  readonly metadata: readonly RankedTaskMetadata[];
  readonly candidates?: readonly RankedTaskCandidate[];
}): readonly RankedTaskView[] {
  if (!Array.isArray(input.nativeTasks) || !Array.isArray(input.metadata) || !Array.isArray(input.candidates ?? [])) {
    throw new RankedTaskContractError("Native tasks, ranking metadata, and candidates must be arrays.");
  }

  const nativeIds = new Set<string>();
  for (const task of input.nativeTasks) {
    const id = validId(task.id, "Native task ID");
    if (nativeIds.has(id)) throw new RankedTaskContractError(`Encountered duplicate native task ID: ${id}.`);
    nativeIds.add(id);
    mapNativeTaskStatus(task.status);
    canonicalInstant(task.createdAt, "Native task createdAt");
    canonicalInstant(task.updatedAt, "Native task updatedAt");
    if (!task.title.trim()) throw new RankedTaskContractError(`Native task ${id} title must not be empty.`);
  }

  const rankedIds = new Set<string>();
  const metadataByTask = new Map<string, RankedTaskMetadata>();
  for (const item of input.metadata) {
    const nativeTaskId = validId(item.nativeTaskId, "Metadata native task ID");
    const rankedItemId = validId(item.rankedItemId, "Ranked item ID");
    if (!nativeIds.has(nativeTaskId)) {
      throw new RankedTaskContractError(`Ranking metadata references unknown native task ID: ${nativeTaskId}.`);
    }
    if (metadataByTask.has(nativeTaskId) || rankedIds.has(rankedItemId)) {
      throw new RankedTaskContractError("Ranking metadata contains a duplicate native or ranked item ID.");
    }
    metadataByTask.set(nativeTaskId, item);
    rankedIds.add(rankedItemId);
  }
  if (metadataByTask.size !== nativeIds.size) {
    throw new RankedTaskContractError("Every native task requires one opaque ranked-item identity.");
  }

  const nativeRows: RankedNativeTaskView[] = input.nativeTasks.map((task) => {
    const item = metadataByTask.get(task.id)!;
    const urgency = rating(item.urgency, "Urgency");
    const importance = rating(item.importance, "Importance");
    const time = freezeTime(item.time);
    const scoreTenths = 6 * urgency.value + 4 * importance.value;
    const score = scoreTenths / 10;
    return Object.freeze({
      id: item.rankedItemId,
      kind: "kanban" as const,
      nativeTaskId: task.id,
      title: task.title,
      description: task.description,
      assignee: item.source !== "kanban" && task.assignee === null ? "You" : task.assignee,
      // A card the customer removed from his list reads as dismissed even while
      // the Kanban still holds it in its own column. Nothing is deleted, and the
      // row stays visible at the bottom of the list, so it can be seen and put
      // back rather than vanishing.
      status: item.dismissed === true ? "dismissed" as const : mapNativeTaskStatus(task.status),
      candidateState: null,
      source: item.source,
      sourceLabel: item.sourceLabel.trim() || "Hermes Kanban",
      urgency,
      importance,
      scoreTenths,
      score,
      rank: null,
      rankExplanation: explainRank(urgency, importance, score, time),
      dispatchable: false as const,
      time,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  });

  const candidateRows: RankedCandidateTaskView[] = (input.candidates ?? []).map((candidate) => {
    const id = validId(candidate.id, "Candidate ranked item ID");
    if (rankedIds.has(id)) throw new RankedTaskContractError(`Duplicate ranked item ID: ${id}.`);
    rankedIds.add(id);
    if (!candidate.title.trim()) throw new RankedTaskContractError(`Candidate ${id} title must not be empty.`);
    canonicalInstant(candidate.observedAt, "Candidate observedAt");
    canonicalInstant(candidate.createdAt, "Candidate createdAt");
    canonicalInstant(candidate.updatedAt, "Candidate updatedAt");
    const urgency = rating(candidate.urgency, "Urgency");
    const importance = rating(candidate.importance, "Importance");
    const time = freezeTime(candidate.time);
    const scoreTenths = 6 * urgency.value + 4 * importance.value;
    const score = scoreTenths / 10;
    return Object.freeze({
      id,
      kind: "candidate" as const,
      nativeTaskId: null,
      title: candidate.title.trim(),
      description: "",
      assignee: null,
      status: null,
      candidateState: candidate.completed === true
        ? "completed" as const
        : candidate.dismissed
          ? "dismissed" as const
          : "suggested" as const,
      source: candidate.source,
      sourceLabel: candidate.sourceLabel.trim(),
      urgency,
      importance,
      scoreTenths,
      score,
      rank: null,
      rankExplanation: explainRank(urgency, importance, score, time),
      dispatchable: false as const,
      time,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  });

  return rankRows([...nativeRows, ...candidateRows]);
}
import type { NativeRankedTaskProjection } from "./ranked-task-projection";
