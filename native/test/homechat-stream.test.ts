import assert from "node:assert/strict";
import test from "node:test";

import { createHomechatClientState, reduceHomechatClientState } from "../../src/index";
import { createMobileHomechatEventStream, createUtf8ChunkDecoder } from "../src/homechat-stream";

test("releases a terminal Expo fetch reader without cancelling its native stream", async () => {
  const terminalEvent = new TextEncoder().encode(
    'id: cursor-final\nevent: run.status\ndata: {"runId":"run-1","state":"completed"}\n\n',
  );
  let completeNativeResponse: () => void = () => undefined;
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(terminalEvent);
      completeNativeResponse = () => controller.close();
    },
  });
  const stream = createMobileHomechatEventStream(async () => ({
    body,
    ok: true,
    status: 200,
    text: async () => "",
  }));

  const result = await stream("run-1", { onEvent: () => undefined });

  assert.deepEqual(result, { cursor: "cursor-final", terminal: true });
  assert.doesNotThrow(completeNativeResponse);
});

// HPD-2263: the HODL app's TextDecoder (fast-text-encoding) throws on `{ stream: true }`.
const NativeTextDecoder = globalThis.TextDecoder;
class NoStreamTextDecoder {
  private readonly inner = new NativeTextDecoder();
  decode(input?: Uint8Array, options?: { stream?: boolean }) {
    if (options?.stream) throw new Error("Failed to decode: the 'stream' option is unsupported.");
    return this.inner.decode(input);
  }
}

async function withNoStreamTextDecoder<T>(run: () => Promise<T>): Promise<T> {
  const original = globalThis.TextDecoder;
  (globalThis as { TextDecoder: unknown }).TextDecoder = NoStreamTextDecoder;
  try {
    return await run();
  } finally {
    globalThis.TextDecoder = original;
  }
}

test("HPD-2263: decodes the stream with a TextDecoder that has no stream option, also across a split character", async () => {
  const frames = new TextEncoder().encode(
    'id: 1\nevent: message.delta\ndata: {"type":"message.delta","id":"1","runId":"run-1","payload":{"messageId":"m","text":"Grüße €"}}\n\n' +
    'id: 2\nevent: run.status\ndata: {"type":"run.status","id":"2","runId":"run-1","payload":{"state":"completed"}}\n\n',
  );
  const cut = frames.indexOf(0xe2) + 1; // inside the three bytes of "€"
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(frames.slice(0, cut));
      controller.enqueue(frames.slice(cut));
      controller.close();
    },
  });
  const texts: string[] = [];
  const result = await withNoStreamTextDecoder(() => createMobileHomechatEventStream(async () => ({ body, ok: true, status: 200, text: async () => "" }))(
    "run-1",
    { onEvent: (event) => { const e = event as { type: string; text?: string }; if (e.type === "message.delta") texts.push(e.text ?? ""); } },
  ));
  assert.deepEqual(result, { cursor: "2", terminal: true });
  assert.deepEqual(texts, ["Grüße €"]);
});

test("HPD-2263: a stream that fails before its terminal event cancels its request", async () => {
  let cancelled = 0;
  let released = 0;
  const reader = {
    read: async () => ({ done: false, value: new TextEncoder().encode('data: {"type":"message.delta","runId":"other-run","payload":{"text":"x"}}\n\n') }),
    cancel: async () => { cancelled += 1; },
    releaseLock: () => { released += 1; },
  };
  const stream = createMobileHomechatEventStream(async () => ({
    body: { getReader: () => reader } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>,
    ok: true,
    status: 200,
    text: async () => "",
  }));
  await assert.rejects(stream("run-1", { onEvent: () => undefined }), /crossed the active run boundary/);
  assert.equal(cancelled, 1);
  assert.equal(released, 0);
});

test("HPD-2263: a stream the server closes without a terminal event is cancelled, a terminal one only released", async () => {
  let cancelled = 0;
  const open = async () => ({
    body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: async () => { cancelled += 1; }, releaseLock: () => undefined }) } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>,
    ok: true, status: 200, text: async () => "",
  });
  const result = await createMobileHomechatEventStream(open)("run-1", { onEvent: () => undefined });
  assert.equal(result?.terminal, false);
  assert.equal(cancelled, 1);
});

test("HPD-2263: the UTF-8 chunk decoder holds back an incomplete character", () => {
  const decoder = createUtf8ChunkDecoder(new NoStreamTextDecoder());
  const bytes = new TextEncoder().encode("a😀b");
  assert.equal(decoder.push(bytes.slice(0, 3)), "a");
  assert.equal(decoder.push(bytes.slice(3, 5)), "😀");
  assert.equal(decoder.push(bytes.slice(5)), "b");
  assert.equal(decoder.finish(), "");
});

// HPD-2263, live check 2026-11-21: while the engine's answer streamed, characters
// went missing ("rypto", "follows6.5%", "a7% day"); the completed answer was right.
// The engine sends every delta as new text only, one SSE frame each. The shared
// draft merge drops a delta it already finds in the draft ("c", " ", " −").

const ENGINE_DELTAS = ["The ", "c", "rypto", " trades", " fell. That follows", " ", "6.5%", " yesterday, a", " −", "7% day", " for Bitcoin."];
const ENGINE_TEXT = ENGINE_DELTAS.join("");

