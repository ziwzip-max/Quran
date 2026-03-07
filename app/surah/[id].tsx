import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS, Verse } from "@/constants/quranData";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useAudio } from "@/contexts/AudioContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "al_hifz_history";
const MAX_HISTORY_ITEMS = 5;

const MIN_FONT = 16;
const MAX_FONT = 36;
const FONT_STEP = 2;

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function VerseItem({
  verse,
  surahNum,
  isBookmarked,
  onToggle,
  fontSize,
  arabicFont,
  lineSpacingValue,
  isActive,
  hideNumbers,
  isCurrentAudio,
  isAudioLoading,
  onPlayAudio,
  stripBismillah,
}: {
  verse: Verse;
  surahNum: number;
  isBookmarked: boolean;
  onToggle: () => void;
  fontSize: number;
  arabicFont: string | undefined;
  lineSpacingValue: number;
  isActive: boolean;
  hideNumbers: boolean;
  isCurrentAudio: boolean;
  isAudioLoading: boolean;
  onPlayAudio: () => void;
  stripBismillah: boolean;
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

  const displayText =
    stripBismillah && verse.text.startsWith(BISMILLAH)
      ? verse.text.slice(BISMILLAH.length).trimStart()
      : verse.text;

  return (
    <View style={[
      styles.verseContainer,
      {
        backgroundColor: isActive
          ? colors.gold + "12"
          : isBookmarked
            ? colors.gold + "0D"
            : colors.bgCard,
        borderColor: isActive
          ? colors.gold + "50"
          : isBookmarked
            ? colors.gold + "50"
            : colors.border,
        borderLeftWidth: isActive ? 3 : 1,
        borderLeftColor: isActive ? colors.gold : (isBookmarked ? colors.gold + "50" : colors.border),
      }
    ]}>
      <View style={styles.verseHeader}>
        <View style={styles.verseHeaderLeft}>
          {!hideNumbers && (
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
          )}
        </View>
        <View style={styles.verseHeaderRight}>
          <Pressable onPress={onPlayAudio} hitSlop={10} style={styles.audioBtn}>
            {isAudioLoading
              ? <ActivityIndicator size="small" color={colors.gold} />
              : <Ionicons
                  name={isCurrentAudio ? "pause-circle" : "play-circle-outline"}
                  size={24}
                  color={isCurrentAudio ? colors.gold : colors.textMuted}
                />
            }
          </Pressable>
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
      </View>
      <Text style={[
        styles.verseText,
        { fontSize, lineHeight: fontSize * lineSpacingValue, color: colors.textPrimary },
        arabicFont ? { fontFamily: arabicFont } : {},
      ]}>
        {displayText}
      </Text>
    </View>
  );
}

export default function SurahScreen() {
  const { id, verse: verseParam } = useLocalSearchParams<{ id: string; verse?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors, arabicFontFamily, hideVerseNumbers, highlightActiveVerse, lineSpacingValue } = useSettings();
  const { play, currentKey, isLoading: audioLoading } = useAudio();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  const [fontSize, setFontSize] = useState(22);
  const [isImmersive, setIsImmersive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const flatListRef = useRef<FlatList<Verse>>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!surahNumber || isNaN(surahNumber)) return;
    AsyncStorage.getItem(HISTORY_KEY).then((stored) => {
      let history: number[] = stored ? JSON.parse(stored) : [];
      history = [surahNumber, ...history.filter((n) => n !== surahNumber)].slice(0, MAX_HISTORY_ITEMS);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    });
  }, [surahNumber]);

  const increaseFont = useCallback(() => setFontSize((f) => Math.min(f + FONT_STEP, MAX_FONT)), []);
  const decreaseFont = useCallback(() => setFontSize((f) => Math.max(f - FONT_STEP, MIN_FONT)), []);

  const toggleImmersive = useCallback(() => {
    setIsImmersive((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    if (!surah) return;
    navigation.setOptions({
      headerShown: !isImmersive,
      title: surah.nameArabic,
      headerStyle: { backgroundColor: colors.bgDark },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: colors.textPrimary },
      headerBackTitle: "القرآن",
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 }}>
          <Pressable onPress={decreaseFont} hitSlop={10} style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: "Inter_700Bold" }}>ا-</Text>
          </Pressable>
          <Pressable onPress={increaseFont} hitSlop={10} style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: "Inter_700Bold" }}>ا+</Text>
          </Pressable>
          <Pressable onPress={toggleImmersive} hitSlop={10} style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Ionicons name="expand-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      ),
    });
  }, [surah, navigation, colors, decreaseFont, increaseFont, toggleImmersive, isImmersive]);

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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 200,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? -1);
    }
  }).current;

  if (!surah) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.bgDark }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>السورة غير موجودة</Text>
      </View>
    );
  }

  const showBismillahHeader = surahNumber !== 1 && surahNumber !== 9;

  const headerComponent = (
    <View style={[styles.surahHeader, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.surahArabicName, { color: colors.gold }, arabicFontFamily ? { fontFamily: arabicFontFamily } : {}]}>
        {surah.nameArabic}
      </Text>

      {showBismillahHeader && (
        <>
          <View style={[styles.bismillahSeparator, { borderBottomColor: colors.border }]} />
          <Text style={[
            styles.bismillahText,
            { color: colors.textSecondary },
            arabicFontFamily ? { fontFamily: arabicFontFamily } : {},
          ]}>
            {BISMILLAH}
          </Text>
        </>
      )}

      <View style={[styles.surahMeta, showBismillahHeader ? { marginTop: 16 } : {}]}>
        <View style={[styles.metaPill, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{surah.versesCount} آية</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>سورة {surah.number}</Text>
        </View>
      </View>
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
          {
            paddingTop: isImmersive ? (Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top) + 12 : 0,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        viewabilityConfig={highlightActiveVerse ? viewabilityConfig : undefined}
        onViewableItemsChanged={highlightActiveVerse ? onViewableItemsChanged : undefined}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
          }, 300);
        }}
        renderItem={({ item, index }) => {
          const verseKey = `${surahNumber}:${item.number}`;
          const isCurrentAudio = currentKey === verseKey;
          const stripBismillah = item.number === 1 && surahNumber !== 1 && surahNumber !== 9;
          return (
            <VerseItem
              verse={item}
              surahNum={surahNumber}
              isBookmarked={isBookmarked(surahNumber, item.number)}
              onToggle={() => toggleBookmark(surahNumber, item.number)}
              fontSize={fontSize}
              arabicFont={arabicFontFamily}
              lineSpacingValue={lineSpacingValue}
              isActive={highlightActiveVerse && activeIndex === index}
              hideNumbers={hideVerseNumbers}
              isCurrentAudio={isCurrentAudio}
              isAudioLoading={isCurrentAudio && audioLoading}
              onPlayAudio={() => play(surahNumber, item.number)}
              stripBismillah={stripBismillah}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.verseSeparator} />}
      />

      {isImmersive && (
        <TouchableOpacity
          onPress={toggleImmersive}
          style={[
            styles.exitImmersiveBtn,
            {
              backgroundColor: colors.bgCard + "E0",
              borderColor: colors.border,
              bottom: Platform.OS === "web" ? 50 : insets.bottom + 24,
            },
          ]}
        >
          <Ionicons name="contract-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const fontBtnStyle: object = {
  borderRadius: 8,
  borderWidth: 1,
  paddingHorizontal: 7,
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
  bismillahSeparator: {
    width: "60%",
    borderBottomWidth: 1,
    marginVertical: 14,
  },
  bismillahText: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 32,
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
  verseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verseHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  audioBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
  exitImmersiveBtn: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
