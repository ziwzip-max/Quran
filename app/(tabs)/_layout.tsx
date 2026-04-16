import { Tabs, router } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsModal } from "@/components/SettingsModal";
import { SURAHS } from "@/constants/quranData";
import * as Haptics from "expo-haptics";

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { colors } = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.bgCard,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 64 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.bgCard },
                ]}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="reorder-three-outline" size={size + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mushaf"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dua"
          options={{
            tabBarIcon: ({ color, size }) => (
              <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
                <Ionicons name="hand-left-outline" size={size - 2} color={color} />
                <Ionicons name="hand-right-outline" size={size - 2} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="shuffle"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const random = SURAHS[Math.floor(Math.random() * SURAHS.length)];
              router.push({ pathname: "/surah/[id]", params: { id: String(random.number) } });
            },
          }}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shuffle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setSettingsVisible(true);
            },
          }}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
}
