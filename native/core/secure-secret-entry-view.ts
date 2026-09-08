export { secureSecretEntryCopy } from "./secure-secret-entry-copy";
// The Control Plane's own record of a request is a different thing from what a
// client holds while it prompts for the value, and both are called a request.
// Name the Control Plane's one at the door so the two never blur together.
import {
  secureSecretEntryPendingRequestFrom,
  secureSecretEntryRequestFrom,
  type SecureSecretEntryPendingRequest,
  type SecureSecretEntryRequest as ControlPlaneSecureSecretEntryRequest,
} from "./index";

export type SecureSecretEntryRequest = {
  conversationSessionId: string;
  id: string;
  runId: string;
  label: string;
  purpose: string;
  allowedToolIds: string[];
  expiresAt: string;
};

type SecureSecretEntrySnapshot = {
  id: string;
  status: string;
  events?: readonly unknown[];
};

type SecureSecretEntryContext = {
  conversationSessionId: string | null;
  runId: string | null;
  now?: string;
};

export type SecureSecretValueBuffer = Readonly<{ value: string }>;

export const initialSecureSecretValueBuffer: SecureSecretValueBuffer = Object.freeze({ value: "" });

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function exactContextId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 256 ? normalized : null;
}

function containsSecretBearingField(value: Record<string, unknown>) {
  return Object.keys(value).some((key) => ["value", "plaintext", "ciphertext", "iv", "authtag", "secrethint"].includes(key.toLowerCase()));
}

