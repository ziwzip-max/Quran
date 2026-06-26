import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS } from "@/constants/quranData";
import { SURAH_JUZ, SURAH_TYPE } from "@/constants/quranMeta";

const LATIN_JUZ = Array.from({ length: 30 }, (_, i) => String(i + 1));
const LATIN_HIZB = Array.from({ length: 60 }, (_, i) => String(i + 1));

type JumpTab = "surah" | "juz" | "hizb";

export interface JumpModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSurah: (n: number) => void;
  onSelectJuz: (n: number) => void;
  onSelectHizb: (n: number) => void;
  filterSurahNumbers?: number[]; // if provided, only show these surahs
}

export function JumpModal({
  visible, onClose,
  onSelectSurah, onSelectJuz, onSelectHizb,
  filterSurahNumbers,
}: JumpModalProps) {
  const [tab, setTab] = useState<JumpTab>("surah");
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();

  const surahList = filterSurahNumbers
    ? SURAHS.filter(s => filterSurahNumbers.includes(s.number))
    : SURAHS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bgDark, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>الانتقال إلى</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {(["surah", "juz", "hizb"] as JumpTab[]).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, t === tab && { backgroundColor: colors.gold + "25", borderColor: colors.gold }]}
            >
              <Text style={[styles.tabText, { color: t === tab ? colors.gold : colors.textSecondary }]}>
                {t === "surah" ? "سورة" : t === "juz" ? "جزء" : "حزب"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "surah" && (
          <FlatList
            data={surahList}
            keyExtractor={s => String(s.number)}
            renderItem={({ item }) => {
              const juz = SURAH_JUZ[item.number];
              return (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectSurah(item.number); onClose(); }}
                  style={[styles.surahRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.surahNum, { backgroundColor: colors.bgSurface }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[styles.surahNameAr, { color: colors.textPrimary }]}>{item.nameArabic}</Text>
                    <Text style={[styles.surahMeta, { color: colors.textMuted }]}>
                      {SURAH_TYPE[item.number] === "mecquoise" ? "مكية" : "مدنية"} • ج{LATIN_JUZ[juz - 1]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={(
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>لا توجد نتائج</Text>
              </View>
            )}
          />
        )}

        {tab === "juz" && (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
              <Pressable
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectJuz(n); onClose(); }}
                style={[styles.gridCell, { backgroundColor: colors.bgCard, borderColor: colors.gold + "50" }]}
              >
                <Text style={[styles.gridNum, { color: colors.gold }]}>{LATIN_JUZ[n - 1]}</Text>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>جزء</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {tab === "hizb" && (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 60 }, (_, i) => i + 1).map(n => (
              <Pressable
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectHizb(n); onClose(); }}
                style={[styles.gridCell, { backgroundColor: colors.bgCard, borderColor: colors.teal + "50" }]}
              >
                <Text style={[styles.gridNum, { color: colors.tealLight }]}>{LATIN_HIZB[n - 1]}</Text>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>حزب</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "700" as const, textAlign: "right" as const },
  tabs: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 10,
  },
  tabText: { fontSize: 14, fontWeight: "600" as const, textAlign: "right" as const },
  surahRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  surahNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  surahNameAr: { fontSize: 16, textAlign: "right" },
  surahMeta: { fontSize: 11, textAlign: "right", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    justifyContent: "center",
  },
  gridCell: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  gridNum: { fontSize: 22, fontWeight: "700" as const },
  gridLabel: { fontSize: 10, marginTop: 2 },
});
