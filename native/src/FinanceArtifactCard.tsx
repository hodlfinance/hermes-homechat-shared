import { useState } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, FileText } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppLocale, ChatArtifactReference } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import {
  mobileFinanceArtifactCard,
  mobileFinanceArtifactTimestamp,
  type MobileFinanceArtifactSource,
} from "./mobile-finance-artifacts";
import { mobileMarkdownBlocks, type MobileMarkdownInlineSegment } from "./mobile-markdown";
import { mobileAssistantLinkSegments } from "./mobile-message-links";

function sourceKey(source: MobileFinanceArtifactSource): string {
  return JSON.stringify([source.label, source.detail, source.url, source.warnings]);
}

function safeMessageUrl(value: string): string | null {
  const candidate = value.trim();
  return /^(?:https?:|mailto:)/i.test(candidate) ? candidate : null;
}

function MarkdownInlineText({
  onOpenUrl,
  segments,
  styles,
  variant = "paragraph",
}: {
  onOpenUrl: (url: string) => void;
  segments: MobileMarkdownInlineSegment[];
  styles: ReturnType<typeof createStyles>;
  variant?: "paragraph" | "table_header" | "table_cell";
}) {
  const textStyle = variant === "table_header"
    ? styles.markdownTableHeaderText
    : variant === "table_cell"
      ? styles.markdownTableCellText
      : styles.answerText;
  return (
    <Text selectable style={textStyle}>
      {segments.flatMap((segment, segmentIndex) => {
        if (segment.kind === "inline_code") {
          return <Text key={`${segmentIndex}-${segment.text}`} style={styles.inlineCode}>{segment.text}</Text>;
        }
        return mobileAssistantLinkSegments(segment.text).map((link, linkIndex) => {
          const href = link.href ? safeMessageUrl(link.href) : null;
          const emphasis = segment.kind === "bold" || link.kind === "bold";
          if (!href) {
            return <Text key={`${segmentIndex}-${linkIndex}-${link.text}`} style={emphasis ? styles.boldText : undefined}>{link.text}</Text>;
          }
          return (
            <Text
              accessibilityRole="link"
              key={`${segmentIndex}-${linkIndex}-${link.text}`}
              onPress={() => onOpenUrl(href)}
              style={[emphasis ? styles.boldText : undefined, styles.markdownLink]}
            >
              {link.text}
            </Text>
          );
        });
      })}
    </Text>
  );
}

