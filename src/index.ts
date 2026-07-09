export type SharedHomechatRunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_for_approval"
  | "completed"
  | "cancelled"
  | "failed";

export type SharedHomechatMessage<Role extends string = "user" | "assistant" | "system" | "tool"> = {
  content: string;
  role: Role;
};

export type SharedHomechatRun = {
  completedAt?: string | null;
  createdAt?: string | null;
  errorCode?: string | null;
  startedAt?: string | null;
  status: SharedHomechatRunStatus;
};

export type SharedHomechatRunEvent = {
  createdAt?: string;
  id?: string;
  payload: unknown;
  runId?: string;
  type: string;
};

export type SharedHomechatActionPhase =
  | "idle"
  | "sending"
  | "queued"
  | "working"
  | "replying"
  | "long"
  | "done"
  | "error"
  | "stopped";

export type SharedHomechatActionView = {
  label: string;
  detail: string;
  elapsed: string;
  phase: SharedHomechatActionPhase;
};

export type SharedHomechatActionCopy = Partial<{
  checkingContext: string;
  checkingContextDetail: string;
  finishing: string;
  finishingDetail: string;
  queued: string;
  queuedDetail: string;
  sendingMessage: string;
  sendingMessageDetail: string;
  waitingForApproval: string;
  waitingForApprovalDetail: string;
  working: string;
  workingDetail: string;
  writing: string;
  writingDetail: string;
}>;

export type SharedHomechatComposerCopy = Partial<{
  pleaseWaitForReply: string;
  queueFollowUp: string;
  record: string;
  recordingSendTitle: string;
  sendMessage: string;
  stop: string;
  transcribing: string;
  waitingHint: string;
}>;

export type SharedHomechatComposerView = {
  canQueueFollowUp: boolean;
  canSendText: boolean;
  canSubmitVoiceRecording: boolean;
  canUseSendButton: boolean;
  inputDisabled: boolean;
  sendButtonTitle: string;
  voiceButtonDisabled: boolean;
  voiceButtonTitle: string;
  voiceMeterActive: boolean;
};

const activeRunStatuses = new Set<SharedHomechatRunStatus>([
  "queued",
  "running",
  "waiting",
  "waiting_for_approval",
]);

export function isActiveHomechatRunStatus(
  status: SharedHomechatRunStatus | null | undefined,
): boolean {
  return Boolean(status && activeRunStatuses.has(status));
}

export function userVisibleHomechatMessages<T extends SharedHomechatMessage>(messages: T[]): T[] {
  return messages.filter(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      message.content.trim().length > 0,
  );
}

export function financeHomechatStatusLabel(run: SharedHomechatRun | null): string {
  if (!run) return "Ready";
  if (run.status === "failed" && run.errorCode === "runtime_not_configured") {
    return "Runtime setup needed";
  }
  if (run.status === "queued") return "Waiting";
  if (run.status === "running" || run.status === "waiting" || run.status === "waiting_for_approval") {
    return "Working";
  }
  if (run.status === "completed") return "Ready";
  if (run.status === "failed") return "Needs attention";
  if (run.status === "cancelled") return "Stopped";
  return "Ready";
}

export function heyHomechatRunStatusLabel(
  status: string | null | undefined,
): string {
  if (status === "queued") return "Waiting for Hermes...";
  if (status === "running") return "Hermes is thinking...";
  if (status === "waiting" || status === "waiting_for_approval") return "Hermes needs a moment...";
  if (status === "completed") return "Reply ready.";
  if (status === "cancelled") return "That message was stopped.";
  if (status === "failed") return "That message did not go through.";
  return "Hermes is working...";
}

export function financeHomechatRunStatusLabel(
  status: SharedHomechatRunStatus | null | undefined,
): string {
  if (!status) return "Ready";
  if (status === "waiting_for_approval") return "Hermes needs a moment...";
  return financeHomechatStatusLabel({ status });
}

export function sharedHomechatActionView(args: {
  copy?: SharedHomechatActionCopy;
  hasAssistantDraft?: boolean;
  replying?: boolean;
  startedAt: string | number | null | undefined;
  status: SharedHomechatRunStatus | string | null | undefined;
  tick?: number;
}): SharedHomechatActionView | null {
  const {
    copy = {},
    hasAssistantDraft = false,
    replying = false,
    startedAt,
    status,
  } = args;
  void args.tick;

  if (!status) return null;

  const elapsedSeconds = secondsSince(startedAt);
  const elapsed = formatHomechatElapsedSeconds(elapsedSeconds);

  if (status === "completed") {
    return {
      label: "Reply ready",
      detail: "Hermes added the answer to this chat.",
      elapsed,
      phase: "done",
    };
  }
  if (status === "failed") {
    return {
      label: "Reply needs attention",
      detail: "Hermes could not finish that reply.",
      elapsed,
      phase: "error",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Stopped",
      detail: "This reply was stopped.",
      elapsed,
      phase: "stopped",
    };
  }
  if (replying || hasAssistantDraft) {
    return {
      label: copy.writing ?? "Writing",
      detail: copy.writingDetail ?? "Hermes is adding the answer to this chat.",
      elapsed,
      phase: "replying",
    };
  }
  if (status === "queued") {
    return {
      label: copy.queued ?? "Queued",
      detail: copy.queuedDetail ?? "Hermes has the message and is waiting for the private runtime.",
      elapsed,
      phase: "queued",
    };
  }
  if (status === "waiting_for_approval" || status === "waiting") {
    return {
      label: copy.waitingForApproval ?? "Waiting",
      detail: copy.waitingForApprovalDetail ?? "Hermes paused until the runtime returns the next safe step.",
      elapsed,
      phase: "working",
    };
  }
  if (elapsedSeconds < 3) {
    return {
      label: copy.sendingMessage ?? "Sending message",
      detail: copy.sendingMessageDetail ?? "Opening the conversation with Hermes.",
      elapsed,
      phase: "sending",
    };
  }
  if (elapsedSeconds < 12) {
    return {
      label: copy.working ?? "Working",
      detail: copy.workingDetail ?? "Hermes is processing this in your private workspace.",
      elapsed,
      phase: "working",
    };
  }
  if (elapsedSeconds < 30) {
    return {
      label: copy.checkingContext ?? "Checking context",
      detail: copy.checkingContextDetail ?? "Still working; background actions can take a little longer.",
      elapsed,
      phase: "working",
    };
  }
  return {
    label: copy.finishing ?? "Finishing",
    detail: copy.finishingDetail ?? "Waiting for the runtime to return the final answer.",
    elapsed,
    phase: "long",
  };
}

