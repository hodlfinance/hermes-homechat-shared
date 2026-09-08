import { mergeHomechatMessages } from "../core/index";

/** A run may observe its own state while another conversation is on screen. */
export function mobileRunOwnsVisibleConversation(input: {
  conversationSessionId: string | null;
  activeConversationSessionId: string | null;
  selectionVersionAtStart: number;
  currentSelectionVersion: number;
}) {
  return input.conversationSessionId === input.activeConversationSessionId &&
    (input.conversationSessionId !== null || input.selectionVersionAtStart === input.currentSelectionVersion);
}

export type MobileRunBoundMessage = {
  content: string;
  id: string;
  runId: string;
  conversationSessionId?: string | null;
  optimistic?: boolean;
  provisional?: boolean;
  role: "user" | "assistant" | "system" | "tool";
  createdAt: string;
};

type MobileRunFailureEvent = {
  message?: unknown;
  payload?: Record<string, unknown> | null;
  runId?: string | null;
  type: string;
};

function compareCreatedAt(left: MobileRunBoundMessage, right: MobileRunBoundMessage) {
  const time = left.createdAt.localeCompare(right.createdAt);
  return time || left.id.localeCompare(right.id);
}

/**
 * Reconciles one conversation and keeps every run's response beside the user
 * message that started that run, even when an older response arrives late.
 */
export function reconcileMobileRunBoundMessages<T extends MobileRunBoundMessage>(input: {
  conversationSessionId: string | null;
  current: readonly T[];
  incoming: readonly T[];
}): T[] {
  const belongsToConversation = (message: T) => !input.conversationSessionId ||
    message.conversationSessionId === input.conversationSessionId ||
    (message.optimistic === true && !message.conversationSessionId);
  const merged = mergeHomechatMessages(input.current, input.incoming).filter(belongsToConversation);

  const runs = new Map<string, T[]>();
  for (const message of merged) {
    const runKey = message.runId || `message:${message.id}`;
    const group = runs.get(runKey) || [];
    group.push(message);
    runs.set(runKey, group);
  }

  const groups = [...runs.values()].map((messages) => {
    messages.sort((left, right) => {
      const roleOrder = (left.role === "user" ? 0 : 1) - (right.role === "user" ? 0 : 1);
      return roleOrder || compareCreatedAt(left, right);
    });
    const anchor = messages.find((message) => message.role === "user") || [...messages].sort(compareCreatedAt)[0]!;
    return { anchor, messages };
  });
  groups.sort((left, right) => compareCreatedAt(left.anchor, right.anchor));
  return groups.flatMap((group) => group.messages);
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/**
 * A failed run is represented by the existing Retry/Dismiss card while the
 * customer can still act on that exact send. The API also persists its friendly
 * failure sentence as an assistant message so the outcome survives a reload.
 * Showing both at once makes one failed run look like two failures.
 *
 * Remove only the API-authored echo: it must belong to the same run and repeat
 * the terminal error text. Other assistant output stays visible. A
 * `customerReason` is different: that sentence is the canonical explanation
 * and deliberately replaces the retry card.
 */
export function mobileMessagesForFailedRunNotice<T extends MobileRunBoundMessage>(input: {
  events: readonly MobileRunFailureEvent[];
  failedRunId: string | null | undefined;
  messages: readonly T[];
}): T[] {
  if (!input.failedRunId) return [...input.messages];
  const failure = [...input.events].reverse().find((event) =>
    event.type === "error" && (!event.runId || event.runId === input.failedRunId));
  if (!failure) return [...input.messages];

  const payload = failure.payload ?? {};
  if (textValue(payload.customerReason)) return [...input.messages];
  const errorText = textValue(payload.error) || textValue(payload.message) || textValue(failure.message);
  if (!errorText) return [...input.messages];

  const assistantMessage = recordValue(payload.assistantMessage);
  const assistantMessageId = textValue(assistantMessage?.id);
  return input.messages.filter((message) => {
    if (message.runId !== input.failedRunId || message.role !== "assistant") return true;
    if (assistantMessageId && message.id !== assistantMessageId) return true;
    return message.content.trim() !== errorText;
  });
}

export function mobileRunOwnsEvent(currentRunId: string | null, eventRunId: string) {
  return Boolean(currentRunId && currentRunId === eventRunId);
}
