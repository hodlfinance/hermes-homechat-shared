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
  conversationSessionId?: string | null;
  createdAt?: string;
  id?: string;
  role: Role;
  runId?: string;
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

export type SharedHomechatJsonValue =
  | string
  | number
  | boolean
  | null
  | SharedHomechatJsonValue[]
  | { [key: string]: SharedHomechatJsonValue };

export type SharedHomechatCanonicalEventType =
  | "run.status"
  | "message.delta"
  | "message.completed"
  | "tool.status"
  | "sources.update"
  | "artifact.update"
  | "action.proposal"
  | "usage.update"
  | "error";

export type SharedHomechatEventBase<
  Type extends SharedHomechatCanonicalEventType,
  Payload extends Record<string, SharedHomechatJsonValue>,
> = {
  createdAt?: string;
  id?: string;
  payload: Payload;
  runId?: string;
  type: Type;
};

export type SharedHomechatRunStatusEvent = SharedHomechatEventBase<
  "run.status",
  Record<string, SharedHomechatJsonValue> & { status: SharedHomechatRunStatus }
>;

export type SharedHomechatMessageDeltaEvent = SharedHomechatEventBase<
  "message.delta",
  Record<string, SharedHomechatJsonValue> & { text: string }
>;

export type SharedHomechatMessageCompletedEvent = SharedHomechatEventBase<
  "message.completed",
  Record<string, SharedHomechatJsonValue> & { messageId: string; text: string }
>;

export type SharedHomechatToolStatusEvent = SharedHomechatEventBase<
  "tool.status",
  Record<string, SharedHomechatJsonValue>
>;

export type SharedHomechatSourcesUpdateEvent = SharedHomechatEventBase<
  "sources.update",
  Record<string, SharedHomechatJsonValue> & { sources: SharedHomechatJsonValue[] }
>;

export type SharedHomechatArtifactUpdateEvent = SharedHomechatEventBase<
  "artifact.update",
  Record<string, SharedHomechatJsonValue> & { artifacts: SharedHomechatJsonValue[] }
>;

export type SharedHomechatActionProposalEvent = SharedHomechatEventBase<
  "action.proposal",
  Record<string, SharedHomechatJsonValue> & { actions: SharedHomechatJsonValue[] }
>;

export type SharedHomechatUsageUpdateEvent = SharedHomechatEventBase<
  "usage.update",
  Record<string, SharedHomechatJsonValue>
>;

export type SharedHomechatErrorEvent = SharedHomechatEventBase<
  "error",
  Record<string, SharedHomechatJsonValue> & { message: string }
>;

export type SharedHomechatCanonicalEvent =
  | SharedHomechatRunStatusEvent
  | SharedHomechatMessageDeltaEvent
  | SharedHomechatMessageCompletedEvent
  | SharedHomechatToolStatusEvent
  | SharedHomechatSourcesUpdateEvent
  | SharedHomechatArtifactUpdateEvent
  | SharedHomechatActionProposalEvent
  | SharedHomechatUsageUpdateEvent
  | SharedHomechatErrorEvent;

export type SharedHomechatLegacyEvent = {
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  runId: string;
  type: "status" | "message_delta" | "message_completed" | "usage" | "error";
};

export type SharedHomechatSource<Payload = unknown> = {
  detail?: string;
  href?: string;
  id: string;
  kind: string;
  label: string;
  payload?: Payload;
};

export type SharedHomechatArtifact<Payload = unknown> = {
  id: string;
  kind: string;
  payload?: Payload;
  status?: string;
  summary?: string;
  title: string;
};

export type SharedHomechatProductAction<Payload = unknown> = {
  id: string;
  kind: string;
  label: string;
  payload?: Payload;
  status?: "proposed" | "running" | "completed" | "cancelled" | "failed" | (string & {});
};

export type SharedHomechatProductSlots<
  Source = SharedHomechatSource,
  Artifact = SharedHomechatArtifact,
  Action = SharedHomechatProductAction,
> = {
  actions?: readonly Action[];
  artifacts?: readonly Artifact[];
  sources?: readonly Source[];
};

export type SharedHomechatProductRenderers<
  Rendered,
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  Source = SharedHomechatSource,
  Artifact = SharedHomechatArtifact,
  Action = SharedHomechatProductAction,
> = {
  action?: (action: Action, message: Message) => Rendered;
  actions?: (actions: readonly Action[], message: Message) => Rendered;
  artifact?: (artifact: Artifact, message: Message) => Rendered;
  artifacts?: (artifacts: readonly Artifact[], message: Message) => Rendered;
  message: (message: Message, index: number) => Rendered;
  source?: (source: Source, message: Message) => Rendered;
  sources?: (sources: readonly Source[], message: Message) => Rendered;
};

export type SharedHomechatClientPhase =
  | "idle"
  | "sending"
  | "waiting"
  | "streaming"
  | "stopping"
  | "reconnecting"
  | "completed"
  | "stopped"
  | "error";

export type SharedHomechatClientState<Message extends SharedHomechatMessage = SharedHomechatMessage> = {
  error: string | null;
  events: SharedHomechatCanonicalEvent[];
  messages: Message[];
  phase: SharedHomechatClientPhase;
  runId: string | null;
  startedAt: number | null;
  status: SharedHomechatRunStatus | null;
  streamingText: string;
};

