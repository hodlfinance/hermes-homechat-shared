import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NATIVE_R8_HOST_SCREENS, nativeR8HostScreenTarget } from "../src/host-screen-request";

// HPD-1582 (Justus, 2026-10-23, variant B): HODL's "Hermes settings" page opens
// each Hermes settings screen directly through the Surface prop screenRequest.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
const effect = surface.slice(
  surface.indexOf("const screenRequestRef = useRef<string | null>(null);"),
  surface.indexOf("const presentedChatTitle ="),
);

test("every host screen has the same destination as the chat's \"...\" menu", () => {
  assert.deepEqual(NATIVE_R8_HOST_SCREENS, ["ai_access", "connections", "automations", "privacy", "your_data", "access_history", "dashboard"]);
  assert.deepEqual(nativeR8HostScreenTarget("ai_access"), { kind: "tab", tab: "ai_access", anchor: null });
  assert.deepEqual(nativeR8HostScreenTarget("connections"), { kind: "tab", tab: "connections_customer", anchor: null });
  assert.deepEqual(nativeR8HostScreenTarget("automations"), { kind: "tab", tab: "automations", anchor: null });
  assert.deepEqual(nativeR8HostScreenTarget("your_data"), { kind: "tab", tab: "account", anchor: null });
  assert.deepEqual(nativeR8HostScreenTarget("access_history"), { kind: "tab", tab: "account", anchor: "access_history" });
  assert.deepEqual(nativeR8HostScreenTarget("privacy"), { kind: "privacy" });
  assert.deepEqual(nativeR8HostScreenTarget("dashboard"), { kind: "dashboard" });
});

test("an unknown screen name opens nothing", () => {
  assert.equal(nativeR8HostScreenTarget("support"), null);
  assert.equal(nativeR8HostScreenTarget("sign_out"), null);
  assert.equal(nativeR8HostScreenTarget(undefined), null);
});

test("the surface takes screenRequest and the package exports it", () => {
  assert.match(surface, /screenRequest\?: NativeR8ScreenRequest \| null;/);
  assert.match(surface, /headerThread = null, screenRequest = null \}: NativeR8SurfaceProps/);
  assert.match(index, /nativeR8HostScreenTarget/);
  assert.match(index, /NativeR8ScreenRequest/);
});

test("each new request opens its screen once, after the session is there", () => {
  assert.match(effect, /if \(!token \|\| !snapshot \|\| !screenRequest \|\| screenRequestRef\.current === screenRequest\.requestId\) return;/);
  assert.match(effect, /screenRequest\.onAccepted\?\.\(screenRequest\.requestId\);/);
  assert.match(effect, /selectMobileScreen\(target\.tab\);/);
  assert.match(effect, /setPrivacyWorkspace\(snapshot\.workspace\.id\);/);
  assert.match(effect, /void openNativeHermesDashboard\(\);/);
  assert.match(effect, /\[token, snapshot\?\.workspace\.id, screenRequest\?\.requestId\]/);
});

test("Access history scrolls the account page to its section", () => {
  assert.match(surface, /<ScrollView style=\{styles\.content\} contentContainerStyle=\{styles\.contentInner\} keyboardShouldPersistTaps="handled" ref=\{pageScrollRef\}>/);
  assert.match(surface, /accessHistoryAnchorRef=\{accessHistoryAnchorRef\}/);
  assert.match(surface, /<View ref=\{accessHistoryAnchorRef as never\} collapsable=\{false\}>\n\s+<MobileSystemSection title=\{accountCopy\.accessHistoryTitle\}>/);
  assert.match(effect, /anchor\.measureLayout\(content as never/);
  assert.match(effect, /scroll\?\.getInnerViewRef\?\.\(\) \?\? scroll\?\.getInnerViewNode\?\.\(\)/);
  assert.match(effect, /if \(attempts < 12\) timer = setTimeout\(tryScroll, 150\);/);
});
