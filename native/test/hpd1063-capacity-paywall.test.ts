import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../core/api-client";
import { parseHeyHermesSalesStatus, type HeyHermesSalesStatus } from "../core/hermes-api";
import { statusServerMessage, statusSummaryCopy } from "../core/status-summary-copy";
import { appLocales } from "../core/types";
import { mobileCapacityAccessCopy, mobileCapacityRefusalKind, mobilePendingAccessCopy } from "../src/appI18n";
import { iosPaywallSalesDecision, iosPaywallSalesView, iosPaywallWaitlistCopy } from "../src/ios-paywall";

// HPD-1063: capacity-aware paywall and honest waiting screen. Unknown sales
// status (old server 404, network error, malformed body) keeps the purchase.

const valid: HeyHermesSalesStatus = {
  schemaVersion: "heyhermes.sales-status/v1",
  open: false,
  reason: "waitlist",
  mayPurchase: false,
  invitation: null,
  waitlist: { status: "waiting", position: 4 },
  checkedAt: "2026-10-06T10:00:00.000Z",
};

function client(respond: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const api = createApiClient({
    baseUrl: "https://heyhermes.test/api",
    token: "test-session",
    fetchImpl: (async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body });
      return respond(url, init);
    }) as unknown as typeof fetch,
  });
  return { api, calls };
}

test("the sales-status parser accepts the v1 shape", () => {
  assert.deepEqual(parseHeyHermesSalesStatus(valid), valid);
  const open = { ...valid, open: true, reason: "open", mayPurchase: true, waitlist: null };
  assert.deepEqual(parseHeyHermesSalesStatus(open), open);
  const invited = { ...valid, invitation: { expiresAt: "2026-10-07T10:00:00.000Z" }, waitlist: { status: "invited", position: null } };
  assert.deepEqual(parseHeyHermesSalesStatus(invited), invited);
});

test("the sales-status parser rejects malformed payloads", () => {
  for (const bad of [
    null,
    undefined,
    "open",
    [],
    { ...valid, schemaVersion: "heyhermes.sales-status/v2" },
    { ...valid, open: "false" },
    { ...valid, mayPurchase: undefined },
    { ...valid, reason: "full" },
    { ...valid, checkedAt: "yesterday" },
    { ...valid, invitation: { expiresAt: 5 } },
    { ...valid, waitlist: { status: "queued", position: 1 } },
    { ...valid, waitlist: { status: "waiting", position: -1 } },
    { ...valid, waitlist: { status: "waiting", position: "3" } },
  ]) {
    assert.equal(parseHeyHermesSalesStatus(bad), null, JSON.stringify(bad));
  }
});

test("the client maps 404, network errors and invalid bodies to null", async () => {
  const notFound = client(() => new Response("{\"error\":\"not found\"}", { status: 404 }));
  assert.equal(await notFound.api.salesStatus(), null);
  assert.equal(await notFound.api.joinWaitlist(), null);

  const offline = client(() => { throw new TypeError("Network request failed"); });
  assert.equal(await offline.api.salesStatus(), null);

  const garbage = client(() => new Response(JSON.stringify({ open: true }), { status: 200 }));
  assert.equal(await garbage.api.salesStatus(), null);

  const ok = client(() => new Response(JSON.stringify(valid), { status: 200 }));
  assert.deepEqual(await ok.api.salesStatus(), valid);
  assert.deepEqual(await ok.api.joinWaitlist(), valid);
  assert.equal(ok.calls[0]!.url, "https://heyhermes.test/api/billing/sales-status");
  assert.equal(ok.calls[0]!.method, "GET");
  assert.equal(ok.calls[1]!.url, "https://heyhermes.test/api/billing/waitlist");
  assert.equal(ok.calls[1]!.method, "POST");
  assert.equal(ok.calls[1]!.body, "{}");
});

test("the paywall decision: unknown or open purchases, refused waits, invitation purchases", () => {
  assert.equal(iosPaywallSalesDecision(null), "purchase");
  assert.equal(iosPaywallSalesDecision({ ...valid, open: true, reason: "open", mayPurchase: true }), "purchase");
  assert.equal(iosPaywallSalesDecision(valid), "waitlist");
  assert.equal(iosPaywallSalesDecision({ ...valid, reason: "capacity_unknown", waitlist: null }), "waitlist");
  assert.equal(
    iosPaywallSalesDecision({ ...valid, invitation: { expiresAt: "2026-10-07T10:00:00.000Z" } }),
    "purchase",
  );
});

