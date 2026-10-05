import type { NativeLiveVoiceLimit, NativeLiveVoicePort } from "./mobile-live-voice";

/** HPD-1041: the live voice client both products can use, without Expo.
 * It is the Hey HPD-1015 transport (`@hermes/core/live-voice` in hey-hermes)
 * with the canonical binding as a parameter, plus a WebRTC adapter whose
 * native modules the host injects. A bare React Native host (HODL) passes
 * react-native-webrtc and its own permission and audio-route modules; this
 * package never imports a native SDK (see native/README.md).
 */
export type LiveVoicePhase = "idle" | "connecting" | "listening" | "waiting" | "speaking" | "error";
export type LiveVoiceConnection = {
  offer: string; answer(sdp: string): Promise<void>; close(): Promise<void> | void;
  /** Resolves once audio really flows both ways: peer connected, event
   * channel open and the microphone attached. Absent means no separate signal. */
  ready?: Promise<void>;
};
export type LiveVoicePlatform = {
  id(): string;
  open(input: { signal: AbortSignal; onFailure(): void }): Promise<LiveVoiceConnection>;
};
/** The binding the request names. HODL sends its local channel; its BFF
 * rewrites hodl_mobile to the registered upstream finhermes_web. */
export type LiveVoiceBinding =
  | { surface: "hey_hermes"; channel: "hey_hermes_mobile" | "hey_hermes_web" }
  | { surface: "finhermes"; channel: "hodl_mobile" };
type Status = { sessionId: string; model: string; phase: LiveVoicePhase; revision: number; endedReason?: NativeLiveVoiceLimit };
const model = "gpt-realtime-2.1-mini";
const phases: readonly string[] = ["idle", "connecting", "listening", "waiting", "speaking", "error"];
const limits: readonly string[] = ["call_limit", "daily_limit"];
/** The Plane ends a call after three failed status reads in a row; the client tolerates the same. */
export const LIVE_VOICE_STATUS_FAILURE_LIMIT = 3;
/** How long the audio path may take to come up after the answer. */
export const LIVE_VOICE_READY_TIMEOUT_MS = 20_000;
/** How long a WebRTC "disconnected" may last before the call is lost. */
export const LIVE_VOICE_DISCONNECT_GRACE_MS = 5_000;

