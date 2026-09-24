// The host apps (HODL, Hey Hermes) provide React Native, react-native-svg and
// lucide-react-native. This package does not install them, so the native
// typecheck (tsconfig.native.json) sees them as untyped. That keeps the check
// about this package's own code: every import between native modules must
// resolve and every imported name must be exported by its source.
//
// react-native is listed name by name because its types are also used as
// types. A new import from react-native fails here with TS2305 until its name
// is added below.
declare module "react-native" {
  export type AccessibilityActionEvent = any;
  export type AccessibilityRole = any;
  export type AccessibilityState = any;
  export type ColorValue = any;
  export type ImageSourcePropType = any;
  export type ImageStyle = any;
  export type NativeScrollEvent = any;
  export type StyleProp<T = any> = any;
  export type TextStyle = any;
  export type ViewStyle = any;

  export const AccessibilityInfo: any;
  export const ActionSheetIOS: any;
  export const ActivityIndicator: any;
  export const Alert: any;
  export const Animated: any;
  export namespace Animated {
    type AnimatedInterpolation<T = any> = any;
    type Value = any;
  }
  export const AppState: any;
  export const Appearance: any;
  export const Clipboard: any;
  export const DynamicColorIOS: any;
  export const Easing: any;
  export const Image: any;
  export const Keyboard: any;
  export const KeyboardAvoidingView: any;
  export type KeyboardAvoidingView = any;
  export const Linking: any;
  export const Modal: any;
  export const PanResponder: any;
  export const Platform: any;
  export const Pressable: any;
  export const SafeAreaView: any;
  export const ScrollView: any;
  export type ScrollView = any;
  export const Share: any;
  export const StyleSheet: any;
  export const Switch: any;
  export const Text: any;
  export const TextInput: any;
  export const View: any;
  export const useColorScheme: any;
}
declare module "react-native-svg";
declare module "lucide-react-native";

// Metro resolves require("../assets/*.png") in the host bundle.
declare const require: (id: string) => any;
