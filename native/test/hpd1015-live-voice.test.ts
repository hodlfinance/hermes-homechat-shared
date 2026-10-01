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
  await controller.end();
  assert.equal(operation.signal.aborted, true);
  operation.onState({ phase: "speaking" }); operation.onConversationChanged();
  resolve({ async end() { ended++; } });
  await opening;
  assert.equal(starts, 1); assert.equal(ended, 1); assert.equal(changed, 0);
  assert.equal(controller.state().phase, "idle");
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
