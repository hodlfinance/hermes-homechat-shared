import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const opening = source.slice(
  source.indexOf("const renderChatOpening"),
  source.indexOf("if (!sessionRestored)"),
);

test("the native chat menu stays available while the external runtime is connecting", () => {
  assert.match(opening, /onPress=\{\(\) => setMenuOpen\(true\)\}/);
  assert.doesNotMatch(opening, /accessibilityState=\{\{ disabled: true \}\}/);
  assert.match(opening, /label=\{t\.nav\.chat\}/);
  assert.match(opening, /label=\{t\.nav\.automations\}/);
  assert.match(opening, /label=\{t\.nav\.aiAccess\}/);
  assert.match(opening, /label=\{t\.nav\.dashboard\}/);
});
