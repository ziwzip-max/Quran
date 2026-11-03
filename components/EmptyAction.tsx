import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/contexts/SettingsContext";

/** Call-to-action button for empty screens: takes the user to the surah list. */
export function EmptyAction({ label = "تصفّح السور" }: { label?: string }) {
  const { colors } = useSettings();
  return (
    <Pressable
      onPress={() => router.navigate("/")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={[styles.label, { color: colors.bgCard }]}>{label}</Text>
      <Ionicons name="arrow-back" size={18} color={colors.bgCard} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingHorizontal: 20, borderRadius: 22, marginTop: 8 },
  label: { fontFamily: "Tajawal_400Regular", fontSize: 16 },
});
