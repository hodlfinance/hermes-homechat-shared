import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, type ColorValue, type ImageSourcePropType } from "react-native";
import neutralDragon from "../assets/baby-dragon-neutral.png";
import winkWingDragon from "../assets/baby-dragon-wink-wing.png";
import oppositeWingDragon from "../assets/baby-dragon-opposite-wing.png";

type DragonSliceProps = {
  source: ImageSourcePropType;
  size: number;
  left: number;
  top: number;
  width: number;
  height: number;
  opacity?: number | Animated.AnimatedInterpolation<number>;
  tintColor?: ColorValue;
};

function DragonSlice({ source, size, left, top, width, height, opacity = 1, tintColor }: DragonSliceProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: size * left,
        top: size * top,
        width: size * width,
        height: size * height,
        overflow: "hidden",
        opacity,
      }}
    >
      <Image
        source={source}
        style={{
          position: "absolute",
          left: -size * left,
          top: -size * top,
          width: size,
          height: size,
          tintColor,
        }}
        resizeMode="stretch"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

function DragonWingPose({
  source,
  size,
  opacity,
  tintColor,
}: {
  source: ImageSourcePropType;
  size: number;
  opacity: number | Animated.AnimatedInterpolation<number>;
  tintColor?: ColorValue;
}) {
  return (
    <>
      <DragonSlice source={source} size={size} left={0} top={0.58} width={0.38} height={0.34} opacity={opacity} tintColor={tintColor} />
      <DragonSlice source={source} size={size} left={0.62} top={0.58} width={0.38} height={0.34} opacity={opacity} tintColor={tintColor} />
    </>
  );
}

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

  const neutralWingOpacity = pose.interpolate({
    inputRange: [0, 0.12, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 1],
    outputRange: [1, 1, 0, 0, 1, 0, 0, 1, 1],
  });
  const winkWingOpacity = pose.interpolate({
    inputRange: [0, 0.12, 0.22, 0.34, 0.46, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  const oppositeWingOpacity = pose.interpolate({
    inputRange: [0, 0.46, 0.58, 0.7, 0.82, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  const faceOpacity = pose.interpolate({
    inputRange: [0, 0.16, 0.22, 0.28, 0.58, 0.64, 0.7, 1],
    outputRange: [0, 0, 1, 0, 0, 1, 0, 0],
  });

  return (
    <View
      style={{ height: size, width: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <DragonWingPose source={neutralDragon} size={size} opacity={neutralWingOpacity} tintColor={tintColor} />
      <DragonWingPose source={winkWingDragon} size={size} opacity={winkWingOpacity} tintColor={tintColor} />
      <DragonWingPose source={oppositeWingDragon} size={size} opacity={oppositeWingOpacity} tintColor={tintColor} />

      {/* These neutral slices never animate, anchoring the head and body while only wings and expression change. */}
      <DragonSlice source={neutralDragon} size={size} left={0} top={0} width={1} height={0.68} tintColor={tintColor} />
      <DragonSlice source={neutralDragon} size={size} left={0.22} top={0.68} width={0.56} height={0.32} tintColor={tintColor} />

      <DragonSlice
        source={winkWingDragon}
        size={size}
        left={0.27}
        top={0.39}
        width={0.48}
        height={0.29}
        opacity={faceOpacity}
        tintColor={tintColor}
      />
    </View>
  );
}
