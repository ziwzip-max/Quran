import React from "react";
import { StyleSheet, View } from "react-native";
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
