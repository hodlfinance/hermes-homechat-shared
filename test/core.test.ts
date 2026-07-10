import assert from "node:assert/strict";
import test from "node:test";
import {
  SharedHomechatRunControllerError,
  completeHomechatVoiceNote,
  composeHomechatVoiceMessage,
  createHomechatClientController,
  createHomechatClientState,
  createHomechatComposerController,
  createHomechatConversationController,
  createHomechatEventStreamDecoder,
  createHomechatHistoryController,
  createHomechatHistoryState,
  createHomechatJobController,
  createHomechatPagedState,
  createHomechatRunController,
  createHomechatVoiceController,
  homechatTranscriptMessages,
  homechatProductSlotsForMessage,
  isUserVisibleHomechatEvent,
  legacyHomechatRunEvent,
  mergeHomechatMessages,
  nextHomechatStreamingText,
  normalizeHomechatRunEvent,
  parseHomechatEventStream,
  reduceHomechatClientState,
  type SharedHomechatHistoryItem,
  type SharedHomechatJobHistoryItem,
  type SharedHomechatMessage,
} from "../src/index.ts";

test("normalizes legacy and canonical events into a discriminated contract", () => {
  const status = normalizeHomechatRunEvent({
    id: "event-1",
    run_id: "run-1",
    type: "status",
    payload: { status: "waiting_for_approval", privateValue: undefined },
  });
  assert.equal(status?.type, "run.status");
  if (status?.type === "run.status") assert.equal(status.state, "waiting");

  const delta = normalizeHomechatRunEvent({
    event: "message_delta",
    payload: { delta: "Hello", replace: true },
  });
  assert.equal(delta?.type, "message.delta");
  if (delta?.type === "message.delta") {
    assert.equal(delta.payload.text, "Hello");
    assert.equal(delta.payload.replace, true);
  }

  assert.deepEqual(legacyHomechatRunEvent(status), {
    id: "event-1",
    runId: "run-1",
    type: "status",
    payload: { status: "waiting_for_approval" },
    createdAt: "1970-01-01T00:00:00.000Z",
  });
});

test("preserves the Finance flat event vocabulary from flat and nested payload inputs", () => {
  const status = normalizeHomechatRunEvent({ type: "run.status", state: "failed", error: "offline" });
  assert.deepEqual(status && { type: status.type, state: status.type === "run.status" ? status.state : null, error: status.type === "run.status" ? status.error : null }, {
    type: "run.status",
    state: "failed",
    error: "offline",
  });

  const sources = normalizeHomechatRunEvent({
    type: "sources.update",
    items: [{ kind: "research", title: "Report", origin: "CapChat" }],
  });
  assert.equal(sources?.type, "sources.update");
  if (sources?.type === "sources.update") assert.equal((sources.items[0] as { title: string }).title, "Report");

  const nestedSources = normalizeHomechatRunEvent({
    type: "sources.update",
    payload: { sources: [{ kind: "web", title: "Wire", origin: "Reuters" }] },
  });
  if (nestedSources?.type === "sources.update") assert.equal((nestedSources.items[0] as { origin: string }).origin, "Reuters");

  const artifact = normalizeHomechatRunEvent({
    type: "artifact.update",
    payload: { artifact: { id: "artifact-1", kind: "market_panel" } },
  });
  if (artifact?.type === "artifact.update") {
    assert.deepEqual(artifact.artifact, { id: "artifact-1", kind: "market_panel" });
    assert.deepEqual(artifact.artifacts, [artifact.artifact]);
  }

  const action = normalizeHomechatRunEvent({
    type: "action.proposal",
    action: { actionId: "action-1", kind: "create_job", summary: "Daily scan", payload: {}, expiresAt: "2026-07-11" },
  });
  if (action?.type === "action.proposal") assert.equal((action.action as { actionId: string }).actionId, "action-1");

  const usage = normalizeHomechatRunEvent({ type: "usage", payload: { used: 3, limit: 10 } });
  if (usage?.type === "usage.update") assert.deepEqual({ used: usage.used, limit: usage.limit }, { used: 3, limit: 10 });

  const error = normalizeHomechatRunEvent({ type: "error", code: "runtime_offline", message: "Try again" });
  if (error?.type === "error") assert.deepEqual({ code: error.code, message: error.message }, { code: "runtime_offline", message: "Try again" });
});

