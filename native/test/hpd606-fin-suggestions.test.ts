import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FINHERMES_SUGGESTION_DRAFT_GUARD,
  FINHERMES_SUGGESTIONS,
  finHermesSuggestionDraft,
  finHermesSuggestionWasSent,
} from "../core/finhermes-suggestions";
import {
  applyFinCarouselPreference,
  applyFinSuggestionAction,
  emptyFinSuggestionsState,
  finCarouselSuggestions,
  finLockedCarouselSuggestions,
  finSuggestionCardQualification,
  finSuggestionEntryState,
  finSuggestionLocalDay,
  FIN_CAROUSEL_COOLDOWN_MS,
  FIN_CAROUSEL_SNOOZE_MS,
  markFinSuggestionCardShown,
  markFinSuggestionsShown,
  parseFinSuggestionsState,
  serializeFinSuggestionsState,
} from "../src/fin-suggestions-state";

// HPD-606, visible part (Release 34, Build 46).

const core = (entry: { progress: string; removed: boolean }) => ({ progress: entry.progress, removed: entry.removed });

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

test("a tap's draft is the opener and the guard sentence; the id stays out of the visible text", () => {
  const warRoom = FINHERMES_SUGGESTIONS.find((entry) => entry.id === "war_room")!;
  const draft = finHermesSuggestionDraft(warRoom);
  assert.equal(draft, `${warRoom.opener} ${FINHERMES_SUGGESTION_DRAFT_GUARD}`);
  assert.doesNotMatch(draft, /war_room|suggestion:/);
});

test("a suggestion counts as tried only when its opener was actually sent", () => {
  const warRoom = FINHERMES_SUGGESTIONS.find((entry) => entry.id === "war_room")!;
  assert.equal(finHermesSuggestionWasSent(warRoom, finHermesSuggestionDraft(warRoom)), true);
  // Edited after the opening words: still the suggestion.
  assert.equal(finHermesSuggestionWasSent(warRoom, `${warRoom.opener.slice(0, 40)}  and only for NVDA please`), true);
  // Replaced by something else entirely: not tried.
  assert.equal(finHermesSuggestionWasSent(warRoom, "How is NVIDIA doing today?"), false);
  assert.equal(finHermesSuggestionWasSent(warRoom, ""), false);
});

test("device states survive a restart and malformed storage never breaks the page", () => {
  const tried = applyFinSuggestionAction(emptyFinSuggestionsState(), "war_room", "tried");
  const restored = parseFinSuggestionsState(serializeFinSuggestionsState(tried));
  assert.deepEqual(core(finSuggestionEntryState(restored, "war_room")), { progress: "tried", removed: false });
  for (const raw of [null, "", "not json", "[]", '{"version":2}', '{"version":1,"entries":{"BAD ID":{"progress":"tried"}}}']) {
    const parsed = parseFinSuggestionsState(raw);
    assert.equal(Object.keys(parsed.entries).length, 0, String(raw));
    assert.equal(parsed.carouselDisabled, false);
  }
  const bogus = parseFinSuggestionsState('{"version":1,"entries":{"war_room":{"progress":"exploded"}},"carouselSnoozedUntil":"never"}');
  assert.deepEqual(core(finSuggestionEntryState(bogus, "war_room")), { progress: "untouched", removed: false });
  assert.equal(bogus.carouselSnoozedUntil, null);
});

test("tried, running, removed and restored follow the spec", () => {
  let state = emptyFinSuggestionsState();
  state = applyFinSuggestionAction(state, "war_room", "tried");
  state = applyFinSuggestionAction(state, "war_room", "completed");
  assert.deepEqual(core(finSuggestionEntryState(state, "war_room")), { progress: "completed", removed: false });
  // Trying a running suggestion again does not demote it.
  state = applyFinSuggestionAction(state, "war_room", "tried");
  assert.equal(finSuggestionEntryState(state, "war_room").progress, "completed");
  state = applyFinSuggestionAction(state, "signal_lab", "removed");
  assert.deepEqual(core(finSuggestionEntryState(state, "signal_lab")), { progress: "untouched", removed: true });
  state = applyFinSuggestionAction(state, "signal_lab", "restored");
  assert.deepEqual(core(finSuggestionEntryState(state, "signal_lab")), { progress: "untouched", removed: false });
});

