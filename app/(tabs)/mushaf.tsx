import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSettings } from "@/contexts/SettingsContext";
import { getFontSizeMultiplier } from "@/constants/themes";
import { useMastery } from "@/contexts/MasteryContext";
import { SURAHS } from "@/constants/quranData";
import {
  HIZB_START,
  JUZ_NAMES,
  SURAH_JUZ,
  SURAH_TYPE,
} from "@/constants/quranMeta";

const MUSHAF_POS_KEY = "al_hifz_mushaf_pos";
const MASTERY_COLORS = ["#4A5880", "#E67E22", "#C9A227", "#27AE60"] as const;

function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, "");
}

const LATIN_JUZ = Array.from({ length: 30 }, (_, i) => String(i + 1));
const LATIN_HIZB = Array.from({ length: 60 }, (_, i) => String(i + 1));

interface VerseEntry {
  verseNumber: number;
  text: string;
}

type MushafItem =
  | { type: "surah_header"; surahNumber: number; key: string }
  | { type: "juz_marker"; juzNumber: number; key: string }
  | { type: "hizb_marker"; hizbNumber: number; key: string }
  | { type: "verse_run"; surahNumber: number; verses: VerseEntry[]; key: string };

function buildMushafItems(): MushafItem[] {
  const items: MushafItem[] = [];
  const hizbLookup = new Map<string, number>();
  HIZB_START.forEach((h, i) => hizbLookup.set(`${h.surah}:${h.verse}`, i + 1));

  const juzLookup = new Map<string, number>();
  let prevJuz = 0;
  for (const surah of SURAHS) {
    const juz = SURAH_JUZ[surah.number];
    if (juz !== prevJuz) {
      juzLookup.set(`${surah.number}:1`, juz);
      prevJuz = juz;
    }
  }

  let currentRun: VerseEntry[] = [];
  let currentSurah = 0;

  function flushRun() {
    if (currentRun.length > 0 && currentSurah > 0) {
      items.push({
        type: "verse_run",
        surahNumber: currentSurah,
        verses: currentRun,
        key: `vr_${currentSurah}_${currentRun[0].verseNumber}_${currentRun[currentRun.length - 1].verseNumber}`,
      });
      currentRun = [];
    }
  }

  for (const surah of SURAHS) {
    flushRun();
    currentSurah = surah.number;

    items.push({
      type: "surah_header",
      surahNumber: surah.number,
      key: `sh_${surah.number}`,
    });

    for (const verse of surah.verses) {
      const posKey = `${surah.number}:${verse.number}`;

      const juzNum = juzLookup.get(posKey);
      if (juzNum !== undefined && verse.number === 1 && surah.number > 1) {
        flushRun();
        items.push({
          type: "juz_marker",
          juzNumber: juzNum,
          key: `juz_${juzNum}`,
        });
      }

      const hizbNum = hizbLookup.get(posKey);
      if (hizbNum !== undefined && !(surah.number === 1 && verse.number === 1)) {
        flushRun();
        items.push({
          type: "hizb_marker",
          hizbNumber: hizbNum,
          key: `hizb_${hizbNum}`,
        });
      }

      currentRun.push({ verseNumber: verse.number, text: verse.text });
    }
  }
  flushRun();

  return items;
}

const MUSHAF_ITEMS = buildMushafItems();


function SurahHeaderItem({
  surahNumber, colors,
}: {
  surahNumber: number; colors: ReturnType<typeof useSettings>["colors"];
}) {
  const surah = SURAHS.find(s => s.number === surahNumber)!;
  const type = SURAH_TYPE[surahNumber];
  const juz = SURAH_JUZ[surahNumber];
  const typeLabel = type === "mecquoise" ? "مكية" : "مدنية";
  return (
    <View style={[shStyles.container, { backgroundColor: colors.bgCard, borderColor: colors.gold + "50" }]}>
      <View style={[shStyles.ornamentLine, { backgroundColor: colors.gold + "30" }]} />
      <View style={shStyles.content}>
        <Text style={[shStyles.nameAr, { color: colors.gold }]}>{surah.nameArabic}</Text>
        <Text style={[shStyles.meta, { color: colors.textSecondary }]}>
          {typeLabel} • {surah.versesCount} آية • الجزء {LATIN_JUZ[juz - 1]}
        </Text>
      </View>
      <View style={[shStyles.ornamentLine, { backgroundColor: colors.gold + "30" }]} />
    </View>
  );
}

