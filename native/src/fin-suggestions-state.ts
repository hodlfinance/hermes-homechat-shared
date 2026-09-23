import type { FinHermesSuggestion } from "../core/finhermes-suggestions";

// HPD-606, visible part: the Fin Hermes suggestion states, kept on the device
// until Release 35 moves them to the server. The rules follow HPD-606 in
// Linear, which is the authority where it differs from the PR #858 spec: per
// suggestion "tried" once the opener was actually sent, "completed" (checked
// off as running), "removed", and a cooldown for every suggestion the carousel
// showed; per customer "Later" (seven days) and "Don't show again". Nothing
// here creates anything; a tap only fills the composer.
//
// Placement, Justus 2026-09-23 after Build 46: the left menu's Suggestions page
// is the main path. The Home Chat shows a dismissible card pinned under its
// header, outside the transcript, only while the customer has fewer than two
// automations and at most once a day. "Later" hides it for seven days, "Don't
// show again" for good. The earlier carousel inside the transcript is gone.

export type FinSuggestionProgress = "untouched" | "tried" | "completed";

export type FinSuggestionEntryState = Readonly<{
  progress: FinSuggestionProgress;
  removed: boolean;
  /** When the carousel last showed it; it stays out of the carousel for the cooldown. */
  shownAt?: string | null;
}>;

export type FinSuggestionsDeviceState = Readonly<{
  version: 1;
  entries: Readonly<Record<string, FinSuggestionEntryState>>;
  carouselSnoozedUntil: string | null;
  carouselDisabled: boolean;
  /** The device-local day (YYYY-MM-DD) the Home Chat card was last shown. */
  cardShownOn: string | null;
}>;

export type FinSuggestionAction = "tried" | "completed" | "removed" | "restored";

export type FinSuggestionCardQualification =
  | "card_disabled"
  | "card_snoozed"
  | "shown_today"
  | "automations_unknown"
  | "enough_automations"
  | "show";

export const FIN_SUGGESTIONS_STORAGE_VERSION = 1;
export const FIN_CAROUSEL_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
/** The Home Chat card is for customers with fewer automations than this. */
export const FIN_CARD_AUTOMATION_LIMIT = 2;
export const FIN_CAROUSEL_SIZE = 3;
/** A suggestion the carousel showed does not come back to it for 14 days. */
export const FIN_CAROUSEL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

const UNTOUCHED: FinSuggestionEntryState = Object.freeze({ progress: "untouched", removed: false });

export function emptyFinSuggestionsState(): FinSuggestionsDeviceState {
  return Object.freeze({
    version: 1, entries: Object.freeze({}), carouselSnoozedUntil: null, carouselDisabled: false, cardShownOn: null,
  });
}

/** Reads what the device stored; anything malformed counts as a fresh start, never as an error. */
export function parseFinSuggestionsState(raw: string | null | undefined): FinSuggestionsDeviceState {
  if (!raw) return emptyFinSuggestionsState();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return emptyFinSuggestionsState(); }
  if (!value || typeof value !== "object") return emptyFinSuggestionsState();
  const record = value as Record<string, unknown>;
  if (record.version !== FIN_SUGGESTIONS_STORAGE_VERSION) return emptyFinSuggestionsState();
  const entries: Record<string, FinSuggestionEntryState> = {};
  if (record.entries && typeof record.entries === "object") {
    for (const [id, entry] of Object.entries(record.entries as Record<string, unknown>)) {
      if (!/^[a-z0-9_]{1,80}$/.test(id) || !entry || typeof entry !== "object") continue;
      const progress = (entry as Record<string, unknown>).progress;
      const removed = (entry as Record<string, unknown>).removed;
      const shownAt = (entry as Record<string, unknown>).shownAt;
      if (progress !== "untouched" && progress !== "tried" && progress !== "completed") continue;
      entries[id] = Object.freeze({
        progress,
        removed: removed === true,
        shownAt: typeof shownAt === "string" && Number.isFinite(Date.parse(shownAt)) ? shownAt : null,
      });
    }
  }
  const snoozed = typeof record.carouselSnoozedUntil === "string" && Number.isFinite(Date.parse(record.carouselSnoozedUntil))
    ? record.carouselSnoozedUntil
    : null;
  return Object.freeze({
    version: 1,
    entries: Object.freeze(entries),
    carouselSnoozedUntil: snoozed,
    carouselDisabled: record.carouselDisabled === true,
    cardShownOn: typeof record.cardShownOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.cardShownOn)
      ? record.cardShownOn
      : null,
  });
}

export function serializeFinSuggestionsState(state: FinSuggestionsDeviceState): string {
  return JSON.stringify(state);
}