export type SharedHomechatClientAction<Message extends SharedHomechatMessage = SharedHomechatMessage> =
  | { type: "reset"; messages?: Message[] }
  | { type: "run.started"; runId: string; startedAt?: number; status?: SharedHomechatRunStatus | string }
  | { type: "run.reconnecting"; runId: string; startedAt?: number }
  | { type: "run.stopping" }
  | {
      type: "run.snapshot";
      run: {
        events?: readonly unknown[];
        id: string;
        messages?: readonly Message[];
        status: SharedHomechatRunStatus | string;
      };
    }
  | { type: "run.event"; event: unknown }
  | { type: "run.error"; error: string };

export type SharedHomechatRunSnapshot<
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  Event = SharedHomechatRunEvent,
> = {
  events?: readonly Event[];
  id: string;
  messages?: readonly Message[];
  status: SharedHomechatRunStatus | string;
};

export type SharedHomechatRunControllerPhase = "waiting" | "stopping" | "reconnecting";

export type SharedHomechatRunControllerCopy = Partial<{
  aborted: string;
  cancelled: string;
  failed: string;
  timeout: string;
}>;

export type SharedHomechatRunWaitOptions<Run> = {
  copy?: SharedHomechatRunControllerCopy;
  intervalMs?: number;
  onPhase?: (phase: SharedHomechatRunControllerPhase) => void;
  onSnapshot?: (run: Run) => void | Promise<void>;
  signal?: AbortSignal;
  startedAt?: number;
  timeoutMs?: number;
};

export type SharedHomechatTransportContext = {
  signal?: AbortSignal;
};

export type SharedHomechatStreamContext = SharedHomechatTransportContext & {
  cursor?: string | null;
  onCursor?: (cursor: string) => void;
  onEvent: (event: unknown) => void | Promise<void>;
};

export type SharedHomechatStreamResult = {
  cursor?: string | null;
  terminal?: boolean;
};

export type SharedHomechatRunTransport<Run extends SharedHomechatRunSnapshot> = {
  getRun: (runId: string, context: SharedHomechatTransportContext) => Promise<Run>;
  stopRun?: (runId: string, context: SharedHomechatTransportContext) => Promise<Run | void>;
  streamRun?: (runId: string, context: SharedHomechatStreamContext) => Promise<SharedHomechatStreamResult | void>;
};

export type SharedHomechatStreamOptions = {
  cursor?: string | null;
  maxReconnectAttempts?: number;
  onCursor?: (cursor: string) => void;
  onEvent?: (event: SharedHomechatCanonicalEvent) => void | Promise<void>;
  onReconnect?: (attempt: number, cursor: string | null, error?: unknown) => void | Promise<void>;
  reconnectDelayMs?: number;
  signal?: AbortSignal;
};

export type SharedHomechatHistoryKind = "conversation" | "job" | (string & {});

export type SharedHomechatHistoryItem<Metadata = unknown> = {
  id: string;
  kind: SharedHomechatHistoryKind;
  metadata?: Metadata;
  summary?: string;
  title: string;
  updatedAt: string;
};

export type SharedHomechatHistoryPage<Item extends SharedHomechatHistoryItem = SharedHomechatHistoryItem> = {
  cursor: string | null;
  items: Item[];
};

export type SharedHomechatHistoryRequest = SharedHomechatTransportContext & {
  cursor?: string | null;
  kind?: SharedHomechatHistoryKind;
  limit?: number;
};

export type SharedHomechatHistoryTransport<Item extends SharedHomechatHistoryItem = SharedHomechatHistoryItem> = {
  listHistory: (request: SharedHomechatHistoryRequest) => Promise<SharedHomechatHistoryPage<Item>>;
};

export type SharedHomechatHistoryState<Item extends SharedHomechatHistoryItem = SharedHomechatHistoryItem> = {
  cursor: string | null;
  error: string | null;
  items: Item[];
  phase: "idle" | "loading" | "ready" | "error";
};

export type SharedHomechatJobStatus =
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "cancelled"
  | "failed";

export type SharedHomechatJob = {
  id: string;
  status: SharedHomechatJobStatus | string;
};

export type SharedHomechatJobTransport<Job extends SharedHomechatJob = SharedHomechatJob> = {
  cancelJob?: (jobId: string, context: SharedHomechatTransportContext) => Promise<Job | void>;
  getJob: (jobId: string, context: SharedHomechatTransportContext) => Promise<Job>;
};

export type SharedHomechatComposerIntent = "none" | "send" | "queue_follow_up" | "transcribe_voice";

export type SharedHomechatComposerController = {
  canStopRun: boolean;
  intent: SharedHomechatComposerIntent;
  view: SharedHomechatComposerView;
};

export type SharedHomechatVoiceRecording<Recording> = {
  mimeType?: string;
  recording: Recording;
};

export type SharedHomechatVoiceControllerErrorCode =
  | "permission_denied"
  | "not_recording"
  | "empty_recording"
  | "empty_transcript";

export class SharedHomechatVoiceControllerError extends Error {
  readonly code: SharedHomechatVoiceControllerErrorCode;

