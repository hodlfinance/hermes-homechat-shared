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

test("both AI screens read the server's list, and the offered ChatGPT row carries the privacy line", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /heyChatRouteChoices\(preference \?\? "included_ai", offeredRoutes\)/);
  assert.match(surface, /filter\(\(\[provider\]\) => heyOfferedChatRoutesFrom\(modelOptions\?\.offeredChatRoutes\)\.includes\(provider\)\)/);
  assert.match(surface, /chatGptOffered \? copy\.chatGptPrivacyDetail : copy\.chatGptDetail/);
  assert.doesNotMatch(surface, /\["chatgpt_account", "claude_account", "included_ai"\]/);
});
