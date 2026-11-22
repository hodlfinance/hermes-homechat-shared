import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createMobileHomechatEventStream } from "../src/homechat-stream";

// HPD-2263 (TestFlight 9074, Justus): during a very slow answer the chat's back
// button did not react; only restarting the app helped. Every one-character
// delta of the engine reached the chat as its own update and re-rendered the
// whole surface, so the JS thread never caught up and touches waited behind it.
// In append mode the stream now hands on at most one whole draft per window.

const DELTAS = Array.from({ length: 2000 }, (_, index) => String.fromCharCode(97 + (index % 26)));
const FULL_TEXT = DELTAS.join("");
const frame = (seq: number, type: string, payload: Record<string, unknown>) =>
  `id: ${seq}\nevent: ${type}\ndata: ${JSON.stringify({ type, id: String(seq), runId: "run-1", payload, createdAt: "2026-11-22T10:00:00.000Z" })}\n\n`;

/** One SSE frame per read, each after `gapMs` of (fake) time. */
function slowBody(clock: { now: number }, gapMs: number, signal?: AbortSignal) {
  const frames = DELTAS.map((text, index) => frame(index + 1, "message.delta", { messageId: "m", text }));
  frames.push(frame(DELTAS.length + 1, "run.status", { state: "completed" }));
  let index = 0;
  return {
    getReader: () => ({
      read: () => new Promise<{ done: boolean; value?: Uint8Array }>((resolve, reject) => {
        if (signal?.aborted) return reject(new Error("aborted"));
        const onAbort = () => reject(new Error("aborted"));
        signal?.addEventListener("abort", onAbort, { once: true });
        setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          clock.now = Date.now();
          if (index >= frames.length) return resolve({ done: true });
          resolve({ done: false, value: new TextEncoder().encode(frames[index++]) });
        }, gapMs);
      }),
      cancel: async () => undefined,
      releaseLock: () => undefined,
    }),
  };
}

async function drive(until: () => boolean, stepMs: number, limit = 100_000) {
  for (let step = 0; step < limit && !until(); step += 1) {
    mock.timers.tick(stepMs);
    for (let flush = 0; flush < 8; flush += 1) await Promise.resolve();
  }
}

test("HPD-2263: 2,000 slow one-character deltas reach the chat as a bounded number of whole drafts", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  try {
    const clock = { now: 0 };
    const shown: string[] = [];
    let settled = false;
    const stream = createMobileHomechatEventStream(async () => ({ body: slowBody(clock, 10) as never, ok: true, status: 200, text: async () => "" }), {
      deltaMode: "append", deltaCoalesceMs: 80, now: () => Date.now(),
    });
    const done = stream("run-1", {
      onEvent: (event) => {
        const e = event as { type: string; text?: string };
        if (e.type === "message.delta") shown.push(e.text ?? "");
      },
    }).then((result) => { settled = true; return result; });
    await drive(() => settled, 1);
    const result = await done;
    assert.deepEqual(result, { cursor: String(DELTAS.length + 1), terminal: true });
    // 2,000 deltas over 20 s of stream: about one draft per 80 ms, never one per delta.
    assert.ok(shown.length <= Math.ceil((DELTAS.length * 10) / 80) + 2, `${shown.length} drafts`);
    assert.ok(shown.length >= 100, `${shown.length} drafts`);
    // The text only grows, and the last draft is every delta joined.
    shown.forEach((text, index) => assert.ok(FULL_TEXT.startsWith(text) && (index === 0 || text.length > shown[index - 1]!.length)));
    assert.equal(shown.at(-1), FULL_TEXT);
  } finally {
    mock.timers.reset();
  }
});

test("HPD-2263: Stop mid-stream ends delivery at once; no held draft arrives afterwards", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  try {
    const clock = { now: 0 };
    const controller = new AbortController();
    let deliveredAfterStop = 0;
    let stopped = false;
    let count = 0;
    let outcome: unknown = null;
    const stream = createMobileHomechatEventStream(async (_runId, _cursor, signal) => ({
      body: slowBody(clock, 10, signal) as never, ok: true, status: 200, text: async () => "",
    }), { deltaMode: "append", deltaCoalesceMs: 80, now: () => Date.now() });
    const done = stream("run-1", {
      signal: controller.signal,
      onEvent: () => {
        count += 1;
        if (stopped) deliveredAfterStop += 1;
      },
    }).then(() => { outcome = "resolved"; }, () => { outcome = "rejected"; });
    await drive(() => clock.now >= 5_000, 1);
    assert.ok(count > 0);
    stopped = true;
    controller.abort();
    for (let flush = 0; flush < 8; flush += 1) await Promise.resolve();
    await drive(() => outcome !== null, 1, 50);
    await done;
    assert.equal(outcome, "rejected");
    mock.timers.tick(1_000);
    assert.equal(deliveredAfterStop, 0);
  } finally {
    mock.timers.reset();
  }
});

