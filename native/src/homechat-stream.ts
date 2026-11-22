import {
  createHomechatEventStreamDecoder,
  isTerminalHomechatEvent,
  type ChatLatencySummary,
  type ChatRun,
  type SharedHomechatCanonicalEvent,
  type SharedHomechatRunTransport,
} from "../core/index";
import { HermesApiClientError } from "../core/hermes-api-client";

type MobileHomechatResponse = Pick<Response, "body" | "ok" | "status" | "text"> & {
  /** HPD-2263: read for `X-Hermes-Replay` (full | resume | reset); optional for test doubles. */
  headers?: { get(name: string): string | null } | null;
};

export type MobileHomechatLatencyOptions = {
  /**
   * HPD-2263: "append" when every message delta is new text to add (the HODL
   * Bots engine). The shared draft merge also accepts snapshots and replays and
   * drops a delta it already finds in the draft, so short token deltas ("c",
   * " ", " −") vanished while streaming. In this mode the stream adds each
   * delta to the run's draft and hands on the whole draft as a `replace` delta.
   * Absent: deltas pass unchanged.
   */
  deltaMode?: "append";
  /**
   * HPD-2263 (TestFlight 9074: back button blocked during a slow answer): with
   * `deltaMode: "append"` every delta is the whole draft, so only the newest
   * one needs to reach the chat. The stream keeps reading at network speed and
   * only stores the newest draft; a timer hands it to `onEvent`, and the next
   * one waits until this many milliseconds after that delivery ended. Every
   * other event first sends the waiting draft with it, in one delivery (so
   * `message.completed` shows the full answer at once). Before, a slow redraw
   * held up the reader, so each delta got its own redraw: a 5.7 s answer took
   * minutes to appear. 0 or absent: every delta passes.
   * Ignored without `deltaMode: "append"`, whose deltas are increments.
   */
  deltaCoalesceMs?: number;
  now?: () => number;
  /**
   * HPD-2263: runs one delivery (one or more `onEvent` calls) so that its state
   * updates draw once, e.g. React Native's `unstable_batchedUpdates`. The old
   * architecture otherwise redraws after every single state update.
   */
  batchUpdates?: (fn: () => void) => void;
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

/**
 * HPD-2263: UTF-8 text of a byte stream, chunk by chunk, without the
 * `{ stream: true }` option of TextDecoder. React Native's Hermes has no
 * TextDecoder; the HODL app installs fast-text-encoding, whose decode throws
 * "the 'stream' option is unsupported" on every chunk, so every event stream
 * failed at its first byte. A multi-byte character cut by a chunk boundary is
 * held back until its remaining bytes arrive.
 */
export function createUtf8ChunkDecoder(decoder: { decode(input?: Uint8Array): string } = new TextDecoder()) {
  let pending: Uint8Array = new Uint8Array(0);
  const completeLength = (bytes: Uint8Array) => {
    // Walk back over at most three continuation bytes to the lead byte of the last character.
    let index = bytes.length - 1;
    let continuation = 0;
    while (index >= 0 && continuation < 3 && (bytes[index]! & 0xc0) === 0x80) {
      index -= 1;
      continuation += 1;
    }
    if (index < 0) return bytes.length;
    const lead = bytes[index]!;
    const needed = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc0 ? 2 : 1;
    return needed > continuation + 1 ? index : bytes.length;
  };
  return {
    push(chunk: Uint8Array | undefined): string {
      if (!chunk?.byteLength) return "";
      const bytes = pending.byteLength ? new Uint8Array(pending.byteLength + chunk.byteLength) : chunk;
      if (pending.byteLength) {
        bytes.set(pending, 0);
        bytes.set(chunk, pending.byteLength);
      }
      const end = completeLength(bytes);
      pending = bytes.slice(end);
      return end ? decoder.decode(bytes.subarray(0, end)) : "";
    },
    finish(): string {
      if (!pending.byteLength) return "";
      const rest = pending;
      pending = new Uint8Array(0);
      return decoder.decode(rest);
    },
  };
}

/**
 * HPD-2263: turns append-only message deltas into whole-draft `replace` deltas.
 * The draft is kept per run across reconnects. A replay from the run's first
 * event (a stream opened without a cursor, or the server's `X-Hermes-Replay:
 * full|reset` answer to a cursor) rebuilds the draft from empty, so replayed
 * text is never appended onto the old draft. While a replay rebuilds text the
 * user has already seen, its deltas are held back, so the shown text is never
 * cut to a shorter prefix:
 * - after a reset, until the rebuilt draft reaches the old draft (or departs from it);
 * - when a cursor is given but no draft is known for the run (a fresh stream
 *   instance), the stream asks for a full replay (`resumeCursor` returns null)
 *   and holds deltas back up to the event with the old cursor's id.
 * A terminal event that arrives while deltas are held back is preceded by the
 * whole draft, so nothing is lost.
 */
export function createAppendDeltaDrafts(limit = 32) {
  const drafts = new Map<string, string>();
  const holds = new Map<string, { untilId?: string; floor?: string; held?: SharedHomechatCanonicalEvent }>();
  const remember = (runId: string, draft: string) => {
    if (!drafts.has(runId) && drafts.size >= limit) drafts.delete(drafts.keys().next().value!);
    drafts.set(runId, draft);
  };
  const asReplace = <Event extends SharedHomechatCanonicalEvent>(event: Event, draft: string): Event => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    return { ...event, text: draft, replace: true, payload: { ...payload, text: draft, replace: true } };
  };
  return {
    /** The cursor to open the stream with: null (full replay) when a cursor is given but no draft is known. */
    resumeCursor(runId: string, cursor: string | null): string | null {
      return cursor && !drafts.has(runId) ? null : cursor;
    },
    /**
     * Called once the stream is open. `requested` is the caller's cursor, `sent` the one
     * the stream was opened with, `replay` the server's `X-Hermes-Replay` answer.
     */
    open(runId: string, requested: string | null, sent: string | null, replay: string | null = null) {
      // A plain resume keeps a hold that a dropped replay left open: the cursor it
      // resumes from may still lie before the text already shown.
      if (sent && replay !== "reset" && replay !== "full") return;
      holds.delete(runId);
      if (requested && !sent) {
        // A fresh stream instance with a cursor: full replay, held back up to the cursor.
        drafts.delete(runId);
        holds.set(runId, { untilId: requested });
        return;
      }
      if (!sent) {
        drafts.delete(runId);
        return;
      }
      const floor = drafts.get(runId);
      drafts.delete(runId);
      if (floor) holds.set(runId, { floor });
    },
    apply<Event extends SharedHomechatCanonicalEvent>(runId: string, event: Event): Event[] {
      const hold = holds.get(runId);
      if (event.type !== "message.delta") {
        if (hold && isTerminalHomechatEvent(event)) {
          holds.delete(runId);
          const draft = drafts.get(runId);
          if (hold.held && draft) return [asReplace(hold.held as Event, draft), event];
        }
        if (hold?.untilId !== undefined && event.id === hold.untilId) holds.delete(runId);
        return [event];
      }
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      if (payload.clarifyRequest !== undefined || payload.clarifyId !== undefined) return [event];
      const text = typeof (event as { text?: unknown }).text === "string" ? (event as { text: string }).text : "";
      const replace = (event as { replace?: boolean }).replace === true || payload.replace === true;
      const draft = payload.retracted === true ? "" : replace ? text : `${drafts.get(runId) ?? ""}${text}`;
      remember(runId, draft);
      if (payload.retracted === true) {
        holds.delete(runId);
        return [event];
      }
      if (hold) {
        const reachedCursor = hold.untilId !== undefined && event.id === hold.untilId;
        const caughtUp = hold.floor !== undefined && (draft.length >= hold.floor.length || !hold.floor.startsWith(draft));
        if (!reachedCursor && !caughtUp) {
          hold.held = event;
          return [];
        }
        holds.delete(runId);
        // At the old cursor the shown text already ends here; send it once as the whole draft.
      }
      return [asReplace(event, draft)];
    },
    end(runId: string) {
      drafts.delete(runId);
      holds.delete(runId);
    },
  };
}

