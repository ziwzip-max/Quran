import { Tabs } from "expo-router";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsSheetProvider } from "@/contexts/SettingsSheetContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SideNav } from "@/components/SideNav";
import { useIsWide } from "@/utils/layout";

type IconProps = { color: string; size: number };

// Logical order: the first tab is the home screen. In a bottom bar the tabs are
// laid out left to right, so for Arabic (right to left) they are declared in
// reverse and the home tab ends up on the right.
const TABS: { name: string; title: string; icon: (p: IconProps) => React.ReactNode }[] = [
  { name: "index", title: "السور", icon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> },
  { name: "bookmarks", title: "الحفظ", icon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} /> },
  {
    name: "practice",
    title: "الصلاة",
    icon: ({ color, size }) => <MaterialCommunityIcons name="mosque-outline" size={size} color={color} />,
  },
  { name: "mushaf", title: "المصحف", icon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> },
  {
    name: "dua",
    title: "الأدعية",
    icon: ({ color, size }) => <MaterialCommunityIcons name="hands-pray" size={size} color={color} />,
  },
];

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWide = useIsWide();
  const { colors } = useSettings();

  const tabs = isWide ? TABS : [...TABS].reverse();

  const renderTabBar = (props: BottomTabBarProps) => {
    if (isWide) return <SideNav {...props} />;
    // Mini player sits directly above the tab bar. On iOS both float over the
    // content with a blur; elsewhere they take their own space so nothing is hidden.
    return (
      <View style={isIOS ? styles.iosOverlay : undefined}>
        <MiniPlayer />
        <BottomTabBar {...props} />
      </View>
    );
  };

  return (
    <SettingsSheetProvider>
      <Tabs
        initialRouteName="index"
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          tabBarPosition: isWide ? "right" : "bottom",
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontFamily: "Tajawal_400Regular", fontSize: 11, marginTop: -2 },
          tabBarStyle: {
            backgroundColor: isIOS ? "transparent" : colors.bgCard,
            borderTopWidth: Platform.OS === "web" ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(Platform.OS === "web" ? { height: 64, paddingBottom: 6 } : {}),
          },
          tabBarBackground: () =>
            isIOS && !isWide ? <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} /> : null,
        }}
      >
        {tabs.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: t.icon }} />
        ))}
      </Tabs>
      {isWide && <MiniPlayer floating />}
    </SettingsSheetProvider>
  );
}

const styles = StyleSheet.create({
  iosOverlay: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
