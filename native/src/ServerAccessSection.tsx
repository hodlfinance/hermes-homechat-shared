import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AlertTriangle, KeyRound, Server, Trash2 } from "lucide-react-native";
import { apiErrorCode } from "../core/api-client";
import type { AppLocale } from "../core/index";
import type { ServerAccessView, ServerOwnerSshKeyListing } from "../core/types";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { useMobilePalette } from "./mobile-palette-context";
import {
  looksLikePrivateKey,
  serverAccessCopy,
  serverAccessErrorMessage,
  serverAccessRows,
  serverBlockingRows,
  serverAccessSwitchedOff,
  serverAccessStatus,
  serverHermesSwitchedOff,
} from "./server-access";

/** The four calls the screen needs; the app passes its api client. */
export interface ServerAccessClient {
  serverOwnerSshKeys: () => Promise<ServerOwnerSshKeyListing>;
  addServerOwnerSshKey: (body: { publicKey: string; label?: string }) => Promise<ServerOwnerSshKeyListing>;
  revokeServerOwnerSshKey: (keyId: string) => Promise<ServerOwnerSshKeyListing>;
  serverAccess: () => Promise<ServerAccessView>;
  removeServerBlockingPath: (path: string) => Promise<unknown>;
}

/**
 * HPD-1027 S4: the server Owner's SSH keys and server facts. Shown only to the
 * Owner (server-identity `serverOwner`); the Plane refuses everyone else.
 */
