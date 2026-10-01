import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { useMobilePalette } from "./mobile-palette-context";
import type { NativeLiveVoicePhase } from "./mobile-live-voice";

const waveHeights = [8, 14, 22, 12, 28, 18, 24, 30, 16, 26, 12, 28, 20, 10, 24, 16, 8, 12];
const waveScales = [
  [0.3, 1, 0.5, 0.7, 0.3],
  [0.7, 0.3, 1, 0.5, 0.7],
  [0.5, 0.7, 0.3, 1, 0.5],
];

/** The active Voice controls stay next to the composer, including while typing. */
export function MobileLiveVoiceBar({ brand, phase, statusLabel, endLabel, reduceMotion, onEnd }: {
  brand: ReactNode;
  phase: NativeLiveVoicePhase;
  statusLabel: string;
  endLabel: string;
  reduceMotion: boolean | null;
  onEnd(): void;
}) {
  const palette = useMobilePalette();
  const progress = useRef(new Animated.Value(0)).current;
  const voiceActive = phase === "listening" || phase === "speaking";
  const animate = voiceActive && reduceMotion === false;
  const ending = phase === "ending";

  useEffect(() => {
    progress.setValue(0);
    if (!animate) return;
    const loop = Animated.loop(Animated.timing(progress, {
      toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [animate, progress]);

  return (
    <View testID="live-voice-bar" style={[styles.bar, { backgroundColor: palette.pageBg, borderColor: palette.lineStrong }]}>
      <View style={styles.brand} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{brand}</View>
      <View style={styles.wave} accessibilityRole="text" accessibilityLabel={statusLabel}
        accessibilityLiveRegion="polite" testID="live-voice-wave">
        {waveHeights.map((height, index) => (
          <Animated.View key={index} style={[styles.waveBar, {
            // This is an activity animation, not an invented audio-level meter.
            height: voiceActive ? height : 4,
            backgroundColor: voiceActive ? palette.accent : palette.secondary,
            transform: [{ scaleY: animate ? progress.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: waveScales[index % waveScales.length]!,
            }) : 1 }],
          }]} />
        ))}
      </View>
      <Pressable onPress={onEnd} disabled={ending} accessibilityRole="button" accessibilityLabel={endLabel}
        accessibilityState={{ disabled: ending, busy: ending }} testID="live-voice-end"
        style={({ pressed }) => [styles.close, { backgroundColor: palette.coral, opacity: ending ? 0.5 : pressed ? 0.75 : 1 }]}>
        <X size={24} color={palette.surface} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 68, borderRadius: 34, borderWidth: 1, paddingHorizontal: 12,
    paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 12,
  },
  brand: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  wave: { flex: 1, minWidth: 0, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  waveBar: { width: 4, borderRadius: 2 },
  close: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
