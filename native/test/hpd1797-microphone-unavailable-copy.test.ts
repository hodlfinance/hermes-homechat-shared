import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/types";
import { mobileText } from "../src/appI18n";

// HPD-1797: when the microphone cannot start, the composer shows this message
// in every app language, and a second tap cancels a start that is still pending.
test("every locale has a microphone-unavailable message", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).chat.microphoneUnavailable;
    assert.ok(copy && copy.trim().length > 0, locale);
  }
  assert.equal(mobileText("de").chat.microphoneUnavailable, "Mikrofon nicht verfügbar – bitte in den Einstellungen erlauben.");
});

test("the composer cancels a pending start and keeps the button tappable meanwhile", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(voiceStartPending\) \{[\s\S]{0,200}voiceNoteController\.cancel\(\)/);
  assert.match(source, /const voiceButtonDisabled = !voiceStartPending && /);
  assert.match(source, /setAppError\(t\.chat\.microphoneUnavailable\)/);
});
