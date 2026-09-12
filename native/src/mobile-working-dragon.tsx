import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Image, View, type ColorValue, type ImageSourcePropType } from "react-native";
import neutralDragon from "../assets/baby-dragon-neutral.png";
import winkWingDragon from "../assets/baby-dragon-wink-wing.png";
import oppositeWingDragon from "../assets/baby-dragon-opposite-wing.png";
import firePuff from "../assets/baby-dragon-fire-puff.png";
import fireSpark1 from "../assets/baby-dragon-fire-spark-1.png";
import fireSpark2 from "../assets/baby-dragon-fire-spark-2.png";
import fireSpark3 from "../assets/baby-dragon-fire-spark-3.png";
import fireSpark4 from "../assets/baby-dragon-fire-spark-4.png";

const LOOP_DURATION_MS = 2_800;
const FIRE_START = 0.4643;
const FIRE_END = 0.75;
const FIRE_TIMELINE = [0, FIRE_START, 0.5, 0.5357, 0.5714, 0.6071, 0.6429, 0.6786, 0.7143, FIRE_END, 1];
const FIRE_OPACITY = [0, 0, 0.383, 0.707, 0.924, 1, 0.924, 0.707, 0.383, 0, 0];
const FIRE_SCALE = [0, 0, 0.27, 0.539, 0.756, 0.875, 0.861, 0.698, 0.4, 0, 0];

const FIRE_PARTICLES = [
  { id: "puff-left", source: firePuff, scale: 0.14, heightRatio: 0.78, startY: 0.625, xTravel: -0.12, yTravel: -0.14, rotation: "-9deg" },
  { id: "puff-center", source: firePuff, scale: 0.18, heightRatio: 0.78, startY: 0.625, xTravel: 0.02, yTravel: -0.2, rotation: "3deg" },
  { id: "puff-right", source: firePuff, scale: 0.12, heightRatio: 0.78, startY: 0.625, xTravel: 0.13, yTravel: -0.12, rotation: "12deg" },
  { id: "spark-left", source: fireSpark1, scale: 0.055, heightRatio: 1, startY: 0.62, xTravel: -0.18, yTravel: -0.15, rotation: "0deg" },
  { id: "spark-right", source: fireSpark2, scale: 0.065, heightRatio: 1, startY: 0.62, xTravel: 0.18, yTravel: -0.12, rotation: "0deg" },
  { id: "spark-high-left", source: fireSpark3, scale: 0.055, heightRatio: 1, startY: 0.62, xTravel: -0.07, yTravel: -0.24, rotation: "0deg" },
  { id: "spark-high-right", source: fireSpark4, scale: 0.065, heightRatio: 1, startY: 0.62, xTravel: 0.1, yTravel: -0.22, rotation: "0deg" },
] as const;

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

function FireParticle({
  source,
  size,
  particleScale,
  heightRatio,
  startY,
  xTravel,
  yTravel,
  rotation,
  opacity,
  scale,
  travel,
}: {
  source: ImageSourcePropType;
  size: number;
  particleScale: number;
  heightRatio: number;
  startY: number;
  xTravel: number;
  yTravel: number;
  rotation: `${number}deg`;
  opacity: Animated.AnimatedInterpolation<number>;
  scale: Animated.AnimatedInterpolation<number>;
  travel: Animated.AnimatedInterpolation<number>;
}) {
  const width = size * particleScale;
  const height = width * heightRatio;
  const translateX = travel.interpolate({ inputRange: [0, 1], outputRange: [0, size * xTravel] });
  const translateY = travel.interpolate({ inputRange: [0, 1], outputRange: [0, size * yTravel] });

  return (
    <Animated.Image
      source={source}
      resizeMode="stretch"
      accessible={false}
      accessibilityIgnoresInvertColors
      style={{
        position: "absolute",
        left: size * 0.5 - width / 2,
        top: size * startY - height / 2,
        width,
        height,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: rotation }, { scale }],
      }}
    />
  );
}

export const MobileWorkingDragon = memo(function MobileWorkingDragon({
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
      duration: LOOP_DURATION_MS,
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
    inputRange: [0, 0.16, 0.18, 0.29, 0.31, 0.34, 0.36, 0.46, 0.48, 0.73, 0.75, 0.89, 0.91, 1],
    outputRange: [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  });
  const winkWingOpacity = pose.interpolate({
    inputRange: [0, 0.16, 0.18, 0.29, 0.31, 0.81, 0.83, 0.89, 0.91, 1],
    outputRange: [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  });
  const oppositeWingOpacity = pose.interpolate({
    inputRange: [0, 0.34, 0.36, 0.46, 0.48, 0.73, 0.75, 0.81, 0.83, 1],
    outputRange: [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  });
  const fireOpacity = pose.interpolate({
    inputRange: FIRE_TIMELINE,
    outputRange: FIRE_OPACITY,
  });
  const fireScale = pose.interpolate({
    inputRange: FIRE_TIMELINE,
    outputRange: FIRE_SCALE,
  });
  const fireTravel = pose.interpolate({
    inputRange: [0, FIRE_START, FIRE_END, 1],
    outputRange: [0, 0, 1, 1],
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
        opacity={winkWingOpacity}
        tintColor={tintColor}
      />

      {/* HPD-663 selected variant: warm puffs start at the mouth, then rise upward and fade. */}
      {animated && FIRE_PARTICLES.map((particle) => (
        <FireParticle
          key={particle.id}
          source={particle.source}
          size={size}
          particleScale={particle.scale}
          heightRatio={particle.heightRatio}
          startY={particle.startY}
          xTravel={particle.xTravel}
          yTravel={particle.yTravel}
          rotation={particle.rotation}
          opacity={fireOpacity}
          scale={fireScale}
          travel={fireTravel}
        />
      ))}
    </View>
  );
});
