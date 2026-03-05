import React, { useEffect } from "react";
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
    scale.value = withSpring(0.8, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 150 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={[styles.verseContainer, isBookmarked && styles.verseContainerBookmarked]}>
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumberBadge, isBookmarked && styles.verseNumberBadgeBookmarked]}>
          <Text style={[styles.verseNumberText, isBookmarked && styles.verseNumberTextBookmarked]}>
            {verse.number}
          </Text>
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const surahNumber = parseInt(id ?? "1", 10);
  const surah = SURAHS.find((s) => s.number === surahNumber);

  useEffect(() => {
    if (surah) {
      navigation.setOptions({
        title: surah.nameArabic,
        headerStyle: { backgroundColor: Colors.bgDark },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          color: Colors.textPrimary,
        },
        headerBackTitle: "القرآن",
      });
    }
  }, [surah, navigation]);

  if (!surah) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>السورة غير موجودة</Text>
      </View>
    );
  }

  const availableCount = surah.verses.length;
  const totalCount = surah.versesCount;

  const headerComponent = (
    <View style={styles.surahHeader}>
      <Text style={styles.surahArabicName}>{surah.nameArabic}</Text>
      <Text style={styles.surahTranslit}>{surah.nameTranslit}</Text>
      <View style={styles.surahMeta}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{surah.versesCount} آية</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>سورة {surah.number}</Text>
        </View>
      </View>
      {surah.number !== 9 && (
        <View style={styles.bismillahContainer}>
          <Text style={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}
    </View>
  );

  const footerComponent =
    availableCount < totalCount ? (
      <View style={styles.partialNotice}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={Colors.textMuted}
        />
        <Text style={styles.partialText}>
          {availableCount} آية متاحة من أصل {totalCount}
        </Text>
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <FlatList
        data={surah.verses}
        keyExtractor={(v) => String(v.number)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              Platform.OS === "web" ? 34 : insets.bottom + 24,
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
    </View>
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
    fontSize: 36,
    color: Colors.gold,
    textAlign: "center",
    marginBottom: 6,
  },
  surahTranslit: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  surahMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaPill: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaText: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
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
    fontSize: 21,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 36,
  },
  verseContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verseContainerBookmarked: {
    borderColor: Colors.gold + "50",
    backgroundColor: Colors.bgCard,
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
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberBadgeBookmarked: {
    borderColor: Colors.gold + "60",
    backgroundColor: Colors.gold + "15",
  },
  verseNumberText: {
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  verseNumberTextBookmarked: {
    color: Colors.gold,
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
  partialNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partialText: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
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
