/**
 * HPD-876. A status line that stays put long enough to be read.
 *
 * Hermes can start three tools inside a second. Drawing each of them for a
 * frame is flicker, not information. A line that has been shown stays for at
 * least `minMs`; whatever arrived meanwhile replaces it only then, and only the
 * newest of those is shown. A line equal to the one on screen changes nothing.
 */
export const heySteadyLineMinMs = 1_200;

export type HeySteadyLineState = { shown: string | null; shownAt: number };

export function heySteadyLineDecision(
  state: HeySteadyLineState,
  incoming: string | null,
  now: number,
  minMs = heySteadyLineMinMs,
): { change: boolean; waitMs: number } {
  if (incoming === state.shown) return { change: false, waitMs: 0 };
  const elapsed = now - state.shownAt;
  if (state.shown === null || elapsed >= minMs) return { change: true, waitMs: 0 };
  return { change: false, waitMs: Math.max(1, minMs - elapsed) };
}
