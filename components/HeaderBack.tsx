import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Back button for screen headers. It sits at the start of the header (the right, as the app
 * is right to left) and always works: with no history, such as after a browser reload or
 * from a link, it goes to the home screen instead of doing nothing.
 */
export function HeaderBack() {
  const { colors } = useSettings();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      accessibilityRole="button"
      accessibilityLabel="رجوع"
      style={styles.btn}
    >
      {/* In a right-to-left app "back" points to the right. */}
      <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
