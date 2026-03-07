import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks, SurahGroup, VerseBlock } from "@/contexts/BookmarksContext";

function BlockItem({
  block,
  onRemoveVerse,
  colors,
  arabicFont,
}: {
  block: VerseBlock;
  onRemoveVerse: (verseNumber: number) => void;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const rangeLabel =
    block.startVerse === block.endVerse
      ? `الآية ${block.startVerse}`
      : `الآيات ${block.startVerse} – ${block.endVerse}`;

  return (
    <View style={[styles.blockItem, { backgroundColor: colors.bgSurface }]}>
      <View style={styles.blockHeader}>
        <Text style={[styles.blockRange, { color: colors.gold }]}>{rangeLabel}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            for (let vn = block.startVerse; vn <= block.endVerse; vn++) {
              onRemoveVerse(vn);
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      {block.verses.map((verse) => (
        <View key={verse.number} style={styles.verseRow}>
          <View style={[styles.verseNumBadge, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.verseNumText, { color: colors.textMuted }]}>{verse.number}</Text>
          </View>
          <Text style={[
            styles.verseText,
            { color: colors.textPrimary },
            arabicFont ? { fontFamily: arabicFont } : {},
          ]}>
            {verse.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SurahSection({
  group,
  onRemoveVerse,
  colors,
  arabicFont,
}: {
  group: SurahGroup;
  onRemoveVerse: (surahNumber: number, verseNumber: number) => void;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
    Haptics.selectionAsync();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={[styles.surahSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Pressable onPress={toggle} style={styles.surahHeader}>
        <View style={styles.surahHeaderLeft}>
          <View style={[styles.surahNumBadge, { backgroundColor: colors.bgSurface, borderColor: colors.gold + "40" }]}>
            <Text style={[styles.surahNumText, { color: colors.gold }]}>{group.surahNumber}</Text>
          </View>
          <Text style={[styles.surahArabicName, { color: colors.textPrimary }]}>{group.surahNameArabic}</Text>
        </View>
        <View style={styles.surahHeaderRight}>
          <View style={[styles.countBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "30" }]}>
            <Text style={[styles.countText, { color: colors.gold }]}>{group.totalVerses} آية</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.blocksContainer, { borderTopColor: colors.border }]}>
          {group.blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              onRemoveVerse={(vn) => onRemoveVerse(group.surahNumber, vn)}
              colors={colors}
              arabicFont={arabicFont}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { surahGroups, toggleBookmark, isLoaded, blocks } = useBookmarks();
  const { colors, arabicFontFamily } = useSettings();

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const totalVerses = blocks.reduce((sum, b) => sum + b.verses.length, 0);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding, justifyContent: "center" }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>الحفظ</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalVerses > 0
            ? `${totalVerses} آية في ${surahGroups.length} سورة`
            : "لا توجد آيات محفوظة"}
        </Text>
      </View>

      <FlatList
        data={surahGroups}
        keyExtractor={(g) => String(g.surahNumber)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SurahSection
            group={item}
            onRemoveVerse={(surahNumber, verseNumber) =>
              toggleBookmark(surahNumber, verseNumber)
            }
            colors={colors}
            arabicFont={arabicFontFamily}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد آيات محفوظة</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              اضغط على الإشارة المرجعية عند قراءة أي سورة لإضافة الآيات للحفظ.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  surahSection: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  surahHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  surahHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  surahHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  surahNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  surahArabicName: {
    fontSize: 17,
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  countText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  blocksContainer: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  blockItem: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockRange: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  verseNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    flexShrink: 0,
  },
  verseNumText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  verseText: {
    flex: 1,
    fontSize: 20,
    textAlign: "right",
    lineHeight: 38,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
  },
});
