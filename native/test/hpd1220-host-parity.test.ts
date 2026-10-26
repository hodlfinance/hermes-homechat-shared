import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { createApiClient, heyActivityVerbText } from "../core/index";
import { mobileLiveRunActivityView } from "../src/mobile-live-run-status";
import { permitsHodlNativeR8Request } from "../policy";

/**
 * HPD-1220: Fin (the HODL app) and Hey render the same shared surface, but a
 * new shared feature reached Fin only when someone remembered to wire it in the
 * HODL host (HodlR8Surface.js) and to permit its routes in native/policy.ts.
 * Three features were missed that way. This test makes the decision explicit:
 * every host option and every API call the surface makes needs a recorded Fin
 * verdict, or CI fails.
 *
 * When this test fails:
 * - a new `NativeR8Host` option: add it to HOST_OPTIONS with what Hey does
 *   and what HODL does ("wired" in hodl src/screens/Hermes/HodlR8Surface.js,
 *   or "exempt: <reason and issue>", or "pending: <issue>");
 * - a new API call from native/src: either permit its route in
 *   native/policy.ts (and in the Finance BFF, hodl-hermes-web native-r8.ts),
 *   or add it to HEY_ONLY_CALLS with the reason Fin does not need it.
 * Then follow the checklist in hodlfinance/hodl AGENTS.md.
 */

type Verdict = `wired${string}` | `exempt: ${string}` | `pending: ${string}` | `unused${string}`;

const HOST_OPTIONS: Readonly<Record<string, { hey: Verdict; hodl: Verdict }>> = {
  openBrowserTakeover: {
    hey: "wired (HPD-1097, BrowserTakeoverScreen)",
    hodl: "exempt: HPD-1083 — Fin runs from HODL carry finance OAuth; the Plane never binds the protected browser for them and the viewer needs a Hey session, so no takeover link or Computer card can appear (HPD-1220)",
  },
  liveVoice: { hey: "wired (HPD-1015)", hodl: "wired (HPD-1041, iOS only)" },
  onHomeChatInFront: { hey: "wired (HPD-1121)", hodl: "wired (HPD-1191)" },
  onHomeChatTyping: { hey: "wired (HPD-1121)", hodl: "wired (HPD-1191)" },
  apiBaseUrl: { hey: "wired", hodl: "wired" },
  storageNamespace: { hey: "wired", hodl: "wired" },
  identity: { hey: "wired (brand icon)", hodl: "wired (default icon, Hermes copy)" },
  theme: { hey: "unused (default palette)", hodl: "wired (HODL palette)" },
  session: { hey: "wired (standalone)", hodl: "wired (external: HODL owns sign-in)" },
  policy: { hey: "wired (ranker and scanner on)", hodl: "wired (ranker and scanner off)" },
  transport: { hey: "wired", hodl: "wired" },
  platform: { hey: "wired (Expo)", hodl: "wired (HODL native modules)" },
  purchases: { hey: "wired (RevenueCat)", hodl: "wired (HODL Pro)" },
  "presentation.accountLabel": { hey: "unused", hodl: "wired" },
  "presentation.appLocale": { hey: "unused (customer chooses)", hodl: "wired: English only (HPD-801, product decision)" },
  "presentation.centerChatTitle": { hey: "unused", hodl: "unused" },
  "presentation.chatHeaderSupportIcon": { hey: "unused", hodl: "wired (HPD-837)" },
  "presentation.chatTitle": { hey: "unused", hodl: "unused" },
  "presentation.hideChatSubtitle": { hey: "unused", hodl: "unused" },
  "presentation.hideDrawerPreferences": { hey: "unused", hodl: "wired: dark and English only (HPD-801, product decision)" },
  "presentation.finSuggestions": { hey: "unused", hodl: "wired (HPD-606)" },
  "presentation.keyboardVerticalOffset": { hey: "unused", hodl: "wired (HODL tab bar)" },
  "presentation.keyboardOffsetFromWindow": { hey: "unused (fixed offset)", hodl: "wired (HPD-1466, HODL Bots chat only: composer right above the keyboard on every iPhone)" },
  "presentation.openingMode": { hey: "unused (brand)", hodl: "wired (chat)" },
  "presentation.openingStatus": { hey: "unused", hodl: "wired" },
  "presentation.showAssistantIdentity": { hey: "unused", hodl: "wired" },
  "presentation.assistantAvatar": { hey: "unused (keeps the dragon and brand icon)", hodl: "wired (HPD-1442, round bot figure per thread)" },
  "presentation.headerBack": { hey: "unused (keeps the left menu)", hodl: "wired (HPD-1466, HODL Bots chat only: back to the bot list, no left menu)" },
  "presentation.homeChatTitle": { hey: "unused (the Home chat stays Hermes)", hodl: "wired (HPD-1515, HODL Bots chat only: the Home chat is called Home)" },
  "presentation.sessionFailure": { hey: "unused", hodl: "wired" },
};

