import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { CheckSquare, RotateCcw, SlidersHorizontal, Square } from "lucide-react-native";
import type { AppLocale } from "../core/index";
import type { SelfManagedView } from "../core/types";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { useMobilePalette } from "./mobile-palette-context";
import {
  selfManagedCopy,
  selfManagedSectionVisible,
  selfManagedSwitchEnabled,
  selfManagedTurnOnEnabled,
} from "./self-managed";

/** The two calls the section needs; the app passes its api client. */
export interface SelfManagedClient {
  enableSelfManaged: () => Promise<SelfManagedView>;
  restoreHeyDefaults: () => Promise<SelfManagedView>;
}

/**
 * HPD-1196: "Manage model and memory myself" under Account, right after
 * server access (SSH) (Justus, 2026-10-12, 1b). The switch never flips on a
 * tap: it opens a confirmation whose "Turn on" waits for the checkbox.
 * Turning it off is "Restore Hey defaults", also confirmed.
 */
export function SelfManagedSection({
  client,
  locale,
  view,
  onChanged,
}: {
  client: SelfManagedClient;
  locale: AppLocale;
  view: SelfManagedView | null;
  onChanged: (next: SelfManagedView) => void;
}) {
  const palette = useMobilePalette();
  const copy = selfManagedCopy(locale);
  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selfManagedSectionVisible(view)) return null;
  const on = view?.selfManaged === true;
  const enabled = selfManagedSwitchEnabled(view);

  const turnOn = async () => {
    if (!selfManagedTurnOnEnabled(acknowledged, busy)) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await client.enableSelfManaged());
      setConfirming(false);
      setAcknowledged(false);
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await client.restoreHeyDefaults());
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(false);
    }
  };

  const confirmRestore = () => {
    Alert.alert(copy.restore, copy.restoreConfirm, [
      { text: copy.restoreCancel, style: "cancel" },
      { text: copy.restoreAction, style: "destructive", onPress: () => void restore() },
    ]);
  };

  return (
    <>
      <MobileSystemSection
        title={copy.sectionTitle}
        footer={on ? copy.bannerText : enabled ? copy.switchDescription : copy.needsSsh}
        testID="self-managed-section"
      >
        <MobileSystemRow
          accessibilityRole="switch"
          accessibilityState={{ checked: on, disabled: on ? false : !enabled }}
          disabled={on ? busy : !enabled || busy}
          error={error}
          icon={<SlidersHorizontal size={17} color={enabled || on ? palette.teal : palette.muted} />}
          label={copy.switchLabel}
          onPress={() => {
            if (on) confirmRestore();
            else if (enabled) setConfirming(true);
          }}
          pending={busy}
          status={on ? copy.badge : null}
          trailing={
            <Switch
              disabled={on ? busy : !enabled || busy}
              onValueChange={() => (on ? confirmRestore() : setConfirming(true))}
              value={on}
            />
          }
        />
        {on ? (
          <MobileSystemRow
            accessibilityHint={copy.restoreConfirm}
            disabled={busy}
            icon={<RotateCcw size={17} color={palette.teal} />}
            label={copy.restore}
            onPress={confirmRestore}
            testID="self-managed-restore"
          />
        ) : null}
      </MobileSystemSection>
      <Modal animationType="slide" transparent visible={confirming} onRequestClose={() => setConfirming(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.line }]} testID="self-managed-confirm">
            <Text style={[styles.title, { color: palette.ink }]} allowFontScaling>{copy.confirmTitle}</Text>
            <Text style={[styles.body, { color: palette.text }]} allowFontScaling>{copy.confirmBody}</Text>
            {copy.confirmPoints.map((point) => (
              <Text key={point} style={[styles.body, { color: palette.text }]} allowFontScaling>{`• ${point}`}</Text>
            ))}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acknowledged }}
              onPress={() => setAcknowledged((value) => !value)}
              style={styles.checkRow}
            >
              {acknowledged ? <CheckSquare size={20} color={palette.teal} /> : <Square size={20} color={palette.muted} />}
              <Text style={[styles.checkText, { color: palette.ink }]} allowFontScaling>{copy.confirmCheckbox}</Text>
            </Pressable>
            {error ? <Text style={[styles.body, { color: palette.coral }]} accessibilityRole="alert">{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !selfManagedTurnOnEnabled(acknowledged, busy), busy }}
              disabled={!selfManagedTurnOnEnabled(acknowledged, busy)}
              onPress={() => void turnOn()}
              style={[styles.button, { backgroundColor: palette.accent, opacity: selfManagedTurnOnEnabled(acknowledged, busy) ? 1 : 0.5 }]}
              testID="self-managed-turn-on"
            >
              <Text style={[styles.buttonText, { color: palette.accentText }]} allowFontScaling>{copy.confirmTurnOn}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirming(false);
                setAcknowledged(false);
              }}
              style={styles.cancel}
            >
              <Text style={[styles.buttonText, { color: palette.muted }]} allowFontScaling>{copy.confirmCancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingVertical: 8,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
  },
  cancel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
