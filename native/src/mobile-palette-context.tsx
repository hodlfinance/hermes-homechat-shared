import { createContext, useContext, type ReactNode } from "react";
import { palette as defaultPalette, type MobilePalette } from "./mobile-palette";

const MobilePaletteContext = createContext<MobilePalette>(defaultPalette);

export function MobilePaletteProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MobilePalette;
}) {
  return <MobilePaletteContext.Provider value={value}>{children}</MobilePaletteContext.Provider>;
}

export function useMobilePalette(): MobilePalette {
  return useContext(MobilePaletteContext);
}
