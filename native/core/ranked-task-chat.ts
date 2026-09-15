import type { AppLocale } from "./types";
import type { RankedTaskListRow, PendingRankedTaskListRow } from "./ranked-task-list-view";

/**
 * What the Chat button hands over.
 *
 * Only a stable server-resolvable identity is prefilled. The customer writes
 * the actual request; source text and task titles do not enter the composer.
 */
export const RANKED_TASK_CHAT_SCHEMA = "hey.ranked-task-chat.v1" as const;
export const RANKED_TASK_CHAT_PROMPT_MAX_LENGTH = 200;

const limits = {
  id: 180,
  title: 200,
  origin: 120,
  evidenceLabel: 160,
} as const;

const unsafeControls = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]+/g;
const safeId = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

export type RankedTaskChatContext = Readonly<{
  rankedItemId: string;
  title: string;
  origin: string;
  source: RankedTaskListRow["source"];
  kanbanId: string | null;
  state: string;
  rank: number | null;
  score: number | null;
  deadline?: string;
  deadlineEvidence?: string;
  target?: string;
  nextReview?: string;
}>;

function boundedText(value: unknown, field: string, maxLength: number, required: boolean) {
  if (typeof value !== "string") throw new Error(`Invalid ranked task ${field}.`);
  const normalized = value.replace(unsafeControls, " ").replace(/\s+/g, " ").trim();
  const bounded = Array.from(normalized).slice(0, maxLength).join("");
  if (required && !bounded) throw new Error(`Invalid ranked task ${field}.`);
  return bounded;
}

function exactId(value: unknown, field: string) {
  if (typeof value !== "string" || !value || value.length > limits.id || !safeId.test(value)) {
    throw new Error(`Invalid ranked task ${field}.`);
  }
  return value;
}

export function rankedTaskChatContext(row: RankedTaskListRow | PendingRankedTaskListRow): RankedTaskChatContext {
  // Unscored native cards are actionable references too; never invent scores,
  // deadlines or a candidate identity just to enter the Chat flow.
  if (!("score" in row)) {
    return Object.freeze({
      rankedItemId: exactId(row.id, "id"),
      title: boundedText(row.title, "title", limits.title, true),
      origin: "Hermes Kanban",
      source: "kanban" as const,
      kanbanId: exactId(row.id, "Kanban ID"),
      state: row.nativeStatus,
      rank: null,
      score: null,
    });
  }
  const state = row.nativeStatus ?? row.candidateState;
  if (!state) throw new Error("A ranked row must say what state it is in.");
  const time = row.time;
  return Object.freeze({
    rankedItemId: exactId(row.id, "id"),
    title: boundedText(row.title, "title", limits.title, true),
    origin: boundedText(row.sourceLabel, "origin", limits.origin, true),
    source: row.source,
    kanbanId: row.nativeTaskId === null ? null : exactId(row.nativeTaskId, "Kanban ID"),
    state,
    rank: row.rank,
    score: row.score,
    ...(time.kind === "evidenced"
      ? {
          deadline: time.deadlineAt,
          deadlineEvidence: boundedText(time.evidenceLabel, "deadline evidence", limits.evidenceLabel, false),
        }
      : time.kind === "implied"
        ? { target: time.targetAt, nextReview: time.nextReviewAt }
        : { nextReview: time.nextReviewAt }),
  });
}

export function buildRankedTaskChatPrompt(row: RankedTaskListRow | PendingRankedTaskListRow, _locale: AppLocale = "en"): string {
  const nativeId = "score" in row ? row.nativeTaskId : row.id;
  const prompt = nativeId === null
    ? `Ranked-ID: ${exactId(row.id, "id")}`
    : `Kanban-ID: ${exactId(nativeId, "Kanban ID")}`;
  if (prompt.length > RANKED_TASK_CHAT_PROMPT_MAX_LENGTH) {
    throw new Error("Ranked task identity cannot be represented within the prompt limit.");
  }
  return prompt;
}
