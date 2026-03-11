import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks, SurahGroup, VerseBlock } from "@/contexts/BookmarksContext";
import { useMastery } from "@/contexts/MasteryContext";
import { SURAHS } from "@/constants/quranData";

const REVIEWS_KEY = "al_hifz_reviews";
const REVIEW_THRESHOLD_L1 = 3 * 24 * 60 * 60 * 1000;
const REVIEW_THRESHOLD_L2 = 7 * 24 * 60 * 60 * 1000;
const REVIEW_THRESHOLD_L3 = 30 * 24 * 60 * 60 * 1000;

async function loadReviews(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(REVIEWS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

async function saveReviews(reviews: Record<string, number>) {
  try { await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); } catch {}
}

function isDueForReview(blockId: string, reviews: Record<string, number>, masteryLevel: number): boolean {
  const lastReview = reviews[blockId];
  if (lastReview === undefined) return masteryLevel > 0;
  const elapsed = Date.now() - lastReview;
  if (masteryLevel === 1) return elapsed > REVIEW_THRESHOLD_L1;
  if (masteryLevel === 2) return elapsed > REVIEW_THRESHOLD_L2;
  if (masteryLevel === 3) return elapsed > REVIEW_THRESHOLD_L3;
  return false;
}

export { isDueForReview, REVIEW_THRESHOLD_L1, REVIEW_THRESHOLD_L2, REVIEW_THRESHOLD_L3 };

function StatBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={barStyles.container}>
      <View style={[barStyles.track, { backgroundColor: color + "20" }]}>
        <View style={[barStyles.fill, { flex: pct, backgroundColor: color }]} />
        <View style={{ flex: 1 - pct }} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { height: 6, borderRadius: 3, overflow: "hidden", flex: 1 },
  track: { flex: 1, flexDirection: "row", borderRadius: 3 },
  fill: { borderRadius: 3 },
});

