import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { refreshKeyboardAvoidingInset, releaseKeyboardAvoidingInsetAfterFrame, windowKeyboardOffset } from "../src/mobile-keyboard-inset";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/window-keyboard-avoiding-view.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

// React Native 0.77 KeyboardAvoidingView, behavior "padding": its frame comes
// from onLayout (relative to its parent) and is compared with the keyboard's
// top edge on the screen, shifted by keyboardVerticalOffset.
function rnPadding(frame: { y: number; height: number }, keyboardScreenY: number, offset: number) {
  return Math.max(frame.y + frame.height - (keyboardScreenY - offset), 0);
}

// iPhone SE (20), 13 mini (50), 14 (47), 15/16 (59), 16 Pro (62), 16 Pro Max (62): top inset, screen height.
const devices = [
  { name: "SE", top: 20, bottom: 0, height: 667, keyboard: 216 },
  { name: "13 mini", top: 50, bottom: 34, height: 812, keyboard: 291 },
  { name: "14", top: 47, bottom: 34, height: 844, keyboard: 291 },
  { name: "16", top: 59, bottom: 34, height: 852, keyboard: 291 },
  { name: "16 Pro", top: 62, bottom: 34, height: 874, keyboard: 301 },
  { name: "16 Pro Max", top: 62, bottom: 34, height: 956, keyboard: 301 },
];

test("HPD-1466: the measured window offset lifts the composer exactly to the keyboard on every iPhone", () => {
  for (const device of devices) {
    for (const barAbove of [0, 44]) {
      // HODL shell pads the safe area; the chat may sit below a host bar.
      const windowY = device.top + barAbove;
      const kavHeight = device.height - device.bottom - windowY;
      const keyboardY = device.height - device.keyboard;
      const kavBottomOnScreen = windowY + kavHeight;
      const needed = kavBottomOnScreen - keyboardY;
      const padding = rnPadding({ y: 0, height: kavHeight }, keyboardY, windowKeyboardOffset(windowY));
      assert.equal(padding, needed, `${device.name}, bar ${barAbove}`);
      // The 9015 bug: offset 0 leaves the composer one top inset too low.
      if (!barAbove) assert.equal(needed - rnPadding({ y: 0, height: kavHeight }, keyboardY, 0), device.top);
    }
  }
});

test("HPD-1466: window offsets are whole, non-negative points", () => {
  assert.equal(windowKeyboardOffset(61.6), 62);
  assert.equal(windowKeyboardOffset(-3), 0);
  assert.equal(windowKeyboardOffset(Number.NaN), 0);
  assert.equal(windowKeyboardOffset(undefined), 0);
});

test("HPD-1466: a changed offset recomputes the padding only while a keyboard event is held", async () => {
  let calls = 0;
  const kav = { _keyboardEvent: null as unknown, _updateBottomIfNecessary: () => { calls += 1; return Promise.resolve(); } };
  assert.equal(refreshKeyboardAvoidingInset(kav), false);
  kav._keyboardEvent = { endCoordinates: { screenY: 500 } };
  assert.equal(refreshKeyboardAvoidingInset(kav), true);
  assert.equal(calls, 1);
  assert.equal(refreshKeyboardAvoidingInset(null), false);
});

test("HPD-1466: the window measurement remains opt-in outside Android standalone chat", () => {
  assert.match(host, /keyboardOffsetFromWindow\?: boolean;/);
  assert.match(surface, /androidStandaloneKeyboard \|\| host\.presentation\?\.keyboardOffsetFromWindow === true\s*\? WindowKeyboardAvoidingView\s*: KeyboardAvoidingView/);
  assert.match(surface, /<ChatKeyboardAvoidingView\s+ref=\{chatKeyboardAvoidingRef\}[\s\S]*?keyboardVerticalOffset=\{keyboardVerticalOffset\}/);
  assert.match(surface, /<\/ChatKeyboardAvoidingView>/);
});

test("HPD-1466: the view measures in the window on layout and on every keyboard show, and is the inner view's only parent", () => {
  assert.match(view, /measureInWindow/);
  assert.match(view, /onLayout=\{measure\}/);
  assert.match(view, /Platform\.OS === "ios" \? "keyboardWillShow" : "keyboardDidShow"/);
  assert.match(view, /collapsable=\{false\}/);
  assert.match(view, /keyboardVerticalOffset=\{offset\}/);
  assert.match(view, /refreshKeyboardAvoidingInset\(keyboardRef\.current\)/);
});

test("HPD-1813: explicit avoidance is confined to standalone Android; iOS keeps padding", () => {
  assert.match(surface, /const androidStandaloneKeyboard = Platform\.OS === "android" && host\.session\.mode === "standalone";/);
  assert.match(surface, /behavior=\{Platform\.OS === "ios" \|\| androidStandaloneKeyboard \? "padding" : undefined\}/);
});

test("HPD-1813: Android edge-to-edge uses the root position, not the inset-subtracted window position", () => {
  // Measured on API 36: the old window measurement left 136 px behind Gboard.
  const pageY = 83.27273559570312;
  const windowY = 33.818206787109375;
  const height = 768;
  const keyboardY = 548;
  const expected = pageY + height - keyboardY;
  const padding = rnPadding({ y: 0, height }, keyboardY, windowKeyboardOffset(pageY));
  assert.ok(Math.abs(padding - expected) <= 0.5);
  assert.ok(expected - rnPadding({ y: 0, height }, keyboardY, windowKeyboardOffset(windowY)) > 49);
  assert.match(view, /Platform\.OS === "android"[\s\S]*?measure\?\.[\s\S]*?pageY\) => update\(pageY\)/);
});

test("HPD-1813: hiding releases Android padding after RN's pending hide-frame calculation", async () => {
  let bottom = 300;
  const kav = {
    _keyboardEvent: { endCoordinates: { screenY: 800 } } as unknown,
    _updateBottomIfNecessary: () => { bottom = kav._keyboardEvent ? 50 : 0; },
  };
  // RN's async frame calculation has queued its continuation before our listener.
  const frame = Promise.resolve().then(() => { bottom = 50; });
  const release = releaseKeyboardAvoidingInsetAfterFrame(() => kav);
  await Promise.all([frame, release]);
  assert.equal(bottom, 0);
  assert.equal(kav._keyboardEvent, null);
  assert.equal(await releaseKeyboardAvoidingInsetAfterFrame(() => null), false);
  assert.match(view, /Platform\.OS === "android" \? Keyboard\.addListener\("keyboardDidHide"/);
  assert.match(view, /releaseKeyboardAvoidingInsetAfterFrame\(\(\) => keyboardRef\.current\)/);
});
