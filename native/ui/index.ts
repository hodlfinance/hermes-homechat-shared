// Monochrome Minimal palette — keep these keys stable for consumers.
// `teal`/`tealSoft` are legacy accent names, now mapped to neutral ink so
// existing code keeps compiling while picking up the flatter visual system.
// See /DESIGN.md for the full system.
export const palette = {
  ink: "#0b0b0c",
  text: "#3f3f46",
  muted: "#8a8a93",
  line: "#dedee1",
  surface: "#ffffff",
  pageBg: "#ffffff",
  accent: "#0b0b0c",
  accentStrong: "#000000",
  brandBlue: "#2f86e8",
  teal: "#0b0b0c",
  tealSoft: "#f3f3f5",
  coral: "#d1493f",
  coralSoft: "#f9e9e7",
  amber: "#9a6a1f",
  amberSoft: "#f3ecdd",
  violet: "#5b61d6",
  violetSoft: "#ececf6",
  green: "#2e9e6a",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const appCopy = {
  productName: "Hey Hermes",
  tagline: "Your private AI helper for everyday life, work, and ideas.",
  trialCta: "Private access",
  provisioningTitle: "Hey Hermes is getting ready for you",
  chatPlaceholder: "Message Hey Hermes",
} as const;

export type ChatTranscriptScrollDecision = "top" | "bottom" | "preserve";

export function chatTranscriptScrollDecision({
  autoFollow,
  contentHeight,
  viewportHeight,
}: {
  autoFollow: boolean;
  contentHeight: number;
  viewportHeight: number;
}): ChatTranscriptScrollDecision {
  if (contentHeight <= 0 || viewportHeight <= 0) return "preserve";
  if (contentHeight <= viewportHeight + 1) return "top";
  return autoFollow ? "bottom" : "preserve";
}
