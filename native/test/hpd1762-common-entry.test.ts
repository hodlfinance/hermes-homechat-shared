import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createApiClient } from "../core/api-client";
import { parseHeyHermesSalesStatus } from "../core/hermes-api";
import { heyAppEntryScreen, heyAppPurchaseAllowed } from "../src/hey-app-flow";
import { readHeySalesStatus, heySalesPaywallInView, heySalesStatusRereadOnOpen } from "../src/hey-sales-status-read";

const legacy = { schemaVersion: "heyhermes.sales-status/v1", open: true, reason: "open", mayPurchase: true,
  invitation: null, waitlist: null, appWaitlist: null, checkedAt: "2026-10-29T12:00:00.000Z", playStorePersonalProductId: "personal:monthly" };
const status = (state: "purchase" | "waiting" | "unavailable") => parseHeyHermesSalesStatus({ ...legacy,
  mayPurchase: state === "purchase", appEntry: { state } })!;

test("one server decision drives both stores; intent, code success and legacy status cannot open a second path", () => {
  for (const opened of [false, true]) {
    assert.equal(heyAppEntryScreen(status("purchase"), opened, true), "purchase");
    assert.equal(heyAppEntryScreen(status("waiting"), opened, true), "waitlist");
    assert.equal(heyAppEntryScreen(status("unavailable"), opened, true), "unknown");
    assert.equal(heyAppEntryScreen(parseHeyHermesSalesStatus(legacy), opened, true), "unknown");
    assert.equal(heyAppEntryScreen(null, opened, true), "unknown");
  }
  assert.equal(heyAppPurchaseAllowed(status("purchase")), true);
  assert.equal(heyAppPurchaseAllowed(status("waiting")), false);
  assert.equal(heyAppPurchaseAllowed(status("unavailable")), false);
  assert.equal(heyAppPurchaseAllowed({ ...status("purchase"), mayPurchase: false }), false);
});

test("missing, malformed or conflicting common contract is unavailable, never legacy permission", async () => {
  for (const body of [legacy, { ...legacy, appEntry: { state: "bogus" } }, { ...legacy, appEntry: { state: "waiting" } }]) {
    const api = createApiClient({ baseUrl: "https://example.test", fetchImpl: (async () => new Response(JSON.stringify(body))) as typeof fetch });
    const sales = await api.salesStatus();
    assert.equal(sales?.appEntry, undefined);
    assert.equal(heyAppPurchaseAllowed(sales), false);
    assert.equal(sales?.playStorePersonalProductId, "personal:monthly", "restore metadata survives an older/malformed entry contract");
    assert.equal(heyAppPurchaseAllowed(await api.joinAppWaitlist()), false);
  }
  assert.ok(parseHeyHermesSalesStatus(legacy), "non-opted-in consumers retain legacy parsing");
});

test("both common clients have a deadline and refresh when returning from release or a stale purchase screen", async () => {
  for (const store of ["ios", "android"] as const) {
    let signal: AbortSignal | undefined;
    const answer = await readHeySalesStatus(store, async (options) => { signal = options?.signal; return status("waiting"); }, { commonEntry: true });
    assert.equal(answer?.appEntry?.state, "waiting");
    assert.ok(signal, store);
    for (const state of ["purchase", "waiting", "unavailable"] as const) {
      assert.equal(heySalesStatusRereadOnOpen({ store, commonEntry: true, opened: true, settled: true, status: status(state) }), true);
      assert.equal(heySalesStatusRereadOnOpen({ store, commonEntry: true, opened: false, settled: true, status: status(state) }), false);
    }
    assert.equal(heySalesPaywallInView({ store, commonEntry: true, appInFront: true, accountPanelOpen: false,
      screen: "purchase", deletedPaywallOpen: false, hasAccess: false, accountScreenOpen: false }), true);
  }
});

test("every existing purchase entry shares the pre-store guard; restore stays separate and the waitlist has no purchase escape", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const purchase = source.slice(source.indexOf("async function purchaseMobilePlan("), source.indexOf("async function restoreMobilePurchases("));
  assert.ok(purchase.indexOf("readHeySalesStatus(storePlatform") < purchase.indexOf("mobilePurchasesController.purchase("));
  assert.match(purchase, /if \(!heyAppPurchaseAllowed\(current\)\)[\s\S]*?return;/);
  assert.match(purchase, /accountSessionIsCurrent\(generation, requestToken\)/);
  assert.match(source, /onSubscribe=\{commonAppEntry \? undefined/);
  assert.match(source, /onRestore=\{commonAppEntry \? \(\) => void restoreMobilePurchases\(\)/);
  const restore = source.slice(source.indexOf("async function restoreMobilePurchases("), source.indexOf("async function restoreMobilePurchases(") + 1800);
  assert.doesNotMatch(restore, /heyAppPurchaseAllowed|readHeySalesStatus/);
});
