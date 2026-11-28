export interface ThemeColors {
  /** Accent colour: buttons, active states, links. */
  gold: string;
  goldLight: string;
  teal: string;
  tealLight: string;
  /** Madder red, as in the red ink of manuscripts: verse-end markers and "due for review". */
  rubric: string;
  /** Gold leaf, used only for surah names. */
  leaf: string;
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

// "Folio": washed paper, green-black ink, madder red for the markers.
export const darkTheme: ThemeColors = {
  gold: "#4FB3AC",
  goldLight: "#7CCBC5",
  teal: "#4FB3AC",
  tealLight: "#7CCBC5",
  rubric: "#E58A92",
  leaf: "#D8B65A",
  bgDark: "#0F1729",
  bgCard: "#16203A",
  bgSurface: "#1F2B4A",
  textPrimary: "#E8ECF2",
  textSecondary: "#A9B6CF",
  textMuted: "#93A1BE",
  border: "#2B3858",
  error: "#E8828A",
  success: "#4CC38A",
};

export const lightTheme: ThemeColors = {
  gold: "#1A625E",
  goldLight: "#237A75",
  teal: "#1A625E",
  tealLight: "#237A75",
  rubric: "#9E2B3A",
  leaf: "#7A5C14",
  bgDark: "#E9EDEA",
  bgCard: "#F4F6F3",
  bgSurface: "#DDE4E0",
  textPrimary: "#14201F",
  textSecondary: "#3A4B48",
  textMuted: "#546461",
  border: "#C3CCC7",
  error: "#A3262A",
  success: "#1A7A50",
};

export const sepiaTheme: ThemeColors = {
  gold: "#1A625E",
  goldLight: "#237A75",
  teal: "#1A625E",
  tealLight: "#237A75",
  rubric: "#9E2B3A",
  leaf: "#725512",
  bgDark: "#EEE8D5",
  bgCard: "#F7F2E2",
  bgSurface: "#E2DAC2",
  textPrimary: "#2A2417",
  textSecondary: "#54482F",
  textMuted: "#6B5E41",
  border: "#CFC5A8",
  error: "#A3262A",
  success: "#3F7A45",
};

export const violetTheme: ThemeColors = {
  gold: "#1A625E",
  goldLight: "#237A75",
  teal: "#1A625E",
  tealLight: "#237A75",
  rubric: "#9E2B3A",
  leaf: "#7A5C14",
  bgDark: "#FFFFFF",
  bgCard: "#F6F7F6",
  bgSurface: "#ECEEED",
  textPrimary: "#0E0E0E",
  textSecondary: "#3D3D3D",
  textMuted: "#5E5E5E",
  border: "#D6D9D7",
  error: "#A3262A",
  success: "#1A7A50",
};

export type ThemeName = "dark" | "light" | "sepia" | "violet";
export type ArabicFontName = "system" | "naskh" | "amiriquran" | "scheherazade" | "lateef";
export type AccentColorName = "vert" | "bleu" | "bordeaux" | "lilas";
export type LineSpacingName = "serré" | "normal" | "aéré";
export type PlaybackRate = 0.75 | 1.0 | 1.25;
export type RepeatMode = 0 | 1 | 3 | 5 | 10;

export const THEMES: Record<ThemeName, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
  sepia: sepiaTheme,
  violet: violetTheme,
};

/** Noto Naskh Arabic: clear at reading size and draws every Quranic mark. */
export const DEFAULT_ARABIC_FONT: ArabicFontName = "naskh";

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

/** `primary` on the light themes, `light` on the dark one. */
export const ACCENT_COLORS: Record<AccentColorName, { primary: string; light: string }> = {
  vert:     { primary: "#1A625E", light: "#4FB3AC" },
  bleu:     { primary: "#254F8A", light: "#7AA7E0" },
  bordeaux: { primary: "#8F2433", light: "#E58A92" },
  lilas:    { primary: "#5E4189", light: "#B79BE0" },
};

export const LINE_SPACING: Record<LineSpacingName, number> = {
  "serré": 1.6,
  "normal": 1.7,
  "aéré": 2.4,
};

/** Font for surah names in lists and headers, so every name renders the same way. */
export const SURAH_NAME_FONT = "IBMPlexSansArabic_600SemiBold";
/** Calligraphic ruq'ah, for large surah headings only: too ornate for list sizes. */
export const SURAH_DISPLAY_FONT = "ArefRuqaa_700Bold";
