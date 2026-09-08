import type { ChatRunStatus, ConnectionSetupIntent } from "../core/index";

export type MobileMessageSource = "text" | "voice";

export type MobileFailedMessage = {
  attachments?: Array<{
    name: string;
    mimeType: string;
    size: number;
    kind: "image" | "file";
    dataBase64: string;
  }>;
  content: string;
  conversationSessionId?: string | null;
  connectionSetupIntent?: ConnectionSetupIntent;
  idempotencyKey: string;
  runId?: string | null;
  source: MobileMessageSource;
};

/** A confirmed completion supersedes a transport failure for that exact run. */
export function mobileFailedMessageHasCompleted(
  failed: Pick<MobileFailedMessage, "runId">,
  runStatusesById: Readonly<Record<string, ChatRunStatus>>,
): boolean {
  return Boolean(failed.runId && runStatusesById[failed.runId] === "completed");
}

export type MobileFailedMessageStage = "not_sent" | "no_answer";

/**
 * Two different failures wear the same card today, and one of the two wordings
 * is a lie.
 *
 * Measured against the control plane on 2026-08-23: once a run exists, the
 * message is stored. Sending it again under the same idempotency key answers
 * with the very same run — run_anQ3smpNU6oII2 on both attempts — so the message
 * did arrive and what failed was the reply.
 *
 * Without a run there is nothing on the other side, the message really was not
 * sent, and the same key is what keeps a retry from producing a second copy.
 */
export function mobileFailedMessageStage(
  failed: Pick<MobileFailedMessage, "runId">,
): MobileFailedMessageStage {
  return failed.runId ? "no_answer" : "not_sent";
}

/**
 * A retry of a message that never arrived repeats the attempt; a retry of a
 * reply that never came has to ask for a new run, because the old key can only
 * return the run that already failed.
 */
export function mobileFailedMessageRetryKey(
  failed: Pick<MobileFailedMessage, "idempotencyKey" | "runId">,
  newKey: () => string,
): string {
  return mobileFailedMessageStage(failed) === "no_answer" ? newKey() : failed.idempotencyKey;
}

export type MobileSendResult = "sent" | "queued" | "failed" | "ignored";
export type MobileBusySendIntent = "send_now" | "queue_follow_up" | "ignore_busy" | "ignore_duplicate";
export type MobileComposerActionState = {
  sendButtonShowsBusy: boolean;
  sendDisabled: boolean;
  sendLabel: string;
  showSendButton: boolean;
  showStopButton: boolean;
  stopAction: "reply" | "delegated_task" | "read_aloud" | null;
  stopLabel: string | null;
};
export type MobileQueuedFollowUpStatus = "queueing" | "queued" | "running" | "cancelling" | "cancelled" | "failed";
export type MobileQueuedFollowUpNoticeActionState = {
  cancelDisabled: boolean;
  showCancel: boolean;
  showDismiss: boolean;
};
export type MobileRunAttemptOutcome = "pending" | "completed" | "cancelled" | "failed";

/**
 * A reply that has been asked for but has not been given a run yet can take
 * nothing: a voice note cannot join it and cannot be queued behind it, because
 * there is no run to queue behind.
 *
 * Measured on the R2 device build on 2026-08-22: that window lasts from the tap
 * on send until the control plane answers with a run — 260 ms when it answered
 * at once, 11.2 s on a slow answer. Throughout it the microphone button looked
 * exactly like a working button and did nothing at all.
 */
export function mobileVoiceNoteBlockedByPendingRun(input: {
  activeRunId: string | null;
  busy: boolean;
}) {
  return input.busy && !input.activeRunId;
}

/**
 * The one place that decides how the microphone button looks. It has to agree
 * with the guard that starts the recording, or the button lies.
 */
export function mobileVoiceButtonDisabled(input: {
  activeRunId: string | null;
  busy: boolean;
  composerVoiceButtonDisabled: boolean;
  voiceRecordingActive: boolean;
}) {
  if (input.composerVoiceButtonDisabled) return true;
  if (input.voiceRecordingActive) return false;
  return mobileVoiceNoteBlockedByPendingRun(input);
}

export function mobileAttachmentVoiceComposerState(input: {
  hasAttachments: boolean;
  hasText: boolean;
  voiceButtonDisabled: boolean;
  voiceRecordingActive: boolean;
}) {
  return {
    showAttachmentSend: input.hasAttachments && !input.hasText && !input.voiceRecordingActive,
    showVoiceButton: !input.hasText && !input.voiceRecordingActive,
  };
}

