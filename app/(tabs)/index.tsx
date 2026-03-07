import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/contexts/SettingsContext";
import { SURAHS, Surah } from "@/constants/quranData";
import { SettingsModal } from "@/components/SettingsModal";

type SearchMode = "surahs" | "verse";

interface VerseResult {
  surahNumber: number;
  surahNameArabic: string;
  verseNumber: number;
  verseText: string | null;
}

function parseVerseQuery(query: string): { surahNum: number; verseNum: number } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(\d+)[.\s:،,](\d+)$/);
  if (!match) return null;
  const s = parseInt(match[1], 10);
  const v = parseInt(match[2], 10);
  if (s < 1 || s > 114 || v < 1) return null;
  return { surahNum: s, verseNum: v };
}

function VerseResultCard({ result }: { result: VerseResult }) {
  const { colors } = useSettings();
  const s = cardStyles(colors);
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/surah/[id]",
          params: { id: String(result.surahNumber), verse: String(result.verseNumber) },
        })
      }
      style={({ pressed }) => [s.verseCard, pressed && s.cardPressed]}
    >
      <View style={s.verseCardTop}>
        <View style={s.verseRefBadge}>
          <Text style={s.verseRefText}>
            {result.surahNumber}:{result.verseNumber}
          </Text>
        </View>
        <Text style={s.verseCardArabicName}>{result.surahNameArabic}</Text>
      </View>
      {result.verseText ? (
        <Text style={s.verseCardText}>{result.verseText}</Text>
      ) : (
        <Text style={s.verseCardMissing}>
          الآية {result.verseNumber} — اضغط للانتقال إلى السورة
        </Text>
      )}
    </Pressable>
  );
}

function SurahCard({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  const { colors } = useSettings();
  const s = cardStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
    >
      <View style={s.cardInfo}>
        <Text style={s.verseCount}>{surah.versesCount} آية</Text>
      </View>
      <Text style={s.arabicName}>{surah.nameArabic}</Text>
      <View style={s.numberBadge}>
        <Text style={s.numberText}>{surah.number}</Text>
      </View>
    </Pressable>
  );
}

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const [search, setSearch] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const { mode, filteredSurahs, verseResult } = useMemo<{
    mode: SearchMode;
    filteredSurahs: Surah[];
    verseResult: VerseResult | null;
  }>(() => {
    const q = search.trim();

    if (q === "") {
      return { mode: "surahs", filteredSurahs: SURAHS, verseResult: null };
    }

    const parsed = parseVerseQuery(q);
    if (parsed) {
      const surah = SURAHS.find((s) => s.number === parsed.surahNum);
      if (!surah) {
        return { mode: "surahs", filteredSurahs: [], verseResult: null };
      }
      const verseData = surah.verses.find((v) => v.number === parsed.verseNum);
      return {
        mode: "verse",
        filteredSurahs: [],
        verseResult: {
          surahNumber: surah.number,
          surahNameArabic: surah.nameArabic,
          verseNumber: parsed.verseNum,
          verseText: verseData ? verseData.text : null,
        },
      };
    }

    const num = parseInt(q, 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      const surah = SURAHS.find((s) => s.number === num);
      return { mode: "surahs", filteredSurahs: surah ? [surah] : [], verseResult: null };
    }

    const matched = SURAHS.filter((s) => s.nameArabic.includes(q) || s.nameTranslit.toLowerCase().includes(q.toLowerCase()));
    return { mode: "surahs", filteredSurahs: matched, verseResult: null };
  }, [search]);

  const hintText =
    search.trim() === ""
      ? "اكتب اسم السورة أو رقمها أو آية مثل: 2:255"
      : null;

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { paddingTop: topPadding }]}>
      <View style={s.header}>
        <Pressable onPress={() => setSettingsVisible(true)} style={s.gearBtn} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.title}>القرآن الكريم</Text>
          <Text style={s.subtitle}>١١٤ سورة • ٦٢٣٦ آية</Text>
        </View>
      </View>

      <View style={s.searchContainer}>
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
        <TextInput
          style={s.searchInput}
          placeholder="البحث..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          textAlign="right"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Ionicons name="search" size={16} color={colors.textMuted} />
      </View>

      {hintText && (
        <View style={s.hintRow}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={s.hintText}>{hintText}</Text>
        </View>
      )}

      {mode === "verse" && verseResult && (
        <View style={s.verseResultContainer}>
          <Text style={s.verseResultLabel}>نتيجة البحث عن آية</Text>
          <VerseResultCard result={verseResult} />
        </View>
      )}

      {mode === "surahs" && (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(s) => String(s.number)}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SurahCard
              surah={item}
              onPress={() =>
                router.push({
                  pathname: "/surah/[id]",
                  params: { id: String(item.number) },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            search.trim() !== "" ? (
              <View style={s.emptyState}>
                <Ionicons name="search" size={40} color={colors.textMuted} />
                <Text style={s.emptyText}>لا توجد نتائج</Text>
                <Text style={s.emptyHint}>
                  ابحث بالاسم العربي للسورة أو رقمها{"\n"}أو استخدم الصيغة 2:255 للبحث عن آية
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

function cardStyles(colors: ReturnType<typeof useSettings>["colors"]) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 14,
    },
    cardPressed: {
      opacity: 0.7,
      backgroundColor: colors.bgSurface,
    },
    cardInfo: {
      flex: 1,
      alignItems: "flex-start",
    },
    verseCount: {
      color: colors.textMuted,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      textAlign: "left",
    },
    arabicName: {
      color: colors.textPrimary,
      fontSize: 20,
      textAlign: "right",
    },
    numberBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.gold + "40",
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      color: colors.gold,
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
    },
    verseCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.gold + "40",
      gap: 12,
    },
    verseCardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      justifyContent: "flex-end",
    },
    verseCardArabicName: {
      color: colors.textPrimary,
      fontSize: 18,
      textAlign: "right",
    },
    verseRefBadge: {
      backgroundColor: colors.gold + "20",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: colors.gold + "40",
      flexShrink: 0,
    },
    verseRefText: {
      color: colors.gold,
      fontFamily: "Inter_700Bold",
      fontSize: 13,
    },
    verseCardText: {
      color: colors.textPrimary,
      fontSize: 22,
      textAlign: "right",
      lineHeight: 42,
    },
    verseCardMissing: {
      color: colors.textSecondary,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      textAlign: "right",
      fontStyle: "italic",
    },
  });
}

function makeStyles(colors: ReturnType<typeof useSettings>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgDark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    gearBtn: {
      padding: 4,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      color: colors.gold,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      textAlign: "center",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      padding: 0,
    },
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 20,
      marginBottom: 10,
      justifyContent: "flex-end",
    },
    hintText: {
      color: colors.textMuted,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      textAlign: "right",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === "web" ? 34 : 120,
    },
    separator: {
      height: 8,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: 60,
      gap: 12,
    },
    emptyText: {
      color: colors.textMuted,
      fontFamily: "Inter_600SemiBold",
      fontSize: 16,
      textAlign: "center",
    },
    emptyHint: {
      color: colors.textMuted,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      textAlign: "center",
      lineHeight: 22,
    },
    verseResultContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    verseResultLabel: {
      color: colors.textMuted,
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      textAlign: "right",
      marginBottom: 8,
    },
  });
}
