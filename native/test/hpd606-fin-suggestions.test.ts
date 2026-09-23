import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FINHERMES_SUGGESTION_DRAFT_GUARD,
  FINHERMES_SUGGESTIONS,
  finHermesSuggestionDraft,
} from "../core/finhermes-suggestions";
import {
  applyFinCarouselPreference,
  applyFinSuggestionAction,
  emptyFinSuggestionsState,
  finCarouselQualification,
  finCarouselSuggestions,
  finSuggestionEntryState,
  FIN_CAROUSEL_SNOOZE_MS,
  parseFinSuggestionsState,
  serializeFinSuggestionsState,
} from "../src/fin-suggestions-state";

// HPD-606, visible part (Release 34, Build 46).

test("the catalog carries the seventy entries of PR #858 in pool order with the ten showcase stories", () => {
  assert.equal(FINHERMES_SUGGESTIONS.length, 70);
  assert.equal(new Set(FINHERMES_SUGGESTIONS.map((entry) => entry.id)).size, 70);
  assert.deepEqual(FINHERMES_SUGGESTIONS.slice(0, 4).map((entry) => entry.id), [
    "second_opinion", "trade_journal", "post_mortem", "analyst_digest",
  ]);
  const showcase = FINHERMES_SUGGESTIONS.filter((entry) => entry.showcaseRank !== null)
    .sort((left, right) => left.showcaseRank! - right.showcaseRank!);
  assert.deepEqual(showcase.map((entry) => entry.showcaseRank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(showcase.slice(0, 3).map((entry) => entry.id), ["war_room", "portfolio_health", "signal_lab"]);
  for (const entry of FINHERMES_SUGGESTIONS) {
    assert.ok(entry.title.length > 0 && entry.title.length <= 90, entry.id);
    assert.ok(entry.opener.length > 0 && entry.promise.length > 0, entry.id);
    assert.ok(["prompt", "dialog", "skill"].includes(entry.form), entry.id);
  }
});

test("a tap's draft is the opener, the guard sentence and the id, all editable", () => {
  const warRoom = FINHERMES_SUGGESTIONS.find((entry) => entry.id === "war_room")!;
  const draft = finHermesSuggestionDraft(warRoom);
  assert.ok(draft.startsWith(warRoom.opener));
  assert.ok(draft.includes(FINHERMES_SUGGESTION_DRAFT_GUARD));
  assert.ok(draft.endsWith("(suggestion: war_room)"));
});

test("device states survive a restart and malformed storage never breaks the page", () => {
  const tried = applyFinSuggestionAction(emptyFinSuggestionsState(), "war_room", "tried");
  const restored = parseFinSuggestionsState(serializeFinSuggestionsState(tried));
  assert.deepEqual(finSuggestionEntryState(restored, "war_room"), { progress: "tried", removed: false });
  for (const raw of [null, "", "not json", "[]", '{"version":2}', '{"version":1,"entries":{"BAD ID":{"progress":"tried"}}}']) {
    const parsed = parseFinSuggestionsState(raw);
    assert.equal(Object.keys(parsed.entries).length, 0, String(raw));
    assert.equal(parsed.carouselDisabled, false);
  }
  const bogus = parseFinSuggestionsState('{"version":1,"entries":{"war_room":{"progress":"exploded"}},"carouselSnoozedUntil":"never"}');
  assert.deepEqual(finSuggestionEntryState(bogus, "war_room"), { progress: "untouched", removed: false });
  assert.equal(bogus.carouselSnoozedUntil, null);
});

test("tried, running, removed and restored follow the spec", () => {
  let state = emptyFinSuggestionsState();
  state = applyFinSuggestionAction(state, "war_room", "tried");
  state = applyFinSuggestionAction(state, "war_room", "completed");
  assert.deepEqual(finSuggestionEntryState(state, "war_room"), { progress: "completed", removed: false });
  // Trying a running suggestion again does not demote it.
  state = applyFinSuggestionAction(state, "war_room", "tried");
  assert.equal(finSuggestionEntryState(state, "war_room").progress, "completed");
  state = applyFinSuggestionAction(state, "signal_lab", "removed");
  assert.deepEqual(finSuggestionEntryState(state, "signal_lab"), { progress: "untouched", removed: true });
  state = applyFinSuggestionAction(state, "signal_lab", "restored");
  assert.deepEqual(finSuggestionEntryState(state, "signal_lab"), { progress: "untouched", removed: false });
});

test("the carousel target rule: never, later, new, rare, active — in that order", () => {
  const now = new Date("2026-09-25T08:00:00.000Z");
  const fresh = emptyFinSuggestionsState();
  assert.equal(finCarouselQualification(fresh, { now, lastCompletedAnswerAt: null }), "new_user");
  const triedOnce = applyFinSuggestionAction(fresh, "war_room", "tried");
  assert.equal(finCarouselQualification(triedOnce, { now, lastCompletedAnswerAt: "2026-09-25T07:00:00.000Z" }), "active_user");
  assert.equal(finCarouselQualification(triedOnce, { now, lastCompletedAnswerAt: "2026-09-22T08:00:00.000Z" }), "rare_user");
  assert.equal(finCarouselQualification(triedOnce, { now, lastCompletedAnswerAt: null }), "rare_user");
  const later = applyFinCarouselPreference(triedOnce, "later", now);
  assert.equal(finCarouselQualification(later, { now, lastCompletedAnswerAt: null }), "carousel_snoozed");
  const afterSnooze = new Date(now.getTime() + FIN_CAROUSEL_SNOOZE_MS + 1);
  assert.equal(finCarouselQualification(later, { now: afterSnooze, lastCompletedAnswerAt: null }), "rare_user");
  const never = applyFinCarouselPreference(later, "never", now);
  assert.equal(finCarouselQualification(never, { now: afterSnooze, lastCompletedAnswerAt: null }), "carousel_disabled");
  const enabled = applyFinCarouselPreference(never, "enable", now);
  assert.equal(finCarouselQualification(enabled, { now, lastCompletedAnswerAt: null }), "rare_user");
});

test("the carousel shows up to three untouched, not removed suggestions in pool order", () => {
  let state = emptyFinSuggestionsState();
  assert.deepEqual(finCarouselSuggestions(state, FINHERMES_SUGGESTIONS).map((entry) => entry.id), [
    "second_opinion", "trade_journal", "post_mortem",
  ]);
  state = applyFinSuggestionAction(state, "second_opinion", "tried");
  state = applyFinSuggestionAction(state, "trade_journal", "removed");
  assert.deepEqual(finCarouselSuggestions(state, FINHERMES_SUGGESTIONS).map((entry) => entry.id), [
    "post_mortem", "analyst_digest", "bear_case",
  ]);
});

test("the surface shows Fin suggestions only when the host asks for them", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
  assert.match(host, /finSuggestions\?: boolean;/);
  assert.match(surface, /const finSuggestionsEnabled = host\.presentation\?\.finSuggestions === true;/);
  assert.match(surface, /onOpenSuggestions=\{finSuggestionsEnabled \? \(\) => selectMobileScreen\("suggestions"\) : undefined\}/);
  assert.match(surface, /\{tab === "suggestions" && finSuggestionsEnabled \? \(\s+<FinSuggestionsPage/);
  assert.match(surface, /\{tab === "suggestions" && !finSuggestionsEnabled && \(/);
  // The carousel: Home Chat only, never while a run is active.
  assert.match(surface, /finSuggestionsEnabled && isHomeChatActive && !activeChatRunId && !busy/);
  // A tap fills the composer and opens the chat; it sends nothing.
  const start = surface.slice(surface.indexOf("function startFinSuggestion("), surface.indexOf("function changeFinCarouselPreference("));
  assert.match(start, /setInput\(finHermesSuggestionDraft\(suggestion\)\)/);
  assert.match(start, /selectMobileScreen\("chat"\)/);
  assert.doesNotMatch(start, /sendMessage|createRun|submit/);
});