export function finSuggestionEntryState(state: FinSuggestionsDeviceState, id: string): FinSuggestionEntryState {
  return state.entries[id] ?? UNTOUCHED;
}

export function applyFinSuggestionAction(
  state: FinSuggestionsDeviceState,
  id: string,
  action: FinSuggestionAction,
): FinSuggestionsDeviceState {
  const current = finSuggestionEntryState(state, id);
  const shownAt = current.shownAt ?? null;
  const next: FinSuggestionEntryState =
    action === "tried" ? { progress: current.progress === "completed" ? "completed" : "tried", removed: false, shownAt }
    : action === "completed" ? { progress: "completed", removed: false, shownAt }
    : action === "removed" ? { progress: current.progress, removed: true, shownAt }
    : { progress: current.progress, removed: false, shownAt };
  return Object.freeze({ ...state, entries: Object.freeze({ ...state.entries, [id]: Object.freeze(next) }) });
}

export function applyFinCarouselPreference(
  state: FinSuggestionsDeviceState,
  preference: "later" | "never" | "enable",
  now: Date,
): FinSuggestionsDeviceState {
  if (preference === "later") {
    return Object.freeze({ ...state, carouselSnoozedUntil: new Date(now.getTime() + FIN_CAROUSEL_SNOOZE_MS).toISOString() });
  }
  if (preference === "never") return Object.freeze({ ...state, carouselDisabled: true });
  return Object.freeze({ ...state, carouselDisabled: false, carouselSnoozedUntil: null });
}

/** The device-local calendar day, so "once a day" follows the customer's clock. */
export function finSuggestionLocalDay(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Whether the Home Chat card may appear, in this order: "Don't show again",
 * "Later" (seven days), already shown today, then the automation count, which
 * must be known and below two.
 */
export function finSuggestionCardQualification(
  state: FinSuggestionsDeviceState,
  input: { now: Date; automationCount: number | null },
): FinSuggestionCardQualification {
  if (state.carouselDisabled) return "card_disabled";
  if (state.carouselSnoozedUntil && Date.parse(state.carouselSnoozedUntil) > input.now.getTime()) return "card_snoozed";
  if (state.cardShownOn === finSuggestionLocalDay(input.now)) return "shown_today";
  if (input.automationCount === null || !Number.isFinite(input.automationCount)) return "automations_unknown";
  if (input.automationCount >= FIN_CARD_AUTOMATION_LIMIT) return "enough_automations";
  return "show";
}

/** Records today's card: its suggestions get the cooldown and the day is used up. */
export function markFinSuggestionCardShown(
  state: FinSuggestionsDeviceState,
  ids: readonly string[],
  now: Date,
): FinSuggestionsDeviceState {
  return Object.freeze({ ...markFinSuggestionsShown(state, ids, now), cardShownOn: finSuggestionLocalDay(now) });
}

/** Records that the carousel showed these suggestions now; all of them get the cooldown. */
export function markFinSuggestionsShown(
  state: FinSuggestionsDeviceState,
  ids: readonly string[],
  now: Date,
): FinSuggestionsDeviceState {
  const entries = { ...state.entries };
  for (const id of ids) {
    entries[id] = Object.freeze({ ...finSuggestionEntryState(state, id), shownAt: now.toISOString() });
  }
  return Object.freeze({ ...state, entries: Object.freeze(entries) });
}

function available(state: FinSuggestionsDeviceState, id: string): boolean {
  const entry = finSuggestionEntryState(state, id);
  return entry.progress === "untouched" && !entry.removed;
}

/** Up to three untouched, not removed suggestions outside their cooldown, in pool order. */
export function finCarouselSuggestions(
  state: FinSuggestionsDeviceState,
  catalog: readonly FinHermesSuggestion[],
  now: Date,
): FinHermesSuggestion[] {
  return catalog
    .filter((suggestion) => {
      if (!available(state, suggestion.id)) return false;
      const shownAt = finSuggestionEntryState(state, suggestion.id).shownAt;
      return !shownAt || now.getTime() - Date.parse(shownAt) >= FIN_CAROUSEL_COOLDOWN_MS;
    })
    .slice(0, FIN_CAROUSEL_SIZE);
}

/** The suggestions of a carousel already on screen that the customer has not acted on yet. */
export function finLockedCarouselSuggestions(
  state: FinSuggestionsDeviceState,
  catalog: readonly FinHermesSuggestion[],
  lockedIds: readonly string[],
): FinHermesSuggestion[] {
  return lockedIds
    .map((id) => catalog.find((suggestion) => suggestion.id === id))
    .filter((suggestion): suggestion is FinHermesSuggestion => Boolean(suggestion && available(state, suggestion.id)));
}