test("parses standard SSE frames with CRLF event names and Last-Event-ID cursors", () => {
  const parsed = parseHomechatEventStream([
    "id: cursor-1\r\nevent: message_delta\r\ndata: {\"payload\":{\"delta\":\"Hi\"}}",
    "data: not-json",
    "data: {\"type\":\"unknown\"}",
  ].join("\r\n\r\n"), { cursor: "cursor-0" });
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0]?.type, "message.delta");
  assert.equal(parsed.events[0]?.id, "cursor-1");
  assert.equal(parsed.cursor, "cursor-1");
  assert.equal(parsed.ignored, 2);
});

test("decodes CRLF SSE frames split across transport chunks", () => {
  const decoder = createHomechatEventStreamDecoder({ cursor: "cursor-0" });
  assert.equal(decoder.push("id: cursor-1\r\nevent: message_delta\r\ndata: {\"text\":\"Hi\"}\r").events.length, 0);
  const parsed = decoder.push("\n\r\nid: cursor-2\r\nevent: run.status\r\ndata: {\"state\":\"completed\"}\r\n\r\n");
  assert.deepEqual(parsed.events.map((event) => event.type), ["message.delta", "run.status"]);
  assert.equal(parsed.cursor, "cursor-2");
  assert.equal(decoder.finish().events.length, 0);
});

test("reduces snapshots and overlapping stream deltas into canonical client state", () => {
  let state = createHomechatClientState();
  state = reduceHomechatClientState(state, { type: "run.started", runId: "run-1", status: "running", startedAt: 1 });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "d1", runId: "run-1", type: "message.delta", payload: { text: "Hello" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "d2", runId: "run-1", type: "message.delta", payload: { text: "lo world" } },
  });
  assert.equal(state.streamingText, "Hello world");
  assert.equal(state.phase, "streaming");

  state = reduceHomechatClientState(state, {
    type: "run.snapshot",
    run: {
      id: "run-1",
      status: "completed",
      messages: [{ id: "assistant-1", runId: "run-1", role: "assistant", content: "Hello world" }],
    },
  });
  assert.equal(state.phase, "completed");
  assert.equal(state.streamingText, "");
  assert.equal(state.messages.length, 1);
});

test("persists a completed assistant message before terminal status clears the draft", () => {
  let state = createHomechatClientState();
  state = reduceHomechatClientState(state, { type: "run.started", runId: "run-complete", status: "running" });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "delta-1", runId: "run-complete", type: "message_delta", payload: { delta: "Durable answer" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: {
      id: "message-1",
      runId: "run-complete",
      type: "message_completed",
      payload: { content: "Durable answer" },
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "status-1", runId: "run-complete", type: "status", payload: { status: "completed" } },
  });

  assert.equal(state.phase, "completed");
  assert.equal(state.status, "completed");
  assert.equal(state.streamingText, "");
  assert.deepEqual(state.messages, [{
    id: "message-1",
    runId: "run-complete",
    role: "assistant",
    content: "Durable answer",
    createdAt: "2026-01-01T00:00:00.000Z",
  }]);
});

test("persists the streamed draft when a terminal poll snapshot wins the completion race", () => {
  let state = createHomechatClientState();
  state = reduceHomechatClientState(state, { type: "run.started", runId: "run-poll", status: "running" });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "delta-poll", runId: "run-poll", type: "message_delta", payload: { delta: "Polled answer" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.snapshot",
    run: { id: "run-poll", status: "completed", messages: [] },
  });

  assert.equal(state.phase, "completed");
  assert.equal(state.streamingText, "");
  assert.deepEqual(state.messages, [{
    id: "run-poll:assistant",
    runId: "run-poll",
    role: "assistant",
    content: "Polled answer",
  }]);
});

test("prefers a persisted snapshot message over a shorter streaming draft", () => {
  let state = createHomechatClientState();
  state = reduceHomechatClientState(state, { type: "run.started", runId: "run-persisted", status: "running" });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { id: "delta-persisted", runId: "run-persisted", type: "message_delta", payload: { delta: "Complete" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.snapshot",
    run: {
      id: "run-persisted",
      status: "completed",
      messages: [{ id: "message-persisted", runId: "run-persisted", role: "assistant", content: "Complete answer" }],
    },
  });

  assert.deepEqual(state.messages, [
    { id: "message-persisted", runId: "run-persisted", role: "assistant", content: "Complete answer" },
  ]);
});

test("marks source, artifact, and action updates as user-visible product events", () => {
  assert.equal(isUserVisibleHomechatEvent({ type: "sources.update" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "artifact.update" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "action.proposal" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "message.delta" }), false);
});

