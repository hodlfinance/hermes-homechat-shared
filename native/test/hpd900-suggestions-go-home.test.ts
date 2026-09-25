import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-900 (Justus, launch package, Fin and Hey): a suggestion tapped while an
// automation thread or a sub thread was open went into that thread. A
// suggestion always goes to the Home chat.

const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const body = (name: string) => {
  const start = source.indexOf(name);
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf("\n  }\n", start));
};

test("HPD-900: there is one way to the Home chat for a suggestion, and it opens Home deliberately", () => {
  const home = body("async function homeChatForSuggestion()");
  assert.match(home, /const home = homeConversationSession\(chatSessions\);/);
  assert.match(home, /if \(home && activeConversationSessionIdRef\.current === home\.id\)/);
  assert.match(home, /await openMobileHomeChat\(\{ force: true, preserveDraft: true \}\)/);
});

test("HPD-900: a Fin suggestion opens Home before it fills the composer", () => {
  const fin = body("async function startFinSuggestion(");
  assert.ok(fin.indexOf("await homeChatForSuggestion()") < fin.indexOf("setInput(finHermesSuggestionDraft(suggestion))"));
});

test("HPD-900: a chat suggestion is sent to Home by name, not to whatever conversation was open", () => {
  const chat = body("async function startChatSuggestion(");
  assert.match(chat, /const homeId = await homeChatForSuggestion\(\);/);
  assert.match(chat, /conversationSessionId: homeId,/);
  assert.match(chat, /await runSend\(suggestion\.prompt, "text", undefined, undefined, homeId\);/);
  assert.doesNotMatch(chat, /conversationSessionId: activeConversationSessionId/);
});

test("HPD-900: a Hey suggestion that becomes a draft opens Home first", () => {
  const hey = body("async function openHeySuggestion(");
  const draft = hey.slice(hey.indexOf('if (action.kind === "editable_draft") {'));
  assert.ok(draft.indexOf("await homeChatForSuggestion()") < draft.indexOf("setInput(action.draft);"));
});

test("HPD-900: the explicit conversation reaches the run", () => {
  const send = body("async function runSend(");
  assert.match(send, /const targetConversationSessionId = conversationSessionIdOverride === undefined\s*\? activeConversationSessionId\s*: conversationSessionIdOverride;/);
});
