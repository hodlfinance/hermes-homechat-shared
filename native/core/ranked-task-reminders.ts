import type { RankedTaskTime } from "./ranked-tasks";

export const rankedTaskReminderStates = [
  "none",
  "upcoming",
  "due_soon",
  "overdue",
  "review_pending",
  "review_due",
  "implicit_deadline_invalid",
] as const;

export type RankedTaskReminderState = (typeof rankedTaskReminderStates)[number];
export type RankedTaskReminderCadenceDays = 1 | 2 | 6 | 7 | 14;

/**
 * When this task comes back, and why. It no longer decides what the customer
 * can press: the row carries the same three buttons whatever this says
 * (`rankedTaskRowActionIds`). Until HPD-410 the reminder also named the buttons,
 * so a task in one state offered `["dismiss", "review_later"]`, a task in
 * another offered `["complete", "dismiss", "review_later"]`, and a task with no
 * reminder due offered nothing at all.
 */
export interface RankedTaskReminderDecision {
  readonly state: RankedTaskReminderState;
  readonly cadenceDays: RankedTaskReminderCadenceDays | null;
  readonly effectiveDeadlineAt: string | null;
  readonly deadlineKind: "evidenced" | "implied" | "none";
  readonly scoreEffect: "none";
}

const dayMs = 24 * 60 * 60 * 1_000;

function canonicalInstant(value: string, field: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${field} must be a canonical UTC ISO timestamp.`);
  }
  return parsed;
}

export function rankedTaskDeadlineCadenceDays(input: {
  readonly now: string;
  readonly effectiveDeadlineAt: string;
}): Exclude<RankedTaskReminderCadenceDays, 6> {
  const now = canonicalInstant(input.now, "now");
  const deadline = canonicalInstant(input.effectiveDeadlineAt, "effectiveDeadlineAt");
  const remainingDays = Math.max(0, Math.ceil((deadline - now) / dayMs));
  if (remainingDays > 30) return 14;
  if (remainingDays >= 8) return 7;
  if (remainingDays >= 3) return 2;
  return 1;
}

function deadlineDecision(input: {
  readonly now: string;
  readonly deadlineAt: string;
  readonly deadlineKind: "evidenced" | "implied";
}): RankedTaskReminderDecision {
  const now = canonicalInstant(input.now, "now");
  const deadline = canonicalInstant(input.deadlineAt, "deadlineAt");
  const overdue = deadline < now;
  const cadenceDays = rankedTaskDeadlineCadenceDays({
    now: input.now,
    effectiveDeadlineAt: input.deadlineAt,
  });
  const remainingDays = Math.max(0, Math.ceil((deadline - now) / dayMs));
  const state: RankedTaskReminderState = overdue
    ? "overdue"
    : remainingDays <= 2
      ? "due_soon"
      : "upcoming";
  return Object.freeze({
    state,
    cadenceDays,
    effectiveDeadlineAt: input.deadlineAt,
    deadlineKind: input.deadlineKind,
    scoreEffect: "none" as const,
  });
}

export function resolveRankedTaskReminder(input: {
  readonly now: string;
  readonly time: RankedTaskTime;
}): RankedTaskReminderDecision {
  const now = canonicalInstant(input.now, "now");
  if (input.time.kind === "evidenced") {
    return deadlineDecision({
      now: input.now,
      deadlineAt: input.time.deadlineAt,
      deadlineKind: "evidenced",
    });
  }
  if (input.time.kind === "implied") {
    return deadlineDecision({
      now: input.now,
      deadlineAt: input.time.targetAt,
      deadlineKind: "implied",
    });
  }

  const nextReview = canonicalInstant(input.time.nextReviewAt, "nextReviewAt");
  if (input.time.suggestion === "complete_or_dismiss") {
    return Object.freeze({
      state: "implicit_deadline_invalid" as const,
      cadenceDays: 6 as const,
      effectiveDeadlineAt: null,
      deadlineKind: "none" as const,
      scoreEffect: "none" as const,
    });
  }
  return Object.freeze({
    state: nextReview <= now ? "review_due" as const : "review_pending" as const,
    cadenceDays: 6 as const,
    effectiveDeadlineAt: null,
    deadlineKind: "none" as const,
    scoreEffect: "none" as const,
  });
}
