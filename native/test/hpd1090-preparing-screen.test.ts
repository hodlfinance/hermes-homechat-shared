import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/types";
import { heyPreparingCopy } from "../src/hey-preparing";

// HPD-1090: after the purchase and until the runtime is ready, web and app
// show a preparing screen in the HPD-1085 paywall design and switch to chat
// by themselves.

test("the preparing copy exists in all eight languages, with the accent inside the title", () => {
  for (const locale of appLocales) {
    const copy = heyPreparingCopy(locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}.${key}`);
    assert.ok(copy.title.includes(copy.titleAccent), locale);
    assert.notEqual(copy.body, copy.appBody, locale);
    assert.match(copy.body, /2.{1,3}3/, locale);
  }
  assert.equal(heyPreparingCopy("de").title, "Dein Hermes wird eingerichtet");
  assert.equal(heyPreparingCopy("en").body, "This usually takes 2–3 minutes. We’ll email you when it’s ready — you can close this page.");
  for (const locale of appLocales.filter((locale) => locale !== "en")) {
    assert.notEqual(heyPreparingCopy(locale).title, heyPreparingCopy("en").title, locale);
  }
});

test("the app replaces the locked chat with a full preparing screen and polls until ready", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(surface, /PendingProductAccessModal/);
  assert.match(surface, /if \(pendingProductAccess\) \{[\s\S]*?<HeyPreparingPanel/);
  assert.match(surface, /const timer = setInterval\(\(\) => void refreshProductAccess\(\), 5_000\);/);
  // Leaving the preparing screen reloads the full snapshot, which carries the
  // greeting the server persists only once the runtime is ready.
  assert.match(surface, /if \(wasPreparingRef\.current\) \{\s*wasPreparingRef\.current = false;\s*void refresh\(true\);/);
});