const account = "exempt: HODL owns the account, sign-in, deletion and data export (standalone session only)";
const pro = "exempt: HODL owns Pro and the paywall";
const push = "exempt: HODL owns push (FCM through the HODL alert-device route, HPD-818)";
const tasks = "exempt: HODL has no Tasks tab (policy.preinstalledRanker false)";
const server = "exempt: a managed Fin workspace has no customer SSH or server ownership";
const selfManaged = "exempt: HPD-1196 is never for Fin (Justus); the Plane refuses it for Fin as well";

/** API calls of the shared surface that HODL's policy does not permit, each with its reason. */
const HEY_ONLY_CALLS: Readonly<Record<string, string>> = {
  addServerOwnerSshKey: server,
  backupJob: account,
  browserSessionStatus: "exempt: the Computer card needs openBrowserTakeover (see HOST_OPTIONS)",
  cancelHeyAccountDeletion: account,
  confirmHeyAccountDeletion: account,
  createArchiveJob: account,
  createServerFullExport: server,
  enableSelfManaged: selfManaged,
  exportSettings: account,
  heyAccountDeletionReauthenticationMethods: account,
  heyLinkedIdentities: account,
  joinWaitlist: pro,
  joinAppWaitlist: pro,
  redeemInviteCode: pro,
  lapseExport: server,
  mobilePushStatus: push,
  prepareHeyAccountDeletion: account,
  rankedTaskAutomations: tasks,
  rankedTasks: tasks,
  reauthenticateHeyAccountDeletion: account,
  registerAdminPublicKey: server,
  registerMobilePushSubscription: push,
  reinstallRankedTaskAutomation: tasks,
  removeServerBlockingPath: server,
  requestNewServerAfterDeletion: server,
  requestServerOwnerDeletion: server,
  resetRankedTaskAutomation: tasks,
  restoreHeyDefaults: selfManaged,
  restoreRankedTaskAutomationVersion: tasks,
  revenueCatManagement: pro,
  revokeServerOwnerSshKey: server,
  runAdminHandover: server,
  salesStatus: pro,
  selfManaged,
  sendMobilePushTest: push,
  serverAccess: server,
  serverFullExport: server,
  serverOwnerDeletion: server,
  serverOwnerSshKeys: server,
  // HPD-1498: the switch sits on the ChatGPT route, which Fin is never offered (offered-chat-routes.ts).
  setChatGptGoogleData: "exempt: Fin is never offered the ChatGPT route, so it has no Google-data switch",
  dismissChatGptGoogleDataPrompt: "exempt: Fin is never offered the ChatGPT route, so it never shows the Google-data prompt",
  startHeyAccountDeletionEmailReauthentication: account,
  takeLapseExportKey: server,
  updateRankedTask: tasks,
  updateRankedTaskAutomation: tasks,
  updateTask: tasks,
};

const hostSource = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

