import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the native chat composer paints placeholder and disabled draft text with the stronger secondary token", () => {
  assert.match(
    surface,
    /placeholder=\{voiceControllerBusy[\s\S]*?placeholderTextColor=\{palette\.secondary\}/,
  );
  assert.match(
    surface,
    /inputDisabled:\s*\{[\s\S]*?color:\s*palette\.secondary/,
  );
});