test("keys source, artifact, and action render payloads by canonical run and completed message", () => {
  let state = createHomechatClientState<SharedHomechatMessage>();
  state = reduceHomechatClientState(state, { type: "run.started", runId: "run-slots", status: "running" });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { type: "sources.update", runId: "run-slots", items: [{ id: "source-1" }] },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { type: "artifact.update", runId: "run-slots", artifact: { id: "artifact-1" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { type: "action.proposal", runId: "run-slots", action: { actionId: "action-1" } },
  });
  state = reduceHomechatClientState(state, {
    type: "run.event",
    event: { type: "message.completed", runId: "run-slots", messageId: "message-slots", text: "Done" },
  });

  const message = state.messages[0]!;
  assert.equal(message.id, "message-slots");
  assert.deepEqual(homechatProductSlotsForMessage(state.slots, message), {
    sources: [{ id: "source-1" }],
    artifacts: [{ id: "artifact-1" }],
    actions: [{ actionId: "action-1" }],
  });
  assert.ok(state.slots.byRunId["run-slots"]);
  assert.ok(state.slots.byMessageId["message-slots"]);
});

test("preserves meaningful leading whitespace in streamed delta segments", () => {
  assert.equal(
    nextHomechatStreamingText("Die erste Hälfte", { delta: " und die zweite Hälfte." }),
    "Die erste Hälfte und die zweite Hälfte.",
  );
  assert.equal(nextHomechatStreamingText("same", { text: "same" }), "same");
});

test("builds a session transcript and merges message updates without copies", () => {
  const messages: SharedHomechatMessage[] = [
    { id: "system", role: "system", content: "hidden", conversationSessionId: "home" },
    { id: "one", role: "user", content: "Hello", conversationSessionId: "home" },
    { id: "two", role: "assistant", content: "Other", conversationSessionId: "other" },
    { id: "one", role: "user", content: "Hello updated", conversationSessionId: "home" },
  ];
  assert.deepEqual(homechatTranscriptMessages(messages, { conversationSessionId: "home" }), [messages[3]!]);
  assert.deepEqual(mergeHomechatMessages([messages[1]!], [messages[3]!]), [messages[3]!]);
});

test("exposes composer intent without owning product UI", () => {
  const queued = createHomechatComposerController({
    activeRunId: "run-1",
    allowFollowUpQueue: true,
    busy: true,
    hasText: true,
    ready: true,
    voiceBusy: false,
    voiceRecording: false,
  });
  assert.equal(queued.intent, "queue_follow_up");
  assert.equal(queued.canStopRun, true);

  const voice = createHomechatComposerController({
    busy: false,
    hasText: false,
    ready: true,
    voiceBusy: false,
    voiceRecording: true,
  });
  assert.equal(voice.intent, "transcribe_voice");
});

test("waits, stops, reconnects, resumes SSE cursors, and aborts through an injected transport", async () => {
  let clock = 0;
  let reads = 0;
  const streamCursors: Array<string | null | undefined> = [];
  const reconnects: number[] = [];
  const controller = createHomechatRunController(
    {
      getRun: async (id) => ({ id, status: reads++ ? "completed" : "running" }),
      stopRun: async (id) => ({ id, status: "cancelled" }),
      streamRun: async (id, context) => {
        streamCursors.push(context.cursor);
        if (streamCursors.length === 1) {
          await context.onEvent({ id: "cursor-1", runId: id, type: "message.delta", payload: { text: "Hi" } });
          return { cursor: "cursor-1" };
        }
        await context.onEvent({ id: "cursor-2", runId: id, type: "run.status", payload: { status: "completed" } });
        return { cursor: "cursor-2", terminal: true };
      },
    },
    { now: () => clock, sleep: async (milliseconds) => { clock += milliseconds; }, intervalMs: 10 },
  );

  assert.equal((await controller.wait("run-1")).status, "completed");
  assert.equal((await controller.stop("run-1"))?.status, "cancelled");
  const stream = await controller.stream("run-1", {
    onReconnect: (attempt) => { reconnects.push(attempt); },
    reconnectDelayMs: 0,
  });
  assert.deepEqual(streamCursors, [null, "cursor-1"]);
  assert.deepEqual(reconnects, [1]);
  assert.equal(stream.terminal, true);

  const abort = new AbortController();
  abort.abort();
  await assert.rejects(
    controller.reconnect("run-2", { signal: abort.signal }),
    (error) => error instanceof SharedHomechatRunControllerError && error.code === "aborted",
  );
});

