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

export const sepiaTheme: ThemeColors = {
  gold: "#A0722A",
  goldLight: "#C49A3C",
  teal: "#5C7A5A",
  tealLight: "#7A9E78",
  bgDark: "#F5EDD8",
  bgCard: "#FDF6E3",
  bgSurface: "#EDE0C4",
  textPrimary: "#2C1A08",
  textSecondary: "#6B4C28",
  textMuted: "#9E7A50",
  border: "#D4B896",
  error: "#B03030",
  success: "#4A7A45",
};

export const violetTheme: ThemeColors = {
  gold: "#B8860B",
  goldLight: "#C9A227",
  teal: "#1A8C7A",
  tealLight: "#26B399",
  bgDark: "#FFFFFF",
  bgCard: "#F5F5F5",
  bgSurface: "#EBEBEB",
  textPrimary: "#111111",
  textSecondary: "#444444",
  textMuted: "#888888",
  border: "#DDDDDD",
  error: "#CC2222",
  success: "#1A7A50",
};

export type ThemeName = "dark" | "light" | "sepia" | "violet";
export type ArabicFontName = "system" | "naskh" | "amiriquran" | "scheherazade" | "lateef";
export type AccentColorName = "or" | "emeraude" | "bleu" | "bordeaux" | "lilas";
export type LineSpacingName = "serré" | "normal" | "aéré";
export type PlaybackRate = 0.75 | 1.0 | 1.25;
export type RepeatMode = 0 | 1 | 3 | 5 | 10;

export const THEMES: Record<ThemeName, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
  sepia: sepiaTheme,
  violet: violetTheme,
};

export const ARABIC_FONTS: Record<ArabicFontName, string | undefined> = {
  system: undefined,
  naskh: "NotoNaskhArabic_400Regular",
  amiriquran: "AmiriQuran_400Regular",
  scheherazade: "ScheherazadeNew_400Regular",
  lateef: "Lateef_400Regular",
};

export function getFontSizeMultiplier(fontKey: string): number {
  return fontKey === "lateef" ? 1.2 : 1.0;
}

export interface ReciterEntry {
  id: string;
  labelAr: string;
  folder?: string;
  surahUrl?: string;
  missingSurahs?: number[];
}

export const RECITERS_LIST: ReciterEntry[] = [
  { id: "alafasy",  labelAr: "مشاري راشد العفاسي",  folder: "Alafasy_128kbps" },
  { id: "sudais",   labelAr: "عبد الرحمن السديس",    folder: "Abdurrahmaan_As-Sudais_192kbps" },
  { id: "shaatree", labelAr: "أبو بكر الشاطري",      folder: "Abu_Bakr_Ash-Shaatree_128kbps" },
  { id: "dussary",  labelAr: "ياسر الدوسري",         folder: "Yasser_Ad-Dussary_128kbps" },
  { id: "ayyoub",   labelAr: "محمد أيوب",            folder: "Muhammad_Ayyoub_128kbps" },
  { id: "husary",   labelAr: "محمود خليل الحصري",    folder: "Husary_128kbps" },
  { id: "jibreel",  labelAr: "محمد جبريل",           folder: "Muhammad_Jibreel_128kbps" },
  { id: "kurdi",    labelAr: "رعد محمد الكردي",      surahUrl: "https://server6.mp3quran.net/kurdi/{SSS}.mp3" },
  { id: "sobhi",    labelAr: "إسلام صبحي",           surahUrl: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/{SSS}.mp3", missingSurahs: [4,7,9,37,39,40,45,65] },
];

export const DEFAULT_RECITER_ID = "alafasy";

export const ACCENT_COLORS: Record<AccentColorName, { primary: string; light: string }> = {
  or:       { primary: "#C9A227", light: "#E8C547" },
  emeraude: { primary: "#27AE60", light: "#2ECC71" },
  bleu:     { primary: "#2980B9", light: "#3498DB" },
  bordeaux: { primary: "#C0392B", light: "#E74C3C" },
  lilas:    { primary: "#8E44AD", light: "#9B59B6" },
};

export const LINE_SPACING: Record<LineSpacingName, number> = {
  "serré": 1.6,
  "normal": 1.7,
  "aéré": 2.4,
};
