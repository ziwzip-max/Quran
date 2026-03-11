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
  ScrollView,
  Modal,
} from "react-native";
import { useLocalSearchParams, useNavigation, router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS, Verse } from "@/constants/quranData";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMastery, MasteryLevel } from "@/contexts/MasteryContext";
import { SURAH_INFO, SURAH_JUZ, SURAH_TYPE } from "@/constants/quranMeta";
import { RECITERS_LIST } from "@/constants/themes";
import { parseTajweed, TAJWEED_COLORS, TAJWEED_RULES, TajweedRule } from "@/utils/tajweed";
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

function TafsirContent({ surahNum, verseNum, colors, arabicFont }: {
  surahNum: number; verseNum: number;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const [tafsir, setTafsir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const verseText = SURAHS.find(s => s.number === surahNum)?.verses.find(v => v.number === verseNum)?.text ?? "";

  useEffect(() => {
    setLoading(true);
    setError(false);
    setTafsir(null);
    fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${verseNum}/ar.muyassar`)
      .then(r => r.json())
      .then(d => { setTafsir(d?.data?.text ?? null); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [surahNum, verseNum]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 22, textAlign: "right", lineHeight: 40, color: colors.textPrimary, fontFamily: arabicFont }}>
        {verseText}
      </Text>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      {loading
        ? <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
        : error
          ? <Text style={{ textAlign: "center", color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>تعذّر تحميل التفسير</Text>
          : <Text style={{ fontSize: 16, textAlign: "right", lineHeight: 28, color: colors.textSecondary, fontFamily: arabicFont }}>
              {tafsir}
            </Text>
      }
      <Text style={{ fontSize: 11, textAlign: "center", color: colors.textMuted, fontFamily: "Inter_400Regular" }}>
        التفسير الميسر — موقع الكويت
      </Text>
    </ScrollView>
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
  masteryLevel,
  isNavigatedTo,
  onTafsir,
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
  masteryLevel: MasteryLevel;
  isNavigatedTo: boolean;
  onTafsir: () => void;
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
    lineHeight: fontSize * lineSpacingValue * 1.6,
    textAlign: "right" as const,
  };

  const masteryDotColor = masteryLevel === 1 ? "#E67E22" : masteryLevel === 2 ? "#C9A227" : masteryLevel === 3 ? "#27AE60" : null;

  return (
    <View style={[
      styles.verseContainer,
      isLandscape && styles.verseContainerLandscape,
      {
        backgroundColor: isNavigatedTo
          ? colors.gold + "30"
          : isKaraoke
            ? colors.gold + "18"
            : isActive
              ? colors.gold + "12"
              : isBookmarked
                ? colors.gold + "0D"
                : colors.bgCard,
        borderColor: isNavigatedTo
          ? colors.gold
          : isKaraoke
            ? colors.gold + "70"
            : isActive
              ? colors.gold + "50"
              : isBookmarked
                ? colors.gold + "50"
                : colors.border,
        borderLeftWidth: isNavigatedTo ? 4 : isKaraoke ? 4 : isActive ? 3 : 1,
        borderLeftColor: isNavigatedTo
          ? colors.gold
          : isKaraoke
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
          {masteryDotColor !== null && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: masteryDotColor }} />
          )}
        </View>
        <View style={styles.verseHeaderRight}>
          {showTajweed && (
            <View style={[styles.tajweedHintBadge, { backgroundColor: colors.teal + "20", borderColor: colors.teal + "40" }]}>
              <Text style={[styles.tajweedHintText, { color: colors.tealLight }]}>اضغط الكلمة الملونة</Text>
            </View>
          )}
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTafsir(); }} hitSlop={10}>
            <Ionicons name="book-outline" size={20} color={colors.textMuted} />
          </Pressable>
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
          { fontSize, lineHeight: fontSize * lineSpacingValue * 1.6, color: colors.textPrimary },
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
    highlightActiveVerse, lineSpacingValue, showTajweed, setShowTajweed, qiraa, repeatMode, playbackRate,
    setPlaybackRate, setRepeatMode, reciterId,
  } = useSettings();
  const {
    play, stop, pause, resume, playNext,
    currentKey, currentSurahNum: audioSurahNum, currentVerseNum: audioVerseNum,
    isLoading: audioLoading, isPlaying: audioIsPlaying,
    playbackPosition, playbackDuration, isSurahMode,
    downloadProgress, downloadSurah,
    sleepTimerActive, sleepTimerRemaining, setSleepTimer,
  } = useAudio();
  const { getMastery } = useMastery();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  const [fontSize, setFontSize] = useState(30);
  const [isImmersive, setIsImmersive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [tajweedPopup, setTajweedPopup] = useState<{ rule: TajweedRule; word: string } | null>(null);
  const [qaloonVerses, setQaloonVerses] = useState<string[]>([]);
  const [bookmarkNavIdx, setBookmarkNavIdx] = useState(-1);
  const [navigatedVerseNum, setNavigatedVerseNum] = useState<number | null>(null);
  const [tajweedGuideVisible, setTajweedGuideVisible] = useState(false);
  const [tafsirVerse, setTafsirVerse] = useState<{ surahNum: number; verseNum: number } | null>(null);
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
    AsyncStorage.setItem("al_hifz_last_surah", String(surahNumber));
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
    if (currentKey.startsWith("surah:")) return;
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

  const currentReciterEntry = RECITERS_LIST.find((r) => r.id === reciterId);
  const isSurahMissing = isSurahMode && (currentReciterEntry?.missingSurahs?.includes(surahNumber) ?? false);

  const increaseFont = useCallback(() => setFontSize((f) => Math.min(f + FONT_STEP, MAX_FONT)), []);
  const decreaseFont = useCallback(() => setFontSize((f) => Math.max(f - FONT_STEP, MIN_FONT)), []);

  const toggleImmersive = useCallback(() => {
    setIsImmersive((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDownload = useCallback(() => {
    if (!surah) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    downloadSurah(surahNumber);
  }, [surah, surahNumber, downloadSurah]);

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
          {surahNumber > 1 && (
            <Pressable
              onPress={() => router.replace({ pathname: "/surah/[id]", params: { id: String(surahNumber - 1) } })}
              hitSlop={10}
              style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          {surahNumber < 114 && (
            <Pressable
              onPress={() => router.replace({ pathname: "/surah/[id]", params: { id: String(surahNumber + 1) } })}
              hitSlop={10}
              style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          {Platform.OS !== "web" && (
            <Pressable
              onPress={handleDownload}
              hitSlop={10}
              style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            >
              <Ionicons name="download-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setShowTajweed(!showTajweed);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            hitSlop={10}
            style={[fontBtnStyle, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
          >
            <Ionicons name="color-palette-outline" size={16} color={showTajweed ? colors.gold : colors.textSecondary} />
          </Pressable>
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
  }, [surah, navigation, colors, decreaseFont, increaseFont, toggleImmersive, isImmersive, showTajweed, setShowTajweed, handleDownload]);

  useFocusEffect(useCallback(() => {
    hasScrolled.current = false;
  }, []));

  useEffect(() => {
    hasScrolled.current = false;
  }, [verseParam]);

  useEffect(() => {
    if (!surah || !verseParam || hasScrolled.current) return;
    const targetVerse = parseInt(verseParam, 10);
    if (isNaN(targetVerse)) return;
    const index = surah.verses.findIndex((v) => v.number === targetVerse);
    if (index < 0) return;
    const doScroll = () => {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      setNavigatedVerseNum(targetVerse);
      hasScrolled.current = true;
      setTimeout(() => setNavigatedVerseNum(null), 2000);
    };
    const timer1 = setTimeout(doScroll, 400);
    const timer2 = setTimeout(() => { if (!hasScrolled.current) doScroll(); }, 800);
    const timer3 = setTimeout(() => { if (!hasScrolled.current) doScroll(); }, 1200);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
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

  const [swipeIndicator, setSwipeIndicator] = useState<{ text: string, visible: boolean }>({ text: "", visible: false });

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
      onPanResponderMove: (_, gestureState) => {
        const touches = _.nativeEvent.touches;
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
        } else if (!isPinchRef.current) {
          const { dx } = gestureState;
          if (dx < -80 && surahNumber < 114) {
             const nextName = SURAHS.find(s => s.number === surahNumber + 1)?.nameArabic;
             setSwipeIndicator({ text: `السورة التالية: ${nextName} ←`, visible: true });
          } else if (dx > 80 && surahNumber > 1) {
             const prevName = SURAHS.find(s => s.number === surahNumber - 1)?.nameArabic;
             setSwipeIndicator({ text: `→ السورة السابقة: ${prevName}`, visible: true });
          } else {
             setSwipeIndicator(s => s.visible ? { ...s, visible: false } : s);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setSwipeIndicator(s => ({ ...s, visible: false }));
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

  useEffect(() => {
    setBookmarkNavIdx(-1);
    setNavigatedVerseNum(null);
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

  const bookmarkedIndices = useMemo(() =>
    surah.verses
      .map((v, i) => ({ idx: i, verseNum: v.number }))
      .filter(({ verseNum }) => isBookmarked(surahNumber, verseNum)),
    [surah, surahNumber, isBookmarked]
  );


  const navigateToBookmark = useCallback((bIdx: number) => {
    if (bookmarkedIndices.length === 0) return;
    const entry = bookmarkedIndices[bIdx];
    flatListRef.current?.scrollToIndex({ index: entry.idx, animated: true, viewPosition: 0.3 });
    setBookmarkNavIdx(bIdx);
    setNavigatedVerseNum(entry.verseNum);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setNavigatedVerseNum(null), 1500);
  }, [bookmarkedIndices]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sleepTimerOptions = [
    { label: "إيقاف", value: null },
    { label: "١٥ د", value: 15 },
    { label: "٣٠ د", value: 30 },
    { label: "٤٥ د", value: 45 },
    { label: "٦٠ د", value: 60 },
  ];

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
          {isSurahMode && currentKey === `surah:${surahNumber}` && audioIsPlaying && (
            <View style={[styles.qiraaBadge, { backgroundColor: colors.teal + "25", borderColor: colors.teal + "50" }]}>
              <Text style={[styles.qiraaBadgeText, { color: colors.tealLight }]}>◉ يُشغَّل</Text>
            </View>
          )}
          {sleepTimerActive && sleepTimerRemaining !== null && (
            <View style={[styles.qiraaBadge, { backgroundColor: colors.bgSurface, borderColor: colors.border, flexDirection: "row", alignItems: "center" }]}>
              <Ionicons name="moon-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.qiraaBadgeText, { color: colors.textSecondary }]}>{formatTime(sleepTimerRemaining)}</Text>
            </View>
          )}
          {swipeIndicator.visible && (
        <View style={styles.swipeIndicator}>
          <Text style={styles.swipeIndicatorText}>{swipeIndicator.text}</Text>
        </View>
      )}

      {isSurahMissing && (
            <View style={[styles.qiraaBadge, { backgroundColor: colors.error + "20", borderColor: colors.error + "40" }]}>
              <Text style={[styles.qiraaBadgeText, { color: colors.error }]}>غير متوفر</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {showTajweed && (
            <Pressable
              onPress={() => setTajweedGuideVisible(true)}
              hitSlop={10}
              style={[styles.infoBtn, { backgroundColor: colors.teal + "15" }]}
            >
              <Ionicons name="color-palette-outline" size={20} color={colors.tealLight} />
            </Pressable>
          )}
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

      {bookmarkedIndices.length > 0 && (
        <Pressable
          onPress={() => navigateToBookmark(0)}
          style={[styles.bookmarkCountRow, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}
        >
          <Ionicons name="chevron-back-outline" size={13} color={colors.gold + "90"} />
          <Text style={[styles.bookmarkCountText, { color: colors.gold }]}>
            {bookmarkedIndices.length} آية محفوظة — اضغط للتنقل
          </Text>
          <Ionicons name="bookmark" size={14} color={colors.gold} />
        </Pressable>
      )}

      {infoExpanded && (
        <View style={[styles.infoPanel, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          {surahInfo?.theme ? (
            <View style={[styles.infoThemeCard, { borderColor: colors.border, borderLeftColor: colors.gold }]}>
              <Text style={[styles.infoThemeCardLabel, { color: colors.gold }]}>الموضوع الرئيسي</Text>
              <Text style={[styles.infoThemeCardText, { color: colors.textPrimary }]}>{surahInfo.theme}</Text>
            </View>
          ) : null}

          {surahInfo?.virtue ? (
            <View style={[styles.infoVirtue, { backgroundColor: colors.gold + "12", borderColor: colors.gold + "40" }]}>
              <Ionicons name="star" size={15} color={colors.gold} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoVirtueLabel, { color: colors.gold }]}>فضل السورة</Text>
                <Text style={[styles.infoVirtueText, { color: colors.textSecondary }]}>{surahInfo.virtue}</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.infoGrid, { borderTopWidth: surahInfo?.theme || surahInfo?.virtue ? 1 : 0, borderTopColor: colors.border }]}>
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

      {downloadProgress && downloadProgress.surahNum === surahNumber && (
        <View style={[styles.downloadBar, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
          <View style={[styles.downloadProgress, { width: `${downloadProgress.percent}%`, backgroundColor: colors.gold }]} />
          <Text style={[styles.downloadText, { color: colors.textPrimary }]}>
            جاري التحميل... {Math.round(downloadProgress.percent)}%
          </Text>
        </View>
      )}

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
          const surahAudioKey = `surah:${surahNumber}`;
          const isCurrentAudio = isSurahMode
            ? currentKey === surahAudioKey
            : currentKey === verseKey;
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
              isCurrentAudio={isCurrentAudio && !isSurahMode}
              isAudioLoading={isCurrentAudio && audioLoading && !isSurahMode}
              onPlayAudio={isSurahMissing ? () => {} : () => play(surahNumber, item.number)}
              stripBismillah={stripBismillah}
              showTajweed={showTajweed}
              isLandscape={isLandscape}
              onRuleTap={handleRuleTap}
              overrideText={overrideText}
              masteryLevel={getMastery(surahNumber, item.number)}
              isNavigatedTo={navigatedVerseNum === item.number}
              onTafsir={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTafsirVerse({ surahNum: surahNumber, verseNum: item.number }); }}
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


      {bookmarkedIndices.length > 0 && (
        <>
          <Pressable
            onPress={() => {
              const prevIdx = bookmarkNavIdx <= 0 ? bookmarkedIndices.length - 1 : bookmarkNavIdx - 1;
              navigateToBookmark(prevIdx);
            }}
            style={[
              styles.bookmarkNavBtn,
              {
                backgroundColor: colors.bgCard + "F0",
                borderColor: colors.gold + "60",
                right: 20,
                bottom: Platform.OS === "web" ? 34 + (currentKey ? 140 : 16) + 52 : insets.bottom + (currentKey ? 140 : 16) + 52,
              },
            ]}
          >
            <Ionicons name="chevron-up-outline" size={18} color={colors.gold} />
          </Pressable>
          <Pressable
            onPress={() => {
              const nextIdx = bookmarkNavIdx >= bookmarkedIndices.length - 1 ? 0 : bookmarkNavIdx + 1;
              navigateToBookmark(nextIdx);
            }}
            style={[
              styles.bookmarkNavBtn,
              {
                backgroundColor: colors.bgCard + "F0",
                borderColor: colors.gold + "60",
                right: 20,
                bottom: Platform.OS === "web" ? 34 + (currentKey ? 140 : 16) : insets.bottom + (currentKey ? 140 : 16),
              },
            ]}
          >
            <Ionicons name="chevron-down-outline" size={18} color={colors.gold} />
          </Pressable>
        </>
      )}

      {bookmarkedIndices.length > 0 && (
        <View
          style={[
            styles.bookmarkRail,
            {
              top: Platform.OS === "web" ? 67 : insets.top,
              bottom: Platform.OS === "web" ? 34 + (currentKey ? 140 : 16) : insets.bottom + (currentKey ? 140 : 16),
              pointerEvents: "box-none" as const,
            },
          ]}
        >
          {bookmarkedIndices.map(({ idx, verseNum }) => {
            const total = Math.max(surah.verses.length - 1, 1);
            const pct = idx / total;
            return (
              <Pressable
                key={verseNum}
                onPress={() => {
                  const bIdx = bookmarkedIndices.findIndex((b) => b.verseNum === verseNum);
                  navigateToBookmark(bIdx >= 0 ? bIdx : 0);
                }}
                style={[
                  styles.bookmarkRailTick,
                  {
                    backgroundColor: colors.gold,
                    top: `${pct * 100}%` as any,
                  },
                ]}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              />
            );
          })}
        </View>
      )}

      {currentKey !== null && audioSurahNum !== null && (
        <View style={[
          styles.audioBar,
          {
            backgroundColor: colors.bgCard + "F5",
            borderColor: colors.border,
            bottom: Platform.OS === "web" ? 34 : insets.bottom,
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
              <Pressable
                onPress={() => {
                  if (audioSurahNum !== null) {
                    if (isSurahMode) {
                      playNext(audioSurahNum, 1);
                    } else if (audioVerseNum !== null) {
                      playNext(audioSurahNum, audioVerseNum);
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                hitSlop={12}
                style={[styles.audioBarBtn, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
              >
                <Ionicons name="play-skip-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.audioBarInfo}>
              <Text style={[styles.audioBarRef, { color: colors.textPrimary }]} numberOfLines={1}>
                {SURAHS.find(s => s.number === audioSurahNum)?.nameArabic ?? ""}
                {isSurahMode ? "" : ` • ${audioVerseNum}`}
              </Text>
              {repeatMode > 0 && (
                <Text style={[styles.audioBarRepeat, { color: colors.gold }]}>تكرار ×{repeatMode}</Text>
              )}
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.audioChipsScroll, { borderTopColor: colors.border }]}
            contentContainerStyle={styles.audioChipsContent}
          >
            {([0.75, 1.0, 1.25] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => { setPlaybackRate(r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.audioChip,
                  {
                    backgroundColor: playbackRate === r ? colors.gold + "30" : colors.bgSurface,
                    borderColor: playbackRate === r ? colors.gold : colors.border,
                  },
                ]}
              >
                <Text style={[styles.audioChipText, { color: playbackRate === r ? colors.gold : colors.textMuted }]}>
                  {r}×
                </Text>
              </Pressable>
            ))}
            <View style={[styles.audioChipDivider, { backgroundColor: colors.border }]} />
            {sleepTimerOptions.map((item) => {
              const isActive = sleepTimerRemaining !== null && sleepTimerOptions.find(o => o.value === (Math.round(sleepTimerRemaining / 60)))?.value === item.value;
              const isEffectiveActive = (item.value === null && sleepTimerRemaining === null) || (item.value !== null && sleepTimerRemaining !== null && Math.abs(sleepTimerRemaining - item.value * 60) < 30);

              return (
                <Pressable
                  key={String(item.value)}
                  onPress={() => { setSleepTimer(item.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.audioChip,
                    {
                      backgroundColor: isEffectiveActive ? colors.gold + "25" : colors.bgSurface,
                      borderColor: isEffectiveActive ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Ionicons name="moon-outline" size={12} color={isEffectiveActive ? colors.gold : colors.textMuted} style={{ marginLeft: 4 }} />
                  <Text style={[styles.audioChipText, { color: isEffectiveActive ? colors.gold : colors.textMuted }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <TajweedPopup
        rule={tajweedPopup?.rule ?? null}
        word={tajweedPopup?.word ?? ""}
        visible={tajweedPopup !== null}
        onClose={() => setTajweedPopup(null)}
      />

      <Modal
        visible={tafsirVerse !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTafsirVerse(null)}
      >
        <Pressable style={styles.tafsirOverlay} onPress={() => setTafsirVerse(null)}>
          <View style={[styles.tafsirSheet, { backgroundColor: colors.bgCard, borderColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10 }]}>
            <View style={[styles.tafsirHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setTafsirVerse(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
              <Text style={[styles.tafsirTitle, { color: colors.textPrimary }]}>التفسير الميسر</Text>
              <View style={{ width: 22 }} />
            </View>
            {tafsirVerse !== null && (
              <TafsirContent
                surahNum={tafsirVerse.surahNum}
                verseNum={tafsirVerse.verseNum}
                colors={colors}
                arabicFont={arabicFontFamily}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={tajweedGuideVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTajweedGuideVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.guideOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTajweedGuideVisible(false)} />
          <View style={[
            styles.guideSheet,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
            },
          ]}>
            <View style={[styles.guideHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.guideHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setTajweedGuideVisible(false)} hitSlop={12}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
              <Text style={[styles.guideTitleText, { color: colors.textPrimary }]}>دليل التجويد</Text>
              <Ionicons name="color-palette-outline" size={18} color={colors.tealLight} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {(Object.entries(TAJWEED_RULES) as [TajweedRule, typeof TAJWEED_RULES[TajweedRule]][]).map(([key, info]) => (
                <View
                  key={key}
                  style={[styles.guideRuleCard, { backgroundColor: colors.bgSurface, borderColor: info.color + "40" }]}
                >
                  <View style={styles.guideRuleTop}>
                    <View style={[styles.guideRuleBadge, { backgroundColor: info.color + "20", borderColor: info.color + "50" }]}>
                      <View style={[styles.guideRuleDot, { backgroundColor: info.color }]} />
                      <Text style={[styles.guideRuleLabel, { color: info.color }]}>{info.shortLabel}</Text>
                    </View>
                    <Text style={[styles.guideRuleFullLabel, { color: colors.textPrimary }]}>{info.label}</Text>
                  </View>
                  <Text style={[styles.guideRuleDesc, { color: colors.textSecondary }]}>{info.description}</Text>
                  <View style={[styles.guideHowToBox, { backgroundColor: colors.teal + "12", borderColor: colors.teal + "30" }]}>
                    <Text style={[styles.guideBoxLabel, { color: colors.tealLight }]}>كيف تنطقها</Text>
                    <Text style={[styles.guideBoxText, { color: colors.textSecondary }]}>{info.howTo}</Text>
                  </View>
                  <View style={[styles.guideExBox, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "30" }]}>
                    <Text style={[styles.guideBoxLabel, { color: colors.gold }]}>مثال</Text>
                    <Text style={[styles.guideExText, { color: colors.textPrimary }]}>{info.example}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  infoThemeCard: {
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderWidth: 0,
    borderLeftColor: "transparent",
    backgroundColor: "transparent",
  },
  infoThemeCardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textAlign: "right",
    letterSpacing: 0.3,
  },
  infoThemeCardText: {
    fontSize: 16,
    textAlign: "right",
    lineHeight: 28,
    fontFamily: "Inter_500Medium",
  },
  infoVirtue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoVirtueLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textAlign: "right",
    marginBottom: 3,
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
  downloadBar: {
    height: 40,
    borderBottomWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  downloadProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  downloadText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    zIndex: 1,
  },
  swipeIndicator: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    backgroundColor: "rgba(26, 140, 122, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  swipeIndicatorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
  audioBar: {
    position: "absolute",
    left: 12,
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
  audioChipsScroll: {
    borderTopWidth: 1,
  },
  audioChipsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  audioChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  audioChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  audioChipDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 2,
  },
  bookmarkNavBtn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  bookmarkRail: {
    position: "absolute",
    right: 0,
    width: 14,
    backgroundColor: "transparent",
  },
  bookmarkRailTick: {
    position: "absolute",
    right: 0,
    width: 14,
    height: 5,
    borderRadius: 3,
  },
  bookmarkCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 10,
    width: "100%",
  },
  bookmarkCountText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
    flex: 1,
  },
  upcomingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  upcomingChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  guideOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  guideSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: "80%",
  },
  guideHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  guideTitleText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "center",
    flex: 1,
  },
  guideRuleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  guideRuleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  guideRuleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  guideRuleDot: { width: 7, height: 7, borderRadius: 4 },
  guideRuleLabel: { fontFamily: "Inter_700Bold", fontSize: 12 },
  guideRuleFullLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  guideRuleDesc: {
    fontSize: 13,
    textAlign: "right",
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  guideHowToBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  guideExBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  guideBoxLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textAlign: "right",
  },
  guideBoxText: {
    fontSize: 13,
    textAlign: "right",
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  guideExText: {
    fontSize: 18,
    textAlign: "right",
    lineHeight: 32,
  },
  tafsirOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  tafsirSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    maxHeight: "75%",
  },
  tafsirHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tafsirTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
});
