export type SharedHomechatRunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_for_approval"
  | "completed"
  | "cancelled"
  | "failed";

export type SharedHomechatRunState = Exclude<SharedHomechatRunStatus, "waiting_for_approval">;

export type SharedHomechatToolState = "started" | "succeeded" | "failed";

export type SharedHomechatMessage<Role extends string = "user" | "assistant" | "system" | "tool"> = {
  content: string;
  conversationSessionId?: string | null;
  createdAt?: string;
  id?: string;
  optimistic?: boolean;
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
  messageId?: string;
  payload: Payload;
  runId?: string;
  type: Type;
};

export type SharedHomechatRunStatusEvent = SharedHomechatEventBase<
  "run.status",
  Record<string, SharedHomechatJsonValue> & { error?: string; state: SharedHomechatRunState }
> & {
  error?: string;
  state: SharedHomechatRunState;
};

export type SharedHomechatMessageDeltaEvent = SharedHomechatEventBase<
  "message.delta",
  Record<string, SharedHomechatJsonValue> & { replace?: boolean; text: string }
> & {
  replace?: boolean;
  text: string;
};

export type SharedHomechatMessageCompletedEvent = SharedHomechatEventBase<
  "message.completed",
  Record<string, SharedHomechatJsonValue> & { messageId: string; text: string }
> & {
  messageId: string;
  text: string;
};

export type SharedHomechatToolStatusEvent = SharedHomechatEventBase<
  "tool.status",
  Record<string, SharedHomechatJsonValue> & {
    label: string;
    state: SharedHomechatToolState;
    toolCallId: string;
    toolName?: string;
  }
> & {
  label: string;
  state: SharedHomechatToolState;
  toolCallId: string;
  toolName?: string;
};

export type SharedHomechatSourceItem = {
  as_of?: string;
  asset_symbols?: string[];
  kind: string;
  origin: string;
  published_at?: string;
  snapshot_id?: string;
  source_id?: string;
  title: string;
  url?: string;
};

export type SharedHomechatActionProposal = {
  actionId: string;
  expiresAt: string;
  kind: string;
  payload: SharedHomechatJsonValue;
  summary: string;
};

export type SharedHomechatSourcesUpdateEvent = SharedHomechatEventBase<
  "sources.update",
  Record<string, SharedHomechatJsonValue> & { items: SharedHomechatJsonValue[] }
> & {
  items: SharedHomechatJsonValue[];
};

export type SharedHomechatArtifactUpdateEvent = SharedHomechatEventBase<
  "artifact.update",
  Record<string, SharedHomechatJsonValue> & { artifacts: SharedHomechatJsonValue[] }
> & {
  artifact?: SharedHomechatJsonValue;
  artifacts: SharedHomechatJsonValue[];
};

export type SharedHomechatActionProposalEvent = SharedHomechatEventBase<
  "action.proposal",
  Record<string, SharedHomechatJsonValue> & { action: SharedHomechatJsonValue }
> & {
  action: SharedHomechatJsonValue;
};

export type SharedHomechatUsageUpdateEvent = SharedHomechatEventBase<
  "usage.update",
  Record<string, SharedHomechatJsonValue> & { limit?: number; used: number }
> & {
  limit?: number;
  used: number;
};

export type SharedHomechatErrorEvent = SharedHomechatEventBase<
  "error",
  Record<string, SharedHomechatJsonValue> & { code: string; message: string }
> & {
  code: string;
  message: string;
};

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

export type SharedHomechatEventStreamParseResult = {
  cursor: string | null;
  events: SharedHomechatCanonicalEvent[];
  ignored: number;
};

export type SharedHomechatEventStreamParseOptions = {
  cursor?: string | null;
};

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

export type SharedHomechatSlotContext<Message extends SharedHomechatMessage = SharedHomechatMessage> = {
  message: Message;
  messageId: string | null;
  runId: string | null;
};

export type SharedHomechatKeyedProductSlots<
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
> = {
  byMessageId: Record<string, SharedHomechatProductSlots<Source, Artifact, Action>>;
  byRunId: Record<string, SharedHomechatProductSlots<Source, Artifact, Action>>;
};

export type SharedHomechatProductRenderers<
  Rendered,
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  Source = SharedHomechatSource,
  Artifact = SharedHomechatArtifact,
  Action = SharedHomechatProductAction,
