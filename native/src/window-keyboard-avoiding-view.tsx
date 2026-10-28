/**
 * HPD-1466 (HODL Bots chat, TestFlight 9015): the keyboard covered the chat
 * composer.
 *
 * React Native's KeyboardAvoidingView measures itself with `onLayout`, which is
 * relative to its parent, and compares that with the keyboard's top edge on the
 * screen. `keyboardVerticalOffset` has to make up the difference: the distance
 * from the top of the screen to the top of the view's parent. A fixed number
 * cannot be right on every iPhone, because the status-bar/Dynamic-Island inset
 * above the chat differs per model (20 to 62 pt) and is 0 in landscape. HODL's
 * Bots chat set it to 0 once its slim back bar went away, so the composer sat
 * one status-bar inset too low, behind the keyboard.
 *
 * This view measures where it really sits in the window and uses that as the
 * offset. The inner KeyboardAvoidingView is its only child, so its own parent
 * offset is exactly the measured value, on every device and orientation, with
 * or without host bars above the chat.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, View } from "react-native";
import { refreshKeyboardAvoidingInset, releaseKeyboardAvoidingInsetAfterFrame, windowKeyboardOffset } from "./mobile-keyboard-inset";

type MeasurableView = {
  measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
  measure?: (callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void) => void;
};

type WindowKeyboardAvoidingViewProps = {
  style?: unknown;
  behavior?: "height" | "position" | "padding";
  enabled?: boolean;
  children?: ReactNode;
};

export const WindowKeyboardAvoidingView = forwardRef<unknown, WindowKeyboardAvoidingViewProps>(function WindowKeyboardAvoidingView(
  { style, behavior, enabled, children },
  ref,
) {
  const frameRef = useRef<MeasurableView | null>(null);
  const keyboardRef = useRef<unknown>(null);
  const [offset, setOffset] = useState(0);
  useImperativeHandle(ref, () => keyboardRef.current, []);
  const measure = useCallback(() => {
    const update = (y: number) => {
      const next = windowKeyboardOffset(y);
      setOffset((current) => (current === next ? current : next));
    };
    if (Platform.OS === "android") {
      // HPD-1813: Hey's edge-to-edge React root begins at screen y=0.
      // Android measureInWindow subtracts the visible window's top inset,
      // while Keyboard.screenY does not. pageY keeps both in screen space.
      frameRef.current?.measure?.((_x, _y, _width, _height, _pageX, pageY) => update(pageY));
    } else {
      frameRef.current?.measureInWindow?.((_x, y) => update(y));
    }
  }, []);
  // A host bar above the chat can appear or go away without this view's own
  // frame changing, so the position is read again whenever the keyboard opens.
  useEffect(() => {
    const event = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(event, measure);
    // RN 0.81 treats Android's hide event as another frame. That frame uses
    // the visible window height, leaving an inset behind in edge-to-edge.
    // Clear it after RN's pending frame calculation has settled.
    const hidden = Platform.OS === "android" ? Keyboard.addListener("keyboardDidHide", () => {
      void releaseKeyboardAvoidingInsetAfterFrame(() => keyboardRef.current);
    }) : null;
    return () => { subscription.remove(); hidden?.remove(); };
  }, [measure]);
  useEffect(() => {
    refreshKeyboardAvoidingInset(keyboardRef.current);
  }, [offset]);
  return (
    <View ref={frameRef as never} style={style as never} onLayout={measure} collapsable={false}>
      <KeyboardAvoidingView
        ref={keyboardRef as never}
        style={{ flex: 1 }}
        behavior={behavior}
        enabled={enabled}
        keyboardVerticalOffset={offset}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
});
