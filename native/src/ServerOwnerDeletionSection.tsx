import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { RotateCw, Square, SquareCheck, Trash2 } from "lucide-react-native";
import { apiErrorCode } from "../core/api-client";
import type { AppLocale } from "../core/index";
import type { ServerOwnerDeletionConfirmation, ServerOwnerDeletionStatus } from "../core/types";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { useMobilePalette } from "./mobile-palette-context";
import {
  SERVER_OWNER_DELETION_HIDDEN_CODES,
  SERVER_OWNER_DELETION_POLL_MS,
  newServerOwnerDeletionOperationId,
  serverOwnerDeletionConfirmed,
  serverOwnerDeletionCopy,
  serverOwnerDeletionErrorMessage,
  serverOwnerDeletionModel,
} from "./server-owner-deletion";

/** The two calls the section needs; the app passes its api client. */
export interface ServerOwnerDeletionClient {
  serverOwnerDeletion: () => Promise<ServerOwnerDeletionStatus>;
  requestServerOwnerDeletion: (body: ServerOwnerDeletionConfirmation) => Promise<ServerOwnerDeletionStatus>;
}

/**
 * HPD-1027 S6a: the server Owner deletes their own server. Shown only while the Plane offers it
 * (server-identity serverDeletionAvailable). First what goes and what stays, with the hint to
 * download the full archive before; then the server id typed again and the irreversibility
 * acknowledged; then the request's state and the host receipt.
 */
export function ServerOwnerDeletionSection({
  client,
  locale,
  formatDate,
}: {
  client: ServerOwnerDeletionClient;
  locale: AppLocale;
  formatDate: (iso: string) => string;
}) {
  const palette = useMobilePalette();
  const copy = serverOwnerDeletionCopy(locale);
  const [status, setStatus] = useState<ServerOwnerDeletionStatus | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [typed, setTyped] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One operation id per confirmation: pressing again after a lost answer repeats, never doubles.
  const operationId = useRef(newServerOwnerDeletionOperationId());

  const load = useCallback(async () => {
    try {
      setStatus(await client.serverOwnerDeletion());
      setLoadError(false);
    } catch (err) {
      if (SERVER_OWNER_DELETION_HIDDEN_CODES.has(apiErrorCode(err) ?? "")) setHidden(true);
      else setLoadError(true);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const model = serverOwnerDeletionModel(status, copy, formatDate);

  useEffect(() => {
    if (!model.poll) return;
    const timer = setInterval(() => void load(), SERVER_OWNER_DELETION_POLL_MS);
    return () => clearInterval(timer);
  }, [model.poll, load]);

  useEffect(() => {
    // A failed request is offered again with a fresh operation id.
    if (model.phase === "failed") operationId.current = newServerOwnerDeletionOperationId();
  }, [model.phase, status?.request?.operationId]);

  const serverId = status?.serverId ?? "";
  const confirmed = serverOwnerDeletionConfirmed(serverId, typed, acknowledged);

  const submit = async () => {
    if (busy || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      setStatus(await client.requestServerOwnerDeletion({
        operationId: operationId.current,
        confirmServerId: typed.trim(),
        acknowledgeIrreversible: true,
      }));
      setTyped("");
      setAcknowledged(false);
    } catch (err) {
      const code = apiErrorCode(err);
      if (SERVER_OWNER_DELETION_HIDDEN_CODES.has(code ?? "")) setHidden(true);
      setError(serverOwnerDeletionErrorMessage(code, copy));
      void load();
    } finally {
      setBusy(false);
    }
  };

  if (hidden) return null;
  const toneColor = model.tone === "teal" ? palette.teal : model.tone === "amber" ? palette.amber
    : model.tone === "coral" ? palette.coral : palette.muted;

  return (
    <MobileSystemSection title={copy.title} footer={model.showForm ? copy.separate : undefined} testID="server-owner-deletion-section">
      {loadError || model.status ? (
        <View style={styles.block}>
          <Text style={[styles.status, { color: loadError ? palette.coral : toneColor }]} accessibilityLiveRegion="polite" allowFontScaling>
            {loadError ? copy.loadFailed : model.status}
          </Text>
          {model.receipt.map((line) => (
            <Text key={line} style={[styles.body, { color: palette.text }]} allowFontScaling>{line}</Text>
          ))}
        </View>
      ) : null}
      {loadError ? (
        <MobileSystemRow
          accessibilityRole="button"
          icon={<RotateCw size={17} color={palette.teal} />}
          label={copy.retry}
          onPress={() => void load()}
          testID="server-owner-deletion-retry"
        />
      ) : null}
      {model.showForm && status ? (
        <View style={styles.block}>
          <Text style={[styles.exportFirst, { color: palette.amber, backgroundColor: palette.amberSoft }]} allowFontScaling>
            {copy.exportFirst}
          </Text>
          <Text style={[styles.body, { color: palette.text }]} allowFontScaling>{copy.intro}</Text>
          <Text style={[styles.heading, { color: palette.ink }]} allowFontScaling>{copy.deletedHeading}</Text>
          {model.deleted.map((item) => (
            <Text key={item.key} style={[styles.body, { color: palette.text }]} allowFontScaling>{`– ${item.label}`}</Text>
          ))}
          <Text style={[styles.heading, { color: palette.ink }]} allowFontScaling>{copy.keptHeading}</Text>
          {model.kept.map((item) => (
            <Text key={item.key} style={[styles.body, { color: palette.text }]} allowFontScaling>{`– ${item.label}`}</Text>
          ))}
          <Text style={[styles.hint, { color: palette.muted }]} allowFontScaling>{copy.offHost}</Text>
          <Text style={[styles.heading, { color: palette.ink }]} allowFontScaling>{copy.serverIdLabel}</Text>
          <Text style={[styles.mono, { color: palette.text }]} selectable allowFontScaling testID="server-owner-deletion-server-id">{serverId}</Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={copy.confirmLabel}
            placeholderTextColor={palette.muted}
            editable={!busy}
            accessibilityLabel={copy.confirmLabel}
            style={[styles.input, { borderColor: palette.lineStrong, backgroundColor: palette.surface, color: palette.text }]}
            testID="server-owner-deletion-confirm-input"
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged, disabled: busy }}
            accessibilityLabel={copy.acknowledge}
            disabled={busy}
            onPress={() => setAcknowledged((value) => !value)}
            style={styles.checkRow}
            testID="server-owner-deletion-acknowledge"
          >
            {acknowledged ? <SquareCheck size={20} color={palette.coral} /> : <Square size={20} color={palette.muted} />}
            <Text style={[styles.body, styles.checkText, { color: palette.text }]} allowFontScaling>{copy.acknowledge}</Text>
          </Pressable>
        </View>
      ) : null}
      {model.showForm && status ? (
        <MobileSystemRow
          accessibilityRole="button"
          disabled={!confirmed}
          error={error}
          icon={<Trash2 size={17} color={palette.coral} />}
          label={busy ? copy.submitting : copy.submit}
          onPress={() => void submit()}
          pending={busy}
          testID="server-owner-deletion-submit"
        />
      ) : null}
    </MobileSystemSection>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 12,
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
  },
  exportFirst: {
    borderRadius: 10,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heading: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  mono: {
    fontFamily: "Menlo",
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: "Menlo",
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  checkText: {
    flex: 1,
  },
});
