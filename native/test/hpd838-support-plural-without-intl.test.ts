import assert from "node:assert/strict";
import test from "node:test";
import { supportAccessOpenCount } from "../core/support-access-copy";

// HPD-838 (Build 45): Hermes in React Native 0.77 has no Intl.PluralRules.
// With an open support grant, SupportAccessPanel's status line threw and the
// app crashed. The count must render without it.

test("the open-grant count renders when Intl.PluralRules is missing, as on Hermes", () => {
  const intl = Intl as unknown as { PluralRules?: unknown };
  const original = intl.PluralRules;
  delete intl.PluralRules;
  try {
    for (const locale of ["en", "de", "fr", "es"] as const) {
      assert.doesNotThrow(() => supportAccessOpenCount(locale, 1), locale);
      assert.doesNotThrow(() => supportAccessOpenCount(locale, 3), locale);
    }
    assert.equal(supportAccessOpenCount("fr", 1), "1 ouvert");
  } finally {
    intl.PluralRules = original;
  }
});

test("with Intl.PluralRules present the text is unchanged", () => {
  assert.equal(supportAccessOpenCount("fr", 1), "1 ouvert");
});
