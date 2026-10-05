import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { permitsHodlNativeR8Request } from "../policy";
import { createLiveVoicePort, createWebRtcLiveVoicePlatform, LiveVoiceStartError, startLiveVoice, type LiveVoicePlatform, type LiveVoiceWebRtcModules } from "../src/live-voice-client";
import { createMobileLiveVoiceController, liveVoiceNotice } from "../src/mobile-live-voice";

// HPD-1041: HODL live voice through the native R8 path.

const sessionId = "6f0c1b2a-3d4e-4f50-8a6b-7c8d9e0f1a2b";

test("the HODL R8 policy permits exactly the three live voice call routes", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/voice/realtime/calls"), true);
  assert.equal(permitsHodlNativeR8Request("GET", `/voice/realtime/calls/${sessionId}`), true);
  assert.equal(permitsHodlNativeR8Request("DELETE", `/voice/realtime/calls/${sessionId}`), true);
  for (const [method, path] of [
    ["GET", "/voice/realtime/calls"], ["PUT", `/voice/realtime/calls/${sessionId}`], ["POST", `/voice/realtime/calls/${sessionId}`],
    ["GET", "/voice/realtime/calls/not-a-session"], ["DELETE", `/voice/realtime/calls/${sessionId}/extra`],
    ["GET", "/voice/realtime/calls/6f0c1b2a-3d4e-1f50-8a6b-7c8d9e0f1a2b"], ["POST", "/voice/realtime/session"],
    ["DELETE", "/voice/realtime/calls/%2e%2e"],
  ] as const) assert.equal(permitsHodlNativeR8Request(method, path), false, `${method} ${path}`);
});

test("the shared voice client imports no Expo or native SDK module", () => {
  const source = readFileSync(new URL("../src/live-voice-client.ts", import.meta.url), "utf8");
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(match => match[1]);
  assert.deepEqual(imports, ["./mobile-live-voice"]);
});

