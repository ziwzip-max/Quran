import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { SURAHS, Surah } from "@/constants/quranData";
import { SURAH_JUZ, SURAH_TYPE } from "@/constants/quranMeta";
import { SettingsModal } from "@/components/SettingsModal";

export const HISTORY_KEY = "al_hifz_history";
const MAX_HISTORY = 5;

type SearchMode = "surahs" | "verse";
type LengthFilter = "كل" | "قصيرة" | "متوسطة" | "طويلة";

interface VerseResult {
  surahNumber: number;
  surahNameArabic: string;
  verseNumber: number;
  verseText: string | null;
}

function parseVerseQuery(query: string): { surahNum: number; verseNum: number } | null {
  const match = query.trim().match(/^(\d+)[.\s:،,](\d+)$/);
  if (!match) return null;
  const s = parseInt(match[1], 10);
  const v = parseInt(match[2], 10);
  if (s < 1 || s > 114 || v < 1) return null;
  return { surahNum: s, verseNum: v };
}

function getVerseOfDay(): { surahNumber: number; verseNumber: number } {
  const dayEpoch = Math.floor(Date.now() / 86400000);
  const surahIndex = dayEpoch % 114;
  const surah = SURAHS[surahIndex];
  const verseIndex = (dayEpoch * 7919) % surah.verses.length;
  return { surahNumber: surah.number, verseNumber: surah.verses[verseIndex].number };
}

function JuzChip({ juz, selected, onPress, colors }: {
  juz: number; selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useSettings>["colors"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.gold : colors.bgCard,
          borderColor: selected ? colors.gold : colors.border,
        }
      ]}
    >
      <Text style={[styles.filterChipText, { color: selected ? colors.bgDark : colors.textSecondary }]}>
        {juz}
      </Text>
    </Pressable>
  );
}

function LengthChip({ label, selected, onPress, colors }: {
  label: LengthFilter; selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useSettings>["colors"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.gold : colors.bgCard,
          borderColor: selected ? colors.gold : colors.border,
        }
      ]}
    >
      <Text style={[styles.filterChipText, { color: selected ? colors.bgDark : colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function VerseOfDayWidget({
  surahNumber, verseNumber, colors, arabicFont,
}: {
  surahNumber: number; verseNumber: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const surah = SURAHS.find((s) => s.number === surahNumber);
  const verse = surah?.verses.find((v) => v.number === verseNumber);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  if (!surah || !verse) return null;
  const bookmarked = isBookmarked(surahNumber, verseNumber);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber), verse: String(verseNumber) } })}
      style={[styles.vodWidget, { backgroundColor: colors.bgCard, borderColor: colors.gold + "40" }]}
    >
      <View style={styles.vodTop}>
        <View style={[styles.vodBadge, { backgroundColor: colors.gold + "20" }]}>
          <Text style={[styles.vodBadgeText, { color: colors.gold }]}>آية اليوم</Text>
        </View>
        <View style={styles.vodRef}>
          <Text style={[styles.vodRefText, { color: colors.textMuted }]}>
            {surah.nameArabic} • {verseNumber}
          </Text>
          <Pressable onPress={(e) => { e.stopPropagation(); toggleBookmark(surahNumber, verseNumber); }} hitSlop={12}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={18} color={bookmarked ? colors.gold : colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <Text
        numberOfLines={4}
        style={[styles.vodText, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}
      >
        {verse.text}
      </Text>
    </Pressable>
  );
}

function HistoryChip({ surahNumber, colors, onPress }: {
  surahNumber: number;
  colors: ReturnType<typeof useSettings>["colors"];
  onPress: () => void;
}) {
  const surah = SURAHS.find((s) => s.number === surahNumber);
  if (!surah) return null;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.historyChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    >
      <Text style={[styles.historyChipArabic, { color: colors.textPrimary }]}>{surah.nameArabic}</Text>
      <Text style={[styles.historyChipNum, { color: colors.textMuted }]}>{surah.number}</Text>
    </Pressable>
  );
}

