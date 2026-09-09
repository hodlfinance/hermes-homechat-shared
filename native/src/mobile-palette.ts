import { DynamicColorIOS, Platform, type ColorValue } from "react-native";
import { palette as sharedPalette } from "../ui/index";

/**
 * The one palette every Mobile surface paints from (HPD-461).
 *
 * `@hermes/ui` carries the light values that Web and Mobile share. On iOS each
 * of them is paired here with the value it takes in dark mode, so a colour is
 * never defined for only one of the two appearances. Text and the surface it
 * stands on come out of the same pair, which is the whole point: a heading and
 * its card can no longer drift apart into black-on-black or white-on-dark.
 *
 * Before this module four files each built their own near-copy of this list and
 * two more used the light values directly. Those two were the defect: in dark
 * mode the "Aufgaben" heading and the "Diesen Hey-Account löschen" heading were
 * `#0b0b0c` on a dark surface and the task cards stayed `#ffffff`. The copies
 * had also already drifted — the two secure forms drew their dark separator at
 * `#52525b` while everything else used `#34343a`.
 *
 * HPD-647 binds the accepted Light 2a and Dark 1c (Nocturne) visual systems
 * to this single product-neutral native palette. Existing component aliases
 * (`teal`, `tealSoft`, `accentStrong`) stay in place so consumers keep the
 * same behavior while receiving the approved visual treatment.
 */
const lightPalette = {
  ...sharedPalette,
  text: "#2a2a30",
  line: "#eeeef1",
  accent: "#2f86e8",
  accentStrong: "#2f86e8",
  teal: "#2f86e8",
  tealSoft: "#f3f3f5",
  secondary: "#5c5c60",
  lineStrong: "#dedee1",
  userTint: "#e8f1fc",
  chromeLine: "#eeeef1",
  /** What stays legible on top of `accent`, which inverts between the two modes. */
  accentText: "#ffffff",
  greenSoft: "#e8f6ee",
} as const;

export type MobilePaletteKey = keyof typeof lightPalette;
export type MobilePalette = Readonly<Record<MobilePaletteKey, ColorValue>>;

const iosPalette: MobilePalette = {
  ink: DynamicColorIOS({ light: lightPalette.ink, dark: "#e9e9ed" }),
  text: DynamicColorIOS({ light: lightPalette.text, dark: "#e9e9ed" }),
  muted: DynamicColorIOS({ light: lightPalette.muted, dark: "#cfd3e5" }),
  line: DynamicColorIOS({ light: lightPalette.line, dark: "#3f424d" }),
  surface: DynamicColorIOS({ light: lightPalette.surface, dark: "#292b31" }),
  pageBg: DynamicColorIOS({ light: lightPalette.pageBg, dark: "#161826" }),
  accent: DynamicColorIOS({ light: lightPalette.accent, dark: "#9184d9" }),
  accentStrong: DynamicColorIOS({ light: lightPalette.accentStrong, dark: "transparent" }),
  accentText: DynamicColorIOS({ light: lightPalette.accentText, dark: "#e9e9ed" }),
  brandBlue: DynamicColorIOS({ light: lightPalette.brandBlue, dark: "#d2cefd" }),
  teal: DynamicColorIOS({ light: lightPalette.teal, dark: "#d2cefd" }),
  tealSoft: DynamicColorIOS({ light: lightPalette.tealSoft, dark: "#3f424d" }),
  secondary: DynamicColorIOS({ light: lightPalette.secondary, dark: "#e4e7f5" }),
  lineStrong: DynamicColorIOS({ light: lightPalette.lineStrong, dark: "#595d6c" }),
  userTint: DynamicColorIOS({ light: lightPalette.userTint, dark: "#3f424d" }),
  chromeLine: DynamicColorIOS({ light: lightPalette.chromeLine, dark: "#9184d9" }),
  coral: DynamicColorIOS({ light: lightPalette.coral, dark: "#fca5a5" }),
  coralSoft: DynamicColorIOS({ light: lightPalette.coralSoft, dark: "rgba(252,165,165,0.12)" }),
  amber: DynamicColorIOS({ light: lightPalette.amber, dark: "#fde68a" }),
  amberSoft: DynamicColorIOS({ light: lightPalette.amberSoft, dark: "rgba(253,230,138,0.14)" }),
  violet: DynamicColorIOS({ light: lightPalette.violet, dark: "#d2cefd" }),
  violetSoft: DynamicColorIOS({ light: lightPalette.violetSoft, dark: "#3f424d" }),
  green: DynamicColorIOS({ light: lightPalette.green, dark: "#d2cefd" }),
  greenSoft: DynamicColorIOS({ light: lightPalette.greenSoft, dark: "#3f424d" }),
};

export const palette: MobilePalette = Platform.OS === "ios" ? iosPalette : lightPalette;