class TransientStatusError extends Error {}
/** A start the Plane refused with a named reason, such as the daily voice limit. */
export class LiveVoiceStartError extends Error {
  constructor(message: string, readonly code?: string, readonly limit?: NativeLiveVoiceLimit) { super(message); }
}
function status(value: unknown, id: string): Status {
  const data = value as Status | undefined;
  if (!data || data.sessionId !== id || data.model !== model ||
      !phases.includes(data.phase) || !Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error("Voice is unavailable.");
  return data;
}
const endedReason = (value: Status) => typeof value.endedReason === "string" && limits.includes(value.endedReason) ? value.endedReason : undefined;

/** Tracks the three facts that make an audio call usable. A brief WebRTC
 * "disconnected" is transient; only "failed"/"closed" or a disconnect
 * outlasting the grace period is a loss. Before readiness a loss rejects
 * `ready`; afterwards it calls onFailure. */
export function createLiveVoiceLink(onFailure: () => void, graceMs = LIVE_VOICE_DISCONNECT_GRACE_MS) {
  let connected = false, channel = false, microphone = false, settled = false, lost = false;
  let grace: ReturnType<typeof setTimeout> | null = null;
  let resolve!: () => void, reject!: (error: Error) => void;
  const ready = new Promise<void>((done, failed) => { resolve = done; reject = failed; });
  ready.catch(() => undefined);
  const clear = () => { if (grace) { clearTimeout(grace); grace = null; } };
  const check = () => { if (!settled && !lost && connected && channel && microphone) { settled = true; resolve(); } };
  const fail = () => {
    clear(); if (lost) return; lost = true;
    if (!settled) { settled = true; reject(new Error("Voice audio could not connect.")); } else onFailure();
  };
  return {
    ready,
    connectionState(state: string) {
      if (lost) return;
      if (state === "connected") { clear(); connected = true; check(); }
      else if (state === "disconnected") { if (!grace) grace = setTimeout(fail, graceMs); }
      else if (state === "failed" || state === "closed") fail();
    },
    channelOpen() { channel = true; check(); },
    microphone(ok: boolean) { if (ok) { microphone = true; check(); } else fail(); },
    dispose() { clear(); lost = true; },
  };
}

/** Provider authority, accepted work and usage stay on the authenticated
 * Plane; no client tool sends. Never reconnect or resubmit an accepted request
 * from a transport failure. */
export async function startLiveVoice(input: {
  baseUrl: string; token: string; conversationId: string; binding: LiveVoiceBinding;
  signal: AbortSignal; platform: LiveVoicePlatform; fetchImpl?: typeof fetch;
  onState(state: { phase: LiveVoicePhase; endedReason?: NativeLiveVoiceLimit }): void; onConversationChanged(): void;
}): Promise<{ end(): Promise<void> }> {
  const fetcher = input.fetchImpl ?? fetch, id = input.platform.id();
  const root = `${input.baseUrl.replace(/\/$/, "")}/voice/realtime/calls`;
  const operation = new AbortController();
  const headers = { ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}), "Content-Type": "application/json" };
  let connection: LiveVoiceConnection | null = null, ending: Promise<void> | null = null;
  let closed = false, revision = 0, timer: ReturnType<typeof setTimeout> | null = null;
  let audioReady = false, serverPhase: LiveVoicePhase = "connecting", failures = 0;
  let refusal: LiveVoiceStartError | null = null;
  let markEnded!: () => void;
  const ended = new Promise<void>(done => { markEnded = done; });
  const report = (phase: LiveVoicePhase, reason?: NativeLiveVoiceLimit) => {
    serverPhase = phase;
    input.onState({ phase: !audioReady && (phase === "listening" || phase === "waiting" || phase === "speaking") ? "connecting" : phase,
      ...(reason ? { endedReason: reason } : {}) });
  };
  const end = () => {
    if (ending) return ending;
    closed = true; markEnded(); operation.abort(); if (timer) clearTimeout(timer);
    input.signal.removeEventListener("abort", aborted);
    let audioCloseFailed = false;
    const localClose = (async () => {
      try { await connection?.close(); }
      catch { audioCloseFailed = true; }
    })();
    ending = (async () => {
      const cleanup = new AbortController(), timeout = setTimeout(() => cleanup.abort(), 35_000);
      let serverCloseFailed = false;
      try {
        const response = await fetcher(`${root}/${encodeURIComponent(id)}`, { method: "DELETE", headers, credentials: "omit", signal: cleanup.signal });
        if (!response.ok) serverCloseFailed = true;
      } catch { serverCloseFailed = true; }
      finally {
        clearTimeout(timeout); await localClose;
        if (audioCloseFailed || serverCloseFailed) {
          input.onState({ phase: "error" });
          throw new Error(audioCloseFailed ? "Voice audio cleanup could not be confirmed." : "Voice connection cleanup could not be confirmed.");
        }
      }
    })();
    return ending;
  };
  const aborted = () => { void end().catch(() => undefined); };
  const fail = () => { if (!closed) { input.onState({ phase: "error" }); void end().catch(() => undefined); } };
  input.signal.addEventListener("abort", aborted, { once: true });
  const request = async (url: string, init: RequestInit) => {
    const own = new AbortController(), cancel = () => own.abort();
    operation.signal.addEventListener("abort", cancel, { once: true });
    const timeout = setTimeout(cancel, 30_000);
    try {
      let response: Response;
      try { response = await fetcher(url, { ...init, headers, credentials: "omit", signal: own.signal }); }
      catch { throw new TransientStatusError("Voice status is unavailable."); }
      if (init.method === "POST" && (response.status === 429 || response.status === 403)) {
        // HPD-1041: a named refusal (daily voice limit, exhausted allowance) is final, not transient.
        const body = await response.json().catch(() => null) as { code?: unknown; error?: unknown } | null;
        const code = typeof body?.code === "string" ? body.code : undefined;
        refusal = new LiveVoiceStartError(typeof body?.error === "string" ? body.error : "Voice is unavailable.", code,
          code === "voice_daily_limit" ? "daily_limit" : undefined);
        throw refusal;
      }
      if (response.status >= 500 || response.status === 408 || response.status === 429) throw new TransientStatusError("Voice status is unavailable.");
      if (!response.ok) throw new Error("Voice is unavailable.");
      return await response.json() as unknown;
    } finally { clearTimeout(timeout); operation.signal.removeEventListener("abort", cancel); }
  };
  const observe = async () => {
    if (closed) return;
    try {
      const next = status(await request(`${root}/${encodeURIComponent(id)}`, { method: "GET" }), id);
      if (closed) return;
      failures = 0;
      if (next.revision > revision) { revision = next.revision; input.onConversationChanged(); }
      report(next.phase, endedReason(next));
      if (next.phase === "idle" || next.phase === "error") { await end(); return; }
    } catch (error) {
      if (closed) return;
      if (!(error instanceof TransientStatusError) || ++failures >= LIVE_VOICE_STATUS_FAILURE_LIMIT) { fail(); return; }
    }
    if (!closed) timer = setTimeout(() => void observe(), 2_000);
  };
  try {
    if (input.signal.aborted) throw new Error("Voice start cancelled.");
    input.onState({ phase: "connecting" });
    connection = await input.platform.open({ signal: operation.signal, onFailure: fail });
    if (closed || input.signal.aborted) { await connection.close(); throw new Error("Voice start cancelled."); }
    const raw = await request(root, { method: "POST", body: JSON.stringify({ sessionId: id, conversationId: input.conversationId,
      surface: input.binding.surface, channel: input.binding.channel, model, sdp: connection.offer }) });
    const next = status(raw, id), sdp = (raw as { sdp?: unknown }).sdp;
    if (typeof sdp !== "string" || !sdp.startsWith("v=0")) throw new Error("Voice is unavailable.");
    if (closed) throw new Error("Voice start cancelled.");
    await connection.answer(sdp);
    if (closed) throw new Error("Voice start cancelled.");
    revision = next.revision; report(next.phase);
    timer = setTimeout(() => void observe(), 2_000);
    if (connection.ready) {
      let readyTimer: ReturnType<typeof setTimeout> | null = null;
      try {
        await Promise.race([connection.ready, ended, new Promise<never>((_, reject) => {
          readyTimer = setTimeout(() => reject(new Error("Voice audio did not connect.")), LIVE_VOICE_READY_TIMEOUT_MS);
        })]);
      } finally { if (readyTimer) clearTimeout(readyTimer); }
    }
    if (closed) throw new Error("Voice start cancelled.");
    audioReady = true; report(serverPhase);
    return { end };
  } catch {
    await end().catch(() => undefined);
    const refused = refusal as LiveVoiceStartError | null;
    if (refused) throw refused;
    throw new LiveVoiceStartError("Voice could not connect. You can keep typing or try again.");
  }
}

