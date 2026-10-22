import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-1498 (Justus, 2026-10-22): on the ChatGPT connect screen, before "Open
// sign-in", one switch, on by default, with a one-sentence notice; connecting
// with it on is the consent. Later it is changed under AI Access.
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const panel = surface.slice(surface.indexOf("function MobileAiAccessPanel("));

test("the connect screen shows the switch on by default, before Open sign-in, and saves it there", () => {
  // On for a first connect; a reconnect starts from the stored choice (review round 1).
  assert.match(panel, /const storedGoogleData = modelOptions\?\.chatGptGoogleData\?\.changedAt \? googleDataAllowed : true;/);
  assert.match(panel, /const \[connectGoogleData, setConnectGoogleDataState\] = useState\(storedGoogleData\);/);
  const connect = panel.slice(panel.indexOf("{chatGptConnection ? ("), panel.indexOf("{claudeConnection ? ("));
  assert.ok(connect.indexOf("copy.chatGptGoogleDataSwitch") > 0, "switch on the connect screen");
  assert.ok(connect.indexOf("copy.chatGptGoogleDataSwitch") < connect.indexOf("copy.openSignIn"), "switch before Open sign-in");
  assert.match(connect, /detail=\{copy\.chatGptGoogleDataNotice\}/);
  assert.match(connect, /saveGoogleData\(connectGoogleData, "chatgpt_connect"\)/);
  // Saved on Open sign-in, and on Check status only when it differs from the stored choice.
  assert.match(connect, /connectGoogleData !== googleDataAllowed \|\| !storedChangedAt/);
  assert.equal(connect.split('saveGoogleData(connectGoogleData, "chatgpt_connect")').length - 1, 2);
});

test("AI Access carries the same switch once ChatGPT is connected", () => {
  assert.match(panel, /chatGptOffered && truth\.providers\.chatgpt_account === "connected" \? \(/);
  assert.match(panel, /saveGoogleData\(!googleDataAllowed, "ai_access"\)/);
  assert.match(surface, /onSetChatGptGoogleData=\{setMobileChatGptGoogleData\}/);
  assert.match(surface, /api\.setChatGptGoogleData\(\{ allowed, source \}\)/);
});

test("every locale has the switch, its notice and the failed-save line", async () => {
  const { mobileText } = await import("../src/appI18n");
  const english = mobileText("en").systemPages.aiAccess;
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = mobileText(locale).systemPages.aiAccess;
    assert.ok(copy.chatGptGoogleDataSwitch && copy.chatGptGoogleDataNotice && copy.chatGptGoogleDataSaveFailed, locale);
    if (locale !== "en") assert.notEqual(copy.chatGptGoogleDataSwitch, english.chatGptGoogleDataSwitch, locale);
  }
  assert.equal(mobileText("de").systemPages.aiAccess.chatGptGoogleDataSwitch,
    "Mein ChatGPT darf auch Daten aus Gmail, Kalender und Drive sehen, die ich in Hey nutze.");
});
