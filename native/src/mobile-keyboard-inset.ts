/**
 * HPD-846: the chat composer must sit on the tab bar once the keyboard is gone.
 *
 * React Native's KeyboardAvoidingView (behavior "padding") keeps the bottom
 * padding it computed from the last keyboard event. Up to React Native 0.77 it
 * listens on iOS only to `keyboardWillChangeFrame` and trusts that the frame of
 * a closing keyboard computes to zero. React Native 0.81 dropped that: it resets
 * on `keyboardWillHide`, because the frame event is not a reliable hide signal.
 * Hey runs 0.81 through Expo; HODL runs 0.77. In HODL the composer therefore
 * could stay lifted with an empty area below it after the keyboard closed.
 *
 * This backports the 0.81 rule for whichever version the host ships: when iOS
 * reports that the keyboard hides or has hidden, or the app returns to the
 * foreground with no keyboard, the chat's KeyboardAvoidingView forgets its last
 * keyboard event and recomputes, which yields no padding. The two members used
 * here exist unchanged in React Native 0.77 and 0.81.
 */

type KeyboardAvoidingInstance = {
  _keyboardEvent?: unknown;
  _updateBottomIfNecessary?: () => unknown;
};

type Subscription = { remove: () => void };

export type MobileKeyboardInsetHost = {
  os: string;
  keyboard: {
    addListener: (event: "keyboardWillHide" | "keyboardDidHide", listener: () => void) => Subscription;
    isVisible?: () => boolean;
  };
  appState?: {
    addEventListener: (event: "change", listener: (state: string) => void) => Subscription;
  };
};

/** Clears the stale keyboard event of one KeyboardAvoidingView. */
export function releaseKeyboardAvoidingInset(view: unknown): boolean {
  const instance = view as KeyboardAvoidingInstance | null | undefined;
  if (!instance || typeof instance._updateBottomIfNecessary !== "function") return false;
  instance._keyboardEvent = null;
  void Promise.resolve(instance._updateBottomIfNecessary()).catch(() => undefined);
  return true;
}

/** Releases the chat inset on every iOS keyboard hide and on a keyboard-less return to the foreground. */
export function subscribeKeyboardInsetRelease(
  host: MobileKeyboardInsetHost,
  getView: () => unknown,
): () => void {
  if (host.os !== "ios") return () => undefined;
  const release = () => { releaseKeyboardAvoidingInset(getView()); };
  const subscriptions: Subscription[] = [
    // A late frame event can follow the hide notice, so the settled hide
    // releases the inset once more.
    host.keyboard.addListener("keyboardWillHide", release),
    host.keyboard.addListener("keyboardDidHide", release),
  ];
  if (host.appState) {
    subscriptions.push(host.appState.addEventListener("change", (state) => {
      if (state === "active" && host.keyboard.isVisible?.() === false) release();
    }));
  }
  return () => {
    for (const subscription of subscriptions) subscription.remove();
  };
}