  constructor(code: SharedHomechatVoiceControllerErrorCode, message: string) {
    super(message);
    this.name = "SharedHomechatVoiceControllerError";
    this.code = code;
  }
}

export type SharedHomechatRunControllerErrorCode =
  | "aborted"
  | "cancelled"
  | "failed"
  | "stream_disconnected"
  | "timeout";

export class SharedHomechatRunControllerError<Run = unknown> extends Error {
  readonly code: SharedHomechatRunControllerErrorCode;
  readonly run?: Run;

  constructor(code: SharedHomechatRunControllerErrorCode, message: string, run?: Run) {
    super(message);
    this.name = "SharedHomechatRunControllerError";
    this.code = code;
    this.run = run;
  }
}

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

export type SharedHomechatStatusCopy = Partial<{
  cancelled: string;
  completed: string;
  failed: string;
  idle: string;
  queued: string;
  running: string;
  runtimeNotConfigured: string;
  unknown: string;
  waiting: string;
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

function homechatRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function homechatText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function homechatStreamingValue(value: unknown): string | null {
  return typeof value === "string" && value.length ? value : null;
}

function homechatJsonValue(value: unknown): SharedHomechatJsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value as SharedHomechatJsonValue;
  }
  if (Array.isArray(value)) {
    return value.map(homechatJsonValue).filter((item): item is SharedHomechatJsonValue => item !== undefined);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const normalized = homechatJsonValue(item);
        return normalized === undefined ? [] : [[key, normalized]];
      }),
    );
  }
  return undefined;
}

function homechatJsonRecord(value: unknown): Record<string, SharedHomechatJsonValue> {
  const normalized = homechatJsonValue(homechatRecord(value));
  return normalized && !Array.isArray(normalized) && typeof normalized === "object"
    ? normalized as Record<string, SharedHomechatJsonValue>
    : {};
}

export function normalizeHomechatRunStatus(value: unknown): SharedHomechatRunStatus | null {
  if (
    value === "queued" ||
    value === "running" ||
    value === "waiting" ||
    value === "waiting_for_approval" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "failed"
  ) {
    return value;
  }
  if (value === "canceled") return "cancelled";
  return null;
}

export function normalizeHomechatRunEvent(input: unknown): SharedHomechatCanonicalEvent | null {
  const raw = homechatRecord(input);
  const rawPayload = homechatRecord(raw.payload);
  const rawType = homechatText(raw.type) ?? homechatText(raw.event);
  if (!rawType) return null;

  const typeAliases: Record<string, SharedHomechatCanonicalEventType> = {
    status: "run.status",
    message_delta: "message.delta",
    message_completed: "message.completed",
    usage: "usage.update",
  };
  const canonicalTypes = new Set<SharedHomechatCanonicalEventType>([
    "run.status",
    "message.delta",
    "message.completed",
    "tool.status",
    "sources.update",
    "artifact.update",
    "action.proposal",
    "usage.update",
    "error",
  ]);
  const aliasedType = typeAliases[rawType];
  const type = aliasedType ?? (canonicalTypes.has(rawType as SharedHomechatCanonicalEventType)
    ? rawType as SharedHomechatCanonicalEventType
    : null);
  if (!type) return null;

  const id = homechatText(raw.id) ?? undefined;
  const runId = homechatText(raw.runId) ?? homechatText(raw.run_id) ?? undefined;
  const createdAt = homechatText(raw.createdAt) ?? homechatText(raw.created_at) ?? undefined;
  const payload = homechatJsonRecord(rawPayload);

  if (type === "run.status") {
    const status = normalizeHomechatRunStatus(raw.status ?? raw.state ?? rawPayload.status ?? rawPayload.state) ?? "running";
    payload.status = status;
  }
  if (type === "message.delta") {
    payload.text = homechatStreamingValue(rawPayload.delta) ?? homechatStreamingValue(rawPayload.text) ?? homechatStreamingValue(rawPayload.content) ?? homechatStreamingValue(raw.text) ?? "";
  }
  if (type === "message.completed") {
    payload.text = homechatStreamingValue(rawPayload.content) ?? homechatStreamingValue(rawPayload.text) ?? homechatStreamingValue(raw.text) ?? "";
    payload.messageId = homechatText(rawPayload.messageId) ?? homechatText(rawPayload.message_id) ?? homechatText(raw.messageId) ?? "";
  }

  if (type === "sources.update") {
    payload.sources = Array.isArray(rawPayload.sources) ? homechatJsonValue(rawPayload.sources) ?? [] : [];
  }
  if (type === "artifact.update") {
    payload.artifacts = Array.isArray(rawPayload.artifacts) ? homechatJsonValue(rawPayload.artifacts) ?? [] : [];
  }
  if (type === "action.proposal") {
    const actions = Array.isArray(rawPayload.actions)
      ? rawPayload.actions
      : rawPayload.action
        ? [rawPayload.action]
        : [];
    payload.actions = homechatJsonValue(actions) ?? [];
  }
  if (type === "error") {
    payload.message = homechatText(rawPayload.message) ?? homechatText(rawPayload.error) ?? homechatText(raw.message) ?? "";
  }

  return { id, runId, type, payload, createdAt } as SharedHomechatCanonicalEvent;
}

