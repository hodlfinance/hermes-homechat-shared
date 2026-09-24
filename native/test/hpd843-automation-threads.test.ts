import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ConversationSession } from "../core/index";
import { permitsHodlNativeR8Request } from "../policy";
import { mobileConversationSessionFromCanonical } from "../src/hermes-canonical";
import {
  automationThreadForJob,
  automationThreadListLimit,
  automationThreadRemovalCopy,
  automationThreads,
} from "../src/mobile-automation-threads";
import { createNativeR8Transport } from "../transport";

// HPD-843: every automation gets its own thread in the left menu. The plane
// makes the thread with the job's first delivered result and names the job in
// `automationJobId`; the menu lists exactly those, and the customer can delete
// one (the plane archives it, and the next result opens a new thread).

function session(id: string, overrides: Partial<ConversationSession> = {}): ConversationSession {
  return {
    id,
    workspaceId: "ws_synthetic",
    title: id,
    role: "chat",
    status: "active",
    messageCount: 1,
    lastMessageAt: "2026-09-24T10:00:00.000Z",
    createdAt: "2026-09-24T09:00:00.000Z",
    updatedAt: "2026-09-24T10:00:00.000Z",
    automationJobId: null,
    ...overrides,
  };
}

test("HPD-843: the menu lists only active automation threads, newest first", () => {
  const sessions = [
    session("home", { role: "home", title: "Home" }),
    session("sub_thread", { title: "Background research" }),
    session("news", { automationJobId: "job-news", lastMessageAt: "2026-09-24T08:00:00.000Z" }),
    session("report", { automationJobId: "job-report", lastMessageAt: "2026-09-24T11:00:00.000Z" }),
    session("deleted", { automationJobId: "job-old", status: "archived" }),
  ];
  assert.deepEqual(automationThreads(sessions).map((thread) => thread.id), ["report", "news"]);
  assert.equal(automationThreadForJob(sessions, "job-news")?.id, "news");
  assert.equal(automationThreadForJob(sessions, "job-old"), null);
  assert.equal(automationThreadForJob(sessions, null), null);
  assert.ok(automationThreadListLimit >= 50);
});

test("HPD-843: the canonical conversation keeps its automation job", () => {
  const mapped = mobileConversationSessionFromCanonical({
    id: "session_thread",
    workspaceId: "ws_synthetic",
    title: "Morning news",
    role: "chat",
    status: "active",
    surfaceOrigin: "hey_hermes",
    channelOrigin: "hey_hermes_web",
    sensitivity: "general",
    allowedSurfaces: ["hey_hermes"],
    visibility: "full",
    safeSummary: null,
    activeRunId: null,
    messageCount: 2,
    lastMessageAt: null,
    createdAt: "2026-09-24T09:00:00.000Z",
    updatedAt: "2026-09-24T09:00:00.000Z",
    automationJobId: "job-news",
  });
  assert.equal(mapped.automationJobId, "job-news");
});

test("HPD-843: deleting a thread is one permitted PATCH that archives it on the plane", async () => {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  const baseUrl = "https://finhermes.test/api";
  const transport = createNativeR8Transport({
    baseUrl,
    identity: { surface: "finhermes", channel: "hodl_mobile", allowedSurfaces: ["finhermes"] },
    // The same gate HODL's nativeR8Transport applies before any network call.
    fetch: async (input, init) => {
      const url = new URL(String(input));
      const path = url.pathname.slice(new URL(baseUrl).pathname.length);
      const method = (init?.method ?? "GET").toUpperCase();
      if (!permitsHodlNativeR8Request(method, path)) throw new Error("not permitted");
      requests.push({ method, path, body: JSON.parse(String(init?.body ?? "null")) });
      return new Response(JSON.stringify({
        contractVersion: 1,
        conversation: {
          id: "session_thread", workspaceId: "ws_synthetic", title: "Portfolio check", role: "chat", status: "archived",
          surfaceOrigin: "finhermes", channelOrigin: "finhermes_web", sensitivity: "general", allowedSurfaces: ["finhermes"],
          visibility: "full", safeSummary: null, activeRunId: null, messageCount: 1, lastMessageAt: null,
          createdAt: "2026-09-24T09:00:00.000Z", updatedAt: "2026-09-24T09:00:00.000Z", automationJobId: "job-portfolio",
        },
      }), { headers: { "content-type": "application/json" } });
    },
  });
  const hermes = transport.createCanonicalClient({
    baseUrl,
    token: "test-session",
    fetchImpl: async () => { throw new Error("createCanonicalClient must use the transport fetch"); },
  });
  const archived = await hermes.archiveConversation("session_thread");
  assert.equal(archived.status, "archived");
  assert.equal(archived.automationJobId, "job-portfolio");
  assert.deepEqual(requests, [{ method: "PATCH", path: "/hermes/conversations/session_thread", body: { status: "archived" } }]);
});

test("HPD-843: the delete confirmation says the automation keeps running, in every language", () => {
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = automationThreadRemovalCopy(locale, "Morning news");
    assert.ok(copy.title.includes("Morning news"), locale);
    for (const value of Object.values(copy)) assert.ok(value.trim().length > 0, locale);
  }
  assert.match(automationThreadRemovalCopy("de", "X").message, /Automation läuft weiter/);
});

test("HPD-843: the drawer lists the threads above New App or Page and the card's chat button opens its thread", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const drawer = source.slice(source.indexOf("function MobileNavigationDrawer("));
  const threads = drawer.indexOf("automationThreads(chatSessions).map(");
  const newPage = drawer.indexOf("label={pageStarterCopy(appLocale).label}");
  assert.ok(threads > 0 && newPage > threads, "automation threads come directly before New App or Page");
  assert.equal(source.match(/onRemoveAutomationThread=\{archiveAutomationThread\}/g)?.length, 2, "both drawer hosts can delete a thread");
  assert.match(source, /if \(onOpenThread\(target\.jobId\)\) return;\s*onAsk\(promptFor\(copy\.chatPrompt, target\)\);/);
  assert.match(source, /await hermesApi\.archiveConversation\(entry\.entryId\);/);
  assert.doesNotMatch(source, /refreshConversations\(createHomechatPagedState<ConversationSession>\(\), \{ limit: 12 \}\)/);
});
