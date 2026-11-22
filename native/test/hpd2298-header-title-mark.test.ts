import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * HPD-2298 (spec 2.12 Fresh user mode): while Fresh user mode is on, the
 * HODL Bots thread header carries the mark "Fresh" next to the bot's name.
 * The host draws the mark itself (presentation.headerTitleMark); the surface
 * only places it after the name in the headerBack row. Hey passes none.
 */
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the option is optional and takes no props", () => {
  assert.match(host, /headerTitleMark\?: ComponentType<Record<string, never>>;/);
});

test("the mark is used only with headerBack", () => {
  assert.match(surface, /const HostHeaderTitleMark = host\.presentation\?\.headerBack \? host\.presentation\?\.headerTitleMark \?\? null : null;/);
});

test("the mark stands after the name in both headerBack rows, in the chat only", () => {
  const marks = surface.match(/<HostHeaderTitleMark \/>/g) || [];
  assert.equal(marks.length, 2);
  assert.match(surface, /\{pendingHostHeaderThread\?\.title \|\| appCopy\.productName\}<\/Text>\s*\{HostHeaderTitleMark \? <HostHeaderTitleMark \/> : null\}/);
  assert.match(surface, /screenTitle: mobileScreenTitle\(tab, settingsSection, t, appLocale\) \}\)\}\s*<\/Text>\s*\{tab === "chat" && HostHeaderTitleMark \? <HostHeaderTitleMark \/> : null\}/);
});