export function legacyHomechatRunEvent(input: unknown): SharedHomechatLegacyEvent | null {
  const raw = homechatRecord(input);
  const event = normalizeHomechatRunEvent(raw);
  if (!event) return null;

  const id = event.id ?? `${event.runId ?? "run"}:${event.type}:${event.createdAt ?? ""}`;
  const runId = event.runId ?? homechatText(raw.runId) ?? "";
  const createdAt = event.createdAt ?? new Date(0).toISOString();
  const payload: Record<string, unknown> = { ...event.payload };

  if (event.type === "run.status") {
    const status = normalizeHomechatRunStatus(payload.status) ?? "running";
    return {
      id,
      runId,
      type: "status",
      payload: { ...payload, status: status === "waiting" ? "waiting_for_approval" : status },
      createdAt,
    };
  }
  if (event.type === "message.delta") {
    return { id, runId, type: "message_delta", payload: { ...payload, delta: payload.text ?? "" }, createdAt };
  }
  if (event.type === "message.completed") {
    return { id, runId, type: "message_completed", payload: { ...payload, content: payload.text ?? "" }, createdAt };
  }
  if (event.type === "usage.update") return { id, runId, type: "usage", payload, createdAt };
  if (event.type === "error") return { id, runId, type: "error", payload, createdAt };
  return null;
}

export function parseHomechatEventStream(value: string): { events: SharedHomechatCanonicalEvent[]; ignored: number } {
  const events: SharedHomechatCanonicalEvent[] = [];
  let ignored = 0;

  for (const block of value.split("\n\n")) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""))
      .join("\n");
    if (!data) continue;
    try {
      const event = normalizeHomechatRunEvent(JSON.parse(data));
      if (event) events.push(event);
      else ignored += 1;
    } catch {
      ignored += 1;
    }
  }
  return { events, ignored };
}

export function isActiveHomechatRunStatus(
  status: SharedHomechatRunStatus | null | undefined,
): boolean {
  return Boolean(status && activeRunStatuses.has(status));
}

export function userVisibleHomechatMessages<T extends SharedHomechatMessage>(messages: T[]): T[] {
  return homechatTranscriptMessages(messages);
}

export function homechatTranscriptMessages<T extends SharedHomechatMessage>(
  messages: readonly T[],
  options: {
    conversationSessionId?: string | null;
    includeEmpty?: boolean;
    roles?: readonly string[];
  } = {},
): T[] {
  const roles = new Set(options.roles ?? ["user", "assistant"]);
  const byId = new Map<string, number>();
  const transcript: T[] = [];

  for (const message of messages) {
    if (!roles.has(message.role)) continue;
    if (!options.includeEmpty && !message.content.trim()) continue;
    if (options.conversationSessionId && message.conversationSessionId !== options.conversationSessionId) continue;

    const id = message.id?.trim();
    if (id && byId.has(id)) {
      transcript[byId.get(id)!] = message;
      continue;
    }
    if (id) byId.set(id, transcript.length);
    transcript.push(message);
  }

  return transcript;
}

export function mergeHomechatMessages<T extends SharedHomechatMessage>(current: readonly T[], incoming: readonly T[]): T[] {
  const merged = [...current];
  const indexById = new Map(
    merged.flatMap((message, index) => message.id ? [[message.id, index] as const] : []),
  );

  for (const message of incoming) {
    const index = message.id ? indexById.get(message.id) : undefined;
    if (index !== undefined) {
      merged[index] = message;
      continue;
    }
    if (message.id) indexById.set(message.id, merged.length);
    merged.push(message);
  }
  return merged;
}

export function latestHomechatMessage<T extends SharedHomechatMessage>(
  messages: readonly T[],
  role?: string,
): T | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message && (!role || message.role === role)) return message;
  }
  return null;
}

export function homechatStatusLabel(
  run: SharedHomechatRun | null,
  copy: SharedHomechatStatusCopy = {},
): string {
  if (!run) return copy.idle ?? "Ready";
  if (run.status === "failed" && run.errorCode === "runtime_not_configured") {
    return copy.runtimeNotConfigured ?? "Runtime setup needed";
  }
  if (run.status === "queued") return copy.queued ?? "Waiting";
  if (run.status === "running" || run.status === "waiting" || run.status === "waiting_for_approval") {
    return copy.running ?? "Working";
  }
  if (run.status === "completed") return copy.completed ?? "Ready";
  if (run.status === "failed") return copy.failed ?? "Needs attention";
  if (run.status === "cancelled") return copy.cancelled ?? "Stopped";
  return copy.unknown ?? copy.idle ?? "Ready";
}

export function homechatRunStatusLabel(
  status: string | null | undefined,
  copy: SharedHomechatStatusCopy = {},
): string {
  if (status === "queued") return copy.queued ?? "Waiting for the assistant...";
  if (status === "running") return copy.running ?? "The assistant is thinking...";
  if (status === "waiting" || status === "waiting_for_approval") return copy.waiting ?? "The assistant needs a moment...";
  if (status === "completed") return copy.completed ?? "Reply ready.";
  if (status === "cancelled") return copy.cancelled ?? "That message was stopped.";
  if (status === "failed") return copy.failed ?? "That message did not go through.";
  return copy.unknown ?? "The assistant is working...";
}

