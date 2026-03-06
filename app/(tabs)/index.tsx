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
import { Colors } from "@/constants/colors";
import { SURAHS, Surah } from "@/constants/quranData";

type SearchMode = "surahs" | "verse";

interface VerseResult {
  surahNumber: number;
  surahNameArabic: string;
  surahNameTranslit: string;
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
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/surah/[id]",
          params: { id: String(result.surahNumber) },
        })
      }
      style={({ pressed }) => [styles.verseCard, pressed && styles.cardPressed]}
    >
      <View style={styles.verseCardTop}>
        <View style={styles.verseRefBadge}>
          <Text style={styles.verseRefText}>
            {result.surahNumber}:{result.verseNumber}
          </Text>
        </View>
        <View style={styles.verseCardNames}>
          <Text style={styles.verseCardArabicName}>{result.surahNameArabic}</Text>
          <Text style={styles.verseCardTranslit}>{result.surahNameTranslit}</Text>
        </View>
      </View>
      {result.verseText ? (
        <Text style={styles.verseCardText}>{result.verseText}</Text>
      ) : (
        <Text style={styles.verseCardMissing}>
          الآية {result.verseNumber} — اضغط للانتقال إلى السورة
        </Text>
      )}
    </Pressable>
  );
}

function SurahCard({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.translitName}>{surah.nameTranslit}</Text>
        <Text style={styles.verseCount}>{surah.versesCount} آية</Text>
      </View>
      <Text style={styles.arabicName}>{surah.nameArabic}</Text>
    </Pressable>
  );
}

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

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
          surahNameTranslit: surah.nameTranslit,
          verseNumber: parsed.verseNum,
          verseText: verseData ? verseData.text : null,
        },
      };
    }

    const lower = q.toLowerCase();
    const matched = SURAHS.filter((s) => s.nameArabic.includes(q));
    return { mode: "surahs", filteredSurahs: matched, verseResult: null };
  }, [search]);

  const hintText =
    search.trim() === ""
      ? "اكتب اسم السورة بالعربية أو رقم الآية مثل: 1.5"
      : null;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.subtitle}>١١٤ سورة • ٦٢٣٦ آية</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          textAlign="right"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {hintText && (
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.hintText}>{hintText}</Text>
        </View>
      )}

      {mode === "verse" && verseResult && (
        <View style={styles.verseResultContainer}>
          <Text style={styles.verseResultLabel}>نتيجة البحث عن آية</Text>
          <VerseResultCard result={verseResult} />
        </View>
      )}

      {mode === "surahs" && (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(s) => String(s.number)}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            search.trim() !== "" ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>لا توجد نتائج</Text>
                <Text style={styles.emptyHint}>
                  ابحث بالاسم العربي للسورة{"\n"}أو استخدم الصيغة 1.5 للبحث عن آية
                </Text>
              </View>
            ) : null
          }
        />
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: Colors.gold,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
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
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "right",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 120,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: Colors.bgSurface,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: Colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  cardInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  translitName: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "right",
  },
  verseCount: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  arabicName: {
    color: Colors.textPrimary,
    fontSize: 20,
    textAlign: "right",
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
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  emptyHint: {
    color: Colors.textMuted,
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
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 8,
  },
  verseCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    gap: 12,
  },
  verseCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-end",
  },
  verseCardNames: {
    alignItems: "flex-end",
    flex: 1,
  },
  verseCardArabicName: {
    color: Colors.textPrimary,
    fontSize: 18,
    textAlign: "right",
  },
  verseCardTranslit: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "right",
    marginTop: 1,
  },
  verseRefBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    flexShrink: 0,
  },
  verseRefText: {
    color: Colors.gold,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  verseCardText: {
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: "right",
    lineHeight: 42,
  },
  verseCardMissing: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "right",
    fontStyle: "italic",
  },
});