/** The structural subset of react-native-webrtc this adapter uses. */
export type LiveVoiceWebRtcTrack = { stop(): void };
export type LiveVoiceWebRtcStream = { getTracks(): LiveVoiceWebRtcTrack[]; getAudioTracks(): LiveVoiceWebRtcTrack[] };
export type LiveVoiceWebRtcPeer = {
  connectionState: string;
  onconnectionstatechange: (() => void) | null;
  addTransceiver(kind: "audio", init: { direction: "sendrecv" }): { sender: { replaceTrack(track: LiveVoiceWebRtcTrack): Promise<void> } };
  createDataChannel(label: string): { onopen: (() => void) | null };
  createOffer(options: Record<string, unknown>): Promise<{ sdp?: string; type?: string }>;
  setLocalDescription(description: unknown): Promise<void>;
  setRemoteDescription(description: unknown): Promise<void>;
  close(): void;
};
export type LiveVoiceWebRtcModules = {
  createPeer(): LiveVoiceWebRtcPeer;
  createAnswer(sdp: string): unknown;
  getUserMedia(constraints: { audio: true; video: false }): Promise<LiveVoiceWebRtcStream>;
  /** Asks for the microphone; true only when granted. */
  requestMicrophone(): Promise<boolean>;
  /** A random UUIDv4 for the session id. */
  randomUUID(): string;
  /** Host audio route. Each step is optional; failures there never leak media. */
  audio?: {
    /** Before capture: e.g. InCallManager.start({ media: "audio" }). */
    beforeCapture?(): Promise<void> | void;
    /** After the answer is applied: e.g. route to the loudspeaker on iOS. */
    afterAnswer?(): Promise<void> | void;
    /** After close: e.g. InCallManager.stop(). */
    afterClose?(): Promise<void> | void;
  };
};