export function ServerAccessSection({
  client,
  locale,
  formatDate,
}: {
  client: ServerAccessClient;
  locale: AppLocale;
  formatDate: (iso: string) => string;
}) {
  const palette = useMobilePalette();
  const copy = serverAccessCopy(locale);
  const [keys, setKeys] = useState<ServerOwnerSshKeyListing | null>(null);
  const [access, setAccess] = useState<ServerAccessView | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<{ id: string; message: string } | null>(null);
  const [removingPath, setRemovingPath] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<{ path: string; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextKeys, nextAccess] = await Promise.all([client.serverOwnerSshKeys(), client.serverAccess()]);
      setKeys(nextKeys);
      setAccess(nextAccess);
      setLoadError(false);
      setLoadErrorCode(null);
    } catch (error) {
      setLoadError(true);
      setLoadErrorCode(apiErrorCode(error));
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const value = publicKey.trim();
    if (!value || adding) return;
    if (looksLikePrivateKey(value)) {
      // Never sent: the field is cleared so the private key does not linger on screen.
      setPublicKey("");
      setAddError(copy.errors.private_key_material!);
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      setKeys(await client.addServerOwnerSshKey({ publicKey: value, ...(label.trim() ? { label: label.trim() } : {}) }));
      setPublicKey("");
      setLabel("");
      void load();
    } catch (error) {
      setAddError(serverAccessErrorMessage(apiErrorCode(error), copy));
    } finally {
      setAdding(false);
    }
  };

  const revoke = async (keyId: string) => {
    if (revokingId) return;
    setRevokingId(keyId);
    setRevokeError(null);
    try {
      setKeys(await client.revokeServerOwnerSshKey(keyId));
      void load();
    } catch (error) {
      setRevokeError({ id: keyId, message: serverAccessErrorMessage(apiErrorCode(error), copy) });
    } finally {
      setRevokingId(null);
    }
  };

  const removeBlocking = async (path: string) => {
    if (removingPath) return;
    setRemovingPath(path);
    setRemoveError(null);
    try {
      await client.removeServerBlockingPath(path);
      void load();
    } catch (error) {
      setRemoveError({ path, message: serverAccessErrorMessage(apiErrorCode(error), copy) });
      void load();
    } finally {
      setRemovingPath(null);
    }
  };

  // Removing deletes a file on the Owner's server for good: ask once, with the exact path.
  const confirmRemoveBlocking = (path: string) => {
    if (removingPath) return;
    Alert.alert(copy.blockingConfirm(path), undefined, [
      { text: copy.blockingConfirmCancel, style: "cancel" },
      { text: copy.blockingRemove, style: "destructive", onPress: () => void removeBlocking(path) },
    ]);
  };

  const blocking = serverBlockingRows(access, copy);
  const status = serverAccessStatus(access, keys, copy);
  const toneColor = status.tone === "teal" ? palette.teal : status.tone === "amber" ? palette.amber : palette.muted;
  const rows = serverAccessRows(access, copy, formatDate);
  const atLimit = keys ? keys.keys.length >= keys.maxKeys : false;

  // Switched off for this workspace: the screen shows nothing at all.
  if (serverAccessSwitchedOff(access, keys, loadErrorCode)) return null;

  return (
    <>
      <MobileSystemSection title={copy.title} footer={copy.intro} testID="server-access-section">
        <View style={styles.notice}>
          <Text style={[styles.status, { color: toneColor }]} accessibilityLiveRegion="polite" allowFontScaling>
            {loadError ? copy.loadFailed : status.text}
          </Text>
          {serverHermesSwitchedOff(access) ? (
            <Text style={[styles.body, { color: palette.text }]} allowFontScaling>{copy.hermesOff}</Text>
          ) : null}
        </View>
        {rows.map((row) => (
          <MobileSystemRow
            key={row.key}
            accessibilityRole="text"
            detail={row.detail}
            disabled
            icon={row.key === "endpoint" ? <Server size={17} color={palette.teal} /> : undefined}
            label={row.label}
            onPress={() => undefined}
            reserveIconSpace={false}
          />
        ))}
      </MobileSystemSection>
      {blocking.length ? (
        <MobileSystemSection title={copy.blockingTitle} footer={copy.blockingIntro} testID="server-access-blocking">
          {blocking.map((row) => (
            <MobileSystemRow
              key={row.path}
              accessibilityHint={copy.blockingRemove}
              detail={row.path}
              disabled={row.pending}
              error={removeError?.path === row.path ? removeError.message : null}
              icon={<AlertTriangle size={17} color={palette.amber} />}
              label={row.reason}
              onPress={() => confirmRemoveBlocking(row.path)}
              pending={removingPath === row.path}
              status={row.pending ? copy.blockingRequested : null}
              trailing={row.pending ? null : <Trash2 size={16} color={palette.muted} />}
            />
          ))}
        </MobileSystemSection>
      ) : null}
      <MobileSystemSection
        title={copy.keysTitle}
        footer={keys && !keys.fullExportEligible ? copy.exportHint : keys ? copy.keyLimit(keys.maxKeys) : undefined}
      >
        {keys && keys.keys.length === 0 ? (
          <View style={styles.notice}>
            <Text style={[styles.body, { color: palette.muted }]} allowFontScaling>{copy.noKeys}</Text>
          </View>
        ) : null}
        {(keys?.keys ?? []).map((key) => (
          <MobileSystemRow
            key={key.id}
            accessibilityHint={copy.revoke}
            detail={`${key.algorithm} · ${key.fingerprintSha256}`}
            error={revokeError?.id === key.id ? revokeError.message : null}
            icon={<KeyRound size={17} color={palette.teal} />}
            label={key.label ?? key.algorithm}
            onPress={() => void revoke(key.id)}
            pending={revokingId === key.id}
            trailing={<Trash2 size={16} color={palette.muted} />}
          />
        ))}
        {!atLimit ? (
          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: palette.ink }]} allowFontScaling>{copy.publicKeyLabel}</Text>
            <TextInput
              accessibilityLabel={copy.publicKeyLabel}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              onChangeText={(value) => {
                setPublicKey(value);
                if (addError) setAddError(null);
              }}
              placeholder={copy.publicKeyPlaceholder}
              placeholderTextColor={palette.muted}
              spellCheck={false}
              style={[styles.input, styles.keyInput, { borderColor: palette.line, color: palette.ink }]}
              value={publicKey}
            />
            <Text style={[styles.fieldLabel, { color: palette.ink }]} allowFontScaling>{copy.keyLabelLabel}</Text>
            <TextInput
              accessibilityLabel={copy.keyLabelLabel}
              maxLength={80}
              onChangeText={setLabel}
              placeholder={copy.keyLabelPlaceholder}
              placeholderTextColor={palette.muted}
              style={[styles.input, { borderColor: palette.line, color: palette.ink }]}
              value={label}
            />
            {addError ? (
              <Text style={[styles.body, { color: palette.coral }]} accessibilityRole="alert" allowFontScaling>{addError}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: adding || !publicKey.trim(), busy: adding }}
              disabled={adding || !publicKey.trim()}
              onPress={() => void add()}
              style={[styles.button, { backgroundColor: palette.accent, opacity: adding || !publicKey.trim() ? 0.5 : 1 }]}
            >
              <Text style={[styles.buttonText, { color: palette.accentText }]} allowFontScaling>{adding ? copy.adding : copy.add}</Text>
            </Pressable>
          </View>
        ) : null}
      </MobileSystemSection>
    </>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: 6,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 12,
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keyInput: {
    fontFamily: "Menlo",
    minHeight: 88,
    textAlignVertical: "top",
  },
  button: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
