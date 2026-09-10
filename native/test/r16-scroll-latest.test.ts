import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  initialMobileScrollIntent,
  mobileScrollDistanceFromBottom,
  mobileScrollIntentAfterContent,
  mobileScrollIntentAfterJump,
  mobileScrollIntentAfterScroll,
  mobileScrollMomentumExpected,
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

test("the native surface commits scroll intent while the user gesture is still active", () => {
  assert.match(surface, /const messagesScrollDraggingRef = useRef\(false\);/);
  assert.match(surface, /const messagesScrollMomentumRef = useRef\(false\);/);
  assert.match(surface, /onScrollBeginDrag=\{\(\) => \{\s*messagesScrollDraggingRef\.current = true;\s*\}\}/);
  assert.match(
    surface,
    /onScroll=\{\(event\) => \{\s*messagesScrollOffsetRef\.current = event\.nativeEvent\.contentOffset\.y;\s*if \(messagesScrollDraggingRef\.current \|\| messagesScrollMomentumRef\.current\) commitMessagesScrollIntent\(event\.nativeEvent\);\s*\}\}/,
  );
  assert.match(
    surface,
    /onScrollEndDrag=\{\(event\) => \{[\s\S]*?commitMessagesScrollIntent\(event\.nativeEvent, targetOffsetY\);[\s\S]*?messagesScrollMomentumRef\.current = [\s\S]*?messagesScrollDraggingRef\.current = false;\s*\}\}/,
  );
  assert.match(
    surface,
    /onMomentumScrollEnd=\{\(event\) => \{\s*if \(messagesScrollMomentumRef\.current\) commitMessagesScrollIntent\(event\.nativeEvent\);\s*messagesScrollMomentumRef\.current = false;\s*\}\}/,
  );
});

test("predicted user momentum disables auto-follow before streamed content can grow", () => {
  const predictedDistance = mobileScrollDistanceFromBottom({
    contentHeight: 1_000,
    offsetY: 740,
    viewportHeight: 100,
  });
  const beforeGrowth = mobileScrollIntentAfterScroll(initialMobileScrollIntent, predictedDistance);

  assert.equal(predictedDistance, 160);
  assert.equal(mobileScrollMomentumExpected(820, 740, undefined), true);
  assert.equal(mobileScrollMomentumExpected(820, undefined, -0.5), true);
  assert.equal(mobileScrollMomentumExpected(820, 820, 0), false);
  assert.equal(mobileScrollMomentumExpected(820, 820, -0.5), false);
  assert.deepEqual(mobileScrollIntentAfterContent(beforeGrowth), {
    autoFollow: false,
    showScrollDown: true,
    scrollToEnd: false,
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
