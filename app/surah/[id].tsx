import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { SURAHS, Verse } from "@/constants/quranData";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useEffect } from "react";

function VerseItem({
  verse,
  surahNumber,
  isBookmarked,
  onToggle,
}: {
  verse: Verse;
  surahNumber: number;
  isBookmarked: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    scale.value = withSpring(0.85, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 150 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={styles.verseContainer}>
      <View style={styles.verseHeader}>
        <View style={styles.verseNumberBadge}>
          <Text style={styles.verseNumberText}>{verse.number}</Text>
        </View>
        <Animated.View style={animStyle}>
          <Pressable onPress={handleToggle} hitSlop={12}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? Colors.gold : Colors.textMuted}
            />
          </Pressable>
        </Animated.View>
      </View>
      <Text style={styles.verseText}>{verse.text}</Text>
    </View>
  );
}

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  useEffect(() => {
    if (surah) {
      navigation.setOptions({
        title: `${surah.nameTranslit} — ${surah.nameArabic}`,
        headerStyle: { backgroundColor: Colors.bgDark },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 15,
          color: Colors.textPrimary,
        },
      });
    }
  }, [surah, navigation]);

  if (!surah) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Sourate introuvable</Text>
      </View>
    );
  }

  const headerComponent = (
    <View style={styles.surahHeader}>
      <Text style={styles.surahArabicName}>{surah.nameArabic}</Text>
      <Text style={styles.surahTranslit}>{surah.nameTranslit}</Text>
      <Text style={styles.surahFr}>{surah.nameFr}</Text>
      <View style={styles.surahMeta}>
        <View style={styles.metaPill}>
          <Ionicons name="layers-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{surah.versesCount} versets</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="book-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>Sourate {surah.number}</Text>
        </View>
      </View>
      {surah.number !== 1 && surah.number !== 9 && (
        <View style={styles.bismillahContainer}>
          <Text style={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}
    </View>
  );

  const availableCount = surah.verses.length;
  const totalCount = surah.versesCount;

  const footerComponent = (
    <View style={styles.footer}>
      {availableCount < totalCount && (
        <View style={styles.partialNotice}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.partialText}>
            {availableCount} verset{availableCount > 1 ? "s" : ""} disponible{availableCount > 1 ? "s" : ""} sur {totalCount}. La version complète sera disponible prochainement.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={surah.verses}
      keyExtractor={(v) => String(v.number)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.listContent,
        {
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={footerComponent}
      renderItem={({ item }) => (
        <VerseItem
          verse={item}
          surahNumber={surah.number}
          isBookmarked={isBookmarked(surah.number, item.number)}
          onToggle={() => toggleBookmark(surah.number, item.number)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.verseSeparator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    backgroundColor: Colors.bgDark,
  },
  surahHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  surahArabicName: {
    fontSize: 40,
    color: Colors.gold,
    textAlign: "center",
    marginBottom: 6,
  },
  surahTranslit: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  surahFr: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 2,
  },
  surahMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaText: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  bismillahContainer: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: "100%",
    alignItems: "center",
  },
  bismillah: {
    fontSize: 22,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  verseContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    color: Colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  verseText: {
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: "right",
    lineHeight: 42,
  },
  verseSeparator: {
    height: 10,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  partialNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partialText: {
    flex: 1,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
});
