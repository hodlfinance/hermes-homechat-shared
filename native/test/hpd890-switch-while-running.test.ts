import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileChatSessionLoadAllowed } from "../src/mobile-subthread-view";

// HPD-890, Justus on HODL Build 61: in an automation thread he asked a
// follow-up; while it was answering, "Home Chat" in the menu did nothing. The
// chat drawer (Hey and HODL render the same one) asked for a plain load,
// which is refused while a reply streams. Menu navigation is deliberate: it
// switches at once, the running reply keeps its native run, and the thread
// shows it on the way back. The drawer of the connecting screen is not the
// chat's and stays as it was (hpd407-opening-menu).

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const drawerMounts = [...source.matchAll(/<MobileNavigationDrawer[\s\S]*?\/>/g)].map((match) => match[0]);
const chatDrawer = drawerMounts.find((mount) => mount.includes("openMobileHomeChat")) ?? "";

test("HPD-890: a deliberate load is allowed while a reply is running; a plain one is not", () => {
  const running = { busy: true, chatSessionsBusy: false, loadingOlderMessages: false };
  assert.equal(mobileChatSessionLoadAllowed({ ...running, deliberate: true }), true);
  assert.equal(mobileChatSessionLoadAllowed({ ...running, deliberate: false }), false);
});

test("HPD-890: the chat drawer opens Home Chat as deliberate navigation", () => {
  assert.equal(drawerMounts.length, 2, "the connecting screen's drawer and the chat drawer");
  assert.match(chatDrawer, /onOpenHome=\{\(\) => void openMobileHomeChat\(\{ force: true \}\)\}/);
});

test("HPD-890: the chat drawer opens an automation thread as deliberate navigation", () => {
  assert.match(chatDrawer, /onOpenSession=\{\(sessionId\) => void loadMobileChatSession\(sessionId, \{ force: true \}\)\}/);
});

test("HPD-890: opening Home Chat passes the deliberate flag through to the load", () => {
  const openHome = source.slice(source.indexOf("async function openMobileHomeChat("));
  const body = openHome.slice(0, openHome.indexOf("\n  }\n"));
  assert.match(body, /await loadMobileChatSession\(homeSession\.id, options\);/);
});

test("HPD-890: leaving a conversation drops only its presentation, not its run", () => {
  const select = source.slice(source.indexOf("const selectActiveConversationSession = useCallback("));
  const body = select.slice(0, select.indexOf("}, []);"));
  assert.match(body, /mobileRunPresentationOwner\.invalidate\(\);/);
  assert.match(body, /setBusy\(false\);/);
  assert.doesNotMatch(body, /stopRun|stopReply|abort\(/, "navigation never stops the native run");
});
