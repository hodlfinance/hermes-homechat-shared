import type {
  ApprovalCard,
  ChatClarifyRequest,
  ChatRunEvent,
  ChatRunStatus,
} from "../core/index";

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function mobileChatClarifyRequestFromEvent(event: ChatRunEvent): ChatClarifyRequest | null {
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
export function mobileChatUserDecisionStatusFromEvent(
  event: ChatRunEvent,
): Extract<ChatRunStatus, "waiting_for_approval"> | null {
  if (event.payload?.requiresUserReply !== true) return null;
  if (nonEmptyString(event.payload.approvalId)) return "waiting_for_approval";
  return mobileChatClarifyRequestFromEvent(event) ? "waiting_for_approval" : null;
}

export function mobileVisibleChatApprovalCards(input: {
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

/**
 * Clarify requests remain in the durable event history after they are answered.
 * Pair them with their clarifyResolved status events before selecting the newest
 * outstanding question, so a later approval in the same run cannot revive an
 * already-answered card.
 */
export function mobileVisibleChatClarifyRequest(
  status: ChatRunStatus | null | undefined,
  events: readonly ChatRunEvent[],
): ChatClarifyRequest | null {
  if (status !== "waiting_for_approval") return null;
  const resolvedIds = new Set(events.flatMap((event) => {
    if (event.type !== "status" || event.payload?.clarifyResolved !== true) return [];
    return nonEmptyString(event.payload.clarifyId) ? [event.payload.clarifyId] : [];
  }));
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const clarify = mobileChatClarifyRequestFromEvent(events[index]!);
    if (clarify && !resolvedIds.has(clarify.id)) return clarify;
  }
  return null;
}