export function secureSecretEntryRequestFromEvent(
  input: unknown,
  context: SecureSecretEntryContext,
): SecureSecretEntryRequest | null {
  const event = record(input);
  const payload = record(event?.payload);
  const conversationSessionId = exactContextId(context.conversationSessionId);
  const expectedRunId = exactContextId(context.runId);
  if (
    (event?.type !== "run.status" && event?.type !== "status") ||
    payload?.action !== "secret.entry.requested" ||
    payload?.targetType !== "secure_secret" ||
    !conversationSessionId ||
    !expectedRunId ||
    event.runId !== expectedRunId ||
    containsSecretBearingField(event) ||
    containsSecretBearingField(payload)
  ) {
    return null;
  }
  try {
    const parsed = secureSecretEntryRequestFrom({
      id: payload.requestId,
      runId: event.runId,
      label: payload.label,
      purpose: payload.purpose,
      allowedToolIds: payload.allowedToolIds,
      status: "pending",
      expiresAt: payload.expiresAt,
      createdAt: event.createdAt,
    });
    const now = Date.parse(context.now ?? new Date().toISOString());
    if (!Number.isFinite(now) || Date.parse(parsed.expiresAt) <= now) return null;
    return {
      conversationSessionId,
      id: parsed.id,
      runId: parsed.runId,
      label: parsed.label,
      purpose: parsed.purpose,
      allowedToolIds: parsed.allowedToolIds,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function secureSecretEntryAfterEvent(
  current: SecureSecretEntryRequest | null,
  input: unknown,
  context: SecureSecretEntryContext,
) {
  const next = secureSecretEntryRequestFromEvent(input, context);
  if (!next) return current;
  if (
    current?.conversationSessionId === next.conversationSessionId &&
    current.id === next.id &&
    current.runId === next.runId
  ) {
    return current;
  }
  return next;
}

export function secureSecretEntryAfterDiscovery(
  current: SecureSecretEntryRequest | null,
  input: readonly unknown[],
  context: Pick<SecureSecretEntryContext, "conversationSessionId" | "now">,
) {
  const conversationSessionId = exactContextId(context.conversationSessionId);
  if (!conversationSessionId || !Array.isArray(input) || input.length > 16) return current;
  const parsed: SecureSecretEntryPendingRequest[] = [];
  for (const value of input) {
    try {
      const request = secureSecretEntryPendingRequestFrom(value);
      if (request.conversationSessionId !== conversationSessionId) return current;
      parsed.push(request);
    } catch {
      return current;
    }
  }
  const request = parsed[0];
  if (!request) {
    return current?.conversationSessionId === conversationSessionId ? null : current;
  }
  const timestamp = Date.parse(context.now ?? new Date().toISOString());
  if (!Number.isFinite(timestamp) || Date.parse(request.expiresAt) <= timestamp) {
    return current?.conversationSessionId === conversationSessionId ? null : current;
  }
  if (
    current?.conversationSessionId === conversationSessionId &&
    current.id === request.id &&
    current.runId === request.runId
  ) {
    return current;
  }
  return {
    conversationSessionId,
    id: request.id,
    runId: request.runId,
    label: request.label,
    purpose: request.purpose,
    allowedToolIds: request.allowedToolIds,
    expiresAt: request.expiresAt,
  };
}

export function secureSecretEntryAfterSnapshot(
  current: SecureSecretEntryRequest | null,
  snapshot: SecureSecretEntrySnapshot,
  context: SecureSecretEntryContext,
) {
  const expectedRunId = exactContextId(context.runId);
  const conversationSessionId = exactContextId(context.conversationSessionId);
  const timestamp = Date.parse(context.now ?? new Date().toISOString());
  const currentAtTime = current &&
    conversationSessionId === current.conversationSessionId &&
    expectedRunId === current.runId
    ? Number.isFinite(timestamp) && Date.parse(current.expiresAt) > timestamp
      ? current
      : null
    : current;
  if (!expectedRunId || snapshot.id !== expectedRunId) return currentAtTime;
  if (snapshot.status !== "queued" && snapshot.status !== "running" && snapshot.status !== "waiting_for_approval") {
    return currentAtTime;
  }
  return (snapshot.events ?? []).reduce<SecureSecretEntryRequest | null>(
    (next, event) => secureSecretEntryAfterEvent(next, event, context),
    currentAtTime,
  );
}

function secureSecretEntryKey(request: SecureSecretEntryRequest) {
  return JSON.stringify([request.conversationSessionId, request.runId, request.id]);
}

export function sameSecureSecretEntryRequest(
  left: SecureSecretEntryRequest | null,
  right: SecureSecretEntryRequest,
) {
  return left?.conversationSessionId === right.conversationSessionId &&
    left.runId === right.runId &&
    left.id === right.id;
}

export function secureSecretEntryAfterResolution(
  current: SecureSecretEntryRequest | null,
  candidate: SecureSecretEntryRequest,
  resolution: ControlPlaneSecureSecretEntryRequest,
  context: SecureSecretEntryContext,
) {
  const conversationSessionId = exactContextId(context.conversationSessionId);
  const expectedRunId = exactContextId(context.runId);
  if (
    !conversationSessionId ||
    !expectedRunId ||
    candidate.conversationSessionId !== conversationSessionId ||
    candidate.runId !== expectedRunId ||
    resolution.id !== candidate.id ||
    resolution.runId !== candidate.runId ||
    (current && !sameSecureSecretEntryRequest(current, candidate))
  ) {
    return current;
  }
  if (resolution.status !== "pending") {
    return sameSecureSecretEntryRequest(current, candidate) ? null : current;
  }
  const timestamp = Date.parse(context.now ?? new Date().toISOString());
  if (!Number.isFinite(timestamp) || Date.parse(resolution.expiresAt) <= timestamp) {
    return sameSecureSecretEntryRequest(current, candidate) ? null : current;
  }
  return {
    conversationSessionId,
    id: resolution.id,
    runId: resolution.runId,
    label: resolution.label,
    purpose: resolution.purpose,
    allowedToolIds: resolution.allowedToolIds,
    expiresAt: resolution.expiresAt,
  };
}

export function createSecureSecretEntryResolutionGate() {
  const minimumIntervalMs = 12_000;
  const initialBackoffMs = 60_000;
  const maximumBackoffMs = 10 * 60_000;
  const state = new Map<string, {
    phase: "in_flight" | "retryable" | "settled";
    nextAllowedAt: number;
    failureCount: number;
  }>();
  return {
    claim(request: SecureSecretEntryRequest, revalidateSettled = false, now = Date.now()) {
      const key = secureSecretEntryKey(request);
      const current = state.get(key);
      if (
        current?.phase === "in_flight" ||
        (current?.phase === "settled" && !revalidateSettled) ||
        (current && now < current.nextAllowedAt)
      ) return false;
      state.set(key, {
        phase: "in_flight",
        nextAllowedAt: now + minimumIntervalMs,
        failureCount: current?.failureCount ?? 0,
      });
      return true;
    },
    isInFlight(request: SecureSecretEntryRequest) {
      return state.get(secureSecretEntryKey(request))?.phase === "in_flight";
    },
    backoff(request: SecureSecretEntryRequest, now = Date.now()) {
      const key = secureSecretEntryKey(request);
      const current = state.get(key);
      if (current?.phase !== "in_flight") return;
      const failureCount = current.failureCount + 1;
      const backoffMs = Math.min(maximumBackoffMs, initialBackoffMs * 2 ** (failureCount - 1));
      state.set(key, {
        phase: "retryable",
        nextAllowedAt: Math.max(current.nextAllowedAt, now + backoffMs),
        failureCount,
      });
    },
    delayUntilClaim(request: SecureSecretEntryRequest, now = Date.now()) {
      const current = state.get(secureSecretEntryKey(request));
      if (!current) return 0;
      if (current.phase === "in_flight") return minimumIntervalMs;
      return Math.max(0, current.nextAllowedAt - now);
    },
    settle(request: SecureSecretEntryRequest) {
      const key = secureSecretEntryKey(request);
      const current = state.get(key);
      state.set(key, {
        phase: "settled",
        nextAllowedAt: current?.nextAllowedAt ?? Date.now() + minimumIntervalMs,
        failureCount: 0,
      });
    },
    reset() {
      state.clear();
    },
  };
}

export function secureSecretEntryAfterClose(
  current: SecureSecretEntryRequest | null,
  requestId: string,
) {
  return current?.id === requestId ? null : current;
}

export function secureSecretValueBufferAfterInput(
  _current: SecureSecretValueBuffer,
  value: string,
): SecureSecretValueBuffer {
  return { value };
}

export function secureSecretValueBufferAfterClear(
  _current: SecureSecretValueBuffer,
): SecureSecretValueBuffer {
  return initialSecureSecretValueBuffer;
}

/**
 * Saving and cancelling one prompt. The web client carried these two on its own
 * side of the duplicated pair; they belong with the rest of the model, so both
 * clients call the same thing.
 */
export async function secureSecretEntrySave(
  request: SecureSecretEntryRequest,
  value: string,
  complete: (requestId: string, body: { value: string }) => Promise<{ referenceId: string; label: string }>,
  now = new Date().toISOString(),
) {
  if (!value || Date.parse(request.expiresAt) <= Date.parse(now)) {
    throw new Error("Secure secret entry is unavailable.");
  }
  const metadata = await complete(request.id, { value });
  return { state: "saved" as const, requestId: request.id, label: metadata.label };
}

export async function secureSecretEntryCancel(
  request: SecureSecretEntryRequest,
  cancel: (requestId: string) => Promise<unknown>,
) {
  await cancel(request.id);
  return { state: "cancelled" as const, requestId: request.id };
}
