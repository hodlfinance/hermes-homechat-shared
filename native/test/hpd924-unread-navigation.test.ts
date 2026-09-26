import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ConversationSession, HermesApiConversation } from "../core/index";
import { permitsHodlNativeR8Request } from "../policy";
import { mobileConversationSessionFromCanonical } from "../src/hermes-canonical";
import {
  applyAutomationThreadReadAnswer,
  automationThreadOptionsLabel,
  automationThreadReadTarget,
  automationThreadUnreadBadge,
  mobileDrawerSections,
} from "../src/mobile-automation-threads";
import { createNativeR8Transport } from "../transport";

test("HPD-924: the server-owned count makes a capped visual badge with the full accessible count", () => {
  assert.deepEqual(automationThreadUnreadBadge("Portfolio Scan", 1, "en"), {
    count: 1,
    label: "1",
    accessibilityLabel: "Portfolio Scan, 1 unread message",
  });
  assert.deepEqual(automationThreadUnreadBadge("Portfolio Scan", 137, "de"), {
    count: 137,
    label: "99+",
    accessibilityLabel: "Portfolio Scan, 137 ungelesene Nachrichten",
  });
});

test("HPD-924: an old plane or invalid count does not invent unread activity", () => {
  for (const value of [undefined, null, 0, -1, 1.2, "2", Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(automationThreadUnreadBadge("Portfolio Scan", value, "en"), null);
  }
});

test("HPD-924: every app language supplies an accessible unread count", () => {
  const expected = {
    en: "2 unread messages",
    de: "2 ungelesene Nachrichten",
    fr: "2 messages non lus",
    es: "2 mensajes sin leer",
    it: "2 messaggi non letti",
    "pt-BR": "2 mensagens não lidas",
    ja: "未読メッセージ 2 件",
    ko: "읽지 않은 메시지 2개",
  } as const;
  for (const locale of Object.keys(expected) as Array<keyof typeof expected>) {
    const badge = automationThreadUnreadBadge("Portfolio Scan", 2, locale);
    assert.equal(badge?.label, "2", locale);
    assert.equal(badge?.accessibilityLabel, `Portfolio Scan, ${expected[locale]}`, locale);
  }
});

// ---------------------------------------------------------------------------
// Ordering, read acknowledgement, the top-right options and the contract.
// ---------------------------------------------------------------------------

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const menuRow = readFileSync(new URL("../src/mobile-page-menu-row.tsx", import.meta.url), "utf8");

function thread(id: string, overrides: Partial<ConversationSession> = {}): ConversationSession {
  return {
    id,
    workspaceId: "ws_synthetic",
    title: id,
    role: "chat",
    status: "active",
    messageCount: 3,
    lastMessageAt: "2026-09-26T08:00:00.000Z",
    createdAt: "2026-09-26T07:00:00.000Z",
    updatedAt: "2026-09-26T08:00:00.000Z",
    automationJobId: `job-${id}`,
    unreadCount: 2,
    ...overrides,
  };
}

function message(id: string, conversationSessionId: string, createdAt: string, optimistic = false) {
  return { id, conversationSessionId, createdAt, ...(optimistic ? { optimistic } : {}) };
}

test("HPD-924: automation threads stand before Pages, and Suggestions is last after New App or Page", () => {
  assert.deepEqual(mobileDrawerSections({ suggestions: true, connectGmail: false }),
    ["primary", "automationThreads", "pages", "newPage", "suggestions"]);
  // Hey has no Suggestions destination and does not gain one.
  assert.deepEqual(mobileDrawerSections({ suggestions: false, connectGmail: true }),
    ["primary", "connectGmail", "automationThreads", "pages", "newPage"]);
  // Both drawer hosts draw from this one order.
  const drawer = surface.slice(surface.indexOf("function MobileNavigationDrawer("), surface.indexOf("function MobileDrawerButton("));
  assert.match(drawer, /mobileDrawerSections\(\{ suggestions: Boolean\(onOpenSuggestions\), connectGmail: showConnectGmail \}\)\.map\(/);
});

test("HPD-924: an automation row has no ellipsis and shows the server's count; a Page row keeps its action", () => {
  const drawer = surface.slice(surface.indexOf("function MobileNavigationDrawer("), surface.indexOf("function MobileDrawerButton("));
  const threads = drawer.slice(drawer.indexOf('if (section === "automationThreads")'), drawer.indexOf('if (section === "pages")'));
  assert.doesNotMatch(threads, /MobilePageMenuRow|extraAction|onRemove/);
  assert.match(threads, /automationThreadUnreadBadge\(thread\.title, thread\.unreadCount, appLocale\)/);
  assert.match(threads, /accessibilityLabel=\{badge\?\.accessibilityLabel \?\? thread\.title\}/);
  assert.match(threads, /trailing=\{badge \? <MobileUnreadBadge label=\{badge\.label\} \/> : null\}/);
  const pages = drawer.slice(drawer.indexOf('if (section === "pages")'), drawer.indexOf('if (section === "newPage")'));
  assert.match(pages, /<MobilePageMenuRow[\s\S]*onRemove=\{onRemoveBookmark\}/, "HPD-619 Page action stays");
  // The badge is blue in Light and Dark and hidden from VoiceOver, which reads the row's label.
  assert.match(menuRow, /const unreadBadgeBlue = "#1f6fd1";/);
  assert.match(menuRow, /<View style=\{styles\.badge\} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">/);
});

test("HPD-924: an open automation thread shows its options top right; Home and sub threads keep theirs", () => {
  assert.match(surface, /const automationThreadHeader = tab === "chat" && activeSubthreadHeader\.kind !== "subthread" && isAutomationThread\(activeChatSession\)/);
  const header = surface.slice(surface.indexOf("{automationThreadHeader ? ("), surface.indexOf('{dashboardOpenState !== "idle"'));
  const button = header.slice(0, header.indexOf("/>\n        ) : null}"));
  assert.match(button, /<MobileThreadOptionsButton/);
  assert.match(button, /accessibilityLabel=\{automationThreadOptionsLabel\(appLocale\)\}/);
  assert.match(button, /onRemove=\{archiveAutomationThread\}/);
  assert.match(button, /copy=\{automationThreadRemovalCopy\(appLocale, automationThreadHeader\.title\)\}/);
  // Help (host glyph) and the privacy lock give way only in an automation thread.
  assert.match(header, /\{automationThreadHeader \? null : tab === "chat" && ChatHeaderSupportIcon && activeSubthreadHeader\.kind !== "subthread" \? \(/);
  assert.match(header, /\{automationThreadHeader \? null : tab === "chat" && !ChatHeaderSupportIcon \? \(/);
  // The button opens the same sheet the row used to: View all automations above Delete.
  assert.match(menuRow, /export function MobileThreadOptionsButton\([\s\S]*useMobileEntryActions\(\{ entry, label: title, onRemove, copy, extraAction \}\)/);
  const labels = (["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const).map(automationThreadOptionsLabel);
  assert.equal(new Set(labels).size, 8);
  assert.equal(automationThreadOptionsLabel("de"), "Thread-Optionen");
});

test("HPD-924: the newest rendered message of the thread on screen is acknowledged once", () => {
  const session = thread("news");
  const rendered = [
    message("m1", "news", "2026-09-26T07:00:00.000Z"),
    message("m3", "news", "2026-09-26T08:00:00.000Z"),
    message("m2", "news", "2026-09-26T07:30:00.000Z"),
    message("other", "report", "2026-09-26T09:00:00.000Z"),
    message("local", "news", "2026-09-26T09:30:00.000Z", true),
  ];
  const base = { session, activeConversationId: "news", inFront: true, renderedMessages: rendered, acknowledgedMessageId: null };
  assert.deepEqual(automationThreadReadTarget(base), { conversationId: "news", messageId: "m3" });
  // Once acknowledged, nothing more until a later message renders.
  assert.equal(automationThreadReadTarget({ ...base, acknowledgedMessageId: "m3" }), null);
  assert.deepEqual(
    automationThreadReadTarget({ ...base, acknowledgedMessageId: "m3", renderedMessages: [...rendered, message("m4", "news", "2026-09-26T10:00:00.000Z")] }),
    { conversationId: "news", messageId: "m4" },
  );
});

test("HPD-924: the menu, the background, another thread, Home or an old plane mark nothing read", () => {
  const rendered = [message("m1", "news", "2026-09-26T07:00:00.000Z")];
  const base = { session: thread("news"), activeConversationId: "news", inFront: true, renderedMessages: rendered, acknowledgedMessageId: null };
  assert.equal(automationThreadReadTarget({ ...base, inFront: false }), null, "menu open or app not in front");
  assert.equal(automationThreadReadTarget({ ...base, activeConversationId: "report" }), null, "another conversation on screen");
  assert.equal(automationThreadReadTarget({ ...base, session: thread("news", { role: "home", automationJobId: null }) }), null);
  assert.equal(automationThreadReadTarget({ ...base, session: thread("news", { automationJobId: null }) }), null, "a delegated sub thread");
  assert.equal(automationThreadReadTarget({ ...base, session: thread("news", { unreadCount: undefined }) }), null, "plane without read cursor");
  assert.equal(automationThreadReadTarget({ ...base, renderedMessages: [message("local", "news", "2026-09-26T07:00:00.000Z", true)] }), null);
  // A thread whose count the list says is 0 still acknowledges: a result may have arrived since.
  assert.deepEqual(automationThreadReadTarget({ ...base, session: thread("news", { unreadCount: 0 }) }), { conversationId: "news", messageId: "m1" });
  // The surface only acknowledges from the effect that runs after the thread rendered.
  assert.match(surface, /inFront: tab === "chat" && hostVisible && appInFront && !menuOpen,/);
  assert.match(surface, /void hermesApi\.markConversationRead\(conversationId, messageId\)\.then\(\(updated\) => \{/);
});

const canonical: HermesApiConversation = {
  id: "news", workspaceId: "ws_synthetic", title: "Morning news", role: "chat", status: "active",
  surfaceOrigin: "finhermes", channelOrigin: "finhermes_web", sensitivity: "general", allowedSurfaces: ["finhermes"],
  visibility: "full", safeSummary: null, activeRunId: null, messageCount: 4, lastMessageAt: null,
  createdAt: "2026-09-26T07:00:00.000Z", updatedAt: "2026-09-26T08:00:00.000Z", automationJobId: "job-news",
};

test("HPD-924: only a count the plane states reaches the menu", () => {
  assert.equal(mobileConversationSessionFromCanonical({ ...canonical, unreadCount: 3 }).unreadCount, 3);
  assert.equal(mobileConversationSessionFromCanonical({ ...canonical, unreadCount: 0 }).unreadCount, 0);
  assert.equal("unreadCount" in mobileConversationSessionFromCanonical(canonical), false);
  assert.equal("unreadCount" in mobileConversationSessionFromCanonical({ ...canonical, unreadCount: -1 }), false);
});

function readTransport(responseConversation: HermesApiConversation) {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  const baseUrl = "https://finhermes.test/api";
  const transport = createNativeR8Transport({
    baseUrl,
    identity: { surface: "finhermes", channel: "hodl_mobile", allowedSurfaces: ["finhermes"] },
    fetch: async (input, init) => {
      const url = new URL(String(input));
      const path = url.pathname.slice(new URL(baseUrl).pathname.length);
      const method = (init?.method ?? "GET").toUpperCase();
      if (!permitsHodlNativeR8Request(method, path)) throw new Error("not permitted");
      requests.push({ method, path, body: JSON.parse(String(init?.body ?? "null")) });
      return new Response(JSON.stringify({ contractVersion: 1, conversation: responseConversation }), {
        headers: { "content-type": "application/json" },
      });
    },
  });
  const hermes = transport.createCanonicalClient({
    baseUrl,
    token: "test-session",
    fetchImpl: async () => { throw new Error("createCanonicalClient must use the transport fetch"); },
  });
  return { hermes, requests };
}

test("HPD-924: the acknowledgement is one permitted POST naming the exact rendered message", async () => {
  const { hermes, requests } = readTransport({ ...canonical, unreadCount: 0 });
  const updated = await hermes.markConversationRead("news", "m3");
  assert.equal(updated.unreadCount, 0);
  assert.deepEqual(requests, [{ method: "POST", path: "/hermes/conversations/news/read", body: { messageId: "m3", surface: "finhermes" } }]);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/conversations/news/read"), true);
  assert.equal(permitsHodlNativeR8Request("POST", "/hermes/conversations/news/read/extra"), false);
});

test("HPD-924: a reply about another conversation never clears this thread", async () => {
  const { hermes } = readTransport({ ...canonical, id: "report", unreadCount: 0 });
  await assert.rejects(() => hermes.markConversationRead("news", "m3"));
});

test("HPD-924: an older read answer that arrives after a newer acknowledgement leaves the badge alone", () => {
  const sessions = [thread("news", { unreadCount: 0 }), thread("report", { unreadCount: 4 })];
  // m3 was acknowledged, then m4; m3's answer (still counting m4 unread) arrives last.
  const stale = applyAutomationThreadReadAnswer(sessions, { id: "news", unreadCount: 1 }, { messageId: "m3", acknowledgedMessageId: "m4" });
  assert.equal(stale, sessions, "a stale answer changes nothing");
  const current = applyAutomationThreadReadAnswer(sessions, { id: "news", unreadCount: 0 }, { messageId: "m4", acknowledgedMessageId: "m4" });
  assert.deepEqual(current.map((session) => [session.id, session.unreadCount]), [["news", 0], ["report", 4]]);
  // An answer without a count reads as zero; other threads keep theirs.
  const absent = applyAutomationThreadReadAnswer([thread("news", { unreadCount: 3 })], { id: "news" }, { messageId: "m4", acknowledgedMessageId: "m4" });
  assert.equal(absent[0]?.unreadCount, 0);
  // The surface asks the helper with the acknowledgement current when the answer lands.
  assert.match(surface, /applyAutomationThreadReadAnswer\(current, updated, \{\s*messageId,\s*acknowledgedMessageId: acknowledgedReadRef\.current\.get\(conversationId\),\s*\}\)/);
});
