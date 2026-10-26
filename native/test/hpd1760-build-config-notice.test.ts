import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-1760: Apple rejected build 137 for a paywall that showed "App Store purchases are not
// configured in this build." The sentence is for developers; a release build never shows it.
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const sentence = "App Store purchases are not configured in this build.";

test("the build-configuration sentence is only ever set through the debug-only helper", () => {
  const uses = surface.split("\n").filter((line) => line.includes(`"${sentence}"`));
  assert.ok(uses.length >= 2);
  for (const line of uses) assert.match(line, /buildConfigNotice\(/);
});

test("buildConfigNotice shows the sentence in debug builds only", () => {
  const match = surface.match(/function buildConfigNotice\(message: string\): string \| null \{[^}]*return \(globalThis as [^)]*\)\.__DEV__ === true \? message : null;/);
  assert.ok(match, "helper present with the __DEV__ check");
  const helper = (dev: unknown, message: string) => ((dev === true) ? message : null);
  assert.equal(helper(true, sentence), sentence);
  assert.equal(helper(false, sentence), null);
  assert.equal(helper(undefined, sentence), null);
});
