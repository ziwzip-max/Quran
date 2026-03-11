import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ThemeColors, ThemeName, ArabicFontName, AccentColorName, LineSpacingName,
  PlaybackRate, RepeatMode,
  THEMES, ARABIC_FONTS, ACCENT_COLORS, LINE_SPACING,
  DEFAULT_RECITER_ID,
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
  reciterId: string;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  showTajweed: boolean;
  continuousPlay: boolean;
  qiraa: "hafs" | "qaloon";
  notifEnabled: boolean;
  notifHour: number;
  notifMinute: number;
  autoNightMode: boolean;
  setTheme: (t: ThemeName) => void;
  setArabicFont: (f: ArabicFontName) => void;
  setAccentColor: (a: AccentColorName) => void;
  setLineSpacing: (l: LineSpacingName) => void;
  setHideVerseNumbers: (v: boolean) => void;
  setShowVerseOfDay: (v: boolean) => void;
  setHighlightActiveVerse: (v: boolean) => void;
  setReciterId: (id: string) => void;
  setPlaybackRate: (r: PlaybackRate) => void;
  setRepeatMode: (m: RepeatMode) => void;
  setShowTajweed: (v: boolean) => void;
  setContinuousPlay: (v: boolean) => void;
  setQiraa: (q: "hafs" | "qaloon") => void;
  setNotifEnabled: (v: boolean) => void;
  setNotifHour: (h: number) => void;
  setNotifMinute: (m: number) => void;
  setAutoNightMode: (v: boolean) => void;
  arabicFontSize: number;
  setArabicFontSize: (s: number) => void;
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

