import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  PanResponder,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks, VerseBlock } from "@/contexts/BookmarksContext";
import { useMastery } from "@/contexts/MasteryContext";

type PracticeMode = "عرض" | "اختبار" | "بطاقات" | "إملاء" | "تغطية";

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

function WordTestCard({
  block, index, colors, arabicFont,
}: {
  block: VerseBlock; index: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const [revealedWords, setRevealedWords] = useState<Record<number, Set<number>>>({});

  const rangeLabel = block.startVerse === block.endVerse
    ? `الآية ${block.startVerse}`
    : `الآيات ${block.startVerse} – ${block.endVerse}`;

  const allWordSets = useMemo(() => {
    const m: Record<number, string[]> = {};
    block.verses.forEach((v) => { m[v.number] = v.text.trim().split(/\s+/); });
    return m;
  }, [block]);

  const totalWords = useMemo(() =>
    Object.values(allWordSets).reduce((s, w) => s + w.length, 0), [allWordSets]);

  const revealedCount = useMemo(() =>
    Object.values(revealedWords).reduce((s, set) => s + set.size, 0), [revealedWords]);

  const allRevealed = revealedCount === totalWords;

  const revealWord = (verseNum: number, wordIdx: number) => {
    setRevealedWords((prev) => {
      const current = new Set(prev[verseNum] ?? []);
      current.add(wordIdx);
      return { ...prev, [verseNum]: current };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const revealAll = () => {
    const all: Record<number, Set<number>> = {};
    block.verses.forEach((v) => {
      const words = allWordSets[v.number];
      all[v.number] = new Set(words.map((_, i) => i));
    });
    setRevealedWords(all);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
        <View style={styles.revealHeaderRight}>
          <Text style={[styles.wordCounter, { color: colors.textMuted }]}>{revealedCount}/{totalWords}</Text>
          {!allRevealed && (
            <Pressable
              onPress={revealAll}
              style={[styles.revealAllBtn, { borderColor: colors.gold + "40", backgroundColor: colors.gold + "10" }]}
            >
              <Text style={[styles.revealAllText, { color: colors.gold }]}>كشف الكل</Text>
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.versesContainer}>
        {block.verses.map((verse) => {
          const words = allWordSets[verse.number];
          const revealed = revealedWords[verse.number] ?? new Set<number>();
          return (
            <View key={verse.number} style={styles.wordVerseBlock}>
              <View style={[styles.verseNumDot, { backgroundColor: colors.bgSurface, alignSelf: "flex-end", marginBottom: 6 }]}>
                <Text style={[styles.verseNumText, { color: colors.textMuted }]}>{verse.number}</Text>
              </View>
              <View style={styles.wordRow}>
                {words.map((word, idx) => {
                  const isRev = revealed.has(idx);
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => !isRev && revealWord(verse.number, idx)}
                      disabled={isRev}
                      style={[
                        styles.wordChip,
                        {
                          backgroundColor: isRev ? "transparent" : colors.bgSurface,
                          borderColor: isRev ? "transparent" : colors.border,
                        },
                      ]}
                    >
                      <Text style={[
                        styles.wordChipText,
                        { color: isRev ? colors.textPrimary : colors.bgSurface },
                        arabicFont ? { fontFamily: arabicFont } : {},
                      ]}>
                        {word}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProgressiveMaskingCard({
  block, index, colors, arabicFont,
}: {
  block: VerseBlock; index: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const [hiddenCount, setHiddenCount] = useState(0);
  const words = useMemo(() => {
    return block.verses.flatMap(v => v.text.trim().split(/\s+/));
  }, [block]);

  const totalWords = words.length;

  useEffect(() => {
    if (hiddenCount > 0 && hiddenCount < totalWords) {
      const timer = setTimeout(() => {
        setHiddenCount(prev => Math.min(prev + 1, totalWords));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hiddenCount, totalWords]);

  const startMasking = () => {
    if (hiddenCount === 0) {
      setHiddenCount(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const revealAll = () => {
    setHiddenCount(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const hideNext = () => {
    setHiddenCount(prev => Math.min(prev + 1, totalWords));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
        </View>
        <View style={styles.revealHeaderRight}>
          <Text style={[styles.wordCounter, { color: colors.textMuted }]}>{hiddenCount}/{totalWords} مخفي</Text>
          {hiddenCount > 0 && (
            <Pressable
              onPress={revealAll}
              style={[styles.revealAllBtn, { borderColor: colors.gold + "40", backgroundColor: colors.gold + "10" }]}
            >
              <Text style={[styles.revealAllText, { color: colors.gold }]}>كشف الكل</Text>
            </Pressable>
          )}
        </View>
      </View>
      
      <Pressable onPress={hiddenCount === 0 ? startMasking : hideNext} style={styles.versesContainer}>
        <View style={styles.wordRow}>
          {words.map((word, idx) => {
            const isHidden = idx < hiddenCount;
            return (
              <View
                key={idx}
                style={[
                  styles.wordChip,
                  {
                    backgroundColor: isHidden ? colors.bgSurface : "transparent",
                    borderColor: isHidden ? colors.border : "transparent",
                  },
                ]}
              >
                <Text style={[
                  styles.wordChipText,
                  { color: isHidden ? colors.bgSurface : colors.textPrimary },
                  arabicFont ? { fontFamily: arabicFont } : {},
                ]}>
                  {word}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>

      {hiddenCount === 0 && (
        <Pressable 
          onPress={startMasking}
          style={[styles.startMaskingBtn, { backgroundColor: colors.gold }]}
        >
          <Text style={[styles.startMaskingText, { color: colors.bgDark }]}>ابدأ التغطية التلقائية</Text>
        </Pressable>
      )}
    </View>
  );
}

function DictationCard({
  block, index, colors, arabicFont,
}: {
  block: VerseBlock; index: number;
  colors: ReturnType<typeof useSettings>["colors"]; arabicFont: string | undefined;
}) {
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  
  const originalWords = useMemo(() => {
    return block.verses.flatMap(v => v.text.trim().split(/\s+/));
  }, [block]);

  const userWords = userInput.trim().split(/\s+/).filter(w => w.length > 0);

  const correctCount = userWords.reduce((acc, word, idx) => {
    if (idx < originalWords.length && word === originalWords[idx]) {
      return acc + 1;
    }
    return acc;
  }, 0);

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
        </View>
        <View style={styles.revealHeaderRight}>
          <Text style={[styles.wordCounter, { color: colors.textMuted }]}>{correctCount}/{originalWords.length} صحيح</Text>
        </View>
      </View>

      <TextInput
        style={[
          styles.dictationInput, 
          { 
            color: colors.textPrimary, 
            backgroundColor: colors.bgSurface, 
            borderColor: colors.border,
            fontFamily: arabicFont 
          }
        ]}
        placeholder="اكتب الآية هنا..."
        placeholderTextColor={colors.textMuted}
        multiline
        value={userInput}
        onChangeText={setUserInput}
        textAlign="right"
      />

      <View style={styles.dictationFeedback}>
        {userWords.map((word, idx) => {
          const isCorrect = idx < originalWords.length && word === originalWords[idx];
          return (
            <Text 
              key={idx} 
              style={[
                styles.feedbackWord, 
                { color: isCorrect ? colors.success : colors.error },
                arabicFont ? { fontFamily: arabicFont } : {}
              ]}
            >
              {word}
            </Text>
          );
        })}
      </View>

      {showAnswer && (
        <View style={[styles.answerBox, { backgroundColor: colors.bgSurface, borderColor: colors.gold + "20" }]}>
          <Text style={[styles.answerText, { color: colors.textPrimary }, arabicFont ? { fontFamily: arabicFont } : {}]}>
            {originalWords.join(" ")}
          </Text>
        </View>
      )}

      <Pressable 
        onPress={() => setShowAnswer(!showAnswer)}
        style={[styles.showAnswerBtn, { borderColor: colors.gold }]}
      >
        <Text style={[styles.showAnswerText, { color: colors.gold }]}>
          {showAnswer ? "إخفاء الإجابة" : "عرض الإجابة"}
        </Text>
      </Pressable>
    </View>
  );
}

function FlashcardMode({
  blocks, colors, arabicFont,
}: {
  blocks: VerseBlock[];
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const shuffled = useMemo(() => [...blocks].sort(() => Math.random() - 0.5), [blocks]);
  const [cardIndex, setCardIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isPinchRef = useRef(false);

  const currentBlock = shuffled[cardIndex % shuffled.length];

  const referenceLabel = currentBlock
    ? `سورة ${currentBlock.surahNameArabic} — ${
        currentBlock.startVerse === currentBlock.endVerse
          ? `الآية ${currentBlock.startVerse}`
          : `الآيات ${currentBlock.startVerse} – ${currentBlock.endVerse}`
      }`
    : "";

  const verseText = currentBlock
    ? currentBlock.verses.map((v) => v.text).join(" ")
    : "";

  const flip = useCallback(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
    setIsFlipped((f) => !f);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isFlipped, flipAnim]);

  const next = useCallback((known: boolean) => {
    if (known) setKnownCount((k) => k + 1);
    setSeenCount((s) => s + 1);
    flipAnim.setValue(0);
    setIsFlipped(false);
    setCardIndex((i) => i + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [flipAnim]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderRelease: (_, gs) => {
      if (Math.abs(gs.dx) > 60) {
        next(gs.dx > 0);
      }
    },
  }), [next]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  const total = shuffled.length;
  const progress = total > 0 ? ((cardIndex % total) + 1) : 1;

  return (
    <View style={styles.flashContainer}>
      <View style={styles.flashProgress}>
        <Text style={[styles.flashProgressText, { color: colors.textMuted }]}>
          {knownCount} حفظت • {seenCount} مررت • {progress}/{total}
        </Text>
      </View>

      <View {...panResponder.panHandlers} style={styles.flashCardWrap}>
        <Pressable onPress={flip} style={styles.flashCardPressable}>
          <Animated.View style={[
            styles.flashCard,
            { backgroundColor: colors.bgCard, borderColor: colors.gold + "40" },
            { transform: [{ rotateY: frontRotate }], backfaceVisibility: "hidden" },
          ]}>
            <View style={styles.flashFaceContent}>
              <Ionicons name="help-circle-outline" size={32} color={colors.gold + "80"} style={{ marginBottom: 16 }} />
              <Text style={[styles.flashReference, { color: colors.textPrimary }]}>
                {referenceLabel}
              </Text>
              <Text style={[styles.flashHint, { color: colors.textMuted }]}>اضغط لكشف الآية</Text>
            </View>
          </Animated.View>

          <Animated.View style={[
            styles.flashCard,
            { backgroundColor: colors.bgCard, borderColor: colors.gold + "40", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            { transform: [{ rotateY: backRotate }], backfaceVisibility: "hidden" },
          ]}>
            <View style={styles.flashFaceContent}>
              <Text style={[
                styles.flashVerseText,
                { color: colors.textPrimary },
                arabicFont ? { fontFamily: arabicFont } : {},
              ]}>
                {verseText}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.flashActions}>
        <Pressable
          onPress={() => next(false)}
          style={[styles.flashActionBtn, { backgroundColor: colors.error + "20", borderColor: colors.error + "50" }]}
        >
          <Ionicons name="close" size={24} color={colors.error} />
          <Text style={[styles.flashActionText, { color: colors.error }]}>لا أعرف</Text>
        </Pressable>
        <Pressable
          onPress={flip}
          style={[styles.flashFlipBtn, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
        >
          <Ionicons name="sync" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => next(true)}
          style={[styles.flashActionBtn, { backgroundColor: colors.success + "20", borderColor: colors.success + "50" }]}
        >
          <Ionicons name="checkmark" size={24} color={colors.success} />
          <Text style={[styles.flashActionText, { color: colors.success }]}>أعرفها</Text>
        </Pressable>
      </View>

      <Text style={[styles.flashSwipeHint, { color: colors.textMuted }]}>
        ← لا أعرف • أعرفها →
      </Text>
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { blocks } = useBookmarks();
  const { getMastery } = useMastery();
  const { colors, arabicFontFamily } = useSettings();
  const [selected, setSelected] = useState<VerseBlock[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<PracticeMode>("عرض");

  const buttonScale = useRef(new Animated.Value(1)).current;

  const wellLearnedBlocks = useMemo(() =>
    blocks.filter(block =>
      block.verses.every(v => getMastery(block.surahNumber, v.number) >= 2)
    ),
    [blocks, getMastery]
  );

  const draw = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(pickTwoBlocks(wellLearnedBlocks));
    setHasDrawn(true);
  }, [wellLearnedBlocks]);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const noBookmarks = blocks.length === 0;
  const noneQualified = blocks.length > 0 && wellLearnedBlocks.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary, textAlign: "right" }]}>آيات الصلاة</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: "right" }]}>آياتك الجاهزة للتلاوة في الصلاة</Text>
          </View>
          {!noBookmarks && !noneQualified && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                onPress={draw}
                style={({ pressed }) => [styles.drawButton, { backgroundColor: colors.gold }, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="shuffle" size={18} color={colors.bgDark} />
                <Text style={[styles.drawButtonText, { color: colors.bgDark }]}>{hasDrawn ? "اقترح جديد" : "اقترح"}</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>

      {!noBookmarks && !noneQualified && hasDrawn && (
        <View style={[styles.modeBarContainer, { backgroundColor: colors.bgDark }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeBarScroll}
          >
            {(["عرض", "اختبار", "بطاقات", "إملاء", "تغطية"] as PracticeMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modeBtn, mode === m && { backgroundColor: colors.gold }]}
              >
                <Text style={[styles.modeBtnText, { color: mode === m ? colors.bgDark : colors.textMuted }]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {mode === "بطاقات" && hasDrawn && !noBookmarks && !noneQualified ? (
        <FlashcardMode blocks={wellLearnedBlocks} colors={colors} arabicFont={arabicFontFamily} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 70 }]}
          showsVerticalScrollIndicator={false}
        >
          {noBookmarks ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد آيات محفوظة</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                أضف آيات للحفظ من صفحة "محفوظاتي" لتتمكن من التلاوة في الصلاة.
              </Text>
            </View>
          ) : noneQualified ? (
            <View style={styles.emptyState}>
              <Ionicons name="medal-outline" size={52} color={colors.gold} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد آيات جاهزة بعد</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                أكمل حفظك حتى تصل الآيات إلى مستوى (محفوظ) أو أعلى، وستظهر هنا جاهزة للتلاوة في الصلاة.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.infoBox, { backgroundColor: colors.teal + "20", borderColor: colors.teal + "40" }]}>
                <Ionicons name="information-circle" size={16} color={colors.tealLight} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {wellLearnedBlocks.length === 1
                    ? "مجموعة واحدة وصلت لمستوى الإتقان"
                    : `${wellLearnedBlocks.length} مجموعات وصلت لمستوى الإتقان • مجموعتان للتلاوة`}
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
                    {mode === "عرض" ? "آيات مقترحة للصلاة" : 
                     mode === "تغطية" ? "التغطية التدريجية — اقرأ من ذاكرتك" :
                     mode === "إملاء" ? "إملاء — اكتب الآية وتأكد من صحتها" :
                     "اختبر حفظك — اكشف كلمة بكلمة"}
                  </Text>
                  {selected.map((block, i) => {
                    if (mode === "عرض") return <DisplayBlockCard key={block.id} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />;
                    if (mode === "تغطية") return <ProgressiveMaskingCard key={block.id + "mask"} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />;
                    if (mode === "إملاء") return <DictationCard key={block.id + "dict"} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />;
                    return <WordTestCard key={block.id + "test"} block={block} index={i} colors={colors} arabicFont={arabicFontFamily} />;
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  modeBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modeBarScroll: {
    flexDirection: "row",
    backgroundColor: "transparent",
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
  revealHeaderRight: { alignItems: "flex-end", gap: 4 },
  wordCounter: { fontFamily: "Inter_500Medium", fontSize: 11 },
  versesContainer: { gap: 12 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  verseArabic: { flex: 1, fontSize: 22, textAlign: "right", lineHeight: 42 },
  verseNumDot: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center",
    justifyContent: "center", marginTop: 6, flexShrink: 0,
  },
  verseNumText: { fontFamily: "Inter_500Medium", fontSize: 9 },
  revealAllBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  revealAllText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  wordVerseBlock: { gap: 8 },
  wordRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
  },
  wordChip: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 32, alignItems: "center",
  },
  wordChipText: { fontSize: 20, lineHeight: 34 },
  startMaskingBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  startMaskingText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  dictationInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: "top",
  },
  dictationFeedback: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    justifyContent: "flex-start",
  },
  feedbackWord: { fontSize: 18 },
  answerBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  answerText: { fontSize: 18, textAlign: "right", lineHeight: 30 },
  showAnswerBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  showAnswerText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  flashContainer: { flex: 1, paddingHorizontal: 16 },
  flashProgress: { alignItems: "center", paddingBottom: 12 },
  flashProgressText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  flashCardWrap: { flex: 1, justifyContent: "center" },
  flashCardPressable: { flex: 1, maxHeight: 380 },
  flashCard: {
    flex: 1, borderRadius: 24, borderWidth: 1, padding: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  flashFaceContent: { alignItems: "center", gap: 16, padding: 8 },
  flashReference: { fontSize: 22, textAlign: "center", lineHeight: 36 },
  flashHint: { fontFamily: "Inter_400Regular", fontSize: 13 },
  flashVerseText: { fontSize: 22, textAlign: "center", lineHeight: 40 },
  flashActions: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    paddingVertical: 16, gap: 12,
  },
  flashActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 16, borderWidth: 1, paddingVertical: 14, gap: 8,
  },
  flashFlipBtn: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  flashActionText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  flashSwipeHint: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 11, paddingBottom: 8 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 24 },

  drawButton: { flexDirection: "row", alignItems: "center", borderRadius: 50, paddingVertical: 16, paddingHorizontal: 36, gap: 10 },
  drawButtonText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