test("HPD-2263: without a window (Hey) every delta passes as before", async () => {
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(c) {
      c.enqueue(new TextEncoder().encode(DELTAS.slice(0, 50).map((text, i) => frame(i + 1, "message.delta", { messageId: "m", text })).join("")));
      c.close();
    },
  });
  let count = 0;
  await createMobileHomechatEventStream(async () => ({ body, ok: true, status: 200, text: async () => "" }))("run-1", {
    onEvent: () => { count += 1; },
  });
  assert.equal(count, 50);
});

// HPD-2263 (live, 2026-11-22): after the coalescer above, an answer whose
// engine stream finished in 5.7 s (307 deltas, 3,542 characters) took 3-4
// minutes to appear in HODL. The reader waited for each delivery, and on React
// Native's old architecture a delivery redraws synchronously, so with a slow
// redraw every delta got its own redraw. Now the reader never waits for the
// chat, the next draft waits 80 ms after a redraw ENDED, one delivery draws
// once, and message.completed shows the full answer at once.
const LIVE_COUNT = 307;
const LIVE_CHARS = 3542;
const LIVE_DELTAS = (() => {
  const out: string[] = [];
  let used = 0;
  for (let index = 0; index < LIVE_COUNT; index += 1) {
    const length = Math.round(((index + 1) * LIVE_CHARS) / LIVE_COUNT) - used;
    used += length;
    out.push(`${"w".repeat(length - 1)} `);
  }
  return out;
})();
const LIVE_TEXT = LIVE_DELTAS.join("");
const liveFrame = (seq: number, type: string, text: string) =>
  `id: ${seq}\nevent: ${type}\ndata: ${JSON.stringify({ type, id: String(seq), runId: "run-1", text, payload: { messageId: "m", text }, createdAt: "2026-11-22T09:29:17.000Z" })}\n\n`;

/** The live engine timing: deltas from 2.6 s to 5.6 s, completed at 5.7 s. Chunks buffer while JS is busy. */
function liveBody() {
  const frames = LIVE_DELTAS.map((text, index) => ({ at: 2600 + (index * 3000) / LIVE_COUNT, data: liveFrame(index + 1, "message.delta", text) }));
  frames.push({ at: 5700, data: liveFrame(LIVE_COUNT + 1, "message.completed", LIVE_TEXT) });
  let index = 0;
  return {
    getReader: () => ({
      read: () => new Promise<{ done: boolean; value?: Uint8Array }>((resolve) => {
        if (index >= frames.length) return resolve({ done: true });
        const next = () => resolve({ done: false, value: new TextEncoder().encode(frames[index++]!.data) });
        const wait = frames[index]!.at - Date.now();
        if (wait <= 0) queueMicrotask(next);
        else setTimeout(next, wait);
      }),
      cancel: async () => undefined,
      releaseLock: () => undefined,
    }),
  };
}

for (const redrawMs of [150, 600]) {
  test(`HPD-2263: a 5.7 s answer with a ${redrawMs} ms redraw shows in full right after completion in a few redraws`, async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
    try {
      let shown = "";
      let pending = "";
      let redraws = 0;
      let batching = false;
      const timeline: Array<[number, number]> = [];
      // A redraw blocks the JS thread for redrawMs (old architecture, synchronous).
      const redraw = () => {
        mock.timers.tick(redrawMs);
        redraws += 1;
        shown = pending;
        timeline.push([Date.now(), shown.length]);
      };
      let settled = false;
      const stream = createMobileHomechatEventStream(async () => ({ body: liveBody() as never, ok: true, status: 200, text: async () => "" }), {
        deltaMode: "append", deltaCoalesceMs: 80, now: () => Date.now(),
        batchUpdates: (fn) => {
          batching = true;
          try { fn(); } finally { batching = false; }
          redraw();
        },
      });
      const done = stream("run-1", {
        onEvent: (event) => {
          const e = event as { type: string; text?: string };
          if (e.type === "message.delta" || e.type === "message.completed") pending = e.text ?? "";
          if (!batching) redraw();
        },
      }).then((result) => { settled = true; return result; });
      await drive(() => settled, 1);
      assert.deepEqual(await done, { cursor: String(LIVE_COUNT + 1), terminal: true });
      assert.equal(shown, LIVE_TEXT);
      const fullAt = timeline.find(([, length]) => length >= LIVE_CHARS)![0];
      const at = (share: number) => (timeline.find(([, length]) => length >= LIVE_CHARS * share)![0] / 1000).toFixed(2);
      console.log(`HPD-2263 redraw ${redrawMs} ms: ${redraws} redraws, first ${(timeline[0]![0] / 1000).toFixed(2)} s, 50% ${at(0.5)} s, full ${(fullAt / 1000).toFixed(2)} s`);
      // Floor: completed arrives while a redraw runs, then one more redraw draws it.
      // 150 ms: by 6.0 s; 600 ms: by 6.9 s (measured 6.54 s).
      assert.ok(fullAt <= 5_700 + 2 * redrawMs, `full text at ${fullAt} ms`);
      assert.ok(redraws <= 25, `${redraws} redraws`);
      // The text only grows while it streams.
      timeline.forEach(([, length], index) => assert.ok(index === 0 || length >= timeline[index - 1]![1]));
    } finally {
      mock.timers.reset();
    }
  });
}