const INVALID_FONTS: string[] = ["cairo"];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [arabicFont, setArabicFontState] = useState<ArabicFontName>("system");
  const [accentColor, setAccentColorState] = useState<AccentColorName>("or");
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingName>("normal");
  const [hideVerseNumbers, setHideVerseNumbersState] = useState(false);
  const [showVerseOfDay, setShowVerseOfDayState] = useState(true);
  const [highlightActiveVerse, setHighlightActiveVerseState] = useState(false);
  const [reciterId, setReciterIdState] = useState<string>(DEFAULT_RECITER_ID);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1.0);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(0);
  const [showTajweed, setShowTajweedState] = useState(false);
  const [continuousPlay, setContinuousPlayState] = useState(false);
  const [qiraa, setQiraaState] = useState<"hafs" | "qaloon">("hafs");
  const [notifEnabled, setNotifEnabledState] = useState(false);
  const [notifHour, setNotifHourState] = useState(8);
  const [notifMinute, setNotifMinuteState] = useState(0);
  const [autoNightMode, setAutoNightModeState] = useState(false);
  const [arabicFontSize, setArabicFontSizeState] = useState(30);

  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadSettings().then((p) => {
      if (p.theme) setThemeState(p.theme);
      if (p.arabicFont) {
        const REMOVED_FONTS = ["amiri", "tajawal"];
        const font = (INVALID_FONTS.includes(p.arabicFont) || REMOVED_FONTS.includes(p.arabicFont)) ? "system" : p.arabicFont;
        setArabicFontState(font as ArabicFontName);
      }
      if (p.accentColor) setAccentColorState(p.accentColor);
      if (p.lineSpacing) setLineSpacingState(p.lineSpacing);
      if (p.hideVerseNumbers !== undefined) setHideVerseNumbersState(p.hideVerseNumbers);
      if (p.showVerseOfDay !== undefined) setShowVerseOfDayState(p.showVerseOfDay);
      if (p.highlightActiveVerse !== undefined) setHighlightActiveVerseState(p.highlightActiveVerse);
      if (p.reciterId) setReciterIdState(p.reciterId);
      else if (p.reciter) setReciterIdState(p.reciter === "alafasy" ? "alafasy" : DEFAULT_RECITER_ID);
      if (p.playbackRate !== undefined) setPlaybackRateState(p.playbackRate);
      if (p.repeatMode !== undefined) setRepeatModeState(p.repeatMode);
      if (p.showTajweed !== undefined) setShowTajweedState(p.showTajweed);
      if (p.continuousPlay !== undefined) setContinuousPlayState(p.continuousPlay);
      if (p.qiraa) setQiraaState(p.qiraa);
      if (p.notifEnabled !== undefined) setNotifEnabledState(p.notifEnabled);
      if (p.notifHour !== undefined) setNotifHourState(p.notifHour);
      if (p.notifMinute !== undefined) setNotifMinuteState(p.notifMinute);
      if (p.autoNightMode !== undefined) setAutoNightModeState(p.autoNightMode);
      if (p.arabicFontSize !== undefined) setArabicFontSizeState(p.arabicFontSize);
    });
  }, []);

  const setTheme = (t: ThemeName) => { setThemeState(t); saveSettings({ theme: t }); };
  const setArabicFont = (f: ArabicFontName) => { setArabicFontState(f); saveSettings({ arabicFont: f }); };
  const setAccentColor = (a: AccentColorName) => { setAccentColorState(a); saveSettings({ accentColor: a }); };
  const setLineSpacing = (l: LineSpacingName) => { setLineSpacingState(l); saveSettings({ lineSpacing: l }); };
  const setHideVerseNumbers = (v: boolean) => { setHideVerseNumbersState(v); saveSettings({ hideVerseNumbers: v }); };
  const setShowVerseOfDay = (v: boolean) => { setShowVerseOfDayState(v); saveSettings({ showVerseOfDay: v }); };
  const setHighlightActiveVerse = (v: boolean) => { setHighlightActiveVerseState(v); saveSettings({ highlightActiveVerse: v }); };
  const setReciterId = (id: string) => { setReciterIdState(id); saveSettings({ reciterId: id }); };
  const setPlaybackRate = (r: PlaybackRate) => { setPlaybackRateState(r); saveSettings({ playbackRate: r }); };
  const setRepeatMode = (m: RepeatMode) => { setRepeatModeState(m); saveSettings({ repeatMode: m }); };
  const setShowTajweed = (v: boolean) => { setShowTajweedState(v); saveSettings({ showTajweed: v }); };
  const setContinuousPlay = (v: boolean) => { setContinuousPlayState(v); saveSettings({ continuousPlay: v }); };
  const setQiraa = (q: "hafs" | "qaloon") => { setQiraaState(q); saveSettings({ qiraa: q }); };
  const setNotifEnabled = (v: boolean) => { setNotifEnabledState(v); saveSettings({ notifEnabled: v }); };
  const setNotifHour = (h: number) => { setNotifHourState(h); saveSettings({ notifHour: h }); };
  const setNotifMinute = (m: number) => { setNotifMinuteState(m); saveSettings({ notifMinute: m }); };
  const setAutoNightMode = (v: boolean) => { setAutoNightModeState(v); saveSettings({ autoNightMode: v }); };
  const setArabicFontSize = (s: number) => { setArabicFontSizeState(s); saveSettings({ arabicFontSize: s }); };

  const effectiveTheme = useMemo<ThemeName>(() => {
    if (autoNightMode && systemColorScheme) {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return theme;
  }, [autoNightMode, systemColorScheme, theme]);

  const colors = useMemo<ThemeColors>(() => {
    const base = THEMES[effectiveTheme] ?? THEMES.dark;
    const accent = ACCENT_COLORS[accentColor];
    return { ...base, gold: accent.primary, goldLight: accent.light };
  }, [effectiveTheme, accentColor]);

  const arabicFontFamily = ARABIC_FONTS[arabicFont];
  const lineSpacingValue = LINE_SPACING[lineSpacing];

  const value = useMemo(
    () => ({
      theme, arabicFont, accentColor, lineSpacing,
      hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
      reciterId, playbackRate, repeatMode, showTajweed, continuousPlay, qiraa,
      notifEnabled, notifHour, notifMinute, autoNightMode,
      arabicFontSize, setArabicFontSize,
      setTheme, setArabicFont, setAccentColor, setLineSpacing,
      setHideVerseNumbers, setShowVerseOfDay, setHighlightActiveVerse,
      setReciterId, setPlaybackRate, setRepeatMode, setShowTajweed, setContinuousPlay, setQiraa,
      setNotifEnabled, setNotifHour, setNotifMinute, setAutoNightMode,
      colors, arabicFontFamily, lineSpacingValue,
    }),
    [
      theme, arabicFont, accentColor, lineSpacing,
      hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
      reciterId, playbackRate, repeatMode, showTajweed, continuousPlay, qiraa,
      notifEnabled, notifHour, notifMinute, autoNightMode,
      arabicFontSize,
      colors, arabicFontFamily, lineSpacingValue,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
