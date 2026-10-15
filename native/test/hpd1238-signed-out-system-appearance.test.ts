import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { effectiveAppearancePreference, resolvedAppearanceScheme } from "../src/appearance-preference";

// HPD-1238 (Justus, 2026-10-15): the screens before sign-in always follow the
// iPhone's own appearance; the in-app Appearance setting applies only after
// sign-in. HODL (session mode "external") renders no signed-out screen of ours
// and keeps its behaviour unchanged.

function schemeFor(input: { stored: "system" | "light" | "dark"; signedIn: boolean; system: "light" | "dark"; mode?: "standalone" | "external" }) {
  const preference = effectiveAppearancePreference({ stored: input.stored, signedIn: input.signedIn, sessionMode: input.mode ?? "standalone" });
  return resolvedAppearanceScheme(preference, input.system);
}

test("HPD-1238: signed out with the in-app setting on Dark and the iPhone on Light, the screens are light", () => {
  assert.equal(effectiveAppearancePreference({ stored: "dark", signedIn: false, sessionMode: "standalone" }), "system");
  assert.equal(schemeFor({ stored: "dark", signedIn: false, system: "light" }), "light");
  assert.equal(schemeFor({ stored: "light", signedIn: false, system: "light" }), "light");
});

test("HPD-1238: signed out with the iPhone on Dark, the screens are dark", () => {
  assert.equal(schemeFor({ stored: "dark", signedIn: false, system: "dark" }), "dark");
  assert.equal(schemeFor({ stored: "light", signedIn: false, system: "dark" }), "dark");
  assert.equal(schemeFor({ stored: "system", signedIn: false, system: "dark" }), "dark");
});

test("HPD-1238: signed in, the in-app setting wins as before", () => {
  assert.equal(schemeFor({ stored: "dark", signedIn: true, system: "light" }), "dark");
  assert.equal(schemeFor({ stored: "light", signedIn: true, system: "dark" }), "light");
  assert.equal(schemeFor({ stored: "system", signedIn: true, system: "dark" }), "dark");
  assert.equal(schemeFor({ stored: "system", signedIn: true, system: "light" }), "light");
  // No system scheme reported means light, as before.
  assert.equal(resolvedAppearanceScheme("system", null), "light");
});

test("HPD-1238: HODL (external session) keeps the stored setting whatever the sign-in state", () => {
  assert.equal(effectiveAppearancePreference({ stored: "dark", signedIn: false, sessionMode: "external" }), "dark");
  assert.equal(effectiveAppearancePreference({ stored: "light", signedIn: true, sessionMode: "external" }), "light");
});

test("HPD-1238: the surface forces the window scheme and colours from the effective preference only", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /effectiveAppearancePreference\(\{ stored: appearancePreference, signedIn: Boolean\(token\), sessionMode: host\.session\.mode \}\)/);
  assert.match(source, /const resolvedColorScheme = resolvedAppearanceScheme\(activeAppearancePreference, systemColorScheme\);/);
  assert.match(source, /Appearance\.setColorScheme\(activeAppearancePreference === "system" \? null : activeAppearancePreference\)/);
  assert.match(source, /\}, \[activeAppearancePreference\]\);/);
  // The window scheme is never set from the raw stored setting any more.
  assert.doesNotMatch(source, /Appearance\.setColorScheme\(appearancePreference/);
  // The menu still shows and edits the stored setting.
  assert.match(source, /appearancePreference=\{appearancePreference\}/);
});
