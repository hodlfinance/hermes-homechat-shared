import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-899, Justus 25.09.: tapping the host's Hermes tab always opens the Home
// chat at its newest message, from anywhere in the Hermes area.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const effect = surface.slice(
  surface.indexOf("const homeRequestRef = useRef<string | null>(null);"),
  surface.indexOf("const presentedChatTitle ="),
);

test("the surface takes a homeRequest from its host", () => {
  assert.match(surface, /homeRequest\?: \{ requestId: string \};/);
  assert.match(surface, /function NativeR8SurfaceBody\(\{ initialDraft = "", navigationRequest, homeRequest, hostVisible = true \}/);
});

test("each new request leaves any page, opens Home and jumps to the newest message", () => {
  assert.match(effect, /homeRequestRef\.current === homeRequest\.requestId\) return;/);
  assert.match(effect, /setTab\("chat"\);\s+setSettingsSection\(null\);/);
  assert.match(effect, /openMobileHomeChat\(\{ force: true, preserveDraft: true \}\)/);
  assert.match(effect, /jumpToLatestMobileMessage\(\)/);
  assert.match(effect, /\[token, snapshot\?\.workspace\.id, homeRequest\?\.requestId\]/);
  assert.ok(effect.indexOf("setTab(\"chat\")") < effect.indexOf("openMobileHomeChat("));
});
