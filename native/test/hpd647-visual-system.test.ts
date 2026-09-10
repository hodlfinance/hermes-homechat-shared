import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const palette = readFileSync(new URL("../src/mobile-palette.ts", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const systemSurface = readFileSync(new URL("../src/mobile-system-surface.tsx", import.meta.url), "utf8");
const workingDragon = readFileSync(new URL("../src/mobile-working-dragon.tsx", import.meta.url), "utf8");

test("HPD-647 binds the approved Light 2a and Dark 1c tokens", () => {
  for (const token of [
    "#ffffff",
    "#2a2a30",
    "#eeeef1",
    "#e8f1fc",
    "#2f86e8",
    "#161826",
    "#292b31",
    "#e9e9ed",
    "#cfd3e5",
    "#9184d9",
    "#d2cefd",
  ]) assert.match(palette, new RegExp(token.replace("#", "#"), "i"));

  assert.match(systemSurface, /horizontalInset: 16/);
  assert.match(systemSurface, /minimumTouchTarget: 48/);
  assert.match(systemSurface, /borderRadius: 14/);
  assert.match(surface, /chatMessagesInner:[\s\S]*?paddingHorizontal: 18/);
  assert.match(surface, /suggestionChip:[\s\S]*?borderRadius: 999/);
  assert.match(surface, /userMessage:[\s\S]*?backgroundColor: palette\.userTint/);
  assert.match(surface, /chatComposerDock:[\s\S]*?borderTopWidth: 0/);
});

test("the visual overhaul preserves current information and actions", () => {
  assert.match(surface, /activeChatSession\?\.title \|\| snapshot\.me\.email/);
  assert.match(surface, /messageTime \? \(/);
  assert.match(surface, /accessibilityLabel=\{`\$\{copy\.messageTime\} \$\{messageTime\}`\}/);
  assert.match(surface, /tab === "chat"/);
  assert.match(surface, /openMobileAttachmentMenu/);
  assert.match(surface, /stopVoiceNote/);
  assert.match(surface, /jumpToLatestMobileMessage/);
});

test("the 24px working dragon paints complete pose images without clipped bitmap slices", () => {
  assert.match(surface, /<MobileWorkingDragon[\s\S]*?size=\{24\}/);
  assert.doesNotMatch(workingDragon, /function DragonSlice/);
  assert.doesNotMatch(workingDragon, /overflow: "hidden"/);

  for (const source of ["neutralDragon", "winkWingDragon", "oppositeWingDragon"]) {
    assert.match(
      workingDragon,
      new RegExp(`<Animated\\.Image[\\s\\S]*?source=\\{${source}\\}[\\s\\S]*?height: size[\\s\\S]*?width: size`),
    );
  }
});
