import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeFinanceActionApproval } from "../host";
export { mobileFinanceActionApprovalCardView } from "./mobile-finance-action-approval-model";
import { mobileFinanceActionApprovalCardView } from "./mobile-finance-action-approval-model";

export function MobileFinanceActionApprovalCard({ approval, busy = false, error = null, onConfirm, onCancel }: {
  approval: NativeFinanceActionApproval; busy?: boolean; error?: string | null; onConfirm(): void; onCancel(): void;
}) {
  const view = mobileFinanceActionApprovalCardView(approval);
  return <View style={styles.card} accessibilityLabel="Finance action approval">
    <Text style={styles.eyebrow}>FIN HERMES</Text>
    <Text style={styles.title}>{view.title || "Review this change"}</Text>
    <Text style={styles.summary}>{view.summary}</Text>
    {view.fields.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}</Text><Text style={styles.value}>{field.value}</Text></View>)}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel" disabled={busy} onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Confirm" disabled={busy} onPress={onConfirm} style={styles.confirm}><Text style={styles.confirmText}>Confirm</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 10, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: "#2AAED0", backgroundColor: "#0E3448" },
  eyebrow: { color: "#2AAED0", fontSize: 12, fontWeight: "700", letterSpacing: 0 }, title: { marginTop: 6, color: "#F5F7FA", fontSize: 19, fontWeight: "700" }, summary: { marginTop: 8, color: "#D3DEE5", fontSize: 15, lineHeight: 21 },
  field: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2A596D" }, label: { color: "#9FB5C1", fontSize: 12, fontWeight: "600" }, value: { marginTop: 2, color: "#F5F7FA", fontSize: 15 }, error: { marginTop: 12, color: "#FF7B7B", fontSize: 14, lineHeight: 20 }, actions: { flexDirection: "row", gap: 10, marginTop: 16 }, cancel: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#163E52" }, confirm: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#2AAED0" }, cancelText: { color: "#D3DEE5", fontSize: 16, fontWeight: "600" }, confirmText: { color: "#06202E", fontSize: 16, fontWeight: "700" },
});
