import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  initialMobileScrollIntent,
  mobileScrollIntentAfterContent,
  mobileScrollIntentAfterJump,
  mobileScrollIntentAfterScroll,
} from "../src/mobile-scroll-intent";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("an upward user scroll reveals the jump-to-latest button immediately", () => {
  assert.deepEqual(mobileScrollIntentAfterScroll(initialMobileScrollIntent, 97), {
    autoFollow: false,
    showScrollDown: true,
  });
  assert.deepEqual(mobileScrollIntentAfterScroll({ autoFollow: false, showScrollDown: true }, 96), {
    autoFollow: true,
    showScrollDown: false,
  });
});

test("new content preserves reading position while the user is above the threshold", () => {
  assert.deepEqual(mobileScrollIntentAfterContent({ autoFollow: false, showScrollDown: true }), {
    autoFollow: false,
    showScrollDown: true,
    scrollToEnd: false,
  });
});

test("jump-to-latest restores auto-follow and hides the control", () => {
  assert.deepEqual(mobileScrollIntentAfterJump(), {
    autoFollow: true,
    showScrollDown: false,
  });
});

test("the accessible jump-to-latest control has a solid surface contrast in both palettes", () => {
  assert.match(surface, /scrollDownButton:[\s\S]*?backgroundColor: palette\.accent,/);
  assert.match(surface, /<ChevronDown size=\{20\} color=\{palette\.surface\} \/>/);
  assert.match(surface, /style=\{styles\.scrollDownButton\}[\s\S]*?onPress=\{jumpToLatestMobileMessage\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityLabel=\{staticUiCopy\(appLocale\)\["Scroll to latest message"\]\}/);
});
