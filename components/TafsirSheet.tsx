import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import { useSurface } from "@/utils/useSurface";
import { SURAHS } from "@/constants/quranData";
import { EDITIONS, fetchEditionSurah } from "@/utils/quranTexts";

function TafsirContent({ surahNum, verseNum, colors, arabicFont }: {
  surahNum: number; verseNum: number;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const [tafsir, setTafsir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const verseText = SURAHS.find(s => s.number === surahNum)?.verses.find(v => v.number === verseNum)?.text ?? "";

  useEffect(() => {
    setLoading(true);
    setError(false);
    setTafsir(null);
    // Whole surah at once, saved on the device: later verses open instantly and offline.
    fetchEditionSurah(EDITIONS.tafsir, surahNum)
      .then(v => { setTafsir(v[verseNum - 1] ?? null); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [surahNum, verseNum]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 22, textAlign: "auto", lineHeight: 40, color: colors.textPrimary, fontFamily: arabicFont }}>
        {verseText}
      </Text>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      {loading
        ? <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
        : error
          ? <Text style={{ textAlign: "center", color: colors.textMuted, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 14 }}>تعذّر تحميل التفسير. يحتاج أول عرض لتفسير السورة إلى اتصال بالإنترنت، ثم يعمل دون اتصال.</Text>
          : <Text style={{ fontSize: 16, textAlign: "auto", lineHeight: 28, color: colors.textSecondary, fontFamily: arabicFont }}>
              {tafsir}
            </Text>
      }
      <Text style={{ fontSize: 11, textAlign: "center", color: colors.textMuted, fontFamily: "IBMPlexSansArabic_400Regular" }}>
        التفسير الميسر — موقع الكويت
      </Text>
    </ScrollView>
  );
}

/** Bottom sheet with the verse and its tafsir (Al-Muyassar). `verse` null = closed. */
export function TafsirSheet({ verse, onClose }: { verse: { surahNum: number; verseNum: number } | null; onClose: () => void }) {
  const { colors, arabicFontFamily } = useSettings();
  const paper = useSurface();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={verse !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { ...paper.surface("strong"), borderBottomWidth: 0, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10 }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="إغلاق">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
            <Text style={[styles.title, { color: colors.textPrimary }]}>التفسير الميسر</Text>
            <View style={{ width: 22 }} />
          </View>
          {verse !== null && (
            <TafsirContent surahNum={verse.surahNum} verseNum={verse.verseNum} colors={colors} arabicFont={arabicFontFamily} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, borderTopWidth: 1, maxHeight: "75%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 17, textAlign: "center" },
});
