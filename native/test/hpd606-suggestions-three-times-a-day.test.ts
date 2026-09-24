import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { FINHERMES_SUGGESTIONS } from "../core/finhermes-suggestions";
import {
  applyFinSuggestionAction,
  claimFinSuggestionCard,
  finSuggestionCardQualification,
  finSuggestionCardStaysVisible,
  mergeStoredFinSuggestionDay,
  parseFinSuggestionsState,
  serializeFinSuggestionsState,
  type FinSuggestionCardStorage,
  type FinSuggestionsDeviceState,
} from "../src/fin-suggestions-state";

// HPD-606, Justus 24.09. about 01:40Z on HODL Build 51 (shared 55ed1f1, #68):
// "Im neuen Build erscheinen immer noch Suggestions zu oft. Habe sie heute
// schon dreimal gesehen." #68 claimed the day once, but the claimed card then
// stayed on screen for the whole life of the chat, and HODL keeps the Hermes
// tab mounted. Every return to the tab or to the Home Chat showed it again.

function device(initial: string | null = null) {
  let stored = initial;
  const storage: FinSuggestionCardStorage & { stored: () => string | null } = {
    read: async () => stored,
    write: async (value: string) => { stored = value; },
    stored: () => stored,
  };
  return storage;
}

/**
 * The card logic of one mounted chat surface, as surface.tsx wires it: the
 * states read at mount, one claim per mount against fresh storage, the card
 * ends when the Home Chat leaves the front, and writes merge with storage.
 */
class Mount {
  private memory: FinSuggestionsDeviceState;
  private ids: string[] | null = null;
  private claimed = false;
  private ended = false;

  constructor(private readonly storage: ReturnType<typeof device>) {
    this.memory = parseFinSuggestionsState(storage.stored());
  }

  /** The Home Chat comes to the front; resolves whether the card is on screen. */
  async homeChatInFront(now: Date): Promise<boolean> {
    if (!this.ended && this.ids === null && !this.claimed
      && finSuggestionCardQualification(this.memory, { now, automationCount: 0 }) === "show") {
      this.claimed = true;
      const result = await claimFinSuggestionCard({ storage: this.storage, now, automationCount: 0, catalog: FINHERMES_SUGGESTIONS });
      if (result.state) this.memory = result.state;
      if (result.ids) this.ids = result.ids;
    }
    return this.ids !== null && !this.ended;
  }

  /** Another screen, conversation or HODL tab, or the app in the background. */
  leave(reason: "other_screen" | "other_conversation" | "other_hodl_tab" | "app_background") {
    const showing = this.ids !== null && !this.ended;
    const staysVisible = finSuggestionCardStaysVisible({
      homeChatInFront: reason !== "other_screen" && reason !== "other_conversation",
      hostVisible: reason !== "other_hodl_tab",
      appActive: reason !== "app_background",
    });
    if (showing && !staysVisible) this.ended = true;
  }

  /** "Tried" after sending an opener, written from this mount's copy. */
  async markTried(id: string) {
    this.memory = applyFinSuggestionAction(this.memory, id, "tried");
    await this.storage.write(serializeFinSuggestionsState(mergeStoredFinSuggestionDay(this.memory, this.storage.stored())));
  }
}