const shStyles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    height: 96,
    justifyContent: "center",
  },
  ornamentLine: {
    height: 1,
    marginHorizontal: 20,
  },
  content: {
    alignItems: "center",
    paddingVertical: 12,
  },
  nameAr: {
    fontSize: 22,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});

function JuzMarkerItem({
  juzNumber, colors,
}: {
  juzNumber: number; colors: ReturnType<typeof useSettings>["colors"];
}) {
  return (
    <View style={[jmStyles.container, { borderColor: colors.gold + "60" }]}>
      <View style={[jmStyles.line, { backgroundColor: colors.gold + "40" }]} />
      <View style={[jmStyles.badge, { backgroundColor: colors.bgDark, borderColor: colors.gold + "80" }]}>
        <Text style={[jmStyles.text, { color: colors.gold }]}>
          {JUZ_NAMES[juzNumber - 1]}
        </Text>
      </View>
      <View style={[jmStyles.line, { backgroundColor: colors.gold + "40" }]} />
    </View>
  );
}

const jmStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 6,
    height: 34,
  },
  line: { flex: 1, height: 1 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  text: { fontSize: 12, fontWeight: "600" as const },
});

function HizbMarkerItem({
  hizbNumber, colors,
}: {
  hizbNumber: number; colors: ReturnType<typeof useSettings>["colors"];
}) {
  return (
    <View style={[hmStyles.container]}>
      <View style={[hmStyles.line, { backgroundColor: colors.teal + "30" }]} />
      <Text style={[hmStyles.text, { color: colors.tealLight }]}>
        حزب {LATIN_HIZB[hizbNumber - 1]}
      </Text>
      <View style={[hmStyles.line, { backgroundColor: colors.teal + "30" }]} />
    </View>
  );
}

const hmStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 4,
    height: 26,
  },
  line: { flex: 1, height: 1 },
  text: {
    fontSize: 11,
    marginHorizontal: 10,
    fontWeight: "500" as const,
  },
});