test("the Home Chat card rule (Justus, 23.09.): never, later, once a day, fewer than two automations", () => {
  const now = new Date(2026, 8, 25, 8, 0, 0);
  const fresh = emptyFinSuggestionsState();
  assert.equal(finSuggestionCardQualification(fresh, { now, automationCount: null }), "automations_unknown");
  assert.equal(finSuggestionCardQualification(fresh, { now, automationCount: 0 }), "show");
  assert.equal(finSuggestionCardQualification(fresh, { now, automationCount: 1 }), "show");
  assert.equal(finSuggestionCardQualification(fresh, { now, automationCount: 2 }), "enough_automations");
  // Once a day: shown this morning, not again tonight; again tomorrow.
  const shown = markFinSuggestionCardShown(fresh, ["second_opinion"], now);
  assert.equal(shown.cardShownOn, finSuggestionLocalDay(now));
  assert.equal(finSuggestionCardQualification(shown, { now: new Date(2026, 8, 25, 23, 30), automationCount: 0 }), "shown_today");
  assert.equal(finSuggestionCardQualification(shown, { now: new Date(2026, 8, 26, 7, 0), automationCount: 0 }), "show");
  assert.equal(finSuggestionEntryState(shown, "second_opinion").shownAt, now.toISOString());
  // Later: seven days; Never: for good; both win over the automation count.
  const later = applyFinCarouselPreference(fresh, "later", now);
  assert.equal(finSuggestionCardQualification(later, { now: new Date(2026, 9, 1, 8, 0), automationCount: 0 }), "card_snoozed");
  const afterSnooze = new Date(now.getTime() + FIN_CAROUSEL_SNOOZE_MS + 1);
  assert.equal(finSuggestionCardQualification(later, { now: afterSnooze, automationCount: 0 }), "show");
  const never = applyFinCarouselPreference(later, "never", now);
  assert.equal(finSuggestionCardQualification(never, { now: afterSnooze, automationCount: 0 }), "card_disabled");
  // The day survives a restart; a malformed day is ignored.
  assert.equal(parseFinSuggestionsState(serializeFinSuggestionsState(shown)).cardShownOn, shown.cardShownOn);
  assert.equal(parseFinSuggestionsState(JSON.stringify({ ...shown, cardShownOn: "yesterday" })).cardShownOn, null);
  // A Build 46 state without the field reads as never shown.
  const { cardShownOn: _dropped, ...build46 } = shown;
  assert.equal(parseFinSuggestionsState(JSON.stringify(build46)).cardShownOn, null);
});

test("the carousel shows up to three untouched, not removed suggestions in pool order", () => {
  const now = new Date("2026-09-25T08:00:00.000Z");
  let state = emptyFinSuggestionsState();
  assert.deepEqual(finCarouselSuggestions(state, FINHERMES_SUGGESTIONS, now).map((entry) => entry.id), [
    "second_opinion", "trade_journal", "post_mortem",
  ]);
  state = applyFinSuggestionAction(state, "second_opinion", "tried");
  state = applyFinSuggestionAction(state, "trade_journal", "removed");
  assert.deepEqual(finCarouselSuggestions(state, FINHERMES_SUGGESTIONS, now).map((entry) => entry.id), [
    "post_mortem", "analyst_digest", "bear_case",
  ]);
});

