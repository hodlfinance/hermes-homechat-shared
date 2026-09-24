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
 *
 * Phase 2 (Justus, 24.09.2026, "Ja, gefiltert"). The runtime now adds, already
 * filtered on the guest and again on the plane:
 *
 *   tool.started    toolCallId, tool, target (at most 120 characters)
 *   tool.completed  toolCallId, tool, ok, durationMs, resultPreview (at most
 *                   300), resultSize, resultCount; mail, Google, finance and
 *                   secret tools carry `confidential` and a count only
 *   reasoning       content: the model's thinking for one model call (at most
 *                   4,000), originalLength when it was cut, modelCall
 *
 * These are read as plain text, bounded again here, and shown collapsed. An
 * event without the new fields reads exactly as in phase 1.
 */

export type HeyDelegatedActivityStepEntry = {
  kind: "step";
  key: string;
  verbKey: HeyActivityVerbKey;
  toolKey: HeyActivityToolKey | null;
  state: "running" | "ok" | "error";
  durationMs: number | null;
  startedAt: string;
  /** Phase 2. The runtime's call id, to pair a start with its end. */
  toolCallId?: string | null;
  /** Phase 2. What the step works on: a query, a domain and path, a file name. */
  target?: string | null;
  /** Phase 2. A short, filtered excerpt of the result, shown collapsed. */
  resultPreview?: string | null;
  resultSize?: number | null;
  /** Phase 2. Mail, Google, finance, secrets: a count, never content. */
  resultCount?: number | null;
  confidential?: boolean;
};

export type HeyDelegatedActivityReasoningEntry = {
  kind: "reasoning";
  key: string;
  text: string;
  truncated: boolean;
  modelCall: number | null;
  createdAt: string;
};

export type HeyDelegatedActivityNoteEntry = {
  kind: "note";
  key: string;
  text: string;
  truncated: boolean;
  createdAt: string;
};

export type HeyDelegatedActivityEntry =
  | HeyDelegatedActivityStepEntry
  | HeyDelegatedActivityNoteEntry
  | HeyDelegatedActivityReasoningEntry;

export type HeyDelegatedActivityTimeline = {
  entries: HeyDelegatedActivityEntry[];
  /** Entries left out at the start because the timeline is capped. */
  omitted: number;
};

export const heyDelegatedActivityEntryLimit = 200;
export const heyDelegatedActivityNoteLimit = 500;
export const heyDelegatedActivityTargetLimit = 120;
export const heyDelegatedActivityPreviewLimit = 300;
export const heyDelegatedActivityReasoningLimit = 4_000;

function payloadNumber(event: ChatRunEvent, key: string) {
  const value = event.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function payloadIdentifier(event: ChatRunEvent, key: string) {
  const value = payloadText(event, key);
  return /^[A-Za-z0-9_.:/-]{1,120}$/.test(value) ? value : null;
}

// Plain text only: control characters out, whitespace kept readable, and cut
// to the bound even when the runtime already did.
function boundedText(value: string, limit: number, keepLines: boolean) {
  const cleaned = value
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(keepLines ? /[ \t]+/g : /\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= limit) return { text: cleaned, truncated: cleaned.endsWith("…") };
  return { text: `${cleaned.slice(0, limit - 1).trimEnd()}…`, truncated: true };
}

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
      const tool = payloadIdentifier(event, "tool");
      const step: HeyActivityStep =
        heyActivityStepFromHermesPhrase(content) ?? (tool ? heyActivityStepForTool(tool) : null) ?? { verbKey: "usingTool", toolKey: null };
      const confidential = event.payload?.confidential === true;
      const target = confidential ? "" : boundedText(payloadText(event, "target"), heyDelegatedActivityTargetLimit, false).text;
      entries.push({
        kind: "step",
        key: event.id || `step-${entries.length}`,
        verbKey: step.verbKey,
        toolKey: step.toolKey,
        state: "running",
        durationMs: null,
        startedAt: at,
        toolCallId: payloadIdentifier(event, "toolCallId"),
        target: target || null,
        ...(confidential ? { confidential: true } : {}),
      });
      continue;
    }

    if (phase === "tool.completed") {
      const parsed = heyActivityCompletionFromReceipt(content);
      const tool = payloadIdentifier(event, "tool") ?? parsed?.tool ?? null;
      const okField = event.payload?.ok;
      const ok = typeof okField === "boolean" ? okField : parsed?.ok;
      if (!tool || typeof ok !== "boolean") continue;
      const durationMs = payloadNumber(event, "durationMs") ?? parsed?.durationMs ?? null;
      const step = heyActivityStepForTool(tool) ?? { verbKey: "usingTool" as const, toolKey: null };
      const toolCallId = payloadIdentifier(event, "toolCallId");
      // Phase 2: the call id pairs a start with its end exactly. Without it, a
      // child runs its tools one after another, and the start of the tool
      // that just ended is the newest one still open. Prefer the open step
      // with the same verb; a started phrase for a plugin tool can be generic.
      let open: HeyDelegatedActivityStepEntry | undefined;
      if (toolCallId) {
        for (let index = entries.length - 1; index >= 0; index -= 1) {
          const entry = entries[index];
          if (entry?.kind === "step" && entry.state === "running" && entry.toolCallId === toolCallId) {
            open = entry;
            break;
          }
        }
      }
      if (!open) {
        for (let index = entries.length - 1; index >= 0; index -= 1) {
          const entry = entries[index];
          if (entry?.kind !== "step" || entry.state !== "running") continue;
          if (toolCallId && entry.toolCallId && entry.toolCallId !== toolCallId) continue;
          if (!open) open = entry;
          if (entry.verbKey === step.verbKey) {
            open = entry;
            break;
          }
        }
      }
      const confidential = event.payload?.confidential === true || open?.confidential === true;
      const preview = confidential ? "" : boundedText(payloadText(event, "resultPreview"), heyDelegatedActivityPreviewLimit, false).text;
      const result = {
        resultPreview: preview || null,
        resultSize: confidential ? null : payloadNumber(event, "resultSize"),
        resultCount: payloadNumber(event, "resultCount"),
      };
      if (open) {
        open.state = ok ? "ok" : "error";
        open.durationMs = durationMs;
        Object.assign(open, result);
        if (confidential) {
          open.confidential = true;
          open.target = null;
        }
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
          state: ok ? "ok" : "error",
          durationMs,
          startedAt: at,
          toolCallId,
          target: null,
          ...result,
          ...(confidential ? { confidential: true } : {}),
        });
      }
      continue;
    }

    if (phase === "reasoning" && content) {
      const bounded = boundedText(content, heyDelegatedActivityReasoningLimit, true);
      if (!bounded.text) continue;
      const originalLength = payloadNumber(event, "originalLength");
      entries.push({
        kind: "reasoning",
        key: event.id || `reasoning-${entries.length}`,
        text: bounded.text,
        truncated: bounded.truncated || (originalLength !== null && originalLength > bounded.text.length),
        modelCall: payloadNumber(event, "modelCall"),
        createdAt: at,
      });
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
