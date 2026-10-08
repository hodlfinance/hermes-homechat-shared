import { useCallback, useEffect, useState } from "react";
import { Clipboard, Share, StyleSheet, Text, View } from "react-native";
import { Copy, Download, KeyRound, Share2 } from "lucide-react-native";
import { apiErrorCode } from "../core/api-client";
import type { AppLocale } from "../core/index";
import type { LapseExportKey, LapseExportOwnerView } from "../core/types";
import { MobileSystemRow, MobileSystemSection, mobileSystemSurfaceMetrics } from "./mobile-system-surface";
import { useMobilePalette } from "./mobile-palette-context";
import { LAPSE_EXPORT_HIDDEN_CODES, lapseExportCopy, lapseExportKeyFile, lapseExportModel } from "./lapse-export";

/** The two calls the section needs; the app passes its api client. */
export interface LapseExportClient {
  lapseExport: () => Promise<LapseExportOwnerView>;
  takeLapseExportKey: () => Promise<LapseExportKey>;
}

/**
 * HPD-1027 S6(b): after a Hey subscription ended, the Owner sees the paused server, then the
 * day-30 backup and its one-time key here, whether or not the notice mail arrived. Shown only
 * when the Plane answers (signed-in Owner of a lapsed server); the download opens through the
 * app's private browser handoff, the Owner's own session. The key lives only in this view's state
 * until the Owner saves or copies it.
 */
export function LapseExportSection({
  client,
  locale,
  formatDate,
  onDownload,
}: {
  client: LapseExportClient;
  locale: AppLocale;
  formatDate: (iso: string) => string;
  onDownload: () => Promise<void>;
}) {
  const palette = useMobilePalette();
  const copy = lapseExportCopy(locale);
  const [view, setView] = useState<LapseExportOwnerView | null>(null);
  const [hidden, setHidden] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<"download" | "key" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setView(await client.lapseExport());
      setHidden(false);
      setLoadError(false);
    } catch (err) {
      if (LAPSE_EXPORT_HIDDEN_CODES.has(apiErrorCode(err) ?? "")) setHidden(true);
      else {
        setHidden(false);
        setLoadError(true);
      }
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: "download" | "key") => {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      if (action === "download") await onDownload();
      else setKey((await client.takeLapseExportKey()).identity);
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(null);
      void load();
    }
  };

  if (hidden) return null;
  const model = view ? lapseExportModel(view, copy, formatDate, key !== null) : null;

  return (
    <MobileSystemSection title={copy.title} footer={model?.hint ?? undefined} testID="lapse-export-section">
      <View style={styles.notice}>
        <Text style={[styles.status, { color: loadError ? palette.coral : palette.text }]} accessibilityLiveRegion="polite" allowFontScaling>
          {loadError ? copy.loadFailed : model?.status ?? ""}
        </Text>
        {model?.keyShownNote ? <Text style={[styles.note, { color: palette.muted }]} allowFontScaling>{model.keyShownNote}</Text> : null}
      </View>
      {model?.canDownload ? (
        <MobileSystemRow
          error={busy === null ? error : null}
          icon={<Download size={17} color={palette.teal} />}
          label={copy.download}
          onPress={() => void run("download")}
          pending={busy === "download"}
        />
      ) : null}
      {model?.canTakeKey ? (
        <MobileSystemRow
          detail={copy.keyOnce}
          icon={<KeyRound size={17} color={palette.teal} />}
          label={copy.takeKey}
          onPress={() => void run("key")}
          pending={busy === "key"}
        />
      ) : null}
      {key ? (
        <>
          <View style={styles.notice}>
            <Text style={[styles.note, { color: palette.amber }]} allowFontScaling>{copy.keyOnce}</Text>
            <Text style={[styles.key, { color: palette.text }]} selectable allowFontScaling>{key}</Text>
          </View>
          <MobileSystemRow
            icon={<Share2 size={17} color={palette.teal} />}
            label={copy.shareKey}
            onPress={() => void Share.share({ message: lapseExportKeyFile(key) }).catch(() => undefined)}
          />
          <MobileSystemRow
            icon={<Copy size={17} color={palette.teal} />}
            label={copy.copyKey}
            onPress={() => Clipboard.setString(key)}
          />
        </>
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
  note: {
    fontSize: 13,
    lineHeight: 18,
  },
  key: {
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 18,
  },
});
