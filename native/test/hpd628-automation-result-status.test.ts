import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/index";
import { mobileText } from "../src/appI18n";

const modelSource = readFileSync(new URL("../src/mobile-automation-card.ts", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../src/AutomationCard.tsx", import.meta.url), "utf8");

test("managed automation result truth reaches the visible native card", () => {
  assert.match(modelSource, /resultStatus: automation\.resultStatus/);
  assert.doesNotMatch(modelSource, /automation\.lastStatus/);
  assert.match(cardSource, /copy\.result\[automation\.resultStatus\]/);
});

test("every native locale names every structured automation result state", () => {
  for (const locale of appLocales) {
    const result = mobileText(locale).systemPages.automations.result;
    assert.deepEqual(Object.keys(result).sort(), ["failed", "never", "not_stored", "pending", "stored"]);
    assert.ok(Object.values(result).every((value) => value.trim().length > 0), locale);
  }
});