/** A whole-draft delta (append mode) that a newer one may replace: not a clarify, not a retraction. */
function homechatDraftDeltaCanWait(event: SharedHomechatCanonicalEvent) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const replace = (event as { replace?: boolean }).replace === true || payload.replace === true;
  return replace && payload.retracted !== true && payload.clarifyRequest === undefined && payload.clarifyId === undefined;
}

type HomechatBatch = (fn: () => void) => void;
const runUnbatched: HomechatBatch = (fn) => fn();

/** Hands events to `deliver` inside one batch; a synchronous throw becomes a rejection. */
function deliverInOneBatch(
  events: SharedHomechatCanonicalEvent[],
  deliver: (event: SharedHomechatCanonicalEvent) => void | Promise<void>,
  batch: HomechatBatch,
): Promise<void> {
  const pending: Array<void | Promise<void>> = [];
  try {
    batch(() => {
      for (const event of events) pending.push(deliver(event));
    });
  } catch (error) {
    return Promise.reject(error);
  }
  return Promise.all(pending).then(() => undefined);
}

/**
 * HPD-2263: whole-draft deltas for a slow chat. `offer` never waits for the
 * chat: it keeps only the newest draft and a timer delivers it. The next
 * delivery waits `windowMs` after the previous one ENDED, so a slow redraw
 * means fewer drafts, never a slower reader. `finish` sends the waiting draft
 * together with the given events (one batch, one redraw), in order after any
 * delivery still in progress. After an abort (Stop, leaving the chat) a
 * waiting draft is dropped and no timer fires.
 */
