import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mobileChatMessageFromCanonical } from "../src/hermes-canonical";

const base = { id: "m1", conversationId: "home", runId: "run_1", consumerSafety: null, artifactReferences: [], createdAt: "2026-10-27T08:00:00.000Z" };

test("HPD-1789: the plane's reaction reaches the user's message only", () => {
  assert.equal(mobileChatMessageFromCanonical({ ...base, role: "user", content: "Perfect, thanks!", hermesReaction: "👍" }).hermesReaction, "👍");
  assert.equal("hermesReaction" in mobileChatMessageFromCanonical({ ...base, role: "assistant", content: "Done.", hermesReaction: "👍" }), false);
  assert.equal("hermesReaction" in mobileChatMessageFromCanonical({ ...base, role: "user", content: "Hi", hermesReaction: null }), false);
  assert.equal("hermesReaction" in mobileChatMessageFromCanonical({ ...base, role: "user", content: "Hi" }), false);
  assert.equal("hermesReaction" in mobileChatMessageFromCanonical({ ...base, role: "user", content: "Hi", hermesReaction: "  " }), false);
  assert.equal(mobileChatMessageFromCanonical({ ...base, role: "user", content: "Wetter?", hermesReaction: "🌦️" }).hermesReaction, "🌦️");
  assert.equal("hermesReaction" in mobileChatMessageFromCanonical({ ...base, role: "user", content: "Hi", hermesReaction: "👍 nice" }), false);
});

test("HPD-1789: the badge sits on the user's iMessage bubble, light and dark, never pressable", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /const hermesReaction = isUser && imessage && message\.hermesReaction \? message\.hermesReaction : null;/);
  assert.match(surface, /<View style=\{styles\.imReactionBadge\} pointerEvents="none" accessible/);
  assert.match(surface, /DynamicColorIOS\(\{ light: "#ffffff", dark: "#1f232d" \}\) : androidStartsDark \? "#1f232d" : "#ffffff"/);
  assert.match(surface, /DynamicColorIOS\(\{ light: "#cfd3dc", dark: "#374151" \}\) : androidStartsDark \? "#374151" : "#cfd3dc"/);
});
