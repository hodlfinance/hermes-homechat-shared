import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { heyChatRouteChoices, heyOfferedChatRoutesFrom } from "../core/types";

// HPD-1426 (Justus, 2026-10-21): ChatGPT comes back behind a server switch.

test("without the server's list the screen offers Included AI only, as before", () => {
  assert.deepEqual([...heyOfferedChatRoutesFrom(undefined)], ["included_ai"]);
  assert.deepEqual([...heyOfferedChatRoutesFrom(null)], ["included_ai"]);
  assert.deepEqual([...heyOfferedChatRoutesFrom("chatgpt_account")], ["included_ai"]);
  assert.deepEqual([...heyOfferedChatRoutesFrom(["included_ai"])], ["included_ai"]);
});

test("the switch offers ChatGPT next to Included AI, and never Claude", () => {
  assert.deepEqual([...heyOfferedChatRoutesFrom(["included_ai", "chatgpt_account"])], ["included_ai", "chatgpt_account"]);
  assert.deepEqual([...heyOfferedChatRoutesFrom(["chatgpt_account"])], ["included_ai", "chatgpt_account"]);
  assert.deepEqual([...heyOfferedChatRoutesFrom(["claude_account", "nonsense"])], ["included_ai"]);
});

test("a workspace on a withheld route still sees it", () => {
  const offered = heyOfferedChatRoutesFrom(["included_ai", "chatgpt_account"]);
  assert.deepEqual([...heyChatRouteChoices("chatgpt_account", offered)], ["included_ai", "chatgpt_account"]);
  assert.deepEqual([...heyChatRouteChoices("claude_account", offered)], ["included_ai", "chatgpt_account", "claude_account"]);
  assert.deepEqual([...heyChatRouteChoices("included_ai")], ["included_ai"]);
});

test("both AI screens read the server's list, and the offered ChatGPT row carries the short line", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /heyChatRouteChoices\(preference \?\? "included_ai", offeredRoutes\)/);
  assert.match(surface, /filter\(\(\[provider\]\) => heyOfferedChatRoutesFrom\(modelOptions\?\.offeredChatRoutes\)\.includes\(provider\)\)/);
  assert.match(surface, /chatGptOffered \? copy\.chatGptShortDetail : copy\.chatGptDetail/);
  assert.match(surface, /\["chatgpt_account", t\.systemPages\.aiAccess\.chatGpt, t\.systemPages\.aiAccess\.chatGptShortDetail\]/);
  assert.doesNotMatch(surface, /\["chatgpt_account", "claude_account", "included_ai"\]/);
});

// HPD-1426 (Justus, 2026-10-22): the approved notice is long; the row shows a
// short line and the full text opens behind a details button.
test("the full approved notice opens behind a details button under the ChatGPT row", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const panel = surface.slice(surface.indexOf("function MobileAiAccessPanel("));
  const details = panel.slice(panel.indexOf("{chatGptOffered ? ("), panel.indexOf("{automationFailureRoute ? ("));
  assert.match(details, /label=\{copy\.chatGptDetailsButton\}/);
  assert.match(details, /onPress=\{\(\) => setChatGptDetailsOpen\(\(open\) => !open\)\}/);
  assert.match(details, /\{chatGptDetailsOpen \? \(/);
  assert.match(details, /\{copy\.chatGptPrivacyDetail\}/);
});

test("every locale carries the short line, the button and the approved full text", async () => {
  const { mobileText } = await import("../src/appI18n");
  for (const locale of ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const) {
    const copy = mobileText(locale).systemPages.aiAccess;
    assert.ok(copy.chatGptShortDetail.length > 0 && copy.chatGptShortDetail.length < 60, locale);
    assert.ok(copy.chatGptDetailsButton.length > 0, locale);
    assert.ok(copy.chatGptPrivacyDetail.startsWith(copy.chatGptShortDetail.replace(/[.。]$/, "")), locale);
  }
  assert.equal(mobileText("de").systemPages.aiAccess.chatGptPrivacyDetail,
    // HPD-1498 (Justus, 2026-10-22): the last sentence now points at the Google-data switch.
    "Nutzt dein eigenes ChatGPT-Konto. Deine Nachrichten gehen dann an OpenAI, nach den Bedingungen deines ChatGPT-Kontos, und verbrauchen nicht dein Plan-Kontingent. Daten aus Gmail, Kalender und Drive bekommt dein ChatGPT erst, wenn du das einschaltest; ausschalten kannst du es jederzeit unter KI-Zugang. Die enthaltene KI speichert nichts und trainiert mit nichts.");
});
