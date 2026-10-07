import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Archive, Download } from "lucide-react-native";
import { apiErrorCode } from "../core/api-client";
import type { AppLocale } from "../core/index";
import type { ServerFullExportStatus } from "../core/types";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { useMobilePalette } from "./mobile-palette-context";
import { serverFullExportCopy, serverFullExportErrorMessage, serverFullExportModel } from "./server-full-export";

/** The two calls the row needs; the app passes its api client. */
export interface ServerFullExportClient {
  serverFullExport: () => Promise<ServerFullExportStatus>;
  createServerFullExport: () => Promise<ServerFullExportStatus>;
}

/**
 * HPD-1027 S5: the Owner's full server archive, beside the partial export (which stays). Shown only
 * to the server Owner while it is switched on (server-identity fullExportAvailable); the download
 * opens through the app's private browser handoff, the Owner's own session.
 */
export function ServerFullExportSection({
  client,
  locale,
  formatDate,
  onDownload,
}: {
  client: ServerFullExportClient;
  locale: AppLocale;
  formatDate: (iso: string) => string;
  onDownload: () => Promise<void>;
}) {
  const palette = useMobilePalette();
  const copy = serverFullExportCopy(locale);
  const [status, setStatus] = useState<ServerFullExportStatus | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await client.serverFullExport());
      setLoadError(false);
    } catch (err) {
      if (apiErrorCode(err) === "full_export_unavailable") setHidden(true);
      else setLoadError(true);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const model = serverFullExportModel(status, copy, locale, formatDate);

  const act = async () => {
    if (busy || model.action === "none") return;
    setBusy(true);
    setError(null);
    try {
      if (model.action === "create") setStatus(await client.createServerFullExport());
      else await onDownload();
    } catch (err) {
      setError(serverFullExportErrorMessage(apiErrorCode(err), copy));
      void load();
    } finally {
      setBusy(false);
    }
  };

  if (hidden) return null;
  const toneColor = model.tone === "teal" ? palette.teal : model.tone === "amber" ? palette.amber
    : model.tone === "coral" ? palette.coral : palette.muted;

  return (
    <MobileSystemSection title={copy.title} footer={copy.intro(status?.linkDays ?? 7)} testID="server-full-export-section">
      {loadError || model.status ? (
        <View style={styles.notice}>
          <Text style={[styles.status, { color: loadError ? palette.coral : toneColor }]} accessibilityLiveRegion="polite" allowFontScaling>
            {loadError ? copy.loadFailed : model.status}
          </Text>
          {model.hint ? <Text style={[styles.hint, { color: palette.muted }]} selectable allowFontScaling>{model.hint}</Text> : null}
        </View>
      ) : null}
      {model.action !== "none" && model.actionLabel ? (
        <MobileSystemRow
          accessibilityRole="button"
          error={error}
          icon={model.action === "download" ? <Download size={17} color={palette.teal} /> : <Archive size={17} color={palette.teal} />}
          label={busy && model.action === "create" ? copy.creating : model.actionLabel}
          onPress={() => void act()}
          pending={busy}
        />
      ) : null}
    </MobileSystemSection>
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
  hint: {
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 18,
  },
});
