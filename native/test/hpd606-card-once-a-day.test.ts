import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { FINHERMES_SUGGESTIONS } from "../core/finhermes-suggestions";
import {
  claimFinSuggestionCard,
  emptyFinSuggestionsState,
  markFinSuggestionCardDismissed,
  parseFinSuggestionsState,
  serializeFinSuggestionsState,
  type FinSuggestionCardStorage,
} from "../src/fin-suggestions-state";

// HPD-606, Justus 24.09. (about 00:45Z): the Home Chat card appeared a second
// time within an hour. Rule: at most once per calendar day in the device's
// time zone; showing and closing are kept on the device.

function deviceStorage(initial: string | null = null) {
  let stored = initial;
  const storage: FinSuggestionCardStorage & { stored: () => string | null } = {
    read: async () => stored,
    write: async (value: string) => { stored = value; },
    stored: () => stored,
  };
  return storage;
}

const claim = (storage: FinSuggestionCardStorage, now: Date, automationCount: number | null = 0) =>
  claimFinSuggestionCard({ storage, now, automationCount, catalog: FINHERMES_SUGGESTIONS });

test("shown once, not again that day, again the next day; an app restart changes nothing", async () => {
  const storage = deviceStorage();
  const morning = new Date(2026, 8, 24, 2, 45);
  const first = await claim(storage, morning);
  assert.equal(first.ids?.length, 3);
  const stored = parseFinSuggestionsState(storage.stored());
  assert.equal(stored.cardShownOn, "2026-09-24");
  assert.equal(stored.cardShownAt, morning.toISOString());

  // A second mount of the chat, a restart, or a stale copy in memory: the claim
  // reads the stored state again and shows nothing.
  assert.equal((await claim(storage, new Date(2026, 8, 24, 3, 40))).ids, null);
  const afterRestart = deviceStorage(storage.stored());
  assert.equal((await claim(afterRestart, new Date(2026, 8, 24, 23, 59))).ids, null);

  // Next calendar day on the device clock.
  const nextDay = await claim(afterRestart, new Date(2026, 8, 25, 0, 1));
  assert.equal(nextDay.ids?.length, 3);
});

test("closing the card is stored and uses up the day", async () => {
  const now = new Date(2026, 8, 24, 9, 0);
  const closed = markFinSuggestionCardDismissed(emptyFinSuggestionsState(), now);
  const storage = deviceStorage(serializeFinSuggestionsState(closed));
  assert.equal(parseFinSuggestionsState(storage.stored()).cardDismissedAt, now.toISOString());
  assert.equal((await claim(storage, new Date(2026, 8, 24, 18, 0))).ids, null);
  assert.equal((await claim(storage, new Date(2026, 8, 25, 8, 0))).ids?.length, 3);
});

test("a failed read or write shows nothing and stores nothing", async () => {
  const unreadable: FinSuggestionCardStorage = {
    read: async () => { throw new Error("keychain unavailable"); },
    write: async () => { throw new Error("not reached"); },
  };
  assert.deepEqual(await claim(unreadable, new Date(2026, 8, 24, 9, 0)), { state: null, ids: null });

  let writes = 0;
  const unwritable: FinSuggestionCardStorage = {
    read: async () => null,
    write: async () => { writes += 1; throw new Error("keychain unavailable"); },
  };
  const result = await claim(unwritable, new Date(2026, 8, 24, 9, 0));
  assert.equal(result.ids, null);
  assert.equal(writes, 1);
});

test("the surface claims from fresh storage, keeps states unloaded on a failed read, and stores X", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /async function readStoredStringStrict\(key: string\): Promise<string \| null> \{\s+if \(await canUseSecureStore\(\)\) return SecureStore\.getItemAsync\(key\);/);
  assert.match(surface, /void readStoredStringStrict\(finSuggestionsStorageKey\)\.then\(\(stored\) => \{\s+if \(!active\) return;\s+setFinSuggestionsState\(parseFinSuggestionsState\(stored\)\);\s+setFinSuggestionsLoaded\(true\);\s+\}\)\.catch\(\(\) => undefined\);/);
  assert.match(surface, /if \(qualification !== "show" \|\| finCardClaimRef\.current !== "idle"\) return;/);
  assert.match(surface, /updateFinSuggestionsState\(markFinSuggestionCardDismissed\(finSuggestionsState, new Date\(\)\)\);/);
  assert.doesNotMatch(surface, /setFinCarouselIds\(picked\)/);
});
