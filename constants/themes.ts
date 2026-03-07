export interface ThemeColors {
  gold: string;
  goldLight: string;
  teal: string;
  tealLight: string;
  bgDark: string;
  bgCard: string;
  bgSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
}

export const darkTheme: ThemeColors = {
  gold: "#C9A227",
  goldLight: "#E8C547",
  teal: "#1A8C7A",
  tealLight: "#26B399",
  bgDark: "#0A0E1A",
  bgCard: "#131929",
  bgSurface: "#1C2438",
  textPrimary: "#F0EAD6",
  textSecondary: "#8B9DC3",
  textMuted: "#4A5880",
  border: "#1E2C4A",
  error: "#E05555",
  success: "#2DB87F",
};

export const lightTheme: ThemeColors = {
  gold: "#B8860B",
  goldLight: "#C9A227",
  teal: "#1A8C7A",
  tealLight: "#26B399",
  bgDark: "#F5F0E8",
  bgCard: "#FFFFFF",
  bgSurface: "#EDE8DF",
  textPrimary: "#1A1208",
  textSecondary: "#5C4A2A",
  textMuted: "#8B7355",
  border: "#D4C9B0",
  error: "#CC2222",
  success: "#1A7A50",
};

export type ThemeName = "dark" | "light";
export type ArabicFontName = "system" | "naskh" | "amiri";

export const ARABIC_FONTS: Record<ArabicFontName, string | undefined> = {
  system: undefined,
  naskh: "NotoNaskhArabic_400Regular",
  amiri: "Amiri_400Regular",
};