test("the paywall sales view words", () => {
  const formatTime = (iso: string) => `T(${iso})`;
  assert.deepEqual(iosPaywallSalesView({ locale: "en", status: null, formatTime }).lines, []);

  const notJoined = iosPaywallSalesView({ locale: "en", status: { ...valid, waitlist: null }, formatTime });
  assert.equal(notJoined.mode, "waitlist");
  assert.equal(notJoined.joined, false);
  assert.equal(notJoined.joinLabel, "Join the waitlist");

  const joined = iosPaywallSalesView({ locale: "en", status: valid, formatTime });
  assert.equal(joined.joined, true);
  assert.deepEqual(joined.lines, ["You're on the waitlist. We'll email you as soon as a place is free.", "Your position: 4"]);

  const noPosition = iosPaywallSalesView({ locale: "en", status: { ...valid, waitlist: { status: "waiting", position: null } }, formatTime });
  assert.deepEqual(noPosition.lines, ["You're on the waitlist. We'll email you as soon as a place is free."]);

  const invited = iosPaywallSalesView({
    locale: "en",
    status: { ...valid, invitation: { expiresAt: "2026-10-07T10:00:00.000Z" }, waitlist: { status: "invited", position: null } },
    formatTime,
  });
  assert.equal(invited.mode, "purchase");
  assert.deepEqual(invited.lines, ["A place is reserved for you until T(2026-10-07T10:00:00.000Z)."]);

  for (const locale of appLocales) {
    const copy = iosPaywallWaitlistCopy(locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}.${key}`);
    assert.match(copy.waitlistPosition, /\{position\}/, locale);
    assert.match(copy.invitationReserved, /\{time\}/, locale);
  }
});

test("runtimeSettingUp no longer says try again shortly, in every locale", () => {
  assert.equal(statusSummaryCopy("en").runtimeSettingUp, "Your Hermes is being set up — we'll email you when it's ready.");
  assert.equal(
    statusSummaryCopy("de").runtimeSettingUp,
    "Dein Hermes wird eingerichtet – wir schicken Dir eine E-Mail, sobald er bereit ist.",
  );
  for (const locale of appLocales) {
    const text = statusSummaryCopy(locale).runtimeSettingUp;
    assert.ok(text.trim(), locale);
    assert.doesNotMatch(text, /try again shortly|gleich erneut|Réessayez|Inténtalo de nuevo|Riprova|Tente novamente|再試行|다시 시도/i, locale);
  }
  // The server still sends the old English sentence; it maps to the new words.
  assert.equal(
    statusServerMessage("de", "Your private Hermes runtime is still being set up. Please try again shortly."),
    statusSummaryCopy("de").runtimeSettingUp,
  );
});

test("refusal reasons map to plain words, never a raw code", () => {
  assert.equal(mobileCapacityRefusalKind("capacity_full"), "capacity");
  assert.equal(mobileCapacityRefusalKind("capacity_memory"), "capacity");
  assert.equal(mobileCapacityRefusalKind("host_at_capacity"), "capacity");
  assert.equal(mobileCapacityRefusalKind("capacity_unknown"), "paused");
  assert.equal(mobileCapacityRefusalKind("provisioner_unavailable"), "paused");
  assert.equal(mobileCapacityRefusalKind("reserve_preparation_failed"), "problem");
  assert.equal(mobileCapacityRefusalKind("something_new"), "paused");

  const en = (reason: string) => mobilePendingAccessCopy("en", "capacity", { reason }).title;
  assert.equal(en("capacity_full"), "We’re at capacity right now");
  assert.equal(en("provisioner_unavailable"), "Setup is paused for a moment");
  assert.equal(en("capacity_unknown"), "Setup is paused for a moment");
  assert.equal(en("reserve_preparation_failed"), "Setup hit a problem; our team has been alerted");

  const withPosition = mobilePendingAccessCopy("en", "capacity", { reason: "capacity_full", waitlistPosition: 3 });
  assert.match(withPosition.body, /email you when it’s ready/);
  assert.match(withPosition.body, /Your position: 3$/);

  for (const locale of appLocales) {
    const copy = mobileCapacityAccessCopy(locale);
    for (const kind of ["capacity", "paused", "problem"] as const) {
      const shown = mobilePendingAccessCopy(locale, "capacity", { reason: "reserve_preparation_failed" });
      assert.ok(copy.titles[kind].trim(), `${locale}.${kind}`);
      assert.doesNotMatch(`${shown.title} ${shown.body}`, /reserve_preparation_failed|_/, locale);
    }
    assert.match(copy.position, /\{position\}/, locale);
    assert.doesNotMatch(mobilePendingAccessCopy(locale).body, /try again|check again in a little|gleich noch einmal/i, locale);
  }
});
