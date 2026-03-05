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
import { useBookmarks } from "@/contexts/BookmarksContext";
import { BookmarkedVerse } from "@/constants/quranData";

function pickTwo(verses: BookmarkedVerse[]): BookmarkedVerse[] {
  if (verses.length === 0) return [];
  if (verses.length === 1) return [verses[0]];
  if (verses.length === 2) return [...verses];

  const indices = new Set<number>();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * verses.length));
  }
  const picked = Array.from(indices).map((i) => verses[i]);
  picked.sort((a, b) => {
    if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
    return a.verseNumber - b.verseNumber;
  });
  return picked;
}

function PracticeCard({ verse, index }: { verse: BookmarkedVerse; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.practiceCard, animStyle]}>
      <View style={styles.practiceCardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.practiceRefBadge}>
          <Text style={styles.practiceRefText}>
            {verse.surahNameTranslit} {verse.surahNumber}:{verse.verseNumber}
          </Text>
        </View>
      </View>

      <Text style={styles.practiceArabicText}>{verse.text}</Text>

      <View style={styles.practiceCardFooter}>
        <Text style={styles.practiceSurahArabic}>{verse.surahNameArabic}</Text>
        <Text style={styles.practiceVerse}>Verset {verse.verseNumber}</Text>
      </View>
    </Animated.View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarkedVerses, isLoaded } = useBookmarks();
  const [selected, setSelected] = useState<BookmarkedVerse[]>([]);
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
    setSelected(pickTwo(bookmarkedVerses));
    setHasDrawn(true);
  }, [bookmarkedVerses]);

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const isEmpty = bookmarkedVerses.length === 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tirage</Text>
        <Text style={styles.subtitle}>Versets pour la prière</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun verset mémorisé</Text>
            <Text style={styles.emptyDesc}>
              Marquez des versets dans l'onglet Mémorisation pour pouvoir effectuer un tirage.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={Colors.tealLight} />
              <Text style={styles.infoText}>
                {bookmarkedVerses.length} verset{bookmarkedVerses.length > 1 ? "s" : ""} disponible{bookmarkedVerses.length > 1 ? "s" : ""}. Le tirage propose 2 versets parmi vos versets mémorisés, triés dans l'ordre coranique.
              </Text>
            </View>

            {!hasDrawn && (
              <View style={styles.promptArea}>
                <Text style={styles.promptArabic}>﴿ بِسْمِ اللَّهِ ﴾</Text>
                <Text style={styles.promptHint}>Appuyez sur "Tirer" pour commencer</Text>
              </View>
            )}

            {hasDrawn && selected.length > 0 && (
              <View style={styles.cardsContainer}>
                <Text style={styles.sectionLabel}>Versets proposés pour la prière</Text>
                {selected.map((v, i) => (
                  <PracticeCard
                    key={`${v.surahNumber}:${v.verseNumber}`}
                    verse={v}
                    index={i}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!isEmpty && (
        <View style={[styles.drawButtonContainer, { bottom: bottomPadding - (Platform.OS === "web" ? 34 : insets.bottom) }]}>
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
                {hasDrawn ? "Nouveau tirage" : "Tirer"}
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
  },
  promptArea: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  promptArabic: {
    fontSize: 28,
    color: Colors.gold,
    textAlign: "center",
  },
  promptHint: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  cardsContainer: {
    gap: 12,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  practiceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  practiceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    color: Colors.bgDark,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  practiceRefBadge: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  practiceRefText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  practiceArabicText: {
    color: Colors.textPrimary,
    fontSize: 24,
    textAlign: "right",
    lineHeight: 44,
  },
  practiceCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  practiceSurahArabic: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  practiceVerse: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
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
    lineHeight: 22,
  },
  drawButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
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
