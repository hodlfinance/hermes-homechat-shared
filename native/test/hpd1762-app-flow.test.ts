import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { heyAndroidPushAvailable, heyAppEntryScreen, heyAppFlowCopy, heyAppFlowFill, heyInviteCodeFromUrl, heyInviteRedeemAccepted, heyNormalizeInviteCode, heyShowLimitCard } from "../src/hey-app-flow";
import { parseHeyHermesSalesStatus } from "../core/hermes-api";

// HPD-1762: Hey Hermes App 1.1 screens (copy approved by Justus 2026-10-26; server switch decides the waitlist).
test("the English text carries the approved value line and the word spot; no region, no 'just text it'", () => {
  const en = heyAppFlowCopy("en");
  assert.equal(en.valueLine, "Your own AI agent on your own private server. Text it or talk to it, like a friend.");
  const all = JSON.stringify(en);
  assert.doesNotMatch(all, /Just text it|Europe|EU\b|Frankfurt|Falkenstein|German|Lisbon|Austin|Berlin|Texas|USA|America/);
  assert.match(all, /books your next flight/);
  assert.doesNotMatch(all, /\bplace\b|\bplaces\b/);
  const de = heyAppFlowCopy("de");
  assert.match(de.valueLine, /Schreib ihm oder sprich mit ihm, wie mit einem Freund\./);
  assert.match(JSON.stringify(de), /in Europa/);
  assert.match(JSON.stringify(de), /Lissabon/);
  assert.equal(heyAppFlowCopy("fr"), en, "other languages read English until translated");
});

test("the urgency line is only in the release card; the waitlist and taken screens never say it, and no number appears", () => {
  const en = heyAppFlowCopy("en");
  assert.equal(en.release.urgency, "Whoever subscribes first gets the spot.");
  for (const part of [en.waitlist, en.taken, en.purchase, en.welcome, en.signUp]) assert.doesNotMatch(JSON.stringify(part), /subscribes first|first gets|position|#\d/i);
});

test("purchase screen: one plan, no plan name, 30 days free then price, cancel anytime", () => {
  const p = heyAppFlowCopy("en").purchase;
  assert.equal(heyAppFlowFill(p.trialLine, { days: "30", price: "$12.99" }), "30 days free, then $12.99/month. Cancel anytime.");
  assert.equal(heyAppFlowFill(p.trialCta, { days: "30" }), "Start 30 days free");
  assert.doesNotMatch(JSON.stringify(p), /Personal|Pro\b|Starter/);
});

test("Pro appears only in context and has no trial", () => {
  const pro = heyAppFlowCopy("en").pro;
  assert.match(pro.noTrial, /^No free trial/);
  assert.equal(heyShowLimitCard({ remainingIncludedPercent: 0, plan: "starter", proOffered: true }), true);
  assert.equal(heyShowLimitCard({ remainingIncludedPercent: 12, plan: "starter", proOffered: true }), false);
  assert.equal(heyShowLimitCard({ remainingIncludedPercent: 0, plan: "personal", proOffered: true }), false);
  assert.equal(heyShowLimitCard({ remainingIncludedPercent: null, plan: "starter", proOffered: true }), false);
  assert.equal(heyShowLimitCard({ remainingIncludedPercent: 0, plan: "starter", proOffered: false }), false);
});

test("the entry screen follows the server's waitlist state; no gate or unknown status keeps the purchase", () => {
  const at = (state: "waiting" | "released" | "taken" | null) => ({ appWaitlist: state ? { state } : null });
  assert.equal(heyAppEntryScreen(null, false), "purchase");
  assert.equal(heyAppEntryScreen(at(null), false), "purchase");
  assert.equal(heyAppEntryScreen(at("waiting"), false), "waitlist");
  assert.equal(heyAppEntryScreen(at("released"), false), "release");
  assert.equal(heyAppEntryScreen(at("taken"), false), "taken");
  // "Or subscribe right away", "Go to purchase" and an accepted invite open the purchase: paying always works.
  for (const state of ["waiting", "released", "taken"] as const) assert.equal(heyAppEntryScreen(at(state), true), "purchase");
});

test("the sales status parser reads the waitlist state and nothing else from the gate", () => {
  const base = { schemaVersion: "heyhermes.sales-status/v1", open: true, reason: "open", mayPurchase: true, invitation: null, waitlist: null, checkedAt: new Date().toISOString() };
  assert.equal(parseHeyHermesSalesStatus(base)?.appWaitlist, null);
  assert.deepEqual(parseHeyHermesSalesStatus({ ...base, appWaitlist: { state: "released", position: 3 } })?.appWaitlist, { state: "released" });
  assert.equal(parseHeyHermesSalesStatus({ ...base, appWaitlist: { state: "bogus" } })?.appWaitlist, null);
});

test("invitation links: /i/<code> on heyhermes.app and the app scheme; typed codes are normalized", () => {
  assert.equal(heyInviteCodeFromUrl("https://heyhermes.app/i/abcd23"), "ABCD23");
  assert.equal(heyInviteCodeFromUrl("https://heyhermes.app/i/ABCD23/"), "ABCD23");
  assert.equal(heyInviteCodeFromUrl("heyhermes://i/ABCD23"), "ABCD23");
  assert.equal(heyInviteCodeFromUrl("https://evil.example/i/ABCD23"), null);
  assert.equal(heyInviteCodeFromUrl("https://heyhermes.app/app"), null);
  assert.equal(heyInviteCodeFromUrl("https://heyhermes.app/i/ab"), null);
  assert.equal(heyNormalizeInviteCode(" abcd-1234 "), "ABCD1234");
  assert.equal(heyNormalizeInviteCode("a!"), null);
  assert.equal(heyInviteRedeemAccepted("pending"), true);
  assert.equal(heyInviteRedeemAccepted("full"), false);
  assert.equal(heyInviteRedeemAccepted("unknown"), false);
});

test("the surface wires the flow: welcome, link sent, waitlist, release, taken, single purchase, limit card, Pro", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  for (const needle of ["<HeyWelcomeScreen", "<HeyLinkSentScreen", "<HeyWaitlistScreen", "<HeyReleaseScreen", "<HeyTakenScreen", "<HeySinglePurchasePanel", "<HeyLimitCard", "<HeyProScreen", "heyInviteCodeFromUrl(url)", "api.joinAppWaitlist()"]) {
    assert.ok(source.includes(needle), needle);
  }
});

test("Android push waits for the Firebase config in the build (capability check)", () => {
  assert.equal(heyAndroidPushAvailable(true), true);
  for (const value of [false, undefined, null, "true", 1]) assert.equal(heyAndroidPushAvailable(value), false);
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /Platform\.OS === "android" && !heyAndroidPushAvailable\(/);
});
