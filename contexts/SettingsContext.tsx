import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeColors, ThemeName, ArabicFontName, darkTheme, lightTheme, ARABIC_FONTS } from "@/constants/themes";

const SETTINGS_KEY = "al_hifz_settings";

interface SettingsContextValue {
  theme: ThemeName;
  arabicFont: ArabicFontName;
  setTheme: (t: ThemeName) => void;
  setArabicFont: (f: ArabicFontName) => void;
  colors: ThemeColors;
  arabicFontFamily: string | undefined;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [arabicFont, setArabicFontState] = useState<ArabicFontName>("system");

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.arabicFont) setArabicFontState(parsed.arabicFont);
      }
    });
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      const existing = stored ? JSON.parse(stored) : {};
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, theme: t }));
    });
  };

  const setArabicFont = (f: ArabicFontName) => {
    setArabicFontState(f);
    AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      const existing = stored ? JSON.parse(stored) : {};
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, arabicFont: f }));
    });
  };

  const colors = useMemo(() => (theme === "dark" ? darkTheme : lightTheme), [theme]);
  const arabicFontFamily = ARABIC_FONTS[arabicFont];

  const value = useMemo(
    () => ({ theme, arabicFont, setTheme, setArabicFont, colors, arabicFontFamily }),
    [theme, arabicFont, colors, arabicFontFamily]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
