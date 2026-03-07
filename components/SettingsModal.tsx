import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/contexts/SettingsContext";
import { ThemeName, ArabicFontName, AccentColorName, LineSpacingName, ACCENT_COLORS } from "@/constants/themes";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const {
    theme, arabicFont, accentColor, lineSpacing,
    hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
    setTheme, setArabicFont, setAccentColor, setLineSpacing,
    setHideVerseNumbers, setShowVerseOfDay, setHighlightActiveVerse,
    colors, arabicFontFamily,
  } = useSettings();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors);

  const themes: { key: ThemeName; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "dark", label: "سكوري", icon: "moon" },
    { key: "light", label: "فاتح", icon: "sunny" },
  ];

  const fonts: { key: ArabicFontName; sample: string; label: string }[] = [
    { key: "system", sample: "بِسْمِ اللَّهِ", label: "افتراضي" },
    { key: "naskh", sample: "بِسْمِ اللَّهِ", label: "نسخ" },
    { key: "amiri", sample: "بِسْمِ اللَّهِ", label: "أميري" },
  ];

  const spacings: { key: LineSpacingName; label: string }[] = [
    { key: "serré", label: "ضيق" },
    { key: "normal", label: "عادي" },
    { key: "aéré", label: "واسع" },
  ];

  const accentKeys = Object.keys(ACCENT_COLORS) as AccentColorName[];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
        <View style={s.handle} />
        <View style={s.headerRow}>
          <Text style={s.title}>الإعدادات</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={s.sectionTitle}>المظهر</Text>
          <View style={s.optionRow}>
            {themes.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTheme(t.key)}
                style={[s.optionBtn, theme === t.key && s.optionBtnActive]}
              >
                <Ionicons name={t.icon} size={20} color={theme === t.key ? colors.bgDark : colors.textSecondary} />
                <Text style={[s.optionLabel, theme === t.key && s.optionLabelActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.sectionTitle}>لون التمييز</Text>
          <View style={s.accentRow}>
            {accentKeys.map((key) => {
              const accent = ACCENT_COLORS[key];
              const isActive = accentColor === key;
              return (
                <Pressable key={key} onPress={() => setAccentColor(key)} style={s.accentCircleWrap}>
                  <View style={[
                    s.accentCircle,
                    { backgroundColor: accent.primary },
                    isActive && { borderWidth: 3, borderColor: colors.textPrimary },
                  ]}>
                    {isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.sectionTitle}>الخط العربي</Text>
          <View style={s.fontOptionCol}>
            {fonts.map((f) => {
              const fontFamily =
                f.key === "naskh" ? "NotoNaskhArabic_400Regular"
                : f.key === "amiri" ? "Amiri_400Regular"
                : undefined;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setArabicFont(f.key)}
                  style={[s.fontBtn, arabicFont === f.key && s.fontBtnActive]}
                >
                  <View style={s.fontBtnInner}>
                    <Text style={[s.fontSample, fontFamily ? { fontFamily } : {}, arabicFont === f.key && { color: colors.gold }]}>
                      {f.sample}
                    </Text>
                    <Text style={[s.fontLabel, arabicFont === f.key && { color: colors.gold }]}>{f.label}</Text>
                  </View>
                  {arabicFont === f.key && <Ionicons name="checkmark-circle" size={20} color={colors.gold} />}
                </Pressable>
              );
            })}
          </View>

          <Text style={s.sectionTitle}>تباعد الأسطر</Text>
          <View style={s.optionRow}>
            {spacings.map((sp) => (
              <Pressable
                key={sp.key}
                onPress={() => setLineSpacing(sp.key)}
                style={[s.optionBtn, lineSpacing === sp.key && s.optionBtnActive, { flex: 1 }]}
              >
                <Text style={[s.optionLabel, lineSpacing === sp.key && s.optionLabelActive]}>{sp.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.sectionTitle}>معاينة</Text>
          <View style={s.preview}>
            <Text style={[s.previewText, arabicFontFamily ? { fontFamily: arabicFontFamily } : {}]}>
              ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
            </Text>
          </View>

          <Text style={s.sectionTitle}>خيارات القراءة</Text>
          <View style={s.toggleGroup}>
            <View style={s.toggleRow}>
              <Switch
                value={hideVerseNumbers}
                onValueChange={setHideVerseNumbers}
                trackColor={{ false: colors.bgSurface, true: colors.gold + "80" }}
                thumbColor={hideVerseNumbers ? colors.gold : colors.textMuted}
              />
              <Text style={s.toggleLabel}>إخفاء أرقام الآيات</Text>
            </View>
            <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Switch
                value={highlightActiveVerse}
                onValueChange={setHighlightActiveVerse}
                trackColor={{ false: colors.bgSurface, true: colors.gold + "80" }}
                thumbColor={highlightActiveVerse ? colors.gold : colors.textMuted}
              />
              <Text style={s.toggleLabel}>تمييز الآية النشطة</Text>
            </View>
            <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Switch
                value={showVerseOfDay}
                onValueChange={setShowVerseOfDay}
                trackColor={{ false: colors.bgSurface, true: colors.gold + "80" }}
                thumbColor={showVerseOfDay ? colors.gold : colors.textMuted}
              />
              <Text style={s.toggleLabel}>آية اليوم في الصفحة الرئيسية</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useSettings>["colors"]) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      maxHeight: "85%",
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center", marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 20,
    },
    title: { fontSize: 20, color: colors.textPrimary, fontFamily: "Inter_700Bold" },
    sectionTitle: {
      fontSize: 11, color: colors.textMuted, fontFamily: "Inter_500Medium",
      textAlign: "right", marginBottom: 10, marginTop: 4,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    optionRow: { flexDirection: "row", gap: 10, marginBottom: 20, justifyContent: "flex-end" },
    optionBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.bgSurface,
    },
    optionBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    optionLabel: { color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14 },
    optionLabelActive: { color: colors.bgDark, fontFamily: "Inter_700Bold" },
    accentRow: { flexDirection: "row", gap: 14, marginBottom: 20, justifyContent: "flex-end" },
    accentCircleWrap: { alignItems: "center", justifyContent: "center" },
    accentCircle: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: "center", justifyContent: "center",
    },
    fontOptionCol: { gap: 8, marginBottom: 20 },
    fontBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface,
    },
    fontBtnActive: { borderColor: colors.gold + "60", backgroundColor: colors.gold + "10" },
    fontBtnInner: { flexDirection: "row", alignItems: "center", gap: 14 },
    fontSample: { fontSize: 20, color: colors.textPrimary },
    fontLabel: { fontSize: 13, color: colors.textSecondary, fontFamily: "Inter_400Regular" },
    preview: {
      backgroundColor: colors.bgSurface, borderRadius: 14, padding: 20,
      alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.border,
    },
    previewText: {
      fontSize: 24, color: colors.textPrimary, textAlign: "center", lineHeight: 44,
    },
    toggleGroup: {
      backgroundColor: colors.bgSurface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 20, overflow: "hidden",
    },
    toggleRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 14,
    },
    toggleLabel: { color: colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "right" },
  });
}
