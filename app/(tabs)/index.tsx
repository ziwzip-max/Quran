import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  Animated,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useMastery } from "@/contexts/MasteryContext";
import { SURAHS, Surah } from "@/constants/quranData";
import { SURAH_TYPE, SURAH_JUZ, JUZ_NAMES } from "@/constants/quranMeta";
import { VOD_LIST } from "@/constants/verseOfDayList";
import { BUILT_IN_DUAS, Dua } from "@/constants/duaaData";
import { SettingsModal } from "@/components/SettingsModal";

export const HISTORY_KEY = "al_hifz_history";
const LAST_SURAH_KEY = "al_hifz_last_surah";
const PINS_KEY = "al_hifz_pins";
const REVIEWS_KEY = "al_hifz_reviews";
const DAILY_COUNTS_KEY = "al_hifz_daily_counts";
const STREAK_KEY = "al_hifz_streak";
const MAX_HISTORY = 5;
const REVIEW_THRESHOLD_L1 = 3 * 24 * 60 * 60 * 1000;
const REVIEW_THRESHOLD_L2 = 7 * 24 * 60 * 60 * 1000;
const REVIEW_THRESHOLD_L3 = 30 * 24 * 60 * 60 * 1000;

type SearchMode = "surahs" | "verse";
type JuzFilter = number | "كل";

interface VerseResult {
  surahNumber: number;
  surahNameArabic: string;
  verseNumber: number;
  verseText: string | null;
}

interface LastSurahData {
  surahNumber: number;
  surahName: string;
  progress: number;
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
  return VOD_LIST[dayEpoch % VOD_LIST.length];
}