export function streamingTextFromHomechatEvents(events: SharedHomechatRunEvent[]): string {
  return events
    .filter((event) => event.type === "message.delta")
    .map((event) => {
      const payload = event.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "";
      }
      const text = (payload as Record<string, unknown>).text;
      return typeof text === "string" ? text : "";
    })
    .join("")
    .trim();
}

export function voiceNoticeIsError(notice: string | null | undefined): boolean {
  if (!notice) return false;
  const normalized = notice.toLowerCase();
  return (
    normalized.includes("failed") ||
    normalized.includes("could not") ||
    normalized.includes("not configured") ||
    normalized.includes("not support") ||
    normalized.includes("permission")
  );
}

export function homechatComposerView(input: {
  activeRunId?: string | null;
  allowFollowUpQueue?: boolean;
  allowTypingWhileBusy?: boolean;
  busy: boolean;
  copy?: SharedHomechatComposerCopy;
  hasAttachments?: boolean;
  hasText: boolean;
  ready: boolean;
  voiceBusy: boolean;
  voiceRecording: boolean;
}): SharedHomechatComposerView {
  const {
    activeRunId = null,
    allowFollowUpQueue = false,
    allowTypingWhileBusy = true,
    busy,
    copy = {},
    hasAttachments = false,
    hasText,
    ready,
    voiceBusy,
    voiceRecording,
  } = input;
  const canQueueFollowUp = Boolean(allowFollowUpQueue && busy && activeRunId);
  const blockedByBusy = busy && !canQueueFollowUp;
  const canSendText = ready && !voiceRecording && (hasText || hasAttachments) && !blockedByBusy;
  const canSubmitVoiceRecording = ready && voiceRecording && !blockedByBusy;
  const canUseSendButton = voiceRecording ? canSubmitVoiceRecording : canSendText;
  const voiceButtonDisabled = !ready || (!voiceRecording && (voiceBusy || (!allowFollowUpQueue && busy)));
  const inputDisabled = !ready || voiceRecording || (!allowTypingWhileBusy && busy);

  const sendButtonTitle = !ready
    ? copy.waitingHint ?? "Sign in to send a message."
    : voiceRecording
      ? canQueueFollowUp
        ? copy.queueFollowUp ?? "Queue follow-up"
        : copy.recordingSendTitle ?? copy.transcribing ?? "Transcribing voice note..."
      : busy
        ? canQueueFollowUp && canSendText
          ? copy.queueFollowUp ?? "Queue follow-up"
          : copy.pleaseWaitForReply ?? "Please wait for this reply."
        : copy.sendMessage ?? "Send message";

  const voiceButtonTitle = voiceRecording
    ? copy.stop ?? "Stop"
    : voiceBusy
      ? copy.transcribing ?? "Transcribing voice note..."
      : copy.record ?? "Record";

  return {
    canQueueFollowUp,
    canSendText,
    canSubmitVoiceRecording,
    canUseSendButton,
    inputDisabled,
    sendButtonTitle,
    voiceButtonDisabled,
    voiceButtonTitle,
    voiceMeterActive: voiceRecording || voiceBusy,
  };
}

export function selectVoiceRecordingMimeType(input?: {
  isTypeSupported?: (mimeType: string) => boolean;
  mimeTypes?: readonly string[];
}): string {
  const isTypeSupported =
    input?.isTypeSupported ??
    (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function"
      ? MediaRecorder.isTypeSupported.bind(MediaRecorder)
      : null);
  if (!isTypeSupported) return "";

  const mimeTypes = input?.mimeTypes ?? [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  return mimeTypes.find((mimeType) => isTypeSupported(mimeType)) ?? "";
}

export function formatHomechatElapsedSeconds(seconds: number): string {
  if (seconds <= 0) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function secondsSince(value: string | number | null | undefined): number {
  if (!value) return 0;
  const started = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(started)) return 0;
  return Math.max(1, Math.floor((Date.now() - started) / 1000));
}
