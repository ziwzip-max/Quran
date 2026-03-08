import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS, Verse } from "@/constants/quranData";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useAudio } from "@/contexts/AudioContext";
import { SURAH_INFO, SURAH_JUZ, SURAH_TYPE } from "@/constants/quranMeta";
import { parseTajweed, TAJWEED_COLORS, TajweedRule } from "@/utils/tajweed";
import { TajweedPopup, TajweedLegend } from "@/components/TajweedPopup";
import { fetchQaloonSurah } from "@/utils/quranApi";
import { QALOON_SURAHS } from "@/constants/qaloonData";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "al_hifz_history";
const MAX_HISTORY_ITEMS = 5;
const MIN_FONT = 18;
const MAX_FONT = 48;
const FONT_STEP = 2;
const BISMILLAH = SURAHS[0]?.verses[0]?.text?.replace(/^\uFEFF/, "").normalize("NFC") ?? "";
const QALOON_BISMILLAH = QALOON_SURAHS[0]?.verses[0]?.text?.replace(/^\uFEFF/, "").normalize("NFC") ?? "";

function TajweedText({
  text,
  style,
  arabicFont,
  colors,
  onRuleTap,
}: {
  text: string;
  style: object;
  arabicFont?: string;
  colors: ReturnType<typeof useSettings>["colors"];
  onRuleTap: (rule: TajweedRule, word: string) => void;
}) {
  const segments = useMemo(() => parseTajweed(text), [text]);

  return (
    <View style={styles.tajweedWrap}>
      <TajweedLegend segments={segments} />
      <Text style={[style, arabicFont ? { fontFamily: arabicFont } : {}, styles.tajweedTextBlock]}>
        {segments.map((seg, i) => {
          if (!seg.rule) {
            return (
              <Text key={i} style={{ color: colors.textPrimary }}>
                {seg.text}
              </Text>
            );
          }
          return (
            <Text
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRuleTap(seg.rule!, seg.text);
              }}
              style={{
                color: TAJWEED_COLORS[seg.rule],
                textDecorationLine: "underline",
                textDecorationColor: TAJWEED_COLORS[seg.rule] + "80",
                textDecorationStyle: "dotted",
              }}
            >
              {seg.text}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

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
  showTajweed,
  isLandscape,
  onRuleTap,
  overrideText,
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
  showTajweed: boolean;
  isLandscape: boolean;
  onRuleTap: (rule: TajweedRule, word: string) => void;
  overrideText?: string;
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

  const rawText = overrideText ?? verse.text;
  const normalizedRaw = rawText.normalize("NFC");
  const bism = overrideText ? QALOON_BISMILLAH : BISMILLAH;
  const displayText =
    stripBismillah && normalizedRaw.startsWith(bism) && bism.length > 0
      ? rawText.slice(bism.length).trimStart()
      : rawText;

  const isKaraoke = isCurrentAudio && !isAudioLoading;

  const textStyle = {
    fontSize,
    lineHeight: fontSize * lineSpacingValue,
    textAlign: "right" as const,
  };

  return (
    <View style={[
      styles.verseContainer,
      isLandscape && styles.verseContainerLandscape,
      {
        backgroundColor: isKaraoke
          ? colors.gold + "18"
          : isActive
            ? colors.gold + "12"
            : isBookmarked
              ? colors.gold + "0D"
              : colors.bgCard,
        borderColor: isKaraoke
          ? colors.gold + "70"
          : isActive
            ? colors.gold + "50"
            : isBookmarked
              ? colors.gold + "50"
              : colors.border,
        borderLeftWidth: isKaraoke ? 4 : isActive ? 3 : 1,
        borderLeftColor: isKaraoke
          ? colors.gold
          : isActive
            ? colors.gold
            : isBookmarked ? colors.gold + "50" : colors.border,
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
          {showTajweed && (
            <View style={[styles.tajweedHintBadge, { backgroundColor: colors.teal + "20", borderColor: colors.teal + "40" }]}>
              <Text style={[styles.tajweedHintText, { color: colors.tealLight }]}>اضغط الكلمة الملونة</Text>
            </View>
          )}
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

      {showTajweed ? (
        <TajweedText
          text={displayText}
          style={textStyle}
          arabicFont={arabicFont}
          colors={colors}
          onRuleTap={onRuleTap}
        />
      ) : (
        <Text style={[
          styles.verseText,
          { fontSize, lineHeight: fontSize * lineSpacingValue, color: colors.textPrimary },
          arabicFont ? { fontFamily: arabicFont } : {},
        ]}>
          {displayText}
        </Text>
      )}
    </View>
  );
}

export default function SurahScreen() {
  const { id, verse: verseParam } = useLocalSearchParams<{ id: string; verse?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const {
    colors, arabicFontFamily, hideVerseNumbers,
    highlightActiveVerse, lineSpacingValue, showTajweed, qiraa, repeatMode,
  } = useSettings();
  const {
    play, stop, pause, resume,
    currentKey, currentSurahNum: audioSurahNum, currentVerseNum: audioVerseNum,
    isLoading: audioLoading, isPlaying: audioIsPlaying,
    playbackPosition, playbackDuration,
  } = useAudio();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  const [fontSize, setFontSize] = useState(30);
  const [isImmersive, setIsImmersive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [tajweedPopup, setTajweedPopup] = useState<{ rule: TajweedRule; word: string } | null>(null);
  const [qaloonVerses, setQaloonVerses] = useState<string[]>([]);
  const [jumpStep, setJumpStep] = useState<0 | 1 | 2 | 3>(0);
  const flatListRef = useRef<FlatList<Verse>>(null);
  const hasScrolled = useRef(false);
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredPosition = useRef(false);

  const handleRuleTap = useCallback((rule: TajweedRule, word: string) => {
    setTajweedPopup({ rule, word });
  }, []);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerWidthRef = useRef(winWidth);

  const isPinchRef = useRef(false);
  const pinchDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    containerWidthRef.current = winWidth;
  }, [winWidth]);

  useEffect(() => {
    if (!surahNumber || isNaN(surahNumber)) return;
    AsyncStorage.getItem(HISTORY_KEY).then((stored) => {
      let history: number[] = stored ? JSON.parse(stored) : [];
      history = [surahNumber, ...history.filter((n) => n !== surahNumber)].slice(0, MAX_HISTORY_ITEMS);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    });
  }, [surahNumber]);

  useEffect(() => {
    if (qiraa !== "qaloon") {
      setQaloonVerses([]);
      return;
    }
    fetchQaloonSurah(surahNumber).then((verses) => {
      setQaloonVerses(verses);
    });
  }, [surahNumber, qiraa]);

  useEffect(() => {
    if (!surah || !currentKey) return;
    const keyParts = currentKey.split(":");
    const keySurah = parseInt(keyParts[0], 10);
    const keyVerse = parseInt(keyParts[1], 10);
    if (keySurah !== surahNumber) return;
    const index = surah.verses.findIndex((v) => v.number === keyVerse);
    if (index < 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentKey, surah, surahNumber]);

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
    const timer1 = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      hasScrolled.current = true;
    }, 400);
    const timer2 = setTimeout(() => {
      if (!hasScrolled.current) {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
        hasScrolled.current = true;
      }
    }, 800);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [surah, verseParam]);

  useEffect(() => {
    if (!surah || verseParam || hasRestoredPosition.current) return;
    hasRestoredPosition.current = true;
    AsyncStorage.getItem(`al_hifz_pos_${surahNumber}`).then((stored) => {
      if (!stored) return;
      const offset = parseFloat(stored);
      if (offset > 50) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset, animated: false });
        }, 600);
      }
    });
  }, [surah, surahNumber, verseParam]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 200,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? -1);
    }
  }).current;

  const panResponder = useMemo(() => {
    if (Platform.OS === "web") return null;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) return true;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2;
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          isPinchRef.current = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        } else {
          isPinchRef.current = false;
          pinchDistanceRef.current = null;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && pinchDistanceRef.current !== null) {
          isPinchRef.current = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const newDist = Math.sqrt(dx * dx + dy * dy);
          const delta = newDist / pinchDistanceRef.current;
          pinchDistanceRef.current = newDist;
          setFontSize((prev) =>
            Math.min(MAX_FONT, Math.max(MIN_FONT, Math.round(prev * delta)))
          );
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isPinchRef.current) {
          const { dx, dy } = gestureState;
          if (Math.abs(dx) > 80 && Math.abs(dy) < 60) {
            if (dx < 0 && surahNumber < 114) {
              router.replace({ pathname: "/surah/[id]", params: { id: String(surahNumber + 1) } });
            } else if (dx > 0 && surahNumber > 1) {
              router.replace({ pathname: "/surah/[id]", params: { id: String(surahNumber - 1) } });
            }
          }
        }
        isPinchRef.current = false;
        pinchDistanceRef.current = null;
      },
    });
  }, [surahNumber]);

  if (!surah) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.bgDark }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>السورة غير موجودة</Text>
      </View>
    );
  }

  const showBismillahHeader = surahNumber !== 1 && surahNumber !== 9;
  const surahInfo = SURAH_INFO[surahNumber];
  const juzNum = SURAH_JUZ[surahNumber];
  const revType = SURAH_TYPE[surahNumber];

  const wordCount = useMemo(() =>
    surah.verses.reduce((sum, v) => sum + v.text.trim().split(/\s+/).length, 0),
    [surah]
  );
  const letterCount = useMemo(() =>
    surah.verses.reduce((sum, v) =>
      sum + v.text.replace(/[\u0610-\u061A\u064B-\u065F\s]/g, "").length, 0),
    [surah]
  );

  const headerComponent = (
    <View style={[styles.surahHeader, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.surahHeaderTop}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
          <Text style={[
            styles.surahArabicName, { color: colors.gold },
            arabicFontFamily ? { fontFamily: arabicFontFamily } : {},
          ]}>
            {surah.nameArabic}
          </Text>
          {qiraa === "qaloon" && (
            <View style={[styles.qiraaBadge, { backgroundColor: colors.gold + "25", borderColor: colors.gold + "50" }]}>
              <Text style={[styles.qiraaBadgeText, { color: colors.gold }]}>رواية قالون</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => setInfoExpanded((e) => !e)}
          hitSlop={10}
          style={[styles.infoBtn, { backgroundColor: infoExpanded ? colors.gold + "20" : "transparent" }]}
        >
          <Ionicons
            name={infoExpanded ? "information-circle" : "information-circle-outline"}
            size={22}
            color={infoExpanded ? colors.gold : colors.textMuted}
          />
        </Pressable>
      </View>

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
        <View style={[styles.metaPill, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>جزء {juzNum}</Text>
        </View>
      </View>

      {infoExpanded && (
        <View style={[styles.infoPanel, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <View style={styles.infoGrid}>
            <View style={[styles.infoCell, { borderColor: colors.border }]}>
              <Text style={[styles.infoCellNum, { color: colors.gold }]}>{wordCount.toLocaleString("ar")}</Text>
              <Text style={[styles.infoCellLabel, { color: colors.textMuted }]}>كلمة</Text>
            </View>
            <View style={[styles.infoCell, { borderColor: colors.border }]}>
              <Text style={[styles.infoCellNum, { color: colors.gold }]}>{letterCount.toLocaleString("ar")}</Text>
              <Text style={[styles.infoCellLabel, { color: colors.textMuted }]}>حرف</Text>
            </View>
            <View style={[styles.infoCell, { borderColor: colors.border }]}>
              <Text style={[styles.infoCellNum, { color: colors.tealLight }]}>
                {revType === "mecquoise" ? "مكية" : "مدنية"}
              </Text>
              <Text style={[styles.infoCellLabel, { color: colors.textMuted }]}>نوع</Text>
            </View>
            <View style={[styles.infoCell, { borderColor: colors.border }]}>
              <Text style={[styles.infoCellNum, { color: colors.gold }]}>{juzNum}</Text>
              <Text style={[styles.infoCellLabel, { color: colors.textMuted }]}>الجزء</Text>
            </View>
          </View>

          {surahInfo?.theme ? (
            <View style={[styles.infoTheme, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoThemeLabel, { color: colors.textMuted }]}>الموضوع</Text>
              <Text style={[styles.infoThemeText, { color: colors.textPrimary }]}>{surahInfo.theme}</Text>
            </View>
          ) : null}

          {surahInfo?.virtue ? (
            <View style={[styles.infoVirtue, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "30" }]}>
              <Ionicons name="star" size={14} color={colors.gold} />
              <Text style={[styles.infoVirtueText, { color: colors.textSecondary }]}>{surahInfo.virtue}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  const numColumns = isLandscape ? 2 : 1;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bgDark }}
      {...(panResponder ? panResponder.panHandlers : {})}
    >
      <Animated.View style={[
        styles.progressBar,
        {
          backgroundColor: colors.gold,
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, containerWidthRef.current],
            extrapolate: "clamp",
          }),
        },
      ]} />

      <FlatList
        ref={flatListRef}
        key={isLandscape ? "landscape" : "portrait"}
        data={surah.verses}
        keyExtractor={(v) => String(v.number)}
        numColumns={numColumns}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: isImmersive ? (Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top) + 12 : 0,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
          },
        ]}
        columnWrapperStyle={isLandscape ? { gap: 8, paddingHorizontal: 8 } : undefined}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        viewabilityConfig={highlightActiveVerse ? viewabilityConfig : undefined}
        onViewableItemsChanged={highlightActiveVerse ? onViewableItemsChanged : undefined}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const scrollY = contentOffset.y;
          const totalH = contentSize.height;
          const viewH = layoutMeasurement.height;
          if (totalH > viewH) {
            const p = Math.min(1, Math.max(0, scrollY / (totalH - viewH)));
            progressAnim.setValue(p);
          }
          if (scrollY < 80) setJumpStep(0);
          if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
          positionSaveTimer.current = setTimeout(() => {
            AsyncStorage.setItem(`al_hifz_pos_${surahNumber}`, String(scrollY));
          }, 800);
        }}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
          }, 300);
        }}
        renderItem={({ item, index }) => {
          const verseKey = `${surahNumber}:${item.number}`;
          const isCurrentAudio = currentKey === verseKey;
          const stripBismillah = item.number === 1 && surahNumber !== 1 && surahNumber !== 9;
          const overrideText = qiraa === "qaloon" && qaloonVerses[item.number - 1]
            ? qaloonVerses[item.number - 1]
            : undefined;
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
              showTajweed={showTajweed}
              isLandscape={isLandscape}
              onRuleTap={handleRuleTap}
              overrideText={overrideText}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={isLandscape ? { height: 0 } : styles.verseSeparator} />}
      />

      {isImmersive && (
        <TouchableOpacity
          onPress={toggleImmersive}
          style={[
            styles.exitImmersiveBtn,
            {
              backgroundColor: colors.bgCard + "E0",
              borderColor: colors.border,
              bottom: Platform.OS === "web" ? 100 : insets.bottom + 80,
            },
          ]}
        >
          <Ionicons name="contract-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      {surah && surah.versesCount >= 30 && (
        <Pressable
          onPress={() => {
            if (!surah) return;
            const count = surah.verses.length;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (jumpStep === 0 || jumpStep === 3) {
              const idx = Math.floor(count / 3);
              flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
              setJumpStep(1);
            } else if (jumpStep === 1) {
              const idx = Math.floor(count * 2 / 3);
              flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
              setJumpStep(2);
            } else if (jumpStep === 2) {
              flatListRef.current?.scrollToIndex({ index: count - 1, animated: true, viewPosition: 0 });
              setJumpStep(3);
              setTimeout(() => setJumpStep(0), 1500);
            }
          }}
          style={[
            styles.jumpBtn,
            {
              backgroundColor: colors.bgCard + "F0",
              borderColor: jumpStep === 3 ? colors.border : colors.gold + "80",
              bottom: Platform.OS === "web" ? 34 + 84 + 8 : insets.bottom + 84 + 8,
              opacity: jumpStep === 3 ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.jumpBtnText, { color: colors.gold }]}>
            {jumpStep === 0 || jumpStep === 3 ? "١/٣" : jumpStep === 1 ? "٢/٣" : "نهاية"}
          </Text>
        </Pressable>
      )}

      {currentKey !== null && audioSurahNum !== null && (
        <View style={[
          styles.audioBar,
          {
            backgroundColor: colors.bgCard + "F5",
            borderColor: colors.border,
            bottom: Platform.OS === "web" ? 34 + 84 + 8 : insets.bottom + 84 + 8,
          }
        ]}>
          <View style={[styles.audioBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.audioBarFill, {
              backgroundColor: colors.gold,
              width: playbackDuration > 0 ? `${Math.round((playbackPosition / playbackDuration) * 100)}%` as any : "0%",
            }]} />
          </View>
          <View style={styles.audioBarRow}>
            <View style={styles.audioBarControls}>
              <Pressable onPress={stop} hitSlop={12} style={[styles.audioBarBtn, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
                <Ionicons name="stop" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={audioIsPlaying ? pause : resume}
                hitSlop={12}
                style={[styles.audioBarBtn, {
                  backgroundColor: audioIsPlaying ? colors.gold + "20" : colors.bgSurface,
                  borderColor: audioIsPlaying ? colors.gold + "60" : colors.border,
                }]}
              >
                <Ionicons
                  name={audioLoading ? "hourglass-outline" : audioIsPlaying ? "pause" : "play"}
                  size={20}
                  color={audioIsPlaying ? colors.gold : colors.textSecondary}
                />
              </Pressable>
            </View>
            <View style={styles.audioBarInfo}>
              <Text style={[styles.audioBarRef, { color: colors.textPrimary }]} numberOfLines={1}>
                {SURAHS.find(s => s.number === audioSurahNum)?.nameArabic ?? ""} • {audioVerseNum}
              </Text>
              {repeatMode > 0 && (
                <Text style={[styles.audioBarRepeat, { color: colors.gold }]}>تكرار ×{repeatMode}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      <TajweedPopup
        rule={tajweedPopup?.rule ?? null}
        word={tajweedPopup?.word ?? ""}
        visible={tajweedPopup !== null}
        onClose={() => setTajweedPopup(null)}
      />
    </View>
  );
}

const fontBtnStyle: object = {
  borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4,
};

const styles = StyleSheet.create({
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    zIndex: 100,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  surahHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  surahHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 4,
    gap: 8,
  },
  surahArabicName: {
    fontSize: 36,
    textAlign: "center",
    flex: 1,
  },
  infoBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
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
    flexWrap: "wrap",
    justifyContent: "center",
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
  infoPanel: {
    width: "100%",
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoGrid: {
    flexDirection: "row",
  },
  infoCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
    borderRightWidth: 1,
  },
  infoCellNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  infoCellLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  infoTheme: {
    padding: 14,
    gap: 6,
    borderTopWidth: 1,
  },
  infoThemeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textAlign: "right",
  },
  infoThemeText: {
    fontSize: 15,
    textAlign: "right",
    lineHeight: 26,
  },
  infoVirtue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoVirtueText: {
    flex: 1,
    fontSize: 13,
    textAlign: "right",
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  verseContainer: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flex: 1,
  },
  verseContainerLandscape: {
    margin: 4,
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
  tajweedWrap: {
    gap: 8,
  },
  tajweedTextBlock: {
    textAlign: "right",
  },
  tajweedHintBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tajweedHintText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
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
  qiraaBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  qiraaBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  jumpBtn: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  jumpBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    textAlign: "center",
  },
  audioBar: {
    position: "absolute",
    left: 72,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  audioBarTrack: { height: 3, width: "100%" },
  audioBarFill: { height: 3 },
  audioBarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  audioBarControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  audioBarInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  audioBarRef: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "right",
  },
  audioBarRepeat: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textAlign: "right",
  },
});
