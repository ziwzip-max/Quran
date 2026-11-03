import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SURAH_NAME_FONT } from "@/constants/themes";
import { useAudio } from "@/contexts/AudioContext";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS } from "@/constants/quranData";

/**
 * Slim "now playing" bar shown above the tab bar while recitation is active,
 * so playback can be paused or stopped without going back to the surah.
 */
export function MiniPlayer({ floating = false }: { floating?: boolean }) {
  const { currentSurahNum, currentVerseNum, isPlaying, isLoading, isSurahMode, playbackPosition, playbackDuration, pause, resume, stop } =
    useAudio();
  const { colors } = useSettings();

  if (currentSurahNum == null) return null;
  const surah = SURAHS[currentSurahNum - 1];
  if (!surah) return null;

  const progress = playbackDuration > 0 ? Math.min(1, playbackPosition / playbackDuration) : 0;
  const subtitle = isSurahMode || currentVerseNum == null ? "السورة كاملة" : `الآية ${currentVerseNum}`;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        floating && styles.floating,
      ]}
    >
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.gold }]} />
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`فتح ${surah.nameArabic}`}
          onPress={() => router.push({ pathname: "/surah/[id]", params: { id: String(surah.number) } })}
          style={styles.info}
        >
          <Ionicons name="musical-notes" size={18} color={colors.gold} />
          <View style={styles.texts}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
              {surah.nameArabic}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isLoading ? "جارٍ التحميل…" : subtitle}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          onPress={() => (isPlaying ? pause() : resume())}
          style={[styles.btn, { backgroundColor: colors.gold }]}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={colors.bgCard} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="إيقاف" onPress={() => stop()} style={styles.btn}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, overflow: "hidden" },
  floating: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    width: "92%",
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 16,
  },
  track: { height: 2, width: "100%" },
  fill: { height: 2 },
  row: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  info: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 10, minHeight: 44 },
  texts: { flex: 1, alignItems: "flex-end" },
  title: { fontFamily: SURAH_NAME_FONT, fontSize: 17, textAlign: "right" },
  subtitle: { fontFamily: "Tajawal_400Regular", fontSize: 12, textAlign: "right" },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
