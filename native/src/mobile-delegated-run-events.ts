import type { ChatRunEvent } from "../core/index";

/**
 * HPD-874 (reopened 25.09., Justus on HODL): a sub thread showed only
 * "Thinking" for four minutes while the plane held 46 step, result and
 * thinking events for it. The step timeline read them only from its own
 * event stream; when that stream delivered nothing on the device, the
 * timeline stayed empty although the chat's own observation of the same run
 * (stream, or polling while streaming is unavailable) was receiving its
 * events. The timeline now takes every event of the run from either source.
 *
 * Events are merged by id, in the order they happened. The result is a new
 * array only when something was added, so a render is not triggered for
 * nothing; at most `limit` of the newest are kept.
 */
export function mergeDelegatedRunEvents(
  current: readonly ChatRunEvent[],
  incoming: readonly ChatRunEvent[],
  runId: string | null,
  limit = 2_000,
): ChatRunEvent[] | null {
  if (!runId || !incoming.length) return null;
  const known = new Set(current.map((event) => event.id));
  const added = incoming.filter((event) => event.id && event.runId === runId && !known.has(event.id));
  if (!added.length) return null;
  const merged = [...current, ...added].map((event, index) => ({ event, index }));
  merged.sort((left, right) =>
    (Date.parse(left.event.createdAt) || 0) - (Date.parse(right.event.createdAt) || 0) || left.index - right.index);
  const ordered = merged.map((entry) => entry.event);
  return ordered.length > limit ? ordered.slice(ordered.length - limit) : ordered;
}

/** A stream chunk is bytes on most transports and already text on some. */
export function delegatedStreamChunkText(value: unknown, decoder: { decode: (input: Uint8Array, options?: { stream?: boolean }) => string } | null) {
  if (typeof value === "string") return value;
  if (!(value instanceof Uint8Array) || !decoder) return "";
  return decoder.decode(value, { stream: true });
}
