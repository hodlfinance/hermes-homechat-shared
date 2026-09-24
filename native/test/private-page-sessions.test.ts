import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { permitsHodlNativeR8Request } from "../policy";
import { openMobileBrowserHref, privateMobileBrowserHrefFromUrl } from "../src/mobile-browser-session";

// HODL Build 51, 2026-09-24: a page Fin built ("Top Indices", port 8899) did not
// open. HODL must open a private page the way Hey does: a handoff returns a
// signed page-session URL, and the host shows it in its in-app browser.

const hhp = `hhp_${Buffer.from(JSON.stringify({ v: 1, purpose: "workspace_page_preview", port: 8899 })).toString("base64url")}.${"A".repeat(43)}`;

test("the HODL allow-list carries the handoff and the plane's page session, nothing wider", () => {
  assert.equal(permitsHodlNativeR8Request("POST", "/auth/browser-session-handoff"), true);
  assert.equal(permitsHodlNativeR8Request("GET", `/workspace/page-sessions/${hhp}`), true);
  assert.equal(permitsHodlNativeR8Request("GET", `/workspace/page-sessions/${hhp}/`), true);
  assert.equal(permitsHodlNativeR8Request("HEAD", `/workspace/page-sessions/${hhp}/app.js`), true);

  for (const [method, path] of [
    ["GET", "/auth/browser-session-handoff"],
    ["POST", "/auth/browser-session-handoff/consume"],
    ["POST", `/workspace/page-sessions/${hhp}`],
    ["GET", "/workspace/page-sessions/hhp_short.sig"],
    ["GET", "/workspace/page-sessions/fhp_v1.a.b.c"],
    ["GET", `/workspace/page-sessions/${hhp}/../../snapshot`],
    ["GET", `/workspace/page-sessions/${hhp}/%2e%2e/x`],
  ] as const) {
    assert.equal(permitsHodlNativeR8Request(method, path), false, `${method} ${path}`);
  }
});

test("a chat link to a private page on the product origin takes the handoff", () => {
  const apiBase = "https://finhermes.app/api";
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://finhermes.app/api/workspace/preview/8899"), "/api/workspace/preview/8899");
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://finhermes.app/api/workspace/preview/8899/x?y=1#z"), "/api/workspace/preview/8899/x?y=1#z");
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://evil.example/api/workspace/preview/8899"), null);
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://finhermes.app.evil.example/api/workspace/preview/8899"), null);
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://finhermes.app/api/snapshot"), null);
  assert.equal(privateMobileBrowserHrefFromUrl(apiBase, "https://example.com/"), null);
});

test("the handoff's page-session URL opens in the private (in-app) browser", async () => {
  const opened: Array<[string, string]> = [];
  const result = await openMobileBrowserHref({
    api: { browserSessionHandoff: async ({ href }) => {
      assert.equal(href, "/api/workspace/preview/8899");
      return { href: "/api/hermes/native-r8/workspace/page-sessions/fhp_token", expiresAt: "2026-09-24T03:00:00.000Z" };
    } },
    apiBase: "https://finhermes.app/api",
    href: "/api/workspace/preview/8899",
    openUrl: async (url) => { opened.push(["system", url]); },
    openPrivateUrl: async (url) => { opened.push(["in-app", url]); },
  });
  assert.equal(result.mode, "authenticated_handoff");
  assert.deepEqual(opened, [["in-app", "https://finhermes.app/api/hermes/native-r8/workspace/page-sessions/fhp_token"]]);
});

test("the chat transcript routes message links through the handoff opener", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const inline = source.slice(source.indexOf("function MobileMarkdownInlineText("), source.indexOf("function LinkedMessageText("));
  assert.match(inline, /useContext\(MessageLinkOpenerContext\)/);
  assert.match(inline, /onPress=\{\(\) => openMessageLink\(href\)\}/);
  assert.doesNotMatch(inline, /Linking\.openURL/);
  assert.match(source, /<MessageLinkOpenerContext\.Provider value=\{openMessageLink\}>/);
  assert.match(source, /privateMobileBrowserHrefFromUrl\(API_BASE, url\)/);
});
