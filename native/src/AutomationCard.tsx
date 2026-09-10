import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppLocale } from "../core/index";
import { palette } from "./mobile-palette";
import { mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { automationScheduleSentence, type AutomationCardModel } from "./mobile-automation-card";

/**
 * The one automation card (HPD-463).
 *
 * There is no second card. What the customer wrote and what shipped with the
 * product are drawn by this component from the same model, so the only visible
 * differences are the ones the model marks: a Standard mark, Reset and a
 * version history on a shipped automation, Edit on one the customer wrote.
 *
 * No cron expression reaches this file: the schedule arrives as a rhythm and
 * leaves as a sentence.
 */
export type AutomationCardCopy = Readonly<{
  active: string;
  paused: string;
  unknown: string;
  next: string;
  noNext: string;
  delivery: string;
  chat: string;
  chatAbout: string;
  edit: string;
  standard: string;
  reset: string;
  resetConfirm: string;
  pause: string;
  resume: string;
  delete: string;
  deleteConfirmTitle: string;
  deleteConfirmMessage: string;
  deleteConfirm: string;
  deleteCancel: string;
  versions: string;
  versionsHide: string;
  activeVersion: string;
  restore: string;
  restoreConfirm: string;
  reinstall: string;
  reinstallConfirm: string;
  schedule: Parameters<typeof automationScheduleSentence>[3];
}>;

function ActionButton({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.disabled : null]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function AutomationCard({
  automation,
  copy,
  locale,
  timeZone,
  busy = false,
  onChat,
  onEdit,
  onReset,
  onRestoreVersion,
  onReinstall,
  onSetEnabled,
  onDelete,
}: {
  automation: AutomationCardModel;
  copy: AutomationCardCopy;
  locale: AppLocale;
  timeZone: string | null;
  busy?: boolean;
  onChat: (automation: AutomationCardModel) => void;
  onEdit: (automation: AutomationCardModel) => void;
  onReset: (automation: AutomationCardModel) => void;
  onRestoreVersion: (automation: AutomationCardModel, version: number) => void;
  onReinstall: (automation: AutomationCardModel) => void;
  onSetEnabled: (automation: AutomationCardModel, enabled: boolean) => void;
  onDelete: (automation: AutomationCardModel) => void;
}) {
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingReinstall, setConfirmingReinstall] = useState(false);
  const [confirmingVersion, setConfirmingVersion] = useState<number | null>(null);

  /**
   * Deleting an automation cannot be undone, and the customer is one tap away
   * from it. The two-tap pill the other controls use is not enough here: the
   * question is asked in the system's own dialog, it names the automation, and
   * it says what cannot be taken back.
   */
  const askToDelete = () => {
    Alert.alert(
      copy.deleteConfirmTitle,
      copy.deleteConfirmMessage.replace("{title}", automation.title),
      [
        { text: copy.deleteCancel, style: "cancel" },
        { text: copy.deleteConfirm, style: "destructive", onPress: () => onDelete(automation) },
      ],
      { cancelable: true },
    );
  };

  const statusWord = automation.status === "active" ? copy.active : automation.status === "paused" ? copy.paused : copy.unknown;
  const schedule = automationScheduleSentence(automation.rhythm, timeZone, locale, copy.schedule);
  const nextRun = automation.nextRunAt
    ? `${copy.next}: ${new Date(automation.nextRunAt).toLocaleString(locale)}`
    : copy.noNext;

  return (
    <View accessibilityLabel={automation.title} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle} numberOfLines={2}>{automation.title}</Text>
        {automation.shipped ? (
          <View style={styles.standardMark}><Text style={styles.standardMarkText}>{copy.standard}</Text></View>
        ) : null}
      </View>

      <Text style={styles.summary}>{`${statusWord} · ${schedule}`}</Text>
      {automation.purpose ? <Text numberOfLines={3} style={styles.muted}>{automation.purpose}</Text> : null}
      <Text style={styles.muted}>
        {[nextRun, automation.delivery ? `${copy.delivery}: ${automation.delivery}` : null].filter(Boolean).join(" · ")}
      </Text>

      {automation.notice ? (
        <Text accessibilityRole="alert" style={styles.notice}>{automation.notice}</Text>
      ) : null}

      {/* Chat and Edit only open a conversation about this automation, so a
          reset running on another card is no reason to hold them shut. `busy`
          belongs to the controls that actually change something. */}
      <View style={styles.actions}>
        <ActionButton
          accessibilityLabel={copy.chatAbout.replace("{title}", automation.title)}
          label={copy.chat}
          onPress={() => onChat(automation)}
        />
        {automation.editable ? (
          <ActionButton label={copy.edit} onPress={() => onEdit(automation)} />
        ) : null}
        {/* Pause and resume are the one control every automation has, whoever
            wrote it. Where the runtime does not say which state it is in, the
            control stays shut rather than guessing a direction. */}
        <ActionButton
          disabled={busy || automation.enabled === null || !automation.jobId}
          label={automation.enabled === false ? copy.resume : copy.pause}
          onPress={() => onSetEnabled(automation, automation.enabled === false)}
        />
        {automation.shipped ? (
          <ActionButton
            disabled={busy || !automation.jobId}
            label={confirmingReset ? copy.resetConfirm : copy.reset}
            onPress={() => {
              if (!confirmingReset) setConfirmingReset(true);
              else {
                onReset(automation);
                setConfirmingReset(false);
              }
            }}
          />
        ) : null}
        {automation.deletable ? (
          <ActionButton disabled={busy || !automation.jobId} label={copy.delete} onPress={askToDelete} />
        ) : null}
        {/* HPD-409: the job is gone from the runtime. The sentence above says
            so; this is the way back, with the customer's own wording. */}
        {automation.reinstallable ? (
          <ActionButton
            disabled={busy}
            label={confirmingReinstall ? copy.reinstallConfirm : copy.reinstall}
            onPress={() => {
              if (!confirmingReinstall) setConfirmingReinstall(true);
              else {
                onReinstall(automation);
                setConfirmingReinstall(false);
              }
            }}
          />
        ) : null}
      </View>

      {automation.shipped && automation.versions.length ? (
        <View style={styles.versions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: versionsOpen }}
            accessibilityLabel={versionsOpen ? copy.versionsHide : copy.versions}
            onPress={() => setVersionsOpen((current) => !current)}
            style={styles.versionsToggle}
          >
            {versionsOpen ? <ChevronDown size={16} color={palette.muted} /> : <ChevronRight size={16} color={palette.muted} />}
            <Text style={styles.versionsToggleText}>{copy.versions}</Text>
          </Pressable>
          {versionsOpen
            ? automation.versions.map((version) => (
              <View key={version.version} style={styles.versionRow}>
                <Text style={styles.muted}>
                  {`v${version.version} · ${version.reason}${version.active ? ` · ${copy.activeVersion}` : ""}`}
                </Text>
                <ActionButton
                  disabled={busy || !automation.jobId || version.active}
                  label={confirmingVersion === version.version ? copy.restoreConfirm : copy.restore}
                  onPress={() => {
                    if (confirmingVersion !== version.version) setConfirmingVersion(version.version);
                    else {
                      onRestoreVersion(automation, version.version);
                      setConfirmingVersion(null);
                    }
                  }}
                />
              </View>
            ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  cardTitle: { color: palette.ink, flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: "600" },
  standardMark: { backgroundColor: palette.tealSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  standardMarkText: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  summary: { color: palette.text, fontSize: 14, lineHeight: 19 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  notice: { backgroundColor: palette.coralSoft, borderRadius: 10, color: palette.text, fontSize: 13, lineHeight: 18, padding: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 2 },
  button: { backgroundColor: "transparent", borderColor: palette.lineStrong, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  buttonText: { color: palette.ink, fontSize: 13, lineHeight: 16, fontWeight: "500" },
  disabled: { opacity: 0.45 },
  versions: { borderTopColor: palette.line, borderTopWidth: 1, gap: 8, paddingTop: 10 },
  versionsToggle: { alignItems: "center", flexDirection: "row", gap: 6 },
  versionsToggleText: { color: palette.muted, fontSize: 13, fontWeight: "500" },
  versionRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
});
