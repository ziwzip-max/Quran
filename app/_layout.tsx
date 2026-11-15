import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { ScheherazadeNew_400Regular } from "@expo-google-fonts/scheherazade-new";
import { Lateef_400Regular } from "@expo-google-fonts/lateef";
import { Tajawal_400Regular } from "@expo-google-fonts/tajawal";
import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import { Stack } from "expo-router";
import { LocaleDirContext } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { MasteryProvider, useMastery } from "@/contexts/MasteryContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { scheduleSmartNotification, countDueVerses } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

// The whole app is Arabic, so the whole layout runs right to left: rows start on the right,
// horizontal scrollers start from the right, text defaults to right-aligned.
if (Platform.OS === "web") {
  if (typeof document !== "undefined") {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }
} else {
  I18nManager.allowRTL(true);
  // Keep `left` / `right` styles literal; only row order and start / end follow the direction.
  I18nManager.swapLeftAndRightInRTL(false);
  // Takes effect from the next launch; the Android build also forces it at startup
  // (plugins/with-rtl.cjs), so it applies from the very first one.
  I18nManager.forceRTL(true);
}

function NotificationScheduler() {
  const { notifEnabled, notifHour, notifMinute } = useSettings();
  const { masteryMap } = useMastery();
  useEffect(() => {
    scheduleSmartNotification(notifEnabled, notifHour, notifMinute, countDueVerses(masteryMap));
  }, [notifEnabled, notifHour, notifMinute, masteryMap]);
  return null;
}

function RootLayoutNav() {
  const { colors } = useSettings();
  return (
    <LocaleDirContext.Provider value="rtl">
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgDark },
          headerTintColor: colors.textPrimary,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.bgDark },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="surah/[id]"
          options={{
            headerShown: true,
            headerTransparent: false,
            }}
        />
        <Stack.Screen name="review" options={{ headerShown: true }} />
      </Stack>
    </LocaleDirContext.Provider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoNaskhArabic_400Regular,
    Amiri_400Regular,
    ScheherazadeNew_400Regular,
    Lateef_400Regular,
    Tajawal_400Regular,
    AmiriQuran_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <SettingsProvider>
              <BookmarksProvider>
                <MasteryProvider>
                  <AudioProvider>
                    <NotificationScheduler />
                    <RootLayoutNav />
                  </AudioProvider>
                </MasteryProvider>
              </BookmarksProvider>
            </SettingsProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
