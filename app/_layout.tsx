import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Cairo_400Regular } from "@expo-google-fonts/cairo";
import { Tajawal_400Regular } from "@expo-google-fonts/tajawal";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { MasteryProvider } from "@/contexts/MasteryContext";
import { AudioProvider } from "@/contexts/AudioContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useSettings();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgDark },
        headerTintColor: colors.textPrimary,
        headerBackTitle: "القرآن",
        contentStyle: { backgroundColor: colors.bgDark },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="surah/[id]"
        options={{
          headerShown: true,
          headerTransparent: false,
          headerBackTitle: "القرآن",
        }}
      />
    </Stack>
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
    Cairo_400Regular,
    Tajawal_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <SettingsProvider>
              <BookmarksProvider>
                <MasteryProvider>
                  <AudioProvider>
                    <RootLayoutNav />
                  </AudioProvider>
                </MasteryProvider>
              </BookmarksProvider>
            </SettingsProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