function VerseRunItem({
  item, colors, arabicFont, arabicFontKey, arabicFontSize, lineSpacingValue, masteryMap, searchQuery,
  onLongPress,
}: {
  item: Extract<MushafItem, { type: "verse_run" }>;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont?: string;
  arabicFontKey: string;
  arabicFontSize: number;
  lineSpacingValue: number;
  masteryMap: Record<string, number>;
  searchQuery: string;
  onLongPress: (verseNumber: number) => void;
}) {
  const effectiveSize = arabicFontSize * getFontSizeMultiplier(arabicFontKey);
  const lineH = effectiveSize * lineSpacingValue * 1.6;
  const markerSize = effectiveSize * 0.6;
  const rawQuery = searchQuery.trim();
  const strippedQuery = stripDiacritics(rawQuery);
  const hasQuery = strippedQuery.length > 0;

  const highestMastery = useMemo(() => {
    let max = 0;
    for (const v of item.verses) {
      const m = (masteryMap[`${item.surahNumber}:${v.verseNumber}`] as number) ?? 0;
      if (m > max) max = m;
    }
    return max;
  }, [item.surahNumber, item.verses, masteryMap]);

  const dotColor = MASTERY_COLORS[highestMastery] ?? MASTERY_COLORS[0];

  return (
    <Pressable
      onLongPress={() => onLongPress(item.verses[0].verseNumber)}
      style={({ pressed }) => [
        vrStyles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {highestMastery > 0 && (
        <View style={[vrStyles.masteryDot, { backgroundColor: dotColor }]} />
      )}
      <Text
        style={[
          vrStyles.verseText,
          {
            color: colors.textPrimary,
            fontFamily: arabicFont,
            fontSize: effectiveSize,
            lineHeight: lineH,
          },
        ]}
      >
        {item.verses.map((v, i) => {
          const verseText = v.text;
          const marker = ` ﴿${v.verseNumber}﴾ `;
          const strippedVerse = stripDiacritics(verseText);
          const isMatch = hasQuery && strippedVerse.includes(strippedQuery);

          if (isMatch) {
            const segments: { text: string; highlight: boolean }[] = [];
            let remaining = verseText;
            let strippedRemaining = strippedVerse;
            const escapedQuery = strippedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp(escapedQuery, "gi");
            let match: RegExpExecArray | null;
            let lastIdx = 0;

            while ((match = re.exec(strippedRemaining)) !== null) {
              const matchStart = match.index;
              const matchEnd = matchStart + match[0].length;

              let origStart = 0;
              let strippedPos = 0;
              for (let ci = 0; ci < remaining.length && strippedPos < matchStart; ci++) {
                if (!/[\u064B-\u065F\u0670]/.test(remaining[ci])) strippedPos++;
                origStart = ci + 1;
              }
              let origEnd = origStart;
              strippedPos = matchStart;
              for (let ci = origStart; ci < remaining.length && strippedPos < matchEnd; ci++) {
                if (!/[\u064B-\u065F\u0670]/.test(remaining[ci])) strippedPos++;
                origEnd = ci + 1;
              }

              if (origStart > lastIdx) {
                segments.push({ text: verseText.slice(lastIdx, origStart), highlight: false });
              }
              segments.push({ text: verseText.slice(origStart, origEnd), highlight: true });
              lastIdx = origEnd;
            }
            if (lastIdx < verseText.length) {
              segments.push({ text: verseText.slice(lastIdx), highlight: false });
            }

            return (
              <React.Fragment key={v.verseNumber}>
                {segments.map((seg, si) =>
                  seg.highlight ? (
                    <Text
                      key={`${v.verseNumber}_h_${si}`}
                      style={{ backgroundColor: colors.gold + "40", color: colors.textPrimary, borderRadius: 3 }}
                    >
                      {seg.text}
                    </Text>
                  ) : (
                    <Text key={`${v.verseNumber}_p_${si}`}>{seg.text}</Text>
                  )
                )}
                <Text style={{ color: colors.gold, fontSize: markerSize }}>{marker}</Text>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={v.verseNumber}>
              {verseText}
              <Text style={{ color: colors.gold, fontSize: markerSize }}>{marker}</Text>
            </React.Fragment>
          );
        })}
      </Text>
    </Pressable>
  );
}

const vrStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  masteryDot: {
    position: "absolute",
    left: 8,
    top: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verseText: {
    textAlign: "justify",
    writingDirection: "rtl",
  },
});

type JumpTab = "surah" | "juz" | "hizb";

function JumpModal({
  visible, onClose, colors,
  onSelectSurah, onSelectJuz, onSelectHizb,
  masteryMap,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useSettings>["colors"];
  onSelectSurah: (n: number) => void;
  onSelectJuz: (n: number) => void;
  onSelectHizb: (n: number) => void;
  masteryMap: Record<string, number>;
}) {
  const [tab, setTab] = useState<JumpTab>("juz");
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[jmpStyles.container, { backgroundColor: colors.bgDark, paddingBottom: insets.bottom + 16 }]}>
        <View style={[jmpStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[jmpStyles.title, { color: colors.textPrimary }]}>الانتقال إلى</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={[jmpStyles.tabs, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {(["surah", "juz", "hizb"] as JumpTab[]).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[jmpStyles.tab, t === tab && { backgroundColor: colors.gold + "25", borderColor: colors.gold }]}
            >
              <Text style={[jmpStyles.tabText, { color: t === tab ? colors.gold : colors.textSecondary }]}>
                {t === "surah" ? "سورة" : t === "juz" ? "جزء" : "حزب"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "surah" && (
          <FlatList
            data={SURAHS}
            keyExtractor={s => String(s.number)}
            renderItem={({ item }) => {
              const juz = SURAH_JUZ[item.number];
              return (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectSurah(item.number); onClose(); }}
                  style={[jmpStyles.surahRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[jmpStyles.surahNum, { backgroundColor: colors.bgSurface }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[jmpStyles.surahNameAr, { color: colors.textPrimary }]}>{item.nameArabic}</Text>
                    <Text style={[jmpStyles.surahMeta, { color: colors.textMuted }]}>
                      {SURAH_TYPE[item.number] === "mecquoise" ? "مكية" : "مدنية"} • ج{LATIN_JUZ[juz - 1]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {tab === "juz" && (
          <ScrollView contentContainerStyle={jmpStyles.grid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
              <Pressable
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectJuz(n); onClose(); }}
                style={[jmpStyles.gridCell, { backgroundColor: colors.bgCard, borderColor: colors.gold + "50" }]}
              >
                <Text style={[jmpStyles.gridNum, { color: colors.gold }]}>{LATIN_JUZ[n - 1]}</Text>
                <Text style={[jmpStyles.gridLabel, { color: colors.textMuted }]}>جزء</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {tab === "hizb" && (
          <ScrollView contentContainerStyle={jmpStyles.grid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 60 }, (_, i) => i + 1).map(n => (
              <Pressable
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectHizb(n); onClose(); }}
                style={[jmpStyles.gridCell, { backgroundColor: colors.bgCard, borderColor: colors.teal + "50" }]}
              >
                <Text style={[jmpStyles.gridNum, { color: colors.tealLight }]}>{LATIN_HIZB[n - 1]}</Text>
                <Text style={[jmpStyles.gridLabel, { color: colors.textMuted }]}>حزب</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const jmpStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "700" as const },
  tabs: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 10,
  },
  tabText: { fontSize: 14, fontWeight: "600" as const },
  surahRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  surahNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  surahNameAr: { fontSize: 16, textAlign: "right" },
  surahMeta: { fontSize: 11, textAlign: "right", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    justifyContent: "center",
  },
  gridCell: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  gridNum: { fontSize: 22, fontWeight: "700" as const },
  gridLabel: { fontSize: 10, marginTop: 2 },
});

export default function MushafScreen() {
  const insets = useSafeAreaInsets();
  const { colors, arabicFontFamily, arabicFont: arabicFontKey, arabicFontSize, lineSpacingValue } = useSettings();
  const { masteryMap } = useMastery();
  const listRef = useRef<FlatList>(null);
  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [jumpVisible, setJumpVisible] = useState(false);
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    toastOpacity.setValue(1);
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 2500,
      delay: 1000,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [toastOpacity]);

  useEffect(() => {
    AsyncStorage.getItem(MUSHAF_POS_KEY).then(stored => {
      if (stored) {
        try {
          const { itemIndex, juzNum } = JSON.parse(stored);
          if (typeof itemIndex === "number" && itemIndex > 0) {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: itemIndex, animated: false, viewPosition: 0 });
              if (juzNum) showToast(`استؤنف من ${JUZ_NAMES[juzNum - 1]}`);
            }, 600);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const savePosition = useCallback((itemIndex: number) => {
    const item = MUSHAF_ITEMS[itemIndex];
    if (!item) return;
    let juzNum: number | undefined;
    for (let i = itemIndex; i >= 0; i--) {
      if (MUSHAF_ITEMS[i].type === "juz_marker") {
        juzNum = (MUSHAF_ITEMS[i] as Extract<MushafItem, { type: "juz_marker" }>).juzNumber;
        break;
      }
    }
    AsyncStorage.setItem(MUSHAF_POS_KEY, JSON.stringify({ itemIndex, juzNum })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchIndices([]);
      setCurrentMatchIdx(0);
      return;
    }
    const q = stripDiacritics(searchQuery.trim());
    const matches: number[] = [];
    MUSHAF_ITEMS.forEach((item, i) => {
      if (item.type === "verse_run" && item.verses.some(v => stripDiacritics(v.text).includes(q))) {
        matches.push(i);
      }
    });
    setMatchIndices(matches);
    setCurrentMatchIdx(0);
    if (matches.length > 0) {
      listRef.current?.scrollToIndex({ index: matches[0], animated: true, viewPosition: 0.3 });
    }
  }, [searchQuery]);

  const goToMatch = useCallback((direction: 1 | -1) => {
    if (matchIndices.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (currentMatchIdx + direction + matchIndices.length) % matchIndices.length;
    setCurrentMatchIdx(next);
    listRef.current?.scrollToIndex({ index: matchIndices[next], animated: true, viewPosition: 0.3 });
  }, [matchIndices, currentMatchIdx]);

  const scrollToSurah = useCallback((surahNumber: number) => {
    const idx = MUSHAF_ITEMS.findIndex(
      item => item.type === "surah_header" && item.surahNumber === surahNumber
    );
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    }
  }, []);

  const scrollToJuz = useCallback((juzNumber: number) => {
    const idx = MUSHAF_ITEMS.findIndex(
      item => item.type === "juz_marker" && item.juzNumber === juzNumber
    );
    const fallback = MUSHAF_ITEMS.findIndex(
      item => item.type === "surah_header"
    );
    const target = idx >= 0 ? idx : fallback;
    if (target >= 0) {
      listRef.current?.scrollToIndex({ index: target, animated: true, viewPosition: 0 });
    }
  }, []);

  const scrollToHizb = useCallback((hizbNumber: number) => {
    const idx = MUSHAF_ITEMS.findIndex(
      item => item.type === "hizb_marker" && item.hizbNumber === hizbNumber
    );
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    }
  }, []);

  const handleVerseAction = useCallback((surahNumber: number, verseNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `${SURAHS.find(s => s.number === surahNumber)?.nameArabic ?? ""} — آية ${verseNumber}`,
      undefined,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "فتح في السورة",
          onPress: () => {
            router.push({ pathname: "/surah/[id]", params: { id: String(surahNumber), verse: String(verseNumber) } });
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(({ item }: { item: MushafItem }) => {
    if (item.type === "surah_header") {
      return <SurahHeaderItem surahNumber={item.surahNumber} colors={colors} />;
    }
    if (item.type === "juz_marker") {
      return <JuzMarkerItem juzNumber={item.juzNumber} colors={colors} />;
    }
    if (item.type === "hizb_marker") {
      return <HizbMarkerItem hizbNumber={item.hizbNumber} colors={colors} />;
    }
    if (item.type === "verse_run") {
      return (
        <VerseRunItem
          item={item}
          colors={colors}
          arabicFont={arabicFontFamily}
          arabicFontKey={arabicFontKey}
          arabicFontSize={arabicFontSize}
          lineSpacingValue={lineSpacingValue}
          masteryMap={masteryMap}
          searchQuery={searchQuery}
          onLongPress={(verseNumber) => handleVerseAction(item.surahNumber, verseNumber)}
        />
      );
    }
    return null;
  }, [colors, arabicFontFamily, arabicFontKey, arabicFontSize, lineSpacingValue, masteryMap, searchQuery, handleVerseAction]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const firstVisible = viewableItems[0]?.index;
    if (typeof firstVisible === "number") {
      savePosition(firstVisible);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const searchMatchLabel = useMemo(() => {
    if (matchIndices.length === 0) return "لا نتائج";
    return `${currentMatchIdx + 1} / ${matchIndices.length}`;
  }, [matchIndices, currentMatchIdx]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {searchActive ? (
          <View style={[styles.searchRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Pressable onPress={() => { setSearchActive(false); setSearchQuery(""); }} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ابحث في القرآن..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              textAlign="right"
              autoFocus
              returnKeyType="search"
            />
            {matchIndices.length > 0 && (
              <View style={styles.matchNav}>
                <Text style={[styles.matchCount, { color: colors.textSecondary }]}>{searchMatchLabel}</Text>
                <Pressable onPress={() => goToMatch(-1)} hitSlop={8} style={styles.matchBtn}>
                  <Ionicons name="chevron-up" size={18} color={colors.gold} />
                </Pressable>
                <Pressable onPress={() => goToMatch(1)} hitSlop={8} style={styles.matchBtn}>
                  <Ionicons name="chevron-down" size={18} color={colors.gold} />
                </Pressable>
              </View>
            )}
            {searchQuery.length > 0 && matchIndices.length === 0 && (
              <Text style={[styles.matchCount, { color: colors.textMuted }]}>لا نتائج</Text>
            )}
          </View>
        ) : (
          <View style={styles.headerMain}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => setJumpVisible(true)}
                style={[styles.jumpBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                hitSlop={8}
              >
                <Ionicons name="navigate-outline" size={18} color={colors.gold} />
                <Text style={[styles.jumpBtnText, { color: colors.gold }]}>انتقل</Text>
              </Pressable>
            </View>
            <View style={styles.headerCenter}>
              <Text style={[styles.title, { color: colors.gold }]}>المصحف الكريم</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => { setSearchActive(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                style={[styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                hitSlop={8}
              >
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={MUSHAF_ITEMS}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={15}
        initialNumToRender={20}
        updateCellsBatchingPeriod={100}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 90 }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: Math.min(info.index, MUSHAF_ITEMS.length - 1),
              animated: false,
            });
          }, 300);
        }}
      />

      {toast && (
        <Animated.View
          style={[styles.toast, { backgroundColor: colors.bgCard, borderColor: colors.border, opacity: toastOpacity }]}
        >
          <Text style={[styles.toastText, { color: colors.textPrimary }]}>{toast}</Text>
        </Animated.View>
      )}

      <JumpModal
        visible={jumpVisible}
        onClose={() => setJumpVisible(false)}
        colors={colors}
        onSelectSurah={scrollToSurah}
        onSelectJuz={scrollToJuz}
        onSelectHizb={scrollToHizb}
        masteryMap={masteryMap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerCenter: { flex: 2, alignItems: "center" },
  headerRight: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 16, fontWeight: "700" as const },
  iconBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 7,
  },
  jumpBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  jumpBtnText: { fontSize: 13, fontWeight: "600" as const },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    textAlign: "right",
    paddingVertical: 0,
  },
  matchNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchCount: { fontSize: 12, minWidth: 50, textAlign: "center" },
  matchBtn: { padding: 2 },
  toast: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  toastText: { fontSize: 13, fontWeight: "500" as const },
});