export function createMobileRunPresentationOwner() {
  let generation = 0;
  let current: number | null = null;

  return {
    begin() {
      generation += 1;
      current = generation;
      return generation;
    },
    finish(token: number) {
      if (current === token) current = null;
    },
    invalidate() {
      current = null;
    },
    owns(token: number) {
      return current === token;
    },
  };
}

export function createMobileQueuedFollowUpOwner() {
  let generation = 0;
  return {
    admit() {
      generation += 1;
      return generation;
    },
    invalidate() {
      generation += 1;
    },
    owns(ownershipToken: number) {
      return ownershipToken === generation;
    },
  };
}

// Each queued message keeps ownership until its own terminal cleanup; admitting
// another message must not invalidate a still-running background follower.
export function createMobileQueuedFollowUpCollectionOwner() {
  let generation = 0;
  const owned = new Set<number>();
  return {
    admit() { const token = ++generation; owned.add(token); return token; },
    invalidate() { owned.clear(); },
    release(token: number) { owned.delete(token); },
    owns(token: number) { return owned.has(token); },
  };
}

export function createMobileTerminalUpdateContinuation() {
  let pendingRunId: string | null = null;
  let generation = 0;
  return {
    arm(runId: string | null | undefined) {
      pendingRunId = runId || null;
      const armedGeneration = ++generation;
      void Promise.resolve().then(() => {
        if (generation === armedGeneration) pendingRunId = null;
      });
    },
    accept(runId: string | null | undefined, primaryOwnership: boolean) {
      if (primaryOwnership) {
        if (runId && pendingRunId === runId) {
          pendingRunId = null;
          generation += 1;
        }
        return true;
      }
      if (!runId || pendingRunId !== runId) return false;
      pendingRunId = null;
      generation += 1;
      return true;
    },
  };
}

export function mobileRunAttemptOutcome(input: {
  phase: string;
}): MobileRunAttemptOutcome {
  if (input.phase === "completed") return "completed";
  if (input.phase === "stopped") return "cancelled";
  if (input.phase === "error") return "failed";
  return "pending";
}

export function createMobileMessageIdempotencyKey(randomUUID: () => string) {
  const key = randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new Error("Secure message retry identifiers are unavailable on this device.");
  }
  return key;
}

export function mobileSendNoticesAfterDismiss(
  source: MobileMessageSource | null | undefined,
  voiceNotice: string | null,
  ownsCurrentError: boolean,
) {
  return {
    clearError: ownsCurrentError,
    voiceNotice: source === "voice" ? null : voiceNotice,
  };
}

export function createMobileMessageSendGate() {
  let active = false;

  return {
    acquire() {
      if (active) return false;
      active = true;
      return true;
    },
    release() {
      active = false;
    },
    isActive() {
      return active;
    },
  };
}

export function mobileBusySendIntent(input: {
  activeRunId: string | null;
  busy: boolean;
  gateActive: boolean;
  hasQueuedFollowUp: boolean;
  allowMultipleFollowUps?: boolean;
}): MobileBusySendIntent {
  if (!input.busy) return input.gateActive ? "ignore_busy" : "send_now";
  if (!input.activeRunId) return "ignore_busy";
  return input.hasQueuedFollowUp && !input.allowMultipleFollowUps ? "ignore_duplicate" : "queue_follow_up";
}

export function mobileComposerActionState(input: {
  canSendMessage: boolean;
  canStopDelegatedTask?: boolean;
  canStopReadAloud: boolean;
  canStopReply: boolean;
  hasComposerContent: boolean;
  pendingAssistantText: boolean;
  queueFollowUpAvailable: boolean;
  sendButtonTitle: string;
  voiceRecordingActive: boolean;
}): MobileComposerActionState {
  // A sub order runs in the background and this screen never started it, so the
  // reply stop control knows nothing about it. On the sub order's own screen
  // the stop button is about the sub order, and it has to outrank the stop for
  // the stream this screen is watching.
  //
  // Measured on the device build on 2026-08-22 at 21:25, on the sub order's own
  // screen: the press reached the reply stop, the "Working" activity line went
  // away within a minute, and the sub order 20260822_212325_f87f24 was still
  // `running` on the server. The stream this screen watches belongs to the sub
  // order, so stopping it hides the work instead of ending it. The main chat has
  // no sub order of its own, so its stop control is untouched by this order.
  const stopAction = input.voiceRecordingActive || input.hasComposerContent
    ? null
    : input.canStopDelegatedTask
      ? "delegated_task" as const
      : input.canStopReply
        ? "reply" as const
        : input.canStopReadAloud
          ? "read_aloud" as const
          : null;
  const showStopButton = stopAction !== null;
  return {
    // HPD-440: reported on Build 58. On a sub order's screen the customer typed
    // a question and the send arrow was a spinner for minutes, with no way to
    // send it. Typing is the customer saying "send this"; whatever the screen
    // believes about some other run, the arrow belongs to him while there is
    // something in the box.
    sendButtonShowsBusy: Boolean(
      input.pendingAssistantText &&
      !input.voiceRecordingActive &&
      !input.queueFollowUpAvailable &&
      !input.hasComposerContent,
    ),
    sendDisabled: !input.canSendMessage,
    sendLabel: input.sendButtonTitle,
    showSendButton: true,
    showStopButton,
    stopAction,
    stopLabel: stopAction === "reply"
      ? "Stop reply"
      : stopAction === "delegated_task"
        ? "Stop delegated task"
        : stopAction === "read_aloud"
          ? "Stop reading aloud"
          : null,
  };
}

