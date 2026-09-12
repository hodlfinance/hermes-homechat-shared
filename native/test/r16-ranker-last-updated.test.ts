import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rankedTaskLastUpdatedText } from "../src/mobile-ranked-task-last-updated";

const appI18n = readFileSync(new URL("../src/appI18n.ts", import.meta.url), "utf8");
const rankedTaskList = readFileSync(new URL("../src/RankedTaskList.tsx", import.meta.url), "utf8");

test("the header uses the persisted collection timestamp and an honest missing state", () => {
  const seen: string[] = [];
  const formatInstant = (value: string) => {
    seen.push(value);
    return "10. Sept. 2026, 14:30";
  };

  assert.equal(rankedTaskLastUpdatedText({
    collectedAt: "2026-09-10T12:30:00.000Z",
    formatInstant,
    label: "Zuletzt aktualisiert",
    missing: "Noch nicht aktualisiert",
  }), "Zuletzt aktualisiert: 10. Sept. 2026, 14:30");
  assert.deepEqual(seen, ["2026-09-10T12:30:00.000Z"]);

  assert.equal(rankedTaskLastUpdatedText({
    collectedAt: null,
    formatInstant,
    label: "Zuletzt aktualisiert",
    missing: "Noch nicht aktualisiert",
  }), "Zuletzt aktualisiert: Noch nicht aktualisiert");
  assert.deepEqual(seen, ["2026-09-10T12:30:00.000Z"]);
});

test("all eight app locales carry last-update and missing-state copy", () => {
  assert.equal(appI18n.match(/[\"']?lastUpdated[\"']?:/g)?.length, 9);
  assert.equal(appI18n.match(/[\"']?notYetUpdated[\"']?:/g)?.length, 9);
});

test("the native header renders collection.collectedAt in a wrapping secondary line", () => {
  assert.match(rankedTaskList, /collection\.collectedAt/);
  assert.match(rankedTaskList, /style=\{styles\.lastUpdatedText\}/);
  assert.match(rankedTaskList, /lastUpdatedText:[\s\S]*?flexShrink: 1/);
});
