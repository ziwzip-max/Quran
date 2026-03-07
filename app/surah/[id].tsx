import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS, Verse } from "@/constants/quranData";
import { useBookmarks } from "@/contexts/BookmarksContext";

const MIN_FONT = 16;
const MAX_FONT = 36;
const FONT_STEP = 2;

function VerseItem({
  verse,
  isBookmarked,
  onToggle,
  fontSize,
  arabicFont,
}: {
  verse: Verse;
  isBookmarked: boolean;
  onToggle: () => void;
  fontSize: number;
  arabicFont: string | undefined;
}) {
  const { colors } = useSettings();
  const scale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={[
      styles.verseContainer,
      {
        backgroundColor: isBookmarked ? colors.gold + "0D" : colors.bgCard,
        borderColor: isBookmarked ? colors.gold + "50" : colors.border,
      }
    ]}>
      <View style={styles.verseHeader}>
        <View style={[
          styles.verseNumberBadge,
          {
            backgroundColor: isBookmarked ? colors.gold + "20" : colors.bgSurface,
            borderColor: isBookmarked ? colors.gold + "60" : colors.border,
          }
        ]}>
          <Text style={[styles.verseNumberText, { color: isBookmarked ? colors.gold : colors.textMuted }]}>
            {verse.number}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable onPress={handleToggle} hitSlop={12}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? colors.gold : colors.textMuted}
            />
          </Pressable>
        </Animated.View>
      </View>
      <Text style={[
        styles.verseText,
        { fontSize, lineHeight: fontSize * 1.9, color: colors.textPrimary },
        arabicFont ? { fontFamily: arabicFont } : {},
      ]}>
        {verse.text}
      </Text>
    </View>
  );
}

export default function SurahScreen() {
  const { id, verse: verseParam } = useLocalSearchParams<{ id: string; verse?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors, arabicFontFamily } = useSettings();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  const [fontSize, setFontSize] = useState(22);
  const flatListRef = useRef<FlatList<Verse>>(null);
  const hasScrolled = useRef(false);

  const increaseFont = useCallback(() => setFontSize((f) => Math.min(f + FONT_STEP, MAX_FONT)), []);
  const decreaseFont = useCallback(() => setFontSize((f) => Math.max(f - FONT_STEP, MIN_FONT)), []);

  useEffect(() => {
    if (surah) {
      navigation.setOptions({
        title: surah.nameArabic,
        headerStyle: { backgroundColor: colors.bgDark },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerBackTitle: "القرآن",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}>
            <Pressable
              onPress={decreaseFont}
              hitSlop={10}
              style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontFamily: "Inter_700Bold" }}>ا-</Text>
            </Pressable>
            <Pressable
              onPress={increaseFont}
              hitSlop={10}
              style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontFamily: "Inter_700Bold" }}>ا+</Text>
            </Pressable>
          </View>
        ),
      });
    }
  }, [surah, navigation, colors, decreaseFont, increaseFont]);

  useEffect(() => {
    if (!surah || !verseParam || hasScrolled.current) return;
    const targetVerse = parseInt(verseParam, 10);
    if (isNaN(targetVerse)) return;
    const index = surah.verses.findIndex((v) => v.number === targetVerse);
    if (index < 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      hasScrolled.current = true;
    }, 400);
    return () => clearTimeout(timer);
  }, [surah, verseParam]);

  if (!surah) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.bgDark }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>السورة غير موجودة</Text>
      </View>
    );
  }

  const headerComponent = (
    <View style={[styles.surahHeader, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.surahArabicName, { color: colors.gold }, arabicFontFamily ? { fontFamily: arabicFontFamily } : {}]}>
        {surah.nameArabic}
      </Text>
      <View style={styles.surahMeta}>
        <View style={[styles.metaPill, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{surah.versesCount} آية</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>سورة {surah.number}</Text>
        </View>
      </View>
      {surah.number !== 1 && surah.number !== 9 && (
        <View style={[styles.bismillahContainer, { borderTopColor: colors.border }]}>
          <Text style={[
            styles.bismillah,
            { color: colors.textSecondary },
            arabicFontFamily ? { fontFamily: arabicFontFamily } : {},
          ]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgDark }}>
      <FlatList
        ref={flatListRef}
        data={surah.verses}
        keyExtractor={(v) => String(v.number)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
          }, 300);
        }}
        renderItem={({ item }) => (
          <VerseItem
            verse={item}
            isBookmarked={isBookmarked(surah.number, item.number)}
            onToggle={() => toggleBookmark(surah.number, item.number)}
            fontSize={fontSize}
            arabicFont={arabicFontFamily}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.verseSeparator} />}
      />
    </View>
  );
}

const fontBtnStyle: object = {
  borderRadius: 8,
  borderWidth: 1,
  paddingHorizontal: 8,
  paddingVertical: 4,
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  surahHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  surahArabicName: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 6,
  },
  surahMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  bismillahContainer: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  bismillah: {
    fontSize: 21,
    textAlign: "center",
    lineHeight: 36,
  },
  verseContainer: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  verseNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  verseText: {
    textAlign: "right",
  },
  verseSeparator: {
    height: 10,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
});
