import React from "react";
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
import { Colors } from "@/constants/colors";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { BookmarkedVerse } from "@/constants/quranData";

function BookmarkedCard({
  verse,
  onRemove,
}: {
  verse: BookmarkedVerse;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.refBadge}>
          <Text style={styles.refText}>
            {verse.surahNameTranslit} • {verse.verseNumber}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemove();
          }}
          hitSlop={12}
        >
          <Ionicons name="bookmark" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      <Text style={styles.arabicText}>{verse.text}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.surahLabel}>
          سورة {verse.surahNameArabic}
        </Text>
        <Text style={styles.verseRef}>
          {verse.surahNumber}:{verse.verseNumber}
        </Text>
      </View>
    </View>
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarkedVerses, toggleBookmark, isLoaded } = useBookmarks();

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: topPadding, justifyContent: "center" },
        ]}
      >
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mémorisation</Text>
        <Text style={styles.subtitle}>
          {bookmarkedVerses.length} verset
          {bookmarkedVerses.length !== 1 ? "s" : ""} marqué
          {bookmarkedVerses.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={bookmarkedVerses}
        keyExtractor={(v) => `${v.surahNumber}:${v.verseNumber}`}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BookmarkedCard
            verse={item}
            onRemove={() =>
              toggleBookmark(item.surahNumber, item.verseNumber)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun verset marqué</Text>
            <Text style={styles.emptyDesc}>
              Consultez le Coran et appuyez sur{" "}
              <Ionicons name="bookmark-outline" size={13} color={Colors.textSecondary} />{" "}
              pour ajouter des versets à mémoriser.
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
    paddingBottom: Platform.OS === "web" ? 34 : 120,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  refBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  refText: {
    color: Colors.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  arabicText: {
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: "right",
    lineHeight: 40,
    fontFamily: "Inter_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  surahLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  verseRef: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
    lineHeight: 22,
  },
});
