import {
  createHomechatEventStreamDecoder,
  isTerminalHomechatEvent,
  type ChatLatencySummary,
  type ChatRun,
  type SharedHomechatRunTransport,
} from "../core/index";

type MobileHomechatResponse = Pick<Response, "body" | "ok" | "status" | "text">;

export type MobileHomechatLatencyOptions = {
  now?: () => number;
  startedAt?: (runId: string) => number | null;
  onTiming?: (timing: Partial<ChatLatencySummary>, runId: string) => void;
};

export type MobileChatLatencyBatchState = {
  summary: ChatLatencySummary;
  sawFirstDelta: boolean;
  firstVisibleRecorded: boolean;
  terminalObserved: boolean;
};

export function appendMobileChatLatencyTiming(state: MobileChatLatencyBatchState, timing: Partial<ChatLatencySummary>) {
  Object.assign(state.summary, timing);
  if (timing.firstDeltaMs !== undefined) state.sawFirstDelta = true;
  if (timing.firstVisiblePaintMs !== undefined) state.firstVisibleRecorded = true;
  if (timing.completionMs !== undefined) state.terminalObserved = true;
  return state.terminalObserved && (!state.sawFirstDelta || state.firstVisibleRecorded);
}

function percentile(values: readonly number[], proportion: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * proportion) - 1))] ?? 0;
}

export function createMobileHomechatEventStream(
  open: (runId: string, cursor: string | null, signal?: AbortSignal) => Promise<MobileHomechatResponse>,
  latency: MobileHomechatLatencyOptions = {},
): NonNullable<SharedHomechatRunTransport<ChatRun>["streamRun"]> {
  const observations = new Map<string, {
    startedAt: number;
    streamOpenObserved: boolean;
    firstByteObserved: boolean;
    firstDeltaObserved: boolean;
    terminalObserved: boolean;
    deltaCount: number;
    lastDeltaAt: number | null;
    deltaGapCount: number;
    deltaGaps: number[];
    maxGapMs: number;
  }>();
  return async (runId, context) => {
    const now = latency.now ?? (() => performance.now());
    if (!observations.has(runId) && observations.size >= 32) observations.delete(observations.keys().next().value!);
    const observation = observations.get(runId) ?? {
      startedAt: latency.startedAt?.(runId) ?? now(), streamOpenObserved: false, firstByteObserved: false, firstDeltaObserved: false,
      terminalObserved: false, deltaCount: 0, lastDeltaAt: null, deltaGapCount: 0, deltaGaps: [], maxGapMs: 0,
    };
    observations.set(runId, observation);
    const emitTiming = (timing: Partial<ChatLatencySummary>) => {
      try {
        latency.onTiming?.(timing, runId);
      } catch {
        // Diagnostic observers are deliberately fail-open.
      }
    };
    const response = await open(runId, context.cursor ?? null, context.signal);
    if (!observation.streamOpenObserved) {
      observation.streamOpenObserved = true;
      emitTiming({ streamOpenMs: Math.max(0, now() - observation.startedAt) });
    }
    if (!response.ok) throw new Error((await response.text()) || `Homechat stream failed with ${response.status}.`);
    const reader = response.body?.getReader?.();
    if (!reader) {
      observations.delete(runId);
      throw new Error("Streaming is unavailable on this device; switching to polling.");
    }

    const decoder = createHomechatEventStreamDecoder({ cursor: context.cursor });
    const textDecoder = new TextDecoder();
    let terminal = false;
    const observeDelta = () => {
      const observedAt = now();
      observation.deltaCount += 1;
      if (observation.lastDeltaAt !== null) {
        const gap = Math.max(0, observedAt - observation.lastDeltaAt);
        observation.maxGapMs = Math.max(observation.maxGapMs, gap);
        observation.deltaGapCount += 1;
        if (observation.deltaGaps.length < 64) observation.deltaGaps.push(gap);
        else observation.deltaGaps[(observation.deltaGapCount - 1) % 64] = gap;
      }
      observation.lastDeltaAt = observedAt;
      if (!observation.firstDeltaObserved) {
        observation.firstDeltaObserved = true;
        emitTiming({ firstDeltaMs: Math.max(0, observedAt - observation.startedAt) });
      }
    };
    const emit = async (chunk: string) => {
      const parsed = decoder.push(chunk);
      if (parsed.cursor) context.onCursor?.(parsed.cursor);
      for (const event of parsed.events) {
        if (event.runId && event.runId !== runId) {
          throw new Error("Homechat stream crossed the active run boundary.");
        }
        if (event.type === "message.delta") observeDelta();
        await context.onEvent(event);
        if (isTerminalHomechatEvent(event)) terminal = true;
      }
    };

    try {
      while (!terminal) {
        const result = await reader.read();
        if (result.done) break;
        if (!observation.firstByteObserved && result.value?.byteLength) {
          observation.firstByteObserved = true;
          emitTiming({ firstByteMs: Math.max(0, now() - observation.startedAt) });
        }
        await emit(textDecoder.decode(result.value, { stream: true }));
      }
      await emit(textDecoder.decode());
      const remainder = decoder.finish();
      if (remainder.cursor) context.onCursor?.(remainder.cursor);
      for (const event of remainder.events) {
        if (event.runId && event.runId !== runId) {
          throw new Error("Homechat stream crossed the active run boundary.");
        }
        if (event.type === "message.delta") observeDelta();
        await context.onEvent(event);
        if (isTerminalHomechatEvent(event)) terminal = true;
      }
    } finally {
      if (terminal) await reader.cancel().catch(() => undefined);
    }

    if (terminal && !observation.terminalObserved) {
      observation.terminalObserved = true;
      emitTiming({
        deltaCount: observation.deltaCount,
        interDeltaP50Ms: percentile(observation.deltaGaps, 0.5),
        interDeltaP95Ms: percentile(observation.deltaGaps, 0.95),
        maxGapMs: observation.maxGapMs,
        completionMs: Math.max(0, now() - observation.startedAt),
        outcome: "success",
      });
      observations.delete(runId);
    }

    return { cursor: decoder.getCursor(), terminal };
  };
}
