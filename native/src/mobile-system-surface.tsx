import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export const mobileSystemSurfaceMetrics = Object.freeze({
  columnGap: 12,
  horizontalInset: 20,
  iconColumnWidth: 28,
  minimumTouchTarget: 44,
  sectionGap: 28,
});

const lightPalette = Object.freeze({
  background: "#F2F2F7",
  error: "#D70015",
  label: "#000000",
  secondaryLabel: "#5C5C60",
  separator: "rgba(60, 60, 67, 0.29)",
  spinner: "#007AFF",
});

const darkPalette = Object.freeze({
  background: "#000000",
  error: "#FF6961",
  label: "#FFFFFF",
  secondaryLabel: "#AEAEB2",
  separator: "rgba(84, 84, 88, 0.65)",
  spinner: "#0A84FF",
});

function useMobileSystemSurfacePalette() {
  return useColorScheme() === "dark" ? darkPalette : lightPalette;
}

export type MobileSystemScreenProps = Readonly<{
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function MobileSystemScreen({ children, contentContainerStyle, testID }: MobileSystemScreenProps) {
  const palette = useMobileSystemSurfacePalette();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      contentInsetAdjustmentBehavior="automatic"
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}

export type MobileSystemSectionProps = Readonly<{
  accessibilityLabel?: string;
  children: ReactNode;
  footer?: string;
  testID?: string;
  title?: string;
}>;

export function MobileSystemSection({
  accessibilityLabel,
  children,
  footer,
  testID,
  title,
}: MobileSystemSectionProps) {
  const palette = useMobileSystemSurfacePalette();
  return (
    <View style={styles.section} accessibilityLabel={accessibilityLabel} testID={testID}>
      {title ? (
        <Text style={[styles.sectionHeader, { color: palette.secondaryLabel }]} allowFontScaling>
          {title}
        </Text>
      ) : null}
      <View>{children}</View>
      {footer ? (
        <Text style={[styles.sectionFooter, { color: palette.secondaryLabel }]} allowFontScaling>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export type MobileSystemRowProps = Readonly<{
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  detail?: string;
  disabled?: boolean;
  error?: string | null;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  pending?: boolean;
  reserveIconSpace?: boolean;
  separator?: boolean;
  status?: string | null;
  testID?: string;
  trailing?: ReactNode;
}>;

export function MobileSystemRow({
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  detail,
  disabled = false,
  error,
  icon,
  label,
  onPress,
  pending = false,
  reserveIconSpace = true,
  separator = true,
  status,
  testID,
  trailing,
}: MobileSystemRowProps) {
  const palette = useMobileSystemSurfacePalette();
  const selected = accessibilityState?.selected === true;
  const showIconColumn = Boolean(icon) || reserveIconSpace;
  const rowDisabled = disabled || pending;
  const outcome = error ?? status;
  const resolvedAccessibilityLabel = accessibilityLabel ?? [label, detail, outcome].filter(Boolean).join(", ");
  const resolvedAccessibilityState: AccessibilityState = {
    ...accessibilityState,
    busy: pending,
    disabled: rowDisabled,
  };

  return (
    <View style={styles.rowShell} testID={testID}>
      <Pressable
        accessible
        accessibilityHint={accessibilityHint}
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={resolvedAccessibilityState}
        disabled={rowDisabled}
        onPress={onPress}
        style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
      >
        {showIconColumn ? (
          <View
            style={styles.iconColumn}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {icon}
          </View>
        ) : null}
        <View style={styles.textColumn}>
          <Text style={[styles.label, { color: palette.label }]} allowFontScaling>
            {label}
          </Text>
          {detail ? (
            <Text style={[styles.detail, { color: palette.secondaryLabel }]} allowFontScaling>
              {detail}
            </Text>
          ) : null}
          {outcome ? (
            <Text
              style={[styles.outcome, { color: error ? palette.error : palette.secondaryLabel }]}
              accessibilityLiveRegion="polite"
              accessibilityRole={error ? "alert" : "text"}
              allowFontScaling
            >
              {outcome}
            </Text>
          ) : null}
        </View>
        <View
          style={styles.trailingColumn}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {pending ? (
            <ActivityIndicator color={palette.spinner} size="small" />
          ) : trailing}
        </View>
      </Pressable>
      {separator ? <View style={[styles.separator, { backgroundColor: palette.separator }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    paddingBottom: 32,
    paddingTop: 20,
  },
  section: {
    marginBottom: mobileSystemSurfaceMetrics.sectionGap,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    textTransform: "uppercase",
  },
  sectionFooter: {
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
  },
  rowShell: {
    alignSelf: "stretch",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 10,
  },
  rowPressed: {
    backgroundColor: "rgba(127, 127, 127, 0.16)",
  },
  rowSelected: {
    backgroundColor: "rgba(127, 127, 127, 0.16)",
  },
  iconColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: mobileSystemSurfaceMetrics.columnGap,
    width: mobileSystemSurfaceMetrics.iconColumnWidth,
  },
  textColumn: {
    flex: 1,
    flexShrink: 1,
  },
  label: {
    fontSize: 17,
  },
  detail: {
    flexShrink: 1,
    fontSize: 15,
    marginTop: 3,
  },
  outcome: {
    flexShrink: 1,
    fontSize: 13,
    marginTop: 4,
  },
  trailingColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: mobileSystemSurfaceMetrics.columnGap,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft:
      mobileSystemSurfaceMetrics.horizontalInset
      + mobileSystemSurfaceMetrics.iconColumnWidth
      + mobileSystemSurfaceMetrics.columnGap,
    marginRight: mobileSystemSurfaceMetrics.horizontalInset,
  },
});
