import { AlertTriangle, ExternalLink, FileText } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppLocale, ChatArtifactReference } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import { mobileFinanceArtifactCard, mobileFinanceArtifactTimestamp } from "./mobile-finance-artifacts";

export function FinanceArtifactCard({
  reference,
  locale,
  onOpenUrl,
}: {
  reference: ChatArtifactReference;
  locale: AppLocale;
  onOpenUrl: (url: string) => void;
}) {
  const palette = useMobilePalette();
  const styles = createStyles(palette);
  const card = mobileFinanceArtifactCard(reference);
  if (!card) return null;
  const capturedAt = mobileFinanceArtifactTimestamp(card.capturedAt, locale);

  return (
    <View style={styles.card} accessibilityLabel={card.title}>
      <View style={styles.header}>
        <FileText size={17} color={palette.teal} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{card.title}</Text>
          {capturedAt ? (
            <Text style={styles.timestamp}>{capturedAt}</Text>
          ) : null}
        </View>
      </View>

      {card.status !== "ok" || card.message ? (
        <View style={card.status === "ok" ? styles.notice : styles.warning}>
          {card.status === "ok" ? null : <AlertTriangle size={15} color={palette.coral} />}
          <Text style={card.status === "ok" ? styles.noticeText : styles.warningText}>
            {card.message || (card.status === "not_configured" ? "This Finance source is not configured." : "This Finance result is unavailable.")}
          </Text>
        </View>
      ) : null}

      {card.sections.map((section, sectionIndex) => (
        <View key={`${section.title}:${sectionIndex}`} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.rows.map((row, rowIndex) => (
            <View key={`${row.label}:${rowIndex}`} style={[styles.row, rowIndex > 0 && styles.rowBorder]}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value} selectable>{row.value}</Text>
            </View>
          ))}
        </View>
      ))}

      {card.sources.length ? (
        <View style={styles.sources}>
          <Text style={styles.sectionTitle}>Sources</Text>
          {card.sources.map((source, sourceIndex) => (
            <View key={`${source.label}:${sourceIndex}`} style={styles.source}>
              {source.url ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Open source ${source.label}`}
                  onPress={() => onOpenUrl(source.url!)}
                  style={styles.sourceLink}
                >
                  <Text style={styles.sourceLabel}>{source.label}</Text>
                  <ExternalLink size={14} color={palette.teal} />
                </Pressable>
              ) : (
                <Text style={styles.sourceLabel}>{source.label}</Text>
              )}
              {source.detail ? <Text style={styles.sourceDetail}>{source.detail}</Text> : null}
              {source.warnings.map((warning, warningIndex) => (
                <Text key={`${warning}:${warningIndex}`} style={styles.warningText}>{warning}</Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(palette: ReturnType<typeof useMobilePalette>) {
  return StyleSheet.create({
    card: {
      alignSelf: "stretch",
      backgroundColor: palette.surface,
      borderColor: palette.lineStrong,
      borderRadius: 8,
      borderWidth: 1,
      gap: 10,
      marginTop: 4,
      overflow: "hidden",
      padding: 12,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 8,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: palette.ink,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 21,
    },
    timestamp: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 1,
    },
    notice: {
      backgroundColor: palette.tealSoft,
      borderRadius: 6,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },
    warning: {
      alignItems: "flex-start",
      backgroundColor: palette.coralSoft,
      borderRadius: 6,
      flexDirection: "row",
      gap: 7,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },
    noticeText: {
      color: palette.text,
      fontSize: 13,
      lineHeight: 18,
    },
    warningText: {
      color: palette.coral,
      flexShrink: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    section: {
      borderColor: palette.line,
      borderRadius: 6,
      borderWidth: 1,
      overflow: "hidden",
    },
    sectionTitle: {
      backgroundColor: palette.tealSoft,
      color: palette.ink,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    row: {
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    rowBorder: {
      borderTopColor: palette.line,
      borderTopWidth: 1,
    },
    label: {
      color: palette.muted,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    },
    value: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 20,
    },
    sources: {
      borderColor: palette.line,
      borderRadius: 6,
      borderWidth: 1,
      overflow: "hidden",
    },
    source: {
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },
    sourceLink: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      minHeight: 28,
    },
    sourceLabel: {
      color: palette.teal,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    sourceDetail: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 17,
    },
  });
}