test("advances Last-Event-ID through parsed SSE reconnects until message completion", async () => {
  const requests: Array<string | null | undefined> = [];
  const controller = createHomechatRunController(
    {
      getRun: async (id) => ({ id, status: "running" }),
      streamRun: async (id, context) => {
        requests.push(context.cursor);
        const frame = requests.length === 1
          ? `id: cursor-1\r\nevent: message_delta\r\ndata: {"runId":"${id}","payload":{"delta":"Hi"}}\r\n\r\n`
          : `id: cursor-2\r\nevent: message_completed\r\ndata: {"runId":"${id}","payload":{"content":"Hi"}}\r\n\r\n`;
        const parsed = parseHomechatEventStream(frame, { cursor: context.cursor });
        if (parsed.cursor) context.onCursor?.(parsed.cursor);
        for (const event of parsed.events) await context.onEvent(event);
        return { cursor: parsed.cursor };
      },
    },
    { sleep: async () => undefined },
  );

  const result = await controller.stream("run-sse", { reconnectDelayMs: 0 });
  assert.deepEqual(requests, [null, "cursor-1"]);
  assert.deepEqual(result, { cursor: "cursor-2", terminal: true });
});

test("owns send, stream-to-poll hydration, terminal errors, reconnect, and persisted user-message merging", async () => {
  type Message = SharedHomechatMessage & { id: string };
  type Run = { id: string; status: string; messages: Message[] };
  const persistedUser: Message = { id: "user-1", runId: "run-client", role: "user", content: "Hello" };
  const persistedAssistant: Message = { id: "assistant-1", runId: "run-client", role: "assistant", content: "Complete answer" };
  let reads = 0;
  let creates = 0;
  const controller = createHomechatClientController<Message, Run, { message: string }>({
    transport: {
      createRun: async () => {
        creates += 1;
        return { id: "run-client", status: "running", messages: [persistedUser] };
      },
      getRun: async () => {
        reads += 1;
        return reads > 1
          ? { id: "run-client", status: "completed", messages: [persistedUser, persistedAssistant] }
          : { id: "run-client", status: "running", messages: [persistedUser] };
      },
      stopRun: async () => ({ id: "run-client", status: "cancelled", messages: [persistedUser] }),
      streamRun: async (_runId, context) => {
        await context.onEvent({ id: "delta-client", type: "message.delta", runId: "run-client", text: "Complete" });
        throw new Error("network changed");
      },
    },
    runController: createHomechatRunController(
      {
        createRun: async () => {
          creates += 1;
          return { id: "run-client", status: "running", messages: [persistedUser] };
        },
        getRun: async () => {
          reads += 1;
          return reads > 1
            ? { id: "run-client", status: "completed", messages: [persistedUser, persistedAssistant] }
            : { id: "run-client", status: "running", messages: [persistedUser] };
        },
        stopRun: async () => ({ id: "run-client", status: "cancelled", messages: [persistedUser] }),
        streamRun: async (_runId, context) => {
          await context.onEvent({ id: "delta-client", type: "message.delta", runId: "run-client", text: "Complete" });
          throw new Error("network changed");
        },
      },
      { sleep: async () => undefined },
    ),
  });

  const state = await controller.send(
    { message: "Hello" },
    { optimisticMessage: { id: "local-1", role: "user", content: "Hello" }, maxReconnectAttempts: 0 },
  );
  assert.equal(creates, 1);
  assert.equal(state.phase, "completed");
  assert.equal(state.streamingText, "");
  assert.deepEqual(state.messages, [persistedUser, persistedAssistant]);

  controller.reset([]);
  const queued = await controller.send(
    { message: "Hello" },
    { follow: false, optimisticMessage: { id: "local-queued", role: "user", content: "Hello" } },
  );
  assert.equal(queued.phase, "waiting");
  assert.deepEqual(queued.messages, [persistedUser]);

  controller.reset([]);
  controller.dispatch({ type: "run.sending", optimisticMessage: { id: "local-stop", role: "user", content: "Hello" } });
  const stopped = await controller.stop("run-client");
  assert.equal(stopped.phase, "stopped");
  assert.deepEqual(stopped.messages, [persistedUser]);
});