function MarkdownContent({
  onOpenUrl,
  styles,
  text,
}: {
  onOpenUrl: (url: string) => void;
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={styles.markdownBlocks}>
      {mobileMarkdownBlocks(text).map((block, blockIndex) => block.kind === "code" ? (
        <View key={`code-${blockIndex}`} style={styles.codeBlock}>
          {block.language ? <Text style={styles.codeLanguage}>{block.language}</Text> : null}
          <Text selectable style={styles.codeBlockText}>{block.text}</Text>
        </View>
      ) : block.kind === "table" ? (
        <View accessibilityLabel="Table" key={`table-${blockIndex}`} style={styles.markdownTable}>
          {[block.header, ...block.rows].map((row, rowIndex) => (
            <View key={`table-${blockIndex}-row-${rowIndex}`} style={[styles.markdownTableRow, rowIndex > 0 && styles.rowBorder]}>
              {row.map((cell, cellIndex) => (
                <View
                  key={`table-${blockIndex}-row-${rowIndex}-cell-${cellIndex}`}
                  style={[styles.markdownTableCell, rowIndex === 0 && styles.markdownTableHeaderCell, cellIndex > 0 && styles.markdownTableColumnBorder]}
                >
                  <MarkdownInlineText
                    onOpenUrl={onOpenUrl}
                    segments={cell}
                    styles={styles}
                    variant={rowIndex === 0 ? "table_header" : "table_cell"}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <MarkdownInlineText key={`paragraph-${blockIndex}`} onOpenUrl={onOpenUrl} segments={block.segments} styles={styles} />
      ))}
    </View>
  );
}

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
  const [activeContextTab, setActiveContextTab] = useState<string | null>(() =>
    card?.contextTabs?.find((tab) => tab.available)?.key ?? null,
  );
  if (!card) return null;
  const capturedAt = mobileFinanceArtifactTimestamp(card.capturedAt, locale);
  const contextTabs = card.contextTabs ?? [];
  const selectedContextTab = contextTabs.find((tab) => tab.key === activeContextTab) ?? null;
  const contextSourceKeys = new Set(
    contextTabs.flatMap((tab) => tab.sources.map(sourceKey)),
  );
  const displaySources = contextTabs.length
    ? card.sources.filter((source) => !contextSourceKeys.has(sourceKey(source)))
    : card.sources;

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

      {card.answerMarkdown ? (
        <View style={styles.answer}>
          <Text style={styles.answerTitle}>CapChat answer</Text>
          <MarkdownContent onOpenUrl={onOpenUrl} styles={styles} text={card.answerMarkdown} />
        </View>
      ) : null}

      {contextTabs.length ? (
        <View style={styles.contextCard}>
          <View accessibilityLabel="CapChat answer context" style={styles.tabs}>
            {contextTabs.map((tab) => {
              const selected = tab.key === activeContextTab;
              return (
                <Pressable
                  accessibilityLabel={`${tab.label}, ${tab.count}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !tab.available, expanded: selected, selected }}
                  disabled={!tab.available}
                  key={tab.key}
                  onPress={() => setActiveContextTab(selected ? null : tab.key)}
                  style={[styles.tab, selected && styles.tabSelected, !tab.available && styles.tabDisabled]}
                >
                  <View style={styles.tabLabelRow}>
                    <Text numberOfLines={1} style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
                    <ChevronDown color={selected ? palette.ink : palette.muted} size={13} style={selected ? styles.chevronOpen : undefined} />
                  </View>
                  <Text style={styles.tabCount}>{tab.count}</Text>
                </Pressable>
              );
            })}
          </View>

          {selectedContextTab ? (
            <View accessibilityLabel={`${selectedContextTab.label} details`} style={styles.contextPanel}>
              {selectedContextTab.sections.map((section, sectionIndex) => (
                <View key={`${section.title}:${sectionIndex}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.rows.map((row, rowIndex) => (
                    <View key={`${row.label}:${rowIndex}`} style={[styles.row, rowIndex > 0 && styles.rowBorder]}>
                      <Text style={styles.label}>{row.label}</Text>
                      <Text selectable style={styles.value}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {selectedContextTab.sources.map((source, sourceIndex) => (
                <View key={`${source.label}:${sourceIndex}`} style={[styles.source, sourceIndex > 0 && styles.rowBorder]}>
                  {source.url ? (
                    <Pressable
                      accessibilityLabel={`Open source ${source.label}`}
                      accessibilityRole="link"
                      onPress={() => onOpenUrl(source.url!)}
                      style={styles.sourceLink}
                    >
                      <Text style={styles.sourceLabel}>{source.label}</Text>
                      <ExternalLink color={palette.teal} size={14} />
                    </Pressable>
                  ) : <Text style={styles.sourceLabel}>{source.label}</Text>}
                  {source.detail ? <Text style={styles.sourceDetail}>{source.detail}</Text> : null}
                  {source.warnings.map((warning, warningIndex) => (
                    <Text key={`${warning}:${warningIndex}`} style={styles.warningText}>{warning}</Text>
                  ))}
                </View>
              ))}
              {!selectedContextTab.sections.length && !selectedContextTab.sources.length ? (
                <Text style={styles.emptyText}>No details were returned for this tab.</Text>
              ) : null}
            </View>
          ) : null}
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

      {displaySources.length ? (
        <View style={styles.sources}>
          <Text style={styles.sectionTitle}>Sources</Text>
          {displaySources.map((source, sourceIndex) => (
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
    answer: {
      borderBottomColor: palette.line,
      borderBottomWidth: 1,
      gap: 8,
      paddingBottom: 10,
    },
    answerTitle: {
      color: palette.ink,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    answerText: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 21,
    },
    boldText: {
      color: palette.ink,
      fontWeight: "700",
    },
    markdownLink: {
      color: palette.teal,
      textDecorationLine: "underline",
    },
    markdownBlocks: {
      alignSelf: "stretch",
      gap: 9,
    },
    inlineCode: {
      backgroundColor: palette.tealSoft,
      color: palette.ink,
      fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    },
    codeBlock: {
      backgroundColor: "#111827",
      borderColor: palette.line,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
      padding: 9,
    },
    codeLanguage: {
      color: "#9ca3af",
      fontSize: 11,
    },
    codeBlockText: {
      color: "#f9fafb",
      fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
      fontSize: 12,
      lineHeight: 18,
    },
    markdownTable: {
      alignSelf: "stretch",
      backgroundColor: palette.surface,
      borderColor: palette.line,
      borderRadius: 6,
      borderWidth: 1,
      overflow: "hidden",
    },
    markdownTableRow: {
      alignItems: "stretch",
      flexDirection: "row",
    },
    markdownTableCell: {
      flex: 1,
      flexBasis: 0,
      justifyContent: "flex-start",
      minWidth: 0,
      paddingHorizontal: 7,
      paddingVertical: 7,
    },
    markdownTableHeaderCell: {
      backgroundColor: palette.tealSoft,
    },
    markdownTableColumnBorder: {
      borderLeftColor: palette.line,
      borderLeftWidth: 1,
    },
    markdownTableHeaderText: {
      color: palette.ink,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 17,
    },
    markdownTableCellText: {
      color: palette.text,
      fontSize: 12,
      lineHeight: 17,
    },
    contextCard: {
      gap: 8,
    },
    tabs: {
      backgroundColor: palette.tealSoft,
      borderColor: palette.line,
      borderRadius: 7,
      borderWidth: 1,
      flexDirection: "row",
      gap: 3,
      padding: 3,
    },
    tab: {
      borderRadius: 5,
      flex: 1,
      gap: 1,
      minHeight: 48,
      minWidth: 0,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    tabSelected: {
      backgroundColor: palette.surface,
      borderColor: palette.lineStrong,
      borderWidth: 1,
    },
    tabDisabled: {
      opacity: 0.45,
    },
    tabLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
      justifyContent: "center",
    },
    tabLabel: {
      color: palette.muted,
      flexShrink: 1,
      fontSize: 11,
      fontWeight: "600",
      lineHeight: 15,
    },
    tabLabelSelected: {
      color: palette.ink,
    },
    tabCount: {
      color: palette.muted,
      fontSize: 10,
      lineHeight: 13,
      textAlign: "center",
    },
    chevronOpen: {
      transform: [{ rotate: "180deg" }],
    },
    contextPanel: {
      borderColor: palette.line,
      borderRadius: 6,
      borderWidth: 1,
      overflow: "hidden",
    },
    emptyText: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 18,
      padding: 9,
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
