import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileHomeChatHydrationSelection } from "../src/mobile-home-chat-startup.ts";
import {
  mobileHostThreadLoading,
  mobileHostThreadTarget,
  mobileHostThreadTargetKey,
  mobileMessagePagesEqual,
  mobileStartupHydrationAllowed,
  mobileStartupMaySelectConversation,
  mobileStartupPaintsSnapshotMessages,
  type MobileHostThreadTarget,
} from "../src/mobile-host-thread-open.ts";

// HPD-1504 (HODL iOS 10.0 build 9022, Justus 2026-10-23): bots opened from the
// HODL Bots list showed the Home thread. Live evidence, Plane access log for
// his workspace: every bot page read was followed in the same second by a
// Home page read, e.g. 01:02:42 session_RorgvROmC6qL3o/messages (Mike-Wilson-
// Scanner) then session_default_ws_.../messages twice.

const HOME = "session_default_ws_test";
const BOT = "session_bot_mike_wilson";

/**
 * The startup refresh and the host's navigation, in the order React's legacy
 * root runs them on HODL iOS: the snapshot publish renders synchronously and
 * the next state update flushes the navigation effect, so the bot load starts
 * (and bumps the selection version) before the old code noted the version.
 * The refresh then asks for Home's page; the bot page answers first, Home's
 * second, and the old hydration painted Home's page under the bot - exactly
 * the access-log order: bot page, Home page, bot read marker.
 */
function simulateBotOpen(options: { noteVersionAtRefreshStart: boolean; hostRules: boolean }) {
  const target: MobileHostThreadTarget | null = options.hostRules
    ? mobileHostThreadTarget({ navigationConversationId: BOT, headerThread: { conversationId: BOT, home: false, title: "Mike-Wilson-Scanner" }, hostListsThreads: true })
    : null;
  let settledKey: string | null = null;
  let version = 0;
  let active: string | null = null;
  const painted: string[] = [];
  const maySelect = () => mobileStartupMaySelectConversation({
    target,
    targetSettled: settledKey !== null && settledKey === mobileHostThreadTargetKey(target),
    activeConversationId: active,
  });
  const paint = (thread: string) => {
    if (!mobileHostThreadLoading(target, settledKey)) painted.push(thread);
  };
  const hydration = (selectionVersionAtStart: number) => {
    const selection = mobileHomeChatHydrationSelection({
      activeRunSessionId: null,
      currentSelectionId: active,
      currentSelectionVersion: version,
      firstSessionId: HOME,
      homeSessionId: HOME,
      selectionVersionAtStart,
    });
    const applies = selection.applyHydration && mobileStartupHydrationAllowed({
      versionAtRefreshStart: selectionVersionAtStart,
      currentVersion: version,
      maySelect: maySelect(),
    });
    return applies ? selection.sessionId : null;
  };

  // Refresh starts.
  const versionAtRefreshStart = version;
  // Snapshot published: Home selected and (without a host thread) painted.
  if (!active && maySelect()) active = HOME;
  if (mobileStartupPaintsSnapshotMessages(target)) paint(HOME);
  // Legacy root: the navigation effect runs inside the publish.
  version += 1; // loadMobileChatSession(BOT) starts
  const botLoadVersion = version;
  const selectionVersionAtStart = options.noteVersionAtRefreshStart ? versionAtRefreshStart : version;
  // Hydration, first look: which page to ask for.
  const requestedPage = hydration(selectionVersionAtStart);
  // The bot page answers first.
  if (version === botLoadVersion) {
    active = BOT;
    settledKey = mobileHostThreadTargetKey({ kind: "thread", conversationId: BOT });
    paint(BOT);
  }
  // Then the refresh's page; the hydration looks again and applies it.
  if (requestedPage) {
    const selected = hydration(selectionVersionAtStart);
    if (selected) {
      active = selected;
      paint(requestedPage);
    }
  }
  return { active, painted };
}

test("reproduction: with the version noted after the snapshot, Home replaces the opened bot", () => {
  const before = simulateBotOpen({ noteVersionAtRefreshStart: false, hostRules: false });
  // The bot is selected (its header and read marker), but Home's page is what is painted last.
  assert.equal(before.active, BOT);
  assert.deepEqual(before.painted, [HOME, BOT, HOME]);
});

test("fixed: the bot stays, and nothing but the bot is ever painted", () => {
  const after = simulateBotOpen({ noteVersionAtRefreshStart: true, hostRules: true });
  assert.equal(after.active, BOT);
  assert.deepEqual(after.painted, [BOT]);
});

test("noting the version at refresh start alone already keeps the bot's page (Hey and every host)", () => {
  const after = simulateBotOpen({ noteVersionAtRefreshStart: true, hostRules: false });
  assert.equal(after.active, BOT);
  assert.equal(after.painted[after.painted.length - 1], BOT);
});

