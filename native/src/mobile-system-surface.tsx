import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useMobilePalette } from "./mobile-palette-context";

export const mobileSystemSurfaceMetrics = Object.freeze({
  columnGap: 12,
  horizontalInset: 16,
  iconColumnWidth: 28,
  minimumTouchTarget: 48,
  sectionGap: 24,
});

export type MobileSystemScreenProps = Readonly<{
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function MobileSystemScreen({ children, contentContainerStyle, testID }: MobileSystemScreenProps) {
  const palette = useMobilePalette();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.pageBg }]}
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
  const palette = useMobilePalette();
  return (
    <View style={styles.section} accessibilityLabel={accessibilityLabel} testID={testID}>
      {title ? (
        <Text style={[styles.sectionHeader, { color: palette.muted }]} allowFontScaling>
          {title}
        </Text>
      ) : null}
      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>{children}</View>
      {footer ? (
        <Text style={[styles.sectionFooter, { color: palette.muted }]} allowFontScaling>
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
  const palette = useMobilePalette();
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
        style={({ pressed }) => [
          styles.row,
          selected && { backgroundColor: palette.tealSoft },
          pressed && { backgroundColor: palette.tealSoft },
        ]}
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
          <Text style={[styles.label, { color: palette.ink }]} allowFontScaling>
            {label}
          </Text>
          {detail ? (
            <Text style={[styles.detail, { color: palette.text }]} allowFontScaling>
              {detail}
            </Text>
          ) : null}
          {outcome ? (
            <Text
              style={[styles.outcome, { color: error ? palette.coral : palette.muted }]}
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
            <ActivityIndicator color={palette.accent} size="small" />
          ) : trailing}
        </View>
      </Pressable>
      {separator ? <View style={[styles.separator, { backgroundColor: palette.line }]} /> : null}
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
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sectionFooter: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  rowShell: {
    alignSelf: "stretch",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: mobileSystemSurfaceMetrics.minimumTouchTarget,
    paddingHorizontal: mobileSystemSurfaceMetrics.horizontalInset,
    paddingVertical: 12,
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
    lineHeight: 22,
  },
  detail: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 3,
  },
  outcome: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  trailingColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: mobileSystemSurfaceMetrics.columnGap,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 0,
    marginRight: 0,
  },
});
