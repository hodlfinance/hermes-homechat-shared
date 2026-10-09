import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-1121: Hey Hermes warms the provider cache of the Home chat when the
// customer comes back to it. The shared surface only says when the Home chat is
// in view with the app in front; the host decides what to do, and a host
// without the hook (Fin, HODL) does nothing.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

test("the host contract carries an optional, fire-and-forget Home-in-front hook", () => {
  assert.match(host, /onHomeChatInFront\?: \(input: \{ token: string \}\) => void;/);
});

test("the signal needs the chat tab, the host in view, the app in front and the Home conversation", () => {
  const start = surface.indexOf("const homeChatInFrontSignal");
  assert.ok(start > 0);
  const block = surface.slice(start, surface.indexOf("}, [token, homeChatInFrontSignal]);", start));
  assert.match(block, /tab === "chat" && hostVisible && appInFront/);
  assert.match(block, /\?\.role === "home"/);
  assert.match(block, /if \(!token \|\| !homeChatInFrontSignal\) return;/);
  assert.match(block, /try \{\s*host\.onHomeChatInFront\?\.\(\{ token \}\);\s*\} catch/);
  // appInFront follows AppState, so a return from the background fires it again.
  assert.ok(surface.indexOf("const [appInFront, setAppInFront]") < start);
});

test("typing in the Home chat in front calls the optional typing hook with the newest message time", () => {
  assert.match(host, /onHomeChatTyping\?: \(input: \{ token: string; lastMessageAt: string \| null \}\) => void;/);
  const start = surface.indexOf("const homeChatTypingDraft");
  assert.ok(start > 0);
  const block = surface.slice(start, surface.indexOf("}, [token, homeChatTypingDraft, lastHomeMessageAt]);", start));
  assert.match(block, /homeChatInFrontSignal && input\.trim\(\)\.length > 0/);
  assert.match(block, /try \{\s*host\.onHomeChatTyping\?\.\(\{ token, lastMessageAt: lastHomeMessageAt \}\);\s*\} catch/);
});
