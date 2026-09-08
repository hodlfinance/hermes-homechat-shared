import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "./mobile-palette";
import type { AppLocale } from "../core/index";
import { secureSecretEntryCopy, type SecureSecretEntryRequest } from "../core/secure-secret-entry-view";

export function SecureSecretEntryForm({
  locale = "en",
  request,
  busy,
  onSave,
  onCancel,
}: {
  locale?: AppLocale;
  request: SecureSecretEntryRequest;
  busy: boolean;
  onSave: (value: string) => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const copy = secureSecretEntryCopy(locale);
  const [value, setValue] = useState("");
  const valueRef = useRef("");

  function clearValue() {
    valueRef.current = "";
    setValue("");
  }

  useEffect(() => () => {
    valueRef.current = "";
  }, []);

  async function save() {
    const pendingValue = valueRef.current;
    if (busy || !pendingValue) return;
    try {
      await onSave(pendingValue);
    } finally {
      clearValue();
    }
  }

  async function cancel() {
    if (busy) return;
    clearValue();
    await onCancel();
  }

  return (
    <View style={styles.surface} accessibilityLabel={copy.title}>
      <Text style={styles.heading}>{request.label}</Text>
      <Text style={styles.purpose}>{request.purpose}</Text>
      <Text style={styles.explanation}>
        {copy.explanation}
      </Text>
      <TextInput
        accessibilityLabel={copy.value}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        onChangeText={(next) => {
          valueRef.current = next;
          setValue(next);
        }}
        placeholder={copy.placeholder}
        secureTextEntry
        style={styles.input}
        value={value}
      />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy || !value}
          onPress={() => void save()}
          style={({ pressed }) => [styles.primary, (pressed || busy || !value) && styles.dimmed]}
        >
          <Text style={styles.primaryText}>{busy ? copy.saving : copy.save}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void cancel()}
          style={({ pressed }) => [styles.secondary, (pressed || busy) && styles.dimmed]}
        >
          <Text style={styles.secondaryText}>{copy.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  surface: { gap: 10 },
  heading: { color: palette.ink, fontSize: 17, fontWeight: "700" },
  purpose: { color: palette.text, fontSize: 14, lineHeight: 20 },
  explanation: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  actions: { flexDirection: "row", gap: 10 },
  primary: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryText: { color: palette.accentText, fontWeight: "700" },
  secondary: {
    alignItems: "center",
    borderColor: palette.line,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryText: { color: palette.text, fontWeight: "700" },
  dimmed: { opacity: 0.55 },
});