type Call = { url: string; method: string; body?: Record<string, unknown>; headers: Record<string, string> };
function fakePlatform(): LiveVoicePlatform & { closed: number } {
  const platform = { closed: 0, id: () => sessionId,
    async open() { return { offer: "v=0\r\noffer", async answer() {}, close() { platform.closed++; } }; } };
  return platform;
}
function fakeFetch(answers: Array<(call: Call) => Response>, calls: Call[]): typeof fetch {
  return (async (url: string, init: RequestInit = {}) => {
    const call = { url: String(url), method: init.method ?? "GET", headers: init.headers as Record<string, string>,
      ...(init.body ? { body: JSON.parse(String(init.body)) } : {}) };
    calls.push(call);
    if (call.method === "DELETE") return new Response(null, { status: 204 });
    const answer = answers.shift();
    if (!answer) return new Response(JSON.stringify({ sessionId, model: "gpt-realtime-2.1-mini", phase: "listening", revision: 0 }), { status: 200 });
    return answer(call);
  }) as typeof fetch;
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

test("a HODL call names finhermes with its local hodl_mobile channel and the user's bearer", async () => {
  const calls: Call[] = [], states: string[] = [];
  const fetchImpl = fakeFetch([() => json(201, { sessionId, model: "gpt-realtime-2.1-mini", phase: "listening", revision: 0, sdp: "v=0\r\nanswer" })], calls);
  const handle = await startLiveVoice({ baseUrl: "https://finhermes.example/api/hermes/native-r8/", token: "hodl-session",
    conversationId: "home", binding: { surface: "finhermes", channel: "hodl_mobile" }, signal: new AbortController().signal,
    platform: fakePlatform(), fetchImpl, onState: state => states.push(state.phase), onConversationChanged() {} });
  assert.equal(calls[0]!.url, "https://finhermes.example/api/hermes/native-r8/voice/realtime/calls");
  assert.deepEqual(calls[0]!.body, { sessionId, conversationId: "home", surface: "finhermes", channel: "hodl_mobile",
    model: "gpt-realtime-2.1-mini", sdp: "v=0\r\noffer" });
  assert.equal(calls[0]!.headers.Authorization, "Bearer hodl-session");
  await handle.end();
  assert.equal(calls.at(-1)!.method, "DELETE");
  assert.equal(calls.at(-1)!.url, `https://finhermes.example/api/hermes/native-r8/voice/realtime/calls/${sessionId}`);
  // Listening only once this device's audio path is up.
  assert.equal(states[0], "connecting");
  assert.ok(states.includes("listening"));
});

test("a start refused by the daily voice limit is final and says so", async () => {
  const calls: Call[] = [], platform = fakePlatform();
  const fetchImpl = fakeFetch([() => json(429, { code: "voice_daily_limit", error: "You have used today's live voice time." })], calls);
  await assert.rejects(startLiveVoice({ baseUrl: "https://bff.example", token: "t", conversationId: "home",
    binding: { surface: "finhermes", channel: "hodl_mobile" }, signal: new AbortController().signal, platform, fetchImpl,
    onState() {}, onConversationChanged() {} }), (error: unknown) => error instanceof LiveVoiceStartError
      && error.code === "voice_daily_limit" && error.limit === "daily_limit");
  assert.equal(calls.filter(call => call.method === "POST").length, 1);
  assert.equal(platform.closed, 1);
});

test("the controller shows the daily-limit notice after a refused start, and the time-limit notice after a limit end", async () => {
  const refused = createMobileLiveVoiceController({ async start() { throw new LiveVoiceStartError("refused", "voice_daily_limit", "daily_limit"); } });
  await refused.start({ token: "t", conversationId: "home", onConversationChanged() {} });
  assert.deepEqual(refused.state(), { phase: "error", endedReason: "daily_limit" });
  assert.match(liveVoiceNotice("de", refused.state())!, /Sprachzeit für heute ist aufgebraucht/);
  assert.match(liveVoiceNotice("en", refused.state())!, /keep typing/);

  const calls: Call[] = [];
  const fetchImpl = fakeFetch([
    () => json(201, { sessionId, model: "gpt-realtime-2.1-mini", phase: "listening", revision: 0, sdp: "v=0\r\nanswer" }),
    () => json(200, { sessionId, model: "gpt-realtime-2.1-mini", phase: "idle", revision: 1, endedReason: "call_limit" }),
  ], calls);
  const port = createLiveVoicePort({ baseUrl: "https://bff.example", fetchImpl, platform: fakePlatform(),
    binding: { surface: "finhermes", channel: "hodl_mobile" } });
  const controller = createMobileLiveVoiceController(port);
  const ended = new Promise<void>(done => controller.subscribe(state => { if (state.endedReason) done(); }));
  await controller.start({ token: "t", conversationId: "home", onConversationChanged() {} });
  await ended;
  assert.deepEqual(controller.state(), { phase: "idle", endedReason: "call_limit" });
  assert.match(liveVoiceNotice("en", controller.state())!, /time limit/);
  assert.equal(liveVoiceNotice("en", { phase: "idle" }), null);
  assert.ok(calls.some(call => call.method === "DELETE"));
});

test("the WebRTC adapter uses only the injected modules and releases media on close", async () => {
  const log: string[] = [];
  const track = { stop() { log.push("track.stop"); } };
  let peerState: { onconnectionstatechange: (() => void) | null; connectionState: string } | null = null;
  let channel: { onopen: (() => void) | null } = { onopen: null };
  const modules: LiveVoiceWebRtcModules = {
    createPeer() {
      const peer = { connectionState: "new", onconnectionstatechange: null as (() => void) | null,
        addTransceiver: () => ({ sender: { async replaceTrack() { log.push("replaceTrack"); } } }),
        createDataChannel: () => channel,
        async createOffer() { return { type: "offer", sdp: "v=0\r\nnative-offer" }; },
        async setLocalDescription() { log.push("local"); },
        async setRemoteDescription(description: unknown) { log.push(`remote:${(description as { sdp: string }).sdp}`); },
        close() { log.push("peer.close"); } };
      peerState = peer; return peer;
    },
    createAnswer: sdp => ({ type: "answer", sdp }),
    async getUserMedia() { log.push("capture"); return { getTracks: () => [track], getAudioTracks: () => [track] }; },
    async requestMicrophone() { log.push("permission"); return true; },
    randomUUID: () => sessionId,
    audio: { beforeCapture() { log.push("route.start"); }, afterAnswer() { log.push("speaker"); }, afterClose() { log.push("route.stop"); } },
  };
  const platform = createWebRtcLiveVoicePlatform(modules);
  assert.equal(platform.id(), sessionId);
  const connection = await platform.open({ signal: new AbortController().signal, onFailure() {} });
  assert.equal(connection.offer, "v=0\r\nnative-offer");
  await connection.answer("v=0\r\nanswer");
  channel.onopen?.(); peerState!.connectionState = "connected"; peerState!.onconnectionstatechange?.();
  await connection.ready;
  assert.deepEqual(log, ["local", "permission", "route.start", "capture", "replaceTrack", "remote:v=0\r\nanswer", "speaker"]);
  await connection.close();
  assert.deepEqual(log.slice(-3), ["track.stop", "peer.close", "route.stop"]);
});

test("a denied microphone fails the start without leaking media", async () => {
  const log: string[] = [];
  const platform = createWebRtcLiveVoicePlatform({
    createPeer: () => ({ connectionState: "new", onconnectionstatechange: null,
      addTransceiver: () => ({ sender: { async replaceTrack() {} } }), createDataChannel: () => ({ onopen: null }),
      async createOffer() { return { sdp: "v=0\r\no" }; }, async setLocalDescription() {}, async setRemoteDescription() {},
      close() { log.push("peer.close"); } }),
    createAnswer: sdp => sdp, async getUserMedia() { log.push("capture"); throw new Error("unexpected"); },
    async requestMicrophone() { return false; }, randomUUID: () => sessionId,
  });
  const connection = await platform.open({ signal: new AbortController().signal, onFailure() {} });
  await assert.rejects(connection.ready!);
  assert.equal(log.includes("capture"), false);
  await connection.close();
  assert.deepEqual(log, ["peer.close"]);
});
