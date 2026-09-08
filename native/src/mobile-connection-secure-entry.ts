export type MobileConnectionSecureEntryKind = "telegram" | "whatsapp";

export type MobileConnectionSecureEntryRequest = {
  conversationSessionId: string;
  kind: MobileConnectionSecureEntryKind;
  requestId: string;
  runId: string;
};

type MobileConnectionSecureEntryContext = {
  conversationSessionId: string | null;
  runId: string | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function identifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 256 ? normalized : null;
}

function secureEntryKind(value: unknown): MobileConnectionSecureEntryKind | null {
  return value === "telegram" || value === "whatsapp" ? value : null;
}

export function mobileConnectionSecureEntryRequestFromEvent(
  input: unknown,
  context: MobileConnectionSecureEntryContext,
): MobileConnectionSecureEntryRequest | null {
  const event = record(input);
  const payload = record(event?.payload);
  const runId = identifier(event?.runId);
  const conversationSessionId = identifier(context.conversationSessionId);
  const expectedRunId = identifier(context.runId);
  const requestId = identifier(payload?.requestId);
  const kind = secureEntryKind(payload?.target);
  if (
    event?.type !== "run.status" ||
    payload?.action !== "connection.requested" ||
    payload?.targetType !== "connection" ||
    !runId ||
    runId !== expectedRunId ||
    !conversationSessionId ||
    !requestId ||
    !kind
  ) {
    return null;
  }
  return { conversationSessionId, kind, requestId, runId };
}

export function mobileConnectionSecureEntryAfterEvent(
  current: MobileConnectionSecureEntryRequest | null,
  input: unknown,
  context: MobileConnectionSecureEntryContext,
): MobileConnectionSecureEntryRequest | null {
  const next = mobileConnectionSecureEntryRequestFromEvent(input, context);
  if (!next) return current;
  if (
    current?.conversationSessionId === next.conversationSessionId &&
    current.kind === next.kind &&
    current.requestId === next.requestId &&
    current.runId === next.runId
  ) {
    return current;
  }
  return next;
}

export function mobileConnectionSecureEntryAfterClose(
  current: MobileConnectionSecureEntryRequest | null,
  requestId: string,
): MobileConnectionSecureEntryRequest | null {
  return current?.requestId === requestId ? null : current;
}

export function mobileConnectionSecureEntryContinuation(request: MobileConnectionSecureEntryRequest): string {
  const service = request.kind === "telegram" ? "Telegram" : "WhatsApp";
  return `I saved the ${service} credential through secure entry. Continue this ${service} setup in this conversation from the current saved connection state.`;
}
