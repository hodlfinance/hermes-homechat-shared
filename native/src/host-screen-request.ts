/**
 * HPD-1582 (Justus, 2026-10-23, variant B): a host opens one Hermes settings
 * screen directly, for example from its own account page ("Hermes settings"
 * in HODL and LiveQuote). The surface keeps the screens; the host names one.
 */
export type NativeR8HostScreen =
  | "ai_access"
  | "connections"
  | "automations"
  | "privacy"
  | "your_data"
  | "access_history"
  | "dashboard";

export type NativeR8ScreenRequest = {
  screen: NativeR8HostScreen;
  requestId: string;
  /**
   * Called once the surface has taken the request, so the host can clear it
   * and a remounted surface does not open the screen again.
   */
  onAccepted?: ((requestId: string) => void) | null;
};

/** What the surface does for one requested screen. */
export type NativeR8HostScreenTarget =
  | { kind: "tab"; tab: "ai_access" | "connections_customer" | "automations" | "account"; anchor: "access_history" | null }
  | { kind: "privacy" }
  | { kind: "dashboard" };

export const NATIVE_R8_HOST_SCREENS: readonly NativeR8HostScreen[] = [
  "ai_access",
  "connections",
  "automations",
  "privacy",
  "your_data",
  "access_history",
  "dashboard",
];

/** The same destinations as the "..." menu; null for a name the surface does not know. */
export function nativeR8HostScreenTarget(screen: unknown): NativeR8HostScreenTarget | null {
  switch (screen) {
    case "ai_access":
      return { kind: "tab", tab: "ai_access", anchor: null };
    case "connections":
      return { kind: "tab", tab: "connections_customer", anchor: null };
    case "automations":
      return { kind: "tab", tab: "automations", anchor: null };
    // "Your data" (export, archive, recent exports, restore) heads the account page.
    case "your_data":
      return { kind: "tab", tab: "account", anchor: null };
    // The access history sits further down the account page; the page scrolls to it.
    case "access_history":
      return { kind: "tab", tab: "account", anchor: "access_history" };
    case "privacy":
      return { kind: "privacy" };
    case "dashboard":
      return { kind: "dashboard" };
    default:
      return null;
  }
}