test("loads paged conversation and job history through an injected transport", async () => {
  const requests: Array<string | null | undefined> = [];
  const controller = createHomechatHistoryController<SharedHomechatHistoryItem>({
    listHistory: async (request) => {
      requests.push(request.cursor);
      return request.cursor
        ? { cursor: null, items: [{ id: "job-1", kind: "job", title: "Job", updatedAt: "2026-01-02" }] }
        : { cursor: "next", items: [{ id: "chat-1", kind: "conversation", title: "Chat", updatedAt: "2026-01-01" }] };
    },
  });
  let state = await controller.refresh(createHomechatHistoryState());
  state = await controller.loadNext(state);
  assert.deepEqual(requests, [null, "next"]);
  assert.deepEqual(state.items.map((item) => item.id), ["chat-1", "job-1"]);
});

test("loads paged conversations and prepends older messages through an injected transport", async () => {
  type Conversation = { id: string; title: string };
  type PagedMessage = SharedHomechatMessage & { id: string };
  const controller = createHomechatConversationController<Conversation, PagedMessage>({
    createConversation: async () => ({ id: "chat-new", title: "New" }),
    listConversations: async (request) => request.cursor
      ? { cursor: null, items: [{ id: "chat-2", title: "Second" }] }
      : { cursor: "next", items: [{ id: "chat-1", title: "First" }] },
    listMessages: async (request) => request.cursor
      ? { cursor: null, items: [{ id: "message-1", role: "user" as const, content: "Older" }] }
      : { cursor: "older", items: [{ id: "message-2", role: "assistant" as const, content: "Newer" }] },
  });

  assert.equal((await controller.create({})).id, "chat-new");
  let conversations = await controller.refreshConversations(createHomechatPagedState());
  conversations = await controller.loadNextConversations(conversations);
  assert.deepEqual(conversations.items.map((item) => item.id), ["chat-1", "chat-2"]);

  let messages = await controller.refreshMessages(createHomechatPagedState(), { conversationId: "chat-1" });
  messages = await controller.loadOlderMessages(messages, { conversationId: "chat-1" });
  assert.deepEqual(messages.items.map((item) => item.id), ["message-1", "message-2"]);
});

test("owns full jobs CRUD, run, paging, history, and terminal lifecycle", async () => {
  let reads = 0;
  const historyItem: SharedHomechatJobHistoryItem = { id: "history-1", jobId: "job-1", status: "completed" };
  const jobs = createHomechatJobController(
    {
      cancelJob: async (id) => ({ id, status: "cancelled" }),
      createJob: async (request: { title: string }) => ({ id: "job-new", status: request.title ? "queued" : "failed" }),
      deleteJob: async () => undefined,
      getJob: async (id) => ({ id, status: reads++ ? "completed" : "running" }),
      listJobHistory: async () => ({ cursor: null, items: [historyItem] }),
      listJobs: async () => ({ cursor: null, items: [{ id: "job-1", status: "running" }] }),
      runJob: async (id) => ({ id: `${id}-run`, status: "queued" }),
      updateJob: async (id, request: { status: string }) => ({ id, status: request.status }),
    },
    { sleep: async () => undefined },
  );
  assert.equal((await jobs.create({ title: "Daily" })).id, "job-new");
  assert.equal((await jobs.update("job-1", { status: "paused" })).status, "paused");
  assert.equal((await jobs.run("job-1")).id, "job-1-run");
  assert.deepEqual((await jobs.list(createHomechatPagedState())).items.map((job) => job.id), ["job-1"]);
  assert.deepEqual((await jobs.history(createHomechatPagedState(), { jobId: "job-1" })).items, [historyItem]);
  assert.equal((await jobs.wait("job-1")).status, "completed");
  assert.equal((await jobs.cancel("job-1"))?.status, "cancelled");
  await jobs.delete("job-1");
});

test("coordinates permission, recording, and transcription adapters", async () => {
  const phases: string[] = [];
  const voice = createHomechatVoiceController({
    requestPermission: async () => true,
    startRecording: async () => ({ recording: "recording-1", mimeType: "audio/webm" }),
    stopRecording: async (recording) => `audio:${recording}`,
    transcribe: async (audio, context) => ({ text: `${audio}:${context.mimeType}` }),
  });
  const unsubscribe = voice.subscribe((state) => phases.push(state.phase));
  await voice.start();
  assert.deepEqual(await completeHomechatVoiceNote({ controller: voice, draft: "Context" }), {
    message: "Context\n\nVoice note:\n\naudio:recording-1:audio/webm",
    transcript: "audio:recording-1:audio/webm",
  });
  assert.equal(composeHomechatVoiceMessage({ draft: "Context", transcript: "Buy milk" }), "Context\n\nVoice note:\n\nBuy milk");
  assert.deepEqual(phases, ["idle", "requesting_permission", "recording", "stopping", "transcribing", "idle"]);
  unsubscribe();
});