/**
 * The card says one thing: this message is waiting its turn. It has to go the
 * moment that stops being true.
 *
 * Measured on the R2 device build on 2026-08-22: the queued follow-up was
 * promoted and picked up as the reply on screen at 1787403652405, and the card
 * still said "Follow-up queued" until 1787403658461 — 6.06 s of a card that
 * described a queue the message had already left, with the answer arriving at
 * 1787403660928.
 *
 * Once the message is the reply being shown, the live reply indicator and the
 * composer's stop control own it. Once its run is done, there is nothing left
 * to wait for. A cancelled or failed follow-up keeps its card, because that one
 * still owes the customer a word and a way to put it away.
 */
export function mobileQueuedFollowUpNoticeVisible(input: {
  activeRunId: string | null;
  answerInTranscript?: boolean;
  queued: { runId: string | null; status: MobileQueuedFollowUpStatus };
  runStatus: ChatRunStatus | null;
}) {
  const { runId, status } = input.queued;
  if (status === "cancelling" || status === "cancelled" || status === "failed") return true;
  if (runId && runId === input.activeRunId) return false;
  // HPD-386: the card used to wait for the run's terminal status, which the
  // customer never sees. Measured from his session on 2026-08-22: the answer to
  // the queued question stood in the transcript at 10:52:21Z while the card
  // still said the question was waiting in line. The answer arriving is the
  // moment the waiting ended, so that is what the card follows.
  if (runId && input.answerInTranscript) return false;
  if (runId && input.runStatus === "completed") return false;
  return true;
}

export function mobileQueuedFollowUpNoticeActionState(
  status: MobileQueuedFollowUpStatus,
): MobileQueuedFollowUpNoticeActionState {
  const terminal = status === "cancelled" || status === "failed";
  return {
    cancelDisabled: status === "queueing" || status === "cancelling",
    showCancel: !terminal,
    showDismiss: terminal,
  };
}

export function mobileMessagesAfterPreStartFollowUpCancel<T extends { id: string }>(
  messages: T[],
  optimisticMessageId: string | null,
) {
  if (!optimisticMessageId) return messages;
  return messages.filter((message) => message.id !== optimisticMessageId);
}

export function mobileMessagesWithoutRun<T extends { runId?: string | null }>(
  messages: T[],
  runId: string | null,
) {
  if (!runId) return messages;
  return messages.filter((message) => message.runId !== runId);
}

export function mobileQueuedFollowUpHasStarted(status: MobileQueuedFollowUpStatus) {
  return status !== "queueing" && status !== "queued";
}

export function mobileQueuedFollowUpTerminalStatus(
  ownedRunId: string | null | undefined,
  observedRunId: string,
  observedStatus: ChatRunStatus,
): "completed" | "failed" | "cancelled" | null {
  if (!ownedRunId || ownedRunId !== observedRunId) return null;
  if (observedStatus === "completed" || observedStatus === "failed" || observedStatus === "cancelled") {
    return observedStatus;
  }
  return null;
}

export async function reconcileMobileQueuedFollowUpTerminalState(
  ownedRunId: string | null | undefined,
  readRun: (runId: string) => Promise<{ id: string; status: ChatRunStatus }>,
): Promise<{ runId: string; status: "completed" | "failed" | "cancelled" } | null> {
  if (!ownedRunId) return null;
  const run = await readRun(ownedRunId);
  const status = mobileQueuedFollowUpTerminalStatus(ownedRunId, run.id, run.status);
  return status ? { runId: run.id, status } : null;
}

export function mobileQueuedFollowUpBlocksComposer(
  status: MobileQueuedFollowUpStatus | null | undefined,
) {
  return status === "queueing" || status === "queued" || status === "running" || status === "cancelling";
}

export function voiceNoticeAfterSend(source: MobileMessageSource, result: MobileSendResult) {
  if (source !== "voice" || result !== "failed") return null;
  return "Voice note was not sent.";
}
