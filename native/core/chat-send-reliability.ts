import type { ChatMessage, ChatRun, ChatRunStatus } from "./types";

/**
 * One user send attempt. The idempotency key is what makes a retry land on the
 * run the server already created instead of creating a second one, so it is
 * created once per attempt and reused for every retry of that same attempt.
 */
export type ChatSendAttempt = {
  idempotencyKey: string;
  optimisticMessageId: string;
};

export type ChatSendOutcome =
  | { kind: "delivered"; runId: string; status: ChatRunStatus }
  | { kind: "unconfirmed"; runId: string | null; reason: string }
  /**
   * `mayHaveCreatedRun` separates "the server refused and stored nothing" from
   * "the server said no after it had already stored the message". Only the
   * first may take the message back out of the transcript.
   */
  | { kind: "failed"; runId: string | null; reason: string; mayHaveCreatedRun: boolean }
  | { kind: "aborted" };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * `POST /hermes/runs` accepts a UUIDv4/v7 or at least 128 bits of base64url.
 * A device that cannot produce one must fail loudly: an unprotected retry is
 * exactly how a message ends up stored twice.
 */
export function chatSendIdempotencyKey(randomUUID: () => string) {
  const key = randomUUID();
  if (!uuidPattern.test(key)) {
    throw new Error("Secure message retry identifiers are unavailable on this device.");
  }
  return key;
}

export function createChatSendAttempt(randomUUID: () => string): ChatSendAttempt {
  const idempotencyKey = chatSendIdempotencyKey(randomUUID);
  return { idempotencyKey, optimisticMessageId: `local_${idempotencyKey}` };
}

/**
 * Replaces the optimistic copy of a sent message with the canonical message the
 * server stored for the same run, keeping its position in the transcript.
 *
 * Identity, not content, decides: the API materializes attachments into the
 * stored message with runtime paths the client cannot predict, so content
 * equality would leave both copies visible.
 */
export function reconcileOptimisticUserMessage<Message extends ChatMessage>(input: {
  messages: readonly Message[];
  optimisticMessageId: string;
  run: (Pick<ChatRun, "id"> & { messages?: readonly Message[] }) | null | undefined;
}): Message[] {
  const messages = [...input.messages];
  const run = input.run;
  if (!run) return messages;
  const canonical = (run.messages ?? []).find(
    (message) =>
      message.role === "user" &&
      message.runId === run.id &&
      message.id !== input.optimisticMessageId,
  );
  if (!canonical) return messages;

  const optimisticIndex = messages.findIndex((message) => message.id === input.optimisticMessageId);
  const existingCanonicalIndex = messages.findIndex((message) => message.id === canonical.id);
  if (optimisticIndex < 0) {
    if (existingCanonicalIndex >= 0) messages[existingCanonicalIndex] = canonical;
    return messages;
  }
  if (existingCanonicalIndex >= 0 && existingCanonicalIndex !== optimisticIndex) {
    messages[existingCanonicalIndex] = canonical;
    messages.splice(optimisticIndex, 1);
    return messages;
  }
  messages[optimisticIndex] = canonical;
  return messages;
}

/**
 * Rejections the canonical run route decides before it stores anything, so the
 * message provably did not land.
 */
const refusedBeforeStorageStatuses = new Set([400, 401, 403, 404, 405, 409, 410, 413, 415, 422, 423]);

export function chatSendErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" && Number.isFinite(status) ? status : null;
}

function chatSendErrorReason(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.trim() : "";
  return message || fallback;
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: unknown }).name;
  const code = (error as { code?: unknown }).code;
  return name === "AbortError" || code === "aborted" || code === 20;
}

/**
 * Decides what the customer is told after a send did not complete cleanly.
 *
 * "Failed" is reserved for a run the server itself reports as failed and for a
 * request the server refused outright. Everything else the client cannot prove
 * is unconfirmed: the run may well be alive, and saying otherwise is the false
 * failure this issue exists to remove.
 */
export function classifyChatSendOutcome(input: {
  aborted?: boolean;
  error: unknown;
  runId?: string | null;
  runStatus?: ChatRunStatus | string | null;
}): ChatSendOutcome {
  if (input.aborted || isAbortError(input.error)) return { kind: "aborted" };

  const runId = input.runId ?? null;
  const runStatus = input.runStatus ?? null;
  if (runId && (runStatus === "completed" || runStatus === "cancelled")) {
    return { kind: "delivered", runId, status: runStatus };
  }
  if (runStatus === "failed") {
    return {
      kind: "failed",
      runId,
      mayHaveCreatedRun: true,
      reason: chatSendErrorReason(input.error, "That reply could not be completed."),
    };
  }
  if (runId) {
    return {
      kind: "unconfirmed",
      runId,
      reason: chatSendErrorReason(input.error, "The connection to this reply was interrupted."),
    };
  }

  const status = chatSendErrorStatus(input.error);
  if (status !== null && refusedBeforeStorageStatuses.has(status)) {
    return {
      kind: "failed",
      runId: null,
      mayHaveCreatedRun: false,
      reason: chatSendErrorReason(input.error, "That message was not accepted."),
    };
  }
  if (status !== null) {
    // The server answered, so the customer gets its wording — but a usage
    // rejection or a server error can arrive after the message was stored, so
    // the message stays and the attempt keeps its key.
    return {
      kind: "failed",
      runId: null,
      mayHaveCreatedRun: true,
      reason: chatSendErrorReason(input.error, "That message was not accepted."),
    };
  }
  return {
    kind: "unconfirmed",
    runId: null,
    reason: chatSendErrorReason(input.error, "This message could not be confirmed yet."),
  };
}

/**
 * What a run that the client stopped following is really doing. A follow that
 * ended in an error says nothing about the run itself, so the server's own
 * status decides, and an unknown status stays unconfirmed rather than failed.
 */
export function chatRunFollowStatus(input: {
  phase: string | null | undefined;
  runStatus?: ChatRunStatus | string | null;
}): "completed" | "cancelled" | "failed" | "running" | "unconfirmed" {
  if (input.phase === "completed") return "completed";
  if (input.phase === "stopped") return "cancelled";
  if (input.phase !== "error") return "running";
  if (input.runStatus === "failed") return "failed";
  if (input.runStatus === "completed") return "completed";
  if (input.runStatus === "cancelled") return "cancelled";
  return "unconfirmed";
}

/**
 * Only an unconfirmed attempt may be retried, and only with its original key —
 * that is what turns a retry into a replay of the same run.
 */
export function shouldRetryWithSameIdempotencyKey(outcome: ChatSendOutcome) {
  return outcome.kind === "unconfirmed";
}
