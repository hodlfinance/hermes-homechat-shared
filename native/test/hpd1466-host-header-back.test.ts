import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileHostHeaderMenuItems, mobileHostHeaderMoreLabel, mobileHostHeaderTitle } from "../src/mobile-host-header";

/**
 * HPD-1466 (Justus, 2026-10-21, HODL build 9014): in the HODL Bots tab the old
 * left menu and its button are redundant; the bot list replaces them, and the
 * chat shows one header row. The option is optional: a host without it (Hey)
 * keeps the menu button and the left menu exactly as before.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

test("the host option is optional and typed", () => {
  assert.match(host, /headerBack\?: \{\s*onPress: \(\) => void;\s*accessibilityLabel: string;\s*button\?: ComponentType<\{ onPress: \(\) => void; accessibilityLabel: string \}>;\s*\};/);
  assert.match(surface, /const hostHeaderBack = host\.presentation\?\.headerBack \?\? null;/);
});

test("with the option no left menu can open; without it the menu button stays", () => {
  // Both drawers are guarded by the option.
  assert.equal((surface.match(/\{menuOpen && !hostHeaderBack \? \(\s*<MobileNavigationDrawer/g) ?? []).length, 2);
  assert.equal((surface.match(/<MobileNavigationDrawer\b/g) ?? []).length, 2);
  // The menu button is still drawn in both headers when the option is absent.
  assert.equal((surface.match(/onPress=\{\(\) => setMenuOpen\(true\)\}/g) ?? []).length, 2);
  assert.match(surface, /\) : hostHeaderBack \? \(\s*\/\/ HPD-1466[^]*?\(\) => \{ if \(tab === "chat"\) hostHeaderBack\.onPress\(\); else selectMobileScreen\("chat"\); \}/);
  // A subthread's back uses the host's button too; Hey keeps its chevron.
  assert.match(surface, /activeSubthreadHeader\.kind === "subthread" && hostHeaderBack \? \(\s*renderHostBackButton\(/);
  assert.match(surface, /const HostHeaderBackButton = hostHeaderBack\?\.button \?\? null;/);
});

test("one header row: back, the thread's mark and name, and ... in the Home chat", () => {
  assert.match(surface, /<HostIdentityFigure size=\{28\} thread=\{pendingHostAssistantThread \?\? activeAssistantThread\} \/>/);
  assert.match(surface, /mobileHostHeaderTitle\(\{ tab, session: activeChatSession, productName: appCopy\.productName, homeTitle: host\.presentation\?\.homeChatTitle/);
  assert.match(surface, /onPress=\{\(\) => setHostHeaderMenuOpen\(true\)\}[^]*?accessibilityLabel=\{mobileHostHeaderMoreLabel\(appLocale\)\}/);
  // The automation thread keeps its own options (View all automations, Delete).
  assert.match(surface, /automationThreadHeader \? null : tab === "chat" && activeSubthreadHeader\.kind !== "subthread" \? \(\s*<Pressable/);
});

test("the ... list keeps every destination of the left menu reachable", () => {
  assert.deepEqual(mobileHostHeaderMenuItems({ suggestions: true, tasks: false, signOut: false }), [
    "pages", "newPage", "suggestions", "automations", "connections", "ai_access", "account", "support", "privacy", "dashboard",
  ]);
  assert.deepEqual(mobileHostHeaderMenuItems({ suggestions: false, tasks: true, signOut: true }), [
    "pages", "newPage", "tasks", "automations", "connections", "ai_access", "account", "support", "privacy", "dashboard", "sign_out",
  ]);
  for (const [item, action] of [
    ["pages", 'selectMobileScreen("bookmarks")'],
    ["newPage", "void openPageEntry()"],
    ["suggestions", 'selectMobileScreen("suggestions")'],
    ["automations", 'selectMobileScreen("automations")'],
    ["connections", 'selectMobileScreen("connections_customer")'],
    ["ai_access", 'selectMobileScreen("ai_access")'],
    ["account", 'selectMobileScreen("account")'],
    ["support", 'selectMobileScreen("support")'],
    ["privacy", "setPrivacyWorkspace(snapshot.workspace.id)"],
    ["dashboard", "void openNativeHermesDashboard()"],
  ] as const) {
    assert.ok(surface.includes(`if (item === "${item}") ${action};`), item);
  }
});

test("the title names the thread, Hermes for Home, the page elsewhere", () => {
  const base = { productName: "Hermes", screenTitle: "Pages" };
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: null }), "Hermes");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "home", title: "Home" } }), "Hermes");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "chat", title: " Daily report " } }), "Daily report");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "chat", session: { role: "chat", title: "" } }), "Hermes");
  assert.equal(mobileHostHeaderTitle({ ...base, tab: "bookmarks", session: { role: "chat", title: "X" } }), "Pages");
  assert.equal(mobileHostHeaderMoreLabel("en"), "More options");
  assert.equal(mobileHostHeaderMoreLabel("de"), "Weitere Optionen");
});
