import { useState } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, FileText } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppLocale, ChatArtifactReference } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import {
  messageRepeatsAnswer,
  mobileFinanceCitationForUrl,
  mobileCitationSegments,
  mobileFinanceArtifactCard,
  mobileFinanceArtifactTimestamp,
  mobileFinanceMessageCarriesAnswer,
  type MobileFinanceArtifactSource,
  type MobileFinanceCitation,
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
  citations = [],
  onCitationPress,
  onOpenUrl,
  segments,
  styles,
  variant = "paragraph",
  headingLevel = 2,
}: {
  citations?: readonly MobileFinanceCitation[];
  onCitationPress?: (citation: MobileFinanceCitation) => void;
  onOpenUrl: (url: string) => void;
  segments: MobileMarkdownInlineSegment[];
  styles: ReturnType<typeof createStyles>;
  variant?: "paragraph" | "heading" | "table_header" | "table_cell";
  headingLevel?: number;
}) {
  const textStyle = variant === "heading"
    ? [
        styles.markdownHeadingText,
        headingLevel <= 2
          ? styles.markdownHeadingLargeText
          : headingLevel <= 4
            ? styles.markdownHeadingMediumText
            : styles.markdownHeadingSmallText,
      ]
    : variant === "table_header"
    ? styles.markdownTableHeaderText
    : variant === "table_cell"
      ? styles.markdownTableCellText
      : styles.answerText;
  return (
    <Text accessibilityRole={variant === "heading" ? "header" : "text"} selectable style={textStyle}>
      {segments.flatMap((segment, segmentIndex) => {
        if (segment.kind === "inline_code") {
          return <Text key={`${segmentIndex}-${segment.text}`} style={styles.inlineCode}>{segment.text}</Text>;
        }
        return mobileAssistantLinkSegments(segment.text).map((link, linkIndex) => {
          const href = link.href ? safeMessageUrl(link.href) : null;
          const linkedCitation = href && onCitationPress ? mobileFinanceCitationForUrl(href, citations) : null;
          const emphasis = segment.kind === "bold" || link.kind === "bold";
          const italic = segment.kind === "italic";
          if (!href) {
            const pieces = onCitationPress ? mobileCitationSegments(link.text, citations) : [{ kind: "text" as const, text: link.text }];
            return pieces.map((piece, pieceIndex) => piece.kind === "citation" ? (
              <Text
                accessibilityLabel={`Source ${piece.citation.number}: ${piece.citation.title}`}
                accessibilityRole="button"
                key={`${segmentIndex}-${linkIndex}-${pieceIndex}-${piece.text}`}
                onPress={() => onCitationPress?.(piece.citation)}
                style={[emphasis ? styles.boldText : undefined, styles.citation]}
              >
                {piece.text}
              </Text>
            ) : (
              <Text key={`${segmentIndex}-${linkIndex}-${pieceIndex}-${piece.text}`} style={[emphasis ? styles.boldText : undefined, italic ? styles.italicText : undefined]}>{piece.text}</Text>
            ));
          }
          return (
            <Text
              accessibilityRole={linkedCitation ? "button" : "link"}
              accessibilityLabel={linkedCitation ? `Source ${linkedCitation.number}: ${linkedCitation.title}` : undefined}
              key={`${segmentIndex}-${linkIndex}-${link.text}`}
              onPress={() => linkedCitation ? onCitationPress?.(linkedCitation) : onOpenUrl(href)}
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
  citations,
  onCitationPress,
  onOpenUrl,
  styles,
  text,
}: {
  citations?: readonly MobileFinanceCitation[];
  onCitationPress?: (citation: MobileFinanceCitation) => void;
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
                    citations={citations}
                    onCitationPress={onCitationPress}
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
      ) : block.kind === "list" ? (
        <View key={`list-${blockIndex}`} style={styles.markdownList}>
          {block.items.map((item, itemIndex) => (
            <View key={`list-${blockIndex}-item-${itemIndex}`} style={styles.markdownListItem}>
              <Text style={[styles.answerText, styles.markdownListMarker]}>{block.ordered ? `${itemIndex + 1}.` : "•"}</Text>
              <View style={styles.markdownListBody}>
                <MarkdownInlineText
                  citations={citations}
                  onCitationPress={onCitationPress}
                  onOpenUrl={onOpenUrl}
                  segments={item}
                  styles={styles}
                />
              </View>
            </View>
          ))}
        </View>
      ) : block.kind === "heading" ? (
        <MarkdownInlineText
          citations={citations}
          headingLevel={block.level}
          key={`heading-${blockIndex}`}
          onCitationPress={onCitationPress}
          onOpenUrl={onOpenUrl}
          segments={block.segments}
          styles={styles}
          variant="heading"
        />
      ) : (
        <MarkdownInlineText
          citations={citations}
          key={`paragraph-${blockIndex}`}
          onCitationPress={onCitationPress}
          onOpenUrl={onOpenUrl}
          segments={block.segments}
          styles={styles}
        />
      ))}
    </View>
  );
}

export function FinanceArtifactCard({
  reference,
  locale,
  messageText,
  onCitationPress,
  onOpenUrl,
}: {
  reference: ChatArtifactReference;
  locale: AppLocale;
  // The chat message this card sits under. When it already is the answer, the
  // card does not print it again (HPD-808).
  messageText?: string;
  onCitationPress?: (citation: MobileFinanceCitation) => void;
  onOpenUrl: (url: string) => void;
}) {
  const palette = useMobilePalette();
  const styles = createStyles(palette);
  const card = mobileFinanceArtifactCard(reference);
  // Closed until the reader opens a tab: the answer above owns the space, and
  // its [n] markers are the way to a single source (HPD-808).
  const [activeContextTab, setActiveContextTab] = useState<string | null>(null);
  if (!card) return null;
  if (mobileFinanceMessageCarriesAnswer(messageText, card)) {
    // HPD-808: the message above is the answer and carries the references.
    // What is left is one small row that opens the source titles and links.
    if (!card.sources.length) return null;
    const open = activeContextTab === "sources";
    const label = `${locale === "de" ? "Quellen" : "Sources"} (${card.sources.length})`;
    return (
      <View style={styles.compact}>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setActiveContextTab(open ? null : "sources")}
          style={styles.compactToggle}
        >
          <FileText size={14} color={palette.muted} />
          <Text style={styles.compactLabel}>{label}</Text>
          <ChevronDown color={palette.muted} size={13} style={open ? styles.chevronOpen : undefined} />
        </Pressable>
        {open ? (
          <View style={styles.compactList}>
            {card.sources.map((source, sourceIndex) => source.url ? (
              <Pressable
                accessibilityLabel={`Open source ${source.label}`}
                accessibilityRole="link"
                key={`${source.label}:${sourceIndex}`}
                onPress={() => onOpenUrl(source.url!)}
                style={styles.sourceLink}
              >
                <Text numberOfLines={2} style={styles.sourceLabel}>{source.label}</Text>
                <ExternalLink color={palette.teal} size={13} />
              </Pressable>
            ) : (
              <Text key={`${source.label}:${sourceIndex}`} numberOfLines={2} style={[styles.sourceLabel, styles.sourceLabelPlain, styles.compactPlain]}>
                {source.label}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }
  const showAnswer = Boolean(card.answerMarkdown) && !messageRepeatsAnswer(messageText, card.answerMarkdown);
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

      {showAnswer && card.answerMarkdown ? (
        <View style={styles.answer}>
          <Text style={styles.answerTitle}>CapChat answer</Text>
          <MarkdownContent citations={card.citations} onCitationPress={onCitationPress} onOpenUrl={onOpenUrl} styles={styles} text={card.answerMarkdown} />
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
                  ) : <Text style={[styles.sourceLabel, styles.sourceLabelPlain]}>{source.label}</Text>}
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
                <Text style={[styles.sourceLabel, styles.sourceLabelPlain]}>{source.label}</Text>
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
    compact: {
      alignSelf: "stretch",
      marginTop: 2,
    },
    compactToggle: {
      alignItems: "center",
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: 5,
      minHeight: 32,
      paddingVertical: 4,
    },
    compactLabel: {
      color: palette.muted,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    compactList: {
      borderLeftColor: palette.line,
      borderLeftWidth: 2,
      gap: 2,
      paddingLeft: 9,
    },
    compactPlain: {
      paddingVertical: 5,
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
    citation: {
      color: palette.teal,
      fontWeight: "600",
    },
    italicText: {
      fontStyle: "italic",
    },
    markdownList: {
      gap: 4,
    },
    markdownListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },
    markdownListMarker: {
      minWidth: 14,
    },
    markdownListBody: {
      flex: 1,
    },
    markdownBlocks: {
      alignSelf: "stretch",
      gap: 9,
    },
    markdownHeadingText: {
      color: palette.ink,
      fontWeight: "700",
    },
    markdownHeadingLargeText: {
      fontSize: 18,
      lineHeight: 24,
    },
    markdownHeadingMediumText: {
      fontSize: 16,
      lineHeight: 22,
    },
    markdownHeadingSmallText: {
      fontSize: 14,
      lineHeight: 21,
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
    // HPD-808: a source without a link must not look like one.
    sourceLabelPlain: { color: palette.ink },
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
