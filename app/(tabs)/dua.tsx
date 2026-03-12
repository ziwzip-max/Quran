import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, Pressable, TextInput, Modal,
  ScrollView, Alert, Platform, StyleSheet, KeyboardAvoidingView, Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/contexts/SettingsContext";
import { BUILT_IN_DUAS, DUA_CATEGORIES, Dua, DuaCategory } from "@/constants/duaaData";

const CUSTOM_DUAS_KEY = "al_hifz_dua_custom";
const FAVORITES_KEY = "al_hifz_dua_favorites";

function DuaCard({
  dua, colors, arabicFont, onDelete, isCustom, isFavorite, onToggleFavorite,
}: {
  dua: Dua;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
  onDelete?: () => void;
  isCustom: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const copyToClipboard = useCallback(() => {
    Clipboard.setString(dua.arabic);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("", "تم نسخ الدعاء");
  }, [dua.arabic]);

  return (
    <Pressable
      onPress={() => setExpanded((e) => !e)}
      onLongPress={copyToClipboard}
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Pressable onPress={() => { onToggleFavorite(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} hitSlop={10}>
            <Ionicons name={isFavorite ? "star" : "star-outline"} size={20} color={isFavorite ? colors.gold : colors.textMuted} />
          </Pressable>
          {isCustom && onDelete && (
            <Pressable onPress={onDelete} hitSlop={10}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {dua.source ? (
            <View style={[styles.sourceBadge, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>{dua.source}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardHeaderRight}>
          {isCustom && (
            <View style={[styles.customBadge, { backgroundColor: colors.gold + "25", borderColor: colors.gold + "60" }]}>
              <Text style={[styles.customBadgeText, { color: colors.gold }]}>مضاف</Text>
            </View>
          )}
          <Text style={[styles.cardTitle, { color: colors.gold }]}>{dua.title}</Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardArabic,
          { color: colors.textPrimary },
          arabicFont ? { fontFamily: arabicFont } : {},
        ]}
        numberOfLines={expanded ? undefined : 2}
      >
        {dua.arabic}
      </Text>

      {!expanded && (
        <Text style={[styles.expandHint, { color: colors.textMuted }]}>اضغط لعرض الكامل</Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.copyHint, { color: colors.textMuted }]}>اضغط مطولاً للنسخ</Text>
        <View style={[styles.categoryBadge, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>{dua.category}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function AddDuaModal({
  visible, onClose, onSave, colors, arabicFont,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (dua: Dua) => void;
  colors: ReturnType<typeof useSettings>["colors"];
  arabicFont: string | undefined;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [arabic, setArabic] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState<DuaCategory>("الكرب");

  const reset = () => {
    setTitle("");
    setArabic("");
    setSource("");
    setCategory("الكرب");
  };

  const handleSave = () => {
    if (!title.trim() || !arabic.trim()) {
      Alert.alert("", "يرجى إدخال الاسم والنص");
      return;
    }
    const newDua: Dua = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      arabic: arabic.trim(),
      source: source.trim() || undefined,
      category,
    };
    onSave(newDua);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.bgDark }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => { reset(); onClose(); }} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>إضافة دعاء</Text>
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.gold }]}
          >
            <Text style={[styles.saveBtnText, { color: colors.bgDark }]}>حفظ</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.inputGroup, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>الاسم *</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="اسم الدعاء"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>النص *</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textInputMulti,
                { color: colors.textPrimary },
                arabicFont ? { fontFamily: arabicFont } : {},
              ]}
              placeholder="النص بالعربية"
              placeholderTextColor={colors.textMuted}
              value={arabic}
              onChangeText={setArabic}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>المصدر (اختياري)</Text>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="مثال: صحيح البخاري"
              placeholderTextColor={colors.textMuted}
              value={source}
              onChangeText={setSource}
              textAlign="right"
            />
          </View>

          <View>
            <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 10 }]}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 8 }}>
              {DUA_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: category === cat ? colors.gold : colors.bgCard,
                      borderColor: category === cat ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.catChipText, { color: category === cat ? colors.bgDark : colors.textSecondary }]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function DuaScreen() {
  const insets = useSafeAreaInsets();
  const { colors, arabicFontFamily } = useSettings();
  const [customDuas, setCustomDuas] = useState<Dua[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<DuaCategory | "الكل">("الكل");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(CUSTOM_DUAS_KEY).then((stored) => {
      if (stored) setCustomDuas(JSON.parse(stored));
    });
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) {
        try { setFavoriteIds(new Set(JSON.parse(stored))); } catch {}
      }
    });
  }, []));

  const toggleFavorite = useCallback(async (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleSaveCustomDua = useCallback(async (dua: Dua) => {
    const updated = [dua, ...customDuas];
    setCustomDuas(updated);
    await AsyncStorage.setItem(CUSTOM_DUAS_KEY, JSON.stringify(updated));
  }, [customDuas]);

  const handleDeleteCustomDua = useCallback(async (id: string) => {
    const updated = customDuas.filter((d) => d.id !== id);
    setCustomDuas(updated);
    await AsyncStorage.setItem(CUSTOM_DUAS_KEY, JSON.stringify(updated));
  }, [customDuas]);

  const allDuas = useMemo(() => [...customDuas, ...BUILT_IN_DUAS], [customDuas]);

  const filtered = useMemo(() => {
    let list = allDuas;
    if (selectedCategory !== "الكل") list = list.filter((d) => d.category === selectedCategory);
    if (showFavoritesOnly) list = list.filter((d) => favoriteIds.has(d.id));
    return list;
  }, [allDuas, selectedCategory, showFavoritesOnly, favoriteIds]);

  const countByCat = useMemo(() => {
    const map: Record<string, number> = { "الكل": allDuas.length };
    for (const cat of DUA_CATEGORIES) {
      map[cat] = allDuas.filter((d) => d.category === cat).length;
    }
    return map;
  }, [allDuas]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark, paddingTop: topPadding }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setAddModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "60" }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color={colors.gold} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>الأدعية</Text>
      </View>

      <View style={styles.favFilterRow}>
        <Pressable
          onPress={() => { setShowFavoritesOnly(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[
            styles.favFilterChip,
            {
              backgroundColor: !showFavoritesOnly ? colors.gold + "20" : colors.bgSurface,
              borderColor: !showFavoritesOnly ? colors.gold : colors.border,
            },
          ]}
        >
          <Text style={[styles.favFilterText, { color: !showFavoritesOnly ? colors.gold : colors.textMuted }]}>الكل</Text>
        </Pressable>
        <Pressable
          onPress={() => { setShowFavoritesOnly(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[
            styles.favFilterChip,
            {
              backgroundColor: showFavoritesOnly ? colors.gold + "20" : colors.bgSurface,
              borderColor: showFavoritesOnly ? colors.gold : colors.border,
              flexDirection: "row",
              gap: 4,
            },
          ]}
        >
          <Ionicons name="star" size={13} color={showFavoritesOnly ? colors.gold : colors.textMuted} />
          <Text style={[styles.favFilterText, { color: showFavoritesOnly ? colors.gold : colors.textMuted }]}>المفضلة</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryModalVisible(true); }}
        style={[styles.categoryDropdown, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        <View style={styles.categoryDropdownLeft}>
          <View style={[styles.categoryDot, { backgroundColor: colors.gold }]} />
          <Text style={[styles.categoryDropdownText, { color: colors.textPrimary }]}>{selectedCategory}</Text>
          <Text style={[styles.categoryDropdownCount, { color: colors.textMuted }]}>({filtered.length})</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <View style={[styles.categoryPickerSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.categoryPickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.categoryPickerTitle, { color: colors.textPrimary }]}>اختر الفئة</Text>
              <Pressable onPress={() => setCategoryModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryPickerList}>
              {(["الكل", ...DUA_CATEGORIES] as (DuaCategory | "الكل")[]).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => { setSelectedCategory(cat); setCategoryModalVisible(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.categoryPickerRow,
                    { borderBottomColor: colors.border },
                    selectedCategory === cat && { backgroundColor: colors.gold + "15" },
                  ]}
                >
                  <Text style={[styles.categoryPickerCount, { color: colors.textMuted }]}>{countByCat[cat] ?? 0}</Text>
                  <Text style={[styles.categoryPickerLabel, { color: selectedCategory === cat ? colors.gold : colors.textPrimary }]}>{cat}</Text>
                  {selectedCategory === cat && <Ionicons name="checkmark" size={16} color={colors.gold} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <DuaCard
            dua={item}
            colors={colors}
            arabicFont={arabicFontFamily}
            isCustom={item.id.startsWith("custom_")}
            onDelete={item.id.startsWith("custom_") ? () => handleDeleteCustomDua(item.id) : undefined}
            isFavorite={favoriteIds.has(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={showFavoritesOnly ? "star-outline" : "hand-left-outline"} size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {showFavoritesOnly ? "لم تضف أدعية مفضلة بعد\nاضغط على ★ لإضافة دعاء للمفضلة" : "لا توجد أدعية في هذه الفئة"}
            </Text>
          </View>
        }
      />

      <AddDuaModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveCustomDua}
        colors={colors}
        arabicFont={arabicFontFamily}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  addBtn: {
    position: "absolute",
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  favFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  favFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  favFilterText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  categoryDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryDropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryDropdownText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  categoryDropdownCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  categoryPickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: "70%",
  },
  categoryPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryPickerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  categoryPickerList: {
    paddingBottom: 34,
  },
  categoryPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryPickerLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  categoryPickerCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    minWidth: 30,
    textAlign: "left",
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  listContent: {
    padding: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardHeaderRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: 6,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    justifyContent: "flex-end",
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "right",
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  customBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  cardArabic: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: "right",
  },
  expandHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  copyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
  },
  inputGroup: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
  },
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "right",
    minHeight: 36,
  },
  textInputMulti: {
    minHeight: 120,
    lineHeight: 32,
    fontSize: 18,
  },
});
