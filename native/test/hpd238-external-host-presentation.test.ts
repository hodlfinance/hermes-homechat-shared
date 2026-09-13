import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("an embedded product host owns its visible locale", () => {
  assert.match(host, /appLocale\?: AppLocale/);
  assert.match(surface, /const hostAppLocale = host\.presentation\?\.appLocale/);
  assert.match(surface, /hostAppLocale \?\? normalizeMobileLocale\(nextSnapshot\.me\.preferredLocale\)/);
  assert.match(surface, /hostAppLocale \?\? normalizeMobileLocale\(enrichedSnapshot\.me\.preferredLocale\)/);
  assert.match(surface, /\{host\.presentation\?\.appLocale \? null : \(/);
});

test("an embedded product host can account for persistent native chrome above the keyboard", () => {
  assert.match(host, /keyboardVerticalOffset\?: number/);
  assert.match(surface, /Number\.isFinite\(host\.presentation\?\.keyboardVerticalOffset\)/);
  assert.match(surface, /Math\.max\(0, host\.presentation\?\.keyboardVerticalOffset \?\? 0\)/);
  assert.match(surface, /keyboardVerticalOffset=\{keyboardVerticalOffset\}/);
});
