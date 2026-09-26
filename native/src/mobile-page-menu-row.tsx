import { useRef, useState, type ReactNode } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View, type ColorValue } from "react-native";
import { createMobileRemovalGate, type MobileRemovableNavigationEntry } from "./mobile-swipe-remove-row";
import { mobileSystemSurfaceMetrics } from "./mobile-system-surface";

type MobileEntryActionCopy = { remove: string; cancel: string; title: string; message: string; failed: string; pending: string };
type MobileEntryExtraAction = { label: string; onPress: () => void };

/**
 * The action sheet of one removable entry: the optional extra entry (HPD-898)
 * above the removal, and the removal behind its confirmation (HPD-619). Shared
 * by a Page row in the menu and, since HPD-924, by the top-right options
 * button of an open automation thread.
 */
function useMobileEntryActions({
  entry, label, onRemove, copy, extraAction,
}: {
  entry: MobileRemovableNavigationEntry;
  label: string;
  onRemove: (entry: MobileRemovableNavigationEntry) => Promise<void>;
  copy: MobileEntryActionCopy;
  extraAction?: MobileEntryExtraAction;
}) {
  const callback = useRef(onRemove);
  callback.current = onRemove;
  const gate = useRef(createMobileRemovalGate((value) => callback.current(value))).current;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const actionMenuOpen = useRef(false);

  function confirmRemoval() {
    const token = gate.request();
    if (!token) return;
    const cancel = () => { gate.cancel(token); };
    Alert.alert(copy.title, copy.message, [
      { text: copy.cancel, style: "cancel", onPress: cancel },
      { text: copy.remove, style: "destructive", onPress: () => {
        const result = gate.confirm(token, entry);
        if (!result.accepted) return;
        setPending(true);
        setError(false);
        void result.completion.then(() => {
          gate.complete(token);
          setPending(false);
        }, () => {
          gate.complete(token);
          setPending(false);
          setError(true);
        });
      } },
    ], { cancelable: true, onDismiss: cancel });
  }

  function openActions() {
    if (pending || actionMenuOpen.current) return;
    actionMenuOpen.current = true;
    if (Platform.OS === "ios") {
      const options = extraAction ? [copy.cancel, extraAction.label, copy.remove] : [copy.cancel, copy.remove];
      const removeIndex = options.length - 1;
      ActionSheetIOS.showActionSheetWithOptions({
        title: label, options, cancelButtonIndex: 0, destructiveButtonIndex: removeIndex,
      }, (index) => {
        actionMenuOpen.current = false;
        if (extraAction && index === 1) extraAction.onPress();
        else if (index === removeIndex) confirmRemoval();
      });
    } else if (extraAction) {
      actionMenuOpen.current = false;
      Alert.alert(label, undefined, [
        { text: copy.cancel, style: "cancel" },
        { text: extraAction.label, onPress: extraAction.onPress },
        { text: copy.remove, style: "destructive", onPress: confirmRemoval },
      ], { cancelable: true });
    } else {
      actionMenuOpen.current = false;
      confirmRemoval();
    }
  }

  return { pending, error, openActions };
}

/** HPD-619: only removes a bookmark; the caller retains ownership of its content. */
export function MobilePageMenuRow({
  entry, label, icon, color, onPress, onRemove, copy, extraAction,
}: {
  entry: MobileRemovableNavigationEntry;
  label: string;
  icon: ReactNode;
  color: ColorValue;
  onPress: () => void;
  onRemove: (entry: MobileRemovableNavigationEntry) => Promise<void>;
  copy: MobileEntryActionCopy;
  /** HPD-898: one more entry in the row's menu, above the removal. */
  extraAction?: MobileEntryExtraAction;
}) {
  const { pending, error, openActions } = useMobileEntryActions({ entry, label, onRemove, copy, extraAction });

  return <View>
    <View style={styles.row}>
      <Pressable style={styles.open} onPress={onPress} onLongPress={openActions} disabled={pending}
        accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: pending, busy: pending }}
        accessibilityActions={extraAction
          ? [{ name: "extra", label: extraAction.label }, { name: "remove", label: copy.remove }]
          : [{ name: "remove", label: copy.remove }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "remove") openActions();
          else if (event.nativeEvent.actionName === "extra") extraAction?.onPress();
        }}>
        <View style={styles.iconColumn} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {icon}
        </View>
        <Text style={[styles.label, { color }]} allowFontScaling>{label}</Text>
      </Pressable>
      <Pressable style={styles.more} onPress={openActions} disabled={pending}
        accessibilityRole="button" accessibilityLabel={`${copy.remove}: ${label}`}>
        <Text style={{ color, fontSize: 22 }}>···</Text>
      </Pressable>
    </View>
    {pending || error ? <Text accessibilityLiveRegion="polite" style={{ color }}>
      {pending ? copy.pending : copy.failed}
    </Text> : null}
  </View>;
}

/**
 * HPD-924: the options of an open automation thread, top right in its header
 * where Help stands in Home. The same sheet the menu row used to open: View
 * all automations, then Delete behind its confirmation.
 */
export function MobileThreadOptionsButton({
  entry, title, accessibilityLabel, icon, style, pressedStyle, color, onRemove, copy, extraAction,
}: {
  entry: MobileRemovableNavigationEntry;
  title: string;
  accessibilityLabel: string;
  icon: ReactNode;
  style: object;
  pressedStyle?: object;
  color: ColorValue;
  onRemove: (entry: MobileRemovableNavigationEntry) => Promise<void>;
  copy: MobileEntryActionCopy;
  extraAction?: MobileEntryExtraAction;
}) {
  const { pending, error, openActions } = useMobileEntryActions({ entry, label: title, onRemove, copy, extraAction });
  return <View>
    <Pressable style={({ pressed }) => [style, pressed && pressedStyle]} onPress={openActions} disabled={pending}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      accessibilityHint={error ? copy.failed : undefined}
      accessibilityState={{ disabled: pending, busy: pending }}>
      {icon}
    </Pressable>
    {error ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.headerError, { color }]}>{copy.failed}</Text> : null}
  </View>;
}

// HPD-924: the same blue in Light and Dark (white digits, contrast 4.9:1).
// The palette's accent turns violet in Dark, so the badge keeps its own blue.
const unreadBadgeBlue = "#1f6fd1";

/** HPD-924: the unread count beside a thread's name, capped at 99+. The row carries the spoken count. */
export function MobileUnreadBadge({ label }: { label: string }) {
  return <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Text style={styles.badgeText} allowFontScaling maxFontSizeMultiplier={1.6}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: unreadBadgeBlue,
  },
  badgeText: { color: "#ffffff", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  headerError: { position: "absolute", right: 0, top: "100%", fontSize: 12, width: 180, textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center" },
  open: {
    flex: 1,
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 10,
  },
  iconColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: mobileSystemSurfaceMetrics.columnGap,
    width: mobileSystemSurfaceMetrics.iconColumnWidth,
  },
  label: { flex: 1, fontSize: 17 },
  more: {
    minWidth: mobileSystemSurfaceMetrics.minimumTouchTarget,
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
