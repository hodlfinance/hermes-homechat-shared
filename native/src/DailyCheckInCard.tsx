import { Pressable, StyleSheet, Text, View } from "react-native";
import { Hand } from "lucide-react-native";
import type { AppLocale } from "../core/index";
import { useMobilePalette } from "./mobile-palette-context";
import { dailyCheckInCopy } from "./self-managed";

/**
 * HPD-1197: message 81 of the day on the included AI waits here, above the
 * composer. Nothing is lost: "Continue anyway" sends it (and holds for the
 * rest of the UTC day), "Not now" puts it back into the composer.
 */
export function DailyCheckInCard({
  locale,
  afterMessages,
  busy,
  onContinue,
  onNotNow,
}: {
  locale: AppLocale;
  afterMessages: number;
  busy: boolean;
  onContinue: () => void;
  onNotNow: () => void;
}) {
  const palette = useMobilePalette();
  const copy = dailyCheckInCopy(locale);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.amber }]}
      testID="daily-check-in-card"
    >
      <View style={styles.head}>
        <Hand size={16} color={palette.amber} />
        <Text style={[styles.title, { color: palette.ink }]} allowFontScaling>{copy.title(afterMessages)}</Text>
      </View>
      <Text style={[styles.body, { color: palette.text }]} allowFontScaling>{copy.body}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={onContinue}
          style={[styles.primary, { backgroundColor: palette.accent, opacity: busy ? 0.5 : 1 }]}
          testID="daily-check-in-continue"
        >
          <Text style={[styles.primaryText, { color: palette.accentText }]} allowFontScaling>{copy.continueAnyway}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onNotNow} style={styles.secondary} testID="daily-check-in-not-now">
          <Text style={[styles.secondaryText, { color: palette.muted }]} allowFontScaling>{copy.notNow}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginVertical: 8,
    padding: 14,
  },
  head: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  primary: {
    borderRadius: 10,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondary: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
