import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { heyIsShortReply, heyAndroidPushAvailable, heyAppEntryScreen, heyAppFlowCopy, heyAppFlowFill, heyInviteCodeFromUrl, heyInviteRedeemAccepted, heyNormalizeInviteCode, heyShowLimitCard } from "../src/hey-app-flow";
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

test("iMessage chat style: only a short plain line hugs its text; lists and long answers keep the definite width", () => {
  assert.equal(heyIsShortReply("Done."), true);
  assert.equal(heyIsShortReply("Three things: a 10 am meeting, the reply to Anna and your flight. Where shall we start?"), false);
  assert.equal(heyIsShortReply("- one\n- two"), false);
  assert.equal(heyIsShortReply("**bold**"), false);
  assert.equal(heyIsShortReply(""), false);
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /imessage && \(isUser \? styles\.imUser/);
});

test("returning users (mockups 14, 15, 17, 18): login words, check-your-email, logged-in-as row; no purple in the flow", () => {
  const login = heyAppFlowCopy("en").login;
  assert.equal(login.title, "Welcome back.");
  assert.equal(login.sendLink, "Send login link");
  assert.equal(login.sentTitle, "Check your email.");
  assert.equal(heyAppFlowFill(login.sentBody, { email: "a@b.co" }), "We sent a login link to a@b.co. Open it on this device to log in.");
  assert.equal(login.wrongAddress, "Wrong address? Go back");
  assert.equal(heyAppFlowFill(login.loggedInAs, { email: "a@b.co" }), "Logged in as a@b.co");
  assert.equal(login.notYou, "Not you? Log out");
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const flowBlock = source.slice(source.indexOf("const flowScheme"), source.indexOf("type AssistantThread"));
  assert.doesNotMatch(flowBlock, /#9184d9|#d2cefd|#7c3aed|purple|violet/i);
  assert.match(flowBlock, /<HeyAuthScreen|function HeyAuthScreen/);
});

test("the 'use it right here' sentence is gone in every language (Justus 2026-10-26)", () => {
  for (const locale of ["en", "de", "fr"] as const) assert.doesNotMatch(JSON.stringify(heyAppFlowCopy(locale)), /right here in the a[p]p|direkt hier in der A[p]p/i);
  const source = readFileSync(new URL("../src/hey-app-flow.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /right here in the a[p]p|direkt hier in der A[p]p/i);
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /onOpenAccount && accountLabel[\s\S]*?flow\.footerLink/);
});

test("the opening and plan-loading moments of the store builds use the new design (no large working dragon, no old paywall)", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.equal((surface.match(/<HeyOpeningScreen/g) ?? []).length, 2);
  assert.match(surface, /offeredMobilePlans\.length === 0\)\)/);
  assert.match(surface, /imUserTime: \{ color: "rgba\(255,255,255,0\.75\)" \}/);
});

test("the 144 type scale: 50pt buttons with 1pt outlines, no weight 700, examples with the thin soft underline (variant A), one-line footer", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const block = surface.slice(surface.indexOf("const flow = StyleSheet.create"), surface.indexOf("function HeyFlowFrame"));
  assert.doesNotMatch(block, /fontWeight: "700"/);
  assert.match(block, /primary: \{ height: 50, borderRadius: 25/);
  assert.match(block, /outline: \{ height: 50, borderRadius: 25, borderWidth: 1,/);
  assert.match(block, /hl: \{ textDecorationLine: "underline", textDecorationColor: flowScheme\("#c5cfe6", "#2c3650"\) \}/);
  const welcome = surface.slice(surface.indexOf("function HeyWelcomeScreen("), surface.indexOf("function HeyAuthScreen("));
  assert.match(surface, /\{signUp \? null : \(\s*<Pressable onPress=\{onPassword\}/);
  for (const locale of ["en", "de"] as const) {
    const copy = heyAppFlowCopy(locale);
    assert.ok(copy.signUp.apple && copy.login.apple && copy.welcome.codeLabel && copy.welcome.cancel);
    assert.doesNotMatch(copy.welcome.login, /·/);
  }
});
