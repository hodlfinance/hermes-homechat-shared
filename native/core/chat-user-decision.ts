import type {
  ApprovalCard,
  ChatClarifyRequest,
  ChatRunEvent,
  ChatRunStatus,
} from "./types";

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function chatClarifyRequestFromEvent(event: ChatRunEvent): ChatClarifyRequest | null {
  if (event.type !== "message_delta") return null;
  const raw = event.payload?.clarifyRequest;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const id = nonEmptyString(source.id) ? source.id : "";
  const question = nonEmptyString(source.question) ? source.question : "";
  const expiresAt = nonEmptyString(source.expiresAt) ? source.expiresAt : "";
  if (!id || !question || !expiresAt) return null;
  return {
    id,
    question,
    choices: Array.isArray(source.choices)
      ? source.choices.filter((choice): choice is string => nonEmptyString(choice))
      : [],
    allowOther: source.allowOther === true,
    expiresAt,
  };
}

/**
 * Approval and clarification requests arrive as message events after the plane
 * has already placed the run in waiting_for_approval. The live client must
 * mirror that transition immediately; otherwise its own visibility guards hide
 * the very control Hermes is waiting for until the conversation is reloaded.
 */
export function chatUserDecisionStatusFromEvent(
  event: ChatRunEvent,
): Extract<ChatRunStatus, "waiting_for_approval"> | null {
  if (event.payload?.requiresUserReply !== true) return null;
  if (nonEmptyString(event.payload.approvalId)) return "waiting_for_approval";
  return chatClarifyRequestFromEvent(event) ? "waiting_for_approval" : null;
}

/**
 * Resolve a decision delta or a status proven by the original gateway event.
 * Canonical conversion defaults diagnostic statuses to `running`, so callers
 * must pass the original status instead of trusting the converted payload.
 */
export function chatRunStatusFromEvent(event: ChatRunEvent, originalStatus: unknown): ChatRunStatus | null {
  const decision = chatUserDecisionStatusFromEvent(event);
  if (decision) return decision;
  if (event.type !== "status") return null;
  return typeof originalStatus === "string" && isChatRunStatus(originalStatus) ? originalStatus : null;
}

function isChatRunStatus(value: string): value is ChatRunStatus {
  return ["queued", "running", "waiting_for_approval", "completed", "cancelled", "failed"].includes(value);
}

export function visibleChatApprovalCards(input: {
  cards: readonly ApprovalCard[];
  conversationSessionId: string | null;
  runStatuses: Readonly<Record<string, ChatRunStatus>>;
}): ApprovalCard[] {
  return input.cards.filter((card) =>
    card.status === "pending" &&
    card.conversationSessionId === input.conversationSessionId &&
    Boolean(card.runId && input.runStatuses[card.runId] === "waiting_for_approval"),
  );
}

export type ClarifyVisibilityOptions = {
  /** Questions this app answered itself, before the plane's receipt arrived. */
  answeredClarifyIds?: ReadonlySet<string>;
  now?: number;
};

function isFinishedStatus(status: ChatRunStatus | null | undefined) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

/**
 * Clarify requests remain in the durable event history after they are answered.
 * Pair them with their clarifyResolved status events before selecting the newest
 * outstanding question, so a later approval in the same run cannot revive an
 * already-answered card.
 */
function newestOpenClarify(
  events: readonly ChatRunEvent[],
  answeredClarifyIds: ReadonlySet<string> | undefined,
): ChatClarifyRequest | null {
  const resolvedIds = new Set(events.flatMap((event) => {
    if (event.type !== "status" || event.payload?.clarifyResolved !== true) return [];
    return nonEmptyString(event.payload.clarifyId) ? [event.payload.clarifyId] : [];
  }));
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const clarify = chatClarifyRequestFromEvent(events[index]!);
    if (clarify && !resolvedIds.has(clarify.id)) {
      return answeredClarifyIds?.has(clarify.id) ? null : clarify;
    }
  }
  return null;
}

function clarifyIsOpen(clarify: ChatClarifyRequest, now: number) {
  const expiresAt = Date.parse(clarify.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

/**
 * HPD-961. The plane writes a clarify event and holds its run on
 * waiting_for_approval in one transaction, and every answer leaves a
 * clarifyResolved status event. An unresolved, unexpired clarify in a run's
 * events therefore proves the run waits, whatever status this app last read:
 * on 27.09.2026 the app had the clarify of run_QZ35NyyprPeEqL but never read
 * that run's status again once a follow-up was queued behind it, so the chat
 * said "Waiting for you" and showed no card. Only a run known to be finished
 * keeps its own status.
 */
export function chatRunStatusWithOpenClarify(
  status: ChatRunStatus | null | undefined,
  events: readonly ChatRunEvent[],
  options: ClarifyVisibilityOptions = {},
): ChatRunStatus | null | undefined {
  if (status === "waiting_for_approval" || isFinishedStatus(status)) return status;
  const clarify = newestOpenClarify(events, options.answeredClarifyIds);
  return clarify && clarifyIsOpen(clarify, options.now ?? Date.now()) ? "waiting_for_approval" : status;
}

export function visibleChatClarifyRequest(
  status: ChatRunStatus | null | undefined,
  events: readonly ChatRunEvent[],
  options: ClarifyVisibilityOptions = {},
): ChatClarifyRequest | null {
  if (isFinishedStatus(status)) return null;
  const clarify = newestOpenClarify(events, options.answeredClarifyIds);
  if (!clarify) return null;
  // A run the plane reports waiting keeps its card, which then says the
  // question expired; a stale or unknown status needs a question still open.
  if (status === "waiting_for_approval") return clarify;
  return clarifyIsOpen(clarify, options.now ?? Date.now()) ? clarify : null;
}

/** Return at most one open question per run with its canonical run ID. */
export function visibleChatClarifyRequests(
  statusesByRunId: Readonly<Record<string, ChatRunStatus>>,
  eventsByRunId: Readonly<Record<string, readonly ChatRunEvent[]>>,
  options: ClarifyVisibilityOptions = {},
): Array<{ runId: string; clarify: ChatClarifyRequest }> {
  return Object.entries(eventsByRunId).flatMap(([runId, events]) => {
    const clarify = visibleChatClarifyRequest(statusesByRunId[runId], events, options);
    return clarify ? [{ runId, clarify }] : [];
  });
}