/** @deprecated Use homechatStatusLabel with product-owned copy. */
export function financeHomechatStatusLabel(run: SharedHomechatRun | null): string {
  return homechatStatusLabel(run);
}

/** @deprecated Use homechatRunStatusLabel with product-owned copy. */
export function heyHomechatRunStatusLabel(status: string | null | undefined): string {
  return homechatRunStatusLabel(status, {
    queued: "Waiting for Hermes...",
    running: "Hermes is thinking...",
    waiting: "Hermes needs a moment...",
    unknown: "Hermes is working...",
  });
}

/** @deprecated Use homechatRunStatusLabel with product-owned copy. */
export function financeHomechatRunStatusLabel(
  status: SharedHomechatRunStatus | null | undefined,
): string {
  if (!status) return "Ready";
  if (status === "waiting_for_approval") return "Hermes needs a moment...";
  return homechatStatusLabel({ status });
}

export function homechatActionView(args: {
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
      detail: "The assistant added the answer to this chat.",
      elapsed,
      phase: "done",
    };
  }
  if (status === "failed") {
    return {
      label: "Reply needs attention",
      detail: "The assistant could not finish that reply.",
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
      detail: copy.writingDetail ?? "The assistant is adding the answer to this chat.",
      elapsed,
      phase: "replying",
    };
  }
  if (status === "queued") {
    return {
      label: copy.queued ?? "Queued",
      detail: copy.queuedDetail ?? "The assistant has the message and is waiting for the runtime.",
      elapsed,
      phase: "queued",
    };
  }
  if (status === "waiting_for_approval" || status === "waiting") {
    return {
      label: copy.waitingForApproval ?? "Waiting",
      detail: copy.waitingForApprovalDetail ?? "The assistant paused until the runtime returns the next step.",
      elapsed,
      phase: "working",
    };
  }
  if (elapsedSeconds < 3) {
    return {
      label: copy.sendingMessage ?? "Sending message",
      detail: copy.sendingMessageDetail ?? "Opening the conversation with the assistant.",
      elapsed,
      phase: "sending",
    };
  }
  if (elapsedSeconds < 12) {
    return {
      label: copy.working ?? "Working",
      detail: copy.workingDetail ?? "The assistant is processing this in the workspace.",
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

/** @deprecated Use homechatActionView. */
export const sharedHomechatActionView = homechatActionView;

export function nextHomechatStreamingText(
  current: string,
  payload: Record<string, unknown>,
  replaceDelta = false,
): string {
  const incoming = homechatStreamingValue(payload.delta) ?? homechatStreamingValue(payload.text) ?? homechatStreamingValue(payload.content) ?? "";
  if (!incoming) return stripHomechatStreamingCursor(current);
  const cleanCurrent = stripHomechatStreamingCursor(current);
  const cleanIncoming = stripHomechatStreamingCursor(incoming);
  if (replaceDelta) return cleanIncoming;
  return mergeHomechatStreamingText(cleanCurrent, cleanIncoming);
}

export function streamingTextFromHomechatEvents(events: readonly unknown[]): string {
  return events.reduce<string>((draft, input) => {
    const event = normalizeHomechatRunEvent(input);
    if (event?.type !== "message.delta") return draft;
    const replace = event.payload.replace === true;
    return nextHomechatStreamingText(draft, event.payload, replace);
  }, "");
}

export function homechatStreamingTextFromPayloads(payloads: readonly Record<string, unknown>[]): string {
  return payloads.reduce((draft, payload) => nextHomechatStreamingText(draft, payload), "");
}

export function reconcileHomechatFinalAnswer(finalAnswer: string, streamedDraft: string): string {
  const cleanFinal = stripHomechatStreamingCursor(finalAnswer);
  const cleanDraft = stripHomechatStreamingCursor(streamedDraft);
  if (!cleanDraft) return cleanFinal;
  if (!cleanFinal) return cleanDraft;
  if (cleanFinal === cleanDraft || cleanFinal.startsWith(cleanDraft)) return cleanFinal;
  if (cleanDraft.includes(cleanFinal) || cleanDraft.endsWith(cleanFinal)) return cleanDraft;
  const merged = mergeHomechatStreamingText(cleanDraft, cleanFinal);
  if (merged.length > cleanFinal.length && merged.startsWith(cleanDraft.slice(0, Math.min(cleanDraft.length, 80)))) {
    return merged;
  }
  return cleanDraft.length > cleanFinal.length ? cleanDraft : cleanFinal;
}

function stripHomechatStreamingCursor(value: string): string {
  return value.replace(/\s*▉/g, "");
}

function mergeHomechatStreamingText(current: string, incoming: string): string {
  if (!incoming || incoming === current) return current;
  if (!current || incoming.startsWith(current)) return incoming;
  if (current.includes(incoming) || current.endsWith(incoming)) return current;
  const max = Math.min(current.length, incoming.length);
  for (let length = max; length > 0; length -= 1) {
    if (current.endsWith(incoming.slice(0, length))) return `${current}${incoming.slice(length)}`;
  }
  for (let length = incoming.length; length >= 12; length -= 1) {
    const index = current.lastIndexOf(incoming.slice(0, length));
    if (index >= 0) return `${current.slice(0, index)}${incoming}`;
  }
  return `${current}${incoming}`;
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

export function createHomechatComposerController(
  input: Parameters<typeof homechatComposerView>[0],
): SharedHomechatComposerController {
  const view = homechatComposerView(input);
  const intent: SharedHomechatComposerIntent = !view.canUseSendButton
    ? "none"
    : input.voiceRecording
      ? "transcribe_voice"
      : view.canQueueFollowUp && input.busy
        ? "queue_follow_up"
        : "send";
  return {
    canStopRun: Boolean(input.activeRunId && input.busy),
    intent,
    view,
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

export function createHomechatClientState<Message extends SharedHomechatMessage>(
  messages: readonly Message[] = [],
): SharedHomechatClientState<Message> {
  return {
    error: null,
    events: [],
    messages: [...messages],
    phase: "idle",
    runId: null,
    startedAt: null,
    status: null,
    streamingText: "",
  };
}

export function reduceHomechatClientState<Message extends SharedHomechatMessage>(
  state: SharedHomechatClientState<Message>,
  action: SharedHomechatClientAction<Message>,
): SharedHomechatClientState<Message> {
  if (action.type === "reset") return createHomechatClientState(action.messages ?? state.messages);
  if (action.type === "run.started") {
    const status = normalizeHomechatRunStatus(action.status) ?? "queued";
    return {
      ...state,
      error: null,
      events: [],
      phase: homechatClientPhaseForStatus(status),
      runId: action.runId,
      startedAt: action.startedAt ?? Date.now(),
      status,
      streamingText: "",
    };
  }
  if (action.type === "run.reconnecting") {
    return {
      ...state,
      error: null,
      phase: "reconnecting",
      runId: action.runId,
      startedAt: action.startedAt ?? state.startedAt ?? Date.now(),
    };
  }
  if (action.type === "run.stopping") return { ...state, phase: "stopping" };
  if (action.type === "run.error") return { ...state, error: action.error, phase: "error" };
  if (action.type === "run.snapshot") {
    let next: SharedHomechatClientState<Message> = {
      ...state,
      runId: action.run.id,
      messages: mergeHomechatMessages(state.messages, action.run.messages ?? []),
    };
    for (const event of action.run.events ?? []) {
      next = reduceHomechatClientState(next, { type: "run.event", event });
    }
    const status = normalizeHomechatRunStatus(action.run.status) ?? next.status ?? "running";
    const terminal = status === "completed" || status === "cancelled" || status === "failed";
    return {
      ...next,
      error: status === "failed" ? next.error : null,
      phase: homechatClientPhaseForStatus(status),
      status,
      streamingText: terminal ? "" : next.streamingText,
    };
  }

  const event = normalizeHomechatRunEvent(action.event);
  if (!event) return state;
  const eventKey = event.id ?? `${event.runId ?? "run"}:${event.type}:${event.createdAt ?? ""}:${JSON.stringify(event.payload)}`;
  const events = state.events.some((item) =>
    (item.id ?? `${item.runId ?? "run"}:${item.type}:${item.createdAt ?? ""}:${JSON.stringify(item.payload)}`) === eventKey,
  )
    ? state.events
    : [...state.events, event];

  if (event.type === "run.status") {
    return {
      ...state,
      events,
      phase: homechatClientPhaseForStatus(event.payload.status),
      runId: event.runId ?? state.runId,
      status: event.payload.status,
      streamingText: isActiveHomechatRunStatus(event.payload.status) ? state.streamingText : "",
    };
  }
  if (event.type === "message.delta") {
    return {
      ...state,
      events,
      phase: "streaming",
      runId: event.runId ?? state.runId,
      streamingText: nextHomechatStreamingText(state.streamingText, event.payload, event.payload.replace === true),
    };
  }
  if (event.type === "message.completed") {
    return {
      ...state,
      events,
      phase: "streaming",
      runId: event.runId ?? state.runId,
      streamingText: reconcileHomechatFinalAnswer(event.payload.text, state.streamingText),
    };
  }
  if (event.type === "error") {
    return { ...state, events, error: event.payload.message || "The run reported an error.", phase: "error" };
  }
  return { ...state, events, runId: event.runId ?? state.runId };
}

export function homechatClientPhaseForStatus(status: SharedHomechatRunStatus): SharedHomechatClientPhase {
  if (status === "queued" || status === "waiting" || status === "waiting_for_approval") return "waiting";
  if (status === "running") return "waiting";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "stopped";
  return "error";
}

export function isSharedHomechatRunControllerError(
  error: unknown,
  code?: SharedHomechatRunControllerErrorCode,
): error is SharedHomechatRunControllerError {
  return error instanceof SharedHomechatRunControllerError && (!code || error.code === code);
}

export function createHomechatRunController<Run extends SharedHomechatRunSnapshot>(
  transport: SharedHomechatRunTransport<Run>,
  defaults: {
    intervalMs?: number;
    now?: () => number;
    sleep?: (milliseconds: number) => Promise<void>;
    timeoutMs?: number;
  } = {},
) {
  const now = defaults.now ?? Date.now;
  const sleep = defaults.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  async function wait(runId: string, options: SharedHomechatRunWaitOptions<Run> = {}): Promise<Run> {
    const startedAt = options.startedAt ?? now();
    const timeoutMs = options.timeoutMs ?? defaults.timeoutMs ?? 245_000;
    const intervalMs = options.intervalMs ?? defaults.intervalMs ?? 1_600;
    options.onPhase?.("waiting");

    while (now() - startedAt <= timeoutMs) {
      assertHomechatNotAborted(options.signal, options.copy);
      const run = await transport.getRun(runId, { signal: options.signal });
      await options.onSnapshot?.(run);
      const status = normalizeHomechatRunStatus(run.status) ?? "running";
      if (status === "completed") return run;
      if (status === "failed") {
        throw new SharedHomechatRunControllerError("failed", options.copy?.failed ?? "The run could not finish.", run);
      }
      if (status === "cancelled") {
        throw new SharedHomechatRunControllerError("cancelled", options.copy?.cancelled ?? "The run was stopped.", run);
      }
      await homechatControllerDelay(intervalMs, options.signal, sleep, options.copy);
    }

    throw new SharedHomechatRunControllerError("timeout", options.copy?.timeout ?? "The run is taking longer than expected.");
  }

  async function stop(
    runId: string,
    options: Pick<SharedHomechatRunWaitOptions<Run>, "copy" | "onPhase" | "onSnapshot" | "signal"> = {},
  ): Promise<Run | void> {
    if (!transport.stopRun) throw new Error("This transport does not support stopping runs.");
    assertHomechatNotAborted(options.signal, options.copy);
    options.onPhase?.("stopping");
    const run = await transport.stopRun(runId, { signal: options.signal });
    if (run) await options.onSnapshot?.(run);
    return run;
  }

  async function reconnect(runId: string, options: SharedHomechatRunWaitOptions<Run> = {}): Promise<Run> {
    options.onPhase?.("reconnecting");
    return wait(runId, { ...options, onPhase: undefined });
  }

  async function stream(runId: string, options: SharedHomechatStreamOptions = {}): Promise<SharedHomechatStreamResult> {
    if (!transport.streamRun) throw new Error("This transport does not support event streams.");
    const maxReconnectAttempts = options.maxReconnectAttempts ?? 3;
    const reconnectDelayMs = options.reconnectDelayMs ?? defaults.intervalMs ?? 1_600;
    let cursor = options.cursor ?? null;
    let attempt = 0;
    let terminal = false;

    while (attempt <= maxReconnectAttempts) {
      assertHomechatNotAborted(options.signal);
      try {
        const result = await transport.streamRun(runId, {
          cursor,
          signal: options.signal,
          onCursor: (nextCursor) => {
            cursor = nextCursor;
            options.onCursor?.(nextCursor);
          },
          onEvent: async (input) => {
            const event = normalizeHomechatRunEvent(input);
            if (!event) return;
            if (event.id) {
              cursor = event.id;
              options.onCursor?.(event.id);
            }
            if (event.type === "run.status" && !isActiveHomechatRunStatus(event.payload.status)) terminal = true;
            await options.onEvent?.(event);
          },
        });
        if (result?.cursor) {
          cursor = result.cursor;
          options.onCursor?.(result.cursor);
        }
        if (terminal || result?.terminal) return { cursor, terminal: true };
      } catch (error) {
        assertHomechatNotAborted(options.signal);
        if (attempt >= maxReconnectAttempts) throw error;
        attempt += 1;
        await options.onReconnect?.(attempt, cursor, error);
        await homechatControllerDelay(reconnectDelayMs, options.signal, sleep);
        continue;
      }

      if (attempt >= maxReconnectAttempts) break;
      attempt += 1;
      await options.onReconnect?.(attempt, cursor);
      await homechatControllerDelay(reconnectDelayMs, options.signal, sleep);
    }

    throw new SharedHomechatRunControllerError(
      "stream_disconnected",
      "The event stream disconnected before the run finished.",
    );
  }

  return { reconnect, stop, stream, wait };
}

export function createHomechatHistoryState<Item extends SharedHomechatHistoryItem>(
  items: readonly Item[] = [],
): SharedHomechatHistoryState<Item> {
  return { cursor: null, error: null, items: [...items], phase: items.length ? "ready" : "idle" };
}

export function mergeHomechatHistoryItems<Item extends SharedHomechatHistoryItem>(
  current: readonly Item[],
  incoming: readonly Item[],
): Item[] {
  const items = [...current];
  const indexById = new Map(items.map((item, index) => [item.id, index]));
  for (const item of incoming) {
    const index = indexById.get(item.id);
    if (index === undefined) {
      indexById.set(item.id, items.length);
      items.push(item);
    } else {
      items[index] = item;
    }
  }
  return items;
}

export function createHomechatHistoryController<Item extends SharedHomechatHistoryItem>(
  transport: SharedHomechatHistoryTransport<Item>,
) {
  async function load(
    state: SharedHomechatHistoryState<Item>,
    request: SharedHomechatHistoryRequest = {},
  ): Promise<SharedHomechatHistoryState<Item>> {
    try {
      const page = await transport.listHistory(request);
      return {
        cursor: page.cursor,
        error: null,
        items: request.cursor ? mergeHomechatHistoryItems(state.items, page.items) : [...page.items],
        phase: "ready",
      };
    } catch (error) {
      if (request.signal?.aborted) throw error;
      return {
        ...state,
        error: error instanceof Error ? error.message : "History could not be loaded.",
        phase: "error",
      };
    }
  }

  function refresh(state: SharedHomechatHistoryState<Item>, request: Omit<SharedHomechatHistoryRequest, "cursor"> = {}) {
    return load(state, { ...request, cursor: null });
  }

  function loadNext(state: SharedHomechatHistoryState<Item>, request: Omit<SharedHomechatHistoryRequest, "cursor"> = {}) {
    if (!state.cursor) return Promise.resolve(state);
    return load(state, { ...request, cursor: state.cursor });
  }

  return { load, loadNext, refresh };
}

export function createHomechatJobController<Job extends SharedHomechatJob>(
  transport: SharedHomechatJobTransport<Job>,
  defaults: Parameters<typeof createHomechatRunController>[1] = {},
) {
  const controller = createHomechatRunController<Job>(
    {
      getRun: transport.getJob,
      stopRun: transport.cancelJob,
    },
    defaults,
  );
  return {
    cancel: controller.stop,
    reconnect: controller.reconnect,
    wait: controller.wait,
  };
}

export function composeHomechatVoiceMessage(input: {
  draft?: string | null;
  prefix?: string;
  transcript: string;
}): string {
  const draft = input.draft?.trim() ?? "";
  const transcript = input.transcript.trim();
  if (!transcript) return draft;
  const voiceMessage = `${input.prefix ?? "Voice note:"}\n\n${transcript}`;
  return draft ? `${draft}\n\n${voiceMessage}` : voiceMessage;
}

export function homechatVoiceTranscriptError(error: unknown, fallback = "Voice note could not be transcribed."): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : fallback;
  const normalized = message.toLowerCase();
  if (
    normalized.includes("request failed with 502") ||
    normalized.includes("bad gateway") ||
    normalized.includes("transcription could not be created")
  ) {
    return "Voice transcription is temporarily unavailable. Please try again in a moment.";
  }
  return message || fallback;
}

export function createHomechatVoiceController<Recording, Audio>(adapter: {
  discardRecording?: (recording: Recording, context: SharedHomechatTransportContext) => Promise<void>;
  isEmptyRecording?: (audio: Audio) => boolean;
  requestPermission: (context: SharedHomechatTransportContext) => Promise<boolean>;
  startRecording: (context: SharedHomechatTransportContext) => Promise<SharedHomechatVoiceRecording<Recording>>;
  stopRecording: (recording: Recording, context: SharedHomechatTransportContext) => Promise<Audio>;
  transcribe: (audio: Audio, context: SharedHomechatTransportContext & { mimeType?: string }) => Promise<string | { text: string }>;
}) {
  let active: SharedHomechatVoiceRecording<Recording> | null = null;

  async function start(context: SharedHomechatTransportContext = {}) {
    if (active) return active;
    if (!await adapter.requestPermission(context)) {
      throw new SharedHomechatVoiceControllerError("permission_denied", "Microphone permission is required to record a voice note.");
    }
    active = await adapter.startRecording(context);
    return active;
  }

  async function stopAndTranscribe(context: SharedHomechatTransportContext = {}): Promise<string> {
    if (!active) throw new SharedHomechatVoiceControllerError("not_recording", "No voice note is currently recording.");
    const current = active;
    active = null;
    const audio = await adapter.stopRecording(current.recording, context);
    if (adapter.isEmptyRecording?.(audio)) {
      throw new SharedHomechatVoiceControllerError("empty_recording", "No voice note audio was recorded.");
    }
    const result = await adapter.transcribe(audio, { ...context, mimeType: current.mimeType });
    const transcript = (typeof result === "string" ? result : result.text).trim();
    if (!transcript) throw new SharedHomechatVoiceControllerError("empty_transcript", "No speech was detected.");
    return transcript;
  }

  async function cancel(context: SharedHomechatTransportContext = {}) {
    if (!active) return;
    const current = active;
    active = null;
    await adapter.discardRecording?.(current.recording, context);
  }

  return {
    cancel,
    isRecording: () => Boolean(active),
    start,
    stopAndTranscribe,
  };
}

function assertHomechatNotAborted(signal?: AbortSignal, copy?: SharedHomechatRunControllerCopy): void {
  if (signal?.aborted) {
    throw new SharedHomechatRunControllerError("aborted", copy?.aborted ?? "The operation was cancelled.");
  }
}

async function homechatControllerDelay(
  milliseconds: number,
  signal: AbortSignal | undefined,
  sleep: (milliseconds: number) => Promise<void>,
  copy?: SharedHomechatRunControllerCopy,
): Promise<void> {
  assertHomechatNotAborted(signal, copy);
  if (!signal) {
    await sleep(milliseconds);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new SharedHomechatRunControllerError("aborted", copy?.aborted ?? "The operation was cancelled."));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    sleep(milliseconds).then(
      () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function secondsSince(value: string | number | null | undefined): number {
  if (!value) return 0;
  const started = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(started)) return 0;
  return Math.max(1, Math.floor((Date.now() - started) / 1000));
}
