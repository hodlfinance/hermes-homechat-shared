import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chatGptGoogleDataPromptVisible, connectedGoogleServicesFrom } from "../core/chatgpt-google-data-offer";

// HPD-1498 / HPD-1521 (Justus, 2026-10-23): the switch "my ChatGPT may also see
// Gmail, Calendar and Drive data" starts off (opt-in). The connect screen
// carries no switch; a short prompt offers it once ChatGPT and a Google service
// are connected, in either order. The switch stays under AI Access.
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const panel = surface.slice(surface.indexOf("function MobileAiAccessPanel("));

test("the connect screen carries no switch and saves no choice", () => {
  const connect = panel.slice(panel.indexOf("{chatGptConnection ? ("), panel.indexOf("{claudeConnection ? ("));
  assert.ok(connect.length > 0);
  assert.equal(connect.indexOf("chatGptGoogleData"), -1, "no Google-data switch before sign-in");
  assert.equal(connect.indexOf("saveGoogleData"), -1, "opening sign-in stores nothing");
  assert.doesNotMatch(surface, /"chatgpt_connect"/);
});

test("AI Access carries the switch once ChatGPT is connected, and the prompt when due", () => {
  assert.match(panel, /chatGptOffered && truth\.providers\.chatgpt_account === "connected" \? \(/);
  assert.match(panel, /saveGoogleData\(!googleDataAllowed, "ai_access"\)/);
  assert.match(panel, /\{googleDataPrompt \? \(\s*<MobileChatGptGoogleDataPrompt/);
  assert.match(panel, /onTurnOn=\{\(\) => void saveGoogleData\(true, "chatgpt_prompt"\)\}/);
  assert.match(surface, /onSetChatGptGoogleData=\{setMobileChatGptGoogleData\}/);
  assert.match(surface, /googleDataPrompt=\{chatGptGoogleDataPromptShown\}/);
});

test("Home shows the prompt; Turn on stores consent, Not now stores none", () => {
  assert.match(surface, /\{chatGptGoogleDataPromptShown && isHomeChatActive \? \(\s*<MobileChatGptGoogleDataPrompt/);
  const later = surface.slice(surface.indexOf("async function dismissMobileChatGptGoogleDataPrompt"), surface.indexOf("async function turnOnMobileChatGptGoogleDataFromPrompt"));
  assert.match(later, /api\.dismissChatGptGoogleDataPrompt\(\{ services \}\)/);
  assert.doesNotMatch(later, /setChatGptGoogleData/);
  const on = surface.slice(surface.indexOf("async function turnOnMobileChatGptGoogleDataFromPrompt"));
  assert.match(on.slice(0, 400), /setMobileChatGptGoogleData\(true, "chatgpt_prompt"\)/);
});

test("the prompt is due only with ChatGPT and a Google service connected and no stored choice", () => {
  const base = { chatGptOffered: true, chatGptConnected: true, consent: { allowed: false, changedAt: null }, connectedServices: ["gmail"] as const };
  assert.equal(chatGptGoogleDataPromptVisible(base), true);
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, chatGptOffered: false }), false);
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, chatGptConnected: false }), false);
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, connectedServices: [] }), false);
  // Unreadable consent shows nothing.
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, consent: null }), false);
  // A stored choice, on or off, wins.
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, consent: { allowed: false, changedAt: "2026-10-23T10:00:00.000Z" } }), false);
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, consent: { allowed: true, changedAt: "2026-10-23T10:00:00.000Z" } }), false);
  // Not now hides it until a Google service that was not connected then is connected.
  const dismissed = { allowed: false, changedAt: null, promptDismissedFor: ["calendar"] };
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, consent: dismissed, connectedServices: ["calendar"] }), false);
  assert.equal(chatGptGoogleDataPromptVisible({ ...base, consent: dismissed, connectedServices: ["gmail", "calendar"] }), true);
});

test("connected Google services come from the Gmail row and the catalog, only when added", () => {
  assert.deepEqual(connectedGoogleServicesFrom({}), []);
  assert.deepEqual(connectedGoogleServicesFrom({ guidedSetup: { connections: [{ id: "gmail", status: "added" }] } }), ["gmail"]);
  assert.deepEqual(connectedGoogleServicesFrom({ guidedSetup: { connections: [{ id: "gmail", status: "setup_incomplete" }] } }), []);
  assert.deepEqual(connectedGoogleServicesFrom({
    pluginCatalog: { items: [{ id: "google_drive", status: "added" }, { id: "calendar", status: "added" }, { id: "gmail", status: "attention" }, { id: "telegram", status: "added" }] },
  }), ["calendar", "drive"]);
});

test("every locale has the switch, its notice, the prompt and its two buttons", async () => {
  const { mobileText } = await import("../src/appI18n");
  const english = mobileText("en").systemPages.aiAccess;
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = mobileText(locale).systemPages.aiAccess;
    assert.ok(copy.chatGptGoogleDataSwitch && copy.chatGptGoogleDataNotice && copy.chatGptGoogleDataSaveFailed, locale);
    assert.ok(copy.chatGptGoogleDataPrompt && copy.chatGptGoogleDataPromptOn && copy.chatGptGoogleDataPromptLater, locale);
    if (locale !== "en") assert.notEqual(copy.chatGptGoogleDataPrompt, english.chatGptGoogleDataPrompt, locale);
  }
  const de = mobileText("de").systemPages.aiAccess;
  assert.equal(de.chatGptGoogleDataPromptOn, "Einschalten");
  assert.equal(de.chatGptGoogleDataPromptLater, "Nicht jetzt");
});
