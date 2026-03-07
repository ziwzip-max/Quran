import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ThemeColors, ThemeName, ArabicFontName, AccentColorName, LineSpacingName,
  darkTheme, lightTheme, ARABIC_FONTS, ACCENT_COLORS, LINE_SPACING,
} from "@/constants/themes";

const SETTINGS_KEY = "al_hifz_settings";

interface SettingsContextValue {
  theme: ThemeName;
  arabicFont: ArabicFontName;
  accentColor: AccentColorName;
  lineSpacing: LineSpacingName;
  hideVerseNumbers: boolean;
  showVerseOfDay: boolean;
  highlightActiveVerse: boolean;
  setTheme: (t: ThemeName) => void;
  setArabicFont: (f: ArabicFontName) => void;
  setAccentColor: (a: AccentColorName) => void;
  setLineSpacing: (l: LineSpacingName) => void;
  setHideVerseNumbers: (v: boolean) => void;
  setShowVerseOfDay: (v: boolean) => void;
  setHighlightActiveVerse: (v: boolean) => void;
  colors: ThemeColors;
  arabicFontFamily: string | undefined;
  lineSpacingValue: number;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

async function loadSettings() {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

async function saveSettings(patch: object) {
  try {
    const existing = await loadSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [arabicFont, setArabicFontState] = useState<ArabicFontName>("system");
  const [accentColor, setAccentColorState] = useState<AccentColorName>("or");
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingName>("normal");
  const [hideVerseNumbers, setHideVerseNumbersState] = useState(false);
  const [showVerseOfDay, setShowVerseOfDayState] = useState(true);
  const [highlightActiveVerse, setHighlightActiveVerseState] = useState(false);

  useEffect(() => {
    loadSettings().then((p) => {
      if (p.theme) setThemeState(p.theme);
      if (p.arabicFont) setArabicFontState(p.arabicFont);
      if (p.accentColor) setAccentColorState(p.accentColor);
      if (p.lineSpacing) setLineSpacingState(p.lineSpacing);
      if (p.hideVerseNumbers !== undefined) setHideVerseNumbersState(p.hideVerseNumbers);
      if (p.showVerseOfDay !== undefined) setShowVerseOfDayState(p.showVerseOfDay);
      if (p.highlightActiveVerse !== undefined) setHighlightActiveVerseState(p.highlightActiveVerse);
    });
  }, []);

  const setTheme = (t: ThemeName) => { setThemeState(t); saveSettings({ theme: t }); };
  const setArabicFont = (f: ArabicFontName) => { setArabicFontState(f); saveSettings({ arabicFont: f }); };
  const setAccentColor = (a: AccentColorName) => { setAccentColorState(a); saveSettings({ accentColor: a }); };
  const setLineSpacing = (l: LineSpacingName) => { setLineSpacingState(l); saveSettings({ lineSpacing: l }); };
  const setHideVerseNumbers = (v: boolean) => { setHideVerseNumbersState(v); saveSettings({ hideVerseNumbers: v }); };
  const setShowVerseOfDay = (v: boolean) => { setShowVerseOfDayState(v); saveSettings({ showVerseOfDay: v }); };
  const setHighlightActiveVerse = (v: boolean) => { setHighlightActiveVerseState(v); saveSettings({ highlightActiveVerse: v }); };

  const colors = useMemo<ThemeColors>(() => {
    const base = theme === "dark" ? darkTheme : lightTheme;
    const accent = ACCENT_COLORS[accentColor];
    return { ...base, gold: accent.primary, goldLight: accent.light };
  }, [theme, accentColor]);

  const arabicFontFamily = ARABIC_FONTS[arabicFont];
  const lineSpacingValue = LINE_SPACING[lineSpacing];

  const value = useMemo(
    () => ({
      theme, arabicFont, accentColor, lineSpacing,
      hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
      setTheme, setArabicFont, setAccentColor, setLineSpacing,
      setHideVerseNumbers, setShowVerseOfDay, setHighlightActiveVerse,
      colors, arabicFontFamily, lineSpacingValue,
    }),
    [theme, arabicFont, accentColor, lineSpacing,
     hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
     colors, arabicFontFamily, lineSpacingValue]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
