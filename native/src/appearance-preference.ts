export type AppearancePreference = "system" | "light" | "dark";

/**
 * HPD-1238 (Justus, 2026-10-15): the screens shown before sign-in (sign-in,
 * create account, signed-out support, the opening screen) always follow the
 * phone's own appearance. The in-app Appearance setting is stored on the
 * device, survives sign-out and reinstall, and cannot be changed while signed
 * out, so it applies only after sign-in.
 *
 * An external session (HODL) renders no signed-out screen of this surface and
 * keeps the stored setting unchanged.
 */
export function effectiveAppearancePreference(input: {
  stored: AppearancePreference;
  signedIn: boolean;
  sessionMode: "standalone" | "external";
}): AppearancePreference {
  if (input.sessionMode === "standalone" && !input.signedIn) return "system";
  return input.stored;
}

/** The scheme the screens are drawn in; no system scheme reported means light. */
export function resolvedAppearanceScheme(
  preference: AppearancePreference,
  systemScheme: "light" | "dark" | null | undefined,
): "light" | "dark" {
  return preference === "system" ? (systemScheme ?? "light") : preference;
}