function StatsPanel({
  colors, totalVerses, masteredCount, inProgressCount, completeSurahs,
}: {
  colors: ReturnType<typeof useSettings>["colors"];
  totalVerses: number; masteredCount: number;
  inProgressCount: number; completeSurahs: number;
}) {
  const notStarted = totalVerses - masteredCount - inProgressCount;
  return (
    <View style={[statsStyles.panel, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={statsStyles.topRow}>
        <View style={statsStyles.statBlock}>
          <Text style={[statsStyles.statNum, { color: colors.textPrimary }]}>{totalVerses}</Text>
          <Text style={[statsStyles.statLabel, { color: colors.textMuted }]}>محفوظة</Text>
        </View>
        <View style={[statsStyles.divider, { backgroundColor: colors.border }]} />
        <View style={statsStyles.statBlock}>
          <Text style={[statsStyles.statNum, { color: "#27AE60" }]}>{masteredCount}</Text>
          <Text style={[statsStyles.statLabel, { color: colors.textMuted }]}>مُتقنة</Text>
        </View>
        <View style={[statsStyles.divider, { backgroundColor: colors.border }]} />
        <View style={statsStyles.statBlock}>
          <Text style={[statsStyles.statNum, { color: "#E67E22" }]}>{inProgressCount}</Text>
          <Text style={[statsStyles.statLabel, { color: colors.textMuted }]}>قيد الحفظ</Text>
        </View>
        <View style={[statsStyles.divider, { backgroundColor: colors.border }]} />
        <View style={statsStyles.statBlock}>
          <Text style={[statsStyles.statNum, { color: colors.gold }]}>{completeSurahs}</Text>
          <Text style={[statsStyles.statLabel, { color: colors.textMuted }]}>سورة كاملة</Text>
        </View>
      </View>
      {totalVerses > 0 && (
        <View style={statsStyles.barsRow}>
          <View style={statsStyles.barItem}><StatBar value={notStarted} total={totalVerses} color={colors.textMuted} /></View>
          <View style={statsStyles.barItem}><StatBar value={inProgressCount} total={totalVerses} color="#E67E22" /></View>
          <View style={statsStyles.barItem}><StatBar value={masteredCount} total={totalVerses} color="#27AE60" /></View>
        </View>
      )}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  panel: { borderRadius: 16, padding: 14, borderWidth: 1, marginHorizontal: 16, marginBottom: 14, gap: 12 },
  topRow: { flexDirection: "row", alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center", gap: 3 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  divider: { width: 1, height: 34, marginHorizontal: 4 },
  barsRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  barItem: { flex: 1 },
});

const MASTERY_DOT_COLORS = ["#4A5880", "#E67E22", "#C9A227", "#27AE60"] as const;

function BlockItem({
  block, onRemoveVerse, colors, arabicFont, reviews, onReview,
}: {
  block: VerseBlock;
  onRemoveVerse: (verseNumber: number) => void;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
  reviews: Record<string, number>;
  onReview: (blockId: string) => void;
}) {
  const { getMastery, cycleMastery } = useMastery();

  const avgMastery = useMemo(() => {
    if (block.verses.length === 0) return 0;
    const total = block.verses.reduce((sum, v) => sum + getMastery(block.surahNumber, v.number), 0);
    return Math.round(total / block.verses.length);
  }, [block, getMastery]);

  const isDue = useMemo(() =>
    isDueForReview(block.id, reviews, avgMastery),
    [block.id, reviews, avgMastery]
  );

  const rangeLabel = block.startVerse === block.endVerse
    ? `الآية ${block.startVerse}`
    : `الآيات ${block.startVerse} – ${block.endVerse}`;

  return (
    <View style={[styles.blockItem, { backgroundColor: colors.bgSurface }]}>
      <View style={styles.blockHeader}>
        <View style={styles.blockHeaderLeft}>
          <Text style={[styles.blockRange, { color: colors.gold }]}>{rangeLabel}</Text>
          {isDue && (
            <View style={[styles.reviewBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "50" }]}>
              <Ionicons name="time-outline" size={12} color={colors.gold} />
              <Text style={[styles.reviewBadgeText, { color: colors.gold }]}>يستحق المراجعة</Text>
            </View>
          )}
        </View>
        <View style={styles.blockHeaderActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/surah/[id]", params: { id: String(block.surahNumber), verse: String(block.startVerse) } });
            }}
            hitSlop={8}
          >
            <Ionicons name="book-outline" size={16} color={colors.tealLight} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              for (let vn = block.startVerse; vn <= block.endVerse; vn++) {
                onRemoveVerse(vn);
              }
            }}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      {block.verses.map((verse) => {
        const mastery = getMastery(block.surahNumber, verse.number);
        const dotColor = MASTERY_DOT_COLORS[mastery];
        return (
          <View key={verse.number} style={styles.verseRow}>
            <Pressable
              onPress={() => {
                cycleMastery(block.surahNumber, verse.number);
                onReview(block.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={10}
              style={[styles.masteryDotBtn, { borderColor: dotColor, backgroundColor: dotColor + "25" }]}
            >
              <View style={[styles.masteryDot, { backgroundColor: dotColor }]} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/surah/[id]", params: { id: String(block.surahNumber), verse: String(verse.number) } });
              }}
              hitSlop={6}
              style={[styles.verseNumBadge, { backgroundColor: colors.bgCard }]}
            >
              <Text style={[styles.verseNumText, { color: colors.textMuted }]}>{verse.number}</Text>
            </Pressable>
            <Text style={[styles.verseText, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}>
              {verse.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SurahSection({
  group, onRemoveVerse, colors, arabicFont, reviews, onReview,
}: {
  group: SurahGroup;
  onRemoveVerse: (surahNumber: number, verseNumber: number) => void;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
  reviews: Record<string, number>;
  onReview: (blockId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const hasDueBlocks = useMemo(() =>
    group.blocks.some((b) => {
      const lastReview = reviews[b.id];
      return lastReview === undefined
        ? true
        : Date.now() - lastReview > REVIEW_THRESHOLD_L1;
    }),
    [group.blocks, reviews]
  );

  const toggle = () => {
    Animated.timing(rotation, { toValue: expanded ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    setExpanded(!expanded);
    if (!expanded) {
      group.blocks.forEach((b) => onReview(b.id));
    }
    Haptics.selectionAsync();
  };

  const rotateInterpolate = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });

  return (
    <View style={[styles.surahSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Pressable onPress={toggle} style={styles.surahHeader}>
        <View style={styles.surahHeaderLeft}>
          <View style={[styles.surahNumBadge, { backgroundColor: colors.bgSurface, borderColor: colors.gold + "40" }]}>
            <Text style={[styles.surahNumText, { color: colors.gold }]}>{group.surahNumber}</Text>
          </View>
          <Text style={[styles.surahArabicName, { color: colors.textPrimary }]}>{group.surahNameArabic}</Text>
          {hasDueBlocks && !expanded && (
            <Ionicons name="time-outline" size={14} color={colors.gold} />
          )}
        </View>
        <View style={styles.surahHeaderRight}>
          <View style={[styles.countBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "30" }]}>
            <Text style={[styles.countText, { color: colors.gold }]}>{group.totalVerses} آية</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.blocksContainer, { borderTopColor: colors.border }]}>
          {group.blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              onRemoveVerse={(vn) => onRemoveVerse(group.surahNumber, vn)}
              colors={colors}
              arabicFont={arabicFont}
              reviews={reviews}
              onReview={onReview}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { surahGroups, toggleBookmark, isLoaded, blocks, bookmarks } = useBookmarks();
  const { colors, arabicFontFamily } = useSettings();
  const { masteryMap: mastery } = useMastery();
  const [reviews, setReviews] = useState<Record<string, number>>({});

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  useFocusEffect(useCallback(() => {
    loadReviews().then(setReviews);
  }, []));

  const markReviewed = useCallback((blockId: string) => {
    setReviews((prev) => {
      const updated = { ...prev, [blockId]: Date.now() };
      saveReviews(updated);
      return updated;
    });
  }, []);

  const totalVerses = blocks.reduce((sum, b) => sum + b.verses.length, 0);

  const { masteredCount, inProgressCount, completeSurahs } = useMemo(() => {
    let mastered = 0;
    let inProgress = 0;
    for (const block of blocks) {
      for (const verse of block.verses) {
        const key = `${block.surahNumber}:${verse.number}`;
        const level = mastery[key] ?? 0;
        if (level >= 2) mastered++;
        else if (level === 1) inProgress++;
      }
    }
    let complete = 0;
    for (const surah of SURAHS) {
      const allBookmarked = surah.verses.every((v) => bookmarks[`${surah.number}:${v.number}`]);
      if (allBookmarked && surah.verses.length > 0) complete++;
    }
    return { masteredCount: mastered, inProgressCount: inProgress, completeSurahs: complete };
  }, [blocks, mastery, bookmarks]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding, justifyContent: "center" }]}>
        <Text style={[{ color: colors.textSecondary, textAlign: "center", fontFamily: "Inter_400Regular" }]}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>الحفظ</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalVerses > 0
            ? `${totalVerses} آية في ${surahGroups.length} سورة`
            : "لا توجد آيات محفوظة"}
        </Text>
      </View>

      {totalVerses > 0 && (
        <StatsPanel
          colors={colors}
          totalVerses={totalVerses}
          masteredCount={masteredCount}
          inProgressCount={inProgressCount}
          completeSurahs={completeSurahs}
        />
      )}

      <FlatList
        data={surahGroups}
        keyExtractor={(g) => String(g.surahNumber)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 34 : 120 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SurahSection
            group={item}
            onRemoveVerse={(surahNumber, verseNumber) => toggleBookmark(surahNumber, verseNumber)}
            colors={colors}
            arabicFont={arabicFontFamily}
            reviews={reviews}
            onReview={markReviewed}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد آيات محفوظة</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              اضغط على الإشارة المرجعية عند قراءة أي سورة لإضافة الآيات للحفظ.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  listContent: { paddingHorizontal: 16 },
  surahSection: { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  surahHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 14 },
  surahHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  surahHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  surahNumBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  surahNumText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  surahArabicName: { fontSize: 17 },
  countBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  countText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  blocksContainer: { borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 14, gap: 12 },
  blockItem: { borderRadius: 12, padding: 12, gap: 10 },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  blockHeaderActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  blockHeaderLeft: { flex: 1, gap: 4 },
  blockRange: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  reviewBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, alignSelf: "flex-start",
  },
  reviewBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  masteryDotBtn: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    marginTop: 7, flexShrink: 0,
  },
  masteryDot: { width: 8, height: 8, borderRadius: 4 },
  verseNumBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4, flexShrink: 0 },
  verseNumText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  verseText: { flex: 1, fontSize: 20, textAlign: "right", lineHeight: 38 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 24 },
});
