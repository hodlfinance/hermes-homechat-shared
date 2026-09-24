// Lightweight stand-ins for the React Native modules the shared surface
// imports. Components become plain host elements (react-test-renderer renders
// any string type), platform APIs become inert no-ops. Nothing here talks to a
// device, a network or a store.
import { createElement, type ReactNode } from "react";

type AnyRecord = Record<string, unknown>;

const noop = () => undefined;
const subscription = () => ({ remove: noop });

function host(name: string) {
  const component = (props: AnyRecord & { children?: ReactNode }) => createElement(name, props, props.children);
  component.displayName = name;
  return component;
}

/** Any unknown capitalised name is a host component, anything else a no-op function. */
function fallbackProxy(known: AnyRecord) {
  const cache = new Map<string, unknown>();
  return new Proxy(known, {
    get(target, key) {
      if (typeof key !== "string") return undefined;
      if (key in target) return target[key];
      if (key === "__esModule") return false;
      if (key === "default") return target;
      if (!cache.has(key)) cache.set(key, /^[A-Z]/.test(key) ? host(key) : noop);
      return cache.get(key);
    },
  });
}

function inertNamespace(): AnyRecord {
  return new Proxy({}, {
    get: (_target, key) => (key === "then" ? undefined : (..._args: unknown[]) => undefined),
  });
}

class AnimatedValue {
  private value: number;
  constructor(value = 0) { this.value = value; }
  setValue(value: number) { this.value = value; }
  setOffset() {}
  flattenOffset() {}
  stopAnimation(callback?: (value: number) => void) { callback?.(this.value); }
  resetAnimation() {}
  addListener() { return "listener"; }
  removeListener() {}
  removeAllListeners() {}
  interpolate() { return this; }
  __getValue() { return this.value; }
}

const animation = () => ({ start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }), stop: noop, reset: noop });

const easingFn = (t: number) => t;
const Easing = new Proxy({}, {
  get: () => (...args: unknown[]) => (typeof args[0] === "function" || args.length ? easingFn : easingFn),
});

function flatten(style: unknown): AnyRecord {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return typeof style === "object" ? (style as AnyRecord) : {};
}

export const reactNativeStub = fallbackProxy({
  Platform: { OS: "ios", Version: "18.0", isPad: false, isTV: false, select: (spec: AnyRecord) => ("ios" in spec ? spec.ios : spec.default) },
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    flatten,
    compose: (a: unknown, b: unknown) => [a, b],
    hairlineWidth: 1,
    absoluteFill: {},
    absoluteFillObject: {},
  },
  Animated: fallbackProxy({
    Value: AnimatedValue,
    ValueXY: AnimatedValue,
    View: host("Animated.View"),
    Image: host("Animated.Image"),
    Text: host("Animated.Text"),
    ScrollView: host("Animated.ScrollView"),
    timing: animation,
    spring: animation,
    decay: animation,
    loop: animation,
    parallel: animation,
    sequence: animation,
    stagger: animation,
    delay: animation,
    event: () => noop,
    createAnimatedComponent: (component: unknown) => component,
    add: (a: unknown) => a,
    multiply: (a: unknown) => a,
    diffClamp: (a: unknown) => a,
  }),
  Easing,
  Dimensions: { get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }), addEventListener: subscription },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  useColorScheme: () => "light",
  Appearance: { getColorScheme: () => "light", setColorScheme: noop, addChangeListener: subscription },
  AppState: { currentState: "active", addEventListener: subscription },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(true),
    isScreenReaderEnabled: () => Promise.resolve(false),
    addEventListener: subscription,
    announceForAccessibility: noop,
    setAccessibilityFocus: noop,
  },
  Keyboard: { addListener: subscription, dismiss: noop, removeAllListeners: noop, isVisible: () => false, metrics: () => undefined },
  Linking: {
    getInitialURL: () => Promise.resolve(null),
    addEventListener: subscription,
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(false),
  },
  Alert: { alert: noop, prompt: noop },
  Clipboard: { setString: noop, getString: () => Promise.resolve("") },
  Share: { share: () => Promise.resolve({ action: "dismissedAction" }) },
  ActionSheetIOS: { showActionSheetWithOptions: noop },
  InteractionManager: { runAfterInteractions: (callback?: () => void) => { callback?.(); return { cancel: noop }; } },
  PanResponder: { create: () => ({ panHandlers: {} }) },
  LayoutAnimation: inertNamespace(),
  UIManager: inertNamespace(),
  I18nManager: { isRTL: false, allowRTL: noop, forceRTL: noop },
  PixelRatio: { get: () => 3, getFontScale: () => 1, roundToNearestPixel: (value: number) => value },
  Vibration: { vibrate: noop, cancel: noop },
  DynamicColorIOS: (colors: { light: string }) => colors.light,
  PlatformColor: (name: string) => name,
  processColor: (color: unknown) => color,
  findNodeHandle: () => null,
  NativeModules: {},
});

export const reactNativeSvgStub = fallbackProxy({ default: host("Svg") });

/** Every lucide icon is one inert host element named after the icon. */
export const lucideStub = fallbackProxy({});

/** createNodeMock for react-test-renderer: every ref method is an inert function. */
export function inertNodeRef() {
  return new Proxy({}, {
    get: (_target, key) => (key === "then" ? undefined : (..._args: unknown[]) => undefined),
  });
}
