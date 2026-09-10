import { useEffect, useRef } from "react";
import { Animated, Easing, View, type ColorValue } from "react-native";
import neutralDragon from "../assets/baby-dragon-neutral.png";
import winkWingDragon from "../assets/baby-dragon-wink-wing.png";
import oppositeWingDragon from "../assets/baby-dragon-opposite-wing.png";

export function MobileWorkingDragon({
  accessibilityLabel = "Hermes is working",
  animated,
  size = 32,
  tintColor,
}: {
  accessibilityLabel?: string;
  animated: boolean;
  size?: number;
  tintColor?: ColorValue;
}) {
  const pose = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pose.stopAnimation();
    pose.setValue(0);
    if (!animated) return;

    const loop = Animated.loop(Animated.timing(pose, {
      duration: 1_700,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    }));
    loop.start();
    return () => {
      loop.stop();
      pose.stopAnimation();
      pose.setValue(0);
    };
  }, [animated, pose]);

  const neutralPoseOpacity = pose.interpolate({
    inputRange: [0, 0.12, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 1],
    outputRange: [1, 1, 0, 0, 1, 0, 0, 1, 1],
  });
  const winkPoseOpacity = pose.interpolate({
    inputRange: [0, 0.12, 0.22, 0.34, 0.46, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  const oppositePoseOpacity = pose.interpolate({
    inputRange: [0, 0.46, 0.58, 0.7, 0.82, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  return (
    <View
      style={{ height: size, width: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.Image
        source={neutralDragon}
        style={{ position: "absolute", height: size, width: size, opacity: neutralPoseOpacity, tintColor }}
        resizeMode="stretch"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
      <Animated.Image
        source={winkWingDragon}
        style={{ position: "absolute", height: size, width: size, opacity: winkPoseOpacity, tintColor }}
        resizeMode="stretch"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
      <Animated.Image
        source={oppositeWingDragon}
        style={{ position: "absolute", height: size, width: size, opacity: oppositePoseOpacity, tintColor }}
        resizeMode="stretch"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
