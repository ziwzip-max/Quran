import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSettings } from "@/contexts/SettingsContext";
import { useGlass } from "@/utils/useGlass";

/** Frosted background for a screen header (use with `headerTransparent: true`). */
export function HeaderGlass() {
  const glass = useGlass();
  const { colors } = useSettings();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        glass.surface("soft", { blur: true }),
        { borderWidth: 0, borderBottomWidth: 1, borderBottomColor: glass.enabled ? glass.tokens.edge : colors.border },
      ]}
    />
  );
}

/**
 * Header options. On the web the header is frosted glass over the page (transparent + HeaderGlass).
 * The native header cannot draw a custom background, so a transparent one would show the verses
 * through the buttons: on Android the header is a solid bar above the page instead.
 */
export function glassHeaderOptions(solidColor: string) {
  if (Platform.OS === "web") {
    return {
      headerTransparent: true,
      headerBackground: () => <HeaderGlass />,
      headerStyle: { backgroundColor: "transparent" },
    };
  }
  return { headerTransparent: false, headerStyle: { backgroundColor: solidColor }, headerShadowVisible: false };
}

/** Space the screen leaves for a transparent header: the header's height on the web, none on native. */
export function useHeaderInset(): number {
  const h = useHeaderHeight();
  return Platform.OS === "web" ? h : 0;
}