export function createDraftCoalescer(
  windowMs: number,
  now: () => number,
  deliver: (event: SharedHomechatCanonicalEvent) => void | Promise<void>,
  signal?: AbortSignal,
  batch: HomechatBatch = runUnbatched,
) {
  let held: SharedHomechatCanonicalEvent | null = null;
  let lastEndedAt = Number.NEGATIVE_INFINITY;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let delivering: Promise<void> | null = null;
  let cancelled = false;
  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const stopped = () => cancelled || signal?.aborted === true;
  const deliverNow = (events: SharedHomechatCanonicalEvent[]) => {
    const done = deliverInOneBatch(events, deliver, batch);
    // On the old architecture the redraw ran inside the batch; the window starts now.
    lastEndedAt = now();
    const settled = done.then(() => undefined, () => undefined).then(() => {
      lastEndedAt = now();
      if (delivering === settled) delivering = null;
      schedule();
    });
    delivering = settled;
    return done;
  };
  const fire = () => {
    timer = null;
    if (!held || stopped()) {
      held = null;
      return;
    }
    const event = held;
    held = null;
    void deliverNow([event]).catch(() => undefined);
  };
  const schedule = () => {
    if (timer !== null || delivering || !held || stopped()) return;
    timer = setTimeout(fire, Math.max(0, windowMs - (now() - lastEndedAt)));
  };
  const onAbort = () => {
    clearTimer();
    held = null;
  };
  signal?.addEventListener?.("abort", onAbort, { once: true });
  return {
    offer(event: SharedHomechatCanonicalEvent): void {
      if (stopped()) return;
      held = event;
      schedule();
    },
    async finish(events: SharedHomechatCanonicalEvent[] = []): Promise<void> {
      clearTimer();
      while (delivering) {
        await delivering;
        clearTimer();
      }
      if (stopped()) held = null;
      const list = held ? [held, ...events] : events;
      held = null;
      if (list.length) await deliverNow(list);
    },
    cancel() {
      cancelled = true;
      clearTimer();
      held = null;
      signal?.removeEventListener?.("abort", onAbort);
    },
  };
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
  const appendDrafts = latency.deltaMode === "append" ? createAppendDeltaDrafts() : null;
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
    const requestedCursor = context.cursor ?? null;
    const sentCursor = appendDrafts ? appendDrafts.resumeCursor(runId, requestedCursor) : requestedCursor;
    const response = await open(runId, sentCursor, context.signal);
    if (!observation.streamOpenObserved) {
      observation.streamOpenObserved = true;
      emitTiming({ streamOpenMs: Math.max(0, now() - observation.startedAt) });
    }
    if (!response.ok) {
      throw new HermesApiClientError(
        (await response.text()) || `Homechat stream failed with ${response.status}.`,
        { status: response.status },
      );
    }
    const reader = response.body?.getReader?.();
    if (!reader) {
      observations.delete(runId);
      throw new Error("Streaming is unavailable on this device; switching to polling.");
    }

    let replayMode: string | null = null;
    try {
      replayMode = response.headers?.get?.("x-hermes-replay")?.trim().toLowerCase() ?? null;
    } catch {
      replayMode = null;
    }
    appendDrafts?.open(runId, requestedCursor, sentCursor, replayMode);
    const decoder = createHomechatEventStreamDecoder({ cursor: sentCursor });
    const textDecoder = createUtf8ChunkDecoder();
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
    const batch = latency.batchUpdates ?? runUnbatched;
    const coalescer = appendDrafts && (latency.deltaCoalesceMs ?? 0) > 0
      ? createDraftCoalescer(latency.deltaCoalesceMs!, now, (event) => context.onEvent(event), context.signal, batch)
      : null;
    const flushHeldDraft = () => coalescer ? coalescer.finish() : Promise.resolve();
    const deliver = async (event: SharedHomechatCanonicalEvent) => {
      const isDelta = event.type === "message.delta";
      if (isDelta) observeDelta();
      if (coalescer && isDelta && homechatDraftDeltaCanWait(event)) {
        // HPD-2263: the reader never waits for the chat to redraw.
        coalescer.offer(event);
      } else if (coalescer) {
        await coalescer.finish([event]);
      } else {
        await deliverInOneBatch([event], (item) => context.onEvent(item), batch);
      }
      if (isTerminalHomechatEvent(event)) terminal = true;
    };
    const emit = async (chunk: string) => {
      const parsed = decoder.push(chunk);
      if (parsed.cursor) context.onCursor?.(parsed.cursor);
      for (const parsedEvent of parsed.events) {
        if (parsedEvent.runId && parsedEvent.runId !== runId) {
          throw new Error("Homechat stream crossed the active run boundary.");
        }
        for (const event of appendDrafts ? appendDrafts.apply(runId, parsedEvent) : [parsedEvent]) await deliver(event);
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
        await emit(textDecoder.push(result.value));
      }
      await emit(textDecoder.finish());
      const remainder = decoder.finish();
      if (remainder.cursor) context.onCursor?.(remainder.cursor);
      for (const remainderEvent of remainder.events) {
        if (remainderEvent.runId && remainderEvent.runId !== runId) {
          throw new Error("Homechat stream crossed the active run boundary.");
        }
        for (const event of appendDrafts ? appendDrafts.apply(runId, remainderEvent) : [remainderEvent]) await deliver(event);
      }
      await flushHeldDraft();
    } finally {
      coalescer?.cancel();
      if (terminal) {
        try {
          reader.releaseLock();
        } catch {
          // A completed reply must not turn into a user-visible teardown error.
        }
      } else {
        // HPD-2263: a stream that ends without its terminal event (an error in
        // this loop, a parse failure, a dropped connection) closes its request.
        // Before, the reconnect opened a new request every 1.6 s while the old
        // ones stayed open, until the device's connections to the host were used
        // up and even Stop could not reach the server.
        try {
          void Promise.resolve(reader.cancel?.()).catch(() => undefined);
        } catch {
          // Closing is best effort; the reconnect proceeds either way.
        }
      }
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
    if (terminal) appendDrafts?.end(runId);

    return { cursor: decoder.getCursor(), terminal };
  };
}