function engineFrames(deltas: readonly string[], firstSeq = 1, terminal = true) {
  let seq = firstSeq;
  let frames = "retry: 1500\n\n";
  for (const text of deltas) {
    const event = { type: "message.delta", id: String(seq), runId: "run-1", payload: { messageId: "m", text }, createdAt: "2026-11-21T08:49:51.000Z" };
    frames += `id: ${seq}\nevent: message.delta\ndata: ${JSON.stringify(event)}\n\n`;
    seq += 1;
  }
  if (terminal) {
    frames += `: keepalive 1\n\nid: ${seq}\nevent: run.status\ndata: ${JSON.stringify({ type: "run.status", id: String(seq), runId: "run-1", payload: { state: "completed" }, createdAt: "x" })}\n\n`;
  }
  return new TextEncoder().encode(frames);
}

/** Bytes in pieces of `size`, cutting lines, events and multi-byte characters. */
function chunked(bytes: Uint8Array, size: number) {
  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      for (let index = 0; index < bytes.length; index += size) controller.enqueue(bytes.slice(index, index + size));
      controller.close();
    },
  });
}

async function streamedDrafts(options: { deltaMode?: "append" }, size: number) {
  let state = createHomechatClientState();
  const drafts: string[] = [];
  const stream = createMobileHomechatEventStream(async () => ({ body: chunked(engineFrames(ENGINE_DELTAS), size), ok: true, status: 200, text: async () => "" }), options);
  const result = await stream("run-1", {
    onEvent: (event) => {
      state = reduceHomechatClientState(state, { type: "run.event", event });
      if ((event as { type?: string }).type === "message.delta") drafts.push(state.streamingText);
    },
  });
  return { drafts, result };
}

test("HPD-2263: the shared merge loses short engine deltas without the append mode (the live symptom)", async () => {
  const { drafts } = await streamedDrafts({}, 4096);
  assert.notEqual(drafts.at(-1), ENGINE_TEXT);
  assert.match(drafts.at(-1) ?? "", /follows6\.5%/);
});

test("HPD-2263: in append mode every streamed draft is the exact text so far, however the bytes are cut", async () => {
  for (const size of [1, 2, 3, 5, 7, 13, 64, 4096]) {
    const { drafts, result } = await streamedDrafts({ deltaMode: "append" }, size);
    assert.equal(result && result.terminal, true);
    assert.equal(drafts.length, ENGINE_DELTAS.length);
    drafts.forEach((draft, index) => assert.equal(draft, ENGINE_DELTAS.slice(0, index + 1).join(""), `chunk ${size}, delta ${index}`));
  }
});

test("HPD-2263: append mode keeps the draft across a resumed stream and starts over on a full replay", async () => {
  const seen: string[] = [];
  const responses = [
    engineFrames(ENGINE_DELTAS.slice(0, 4), 1, false),
    engineFrames(ENGINE_DELTAS.slice(4), 5, true),
    engineFrames(ENGINE_DELTAS, 1, true),
  ];
  const stream = createMobileHomechatEventStream(
    async () => ({ body: chunked(responses.shift()!, 9), ok: true, status: 200, text: async () => "" }),
    { deltaMode: "append" },
  );
  const onEvent = (event: { type: string; text?: string; replace?: boolean }) => {
    if (event.type === "message.delta") {
      assert.equal(event.replace, true);
      seen.push(event.text ?? "");
    }
  };
  const first = await stream("run-1", { onEvent: onEvent as never });
  assert.deepEqual(first, { cursor: "4", terminal: false });
  await stream("run-1", { cursor: "4", onEvent: onEvent as never });
  assert.equal(seen.at(-1), ENGINE_TEXT);
  seen.length = 0;
  await stream("run-1", { cursor: null, onEvent: onEvent as never });
  assert.equal(seen[0], ENGINE_DELTAS[0]);
  assert.equal(seen.at(-1), ENGINE_TEXT);
});

test("HPD-2263: append mode follows a retraction and a replace delta", async () => {
  const frames = (events: Record<string, unknown>[]) => new TextEncoder().encode(events.map((payload, index) =>
    `id: ${index + 1}\nevent: message.delta\ndata: ${JSON.stringify({ type: "message.delta", id: String(index + 1), runId: "run-1", payload })}\n\n`).join(""));
  const seen: { text: string; retracted: boolean }[] = [];
  const stream = createMobileHomechatEventStream(async () => ({
    body: chunked(frames([{ text: "Draft" }, { text: "", retracted: true }, { text: "A" }, { text: "B" }, { text: "Kept", replace: true }, { text: "!" }]), 5),
    ok: true, status: 200, text: async () => "",
  }), { deltaMode: "append" });
  await stream("run-1", {
    onEvent: ((event: { type: string; text: string; payload: Record<string, unknown> }) => {
      if (event.type === "message.delta") seen.push({ text: event.text, retracted: event.payload.retracted === true });
    }) as never,
  });
  assert.deepEqual(seen, [
    { text: "Draft", retracted: false },
    { text: "", retracted: true },
    { text: "A", retracted: false },
    { text: "AB", retracted: false },
    { text: "Kept", retracted: false },
    { text: "Kept!", retracted: false },
  ]);
});
