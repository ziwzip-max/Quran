import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSettings } from "@/contexts/SettingsContext";

/** Right-hand side menu used instead of the bottom tab bar on wide screens. */
export function SideNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useSettings();
  return (
    <View style={[styles.nav, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.brand, { color: colors.textPrimary }]}>الحفظ</Text>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.gold : colors.textSecondary;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            // `hovered` is provided by react-native-web but not in the native typings.
            style={(state) => [
              styles.item,
              focused && { backgroundColor: colors.gold + "1F" },
              !focused && (state as { hovered?: boolean }).hovered && { backgroundColor: colors.bgSurface },
            ]}
          >
            {options.tabBarIcon?.({ focused, color, size: 22 })}
            <Text style={[styles.label, { color }]}>{options.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { width: 220, borderLeftWidth: 1, paddingTop: 24, paddingHorizontal: 12, gap: 4 },
  brand: { fontFamily: "Amiri_400Regular", fontSize: 30, textAlign: "right", paddingHorizontal: 12, marginBottom: 16 },
  item: { flexDirection: "row-reverse", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 12, borderRadius: 12 },
  label: { fontFamily: "Tajawal_400Regular", fontSize: 16, textAlign: "right" },
});
