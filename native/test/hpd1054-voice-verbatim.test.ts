import assert from "node:assert/strict";
import test from "node:test";
import { mobileChatMessageFromCanonical } from "../src/hermes-canonical";
import { visibleUserMessageText } from "../src/voice-verbatim";

// Exactly the text hey-hermes' delegationWithVerbatim stored before HPD-1054.
const footer = "Act on the user's exact words. For names, file paths, commands, numbers and spellings, use the exact words above;"
  + " the request above them may paraphrase. If the two differ, follow the exact words.";
const stored = (task: string, words: string[]) =>
  `${task}\n\nThe user's exact spoken words (speech transcript${words.length > 1 ? ", oldest first" : ""}):\n${words.map((w) => `"${w}"`).join("\n")}\n${footer}`;

test("an old voice message shows the user's latest spoken words", () => {
  const content = stored("The user wants to know which Linux distribution /etc/release names.", ["Lies bitte /etc/os-release."]);
  assert.equal(visibleUserMessageText(content), "Lies bitte /etc/os-release.");
  assert.equal(visibleUserMessageText(stored("The user asks twice.", ["Hallo", "Wie wird das Wetter?"])), "Wie wird das Wetter?");
});

test("every other message is untouched", () => {
  for (const content of ["Hi", "The user's exact spoken words are mine.", `Quote "x"\n${footer}`, ""]) {
    assert.equal(visibleUserMessageText(content), content);
  }
});

test("the canonical mapping hides the block only on user messages", () => {
  const content = stored("The user wants the weather.", ["Wie wird das Wetter?"]);
  const base = { id: "m1", conversationId: "home", runId: "run_1", consumerSafety: null, artifactReferences: [], createdAt: "2026-10-06T08:00:00.000Z" };
  assert.equal(mobileChatMessageFromCanonical({ ...base, role: "user", content }).content, "Wie wird das Wetter?");
  assert.equal(mobileChatMessageFromCanonical({ ...base, role: "assistant", content }).content, content);
});
