import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  releaseKeyboardAvoidingInset,
  subscribeKeyboardInsetRelease,
} from "../src/mobile-keyboard-inset";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

// The two members React Native's KeyboardAvoidingView (0.77 and 0.81) uses to
// derive its bottom padding: the last keyboard event and the recompute.
function keyboardAvoidingView() {
  const view = {
    bottom: 0,
    _keyboardEvent: null as { endCoordinates: { height: number } } | null,
    _updateBottomIfNecessary() {
      view.bottom = view._keyboardEvent ? view._keyboardEvent.endCoordinates.height : 0;
      return Promise.resolve();
    },
  };
  return view;
}

function keyboardHost(os = "ios", visible = false) {
  const listeners = new Map<string, Array<(value?: string) => void>>();
  const add = (event: string, listener: (value?: string) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((item) => item !== listener)) };
  };
  return {
    listeners,
    emit: (event: string, value?: string) => { for (const listener of listeners.get(event) ?? []) listener(value); },
    host: {
      os,
      keyboard: { addListener: add, isVisible: () => visible },
      appState: { addEventListener: add },
    },
  };
}

test("HPD-846: a hiding keyboard leaves no padding under the chat composer", () => {
  const view = keyboardAvoidingView();
  const { host, emit } = keyboardHost();
  subscribeKeyboardInsetRelease(host, () => view);

  // The last frame event still describes an open keyboard, as React Native 0.77
  // keeps it when iOS closes the keyboard.
  view._keyboardEvent = { endCoordinates: { height: 336 } };
  void view._updateBottomIfNecessary();
  assert.equal(view.bottom, 336);

  emit("keyboardWillHide");
  assert.equal(view._keyboardEvent, null);
  assert.equal(view.bottom, 0);

  // A frame event arriving after the hide notice is undone once the keyboard has hidden.
  view._keyboardEvent = { endCoordinates: { height: 336 } };
  void view._updateBottomIfNecessary();
  emit("keyboardDidHide");
  assert.equal(view.bottom, 0);
});

test("HPD-846: returning to the foreground without a keyboard releases a stale padding", () => {
  const hidden = keyboardAvoidingView();
  const hiddenHost = keyboardHost("ios", false);
  subscribeKeyboardInsetRelease(hiddenHost.host, () => hidden);
  hidden._keyboardEvent = { endCoordinates: { height: 336 } };
  void hidden._updateBottomIfNecessary();
  hiddenHost.emit("change", "background");
  assert.equal(hidden.bottom, 336);
  hiddenHost.emit("change", "active");
  assert.equal(hidden.bottom, 0);

  // An open keyboard keeps its padding.
  const open = keyboardAvoidingView();
  const openHost = keyboardHost("ios", true);
  subscribeKeyboardInsetRelease(openHost.host, () => open);
  open._keyboardEvent = { endCoordinates: { height: 336 } };
  void open._updateBottomIfNecessary();
  openHost.emit("change", "active");
  assert.equal(open.bottom, 336);
});

test("HPD-846: the release is iOS only, tolerates an unmounted chat, and unsubscribes", () => {
  const android = keyboardHost("android");
  subscribeKeyboardInsetRelease(android.host, () => keyboardAvoidingView());
  assert.equal(android.listeners.size, 0);

  const ios = keyboardHost();
  const unsubscribe = subscribeKeyboardInsetRelease(ios.host, () => null);
  assert.doesNotThrow(() => ios.emit("keyboardWillHide"));
  unsubscribe();
  for (const listeners of ios.listeners.values()) assert.equal(listeners.length, 0);

  assert.equal(releaseKeyboardAvoidingInset(null), false);
  assert.equal(releaseKeyboardAvoidingInset({}), false);
});

test("HPD-846: the chat's KeyboardAvoidingView is the one released", () => {
  assert.match(
    surface,
    /subscribeKeyboardInsetRelease\(\s*\{ os: Platform\.OS, keyboard: Keyboard, appState: AppState \},\s*\(\) => chatKeyboardAvoidingRef\.current,/,
  );
  assert.match(
    surface,
    /<KeyboardAvoidingView\s+ref=\{chatKeyboardAvoidingRef\}\s+style=\{styles\.chatKeyboard\}/,
  );
});