test("all three shown suggestions get the cooldown; the carousel on screen keeps its set", () => {
  const now = new Date("2026-09-25T08:00:00.000Z");
  const first = finCarouselSuggestions(emptyFinSuggestionsState(), FINHERMES_SUGGESTIONS, now).map((entry) => entry.id);
  const shown = markFinSuggestionsShown(emptyFinSuggestionsState(), first, now);
  // The next session within 14 days gets the next three, not the same ones.
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  assert.deepEqual(finCarouselSuggestions(shown, FINHERMES_SUGGESTIONS, tomorrow).map((entry) => entry.id), [
    "analyst_digest", "bear_case", FINHERMES_SUGGESTIONS[5]!.id,
  ]);
  // After the cooldown they may come back.
  const later = new Date(now.getTime() + FIN_CAROUSEL_COOLDOWN_MS);
  assert.deepEqual(finCarouselSuggestions(shown, FINHERMES_SUGGESTIONS, later).map((entry) => entry.id), first);
  // The set on screen stays, minus what the customer removed or sent.
  let acted = applyFinSuggestionAction(shown, first[0]!, "removed");
  acted = applyFinSuggestionAction(acted, first[1]!, "tried");
  assert.deepEqual(finLockedCarouselSuggestions(acted, FINHERMES_SUGGESTIONS, first).map((entry) => entry.id), [first[2]]);
  // The cooldown survives a restart.
  const reloaded = parseFinSuggestionsState(serializeFinSuggestionsState(shown));
  assert.equal(finSuggestionEntryState(reloaded, first[0]!).shownAt, now.toISOString());
});

test("the surface shows Fin suggestions only when the host asks for them", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
  assert.match(host, /finSuggestions\?: boolean;/);
  assert.match(surface, /const finSuggestionsEnabled = host\.presentation\?\.finSuggestions === true;/);
  assert.match(surface, /onOpenSuggestions=\{finSuggestionsEnabled \? \(\) => selectMobileScreen\("suggestions"\) : undefined\}/);
  assert.match(surface, /\{tab === "suggestions" && finSuggestionsEnabled \? \(\s+<FinSuggestionsPage/);
  assert.match(surface, /\{tab === "suggestions" && !finSuggestionsEnabled && \(/);
  // The card: Home Chat only, first shown while idle, pinned under the header
  // and outside the transcript; the transcript carries no suggestions.
  assert.match(surface, /if \(tab !== "chat" \|\| activeChatRunId \|\| busy\) return;/);
  assert.match(surface, /finSuggestionsEnabled && finSuggestionsLoaded && isHomeChatActive && !finCardClosed && finCarouselIds/);
  assert.match(surface, /<View style=\{styles\.chatScreen\}>\s+\{\/\* HPD-606: pinned under the header, not part of the transcript\. \*\/\}\s+\{finCard\.length \? \(\s+<FinSuggestionCard/);
  assert.doesNotMatch(surface, /FinSuggestionCarousel/);
  const transcript = surface.slice(surface.indexOf("{visibleMobileMessages.map((message) => ("), surface.indexOf("{showScrollDown ? ("));
  assert.doesNotMatch(transcript, /FinSuggestion|finCard/);
  // The automation count is read, never guessed; the card opens the full page.
  assert.match(surface, /hermesApi\.automations\(\)\s+\.then\(\(view\) => setFinAutomationCount\(view\.jobs\.length\)\)/);
  assert.match(surface, /onSeeAll=\{\(\) => selectMobileScreen\("suggestions"\)\}/);
  // A tap fills the composer and opens the chat; it sends nothing and marks nothing.
  const start = surface.slice(surface.indexOf("function startFinSuggestion("), surface.indexOf("function changeFinCarouselPreference("));
  assert.match(start, /pendingFinSuggestionRef\.current = suggestion/);
  assert.match(start, /setInput\(finHermesSuggestionDraft\(suggestion\)\)/);
  assert.match(start, /selectMobileScreen\("chat"\)/);
  assert.doesNotMatch(start, /sendMessage|createRun|submit|"tried"/);
  // "tried" is recorded after a real send that still carries the opener.
  const send = surface.slice(surface.indexOf("  async function send() {"), surface.indexOf("  async function mobileAttachmentFromAsset("));
  assert.match(send, /finHermesSuggestionWasSent\(pendingSuggestion, message\)/);
  assert.match(send, /applyFinSuggestionAction\(current, pendingSuggestion\.id, "tried"\)/);
  // Nothing is written before the stored states are read.
  assert.match(surface, /if \(!finSuggestionsLoaded\) return;/);
  assert.match(surface, /updateFinSuggestionsState\(markFinSuggestionCardShown\(finSuggestionsState, picked, now\)\)/);
});
