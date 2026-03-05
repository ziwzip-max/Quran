import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useBookmarks, SurahGroup, VerseBlock } from "@/contexts/BookmarksContext";

function BlockItem({
  block,
  onRemoveVerse,
}: {
  block: VerseBlock;
  onRemoveVerse: (verseNumber: number) => void;
}) {
  const rangeLabel =
    block.startVerse === block.endVerse
      ? `الآية ${block.startVerse}`
      : `الآيات ${block.startVerse} – ${block.endVerse}`;

  return (
    <View style={styles.blockItem}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockRange}>{rangeLabel}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            for (let vn = block.startVerse; vn <= block.endVerse; vn++) {
              onRemoveVerse(vn);
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
      {block.verses.map((verse) => (
        <View key={verse.number} style={styles.verseRow}>
          <View style={styles.verseNumBadge}>
            <Text style={styles.verseNumText}>{verse.number}</Text>
          </View>
          <Text style={styles.verseText}>{verse.text}</Text>
        </View>
      ))}
    </View>
  );
}

function SurahSection({
  group,
  onRemoveVerse,
}: {
  group: SurahGroup;
  onRemoveVerse: (surahNumber: number, verseNumber: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    rotation.value = withTiming(expanded ? 0 : 90, { duration: 200 });
    setExpanded(!expanded);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.surahSection}>
      <Pressable onPress={toggle} style={styles.surahHeader}>
        <View style={styles.surahHeaderLeft}>
          <View style={styles.surahNumBadge}>
            <Text style={styles.surahNumText}>{group.surahNumber}</Text>
          </View>
          <View>
            <View style={styles.surahNameRow}>
              <Text style={styles.surahArabicName}>{group.surahNameArabic}</Text>
              <Text style={styles.surahNumberInline}>({group.surahNumber})</Text>
            </View>
            <Text style={styles.surahTranslitName}>{group.surahNameTranslit}</Text>
          </View>
        </View>
        <View style={styles.surahHeaderRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{group.totalVerses} آية</Text>
          </View>
          <Animated.View style={arrowStyle}>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.blocksContainer}>
          {group.blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              onRemoveVerse={(vn) => onRemoveVerse(group.surahNumber, vn)}
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

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const totalVerses = blocks.reduce((sum, b) => sum + b.verses.length, 0);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: topPadding, justifyContent: "center" }]}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>الحفظ</Text>
        <Text style={styles.subtitle}>
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
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد آيات محفوظة</Text>
            <Text style={styles.emptyDesc}>
              اضغط على{" "}
              <Ionicons
                name="bookmark-outline"
                size={13}
                color={Colors.textSecondary}
              />{" "}
              عند قراءة أي سورة لإضافة الآيات للحفظ.
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
    backgroundColor: Colors.bgDark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  surahSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumText: {
    color: Colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  surahNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  surahArabicName: {
    color: Colors.textPrimary,
    fontSize: 17,
  },
  surahNumberInline: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  surahTranslitName: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  countText: {
    color: Colors.gold,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  blocksContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  blockItem: {
    backgroundColor: Colors.bgSurface,
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
    color: Colors.gold,
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
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    flexShrink: 0,
  },
  verseNumText: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  verseText: {
    flex: 1,
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
  },
});