> = {
  action?: (action: Action, message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
  actions?: (actions: readonly Action[], message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
  artifact?: (artifact: Artifact, message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
  artifacts?: (artifacts: readonly Artifact[], message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
  message: (message: Message, index: number) => Rendered;
  source?: (source: Source, message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
  sources?: (sources: readonly Source[], message: Message, context: SharedHomechatSlotContext<Message>) => Rendered;
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

export type SharedHomechatClientState<
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
> = {
  error: string | null;
  events: SharedHomechatCanonicalEvent[];
  messages: Message[];
  phase: SharedHomechatClientPhase;
  runId: string | null;
  slots: SharedHomechatKeyedProductSlots<Source, Artifact, Action>;
  startedAt: number | null;
  status: SharedHomechatRunStatus | null;
  streamingText: string;
};

export type SharedHomechatClientAction<Message extends SharedHomechatMessage = SharedHomechatMessage> =
  | { type: "reset"; messages?: Message[] }
  | { type: "run.sending"; optimisticMessage?: Message }
  | { type: "run.started"; runId: string; startedAt?: number; status?: SharedHomechatRunStatus | string }
  | { type: "run.reconnecting"; runId: string; startedAt?: number }
  | { type: "run.stopping" }
  | {
      type: "run.snapshot";
      run: {
        error?: string | null;
        events?: readonly unknown[];
        id: string;
        messages?: readonly Message[];
        status: SharedHomechatRunStatus | string;
      };
    }
  | { type: "run.event"; event: unknown; completedMessage?: Message }
  | { type: "run.error"; error: string };

export type SharedHomechatRunSnapshot<
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  Event = SharedHomechatRunEvent,
> = {
  error?: string | null;
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

export type SharedHomechatRunCreateOptions<Run> = {
  onSnapshot?: (run: Run) => void | Promise<void>;
  signal?: AbortSignal;
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

export type SharedHomechatRunTransport<
  Run extends SharedHomechatRunSnapshot,
  CreateRunRequest = never,
> = {
  createRun?: (request: CreateRunRequest, context: SharedHomechatTransportContext) => Promise<Run>;
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

export type SharedHomechatPage<Item> = {
  cursor: string | null;
  items: Item[];
};

export type SharedHomechatConversation = {
  id: string;
  title?: string;
  updatedAt?: string;
};

export type SharedHomechatConversationListRequest = SharedHomechatTransportContext & {
  cursor?: string | null;
  limit?: number;
  search?: string;
};

export type SharedHomechatMessageListRequest = SharedHomechatTransportContext & {
  conversationId: string;
  cursor?: string | null;
  limit?: number;
};

export type SharedHomechatConversationTransport<
  Conversation extends SharedHomechatConversation = SharedHomechatConversation,
  Message extends SharedHomechatMessage = SharedHomechatMessage,
  CreateConversationRequest = Record<string, never>,
> = {
  createConversation: (
    request: CreateConversationRequest,
    context: SharedHomechatTransportContext,
  ) => Promise<Conversation>;
  listConversations: (
    request: SharedHomechatConversationListRequest,
  ) => Promise<SharedHomechatPage<Conversation>>;
  listMessages: (
    request: SharedHomechatMessageListRequest,
  ) => Promise<SharedHomechatPage<Message>>;
};

export type SharedHomechatPagedState<Item> = {
  cursor: string | null;
  error: string | null;
  items: Item[];
  phase: "idle" | "loading" | "ready" | "error";
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

export type SharedHomechatJobHistoryItem = {
  id: string;
  jobId: string;
  status: SharedHomechatJobStatus | string;
};

export type SharedHomechatJobListRequest = SharedHomechatTransportContext & {
  cursor?: string | null;
  limit?: number;
};

export type SharedHomechatJobHistoryRequest = SharedHomechatJobListRequest & {
  jobId: string;
};

export type SharedHomechatJobTransport<
  Job extends SharedHomechatJob = SharedHomechatJob,
  CreateJobRequest = unknown,
  UpdateJobRequest = unknown,
  JobRun extends SharedHomechatRunSnapshot = SharedHomechatRunSnapshot,
  HistoryItem extends SharedHomechatJobHistoryItem = SharedHomechatJobHistoryItem,
> = {
  cancelJob?: (jobId: string, context: SharedHomechatTransportContext) => Promise<Job | void>;
  createJob: (request: CreateJobRequest, context: SharedHomechatTransportContext) => Promise<Job>;
  deleteJob: (jobId: string, context: SharedHomechatTransportContext) => Promise<void>;
  getJob: (jobId: string, context: SharedHomechatTransportContext) => Promise<Job>;
  listJobHistory: (request: SharedHomechatJobHistoryRequest) => Promise<SharedHomechatPage<HistoryItem>>;
  listJobs: (request: SharedHomechatJobListRequest) => Promise<SharedHomechatPage<Job>>;
  runJob: (jobId: string, context: SharedHomechatTransportContext) => Promise<JobRun>;
  updateJob: (jobId: string, request: UpdateJobRequest, context: SharedHomechatTransportContext) => Promise<Job>;
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

export type SharedHomechatVoicePhase =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopping"
  | "transcribing"
  | "error";

export type SharedHomechatVoiceState = {
  error: string | null;
  permission: "unknown" | "granted" | "denied";
  phase: SharedHomechatVoicePhase;
};

export class SharedHomechatVoiceControllerError extends Error {
  readonly code: SharedHomechatVoiceControllerErrorCode;

  constructor(code: SharedHomechatVoiceControllerErrorCode, message: string) {
    super(message);
    this.name = "SharedHomechatVoiceControllerError";
    this.code = code;
  }
}

export type SharedHomechatVoiceController<Recording> = {
  cancel: (context?: SharedHomechatTransportContext) => Promise<void>;
  getState: () => SharedHomechatVoiceState;
  isRecording: () => boolean;
  start: (context?: SharedHomechatTransportContext) => Promise<SharedHomechatVoiceRecording<Recording>>;
  stopAndTranscribe: (context?: SharedHomechatTransportContext) => Promise<string>;
  subscribe: (listener: (state: SharedHomechatVoiceState) => void) => () => void;
};

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

function homechatNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  const messageId = homechatText(raw.messageId) ?? homechatText(raw.message_id) ??
    homechatText(rawPayload.messageId) ?? homechatText(rawPayload.message_id) ?? undefined;
  const payload = homechatJsonRecord(rawPayload);

  if (type === "run.status") {
    const normalized = normalizeHomechatRunStatus(raw.state ?? raw.status ?? rawPayload.state ?? rawPayload.status) ?? "running";
    const state: SharedHomechatRunState = normalized === "waiting_for_approval" ? "waiting" : normalized;
    const error = homechatText(raw.error) ?? homechatText(rawPayload.error) ?? undefined;
    payload.state = state;
    if (error) payload.error = error;
    return { id, runId, messageId, type, state, ...(error ? { error } : {}), payload: payload as SharedHomechatRunStatusEvent["payload"], createdAt };
  }
  if (type === "message.delta") {
    const text = homechatStreamingValue(raw.text) ?? homechatStreamingValue(raw.delta) ??
      homechatStreamingValue(rawPayload.text) ?? homechatStreamingValue(rawPayload.delta) ??
      homechatStreamingValue(rawPayload.content) ?? "";
    const replace = raw.replace === true || rawPayload.replace === true;
    payload.text = text;
    if (replace) payload.replace = true;
    return { id, runId, messageId, type, text, ...(replace ? { replace: true } : {}), payload: payload as SharedHomechatMessageDeltaEvent["payload"], createdAt };
  }
  if (type === "message.completed") {
    const text = homechatStreamingValue(raw.text) ?? homechatStreamingValue(raw.content) ??
      homechatStreamingValue(rawPayload.text) ?? homechatStreamingValue(rawPayload.content) ?? "";
    const completedMessageId = messageId ?? "";
    payload.text = text;
    payload.messageId = completedMessageId;
    return { id, runId, type, messageId: completedMessageId, text, payload: payload as SharedHomechatMessageCompletedEvent["payload"], createdAt };
  }
  if (type === "tool.status") {
    const toolCallId = homechatText(raw.toolCallId) ?? homechatText(raw.tool_call_id) ??
      homechatText(rawPayload.toolCallId) ?? homechatText(rawPayload.tool_call_id) ?? "";
    const toolName = homechatText(raw.toolName) ?? homechatText(raw.tool_name) ??
      homechatText(rawPayload.toolName) ?? homechatText(rawPayload.tool_name) ?? undefined;
    const label = homechatText(raw.label) ?? homechatText(rawPayload.label) ?? "";
    const rawState = raw.state ?? raw.status ?? rawPayload.state ?? rawPayload.status;
    const state: SharedHomechatToolState = rawState === "succeeded" || rawState === "failed" ? rawState : "started";
    payload.toolCallId = toolCallId;
    payload.label = label;
    payload.state = state;
    if (toolName) payload.toolName = toolName;
    return { id, runId, messageId, type, toolCallId, ...(toolName ? { toolName } : {}), label, state, payload: payload as SharedHomechatToolStatusEvent["payload"], createdAt };
  }

  if (type === "sources.update") {
    const rawItems = raw.items ?? rawPayload.items ?? raw.sources ?? rawPayload.sources;
    const items = Array.isArray(rawItems) ? homechatJsonValue(rawItems) as SharedHomechatJsonValue[] : [];
    payload.items = items;
    return { id, runId, messageId, type, items, payload: payload as SharedHomechatSourcesUpdateEvent["payload"], createdAt };
  }
  if (type === "artifact.update") {
    const rawArtifacts = raw.artifacts ?? rawPayload.artifacts ?? raw.items ?? rawPayload.items;
    const rawArtifact = raw.artifact ?? rawPayload.artifact;
    const artifacts = Array.isArray(rawArtifacts)
      ? homechatJsonValue(rawArtifacts) as SharedHomechatJsonValue[]
      : rawArtifact === undefined
        ? []
        : [homechatJsonValue(rawArtifact) ?? null];
    const artifact = rawArtifact === undefined ? artifacts[0] : homechatJsonValue(rawArtifact);
    payload.artifacts = artifacts;
    if (artifact !== undefined) payload.artifact = artifact;
    return { id, runId, messageId, type, artifacts, ...(artifact !== undefined ? { artifact } : {}), payload: payload as SharedHomechatArtifactUpdateEvent["payload"], createdAt };
  }
  if (type === "action.proposal") {
    const rawActions = raw.actions ?? rawPayload.actions;
    const rawAction = raw.action ?? rawPayload.action ?? (Array.isArray(rawActions) ? rawActions[0] : undefined);
    const action = homechatJsonValue(rawAction) ?? {};
    payload.action = action;
    return { id, runId, messageId, type, action, payload: payload as SharedHomechatActionProposalEvent["payload"], createdAt };
  }
  if (type === "usage.update") {
    const used = homechatNumber(raw.used) ?? homechatNumber(rawPayload.used) ?? 0;
    const limit = homechatNumber(raw.limit) ?? homechatNumber(rawPayload.limit) ?? undefined;
    payload.used = used;
    if (limit !== undefined) payload.limit = limit;
    return { id, runId, messageId, type, used, ...(limit !== undefined ? { limit } : {}), payload: payload as SharedHomechatUsageUpdateEvent["payload"], createdAt };
  }
  if (type === "error") {
    const code = homechatText(raw.code) ?? homechatText(rawPayload.code) ?? "run_error";
    const message = homechatText(raw.message) ?? homechatText(raw.error) ??
      homechatText(rawPayload.message) ?? homechatText(rawPayload.error) ?? "";
    payload.code = code;
    payload.message = message;
    return { id, runId, messageId, type, code, message, payload: payload as SharedHomechatErrorEvent["payload"], createdAt };
  }

  return null;
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
    const status = normalizeHomechatRunStatus(event.state) ?? "running";
    const { state: _state, ...legacyPayload } = payload;
    return {
      id,
      runId,
      type: "status",
      payload: { ...legacyPayload, status: status === "waiting" ? "waiting_for_approval" : status },
      createdAt,
    };
  }
  if (event.type === "message.delta") {
    return { id, runId, type: "message_delta", payload: { ...payload, delta: event.text }, createdAt };
  }
  if (event.type === "message.completed") {
    return { id, runId, type: "message_completed", payload: { ...payload, content: event.text }, createdAt };
  }
  if (event.type === "usage.update") return { id, runId, type: "usage", payload, createdAt };
  if (event.type === "error") return { id, runId, type: "error", payload, createdAt };
  return null;
}

export function parseHomechatEventStream(
  value: string,
  options: SharedHomechatEventStreamParseOptions = {},
): SharedHomechatEventStreamParseResult {
  const events: SharedHomechatCanonicalEvent[] = [];
  let ignored = 0;
  let cursor = options.cursor ?? null;

  for (const block of value.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    let eventName = "";
    let frameId: string | null | undefined;
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const separator = line.indexOf(":");
      const field = separator < 0 ? line : line.slice(0, separator);
      let fieldValue = separator < 0 ? "" : line.slice(separator + 1);
      if (fieldValue.startsWith(" ")) fieldValue = fieldValue.slice(1);
      if (field === "data") dataLines.push(fieldValue);
      if (field === "event") eventName = fieldValue;
      if (field === "id" && !fieldValue.includes("\0")) frameId = fieldValue || null;
    }

    if (frameId !== undefined) cursor = frameId;
    const data = dataLines.join("\n");
    if (!data) continue;
    try {
      const decoded = JSON.parse(data) as unknown;
      const decodedRecord = homechatRecord(decoded);
      const input = eventName && !decodedRecord.type && !decodedRecord.event
        ? decodedRecord.payload
          ? { ...decodedRecord, type: eventName }
          : { type: eventName, payload: decodedRecord }
        : decodedRecord;
      const event = normalizeHomechatRunEvent(
        frameId !== undefined ? { ...input, id: frameId ?? undefined } : input,
      );
      if (event) events.push(event);
      else ignored += 1;
    } catch {
      ignored += 1;
    }
  }
  return { cursor, events, ignored };
}

export function createHomechatEventStreamDecoder(options: SharedHomechatEventStreamParseOptions = {}) {
  let buffer = "";
  let cursor = options.cursor ?? null;

  function parseFrames(value: string): SharedHomechatEventStreamParseResult {
    const parsed = parseHomechatEventStream(value, { cursor });
    cursor = parsed.cursor;
    return parsed;
  }

  function push(chunk: string): SharedHomechatEventStreamParseResult {
    buffer += chunk;
    const frames: string[] = [];
    while (true) {
      const match = /\r?\n\r?\n/.exec(buffer);
      if (!match || match.index === undefined) break;
      const end = match.index + match[0].length;
      frames.push(buffer.slice(0, end));
      buffer = buffer.slice(end);
    }
    return frames.length ? parseFrames(frames.join("")) : { cursor, events: [], ignored: 0 };
  }

  function finish(): SharedHomechatEventStreamParseResult {
    if (!buffer.trim()) {
      buffer = "";
      return { cursor, events: [], ignored: 0 };
    }
    const remainder = buffer;
    buffer = "";
    return parseFrames(remainder);
  }

  return { finish, getCursor: () => cursor, push };
}

export function isUserVisibleHomechatEvent(
  event: Pick<SharedHomechatCanonicalEvent, "type">,
): boolean {
  return (
    event.type === "sources.update" ||
    event.type === "artifact.update" ||
    event.type === "action.proposal" ||
    event.type === "error"
  );
}

export function isActiveHomechatRunStatus(
  status: SharedHomechatRunStatus | null | undefined,
): boolean {
  return Boolean(status && activeRunStatuses.has(status));
}

export function isTerminalHomechatEvent(event: SharedHomechatCanonicalEvent): boolean {
  return (
    event.type === "message.completed" ||
    event.type === "error" ||
    (event.type === "run.status" && !isActiveHomechatRunStatus(event.state))
  );
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
    const matchingCompletedMessageIndex = message.runId && message.role === "assistant"
      ? merged.findIndex((item) =>
          item.role === "assistant" &&
          item.runId === message.runId &&
          item.content === message.content,
        )
      : -1;
    if (matchingCompletedMessageIndex >= 0) {
      const previousId = merged[matchingCompletedMessageIndex]?.id;
      if (previousId) indexById.delete(previousId);
      merged[matchingCompletedMessageIndex] = message;
      if (message.id) indexById.set(message.id, matchingCompletedMessageIndex);
      continue;
    }
    let optimisticUserIndex = -1;
    if (message.role === "user") {
      for (let candidateIndex = merged.length - 1; candidateIndex >= 0; candidateIndex -= 1) {
        const item = merged[candidateIndex];
        if (
          item?.role === "user" &&
          item.optimistic === true &&
          item.content === message.content &&
          (!message.conversationSessionId || !item.conversationSessionId || item.conversationSessionId === message.conversationSessionId)
        ) {
          optimisticUserIndex = candidateIndex;
          break;
        }
      }
    }
    if (optimisticUserIndex >= 0) {
      const previousId = merged[optimisticUserIndex]?.id;
      if (previousId) indexById.delete(previousId);
      merged[optimisticUserIndex] = message;
      if (message.id) indexById.set(message.id, optimisticUserIndex);
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
    return nextHomechatStreamingText(draft, { text: event.text }, event.replace === true);
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

export function createHomechatKeyedProductSlots<Source = SharedHomechatJsonValue, Artifact = SharedHomechatJsonValue, Action = SharedHomechatJsonValue>(): SharedHomechatKeyedProductSlots<Source, Artifact, Action> {
  return { byMessageId: {}, byRunId: {} };
}

function homechatSlotValueKey(value: unknown, index: number): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const id = homechatText(record.id) ?? homechatText(record.actionId) ?? homechatText(record.artifactId) ??
      homechatText(record.source_id) ?? homechatText(record.snapshot_id);
    if (id) return id;
  }
  try {
    return JSON.stringify(value) || String(index);
  } catch {
    return String(index);
  }
}

function mergeHomechatSlotValues<Value>(current: readonly Value[] = [], incoming: readonly Value[] = []): Value[] {
  const merged = [...current];
  const indexByKey = new Map(merged.map((value, index) => [homechatSlotValueKey(value, index), index]));
  for (const value of incoming) {
    const key = homechatSlotValueKey(value, merged.length);
    const index = indexByKey.get(key);
    if (index === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(value);
    } else {
      merged[index] = value;
    }
  }
  return merged;
}

export function mergeHomechatProductSlots<Source, Artifact, Action>(
  current: SharedHomechatProductSlots<Source, Artifact, Action> | null | undefined,
  incoming: SharedHomechatProductSlots<Source, Artifact, Action> | null | undefined,
): SharedHomechatProductSlots<Source, Artifact, Action> {
  return {
    sources: mergeHomechatSlotValues(current?.sources, incoming?.sources),
    artifacts: mergeHomechatSlotValues(current?.artifacts, incoming?.artifacts),
    actions: mergeHomechatSlotValues(current?.actions, incoming?.actions),
  };
}

export function putHomechatProductSlots<Source, Artifact, Action>(
  current: SharedHomechatKeyedProductSlots<Source, Artifact, Action>,
  input: {
    messageId?: string | null;
    runId?: string | null;
    slots: SharedHomechatProductSlots<Source, Artifact, Action>;
  },
): SharedHomechatKeyedProductSlots<Source, Artifact, Action> {
  const byMessageId = { ...current.byMessageId };
  const byRunId = { ...current.byRunId };
  if (input.runId) byRunId[input.runId] = mergeHomechatProductSlots(byRunId[input.runId], input.slots);
  if (input.messageId) byMessageId[input.messageId] = mergeHomechatProductSlots(byMessageId[input.messageId], input.slots);
  return { byMessageId, byRunId };
}

export function homechatProductSlotsForMessage<
  Message extends SharedHomechatMessage,
  Source,
  Artifact,
  Action,
>(
  slots: SharedHomechatKeyedProductSlots<Source, Artifact, Action>,
  message: Message,
): SharedHomechatProductSlots<Source, Artifact, Action> {
  const runSlots = message.runId ? slots.byRunId[message.runId] : undefined;
  const messageSlots = message.id ? slots.byMessageId[message.id] : undefined;
  return mergeHomechatProductSlots(runSlots, messageSlots);
}

export function createHomechatClientState<
  Message extends SharedHomechatMessage,
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
>(
  messages: readonly Message[] = [],
): SharedHomechatClientState<Message, Source, Artifact, Action> {
  return {
    error: null,
    events: [],
    messages: [...messages],
    phase: "idle",
    runId: null,
    slots: createHomechatKeyedProductSlots<Source, Artifact, Action>(),
    startedAt: null,
    status: null,
    streamingText: "",
  };
}

function completedHomechatMessage<Message extends SharedHomechatMessage>(input: {
  content: string;
  createdAt?: string;
  id?: string;
  runId: string;
}): Message {
  return {
    content: input.content,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    id: input.id || `${input.runId}:assistant`,
    role: "assistant",
    runId: input.runId,
  } as Message;
}

function persistCompletedHomechatMessage<Message extends SharedHomechatMessage>(
  state: { messages: Message[] },
  input: {
    completedMessage?: Message;
    content: string;
    createdAt?: string;
    id?: string;
    runId: string;
  },
): Message[] {
  const content = input.content.trim() ? input.content : input.completedMessage?.content ?? "";
  if (!content.trim()) return state.messages;
  if (
    !input.completedMessage &&
    state.messages.some((message) =>
      message.role === "assistant" &&
      message.runId === input.runId,
    )
  ) {
    return state.messages;
  }
  const message = input.completedMessage ?? completedHomechatMessage<Message>({ ...input, content });
  return mergeHomechatMessages(state.messages, [message]);
}

export function reduceHomechatClientState<
  Message extends SharedHomechatMessage,
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
>(
  state: SharedHomechatClientState<Message, Source, Artifact, Action>,
  action: SharedHomechatClientAction<Message>,
): SharedHomechatClientState<Message, Source, Artifact, Action> {
  if (action.type === "reset") return createHomechatClientState<Message, Source, Artifact, Action>(action.messages ?? state.messages);
  if (action.type === "run.sending") {
    return {
      ...state,
      error: null,
      messages: action.optimisticMessage
        ? mergeHomechatMessages(state.messages, [{ ...action.optimisticMessage, optimistic: true }])
        : state.messages,
      phase: "sending",
      streamingText: "",
    };
  }
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
    let next: SharedHomechatClientState<Message, Source, Artifact, Action> = {
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
      error: status === "failed" ? action.run.error ?? next.error ?? "The run could not finish." : null,
      messages: status === "completed"
        ? persistCompletedHomechatMessage(next, {
            content: next.streamingText,
            runId: action.run.id,
          })
        : next.messages,
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
  let slots = state.slots;
  if (event.type === "sources.update") {
    slots = putHomechatProductSlots(slots, {
      messageId: event.messageId,
      runId: event.runId ?? state.runId,
      slots: { sources: event.items as Source[] },
    });
  } else if (event.type === "artifact.update") {
    slots = putHomechatProductSlots(slots, {
      messageId: event.messageId,
      runId: event.runId ?? state.runId,
      slots: { artifacts: event.artifacts as Artifact[] },
    });
  } else if (event.type === "action.proposal") {
    slots = putHomechatProductSlots(slots, {
      messageId: event.messageId,
      runId: event.runId ?? state.runId,
      slots: { actions: [event.action as Action] },
    });
  }

  if (event.type === "run.status") {
    const runId = event.runId ?? state.runId;
    const completed = event.state === "completed" && Boolean(runId);
    return {
      ...state,
      events,
      error: event.state === "failed" ? event.error ?? state.error ?? "The run could not finish." : null,
      messages: completed
        ? persistCompletedHomechatMessage(state, {
            content: state.streamingText,
            createdAt: event.createdAt,
            id: event.id,
            runId: runId!,
          })
        : state.messages,
      phase: homechatClientPhaseForStatus(event.state),
      runId,
      slots,
      status: event.state,
      streamingText: isActiveHomechatRunStatus(event.state) ? state.streamingText : "",
    };
  }
  if (event.type === "message.delta") {
    return {
      ...state,
      events,
      phase: "streaming",
      runId: event.runId ?? state.runId,
      slots,
      streamingText: nextHomechatStreamingText(state.streamingText, { text: event.text }, event.replace === true),
    };
  }
  if (event.type === "message.completed") {
    const runId = event.runId ?? state.runId ?? "run";
    const content = reconcileHomechatFinalAnswer(event.text, state.streamingText);
    const completedSlots = slots.byRunId[runId];
    if (completedSlots && event.messageId) {
      slots = putHomechatProductSlots(slots, { messageId: event.messageId, runId, slots: completedSlots });
    }
    return {
      ...state,
      events,
      messages: persistCompletedHomechatMessage(state, {
        completedMessage: action.completedMessage,
        content,
        createdAt: event.createdAt,
        id: event.messageId || event.id,
        runId,
      }),
      phase: "completed",
      runId,
      slots,
      status: "completed",
      streamingText: "",
    };
  }
  if (event.type === "error") {
    return { ...state, events, error: event.message || "The run reported an error.", phase: "error", slots };
  }
  return { ...state, events, runId: event.runId ?? state.runId, slots };
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

export function createHomechatRunController<
  Run extends SharedHomechatRunSnapshot,
  CreateRunRequest = never,
>(
  transport: SharedHomechatRunTransport<Run, CreateRunRequest>,
  defaults: {
    intervalMs?: number;
    now?: () => number;
    sleep?: (milliseconds: number) => Promise<void>;
    timeoutMs?: number;
  } = {},
) {
  const now = defaults.now ?? Date.now;
  const sleep = defaults.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  async function create(
    request: CreateRunRequest,
    options: SharedHomechatRunCreateOptions<Run> = {},
  ): Promise<Run> {
    if (!transport.createRun) throw new Error("This transport does not support creating runs.");
    assertHomechatNotAborted(options.signal);
    const run = await transport.createRun(request, { signal: options.signal });
    await options.onSnapshot?.(run);
    return run;
  }

  async function get(
    runId: string,
    options: SharedHomechatRunCreateOptions<Run> = {},
  ): Promise<Run> {
    assertHomechatNotAborted(options.signal);
    const run = await transport.getRun(runId, { signal: options.signal });
    await options.onSnapshot?.(run);
    return run;
  }

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
            if (isTerminalHomechatEvent(event)) terminal = true;
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

  return {
    create,
    continue: create,
    get,
    poll: wait,
    reconnect,
    send: create,
    stop,
    stream,
    wait,
  };
}

export type SharedHomechatFollowOptions = SharedHomechatStreamOptions & {
  follow?: boolean;
  pollAfterStream?: boolean;
};

export type SharedHomechatClientControllerOptions<
  Message extends SharedHomechatMessage,
  Run extends SharedHomechatRunSnapshot<Message>,
  CreateRunRequest,
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
> = {
  initialMessages?: readonly Message[];
  messageFromCompletion?: (
    event: SharedHomechatMessageCompletedEvent,
    content: string,
  ) => Message;
  onEvent?: (event: SharedHomechatCanonicalEvent) => void | Promise<void>;
  onRunCreated?: (run: Run) => void | Promise<void>;
  onSnapshot?: (run: Run) => void | Promise<void>;
  onState?: (state: SharedHomechatClientState<Message, Source, Artifact, Action>) => void;
  runController?: ReturnType<typeof createHomechatRunController<Run, CreateRunRequest>>;
  transport: SharedHomechatRunTransport<Run, CreateRunRequest>;
};

export function createHomechatClientController<
  Message extends SharedHomechatMessage,
  Run extends SharedHomechatRunSnapshot<Message>,
  CreateRunRequest,
  Source = SharedHomechatJsonValue,
  Artifact = SharedHomechatJsonValue,
  Action = SharedHomechatJsonValue,
>(
  options: SharedHomechatClientControllerOptions<Message, Run, CreateRunRequest, Source, Artifact, Action>,
) {
  const runs = options.runController ?? createHomechatRunController(options.transport);
  let state = createHomechatClientState<Message, Source, Artifact, Action>(options.initialMessages ?? []);

  function dispatch(action: SharedHomechatClientAction<Message>) {
    state = reduceHomechatClientState(state, action);
    options.onState?.(state);
    return state;
  }

  function captureError(error: unknown) {
    const terminal = state.phase === "completed" || state.phase === "stopped" || state.phase === "error";
    if (!terminal && !isSharedHomechatRunControllerError(error, "aborted")) {
      dispatch({ type: "run.error", error: error instanceof Error ? error.message : "The run could not finish." });
    }
  }

  async function takeSnapshot(run: Run) {
    dispatch({ type: "run.snapshot", run });
    await options.onSnapshot?.(run);
  }

  async function takeEvent(event: SharedHomechatCanonicalEvent) {
    const completedMessage = event.type === "message.completed" && options.messageFromCompletion
      ? options.messageFromCompletion(event, reconcileHomechatFinalAnswer(event.text, state.streamingText))
      : undefined;
    dispatch({ type: "run.event", event, completedMessage });
    await options.onEvent?.(event);
  }

  async function poll(runId: string, signal?: AbortSignal) {
    return runs.poll(runId, {
      signal,
      onPhase: () => dispatch({ type: "run.reconnecting", runId }),
      onSnapshot: takeSnapshot,
    });
  }

  async function follow(run: Run, followOptions: SharedHomechatFollowOptions = {}) {
    dispatch({ type: "run.started", runId: run.id, status: run.status });
    await takeSnapshot(run);
    const status = normalizeHomechatRunStatus(run.status);
    if (status === "completed" || status === "failed" || status === "cancelled") return state;

    if (options.transport.streamRun) {
      try {
        await runs.stream(run.id, {
          cursor: followOptions.cursor,
          maxReconnectAttempts: followOptions.maxReconnectAttempts ?? 2,
          onCursor: followOptions.onCursor,
          onEvent: takeEvent,
          onReconnect: async (attempt, cursor, error) => {
            dispatch({ type: "run.reconnecting", runId: run.id });
            await followOptions.onReconnect?.(attempt, cursor, error);
          },
          reconnectDelayMs: followOptions.reconnectDelayMs,
          signal: followOptions.signal,
        });
      } catch (error) {
        if (isSharedHomechatRunControllerError(error, "aborted")) throw error;
      }
    }

    if (followOptions.pollAfterStream !== false) {
      try {
        await poll(run.id, followOptions.signal);
      } catch (error) {
        captureError(error);
        throw error;
      }
    }
    return state;
  }

  async function send(
    request: CreateRunRequest,
    sendOptions: SharedHomechatFollowOptions & { optimisticMessage?: Message } = {},
  ) {
    dispatch({ type: "run.sending", optimisticMessage: sendOptions.optimisticMessage });
    try {
      const run = await runs.send(request, { signal: sendOptions.signal });
      await options.onRunCreated?.(run);
      if (sendOptions.follow === false) {
        dispatch({ type: "run.started", runId: run.id, status: run.status });
        await takeSnapshot(run);
        return state;
      }
      return await follow(run, sendOptions);
    } catch (error) {
      captureError(error);
      throw error;
    }
  }

  async function get(runId: string, signal?: AbortSignal) {
    return runs.get(runId, { signal, onSnapshot: takeSnapshot });
  }

  async function reconnect(runId: string, followOptions: SharedHomechatFollowOptions = {}) {
    try {
      dispatch({ type: "run.reconnecting", runId });
      const run = await runs.get(runId, { signal: followOptions.signal, onSnapshot: takeSnapshot });
      const status = normalizeHomechatRunStatus(run.status);
      if (status === "completed" || status === "failed" || status === "cancelled") return state;
      return follow(run, followOptions);
    } catch (error) {
      captureError(error);
      throw error;
    }
  }

  async function stop(runId: string, signal?: AbortSignal) {
    try {
      dispatch({ type: "run.stopping" });
      const stopped = await runs.stop(runId, { signal, onSnapshot: takeSnapshot });
      if (!stopped) await runs.get(runId, { signal, onSnapshot: takeSnapshot });
      return state;
    } catch (error) {
      captureError(error);
      throw error;
    }
  }

  return {
    continue: send,
    create: send,
    dispatch,
    follow,
    get,
    getState: () => state,
    poll,
    reconnect,
    reset: (messages?: Message[]) => dispatch({ type: "reset", messages }),
    send,
    stop,
    supportsStreaming: Boolean(options.transport.streamRun),
  };
}

export function createHomechatPagedState<Item>(items: readonly Item[] = []): SharedHomechatPagedState<Item> {
  return { cursor: null, error: null, items: [...items], phase: items.length ? "ready" : "idle" };
}

export function mergeHomechatPagedItems<Item>(
  current: readonly Item[],
  incoming: readonly Item[],
  keyForItem: (item: Item) => string,
  placement: "append" | "prepend" = "append",
): Item[] {
  const result = placement === "prepend" ? [...incoming] : [...current];
  const indexByKey = new Map(result.map((item, index) => [keyForItem(item), index]));
  const updates = placement === "prepend" ? current : incoming;
  for (const item of updates) {
    const key = keyForItem(item);
    const index = indexByKey.get(key);
    if (index === undefined) {
      indexByKey.set(key, result.length);
      result.push(item);
    } else if (placement === "append") {
      result[index] = item;
    }
  }
  return result;
}

export function createHomechatConversationController<
  Conversation extends SharedHomechatConversation,
  Message extends SharedHomechatMessage,
  CreateConversationRequest = Record<string, never>,
>(
  transport: SharedHomechatConversationTransport<Conversation, Message, CreateConversationRequest>,
) {
  async function create(request: CreateConversationRequest, context: SharedHomechatTransportContext = {}) {
    assertHomechatNotAborted(context.signal);
    return transport.createConversation(request, context);
  }

  async function loadConversations(
    state: SharedHomechatPagedState<Conversation>,
    request: SharedHomechatConversationListRequest = {},
  ): Promise<SharedHomechatPagedState<Conversation>> {
    try {
      const page = await transport.listConversations(request);
      return {
        cursor: page.cursor,
        error: null,
        items: request.cursor
          ? mergeHomechatPagedItems(state.items, page.items, (item) => item.id)
          : [...page.items],
        phase: "ready",
      };
    } catch (error) {
      if (request.signal?.aborted) throw error;
      return { ...state, error: error instanceof Error ? error.message : "Conversations could not be loaded.", phase: "error" };
    }
  }

  async function loadMessages(
    state: SharedHomechatPagedState<Message>,
    request: SharedHomechatMessageListRequest,
  ): Promise<SharedHomechatPagedState<Message>> {
    try {
      const page = await transport.listMessages(request);
      return {
        cursor: page.cursor,
        error: null,
        items: request.cursor
          ? mergeHomechatPagedItems(state.items, page.items, (item) => item.id ?? `${item.runId ?? "run"}:${item.role}:${item.content}`, "prepend")
          : [...page.items],
        phase: "ready",
      };
    } catch (error) {
      if (request.signal?.aborted) throw error;
      return { ...state, error: error instanceof Error ? error.message : "Messages could not be loaded.", phase: "error" };
    }
  }

  return {
    create,
    loadConversations,
    loadMessages,
    loadNextConversations: (
      state: SharedHomechatPagedState<Conversation>,
      request: Omit<SharedHomechatConversationListRequest, "cursor"> = {},
    ) => state.cursor ? loadConversations(state, { ...request, cursor: state.cursor }) : Promise.resolve(state),
    loadOlderMessages: (
      state: SharedHomechatPagedState<Message>,
      request: Omit<SharedHomechatMessageListRequest, "cursor">,
    ) => state.cursor ? loadMessages(state, { ...request, cursor: state.cursor }) : Promise.resolve(state),
    refreshConversations: (
      state: SharedHomechatPagedState<Conversation>,
      request: Omit<SharedHomechatConversationListRequest, "cursor"> = {},
    ) => loadConversations(state, { ...request, cursor: null }),
    refreshMessages: (
      state: SharedHomechatPagedState<Message>,
      request: Omit<SharedHomechatMessageListRequest, "cursor">,
    ) => loadMessages(state, { ...request, cursor: null }),
  };
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

export function createHomechatJobController<
  Job extends SharedHomechatJob,
  CreateJobRequest = unknown,
  UpdateJobRequest = unknown,
  JobRun extends SharedHomechatRunSnapshot = SharedHomechatRunSnapshot,
  HistoryItem extends SharedHomechatJobHistoryItem = SharedHomechatJobHistoryItem,
>(
  transport: SharedHomechatJobTransport<Job, CreateJobRequest, UpdateJobRequest, JobRun, HistoryItem>,
  defaults: Parameters<typeof createHomechatRunController>[1] = {},
) {
  const controller = createHomechatRunController<Job>(
    {
      getRun: transport.getJob,
      stopRun: transport.cancelJob,
    },
    defaults,
  );

  async function list(
    state: SharedHomechatPagedState<Job>,
    request: SharedHomechatJobListRequest = {},
  ): Promise<SharedHomechatPagedState<Job>> {
    try {
      const page = await transport.listJobs(request);
      return {
        cursor: page.cursor,
        error: null,
        items: request.cursor ? mergeHomechatPagedItems(state.items, page.items, (job) => job.id) : [...page.items],
        phase: "ready",
      };
    } catch (error) {
      if (request.signal?.aborted) throw error;
      return { ...state, error: error instanceof Error ? error.message : "Jobs could not be loaded.", phase: "error" };
    }
  }

  async function history(
    state: SharedHomechatPagedState<HistoryItem>,
    request: SharedHomechatJobHistoryRequest,
  ): Promise<SharedHomechatPagedState<HistoryItem>> {
    try {
      const page = await transport.listJobHistory(request);
      return {
        cursor: page.cursor,
        error: null,
        items: request.cursor ? mergeHomechatPagedItems(state.items, page.items, (item) => item.id) : [...page.items],
        phase: "ready",
      };
    } catch (error) {
      if (request.signal?.aborted) throw error;
      return { ...state, error: error instanceof Error ? error.message : "Job history could not be loaded.", phase: "error" };
    }
  }

  return {
    cancel: controller.stop,
    create: (request: CreateJobRequest, context: SharedHomechatTransportContext = {}) => transport.createJob(request, context),
    delete: (jobId: string, context: SharedHomechatTransportContext = {}) => transport.deleteJob(jobId, context),
    get: (jobId: string, context: SharedHomechatTransportContext = {}) => transport.getJob(jobId, context),
    history,
    list,
    loadNextHistory: (
      state: SharedHomechatPagedState<HistoryItem>,
      request: Omit<SharedHomechatJobHistoryRequest, "cursor">,
    ) => state.cursor ? history(state, { ...request, cursor: state.cursor }) : Promise.resolve(state),
    loadNextJobs: (
      state: SharedHomechatPagedState<Job>,
      request: Omit<SharedHomechatJobListRequest, "cursor"> = {},
    ) => state.cursor ? list(state, { ...request, cursor: state.cursor }) : Promise.resolve(state),
    reconnect: controller.reconnect,
    refreshJobs: (
      state: SharedHomechatPagedState<Job>,
      request: Omit<SharedHomechatJobListRequest, "cursor"> = {},
    ) => list(state, { ...request, cursor: null }),
    run: (jobId: string, context: SharedHomechatTransportContext = {}) => transport.runJob(jobId, context),
    update: (jobId: string, request: UpdateJobRequest, context: SharedHomechatTransportContext = {}) =>
      transport.updateJob(jobId, request, context),
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

export async function completeHomechatVoiceNote(input: {
  context?: SharedHomechatTransportContext;
  controller: Pick<SharedHomechatVoiceController<unknown>, "stopAndTranscribe">;
  draft?: string | null;
  prefix?: string;
}): Promise<{ message: string; transcript: string }> {
  const transcript = await input.controller.stopAndTranscribe(input.context);
  return {
    message: composeHomechatVoiceMessage({ draft: input.draft, prefix: input.prefix, transcript }),
    transcript,
  };
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

export function createHomechatVoiceController<Recording, Audio>(
  adapter: {
    discardRecording?: (recording: Recording, context: SharedHomechatTransportContext) => Promise<void>;
    isEmptyRecording?: (audio: Audio) => boolean;
    requestPermission: (context: SharedHomechatTransportContext) => Promise<boolean>;
    startRecording: (context: SharedHomechatTransportContext) => Promise<SharedHomechatVoiceRecording<Recording>>;
    stopRecording: (recording: Recording, context: SharedHomechatTransportContext) => Promise<Audio>;
    transcribe: (audio: Audio, context: SharedHomechatTransportContext & { mimeType?: string }) => Promise<string | { text: string }>;
  },
  options: { onState?: (state: SharedHomechatVoiceState) => void } = {},
): SharedHomechatVoiceController<Recording> {
  let active: SharedHomechatVoiceRecording<Recording> | null = null;
  let state: SharedHomechatVoiceState = { error: null, permission: "unknown", phase: "idle" };
  const listeners = new Set<(state: SharedHomechatVoiceState) => void>();

  function setState(next: SharedHomechatVoiceState) {
    state = next;
    options.onState?.(state);
    for (const listener of listeners) listener(state);
  }

  function fail(error: unknown) {
    const message = error instanceof Error ? error.message : "Voice note could not be completed.";
    setState({ ...state, error: message, phase: "error" });
  }

  async function start(context: SharedHomechatTransportContext = {}) {
    if (active) return active;
    setState({ ...state, error: null, phase: "requesting_permission" });
    try {
      if (!await adapter.requestPermission(context)) {
        const error = new SharedHomechatVoiceControllerError("permission_denied", "Microphone permission is required to record a voice note.");
        setState({ error: error.message, permission: "denied", phase: "error" });
        throw error;
      }
      active = await adapter.startRecording(context);
      setState({ error: null, permission: "granted", phase: "recording" });
      return active;
    } catch (error) {
      if (state.phase !== "error") fail(error);
      throw error;
    }
  }

  async function stopAndTranscribe(context: SharedHomechatTransportContext = {}): Promise<string> {
    if (!active) throw new SharedHomechatVoiceControllerError("not_recording", "No voice note is currently recording.");
    const current = active;
    active = null;
    setState({ ...state, error: null, phase: "stopping" });
    try {
      const audio = await adapter.stopRecording(current.recording, context);
      if (adapter.isEmptyRecording?.(audio)) {
        throw new SharedHomechatVoiceControllerError("empty_recording", "No voice note audio was recorded.");
      }
      setState({ ...state, phase: "transcribing" });
      const result = await adapter.transcribe(audio, { ...context, mimeType: current.mimeType });
      const transcript = (typeof result === "string" ? result : result.text).trim();
      if (!transcript) throw new SharedHomechatVoiceControllerError("empty_transcript", "No speech was detected.");
      setState({ ...state, error: null, phase: "idle" });
      return transcript;
    } catch (error) {
      fail(error);
      throw error;
    }
  }

  async function cancel(context: SharedHomechatTransportContext = {}) {
    if (!active) {
      setState({ ...state, error: null, phase: "idle" });
      return;
    }
    const current = active;
    active = null;
    setState({ ...state, error: null, phase: "stopping" });
    try {
      await adapter.discardRecording?.(current.recording, context);
      setState({ ...state, error: null, phase: "idle" });
    } catch (error) {
      fail(error);
      throw error;
    }
  }

  return {
    cancel,
    getState: () => state,
    isRecording: () => Boolean(active),
    start,
    stopAndTranscribe,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
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
