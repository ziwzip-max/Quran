import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks, type VerseBlock } from "@/contexts/BookmarksContext";
import { useMastery } from "@/contexts/MasteryContext";
import { averageLevel, dueBlocks, levelAfterReview, reviewTimeAfter, type ReviewRating } from "@/utils/srs";
import { loadReviews, saveReviews } from "@/utils/reviews";
import { SURAH_NAME_FONT } from "@/constants/themes";

const RATINGS: { key: ReviewRating; label: string; hint: string }[] = [
  { key: "forgot", label: "نسيت", hint: "تعود غدًا" },
  { key: "hard", label: "صعبة", hint: "نفس المستوى" },
  { key: "good", label: "جيدة", hint: "مستوى أعلى" },
];

/**
 * Guided daily review: goes through the memorisation blocks that are due, one
 * at a time. The text stays hidden until revealed, so the user can recite from
 * memory first, then rates how it went.
 */
export default function ReviewScreen() {
  const navigation = useNavigation();
  const { colors, arabicFontFamily } = useSettings();
  const { blocks, isLoaded } = useBookmarks();
  const { getMastery, setMastery, recordDailyReview, masteryMap } = useMastery();

  const [reviews, setReviews] = useState<Record<string, number> | null>(null);
  const [queue, setQueue] = useState<VerseBlock[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Record<ReviewRating, number>>({ forgot: 0, hard: 0, good: 0 });

  useEffect(() => {
    // Right to left, like the surah page: back arrow and title on the right.
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => null,
      headerTitle: () => null,
      headerRight: () => (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/bookmarks"))}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={styles.headerBack}
        >
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>المراجعة اليومية</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  useEffect(() => {
    loadReviews().then(setReviews);
  }, []);

  const blockLevel = useMemo(
    () => (b: VerseBlock) => averageLevel(b.verses.map((v) => getMastery(b.surahNumber, v.number))),
    [getMastery],
  );

  // Build the queue once, when data has loaded, so rating a block doesn't reshuffle it.
  useEffect(() => {
    if (queue || !isLoaded || !reviews) return;
    setQueue(dueBlocks(blocks, masteryMap, reviews));
  }, [queue, isLoaded, reviews, blocks, masteryMap]);

  const rate = async (rating: ReviewRating) => {
    if (!queue || !reviews) return;
    const block = queue[index];
    Haptics.impactAsync(rating === "good" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    const newLevel = levelAfterReview(blockLevel(block), rating);
    block.verses.forEach((v) => setMastery(block.surahNumber, v.number, newLevel));
    const updated = { ...reviews, [block.id]: reviewTimeAfter(rating) };
    setReviews(updated);
    await saveReviews(updated);
    recordDailyReview(block.verses.length);
    setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  if (!queue) {
    return <View style={[styles.center, { backgroundColor: colors.bgDark }]} />;
  }

  if (queue.length === 0 || index >= queue.length) {
    const done = queue.length > 0;
    return (
      <View style={[styles.center, { backgroundColor: colors.bgDark }]}>
        <Ionicons name={done ? "checkmark-circle" : "sunny-outline"} size={56} color={colors.gold} />
        <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>
          {done ? "أحسنت، انتهت مراجعة اليوم" : "لا توجد مقاطع مستحقة للمراجعة اليوم"}
        </Text>
        {done && (
          <Text style={[styles.doneSummary, { color: colors.textSecondary }]}>
            {`جيدة: ${tally.good} · صعبة: ${tally.hard} · نسيت: ${tally.forgot}`}
          </Text>
        )}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/bookmarks"))}
          style={[styles.primary, { backgroundColor: colors.gold }]}
          accessibilityRole="button"
        >
          <Text style={[styles.primaryText, { color: colors.bgCard }]}>رجوع</Text>
        </Pressable>
      </View>
    );
  }

  const block = queue[index];
  const range = block.startVerse === block.endVerse ? `الآية ${block.startVerse}` : `الآيات ${block.startVerse}–${block.endVerse}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${(index / queue.length) * 100}%`, backgroundColor: colors.gold }]} />
      </View>
      <Text style={[styles.counter, { color: colors.textSecondary }]}>
        {index + 1} / {queue.length}
      </Text>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.surahName, { color: colors.gold }]}>{block.surahNameArabic}</Text>
          <Text style={[styles.range, { color: colors.textSecondary }]}>{range}</Text>

          {revealed ? (
            <Text style={[styles.verses, { color: colors.textPrimary, fontFamily: arabicFontFamily }]}>
              {block.verses.map((v) => `${v.text} ﴿${v.number}﴾`).join(" ")}
            </Text>
          ) : (
            <View style={styles.hidden}>
              <Text style={[styles.hiddenText, { color: colors.textSecondary }]}>
                استحضر الآيات من حفظك أولًا، ثم اكشفها للتحقق.
              </Text>
              <Pressable
                onPress={() => setRevealed(true)}
                style={[styles.primary, { backgroundColor: colors.gold }]}
                accessibilityRole="button"
              >
                <Ionicons name="eye-outline" size={20} color={colors.bgCard} />
                <Text style={[styles.primaryText, { color: colors.bgCard }]}>اكشف الآيات</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {revealed && (
        <View style={styles.ratings}>
          {RATINGS.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => rate(r.key)}
              accessibilityRole="button"
              accessibilityLabel={`${r.label} — ${r.hint}`}
              style={[styles.rating, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <Text style={[styles.ratingLabel, { color: colors.textPrimary }]}>{r.label}</Text>
              <Text style={[styles.ratingHint, { color: colors.textSecondary }]}>{r.hint}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 16 },
  headerBack: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 8 },
  headerTitle: { fontFamily: "Tajawal_400Regular", fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: 3 },
  counter: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", marginTop: 10 },
  body: { padding: 16, flexGrow: 1, maxWidth: 720, width: "100%", alignSelf: "center" },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 10 },
  surahName: { fontFamily: SURAH_NAME_FONT, fontSize: 26, textAlign: "center" },
  range: { fontFamily: "Tajawal_400Regular", fontSize: 15, textAlign: "center" },
  verses: { fontSize: 24, lineHeight: 48, textAlign: "right", marginTop: 6 },
  hidden: { alignItems: "center", gap: 14, paddingVertical: 28 },
  hiddenText: { fontFamily: "Tajawal_400Regular", fontSize: 16, textAlign: "center", lineHeight: 26 },
  primary: { flexDirection: "row-reverse", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 24, borderRadius: 24 },
  primaryText: { fontFamily: "Tajawal_400Regular", fontSize: 17 },
  ratings: { flexDirection: "row-reverse", gap: 10, paddingHorizontal: 16, maxWidth: 720, width: "100%", alignSelf: "center" },
  rating: { flex: 1, minHeight: 64, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 2 },
  ratingLabel: { fontFamily: "Tajawal_400Regular", fontSize: 18 },
  ratingHint: { fontFamily: "Tajawal_400Regular", fontSize: 12 },
  doneTitle: { fontFamily: "Tajawal_400Regular", fontSize: 20, textAlign: "center" },
  doneSummary: { fontFamily: "Tajawal_400Regular", fontSize: 15, textAlign: "center" },
});
