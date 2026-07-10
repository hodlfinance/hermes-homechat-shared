import assert from "node:assert/strict";
import test from "node:test";
import {
  SharedHomechatRunControllerError,
  completeHomechatVoiceNote,
  composeHomechatVoiceMessage,
  createHomechatClientState,
  createHomechatComposerController,
  createHomechatHistoryController,
  createHomechatHistoryState,
  createHomechatJobController,
  createHomechatRunController,
  createHomechatVoiceController,
  homechatTranscriptMessages,
  isUserVisibleHomechatEvent,
  legacyHomechatRunEvent,
  mergeHomechatMessages,
  nextHomechatStreamingText,
  normalizeHomechatRunEvent,
  parseHomechatEventStream,
  reduceHomechatClientState,
  type SharedHomechatHistoryItem,
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
  if (status?.type === "run.status") assert.equal(status.payload.status, "waiting_for_approval");

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

test("marks source, artifact, and action updates as user-visible product events", () => {
  assert.equal(isUserVisibleHomechatEvent({ type: "sources.update" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "artifact.update" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "action.proposal" }), true);
  assert.equal(isUserVisibleHomechatEvent({ type: "message.delta" }), false);
});

test("preserves meaningful leading whitespace in streamed delta segments", () => {
  assert.equal(
    nextHomechatStreamingText("Die erste Hälfte", { delta: " und die zweite Hälfte." }),
    "Die erste Hälfte und die zweite Hälfte.",
  );
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

test("uses the shared job lifecycle controller", async () => {
  let reads = 0;
  const jobs = createHomechatJobController(
    { getJob: async (id) => ({ id, status: reads++ ? "completed" : "running" }) },
    { sleep: async () => undefined },
  );
  assert.equal((await jobs.wait("job-1")).status, "completed");
});

test("coordinates permission, recording, and transcription adapters", async () => {
  const voice = createHomechatVoiceController({
    requestPermission: async () => true,
    startRecording: async () => ({ recording: "recording-1", mimeType: "audio/webm" }),
    stopRecording: async (recording) => `audio:${recording}`,
    transcribe: async (audio, context) => ({ text: `${audio}:${context.mimeType}` }),
  });
  await voice.start();
  assert.deepEqual(await completeHomechatVoiceNote({ controller: voice, draft: "Context" }), {
    message: "Context\n\nVoice note:\n\naudio:recording-1:audio/webm",
    transcript: "audio:recording-1:audio/webm",
  });
  assert.equal(composeHomechatVoiceMessage({ draft: "Context", transcript: "Buy milk" }), "Context\n\nVoice note:\n\nBuy milk");
});
