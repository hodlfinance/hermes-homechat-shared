import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import {
  createApiClient,
  heyAccountDeletionConfirmationPhrase,
  heyAccountDeletionProductRealm,
} from "../core/index";
import { palette } from "./mobile-palette";
import { accountDeletionPhraseMatches } from "./account-deletion";

export type AccountDeletionSectionCopy = {
  confirmTitle: string;
  confirmBody: string;
  keep: string;
  delete: string;
  title: string;
  description: string;
  credentialPlaceholder: string;
  credentialLabel: string;
  recentSignInHint: string;
  confirmationLabel: string;
  deleting: string;
  reauthenticationError: string;
  confirmationError: string;
  genericError: string;
  deleted: string;
  purged: string;
  purgePending: string;
  subscriptionKept: string;
};

/**
 * Product-local Hey account deletion, kept in its own file on purpose.
 *
 * Apple requires in-app account deletion for any app that offers account creation, so this
 * control is a submission gate. It lives here rather than inline in `MobileApp.tsx` so that
 * it costs that screen exactly one import and one element — HPD-117 is fixing a
 * launch-blocking crash in the same file and a large inline block would collide with it.
 */
export function AccountDeletionSection({
  accountId,
  api,
  busy,
  onDeleted,
  copy,
  locale,
}: {
  accountId: string;
  api: ReturnType<typeof createApiClient>;
  busy: boolean;
  onDeleted: (message: string) => Promise<void> | void;
  copy: AccountDeletionSectionCopy;
  locale: string;
}) {
  const [credential, setCredential] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const phraseMatches = accountDeletionPhraseMatches(confirmation);
  const disabled = busy || deleting || !phraseMatches;

  async function runDeletion() {
    const authority = { accountId, productRealm: heyAccountDeletionProductRealm } as const;
    let intentId: string | null = null;
    setDeleting(true);
    setNotice(null);
    try {
      const intent = await api.prepareHeyAccountDeletion(authority);
      intentId = intent.id;
      const reauthentication = await api.reauthenticateHeyAccountDeletion({
        ...authority,
        ...(credential.trim() ? { credential: credential.trim() } : {}),
      });
      const receipt = await api.confirmHeyAccountDeletion(intent.id, {
        ...authority,
        confirmationPhrase: heyAccountDeletionConfirmationPhrase,
        reauthenticationToken: reauthentication.reauthenticationToken,
      });
      setCredential("");
      setConfirmation("");
      const purgeSummary = receipt.purge
        ? copy.purged
        : copy.purgePending.replace("{date}", localizedDate(receipt.activeDataPurgeDueAt, locale));
      await onDeleted(`${copy.deleted.replace("{receipt}", receipt.receiptId)} ${purgeSummary} ${copy.subscriptionKept}`);
    } catch (error) {
      // Leave no half-started request behind: an abandoned pending intent would block the
      // next attempt, since only one can be pending per account.
      if (intentId) await api.cancelHeyAccountDeletion(intentId, authority).catch(() => undefined);
      const raw = error instanceof Error ? error.message : "";
      setNotice(raw.includes("reauthentication")
        ? copy.reauthenticationError
        : raw.includes("confirmation")
          ? copy.confirmationError.replace("{phrase}", heyAccountDeletionConfirmationPhrase)
          : copy.genericError);
    } finally {
      setDeleting(false);
    }
  }

  function confirmThenDelete() {
    if (disabled) return;
    Alert.alert(
      copy.confirmTitle,
      copy.confirmBody,
      [
        { style: "cancel", text: copy.keep },
        { style: "destructive", text: copy.delete, onPress: () => void runDeletion() },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{copy.title}</Text>
      <Text style={styles.muted}>{copy.description}</Text>
      <TextInput
        value={credential}
        onChangeText={setCredential}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={copy.credentialPlaceholder}
        placeholderTextColor={palette.muted}
        editable={!deleting}
        style={styles.input}
        accessibilityLabel={copy.credentialLabel}
      />
      <Text style={styles.hint}>{copy.recentSignInHint}</Text>
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={heyAccountDeletionConfirmationPhrase}
        placeholderTextColor={palette.muted}
        editable={!deleting}
        style={styles.input}
        accessibilityLabel={copy.confirmationLabel.replace("{phrase}", heyAccountDeletionConfirmationPhrase)}
      />
      <Pressable
        style={[styles.dangerButton, disabled && styles.disabledButton]}
        onPress={confirmThenDelete}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={copy.confirmTitle}
      >
        {deleting ? (
          <ActivityIndicator color={palette.coral} />
        ) : (
          <Trash2 size={17} color={palette.coral} />
        )}
        <Text style={styles.dangerButtonText}>{deleting ? copy.deleting : copy.title}</Text>
      </Pressable>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );
}

function localizedDate(value: string, locale: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(locale);
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 14,
    marginTop: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
  },
  muted: {
    color: palette.muted,
    fontSize: 13,
  },
  hint: {
    color: palette.muted,
    fontSize: 12,
    marginTop: -4,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  dangerButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: palette.coralSoft,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dangerButtonText: {
    color: palette.coral,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.45,
  },
  notice: {
    color: palette.coral,
    fontSize: 13,
  },
});
