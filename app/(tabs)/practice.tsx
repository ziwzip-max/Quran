import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks, VerseBlock } from "@/contexts/BookmarksContext";

type PracticeMode = "عرض" | "اختبار";

function maskText(text: string): { visible: string; hidden: string } {
  const words = text.trim().split(/\s+/);
  const cutAt = Math.max(1, Math.ceil(words.length * 0.55));
  return {
    visible: words.slice(0, cutAt).join(" "),
    hidden: words.slice(cutAt).join(" "),
  };
}

function pickTwoBlocks(blocks: VerseBlock[]): VerseBlock[] {
  if (blocks.length === 0) return [];
  if (blocks.length === 1) return [blocks[0]];
  if (blocks.length === 2) return [...blocks];
  const indices = new Set<number>();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * blocks.length));
  }
  return Array.from(indices)
    .map((i) => blocks[i])
    .sort((a, b) => a.surahNumber !== b.surahNumber ? a.surahNumber - b.surahNumber : a.startVerse - b.startVerse);
}

function DisplayBlockCard({
  block, index, colors, arabicFont,
}: {
  block: VerseBlock; index: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const rangeLabel = block.startVerse === block.endVerse
    ? `الآية ${block.startVerse}`
    : `الآيات ${block.startVerse} – ${block.endVerse}`;

  return (
    <View style={[styles.blockCard, { backgroundColor: colors.bgCard, borderColor: colors.gold + "30" }]}>
      <View style={[styles.blockCardHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.indexBadge, { backgroundColor: colors.gold }]}>
          <Text style={[styles.indexText, { color: colors.bgDark }]}>{index + 1}</Text>
        </View>
        <View style={styles.refInfo}>
          <View style={styles.refSurahRow}>
            <Text style={[styles.refSurahArabic, { color: colors.textPrimary }]}>{block.surahNameArabic}</Text>
            <Text style={[styles.refSurahNumber, { color: colors.textMuted }]}>({block.surahNumber})</Text>
          </View>
          <Text style={[styles.refRange, { color: colors.textMuted }]}>{rangeLabel}</Text>
        </View>
      </View>
      <View style={styles.versesContainer}>
        {block.verses.map((verse) => (
          <View key={verse.number} style={styles.verseRow}>
            <Text style={[styles.verseArabic, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}>
              {verse.text}
            </Text>
            <View style={[styles.verseNumDot, { backgroundColor: colors.bgSurface }]}>
              <Text style={[styles.verseNumText, { color: colors.textMuted }]}>{verse.number}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TestBlockCard({
  block, index, colors, arabicFont,
}: {
  block: VerseBlock; index: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const rangeLabel = block.startVerse === block.endVerse
    ? `الآية ${block.startVerse}`
    : `الآيات ${block.startVerse} – ${block.endVerse}`;

  const revealAll = () => {
    const all: Record<number, boolean> = {};
    block.verses.forEach((v) => { all[v.number] = true; });
    setRevealed(all);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const revealedCount = Object.keys(revealed).length;
  const allRevealed = revealedCount === block.verses.length;

  return (
    <View style={[styles.blockCard, { backgroundColor: colors.bgCard, borderColor: colors.gold + "30" }]}>
      <View style={[styles.blockCardHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.indexBadge, { backgroundColor: colors.gold }]}>
          <Text style={[styles.indexText, { color: colors.bgDark }]}>{index + 1}</Text>
        </View>
        <View style={styles.refInfo}>
          <View style={styles.refSurahRow}>
            <Text style={[styles.refSurahArabic, { color: colors.textPrimary }]}>{block.surahNameArabic}</Text>
            <Text style={[styles.refSurahNumber, { color: colors.textMuted }]}>({block.surahNumber})</Text>
          </View>
          <Text style={[styles.refRange, { color: colors.textMuted }]}>{rangeLabel}</Text>
        </View>
        {!allRevealed && (
          <Pressable onPress={revealAll} style={[styles.revealAllBtn, { borderColor: colors.gold + "40", backgroundColor: colors.gold + "10" }]}>
            <Text style={[styles.revealAllText, { color: colors.gold }]}>كشف الكل</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.versesContainer}>
        {block.verses.map((verse) => {
          const isRevealed = !!revealed[verse.number];
          const { visible, hidden } = maskText(verse.text);
          return (
            <View key={verse.number} style={styles.testVerseRow}>
              <View style={styles.testVerseTop}>
                <View style={[styles.verseNumDot, { backgroundColor: colors.bgSurface }]}>
                  <Text style={[styles.verseNumText, { color: colors.textMuted }]}>{verse.number}</Text>
                </View>
                {!isRevealed && (
                  <Pressable
                    onPress={() => {
                      setRevealed((prev) => ({ ...prev, [verse.number]: true }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.revealBtn, { backgroundColor: colors.teal + "20", borderColor: colors.teal + "40" }]}
                  >
                    <Ionicons name="eye-outline" size={13} color={colors.tealLight} />
                    <Text style={[styles.revealBtnText, { color: colors.tealLight }]}>كشف</Text>
                  </Pressable>
                )}
              </View>
              {isRevealed ? (
                <Text style={[styles.verseArabic, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}>
                  {verse.text}
                </Text>
              ) : (
                <Text style={[styles.verseArabic, { color: colors.textPrimary, textAlign: "right" }, arabicFont ? { fontFamily: arabicFont } : {}]}>
                  {visible}{" "}
                  <Text style={{ color: colors.textMuted, letterSpacing: 4 }}>﹏﹏﹏﹏</Text>
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { blocks } = useBookmarks();
  const { colors, arabicFontFamily } = useSettings();
  const [selected, setSelected] = useState<VerseBlock[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<PracticeMode>("عرض");

  const buttonScale = useRef(new Animated.Value(1)).current;

  const draw = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(pickTwoBlocks(blocks));
    setHasDrawn(true);
  }, [blocks]);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const isEmpty = blocks.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>آيات الصلاة</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>اختيار عشوائي للتلاوة في الصلاة</Text>
      </View>

      {!isEmpty && hasDrawn && (
        <View style={[styles.modeBar, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          {(["عرض", "اختبار"] as PracticeMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, mode === m && { backgroundColor: colors.gold }]}
            >
              <Text style={[styles.modeBtnText, { color: mode === m ? colors.bgDark : colors.textMuted }]}>{m}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد آيات محفوظة</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              أضف آيات للحفظ من صفحة "الحفظ" لتتمكن من التسميع.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.infoBox, { backgroundColor: colors.teal + "20", borderColor: colors.teal + "40" }]}>
              <Ionicons name="information-circle" size={16} color={colors.tealLight} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {blocks.length === 1 ? "مجموعة واحدة متاحة" : `${blocks.length} مجموعة • مجموعتان عشوائيتان مقترحتان`}
              </Text>
            </View>

            {!hasDrawn && (
              <View style={styles.promptArea}>
                <Text style={[styles.promptArabic, { color: colors.gold }]}>﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴾</Text>
                <Text style={[styles.promptHint, { color: colors.textMuted }]}>اضغط على "اقترح" للبدء</Text>
              </View>
            )}

            {hasDrawn && selected.length > 0 && (
              <View style={styles.cardsContainer}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  {mode === "عرض" ? "المجموعات المقترحة" : "اختبر حفظك — أكمل الآيات"}
                </Text>
                {selected.map((block, i) =>
                  mode === "عرض" ? (
                    <DisplayBlockCard key={block.id} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />
                  ) : (
                    <TestBlockCard key={block.id + mode} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />
                  )
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!isEmpty && (
        <View style={[styles.drawButtonContainer, { bottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 90 + 16 }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={draw}
              style={({ pressed }) => [styles.drawButton, { backgroundColor: colors.gold }, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="shuffle" size={20} color={colors.bgDark} />
              <Text style={[styles.drawButtonText, { color: colors.bgDark }]}>
                {hasDrawn ? "اقترح جديد" : "اقترح"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  modeBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  infoBox: {
    flexDirection: "row", borderRadius: 12, padding: 12,
    gap: 8, borderWidth: 1, marginBottom: 16, alignItems: "flex-start",
  },
  infoText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "right" },
  promptArea: { alignItems: "center", paddingVertical: 48, gap: 16 },
  promptArabic: { fontSize: 22, textAlign: "center", lineHeight: 36 },
  promptHint: { fontFamily: "Inter_400Regular", fontSize: 14 },
  cardsContainer: { gap: 14 },
  sectionLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "right", marginBottom: 4 },
  blockCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  blockCardHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  indexBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  indexText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  refInfo: { flex: 1 },
  refSurahRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  refSurahArabic: { fontSize: 16, textAlign: "right" },
  refSurahNumber: { fontFamily: "Inter_500Medium", fontSize: 13 },
  refRange: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", marginTop: 2 },
  versesContainer: { gap: 12 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  verseArabic: { flex: 1, fontSize: 22, textAlign: "right", lineHeight: 42 },
  verseNumDot: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center",
    justifyContent: "center", marginTop: 6, flexShrink: 0,
  },
  verseNumText: { fontFamily: "Inter_500Medium", fontSize: 9 },
  revealAllBtn: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  revealAllText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  testVerseRow: { gap: 8 },
  testVerseTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  revealBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  revealBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 24 },
  drawButtonContainer: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  drawButton: { flexDirection: "row", alignItems: "center", borderRadius: 50, paddingVertical: 16, paddingHorizontal: 36, gap: 10 },
  drawButtonText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
