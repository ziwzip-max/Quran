import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useBookmarks, VerseBlock } from "@/contexts/BookmarksContext";

function pickTwoBlocks(blocks: VerseBlock[]): VerseBlock[] {
  if (blocks.length === 0) return [];
  if (blocks.length === 1) return [blocks[0]];
  if (blocks.length === 2) return [...blocks];

  const indices = new Set<number>();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * blocks.length));
  }

  const picked = Array.from(indices).map((i) => blocks[i]);
  picked.sort((a, b) => {
    if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
    return a.startVerse - b.startVerse;
  });
  return picked;
}

function BlockCard({ block, index }: { block: VerseBlock; index: number }) {
  const rangeLabel =
    block.startVerse === block.endVerse
      ? `الآية ${block.startVerse}`
      : `الآيات ${block.startVerse} – ${block.endVerse}`;

  return (
    <View style={styles.blockCard}>
      <View style={styles.blockCardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.refInfo}>
          <View style={styles.refSurahRow}>
            <Text style={styles.refSurahArabic}>{block.surahNameArabic}</Text>
            <Text style={styles.refSurahNumber}>({block.surahNumber})</Text>
          </View>
          <Text style={styles.refRange}>{rangeLabel}</Text>
        </View>
        <Text style={styles.refTranslit}>{block.surahNameTranslit}</Text>
      </View>

      <View style={styles.versesContainer}>
        {block.verses.map((verse) => (
          <View key={verse.number} style={styles.verseRow}>
            <Text style={styles.verseArabic}>{verse.text}</Text>
            <View style={styles.verseNumDot}>
              <Text style={styles.verseNumText}>{verse.number}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { blocks } = useBookmarks();
  const [selected, setSelected] = useState<VerseBlock[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const draw = useCallback(() => {
    buttonScale.value = withSequence(
      withSpring(0.92, { duration: 100 }),
      withSpring(1, { duration: 150 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(pickTwoBlocks(blocks));
    setHasDrawn(true);
  }, [blocks]);

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding =
    Platform.OS === "web" ? 34 : insets.bottom + 90;

  const isEmpty = blocks.length === 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>آيات الصلاة</Text>
        <Text style={styles.subtitle}>اختيار عشوائي للتلاوة في الصلاة</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 70 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="bookmark-outline"
              size={52}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>لا توجد آيات محفوظة</Text>
            <Text style={styles.emptyDesc}>
              أضف آيات للحفظ من صفحة "الحفظ" لتتمكن من التسميع.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={16}
                color={Colors.tealLight}
              />
              <Text style={styles.infoText}>
                {blocks.length === 1
                  ? "مجموعة واحدة متاحة للتسميع"
                  : `${blocks.length} مجموعة متاحة • سيتم اقتراح مجموعتين عشوائيتين مرتبتين حسب ترتيب المصحف`}
              </Text>
            </View>

            {!hasDrawn && (
              <View style={styles.promptArea}>
                <Text style={styles.promptArabic}>﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴾</Text>
                <Text style={styles.promptHint}>اضغط على "تسميع" للبدء</Text>
              </View>
            )}

            {hasDrawn && selected.length > 0 && (
              <View style={styles.cardsContainer}>
                <Text style={styles.sectionLabel}>المجموعات المقترحة للصلاة</Text>
                {selected.map((block, i) => (
                  <BlockCard key={block.id} block={block} index={i} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!isEmpty && (
        <View
          style={[
            styles.drawButtonContainer,
            {
              bottom:
                Platform.OS === "web"
                  ? 34 + 16
                  : insets.bottom + 90 + 16,
            },
          ]}
        >
          <Animated.View style={buttonAnimStyle}>
            <Pressable
              onPress={draw}
              style={({ pressed }) => [
                styles.drawButton,
                pressed && styles.drawButtonPressed,
              ]}
            >
              <Ionicons name="shuffle" size={20} color={Colors.bgDark} />
              <Text style={styles.drawButtonText}>
                {hasDrawn ? "تسميع جديد" : "تسميع"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.teal + "20",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.teal + "40",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  promptArea: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  promptArabic: {
    fontSize: 22,
    color: Colors.gold,
    textAlign: "center",
    lineHeight: 36,
  },
  promptHint: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  cardsContainer: {
    gap: 14,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 4,
  },
  blockCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  blockCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexText: {
    color: Colors.bgDark,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  refInfo: {
    flex: 1,
  },
  refSurahRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  refSurahArabic: {
    color: Colors.textPrimary,
    fontSize: 16,
    textAlign: "right",
  },
  refSurahNumber: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  refRange: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
  },
  refTranslit: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  versesContainer: {
    gap: 12,
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  verseArabic: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: "right",
    lineHeight: 42,
  },
  verseNumDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    flexShrink: 0,
  },
  verseNumText: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 9,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
  },
  drawButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  drawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 36,
    gap: 10,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  drawButtonPressed: {
    opacity: 0.85,
  },
  drawButtonText: {
    color: Colors.bgDark,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
