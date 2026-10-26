import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock3, ExternalLink, KeyRound } from "lucide-react-native";
import type { AppLocale } from "../core/index";
import {
  ACCESS_LOG_VERIFY_URL,
  accessLogCopy,
  accessLogView,
  loadAndCheckAccessLog,
  type AccessLogClient,
  type AccessLogHeadStore,
  type AccessLogView,
} from "../core/operator-access-log-view";
import { useMobilePalette } from "./mobile-palette-context";

/**
 * HPD-1737 PR C: "Access to your server", one tap from Privacy. The host
 * passes it only while its switch is on (NativeR8Host.policy.accessLogLive)
 * and only for the workspace owner (the Plane answers 403 to members). The
 * last chain head and the anchor key fingerprint are kept in the device's
 * secure storage through `headStore`.
 */
export type MobileAccessLogEntry = {
  client: AccessLogClient;
  headStore: AccessLogHeadStore;
  onOpenSupportAccess: () => void;
};

type LoadState = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; view: AccessLogView; verifyUrl: string };

export function MobileAccessLogPanel({ entry, workspaceId, locale }: { entry: MobileAccessLogEntry; workspaceId: string; locale: AppLocale }) {
  const palette = useMobilePalette();
  const copy = accessLogCopy(locale);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const load = useCallback(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    const now = Date.now();
    loadAndCheckAccessLog(entry.client, entry.headStore, workspaceId, now).then(
      ({ log, check }) => { if (!cancelled) setState({ kind: "ready", view: accessLogView(log, check, locale, now), verifyUrl: log.verifyScriptUrl || ACCESS_LOG_VERIFY_URL }); },
      () => { if (!cancelled) setState({ kind: "failed" }); },
    );
    return () => { cancelled = true; };
  }, [entry.client, entry.headStore, workspaceId, locale]);
  useEffect(() => load(), [load]);

  const body = { color: palette.text, fontSize: 15, lineHeight: 21 } as const;
  const sectionTitle = { color: palette.muted, fontSize: 13, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.4, marginTop: 8 };
  const row = { borderTopColor: palette.line, borderTopWidth: 1, paddingVertical: 12, gap: 2 } as const;
  const lateNote = <View style={{ alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: palette.amberSoft }}>
    <Text style={{ color: palette.amber, fontSize: 13 }}>{copy.recordedLate}</Text>
  </View>;

  if (state.kind === "loading") return <Text accessibilityRole="text" style={{ color: palette.muted, fontSize: 17 }}>{copy.loading}</Text>;
  if (state.kind === "failed") {
    return <View style={{ gap: 12 }}>
      <Text accessibilityRole="alert" style={{ color: palette.text, fontSize: 17, lineHeight: 25 }}>{copy.loadFailed}</Text>
      <Pressable onPress={load} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: palette.teal, fontSize: 17 }}>{copy.retry}</Text>
      </Pressable>
    </View>;
  }
  const { view, verifyUrl } = state;
  const tone = view.check.tone;
  const toneColor = tone === "ok" ? palette.green : tone === "warning" ? palette.coral : palette.amber;
  const toneSoft = tone === "ok" ? palette.greenSoft : tone === "warning" ? palette.coralSoft : palette.amberSoft;
  const CheckIcon = tone === "ok" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Clock3;
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 20, lineHeight: 26, fontWeight: "600" }}>{view.status}</Text>
    <View accessibilityRole={tone === "warning" ? "alert" : undefined} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 12, backgroundColor: toneSoft }}>
      <CheckIcon size={20} color={toneColor} accessible={false} />
      <Text style={{ flex: 1, color: toneColor, fontSize: 15, lineHeight: 21 }}>{view.check.text}</Text>
    </View>

    <Text accessibilityRole="header" style={sectionTitle}>{copy.peopleTitle}</Text>
    {view.people.length ? <View>{view.people.map((person) => <View key={person.key} style={row}>
      <Text style={{ color: palette.ink, fontSize: 17, fontWeight: "600" }}>{person.what}</Text>
      <Text style={body}>{person.when} · {person.who}</Text>
      {person.why ? <Text style={body}>{copy.whyLabel}: {person.why}</Text> : null}
      {person.late ? lateNote : null}
    </View>)}</View> : <Text style={{ ...body, color: palette.muted }}>{copy.peopleNone}</Text>}

    {view.hostGroups.length ? <>
      <Text accessibilityRole="header" style={sectionTitle}>{copy.hostTitle}</Text>
      <View>{view.hostGroups.map((group) => <View key={group.key} style={row}>
        <Text style={{ color: palette.ink, fontSize: 17, fontWeight: "600" }}>{group.text}</Text>
        <Text style={body}>{group.when}</Text>
        {group.why ? <Text style={body}>{copy.whyLabel}: {group.why}</Text> : null}
      </View>)}</View>
    </> : null}

    {view.maintenance ? <View style={{ borderTopColor: palette.line, borderTopWidth: 1 }}>
      <Pressable onPress={() => setMaintenanceOpen(!maintenanceOpen)} accessibilityRole="button" accessibilityState={{ expanded: maintenanceOpen }}
        style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ flex: 1, color: palette.ink, fontSize: 17 }}>{view.maintenance.summary}</Text>
        <Text style={{ color: palette.muted, fontSize: 15 }}>{maintenanceOpen ? copy.hideDetails : copy.showDetails}</Text>
        {maintenanceOpen ? <ChevronDown size={18} color={palette.muted} accessible={false} /> : <ChevronRight size={18} color={palette.muted} accessible={false} />}
      </Pressable>
      {maintenanceOpen ? <View style={{ paddingLeft: 12 }}>{view.maintenance.rows.map((item) => <View key={item.key} style={row}>
        <Text style={body}>{item.what}</Text>
        <Text style={{ color: palette.muted, fontSize: 14 }}>{item.when}</Text>
        {item.late ? lateNote : null}
      </View>)}</View> : null}
    </View> : null}

    <Text accessibilityRole="header" style={sectionTitle}>{copy.verifyTitle}</Text>
    <Text style={body}>{copy.verifyBody}</Text>
    <Pressable onPress={() => void Linking.openURL(verifyUrl)} accessibilityRole="link" style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text style={{ flex: 1, color: palette.teal, fontSize: 17 }}>{copy.verifyLink}</Text>
      <ExternalLink size={20} color={palette.teal} accessible={false} />
    </Pressable>

    <Text accessibilityRole="header" style={sectionTitle}>{copy.supportTitle}</Text>
    <Text style={body}>{copy.supportBody}</Text>
    <Pressable onPress={entry.onOpenSupportAccess} accessibilityRole="button" style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <KeyRound size={18} color={palette.teal} accessible={false} />
      <Text style={{ flex: 1, color: palette.teal, fontSize: 17 }}>{copy.supportLink}</Text>
      <ChevronRight size={20} color={palette.teal} accessible={false} />
    </Pressable>
  </View>;
}
