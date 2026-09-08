import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, type ColorValue, type StyleProp, type TextStyle } from "react-native";

/**
 * The status line beside the working dragon. A soft band travels across the
 * text from left to right, which is what tells the customer at a glance that
 * Hermes is still moving rather than stuck.
 *
 * The band is built from plain slices rather than a gradient so the app needs
 * no extra native dependency for one decoration. Motion stops entirely when the
 * system asks for reduced motion, and the text alone still says the state.
 */
// Enough slices that the ramp reads as a gradient rather than as a block
// sliding over the words.
const BAND_SLICE_OPACITIES = [
  0.02, 0.05, 0.1, 0.17, 0.26, 0.36, 0.44, 0.36, 0.26, 0.17, 0.1, 0.05, 0.02,
] as const;
const BAND_WIDTH = 130;
const SWEEP_DURATION_MS = 1_650;

export function MobileStatusShimmerText({
  text,
  style,
  animated,
  bandColor = "#ffffff",
  accessibilityLabel,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  animated: boolean;
  bandColor?: ColorValue;
  accessibilityLabel?: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const widthRef = useRef(0);

  useEffect(() => {
    if (!animated) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SWEEP_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, progress]);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
      }}
    >
      <Text
        accessibilityLabel={accessibilityLabel ?? text}
        ellipsizeMode="tail"
        numberOfLines={1}
        style={style}
      >
        {text}
      </Text>
      {animated ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.band,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    // Start fully clear of the left edge and finish fully clear
                    // of the right one, so the band never sits still on the text.
                    outputRange: [-BAND_WIDTH, Math.max(widthRef.current, 160) + BAND_WIDTH],
                  }),
                },
              ],
            },
          ]}
        >
          {BAND_SLICE_OPACITIES.map((opacity, index) => (
            <View
              key={index}
              style={[styles.bandSlice, { backgroundColor: bandColor, opacity }]}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    overflow: "hidden",
  },
  band: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    width: BAND_WIDTH,
  },
  bandSlice: {
    flex: 1,
  },
});
