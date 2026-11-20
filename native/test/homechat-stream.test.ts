import assert from "node:assert/strict";
import test from "node:test";

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