test("Justus' day: remount, app restart, new conversation, other HODL tab and background show the card once", async () => {
  const storage = device();
  const at = (hour: number, minute = 0) => new Date(2026, 8, 24, hour, minute);
  let appearances = 0;
  const seen = async (mount: Mount, now: Date) => { if (await mount.homeChatInFront(now)) appearances += 1; };

  // A chat mounted early, for example by a first HODL session, keeps an empty copy.
  const early = new Mount(storage);

  // 03:30 Hermes tab, Home Chat: the card appears.
  const chat = new Mount(storage);
  await seen(chat, at(3, 30));
  assert.equal(appearances, 1);

  // Another HODL tab and back: the chat stayed mounted, the card does not return.
  chat.leave("other_hodl_tab");
  await seen(chat, at(3, 35));
  // A new conversation and back to the Home Chat.
  chat.leave("other_conversation");
  await seen(chat, at(3, 40));
  // The Suggestions page and back.
  chat.leave("other_screen");
  await seen(chat, at(3, 45));
  // The app in the background and back.
  chat.leave("app_background");
  await seen(chat, at(9, 0));

  // The early copy writes "tried" without today's claim; the claim survives.
  await early.markTried(FINHERMES_SUGGESTIONS[5]!.id);
  assert.equal(parseFinSuggestionsState(storage.stored()).cardShownOn, "2026-09-24");

  // The chat is mounted again (new HODL session) and the app is restarted.
  await seen(new Mount(storage), at(12, 0));
  await seen(new Mount(device(storage.stored())), at(23, 59));

  assert.equal(appearances, 1, "one appearance on 24.09.");

  // Next calendar day on the device clock: once again.
  const tomorrow = new Mount(device(storage.stored()));
  assert.equal(await tomorrow.homeChatInFront(new Date(2026, 8, 25, 0, 5)), true);
});

test("a stale copy never undoes a newer claim, showings or progress on the device", () => {
  const stored = serializeFinSuggestionsState({
    version: 1,
    entries: { a_one: { progress: "tried", removed: false, shownAt: "2026-09-24T01:30:00.000Z" } },
    carouselSnoozedUntil: null,
    carouselDisabled: false,
    cardShownOn: "2026-09-24",
    cardShownAt: "2026-09-24T01:30:00.000Z",
    cardDismissedAt: null,
  });
  const stale = applyFinSuggestionAction(parseFinSuggestionsState(null), "b_two", "removed");
  const merged = mergeStoredFinSuggestionDay({ ...stale, cardShownOn: "2026-09-23" }, stored);
  assert.equal(merged.cardShownOn, "2026-09-24");
  assert.equal(merged.cardShownAt, "2026-09-24T01:30:00.000Z");
  assert.equal(merged.entries.a_one?.progress, "tried");
  assert.equal(merged.entries.a_one?.shownAt, "2026-09-24T01:30:00.000Z");
  assert.equal(merged.entries.b_two?.removed, true);
});

test("the surface ends the card when the Home Chat leaves the front and shows no other unrequested suggestion in the Fin host", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  // The host tells the surface when another HODL tab is in front.
  assert.match(surface, /function NativeR8SurfaceBody\(\{ initialDraft = "", navigationRequest, hostVisible = true \}/);
  assert.match(surface, /if \(tab !== "chat" \|\| activeChatRunId \|\| busy \|\| !hostVisible\) return;/);
  assert.match(surface, /finSuggestionCardStaysVisible\(\{ homeChatInFront: finHomeChatInFront, hostVisible, appActive: appState !== "background" \}\)\) \{\s+setFinCardClosed\(true\);/);
  assert.match(surface, /AppState\.addEventListener\("change", endWhenHidden\)/);
  // Every write merges with the stored day.
  assert.match(surface, /serializeFinSuggestionsState\(mergeStoredFinSuggestionDay\(next, stored\)\)/);
  assert.doesNotMatch(surface, /persistStoredString\(finSuggestionsStorageKey, serializeFinSuggestionsState\(next\)\)/);
  // No Hey home nudge and no empty-chat chips in the Fin host.
  assert.match(surface, /if \(!finSuggestionsEnabled && heySuggestionNudgeWorkspaceRef\.current !== snapshot\.workspace\.id\) \{/);
  assert.match(surface, /\{isHomeChatActive && heySuggestionNudge && !finSuggestionsEnabled \? \(/);
  assert.match(surface, /if \(!token \|\| !snapshot \|\| finSuggestionsEnabled\) return;\s+let cancelled = false;\s+api\s+\.chatSuggestions\(\)/);
  assert.match(surface, /<ChatEmptyState chatAccess=\{chatAccess\} suggestions=\{finSuggestionsEnabled \? \[\] : chatSuggestions\}/);
});
