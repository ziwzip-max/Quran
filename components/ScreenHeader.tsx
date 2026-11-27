import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import { useGlass } from "@/utils/useGlass";
import { HeaderBack } from "@/components/HeaderBack";

/**
 * Screen header drawn by the app, the same on the web and on Android. The native Android header
 * cannot be styled reliably (it drew no background and squeezed the title), so screens use this.
 * Right to left: back button and title at the start (right), actions at the end (left).
 */
export function ScreenHeader({
  title,
  titleFont,
  titleSize = 20,
  right,
}: {
  title: string;
  titleFont: string;
  titleSize?: number;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const glass = useGlass();
  const { colors } = useSettings();
  return (
    <View
      style={[
        styles.bar,
        glass.surface("soft", { blur: true }),
        {
          paddingTop: insets.top,
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: glass.enabled ? glass.tokens.edge : colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <HeaderBack />
        <Text numberOfLines={1} style={[styles.title, { fontFamily: titleFont, fontSize: titleSize, color: colors.textPrimary }]}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { width: "100%", zIndex: 5 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingHorizontal: 4 },
  title: { flex: 1, textAlign: "auto", paddingHorizontal: 4 },
});
