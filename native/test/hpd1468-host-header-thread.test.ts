import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mobileHostHeaderThreadKey, mobileHostHeaderThreadOpened } from "../src/mobile-host-header";

/**
 * HPD-1468 (Justus, HODL TestFlight 9015): right after switching threads in
 * HODL Bots the header row still showed the previous thread's figure and name
 * for a moment, because the chat first restores another thread and only then
 * opens the requested one. With headerThread the host names the thread it
 * opened the chat for; the header shows it until the chat has switched, then
 * follows the chat as before. Without it (Hey) nothing changes.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("the requested thread counts as open only once the chat shows it", () => {
  const thread = { conversationId: "conv_b", home: false, title: "News" };
  assert.equal(mobileHostHeaderThreadOpened(thread, null), false);
  // The thread restored first (the previous one, or Home) does not count.
  assert.equal(mobileHostHeaderThreadOpened(thread, "conv_a"), false);
  assert.equal(mobileHostHeaderThreadOpened(thread, "home_1"), false);
  assert.equal(mobileHostHeaderThreadOpened(thread, "conv_b"), true);
  // Home has no navigation request: whatever the chat selects first is what it shows.
  const home = { conversationId: null, home: true, title: "Hermes" };
  assert.equal(mobileHostHeaderThreadOpened(home, null), false);
  assert.equal(mobileHostHeaderThreadOpened(home, "home_1"), true);
  assert.equal(mobileHostHeaderThreadOpened(home, "conv_a"), true);
  assert.notEqual(mobileHostHeaderThreadKey(thread), mobileHostHeaderThreadKey(home));
  assert.notEqual(mobileHostHeaderThreadKey(thread), mobileHostHeaderThreadKey({ ...thread, conversationId: "conv_c" }));
});

test("the header shows the requested thread until it is open, only with headerBack", () => {
  assert.match(surface, /headerThread\?: MobileHostHeaderThread \| null;/);
  assert.match(surface, /const hostHeaderThreadKey = headerThread && host\.presentation\?\.headerBack \? mobileHostHeaderThreadKey\(headerThread\) : null;/);
  assert.match(surface, /<HostIdentityFigure size=\{28\} thread=\{pendingHostAssistantThread \?\? activeAssistantThread\} \/>/);
  assert.match(surface, /tab === "chat" && pendingHostHeaderThread\s*\? pendingHostHeaderThread\.title\s*: mobileHostHeaderTitle\(/);
  // The opening row (before the chat is ready) names it too.
  assert.match(surface, /\{pendingHostHeaderThread\?\.title \|\| appCopy\.productName\}/);
  // Once open, the header follows the chat again, also after a later switch inside it.
  assert.match(surface, /if \(hostHeaderThreadOpened && hostHeaderThreadKey\) setOpenedHostHeaderThreadKey\(hostHeaderThreadKey\);/);
  assert.match(surface, /openedHostHeaderThreadKey !== hostHeaderThreadKey/);
});

test("a thread that cannot be opened releases the header; the hooks run before any early return", () => {
  assert.match(surface, /if \(active && hostHeaderThreadKeyRef\.current\) setOpenedHostHeaderThreadKey\(hostHeaderThreadKeyRef\.current\);/);
  const body = surface.slice(surface.indexOf("function NativeR8SurfaceBody("));
  const hooks = body.indexOf("const [openedHostHeaderThreadKey, setOpenedHostHeaderThreadKey] = useState");
  const memo = body.indexOf("const pendingHostAssistantThread = useMemo");
  const firstEarlyReturn = body.indexOf("if (!sessionRestored)");
  assert.ok(hooks > 0 && memo > hooks && firstEarlyReturn > memo);
});