function SurahCard({ surah, onPress, colors }: {
  surah: Surah; onPress: () => void;
  colors: ReturnType<typeof useSettings>["colors"];
}) {
  const revType = SURAH_TYPE[surah.number];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.cardLeft}>
        <Text style={[styles.verseCount, { color: colors.textMuted }]}>{surah.versesCount} آية</Text>
        <View style={[styles.revTypePill, { backgroundColor: revType === "mecquoise" ? colors.teal + "20" : colors.gold + "15" }]}>
          <Text style={[styles.revTypeText, { color: revType === "mecquoise" ? colors.tealLight : colors.gold }]}>
            {revType === "mecquoise" ? "مكية" : "مدنية"}
          </Text>
        </View>
      </View>
      <Text style={[styles.arabicName, { color: colors.textPrimary }]}>{surah.nameArabic}</Text>
      <View style={[styles.numberBadge, { backgroundColor: colors.bgSurface, borderColor: colors.gold + "40" }]}>
        <Text style={[styles.numberText, { color: colors.gold }]}>{surah.number}</Text>
      </View>
    </Pressable>
  );
}

function VerseResultCard({ result, colors }: { result: VerseResult; colors: ReturnType<typeof useSettings>["colors"] }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/surah/[id]", params: { id: String(result.surahNumber), verse: String(result.verseNumber) } })}
      style={({ pressed }) => [styles.verseCard, { backgroundColor: colors.bgCard, borderColor: colors.gold + "40" }, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.verseCardTop}>
        <View style={[styles.verseRefBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
          <Text style={[styles.verseRefText, { color: colors.gold }]}>{result.surahNumber}:{result.verseNumber}</Text>
        </View>
        <Text style={[styles.verseCardName, { color: colors.textPrimary }]}>{result.surahNameArabic}</Text>
      </View>
      {result.verseText
        ? <Text style={[styles.verseCardText, { color: colors.textPrimary }]}>{result.verseText}</Text>
        : <Text style={[styles.verseCardMissing, { color: colors.textSecondary }]}>الآية {result.verseNumber} — اضغط للانتقال</Text>
      }
    </Pressable>
  );
}

const LENGTH_LABELS: LengthFilter[] = ["كل", "قصيرة", "متوسطة", "طويلة"];
function matchesLength(surah: Surah, filter: LengthFilter): boolean {
  if (filter === "كل") return true;
  if (filter === "قصيرة") return surah.versesCount < 20;
  if (filter === "متوسطة") return surah.versesCount >= 20 && surah.versesCount < 90;
  return surah.versesCount >= 90;
}

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const { colors, arabicFontFamily, showVerseOfDay } = useSettings();
  const [search, setSearch] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>("كل");
  const [history, setHistory] = useState<number[]>([]);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadHistory();
  }, [loadHistory]));

  const vodData = useMemo(() => getVerseOfDay(), []);

  const { mode, filteredSurahs, verseResult } = useMemo<{
    mode: SearchMode; filteredSurahs: Surah[]; verseResult: VerseResult | null;
  }>(() => {
    const q = search.trim();

    if (q === "") {
      let surahs = SURAHS;
      if (selectedJuz !== null) {
        surahs = surahs.filter((s) => SURAH_JUZ[s.number] === selectedJuz);
      }
      surahs = surahs.filter((s) => matchesLength(s, lengthFilter));
      return { mode: "surahs", filteredSurahs: surahs, verseResult: null };
    }

    const parsed = parseVerseQuery(q);
    if (parsed) {
      const surah = SURAHS.find((s) => s.number === parsed.surahNum);
      if (!surah) return { mode: "surahs", filteredSurahs: [], verseResult: null };
      const verseData = surah.verses.find((v) => v.number === parsed.verseNum);
      return {
        mode: "verse", filteredSurahs: [],
        verseResult: {
          surahNumber: surah.number,
          surahNameArabic: surah.nameArabic,
          verseNumber: parsed.verseNum,
          verseText: verseData ? verseData.text : null,
        },
      };
    }

    const num = parseInt(q, 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      const surah = SURAHS.find((s) => s.number === num);
      return { mode: "surahs", filteredSurahs: surah ? [surah] : [], verseResult: null };
    }

    const matched = SURAHS.filter(
      (s) => s.nameArabic.includes(q) || s.nameTranslit.toLowerCase().includes(q.toLowerCase())
    );
    return { mode: "surahs", filteredSurahs: matched, verseResult: null };
  }, [search, selectedJuz, lengthFilter]);

  const showFilters = search.trim() === "";

  const navigateToSurah = useCallback((surahNumber: number) => {
    router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber) } });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setSettingsVisible(true)} style={styles.gearBtn} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.gold }]}>القرآن الكريم</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>١١٤ سورة • ٦٢٣٦ آية</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {showFilters && showVerseOfDay && (
        <View style={styles.vodContainer}>
          <VerseOfDayWidget
            surahNumber={vodData.surahNumber}
            verseNumber={vodData.verseNumber}
            colors={colors}
            arabicFont={arabicFontFamily}
          />
        </View>
      )}

      <View style={[styles.searchContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="البحث... مثال: 2:255"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          textAlign="right"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Ionicons name="search" size={16} color={colors.textMuted} />
      </View>

      {showFilters && history.length > 0 && (
        <View style={styles.historySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
            <Text style={[styles.historySectionLabel, { color: colors.textMuted }]}>سبق قراءته</Text>
            {history.map((num) => (
              <HistoryChip key={num} surahNumber={num} colors={colors} onPress={() => navigateToSurah(num)} />
            ))}
          </ScrollView>
        </View>
      )}

      {showFilters && (
        <>
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <Pressable
                onPress={() => setSelectedJuz(null)}
                style={[styles.filterChip, { backgroundColor: selectedJuz === null ? colors.gold : colors.bgCard, borderColor: selectedJuz === null ? colors.gold : colors.border }]}
              >
                <Text style={[styles.filterChipText, { color: selectedJuz === null ? colors.bgDark : colors.textSecondary }]}>كل الأجزاء</Text>
              </Pressable>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <JuzChip
                  key={juz}
                  juz={juz}
                  selected={selectedJuz === juz}
                  onPress={() => setSelectedJuz(selectedJuz === juz ? null : juz)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.lengthFilterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {LENGTH_LABELS.map((label) => (
                <LengthChip
                  key={label}
                  label={label}
                  selected={lengthFilter === label}
                  onPress={() => setLengthFilter(label)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {mode === "verse" && verseResult && (
        <View style={styles.verseResultContainer}>
          <Text style={[styles.verseResultLabel, { color: colors.textMuted }]}>نتيجة البحث</Text>
          <VerseResultCard result={verseResult} colors={colors} />
        </View>
      )}

      {mode === "surahs" && (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(s) => String(s.number)}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 34 : 120 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SurahCard
              surah={item}
              colors={colors}
              onPress={() => navigateToSurah(item.number)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            search.trim() !== "" || selectedJuz !== null || lengthFilter !== "كل" ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد نتائج</Text>
              </View>
            ) : null
          }
        />
      )}

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  gearBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "center" },
  vodContainer: { paddingHorizontal: 16, marginBottom: 10 },
  vodWidget: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  vodTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vodBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  vodBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  vodRef: { flexDirection: "row", alignItems: "center", gap: 8 },
  vodRefText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  vodText: { fontSize: 20, textAlign: "right", lineHeight: 38 },
  searchContainer: {
    flexDirection: "row", alignItems: "center", borderRadius: 12,
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  historySection: { marginBottom: 6 },
  historyScroll: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  historySectionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginRight: 4 },
  historyChip: {
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  historyChipArabic: { fontSize: 14 },
  historyChipNum: { fontFamily: "Inter_500Medium", fontSize: 10 },
  filterSection: { marginBottom: 4 },
  lengthFilterSection: { marginBottom: 6 },
  filterScroll: { paddingHorizontal: 16, gap: 7 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  listContent: { paddingHorizontal: 16 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, gap: 14, borderWidth: 1 },
  cardLeft: { flex: 1, alignItems: "flex-start", gap: 5 },
  verseCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  revTypePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  revTypeText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  arabicName: { fontSize: 20, textAlign: "right" },
  numberBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numberText: { color: "#C9A227", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  verseResultContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  verseResultLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "right", marginBottom: 8 },
  verseCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  verseCardTop: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" },
  verseRefBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  verseRefText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  verseCardName: { fontSize: 18, textAlign: "right" },
  verseCardText: { fontSize: 22, textAlign: "right", lineHeight: 42 },
  verseCardMissing: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "right" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
