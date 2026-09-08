import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type AccessibilityActionEvent,
  type AccessibilityRole,
  type AccessibilityState,
} from "react-native";

export type MobileRemovableNavigationEntry = Readonly<{
  entryId: string;
  mode: "archive" | "unpin";
}>;

export type MobileRemovalToken = Readonly<{ id: number }>;

export type MobileRemovalExecution =
  | Readonly<{ accepted: true; completion: Promise<void> }>
  | Readonly<{ accepted: false; completion: null }>;

export type MobileRemovalGate = Readonly<{
  cancel(token: MobileRemovalToken): boolean;
  complete(token: MobileRemovalToken): boolean;
  confirm(token: MobileRemovalToken, entry: MobileRemovableNavigationEntry): MobileRemovalExecution;
  isPending(): boolean;
  request(): MobileRemovalToken | null;
}>;

export function createMobileRemovalGate(
  onRemoveNavigationEntry: (entry: MobileRemovableNavigationEntry) => void | Promise<void>,
): MobileRemovalGate {
  let nextId = 1;
  let current: { id: number; phase: "confirming" | "pending" } | null = null;

  return Object.freeze({
    request() {
      if (current !== null) return null;
      const token = Object.freeze({ id: nextId });
      nextId += 1;
      current = { id: token.id, phase: "confirming" };
      return token;
    },
    cancel(token) {
      if (current?.id !== token.id || current.phase !== "confirming") return false;
      current = null;
      return true;
    },
    confirm(token, entry) {
      if (current?.id !== token.id || current.phase !== "confirming") {
        return Object.freeze({ accepted: false, completion: null });
      }
      current = { id: token.id, phase: "pending" };
      try {
        const completion = Promise.resolve(onRemoveNavigationEntry(entry)).then(() => undefined);
        return Object.freeze({ accepted: true, completion });
      } catch (error) {
        return Object.freeze({ accepted: true, completion: Promise.reject(error) });
      }
    },
    complete(token) {
      if (current?.id !== token.id || current.phase !== "pending") return false;
      current = null;
      return true;
    },
    isPending() {
      return current?.phase === "pending";
    },
  });
}

export const metrics = Object.freeze({
  columnGap: 12,
  horizontalInset: 20,
  iconColumnWidth: 28,
  minimumTouchTarget: 44,
  removeActionWidth: 96,
});

const lightPalette = Object.freeze({
  background: "#FFFFFF",
  error: "#D70015",
  label: "#000000",
  remove: "#FF3B30",
  removePressed: "#D72D24",
  secondaryLabel: "#5C5C60",
  selectedBackground: "#E5E5EA",
  separator: "rgba(60, 60, 67, 0.29)",
});

const darkPalette = Object.freeze({
  background: "#18181B",
  error: "#FF6961",
  label: "#FFFFFF",
  remove: "#FF453A",
  removePressed: "#C9342C",
  secondaryLabel: "#AEAEB2",
  selectedBackground: "#2C2C2E",
  separator: "rgba(84, 84, 88, 0.65)",
});

export type MobileSwipeRemoveRowProps = Readonly<{
  accessibilityRole?: AccessibilityRole;
  accessibilityHint: string;
  accessibilityState?: AccessibilityState;
  accessory?: ReactNode;
  cancelLabel: string;
  confirmationMessage: string;
  confirmationTitle: string;
  detail?: string;
  disabled?: boolean;
  entry: MobileRemovableNavigationEntry;
  failureMessage: string;
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
  onRemoveNavigationEntry: (entry: MobileRemovableNavigationEntry) => void | Promise<void>;
  pendingLabel: string;
  removeLabel: string;
  separator?: boolean;
  testID?: string;
  trailing?: ReactNode;
}>;

