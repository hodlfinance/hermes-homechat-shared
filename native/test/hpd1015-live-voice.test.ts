import assert from "node:assert/strict";
import test from "node:test";
import { createMobileLiveVoiceController, liveVoiceActive, liveVoiceStartVisible, type NativeLiveVoiceHandle, type NativeLiveVoicePort } from "../src/mobile-live-voice";

test("voice start follows empty composer; End remains active while typing", () => {
  for (const text of ["", "  \n"]) assert.equal(liveVoiceStartVisible(text, true, "idle"), true);
  assert.equal(liveVoiceStartVisible("Hi", true, "idle"), false);
  assert.equal(liveVoiceStartVisible("", false, "idle"), false);
  assert.equal(liveVoiceStartVisible("", true, "speaking"), false);
  assert.equal(liveVoiceActive("speaking"), true);
  assert.equal(liveVoiceStartVisible("", true, "error"), true);
});

test("double Start and End during handshake close the late connection once", async () => {
  let starts = 0, ended = 0, changed = 0;
  let resolve!: (handle: NativeLiveVoiceHandle) => void;
  let operation!: Parameters<NativeLiveVoicePort["start"]>[0];
  const controller = createMobileLiveVoiceController({ start(input) {
    starts++; operation = input; return new Promise((done) => { resolve = done; });
  } });
  const input = { token: "test-session", conversationId: "home", onConversationChanged() { changed++; } };
  const opening = controller.start(input);
  await controller.start(input);
  const ending = controller.end();
  assert.equal(operation.signal.aborted, true);
  assert.equal(controller.state().phase, "ending");
  await controller.start(input);
  operation.onState({ phase: "speaking" }); operation.onConversationChanged();
  resolve({ async end() { ended++; } });
  await Promise.all([opening, ending]);
  assert.equal(starts, 1); assert.equal(ended, 1); assert.equal(changed, 0);
  assert.equal(controller.state().phase, "idle");
});

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};

test("delayed handle cleanup blocks another Start and stale callbacks cannot change a later session", async () => {
  const cleanup = deferred();
  let starts = 0, openHandles = 0, maximumOpen = 0, ends = 0;
  const callbacks: Parameters<NativeLiveVoicePort["start"]>[0][] = [];
  const controller = createMobileLiveVoiceController({ async start(input) {
    callbacks.push(input); starts++; openHandles++; maximumOpen = Math.max(maximumOpen, openHandles);
    const first = starts === 1;
    return { async end() { ends++; if (first) await cleanup.promise; openHandles--; } };
  } });
  const input = { token: "session", conversationId: "home", onConversationChanged() {} };
  await controller.start(input);
  const ending = controller.end();
  const repeatedEnd = controller.end();
  await controller.start(input);
  assert.equal(starts, 1); assert.equal(openHandles, 1);
  assert.equal(liveVoiceStartVisible("", true, controller.state().phase), false);
  callbacks[0]!.onState({ phase: "listening" });
  assert.equal(controller.state().phase, "ending");
  cleanup.resolve(); await Promise.all([ending, repeatedEnd]);
  await controller.start(input);
  callbacks[1]!.onState({ phase: "speaking" }); callbacks[0]!.onState({ phase: "idle" });
  assert.equal(controller.state().phase, "speaking");
  assert.equal(maximumOpen, 1); assert.equal(ends, 1);
  await controller.end();
  assert.equal(openHandles, 0); assert.equal(ends, 2);
});

test("terminal callback during handshake retains ownership through late handle cleanup", async () => {
  const ready = deferred(), cleanup = deferred();
  let starts = 0, ends = 0;
  let first!: Parameters<NativeLiveVoicePort["start"]>[0];
  const controller = createMobileLiveVoiceController({ async start(input) {
    starts++;
    if (starts === 1) {
      first = input; input.onState({ phase: "error" }); await ready.promise;
      return { async end() { ends++; await cleanup.promise; } };
    }
    return { async end() { ends++; } };
  } });
  const input = { token: "session", conversationId: "home", onConversationChanged() {} };
  const opening = controller.start(input);
  await Promise.resolve();
  assert.equal(controller.state().phase, "ending");
  await controller.start(input); assert.equal(starts, 1);
  ready.resolve(); await ready.promise; await Promise.resolve();
  await controller.start(input); assert.equal(starts, 1);
  cleanup.resolve(); await opening;
  assert.equal(controller.state().phase, "error"); assert.equal(ends, 1);
  await controller.start(input);
  first.onState({ phase: "error" });
  assert.equal(controller.state().phase, "listening");
  assert.equal(starts, 2);
  await controller.end();
});

test("provider failure releases the failed start; a later account can start", async () => {
  let fail = true;
  const tokens: string[] = [];
  const controller = createMobileLiveVoiceController({ async start(input) {
    tokens.push(input.token); if (fail) throw new Error("provider-detail-must-not-leak");
    return { async end() {} };
  } });
  const input = { token: "account-one", conversationId: "home", onConversationChanged() {} };
  await controller.start(input);
  assert.deepEqual(controller.state(), { phase: "error" });
  await controller.end(); fail = false;
  await controller.start({ ...input, token: "account-two" });
  assert.deepEqual(tokens, ["account-one", "account-two"]);
  assert.equal(controller.state().phase, "listening");
  await controller.end();
});
