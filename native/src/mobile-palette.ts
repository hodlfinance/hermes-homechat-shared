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
 * Nothing here changes a light-mode colour.
 */
const plainPalette = {
  ...sharedPalette,
  /** What stays legible on top of `accent`, which inverts between the two modes. */
  accentText: sharedPalette.pageBg,
  greenSoft: "#e8f6ee",
} as const;

export type MobilePaletteKey = keyof typeof plainPalette;
export type MobilePalette = Readonly<Record<MobilePaletteKey, ColorValue>>;

const iosPalette: MobilePalette = {
  ink: DynamicColorIOS({ light: sharedPalette.ink, dark: "#f5f5f7" }),
  text: DynamicColorIOS({ light: sharedPalette.text, dark: "#e4e4e7" }),
  muted: DynamicColorIOS({ light: sharedPalette.muted, dark: "#a1a1aa" }),
  line: DynamicColorIOS({ light: sharedPalette.line, dark: "#34343a" }),
  surface: DynamicColorIOS({ light: sharedPalette.surface, dark: "#18181b" }),
  pageBg: DynamicColorIOS({ light: sharedPalette.pageBg, dark: "#0b0b0c" }),
  accent: DynamicColorIOS({ light: sharedPalette.accent, dark: "#f5f5f7" }),
  accentStrong: DynamicColorIOS({ light: sharedPalette.accentStrong, dark: sharedPalette.brandBlue }),
  accentText: DynamicColorIOS({ light: sharedPalette.pageBg, dark: "#0b0b0c" }),
  brandBlue: DynamicColorIOS({ light: sharedPalette.brandBlue, dark: "#93c5fd" }),
  teal: DynamicColorIOS({ light: sharedPalette.teal, dark: "#f5f5f7" }),
  tealSoft: DynamicColorIOS({ light: sharedPalette.tealSoft, dark: "#27272a" }),
  coral: DynamicColorIOS({ light: sharedPalette.coral, dark: "#fca5a5" }),
  coralSoft: DynamicColorIOS({ light: sharedPalette.coralSoft, dark: "#3b2323" }),
  amber: DynamicColorIOS({ light: sharedPalette.amber, dark: "#fde68a" }),
  amberSoft: DynamicColorIOS({ light: sharedPalette.amberSoft, dark: "#3a3020" }),
  violet: DynamicColorIOS({ light: sharedPalette.violet, dark: "#c7cbf7" }),
  violetSoft: DynamicColorIOS({ light: sharedPalette.violetSoft, dark: "#29283c" }),
  green: DynamicColorIOS({ light: sharedPalette.green, dark: "#86efac" }),
  greenSoft: DynamicColorIOS({ light: "#e8f6ee", dark: "#193528" }),
};

export const palette: MobilePalette = Platform.OS === "ios" ? iosPalette : plainPalette;
