import { useRef, useState, type ReactNode } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View, type ColorValue } from "react-native";
import { createMobileRemovalGate, type MobileRemovableNavigationEntry } from "./mobile-swipe-remove-row";

/** HPD-619: only removes a bookmark; the caller retains ownership of its content. */
export function MobilePageMenuRow({
  entry, label, icon, color, onPress, onRemove, copy,
}: {
  entry: MobileRemovableNavigationEntry;
  label: string;
  icon: ReactNode;
  color: ColorValue;
  onPress: () => void;
  onRemove: (entry: MobileRemovableNavigationEntry) => Promise<void>;
  copy: { remove: string; cancel: string; title: string; message: string; failed: string; pending: string };
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
      ActionSheetIOS.showActionSheetWithOptions({
        title: label, options: [copy.cancel, copy.remove], cancelButtonIndex: 0, destructiveButtonIndex: 1,
      }, (index) => {
        actionMenuOpen.current = false;
        if (index === 1) confirmRemoval();
      });
    } else {
      actionMenuOpen.current = false;
      confirmRemoval();
    }
  }

  return <View>
    <View style={styles.row}>
      <Pressable style={styles.open} onPress={onPress} onLongPress={openActions} disabled={pending}
        accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: pending, busy: pending }}
        accessibilityActions={[{ name: "remove", label: copy.remove }]}
        onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === "remove") openActions(); }}>
        {icon}<Text style={[styles.label, { color }]}>{label}</Text>
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

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  open: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  label: { flex: 1, fontSize: 17 },
  more: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