test("host target: a navigation request names a thread; the Bots list's Home is Home; Hey has none", () => {
  assert.deepEqual(mobileHostThreadTarget({ navigationConversationId: BOT, headerThread: null, hostListsThreads: true }), { kind: "thread", conversationId: BOT });
  assert.deepEqual(mobileHostThreadTarget({ navigationConversationId: null, headerThread: { conversationId: null, home: true, title: "Hermes" }, hostListsThreads: true }), { kind: "home" });
  assert.equal(mobileHostThreadTarget({ navigationConversationId: null, headerThread: { conversationId: null, home: true, title: "Hermes" }, hostListsThreads: false }), null);
  assert.equal(mobileHostThreadTarget({ navigationConversationId: "  ", headerThread: null, hostListsThreads: true }), null);
});

test("a host thread that could not be opened is never replaced by Home", () => {
  const target: MobileHostThreadTarget = { kind: "thread", conversationId: BOT };
  assert.equal(mobileStartupMaySelectConversation({ target, targetSettled: false, activeConversationId: null }), false);
  assert.equal(mobileStartupMaySelectConversation({ target, targetSettled: true, activeConversationId: null }), false);
  assert.equal(mobileStartupMaySelectConversation({ target, targetSettled: true, activeConversationId: BOT }), true);
  assert.equal(mobileStartupMaySelectConversation({ target: { kind: "home" }, targetSettled: false, activeConversationId: null }), true);
  assert.equal(mobileStartupMaySelectConversation({ target: null, targetSettled: false, activeConversationId: null }), true);
});

test("neutral loading until the host's thread settles; Home from the list paints once", () => {
  assert.equal(mobileHostThreadLoading({ kind: "thread", conversationId: BOT }, null), true);
  assert.equal(mobileHostThreadLoading({ kind: "thread", conversationId: BOT }, "home"), true);
  assert.equal(mobileHostThreadLoading({ kind: "thread", conversationId: BOT }, `thread:${BOT}`), false);
  assert.equal(mobileHostThreadLoading({ kind: "home" }, "home"), false);
  assert.equal(mobileHostThreadLoading(null, null), false);
  assert.equal(mobileStartupPaintsSnapshotMessages({ kind: "home" }), false);
  assert.equal(mobileStartupPaintsSnapshotMessages(null), true);
});

test("an identical re-hydration is not painted again", () => {
  const page = [{ id: "m1", text: "a" }, { id: "m2", text: "b" }];
  assert.equal(mobileMessagePagesEqual(page, page.map((message) => ({ ...message }))), true);
  assert.equal(mobileMessagePagesEqual(page, [{ id: "m1", text: "a" }, { id: "m2", text: "b2" }]), false);
  assert.equal(mobileMessagePagesEqual(page, [{ id: "m1", text: "a" }]), false);
});

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const refreshBody = surface.slice(surface.indexOf("const refresh = useCallback((afterCurrent = false) => {"), surface.indexOf("const refreshProductAccess = useCallback("));

test("the surface notes the selection version before the snapshot request, not after", () => {
  const noted = refreshBody.indexOf("const selectionVersionAtStart = conversationSelectionVersionRef.current;");
  assert.ok(noted > 0);
  assert.ok(noted < refreshBody.indexOf("await api.startupSnapshot()"));
  assert.equal(refreshBody.split("const selectionVersionAtStart =").length, 2);
});

test("the surface guards snapshot selection, snapshot paint, hydration and recovery by the host thread", () => {
  assert.match(refreshBody, /if \(!activeConversationSessionIdRef\.current && snapshotSessionId && startupMaySelectConversation\(\)\)/);
  assert.match(refreshBody, /if \(wasInitialSnapshot && mobileStartupPaintsSnapshotMessages\(hostThreadTargetRef\.current\)\)/);
  assert.equal(refreshBody.split("mobileStartupHydrationAllowed({").length, 3);
  assert.match(refreshBody, /if \(sessionForRecovery && !hydratedMessages\.length && startupMaySelectConversation\(\)\)/);
  assert.match(refreshBody, /mobileMessagePagesEqual\(messagesStateRef\.current, hydratedMessages\)/);
  // A page fetched for one thread is never painted under another.
  assert.match(refreshBody, /currentHydrationSelection\.sessionId === hydrationSelection\.sessionId/);
});

test("the navigation request settles the loading state whether or not the thread opened", () => {
  const effect = surface.slice(surface.indexOf("const externalNavigationRef = useRef<string | null>(null);"), surface.indexOf("const homeRequestRef = useRef<string | null>(null);"));
  assert.ok(effect.indexOf("settleHostThread(requestedThreadKey);") < effect.indexOf("if (active && accepted)"));
});

test("while loading, the transcript shows a neutral indicator and no messages", () => {
  assert.match(surface, /const visibleMobileMessages = hostThreadLoading \? \[\] : mobileMessagesForFailedRunNotice\(\{/);
  assert.match(surface, /testID="hermes-host-thread-loading"/);
  assert.match(surface, /\{!hostThreadLoading && mobileChatEmptyStateVisible\(\{/);
});