export function MobileSwipeRemoveRow({
  accessibilityRole = "button",
  accessibilityHint,
  accessibilityState,
  accessory,
  cancelLabel,
  confirmationMessage,
  confirmationTitle,
  detail,
  disabled = false,
  entry,
  failureMessage,
  icon,
  label,
  onPress,
  onRemoveNavigationEntry,
  pendingLabel,
  removeLabel,
  separator = true,
  testID,
  trailing,
}: MobileSwipeRemoveRowProps) {
  const palette = useColorScheme() === "dark" ? darkPalette : lightPalette;
  const translateX = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const callbackRef = useRef(onRemoveNavigationEntry);
  callbackRef.current = onRemoveNavigationEntry;
  const gateRef = useRef<MobileRemovalGate | null>(null);
  if (gateRef.current === null) {
    gateRef.current = createMobileRemovalGate((requestedEntry) => callbackRef.current(requestedEntry));
  }
  const gate = gateRef.current;
  const selected = accessibilityState?.selected === true;
  const rowDisabled = disabled || pending;

  const animateTo = useCallback((toValue: number) => {
    setRevealed(toValue < 0);
    Animated.spring(translateX, {
      damping: 24,
      mass: 0.8,
      stiffness: 260,
      toValue,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => (
      !rowDisabled
      && (revealed || gesture.dx < -6)
      && Math.abs(gesture.dx) > Math.abs(gesture.dy)
    ),
    onPanResponderMove: (_event, gesture) => {
      const start = revealed ? -metrics.removeActionWidth : 0;
      translateX.setValue(Math.max(-metrics.removeActionWidth, Math.min(0, start + gesture.dx)));
    },
    onPanResponderRelease: (_event, gesture) => {
      const start = revealed ? -metrics.removeActionWidth : 0;
      const finalOffset = start + gesture.dx;
      const shouldReveal = gesture.vx < -0.5
        || (gesture.vx <= 0.5 && finalOffset <= -(metrics.removeActionWidth * 0.4));
      animateTo(shouldReveal ? -metrics.removeActionWidth : 0);
    },
    onPanResponderTerminate: () => animateTo(0),
  }), [animateTo, revealed, rowDisabled, translateX]);

  const executeRemoval = useCallback((token: MobileRemovalToken) => {
    const execution = gate.confirm(token, entry);
    if (!execution.accepted) return;
    setError(null);
    setPending(true);
    void execution.completion.then(
      () => {
        if (!gate.complete(token)) return;
        setPending(false);
        animateTo(0);
      },
      () => {
        if (!gate.complete(token)) return;
        setPending(false);
        setError(failureMessage);
        animateTo(0);
      },
    );
  }, [animateTo, entry, failureMessage, gate]);

  const openConfirmation = useCallback(() => {
    if (rowDisabled) return;
    const token = gate.request();
    if (token === null) return;
    const cancel = () => {
      if (gate.cancel(token)) animateTo(0);
    };
    Alert.alert(confirmationTitle, confirmationMessage, [
      { text: cancelLabel, style: "cancel", onPress: cancel },
      { text: removeLabel, style: "destructive", onPress: () => executeRemoval(token) },
    ], {
      cancelable: true,
      onDismiss: cancel,
    });
  }, [
    animateTo,
    cancelLabel,
    confirmationMessage,
    confirmationTitle,
    executeRemoval,
    gate,
    removeLabel,
    rowDisabled,
  ]);

  const handleAccessibilityAction = useCallback((event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "remove") openConfirmation();
  }, [openConfirmation]);

  const outcome = pending ? pendingLabel : error;
  const resolvedAccessibilityLabel = [label, detail, outcome].filter(Boolean).join(", ");
  const resolvedAccessibilityState = {
    ...accessibilityState,
    busy: pending,
    disabled: rowDisabled,
    selected,
  };

  return (
    <View style={styles.container} testID={testID}>
      <View
        style={[styles.removeActionLayer, { backgroundColor: palette.remove }]}
        pointerEvents={revealed && !rowDisabled ? "auto" : "none"}
        accessibilityElementsHidden={!revealed}
        importantForAccessibility={revealed ? "yes" : "no-hide-descendants"}
      >
        <Pressable
          accessibilityLabel={`${removeLabel}, ${label}`}
          accessibilityRole="button"
          accessibilityState={resolvedAccessibilityState}
          disabled={rowDisabled}
          onPress={openConfirmation}
          style={({ pressed }) => [styles.removeAction, pressed && { backgroundColor: palette.removePressed }]}
        >
          <Text style={styles.removeLabel} allowFontScaling>{removeLabel}</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.foreground,
          { backgroundColor: selected ? palette.selectedBackground : palette.background, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.foregroundRow}>
          <Pressable
            accessible
            accessibilityActions={[{ name: "remove", label: removeLabel }]}
            accessibilityHint={accessibilityHint}
            accessibilityLabel={resolvedAccessibilityLabel}
            accessibilityRole={accessibilityRole}
            accessibilityState={resolvedAccessibilityState}
            delayLongPress={450}
            disabled={rowDisabled}
            onAccessibilityAction={handleAccessibilityAction}
            onLongPress={openConfirmation}
            onPress={onPress}
            style={({ pressed }) => [styles.foregroundPressable, pressed && styles.foregroundPressed]}
          >
            <View
              style={styles.iconColumn}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {icon}
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.label, { color: palette.label }]} allowFontScaling>{label}</Text>
              {detail ? (
                <Text style={[styles.detail, { color: palette.secondaryLabel }]} allowFontScaling>{detail}</Text>
              ) : null}
              {outcome ? (
                <Text
                  style={[styles.outcome, { color: error ? palette.error : palette.secondaryLabel }]}
                  accessibilityLiveRegion="polite"
                  accessibilityRole={error ? "alert" : "text"}
                  allowFontScaling
                >
                  {outcome}
                </Text>
              ) : null}
            </View>
            <View
              style={styles.trailingColumn}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {pending ? <ActivityIndicator color={palette.secondaryLabel} size="small" /> : trailing}
            </View>
          </Pressable>
          {accessory ? <View style={styles.accessoryColumn}>{accessory}</View> : null}
        </View>
        {separator ? <View style={[styles.separator, { backgroundColor: palette.separator }]} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: metrics.minimumTouchTarget,
    overflow: "hidden",
  },
  removeActionLayer: {
    alignItems: "flex-end",
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  removeAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: metrics.minimumTouchTarget,
    width: metrics.removeActionWidth,
  },
  removeLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  foreground: {
    alignSelf: "stretch",
  },
  foregroundRow: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  foregroundPressable: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minHeight: metrics.minimumTouchTarget,
    paddingHorizontal: metrics.horizontalInset,
    paddingVertical: 10,
  },
  foregroundPressed: {
    backgroundColor: "rgba(127, 127, 127, 0.16)",
  },
  iconColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: metrics.columnGap,
    width: metrics.iconColumnWidth,
  },
  textColumn: {
    flex: 1,
    flexShrink: 1,
  },
  label: {
    fontSize: 17,
  },
  detail: {
    flexShrink: 1,
    fontSize: 15,
    marginTop: 3,
  },
  outcome: {
    flexShrink: 1,
    fontSize: 13,
    marginTop: 4,
  },
  trailingColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: metrics.columnGap,
  },
  accessoryColumn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: metrics.minimumTouchTarget,
    minWidth: metrics.minimumTouchTarget,
    paddingRight: metrics.horizontalInset,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: metrics.horizontalInset + metrics.iconColumnWidth + metrics.columnGap,
    marginRight: metrics.horizontalInset,
  },
});
