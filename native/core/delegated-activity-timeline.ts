import {
  heyActivityCompletionFromReceipt,
  heyActivityStepForTool,
  heyActivityStepFromHermesPhrase,
  type HeyActivityStep,
  type HeyActivityToolKey,
  type HeyActivityVerbKey,
} from "./run-activity-verbs";
import type { ChatRunEvent } from "./types";

/**
 * HPD-874, phase 1. What a background task did, step by step, for its sub
 * thread.
 *
 * Since HPD-629 (09.09.) the runtime posts three kinds of status to a
 * delegated run, and the plane stores and replays them unchanged:
 *
 *   phase "tool.started"       content: Hermes' verb phrase, built with no
 *                              arguments ("is searching the web…")
 *   phase "tool.completed"     content: "<tool> finished in 3.2s." or
 *                              "<tool> hit an obstacle: …"
 *   phase "delegate.progress"  content: the model's own progress note
 *                              ("Step: …\nResult: …"), redacted and capped at
 *                              500 characters by the runtime
 *
 * This projection reads only the tool name, the duration, ok or error, and the
 * progress note. The obstacle text is the tool's own output and is dropped;
 * there is no tool input and no reasoning in these events to begin with (the
 * rule in hey-hermes `docs/hermes-default-deviations.md:18`). Phase 2 adds
 * event fields and a renderer for them; it does not change this reading.
 */

export type HeyDelegatedActivityStepEntry = {
  kind: "step";
  key: string;
  verbKey: HeyActivityVerbKey;
  toolKey: HeyActivityToolKey | null;
  state: "running" | "ok" | "error";
  durationMs: number | null;
  startedAt: string;
};

export type HeyDelegatedActivityNoteEntry = {
  kind: "note";
  key: string;
  text: string;
  truncated: boolean;
  createdAt: string;
};

export type HeyDelegatedActivityEntry = HeyDelegatedActivityStepEntry | HeyDelegatedActivityNoteEntry;

export type HeyDelegatedActivityTimeline = {
  entries: HeyDelegatedActivityEntry[];
  /** Entries left out at the start because the timeline is capped. */
  omitted: number;
};

export const heyDelegatedActivityEntryLimit = 200;
export const heyDelegatedActivityNoteLimit = 500;

function payloadText(event: ChatRunEvent, key: string) {
  const value = event.payload?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function childStatusPhase(event: ChatRunEvent) {
  if (event.type !== "status") return "";
  if (payloadText(event, "source") !== "hermes_gateway") return "";
  return payloadText(event, "phase");
}

// The runtime writes a note as "Label: text" lines. The labels are its own
// English words; the text after them is the model's, in its language.
function noteText(content: string) {
  const text = content
    .replace(/\\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length <= heyDelegatedActivityNoteLimit) return { text, truncated: false };
  return { text: `${text.slice(0, heyDelegatedActivityNoteLimit - 1).trimEnd()}…`, truncated: true };
}

export function heyDelegatedActivityTimeline(
  events: readonly ChatRunEvent[],
  limit = heyDelegatedActivityEntryLimit,
): HeyDelegatedActivityTimeline {
  const entries: HeyDelegatedActivityEntry[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (event.id && seen.has(event.id)) continue;
    if (event.id) seen.add(event.id);
    const phase = childStatusPhase(event);
    const content = payloadText(event, "content");
    const at = event.createdAt;

    if (phase === "tool.started") {
      const step: HeyActivityStep = heyActivityStepFromHermesPhrase(content) ?? { verbKey: "usingTool", toolKey: null };
      entries.push({
        kind: "step",
        key: event.id || `step-${entries.length}`,
        verbKey: step.verbKey,
        toolKey: step.toolKey,
        state: "running",
        durationMs: null,
        startedAt: at,
      });
      continue;
    }

    if (phase === "tool.completed") {
      const receipt = heyActivityCompletionFromReceipt(content);
      if (!receipt) continue;
      const step = heyActivityStepForTool(receipt.tool) ?? { verbKey: "usingTool" as const, toolKey: null };
      // A child runs its tools one after another, and the start of the tool
      // that just ended is the newest one still open. Prefer the open step
      // with the same verb; a started phrase for a plugin tool can be generic.
      let open: HeyDelegatedActivityStepEntry | undefined;
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const entry = entries[index];
        if (entry?.kind !== "step" || entry.state !== "running") continue;
        if (!open) open = entry;
        if (entry.verbKey === step.verbKey) {
          open = entry;
          break;
        }
      }
      if (open) {
        open.state = receipt.ok ? "ok" : "error";
        open.durationMs = receipt.durationMs;
        if (open.verbKey === "usingTool" || !open.toolKey) {
          open.verbKey = step.verbKey;
          open.toolKey = step.toolKey;
        }
      } else {
        entries.push({
          kind: "step",
          key: event.id || `step-${entries.length}`,
          verbKey: step.verbKey,
          toolKey: step.toolKey,
          state: receipt.ok ? "ok" : "error",
          durationMs: receipt.durationMs,
          startedAt: at,
        });
      }
      continue;
    }

    if (phase === "delegate.progress" && content) {
      const note = noteText(content);
      if (!note.text) continue;
      entries.push({
        kind: "note",
        key: event.id || `note-${entries.length}`,
        text: note.text,
        truncated: note.truncated,
        createdAt: at,
      });
    }
  }

  const bounded = Math.max(1, limit);
  const omitted = Math.max(0, entries.length - bounded);
  return { entries: omitted ? entries.slice(omitted) : entries, omitted };
}

/** "3.2 s", "1:04 min". Durations only; never a clock time. */
export function heyDelegatedActivityDurationText(durationMs: number | null): string | null {
  if (durationMs === null || !Number.isFinite(durationMs) || durationMs < 100) return null;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")} min`;
}