function block(source: string, opener: string): string {
  const start = source.indexOf(opener);
  assert.ok(start >= 0, `${opener} not found`);
  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${opener} is not closed`);
}

function keysAt(body: string, indent: string): string[] {
  return [...body.matchAll(new RegExp(`^${indent}([A-Za-z]\\w*)\\??:`, "gm"))].map((match) => match[1]!);
}

function hostOptionKeys(): string[] {
  const host = block(hostSource, "export type NativeR8Host = {");
  const presentation = block(host, "presentation?: {");
  return [...keysAt(host, "  ").filter((key) => key !== "presentation"), ...keysAt(presentation, "    ").map((key) => `presentation.${key}`)].sort();
}

/** The first request each surface API call makes, through a recording fetch. */
async function surfaceApiCalls(): Promise<Map<string, { method: string; path: string } | null>> {
  const dir = new URL("../src/", import.meta.url);
  const names = new Set<string>();
  for (const file of readdirSync(dir)) {
    if (!/\.tsx?$/.test(file)) continue;
    for (const match of readFileSync(new URL(file, dir), "utf8").matchAll(/\b(?:api|client)\.([a-zA-Z]+)\(/g)) names.add(match[1]!);
  }
  let seen: { method: string; path: string } | null = null;
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    seen ??= { method: init?.method ?? "GET", path: new URL(String(url)).pathname.replace(/^\/api/, "") };
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const api = createApiClient({ baseUrl: "https://host.invalid/api", token: "t", fetchImpl }) as unknown as Record<string, unknown>;
  const calls = new Map<string, { method: string; path: string } | null>();
  for (const name of [...names].sort()) {
    const method = api[name];
    // `client.` also names the canonical controller; only API client methods are routes here.
    if (typeof method !== "function") continue;
    seen = null;
    try { await (method as (...args: unknown[]) => unknown)("x1", "x1", "x1"); } catch { /* only the request matters */ }
    calls.set(name, seen);
  }
  return calls;
}

test("HPD-1220: every host option has a recorded Hey and HODL verdict", () => {
  const keys = hostOptionKeys();
  assert.ok(keys.includes("openBrowserTakeover") && keys.includes("presentation.sessionFailure"), "host.ts parse");
  const missing = keys.filter((key) => !HOST_OPTIONS[key]);
  assert.deepEqual(missing, [], `new NativeR8Host options need a Fin verdict in HOST_OPTIONS: ${missing.join(", ")}`);
  const stale = Object.keys(HOST_OPTIONS).filter((key) => !keys.includes(key));
  assert.deepEqual(stale, [], `HOST_OPTIONS names options host.ts no longer has: ${stale.join(", ")}`);
});

test("HPD-1220: every API call of the surface is permitted for HODL or recorded as Hey-only", async () => {
  const calls = await surfaceApiCalls();
  assert.ok(calls.size > 60, `expected the surface's API calls, found ${calls.size}`);
  const undecided: string[] = [];
  const permittedButListed: string[] = [];
  for (const [name, call] of calls) {
    assert.ok(call, `${name} made no request`);
    const permitted = permitsHodlNativeR8Request(call.method, call.path);
    if (!permitted && !HEY_ONLY_CALLS[name]) undecided.push(`${name} (${call.method} ${call.path})`);
    if (permitted && HEY_ONLY_CALLS[name]) permittedButListed.push(name);
  }
  assert.deepEqual(undecided, [], "permit these in native/policy.ts and the Finance BFF, or record why Fin does not need them");
  assert.deepEqual(permittedButListed, [], "permitted for HODL but still recorded as Hey-only");
  const stale = Object.keys(HEY_ONLY_CALLS).filter((name) => !calls.has(name));
  assert.deepEqual(stale, [], `HEY_ONLY_CALLS names calls the surface no longer makes: ${stale.join(", ")}`);
});

test("HPD-1220: Fin can answer the daily check-in (HPD-1197) and request a webhook connection", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/usage/daily-check-in"), true);
  assert.equal(permitsHodlNativeR8Request("GET", "/usage/daily-check-in"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/usage/daily-check-in/x"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/connections/request-setup"), true);
  assert.equal(permitsHodlNativeR8Request("GET", "/connections/request-setup"), false);
  // Self-managed stays closed for Fin.
  assert.equal(permitsHodlNativeR8Request("GET", "/workspace/self-managed"), false);
  assert.equal(permitsHodlNativeR8Request("POST", "/workspace/self-managed"), false);
});

test("HPD-1220: the live line says Hey's states in both apps: Getting ready, Thinking, Waiting for you", () => {
  const line = (runStatus: "queued" | "running" | "waiting_for_approval") => {
    const view = mobileLiveRunActivityView({ events: [], runStatus });
    assert.ok(view?.summary);
    return view.summary.verbKey ? heyActivityVerbText(view.summary.verbKey, "en") : view.summary.labelKey;
  };
  assert.equal(line("queued"), "gettingReady");
  assert.equal(line("running"), "Thinking");
  assert.equal(line("waiting_for_approval"), "waitingForYou");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  // The surface draws only this projection; the older "Working" view is not on screen.
  assert.match(surface, /mobileLiveRunActivityView\(/);
  assert.doesNotMatch(surface, /\bmobileRunActivityView\(/);
  // The canonical "waiting" run state is the approval wait, not "Thinking".
  const canonical = readFileSync(new URL("../src/hermes-canonical.ts", import.meta.url), "utf8");
  assert.match(canonical, /status === "waiting" \? "waiting_for_approval" : status/);
});