async function computeStreak(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_COUNTS_KEY);
    if (!stored) return 0;
    const counts: Record<string, number> = JSON.parse(stored);
    const activeDays = new Set(Object.keys(counts).filter((d) => counts[d] > 0));
    if (activeDays.size === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    let streak = 0;
    let cursor = new Date(today);
    if (!activeDays.has(fmt(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!activeDays.has(fmt(cursor))) return 0;
    }
    while (activeDays.has(fmt(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    await AsyncStorage.setItem(STREAK_KEY, String(streak));
    return streak;
  } catch {
    return 0;
  }
}

function countDueBlocks(
  masteryMap: Record<string, number>,
  reviews: Record<string, number>
): number {
  let count = 0;
  for (const [key, level] of Object.entries(masteryMap)) {
    if (level === 0) continue;
    const lastReview = reviews[key];
    if (lastReview === undefined) { count++; continue; }
    const elapsed = Date.now() - lastReview;
    if (level === 1 && elapsed > REVIEW_THRESHOLD_L1) count++;
    else if (level === 2 && elapsed > REVIEW_THRESHOLD_L2) count++;
    else if (level === 3 && elapsed > REVIEW_THRESHOLD_L3) count++;
  }
  return count;
}

function JuzChip({ label, selected, onPress, colors }: {
  label: string; selected: boolean;
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

function ContinueReadingCard({ data, colors }: { data: LastSurahData; colors: ReturnType<typeof useSettings>["colors"] }) {
  return (
    <View style={[styles.continueCard, { backgroundColor: colors.bgCard, borderColor: colors.gold + "40" }]}>
      <View style={styles.continueHeader}>
        <View style={[styles.continueBadge, { backgroundColor: colors.gold + "20" }]}>
          <Text style={[styles.continueBadgeText, { color: colors.gold }]}>تابِع من حيث توقفت</Text>
        </View>
        <Text style={[styles.continueSurahName, { color: colors.textPrimary }]}>{data.surahName}</Text>
      </View>
      <View style={styles.continueBody}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${data.progress * 100}%`, backgroundColor: colors.gold }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>{Math.round(data.progress * 100)}%</Text>
        </View>
        <Pressable
          style={[styles.continueBtn, { backgroundColor: colors.gold }]}
          onPress={() => router.push({ pathname: "/surah/[id]", params: { id: String(data.surahNumber) } })}
        >
          <Text style={[styles.continueBtnText, { color: colors.bgDark }]}>متابعة القراءة</Text>
          <Ionicons name="arrow-back" size={16} color={colors.bgDark} />
        </Pressable>
      </View>
    </View>
  );
}

function DailyDuaWidget({ dua, colors, onOpen }: { dua: Dua; colors: ReturnType<typeof useSettings>["colors"]; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      style={[styles.duaWidget, { backgroundColor: colors.bgCard, borderColor: colors.teal + "30" }]}
    >
      <View style={styles.duaHeader}>
        <View style={[styles.duaBadge, { backgroundColor: colors.teal + "15" }]}>
          <Text style={[styles.duaBadgeText, { color: colors.tealLight }]}>{dua.category}</Text>
        </View>
        <Text style={[styles.duaTitle, { color: colors.textPrimary }]}>{dua.title}</Text>
      </View>
      <Text numberOfLines={2} style={[styles.duaText, { color: colors.textSecondary }]}>
        {dua.arabic}
      </Text>
      <View style={styles.duaFooter}>
        <Text style={[styles.duaTapHint, { color: colors.tealLight }]}>عرض الدعاء كاملاً</Text>
        <Ionicons name="chevron-back" size={14} color={colors.tealLight} />
      </View>
    </Pressable>
  );
}

function VerseOfDayWidget({
  surahNumber, verseNumber, colors, arabicFont, onDismiss,
}: {
  surahNumber: number; verseNumber: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
  onDismiss: () => void;
}) {
  const surah = SURAHS.find((s) => s.number === surahNumber);
  const verse = surah?.verses.find((v) => v.number === verseNumber);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  if (!surah || !verse) return null;
  const bookmarked = isBookmarked(surahNumber, verseNumber);

  return (
    <View style={[styles.vodWidget, { backgroundColor: colors.bgCard, borderColor: colors.gold + "40" }]}>
      <View style={styles.vodTop}>
        <View style={[styles.vodBadge, { backgroundColor: colors.gold + "20" }]}>
          <Text style={[styles.vodBadgeText, { color: colors.gold }]}>آية اليوم</Text>
        </View>
        <View style={styles.vodRef}>
          <Text style={[styles.vodRefText, { color: colors.textMuted }]}>
            {surah.nameArabic} • {verseNumber}
          </Text>
          <Pressable onPress={() => { toggleBookmark(surahNumber, verseNumber); }} hitSlop={12}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={18} color={bookmarked ? colors.gold : colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDismiss(); }} hitSlop={12}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber), verse: String(verseNumber) } });
        }}
      >
        <Text
          numberOfLines={4}
          style={[styles.vodText, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}
        >
          {verse.text}
        </Text>
        <Text style={[styles.vodTapHint, { color: colors.gold }]}>اضغط للقراءة ←</Text>
      </Pressable>
    </View>
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

function PinChip({ surahNumber, colors, onUnpin }: {
  surahNumber: number;
  colors: ReturnType<typeof useSettings>["colors"];
  onUnpin: () => void;
}) {
  const surah = SURAHS.find((s) => s.number === surahNumber);
  if (!surah) return null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber) } })}
      style={[styles.pinChip, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "50" }]}
    >
      <Text style={[styles.pinChipText, { color: colors.gold }]}>{surah.nameArabic}</Text>
      <Pressable onPress={(e) => { e.stopPropagation(); onUnpin(); }} hitSlop={10}>
        <Ionicons name="close-circle" size={15} color={colors.gold + "90"} />
      </Pressable>
    </Pressable>
  );
}

function SurahCard({ surah, onPress, onLongPress, isPinned, colors }: {
  surah: Surah; onPress: () => void; onLongPress: () => void;
  isPinned: boolean;
  colors: ReturnType<typeof useSettings>["colors"];
}) {
  const revType = SURAH_TYPE[surah.number];
  const scale = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onLongPress();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isPinned ? colors.gold + "10" : colors.bgCard,
          borderColor: isPinned ? colors.gold + "50" : colors.border,
        },
        pressed && { opacity: 0.75 }
      ]}
    >
      <Animated.View style={[styles.cardInner, { transform: [{ scale }] }]}>
        <View style={styles.cardLeft}>
          <Text style={[styles.verseCount, { color: colors.textMuted }]}>{surah.versesCount} آية</Text>
          <View style={[styles.revTypePill, { backgroundColor: revType === "mecquoise" ? colors.teal + "20" : colors.gold + "15" }]}>
            <Text style={[styles.revTypeText, { color: revType === "mecquoise" ? colors.tealLight : colors.gold }]}>
              {revType === "mecquoise" ? "مكية" : "مدنية"}
            </Text>
          </View>
        </View>
        <Text style={[styles.arabicName, { color: colors.textPrimary }]}>{surah.nameArabic}</Text>
        <View style={[styles.numberBadge, {
          backgroundColor: isPinned ? colors.gold + "20" : colors.bgSurface,
          borderColor: isPinned ? colors.gold + "60" : colors.gold + "40",
        }]}>
          <Text style={[styles.numberText, { color: colors.gold }]}>{surah.number}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function VerseResultCard({ result, colors, arabicFont }: { result: VerseResult; colors: ReturnType<typeof useSettings>["colors"]; arabicFont?: string }) {
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
        ? <Text style={[styles.verseCardText, { color: colors.textPrimary, fontFamily: arabicFont }]}>{result.verseText}</Text>
        : <Text style={[styles.verseCardMissing, { color: colors.textSecondary }]}>الآية {result.verseNumber}</Text>
      }
      <View style={styles.verseCardNav}>
        <Ionicons name="arrow-back-outline" size={13} color={colors.gold} />
        <Text style={[styles.verseCardNavText, { color: colors.gold }]}>اقرأ في السورة</Text>
      </View>
    </Pressable>
  );
}

const JUZ_LABELS: JuzFilter[] = ["كل", ...Array.from({ length: 30 }, (_, i) => i + 1)];

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const { colors, arabicFontFamily, showVerseOfDay } = useSettings();
  const { masteryMap } = useMastery();
  const [search, setSearch] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [revFilter, setRevFilter] = useState<"الكل" | "مكية" | "مدنية">("الكل");
  const [juzFilter, setJuzFilter] = useState<JuzFilter>("كل");
  const [history, setHistory] = useState<number[]>([]);
  const [pins, setPins] = useState<number[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);
  const [vodDismissed, setVodDismissed] = useState(false);
  const [lastSurah, setLastSurah] = useState<LastSurahData | null>(null);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const loadLastSurah = useCallback(async () => {
    try {
      const lastId = await AsyncStorage.getItem(LAST_SURAH_KEY);
      if (lastId) {
        const sNum = parseInt(lastId, 10);
        const surah = SURAHS.find(s => s.number === sNum);
        if (surah) {
          const pos = await AsyncStorage.getItem(`al_hifz_pos_${sNum}`);
          // Progress is a bit hard to compute accurately without knowing total height
          // but we can guess from the saved offset if we had it. 
          // For now let's just show the surah.
          setLastSurah({
            surahNumber: sNum,
            surahName: surah.nameArabic,
            progress: pos ? 0.5 : 0, // Placeholder
          });
        }
      }
    } catch {}
  }, []);

  const loadPins = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PINS_KEY);
      if (stored) setPins(JSON.parse(stored));
    } catch {}
  }, []);

  const loadDueCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(REVIEWS_KEY);
      const reviews: Record<string, number> = stored ? JSON.parse(stored) : {};
      setDueCount(countDueBlocks(masteryMap, reviews));
      setReviewBannerDismissed(false);
    } catch {}
  }, [masteryMap]);

  useFocusEffect(useCallback(() => {
    loadHistory();
    loadLastSurah();
    loadPins();
    loadDueCount();
    computeStreak().then(setStreak);
  }, [loadHistory, loadLastSurah, loadPins, loadDueCount]));

  const togglePin = useCallback(async (surahNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPins((prev) => {
      const next = prev.includes(surahNumber)
        ? prev.filter((n) => n !== surahNumber)
        : [...prev, surahNumber];
      AsyncStorage.setItem(PINS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const vodData = useMemo(() => getVerseOfDay(), []);
  const dailyDua = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return BUILT_IN_DUAS[dayOfYear % BUILT_IN_DUAS.length];
  }, []);

  const { mode, filteredSurahs, verseResults } = useMemo<{
    mode: SearchMode; filteredSurahs: Surah[]; verseResults: VerseResult[];
  }>(() => {
    const q = search.trim();

    if (q === "") {
      let surahs = SURAHS.filter((s) => {
        const matchesRev = revFilter === "الكل" || 
          (revFilter === "مكية" && SURAH_TYPE[s.number] === "mecquoise") ||
          (revFilter === "مدنية" && SURAH_TYPE[s.number] === "médinoise");
        const matchesJuz = juzFilter === "كل" || SURAH_JUZ[s.number] === juzFilter;
        return matchesRev && matchesJuz;
      });
      return { mode: "surahs", filteredSurahs: surahs, verseResults: [] };
    }

    const parsed = parseVerseQuery(q);
    if (parsed) {
      const surah = SURAHS.find((s) => s.number === parsed.surahNum);
      if (!surah) return { mode: "surahs", filteredSurahs: [], verseResults: [] };
      const verseData = surah.verses.find((v) => v.number === parsed.verseNum);
      return {
        mode: "verse", filteredSurahs: [],
        verseResults: [{
          surahNumber: surah.number,
          surahNameArabic: surah.nameArabic,
          verseNumber: parsed.verseNum,
          verseText: verseData ? verseData.text : null,
        }],
      };
    }

    const num = parseInt(q, 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      const surah = SURAHS.find((s) => s.number === num);
      return { mode: "surahs", filteredSurahs: surah ? [surah] : [], verseResults: [] };
    }

    // Check if searching in Arabic (Arabic characters range)
    const isArabicSearch = /[\u0600-\u06FF]/.test(q);
    if (isArabicSearch && q.length >= 2) {
      const surahMatches = SURAHS.filter(s => s.nameArabic.includes(q));
      const verseMatches: VerseResult[] = [];
      
      // Full text search through all verses
      for (const s of SURAHS) {
        for (const v of s.verses) {
          if (v.text.includes(q)) {
            verseMatches.push({
              surahNumber: s.number,
              surahNameArabic: s.nameArabic,
              verseNumber: v.number,
              verseText: v.text,
            });
            if (verseMatches.length >= 30) break;
          }
        }
        if (verseMatches.length >= 30) break;
      }
      
      return { mode: "surahs", filteredSurahs: surahMatches, verseResults: verseMatches };
    }

    const matched = SURAHS.filter(
      (s) => s.nameTranslit.toLowerCase().includes(q.toLowerCase())
    );
    return { mode: "surahs", filteredSurahs: matched, verseResults: [] };
  }, [search, revFilter, juzFilter]);

  const showFilters = search.trim() === "";

  const navigateToSurah = useCallback((surahNumber: number) => {
    router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber) } });
  }, []);

  const showBanner = dueCount > 0 && !reviewBannerDismissed && showFilters;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setSettingsVisible(true)} style={styles.gearBtn} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.gold }]}>القرآن الكريم</Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.streakBadge, { backgroundColor: streak > 0 ? colors.gold + "20" : colors.bgSurface, borderColor: streak > 0 ? colors.gold + "60" : colors.border }]}>
              <Ionicons name="flame" size={13} color={streak > 0 ? colors.gold : colors.textMuted} />
              <Text style={[styles.streakText, { color: streak > 0 ? colors.gold : colors.textMuted }]}>{streak}</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>١١٤ سورة • ٦٢٣٦ آية</Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const random = SURAHS[Math.floor(Math.random() * SURAHS.length)];
            router.push({ pathname: "/surah/[id]", params: { id: String(random.number) } });
          }}
          hitSlop={10}
          style={styles.gearBtn}
        >
          <Ionicons name="shuffle-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <FlatList
        data={mode === "surahs" ? filteredSurahs : []}
        keyExtractor={(s) => String(s.number)}
        ListHeaderComponent={
          <>
            {showBanner && (
              <Pressable
                onPress={() => { setReviewBannerDismissed(true); router.push("/(tabs)/bookmarks"); }}
                style={[styles.reviewBanner, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "50" }]}
              >
                <View style={styles.reviewBannerContent}>
                  <Text style={[styles.reviewBannerText, { color: colors.gold }]}>
                    لديك {dueCount} كتلة للمراجعة — اضغط للبدء
                  </Text>
                  <Ionicons name="chevron-back-outline" size={16} color={colors.gold} />
                </View>
                <Pressable onPress={(e) => { e.stopPropagation(); setReviewBannerDismissed(true); }} hitSlop={10}>
                  <Ionicons name="close" size={16} color={colors.gold + "90"} />
                </Pressable>
              </Pressable>
            )}

            {showFilters && showVerseOfDay && !vodDismissed && (
              <View style={styles.vodContainer}>
                <VerseOfDayWidget
                  surahNumber={vodData.surahNumber}
                  verseNumber={vodData.verseNumber}
                  colors={colors}
                  arabicFont={arabicFontFamily}
                  onDismiss={() => setVodDismissed(true)}
                />
              </View>
            )}

            {showFilters && lastSurah && (
              <View style={styles.continueContainer}>
                <ContinueReadingCard data={lastSurah} colors={colors} />
              </View>
            )}

            {showFilters && (
              <View style={styles.duaContainer}>
                <DailyDuaWidget dua={dailyDua} colors={colors} onOpen={() => setSelectedDua(dailyDua)} />
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
                placeholder="ابحث عن سورة، آية، أو نص..."
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

            {showFilters && pins.length > 0 && (
              <View style={styles.pinsSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinsScroll}>
                  <Text style={[styles.pinsSectionLabel, { color: colors.textMuted }]}>المثبتة</Text>
                  {pins.map((num) => (
                    <PinChip key={num} surahNumber={num} colors={colors} onUnpin={() => togglePin(num)} />
                  ))}
                </ScrollView>
              </View>
            )}

            {showFilters && (
              <View style={styles.filtersSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {["الكل", "مكية", "مدنية"].map((label) => (
                    <JuzChip
                      key={label}
                      label={label}
                      selected={revFilter === label}
                      onPress={() => setRevFilter(label as any)}
                      colors={colors}
                    />
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterScroll, { marginTop: 8 }]}>
                  {JUZ_LABELS.map((label) => (
                    <JuzChip
                      key={String(label)}
                      label={label === "كل" ? "كل الأجزاء" : `جزء ${label}`}
                      selected={juzFilter === label}
                      onPress={() => setJuzFilter(label)}
                      colors={colors}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {verseResults.length > 0 && (
              <View style={styles.verseResultsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>نتائج من الآيات</Text>
                {verseResults.map((res, i) => (
                  <VerseResultCard key={`${res.surahNumber}-${res.verseNumber}-${i}`} result={res} colors={colors} arabicFont={arabicFontFamily} />
                ))}
                <View style={{ height: 16 }} />
                {filteredSurahs.length > 0 && (
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>السور المطابقة</Text>
                )}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <SurahCard
            surah={item}
            colors={colors}
            isPinned={pins.includes(item.number)}
            onPress={() => navigateToSurah(item.number)}
            onLongPress={() => togglePin(item.number)}
          />
        )}
        ListEmptyComponent={
          search.trim() !== "" ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد نتائج</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 34 : 120 }]}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedDua} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDua(null)}>
          <View style={[styles.duaModalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.duaModalHeader}>
              <Text style={[styles.duaModalTitle, { color: colors.textPrimary }]}>{selectedDua?.title}</Text>
              <Pressable onPress={() => setSelectedDua(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.duaModalBody}>
              <Text style={[styles.duaModalText, { color: colors.textPrimary, fontFamily: arabicFontFamily }]}>
                {selectedDua?.arabic}
              </Text>
              {selectedDua?.source && (
                <Text style={[styles.duaModalSource, { color: colors.textMuted }]}>المصدر: {selectedDua.source}</Text>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

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
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 3,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  reviewBanner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 8,
  },
  reviewBannerContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  reviewBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "right", flex: 1 },
  vodContainer: { paddingHorizontal: 16, marginBottom: 10 },
  vodWidget: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  vodTapHint: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", marginTop: 4 },
  vodTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vodBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  vodBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  vodRef: { flexDirection: "row", alignItems: "center", gap: 8 },
  vodRefText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  vodText: { fontSize: 20, textAlign: "right", lineHeight: 38 },
  duaFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  duaTapHint: { fontFamily: "Inter_500Medium", fontSize: 11 },
  continueContainer: { paddingHorizontal: 16, marginBottom: 12 },
  continueCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  continueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  continueBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  continueBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  continueSurahName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  continueBody: { gap: 12 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontFamily: "Inter_600SemiBold", fontSize: 12, minWidth: 35 },
  continueBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 12, gap: 8,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  filtersSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginHorizontal: 18, marginBottom: 8, textAlign: "right" },
  verseResultsSection: { paddingHorizontal: 16, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  duaModalContent: { width: "100%", maxHeight: "80%", borderRadius: 24, padding: 24, gap: 16 },
  duaModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duaModalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  duaModalBody: { gap: 16 },
  duaModalText: { fontSize: 22, textAlign: "right", lineHeight: 40 },
  duaModalSource: { fontSize: 13, color: "#888", textAlign: "center", marginTop: 8 },
  duaContainer: { paddingHorizontal: 16, marginBottom: 12 },
  duaWidget: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  duaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duaBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  duaBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  duaTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  duaText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 24 },
  searchContainer: {
    flexDirection: "row", alignItems: "center", borderRadius: 12,
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  historySection: { marginBottom: 4 },
  historyScroll: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  historySectionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginRight: 4 },
  historyChip: {
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  historyChipArabic: { fontSize: 14 },
  historyChipNum: { fontFamily: "Inter_500Medium", fontSize: 10 },
  pinsSection: { marginBottom: 4 },
  pinsScroll: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  pinsSectionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginRight: 4 },
  pinChip: {
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  pinChipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  lengthFilterSection: { marginBottom: 6 },
  filterScroll: { paddingHorizontal: 16, gap: 7 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  listContent: { paddingHorizontal: 16 },
  card: { borderRadius: 14, borderWidth: 1 },
  cardInner: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 14 },
  cardLeft: { flex: 1, alignItems: "flex-start", gap: 5 },
  verseCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  revTypePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  revTypeText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  arabicName: { fontSize: 20, textAlign: "right" },
  numberBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numberText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  verseResultContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  verseResultLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "right", marginBottom: 8 },
  verseCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  verseCardTop: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" },
  verseRefBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  verseRefText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  verseCardName: { fontSize: 18, textAlign: "right" },
  verseCardText: { fontSize: 22, textAlign: "right", lineHeight: 42 },
  verseCardMissing: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "right" },
  verseCardNav: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "flex-end", paddingTop: 2 },
  verseCardNavText: { fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "right" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
