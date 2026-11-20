import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileHostHeaderMenuItems, type MobileHostHeaderMenuItem } from "../src/mobile-host-header";

/**
 * HPD-2263 (HODL Bots engine branch): the fourth optional host option,
 * `hiddenMenuItems`, leaves the named entries out of the Home chat's "..."
 * list. Absent or empty, the list is exactly what it was.
 */
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

const full: MobileHostHeaderMenuItem[] = [
  "pages", "newPage", "suggestions", "automations", "connections", "ai_access", "account", "support", "privacy", "dashboard", "sign_out",
];

test("hiddenMenuItems is optional and typed by the menu's own entry ids", () => {
  assert.match(host, /^  hiddenMenuItems\?: readonly MobileHostHeaderMenuItem\[\];$/m);
  assert.match(host, /import type \{ MobileHostHeaderMenuItem \} from "\.\/src\/mobile-host-header";/);
  assert.match(index, /export type \{ MobileHostHeaderMenuItem \} from "\.\/src\/mobile-host-header";/);
});

test("without hidden entries the list is unchanged", () => {
  const input = { suggestions: true, tasks: false, signOut: true };
  assert.deepEqual(mobileHostHeaderMenuItems(input), full);
  assert.deepEqual(mobileHostHeaderMenuItems({ ...input, hidden: undefined }), full);
  assert.deepEqual(mobileHostHeaderMenuItems({ ...input, hidden: null }), full);
  assert.deepEqual(mobileHostHeaderMenuItems({ ...input, hidden: [] }), full);
});

test("hidden entries are left out, the rest keeps its order", () => {
  const hidden: MobileHostHeaderMenuItem[] = ["pages", "newPage", "suggestions", "automations", "connections", "ai_access", "dashboard"];
  assert.deepEqual(
    mobileHostHeaderMenuItems({ suggestions: true, tasks: false, signOut: false, hidden }),
    ["account", "support", "privacy"],
  );
  // An id the list would not show anyway changes nothing.
  assert.deepEqual(
    mobileHostHeaderMenuItems({ suggestions: false, tasks: false, signOut: false, hidden: ["tasks", "sign_out"] }),
    ["pages", "newPage", "automations", "connections", "ai_access", "account", "support", "privacy", "dashboard"],
  );
});

test("the surface passes the host's hidden entries to the \"...\" list", () => {
  assert.match(surface, /const hostHeaderMenuEntries = mobileHostHeaderMenuItems\(\{[\s\S]{0,200}hidden: host\.hiddenMenuItems,[\s\S]{0,20}\}\);/);
  assert.match(surface, /items=\{hostHeaderMenuEntries\}/);
});

test("with every entry hidden the \"...\" button is not drawn; without hidden entries the list is never empty", () => {
  assert.match(surface, /activeSubthreadHeader\.kind !== "subthread" && hostHeaderMenuEntries\.length > 0 \? \(/);
  for (const suggestions of [true, false]) for (const tasks of [true, false]) for (const signOut of [true, false]) {
    assert.ok(mobileHostHeaderMenuItems({ suggestions, tasks, signOut }).length > 0);
  }
  const all: MobileHostHeaderMenuItem[] = [...full, "tasks"];
  assert.deepEqual(mobileHostHeaderMenuItems({ suggestions: true, tasks: true, signOut: true, hidden: all }), []);
});