/** Microphone permission, audio route and capture. Runs in parallel with the
 * server call: the offer needs only an audio transceiver. */
export async function attachLiveVoiceMicrophone(input: {
  signal: AbortSignal;
  requestMicrophone: () => Promise<boolean>;
  beforeCapture?: () => Promise<void> | void;
  capture: () => Promise<LiveVoiceWebRtcStream>;
  attach: (track: LiveVoiceWebRtcTrack) => Promise<void>;
  keep: (stream: LiveVoiceWebRtcStream) => void;
}): Promise<void> {
  const granted = await input.requestMicrophone();
  if (!granted || input.signal.aborted) throw new Error("Voice microphone is unavailable.");
  await input.beforeCapture?.();
  if (input.signal.aborted) throw new Error("Voice start cancelled.");
  const stream = await input.capture();
  if (input.signal.aborted) { stream.getTracks().forEach(track => track.stop()); throw new Error("Voice start cancelled."); }
  input.keep(stream);
  const track = stream.getAudioTracks()[0];
  if (!track) throw new Error("Voice microphone is unavailable.");
  await input.attach(track);
}

export function createWebRtcLiveVoicePlatform(modules: LiveVoiceWebRtcModules): LiveVoicePlatform {
  return {
    id: () => modules.randomUUID(),
    async open({ signal, onFailure }) {
      let stream: LiveVoiceWebRtcStream | null = null, peer: LiveVoiceWebRtcPeer | null = null, closed = false;
      let closing: Promise<void> = Promise.resolve();
      const link = createLiveVoiceLink(onFailure);
      const close = () => {
        if (closed) return closing;
        closed = true; link.dispose();
        signal.removeEventListener("abort", aborted);
        stream?.getTracks().forEach(track => track.stop()); stream = null;
        peer?.close(); peer = null;
        closing = closing.then(async () => { await modules.audio?.afterClose?.(); }).catch(() => undefined);
        return closing;
      };
      const aborted = () => { void close(); };
      signal.addEventListener("abort", aborted, { once: true });
      try {
        if (signal.aborted) throw new Error("Voice start cancelled.");
        peer = modules.createPeer();
        const connection = peer;
        connection.onconnectionstatechange = () => { if (!closed) link.connectionState(connection.connectionState); };
        const audio = connection.addTransceiver("audio", { direction: "sendrecv" });
        // The native receiver plays remote audio. Protocol and tools stay on the server.
        const events = connection.createDataChannel("oai-events");
        events.onopen = () => { if (!closed) link.channelOpen(); };
        const offer = await connection.createOffer({}); await connection.setLocalDescription(offer);
        if (signal.aborted || !offer.sdp) throw new Error("Voice start cancelled.");
        const microphone = attachLiveVoiceMicrophone({ signal, requestMicrophone: modules.requestMicrophone,
          beforeCapture: modules.audio?.beforeCapture, capture: () => modules.getUserMedia({ audio: true, video: false }),
          attach: async track => { await audio.sender.replaceTrack(track); },
          keep: captured => { if (closed) captured.getTracks().forEach(track => track.stop()); else stream = captured; } });
        microphone.then(() => { if (!closed) link.microphone(true); }, () => { if (!closed) link.microphone(false); });
        return { offer: offer.sdp, close, ready: link.ready,
          async answer(sdp: string) {
            // Capture configures the audio session first, then WebRTC accepts
            // the answer, then the host routes audio (Hey Build 119 order).
            await microphone.catch(() => undefined);
            await connection.setRemoteDescription(modules.createAnswer(sdp));
            await modules.audio?.afterAnswer?.();
          } };
      } catch { await close(); throw new Error("Voice microphone is unavailable."); }
    },
  };
}

/** The NativeLiveVoicePort a host passes as `liveVoice`. */
export function createLiveVoicePort(options: { baseUrl: string; fetchImpl: typeof fetch; platform: LiveVoicePlatform; binding: LiveVoiceBinding }): NativeLiveVoicePort {
  return { start(input) {
    return startLiveVoice({ ...input, baseUrl: options.baseUrl, fetchImpl: options.fetchImpl, platform: options.platform, binding: options.binding });
  } };
}
