import { useState } from "react";
import { ChevronRight, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FinHermesSuggestion, FinHermesSuggestionForm } from "../core/finhermes-suggestions";
import { useMobilePalette } from "./mobile-palette-context";
import type { MobilePalette } from "./mobile-palette";
import {
  finSuggestionEntryState,
  type FinSuggestionAction,
  type FinSuggestionsDeviceState,
} from "./fin-suggestions-state";

// HPD-606, visible part: the Suggestions page and the Home Chat card for Fin
// Hermes inside HODL. English only, like the rest of Fin Hermes.

const FORM_LABEL: Record<FinHermesSuggestionForm, string> = {
  prompt: "Answer",
  dialog: "Plan",
  skill: "System",
};

export function FinSuggestionsPage({
  catalog,
  state,
  onStart,
  onAction,
}: {
  catalog: readonly FinHermesSuggestion[];
  state: FinSuggestionsDeviceState;
  onStart: (suggestion: FinHermesSuggestion) => void;
  onAction: (suggestion: FinHermesSuggestion, action: FinSuggestionAction) => void;
}) {
  const palette = useMobilePalette();
  const styles = createStyles(palette);
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.pageTitle}>Suggestions</Text>
      <Text style={styles.pageIntro}>
        Ways to work with Hermes. Starting one puts an editable message in the chat. Nothing is built until you confirm.
      </Text>
      {catalog.map((suggestion) => {
        const entry = finSuggestionEntryState(state, suggestion.id);
        const stateLabel = entry.removed ? "Removed" : entry.progress === "completed" ? "Running" : entry.progress === "tried" ? "Tried" : null;
        return (
          <View key={suggestion.id} style={[styles.card, entry.removed && styles.cardRemoved]} accessibilityLabel={suggestion.title}>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>{FORM_LABEL[suggestion.form]}</Text>
              {suggestion.showcaseRank ? <Text style={styles.metaAccent}>Featured</Text> : null}
              {stateLabel ? <Text style={styles.metaState}>{stateLabel}</Text> : null}
            </View>
            <Text style={styles.cardTitle}>{suggestion.title}</Text>
            <Text style={styles.cardPromise}>{suggestion.promise}</Text>
            <View style={styles.actions}>
              {entry.removed ? (
                <Pressable accessibilityRole="button" onPress={() => onAction(suggestion, "restored")} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Restore</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Start: ${suggestion.title}`} onPress={() => onStart(suggestion)} style={styles.primaryButton}>
                    <Text style={styles.primaryText}>Start</Text>
                  </Pressable>
                  {entry.progress === "tried" ? (
                    <Pressable accessibilityRole="button" onPress={() => onAction(suggestion, "completed")} style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>Mark as running</Text>
                    </Pressable>
                  ) : null}
                  <Pressable accessibilityRole="button" onPress={() => onAction(suggestion, "removed")} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Remove</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * The Home Chat card, pinned under the chat header and outside the transcript.
 * X closes it for today; "Later" and "Don't show again" are the customer's
 * standing choices; "All suggestions" opens the full page.
 */
export function FinSuggestionCard({
  suggestions,
  onOpen,
  onClose,
  onSeeAll,
  onLater,
  onNever,
}: {
  suggestions: readonly FinHermesSuggestion[];
  onOpen: (suggestion: FinHermesSuggestion) => void;
  onClose: () => void;
  onSeeAll: () => void;
  onLater: () => void;
  onNever: () => void;
}) {
  const palette = useMobilePalette();
  const styles = createStyles(palette);
  const [index, setIndex] = useState(0);
  if (!suggestions.length) return null;
  const position = Math.min(index, suggestions.length - 1);
  const current = suggestions[position]!;
  return (
    <View style={styles.carousel} accessibilityLabel="Suggestion">
      <View style={styles.carouselHeader}>
        <Text style={styles.carouselLabel}>Try this with Hermes</Text>
        {suggestions.length > 1 ? (
          <Text style={styles.carouselCount}>{`${position + 1} of ${suggestions.length}`}</Text>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Close suggestions" onPress={onClose} style={styles.iconButton}>
          <X size={16} color={palette.muted} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Start: ${current.title}`} onPress={() => onOpen(current)} style={styles.carouselBody}>
        <Text style={styles.cardTitle}>{current.title}</Text>
        <Text numberOfLines={2} style={styles.cardPromise}>{current.promise}</Text>
      </Pressable>
      <View style={styles.carouselFooter}>
        <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.linkButton}>
          <Text style={styles.linkAccent}>All suggestions</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onLater} style={styles.linkButton}>
          <Text style={styles.linkText}>Later</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onNever} style={styles.linkButton}>
          <Text style={styles.linkText}>{"Don't show again"}</Text>
        </Pressable>
        <View style={styles.flexOne} />
        {suggestions.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next suggestion"
            onPress={() => setIndex((position + 1) % suggestions.length)}
            style={styles.iconButton}
          >
            <ChevronRight size={18} color={palette.teal} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(palette: MobilePalette) {
  return StyleSheet.create({
    page: { gap: 12, paddingBottom: 24 },
    pageTitle: { color: palette.ink, fontSize: 22, fontWeight: "700" },
    pageIntro: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.line,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    cardRemoved: { opacity: 0.6 },
    cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    metaText: { color: palette.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    metaAccent: { color: palette.teal, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    metaState: { color: palette.green, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    cardTitle: { color: palette.ink, fontSize: 16, fontWeight: "600", lineHeight: 22 },
    cardPromise: { color: palette.text, fontSize: 14, lineHeight: 20 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    primaryButton: {
      alignItems: "center",
      backgroundColor: palette.teal,
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: 16,
    },
    primaryText: { color: palette.accentText, fontSize: 14, fontWeight: "600" },
    secondaryButton: {
      alignItems: "center",
      borderColor: palette.lineStrong,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: 14,
    },
    secondaryText: { color: palette.ink, fontSize: 14 },
    carousel: {
      backgroundColor: palette.surface,
      borderColor: palette.line,
      borderRadius: 14,
      borderWidth: 1,
      gap: 4,
      marginHorizontal: 12,
      marginTop: 8,
      padding: 12,
    },
    carouselHeader: { alignItems: "center", flexDirection: "row", gap: 8 },
    carouselLabel: { color: palette.teal, flex: 1, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    carouselCount: { color: palette.muted, fontSize: 12 },
    carouselBody: { gap: 4 },
    carouselFooter: { alignItems: "center", flexDirection: "row", gap: 12 },
    linkButton: { minHeight: 32, justifyContent: "center" },
    linkText: { color: palette.muted, fontSize: 13 },
    linkAccent: { color: palette.teal, fontSize: 13, fontWeight: "600" },
    iconButton: { alignItems: "center", justifyContent: "center", minHeight: 32, minWidth: 32 },
    flexOne: { flex: 1 },
  });
}
