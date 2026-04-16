import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useMastery } from "@/contexts/MasteryContext";
import * as FileSystem from "expo-file-system/legacy";
import {
  ThemeName, ArabicFontName, AccentColorName, LineSpacingName,
  PlaybackRate, RepeatMode,
  ACCENT_COLORS, RECITERS_LIST,
} from "@/constants/themes";
import { exportUserData, importUserData } from "@/utils/dataManager";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type SettingsTab = "المظهر" | "النص" | "التلاوة" | "القراءة" | "البيانات";

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const {
    theme, arabicFont, accentColor, lineSpacing,
    hideVerseNumbers, showVerseOfDay, highlightActiveVerse,
    reciterId, playbackRate, repeatMode, showTajweed, continuousPlay, qiraa,
    notifEnabled, notifHour, notifMinute,
    arabicFontSize, setArabicFontSize,
    setTheme, setArabicFont, setAccentColor, setLineSpacing,
    setHideVerseNumbers, setShowVerseOfDay, setHighlightActiveVerse,
    setReciterId, setPlaybackRate, setRepeatMode, setShowTajweed, setContinuousPlay, setQiraa,
    setNotifEnabled, setNotifHour, setNotifMinute,
    autoNightMode, setAutoNightMode,
    colors, arabicFontFamily,
    reloadFromStorage: reloadSettings,
  } = useSettings();
  const { reloadFromStorage: reloadBookmarks } = useBookmarks();
  const { reloadFromStorage: reloadMastery } = useMastery();

  const MIN_FONT_SIZE = 18;
  const MAX_FONT_SIZE = 48;
  const FONT_STEP = 2;
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors);

  const [activeTab, setActiveTab] = useState<SettingsTab>("المظهر");
  const [reciterPickerVisible, setReciterPickerVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const tabs: SettingsTab[] = ["المظهر", "النص", "التلاوة", "القراءة", "البيانات"];

  const themes: { key: ThemeName; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "dark",   label: "ليلي",    icon: "moon" },
    { key: "light",  label: "نهاري",   icon: "sunny" },
    { key: "sepia",  label: "عتيق",    icon: "leaf-outline" },
    { key: "violet", label: "أبيض",  icon: "contrast-outline" },
  ];

  const fonts: { key: ArabicFontName; sample: string; label: string; fontFamily?: string; sizeMultiplier?: number }[] = [
    { key: "system",        sample: "بِسْمِ ٱللَّهِ", label: "افتراضي",     fontFamily: undefined },
    { key: "naskh",         sample: "بِسْمِ ٱللَّهِ", label: "نسخ",         fontFamily: "NotoNaskhArabic_400Regular" },
    { key: "amiriquran",    sample: "بِسْمِ ٱللَّهِ", label: "أميري قرآن",  fontFamily: "AmiriQuran_400Regular" },
    { key: "scheherazade",  sample: "بِسْمِ ٱللَّهِ", label: "شهرزاد",      fontFamily: "ScheherazadeNew_400Regular" },
    { key: "lateef",        sample: "بِسْمِ ٱللَّهِ", label: "لطيف",        fontFamily: "Lateef_400Regular", sizeMultiplier: 1.2 },
  ];

  const spacings: { key: LineSpacingName; label: string }[] = [
    { key: "serré",  label: "ضيق" },
    { key: "normal", label: "عادي" },
    { key: "aéré",   label: "واسع" },
  ];

  const accentKeys = Object.keys(ACCENT_COLORS) as AccentColorName[];
  const rates: PlaybackRate[] = [0.75, 1.0, 1.25];
  const repeats: { value: RepeatMode; label: string }[] = [
    { value: 0,  label: "—" },
    { value: 3,  label: "×3" },
    { value: 5,  label: "×5" },
    { value: 10, label: "×10" },
  ];

  const activeReciter = RECITERS_LIST.find((r) => r.id === reciterId);

  const [cacheSize, setCacheSize] = useState<string>("0 MB");

  React.useEffect(() => {
    updateCacheSize();
  }, []);

  const updateCacheSize = async () => {
    if (Platform.OS === "web") { setCacheSize("0 MB"); return; }
    try {
      const dir = FileSystem.cacheDirectory + "audio/";
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) { setCacheSize("0 MB"); return; }
      const files = await FileSystem.readDirectoryAsync(dir);
      let totalSize = 0;
      for (const file of files) {
        const fInfo = await FileSystem.getInfoAsync(dir + file);
        if (fInfo.exists && (fInfo as any).size) {
          totalSize += (fInfo as any).size;
        }
      }
      setCacheSize((totalSize / (1024 * 1024)).toFixed(1) + " MB");
    } catch {
      setCacheSize("0 MB");
    }
  };

  const clearCache = async () => {
    if (Platform.OS === "web") return;
    try {
      const dir = FileSystem.cacheDirectory + "audio/";
      await FileSystem.deleteAsync(dir, { idempotent: true });
      updateCacheSize();
    } catch {}
  };

  const handleExport = async () => {
    setDataStatus(null);
    setExportLoading(true);
    try {
      await exportUserData();
      setDataStatus({ type: "success", msg: "تم تصدير البيانات بنجاح" });
    } catch {
      setDataStatus({ type: "error", msg: "فشل التصدير، حاول مجدداً" });
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    setDataStatus(null);
    setImportLoading(true);
    try {
      const reloadAll = async () => {
        await Promise.all([reloadSettings(), reloadBookmarks(), reloadMastery()]);
      };
      const result = await importUserData(reloadAll);
      if (result.success) {
        setDataStatus({ type: "success", msg: "تم استيراد البيانات بنجاح" });
      } else if (result.error === "cancelled") {
        setDataStatus(null);
      } else if (result.error === "invalid_format") {
        setDataStatus({ type: "error", msg: "الملف غير صالح أو تالف" });
      } else if (result.error === "no_data") {
        setDataStatus({ type: "error", msg: "لم يتم العثور على بيانات في الملف" });
      } else {
        setDataStatus({ type: "error", msg: "حدث خطأ أثناء الاستيراد" });
      }
    } catch {
      setDataStatus({ type: "error", msg: "حدث خطأ أثناء الاستيراد" });
    } finally {
      setImportLoading(false);
    }
  };

  const hourDisplay = String(notifHour).padStart(2, "0");
  const minDisplay = String(notifMinute).padStart(2, "0");

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

        <View style={s.tabBar}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[s.tabBtn, activeTab === tab && { borderBottomColor: colors.gold, borderBottomWidth: 2 }]}
            >
              <Text style={[s.tabLabel, { color: activeTab === tab ? colors.gold : colors.textMuted }]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {activeTab === "المظهر" && (
            <>
              <Text style={s.sectionTitle}>الثيم</Text>
              <View style={s.themeGrid}>
                {themes.map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setTheme(t.key)}
                    disabled={autoNightMode}
                    style={[
                      s.themeBtn,
                      theme === t.key && s.themeBtnActive,
                      autoNightMode && { opacity: 0.5 }
                    ]}
                  >
                    <Ionicons name={t.icon} size={20} color={theme === t.key ? colors.bgDark : colors.textSecondary} />
                    <Text style={[s.optionLabel, theme === t.key && s.optionLabelActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={s.toggleGroup}>
                <View style={s.toggleRow}>
                  <Switch
                    value={autoNightMode}
                    onValueChange={setAutoNightMode}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={autoNightMode ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>تبديل تلقائي حسب النظام</Text>
                </View>
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

              <Text style={s.sectionTitle}>معاينة</Text>
              <View style={s.preview}>
                <Text style={[s.previewText, arabicFontFamily ? { fontFamily: arabicFontFamily } : {}]}>
                  آلِ عِمۡرَانَ — ٱلْحَمْدُ لِلَّهِ
                </Text>
              </View>
            </>
          )}

          {activeTab === "النص" && (
            <>
              <Text style={s.sectionTitle}>الخط العربي</Text>
              <View style={s.fontOptionCol}>
                {fonts.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setArabicFont(f.key)}
                    style={[s.fontBtn, arabicFont === f.key && s.fontBtnActive]}
                  >
                    <View style={s.fontBtnInner}>
                      <Text style={[s.fontSample, f.fontFamily ? { fontFamily: f.fontFamily } : {}, f.sizeMultiplier ? { fontSize: 20 * f.sizeMultiplier } : {}, arabicFont === f.key && { color: colors.gold }]}>
                        {f.sample}
                      </Text>
                      <Text style={[s.fontLabel, arabicFont === f.key && { color: colors.gold }]}>{f.label}</Text>
                    </View>
                    {arabicFont === f.key && <Ionicons name="checkmark-circle" size={20} color={colors.gold} />}
                  </Pressable>
                ))}
              </View>

              <Text style={s.sectionTitle}>حجم الخط</Text>
              <View style={s.fontSizeRow}>
                <Pressable
                  onPress={() => setArabicFontSize(Math.max(MIN_FONT_SIZE, arabicFontSize - FONT_STEP))}
                  style={[s.fontSizeBtn, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
                  disabled={arabicFontSize <= MIN_FONT_SIZE}
                >
                  <Text style={[s.fontSizeBtnText, { color: arabicFontSize <= MIN_FONT_SIZE ? colors.textMuted : colors.textPrimary }]}>−</Text>
                </Pressable>
                <View style={[s.fontSizeDisplay, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
                  <Text style={[s.fontSizeValue, { color: colors.gold, fontFamily: arabicFontFamily ?? undefined }]}>
                    بِسْمِ
                  </Text>
                  <Text style={[s.fontSizeNumber, { color: colors.textSecondary }]}>{arabicFontSize}</Text>
                </View>
                <Pressable
                  onPress={() => setArabicFontSize(Math.min(MAX_FONT_SIZE, arabicFontSize + FONT_STEP))}
                  style={[s.fontSizeBtn, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
                  disabled={arabicFontSize >= MAX_FONT_SIZE}
                >
                  <Text style={[s.fontSizeBtnText, { color: arabicFontSize >= MAX_FONT_SIZE ? colors.textMuted : colors.textPrimary }]}>+</Text>
                </Pressable>
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

              <Text style={s.sectionTitle}>معاينة الخط</Text>
              <View style={s.preview}>
                <Text style={[s.previewText, arabicFontFamily ? { fontFamily: arabicFontFamily } : {}]}>
                  ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
                </Text>
              </View>
            </>
          )}

          {activeTab === "التلاوة" && (
            <>
              <Text style={s.sectionTitle}>الإمام</Text>
              <Pressable
                onPress={() => setReciterPickerVisible(true)}
                style={[s.reciterPickerRow, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-back-outline" size={18} color={colors.textMuted} />
                <Text style={[s.reciterPickerLabel, { color: colors.textPrimary }]}>
                  {activeReciter?.labelAr ?? "اختر الإمام"}
                </Text>
              </Pressable>

              <Text style={s.sectionTitle}>رواية القراءة</Text>
              <View style={s.optionRow}>
                <Pressable
                  onPress={() => setQiraa("hafs")}
                  style={[s.optionBtn, qiraa === "hafs" && s.optionBtnActive, { flex: 1 }]}
                >
                  <Text style={[s.optionLabel, qiraa === "hafs" && s.optionLabelActive]}>حفص</Text>
                </Pressable>
                <Pressable
                  onPress={() => setQiraa("qaloon")}
                  style={[s.optionBtn, qiraa === "qaloon" && s.optionBtnActive, { flex: 1 }]}
                >
                  <Text style={[s.optionLabel, qiraa === "qaloon" && s.optionLabelActive]}>قالون</Text>
                </Pressable>
              </View>

              <Text style={s.sectionTitle}>سرعة التلاوة</Text>
              <View style={s.optionRow}>
                {rates.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setPlaybackRate(r)}
                    style={[s.optionBtn, playbackRate === r && s.optionBtnActive, { flex: 1 }]}
                  >
                    <Text style={[s.optionLabel, playbackRate === r && s.optionLabelActive]}>×{r}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.sectionTitle}>تكرار الآية</Text>
              <View style={s.optionRow}>
                {repeats.map(({ value, label }) => (
                  <Pressable
                    key={value}
                    onPress={() => setRepeatMode(value)}
                    style={[s.optionBtn, repeatMode === value && s.optionBtnActive, { flex: 1, paddingHorizontal: 6 }]}
                  >
                    <Text style={[s.optionLabel, repeatMode === value && s.optionLabelActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={s.toggleGroup}>
                <View style={s.toggleRow}>
                  <Switch
                    value={continuousPlay}
                    onValueChange={setContinuousPlay}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={continuousPlay ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>تشغيل متواصل بين الآيات</Text>
                </View>
              </View>

              <Text style={s.sectionTitle}>التذكير اليومي</Text>
              <View style={s.toggleGroup}>
                <View style={s.toggleRow}>
                  <Switch
                    value={notifEnabled}
                    onValueChange={setNotifEnabled}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={notifEnabled ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>إشعار يومي بآية</Text>
                </View>
                {notifEnabled && (
                  <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={s.timeStepper}>
                      <Pressable onPress={() => setNotifMinute((notifMinute + 5) % 60)} style={s.stepperBtn} hitSlop={8}>
                        <Ionicons name="chevron-up" size={16} color={colors.gold} />
                      </Pressable>
                      <Text style={[s.stepperVal, { color: colors.textPrimary }]}>{minDisplay}</Text>
                      <Pressable onPress={() => setNotifMinute(notifMinute === 0 ? 55 : notifMinute - 5)} style={s.stepperBtn} hitSlop={8}>
                        <Ionicons name="chevron-down" size={16} color={colors.gold} />
                      </Pressable>
                    </View>
                    <Text style={[s.timeSep, { color: colors.textSecondary }]}>:</Text>
                    <View style={s.timeStepper}>
                      <Pressable onPress={() => setNotifHour((notifHour + 1) % 24)} style={s.stepperBtn} hitSlop={8}>
                        <Ionicons name="chevron-up" size={16} color={colors.gold} />
                      </Pressable>
                      <Text style={[s.stepperVal, { color: colors.textPrimary }]}>{hourDisplay}</Text>
                      <Pressable onPress={() => setNotifHour(notifHour === 0 ? 23 : notifHour - 1)} style={s.stepperBtn} hitSlop={8}>
                        <Ionicons name="chevron-down" size={16} color={colors.gold} />
                      </Pressable>
                    </View>
                    <Text style={[s.toggleLabel, { color: colors.textSecondary, flex: 1 }]}>وقت الإشعار</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === "القراءة" && (
            <>
              <View style={s.toggleGroup}>
                <View style={s.toggleRow}>
                  <Switch
                    value={showTajweed}
                    onValueChange={setShowTajweed}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={showTajweed ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>ألوان التجويد</Text>
                </View>
                <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Switch
                    value={hideVerseNumbers}
                    onValueChange={setHideVerseNumbers}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={hideVerseNumbers ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>إخفاء أرقام الآيات</Text>
                </View>
                <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Switch
                    value={highlightActiveVerse}
                    onValueChange={setHighlightActiveVerse}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={highlightActiveVerse ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>تمييز الآية النشطة</Text>
                </View>
                <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Switch
                    value={showVerseOfDay}
                    onValueChange={setShowVerseOfDay}
                    trackColor={{ false: colors.bgDark, true: colors.gold + "80" }}
                    thumbColor={showVerseOfDay ? colors.gold : colors.textMuted}
                  />
                  <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>آية اليوم في الرئيسية</Text>
                </View>
              </View>

              <Text style={s.sectionTitle}>التخزين</Text>
              <View style={[s.toggleGroup, { padding: 16 }]}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>المساحة المستخدمة</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "right" }}>{cacheSize}</Text>
                  </View>
                  <Pressable
                    onPress={clearCache}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: colors.error + "15",
                    }}
                  >
                    <Text style={{ color: colors.error, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>مسح الكاش</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {activeTab === "البيانات" && (
            <>
              <Text style={s.sectionTitle}>النسخ الاحتياطي</Text>
              <View style={[s.toggleGroup, { padding: 16, gap: 12 }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "right", fontFamily: "Inter_400Regular", lineHeight: 20 }}>
                  يمكنك تصدير جميع بياناتك (الآيات المحفوظة، مستوى الحفظ، الإعدادات) كملف JSON لنقلها أو حفظها.
                </Text>

                <Pressable
                  onPress={handleExport}
                  disabled={exportLoading || importLoading}
                  style={[
                    dataActionBtn,
                    { backgroundColor: colors.gold + "18", borderColor: colors.gold + "40" },
                    (exportLoading || importLoading) && { opacity: 0.6 },
                  ]}
                >
                  {exportLoading ? (
                    <ActivityIndicator size="small" color={colors.gold} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color={colors.gold} />
                  )}
                  <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                    تصدير البيانات
                  </Text>
                </Pressable>
              </View>

              <Text style={s.sectionTitle}>استيراد البيانات</Text>
              <View style={[s.toggleGroup, { padding: 16, gap: 12 }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "right", fontFamily: "Inter_400Regular", lineHeight: 20 }}>
                  استيراد نسخة احتياطية سابقة. سيتم استبدال البيانات الحالية بالكامل.
                </Text>

                <Pressable
                  onPress={handleImport}
                  disabled={exportLoading || importLoading}
                  style={[
                    dataActionBtn,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                    (exportLoading || importLoading) && { opacity: 0.6 },
                  ]}
                >
                  {importLoading ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.textPrimary} />
                  )}
                  <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                    استيراد من ملف
                  </Text>
                </Pressable>

                {dataStatus && (
                  <View style={[
                    dataStatusBox,
                    {
                      backgroundColor: dataStatus.type === "success"
                        ? colors.gold + "15"
                        : colors.error + "15",
                      borderColor: dataStatus.type === "success"
                        ? colors.gold + "40"
                        : colors.error + "40",
                    }
                  ]}>
                    <Ionicons
                      name={dataStatus.type === "success" ? "checkmark-circle-outline" : "alert-circle-outline"}
                      size={18}
                      color={dataStatus.type === "success" ? colors.gold : colors.error}
                    />
                    <Text style={{
                      color: dataStatus.type === "success" ? colors.gold : colors.error,
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      flex: 1,
                      textAlign: "right",
                    }}>
                      {dataStatus.msg}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      <Modal
        visible={reciterPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReciterPickerVisible(false)}
      >
        <Pressable style={s.overlay} onPress={() => setReciterPickerVisible(false)} />
        <View style={[s.subSheet, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
          <View style={s.handle} />
          <View style={s.subHeaderRow}>
            <Pressable onPress={() => setReciterPickerVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
            <Text style={[s.subTitle, { color: colors.textPrimary }]}>اختر الإمام</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {RECITERS_LIST.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => { setReciterId(r.id); setReciterPickerVisible(false); }}
                style={[s.reciterItem, { borderColor: colors.border }, reciterId === r.id && { backgroundColor: colors.gold + "12", borderColor: colors.gold + "40" }]}
              >
                <View style={{ flexDirection: "column", alignItems: "flex-end", flex: 1, gap: 2 }}>
                  <Text style={[s.reciterItemLabel, { color: reciterId === r.id ? colors.gold : colors.textPrimary }]}>
                    {r.labelAr}
                  </Text>
                  {r.surahUrl && (
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "right" }}>
                      ◉ تلاوة سورة كاملة
                    </Text>
                  )}
                </View>
                {reciterId === r.id && <Ionicons name="checkmark-circle" size={20} color={colors.gold} style={{ marginLeft: 8 }} />}
              </Pressable>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </Modal>
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
      maxHeight: "92%",
      borderTopWidth: 1,
      borderColor: colors.border,
      flex: 1,
    },
    subSheet: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      maxHeight: "70%",
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center", marginBottom: 12,
    },
    headerRow: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 16,
    },
    title: { fontSize: 20, color: colors.textPrimary, fontFamily: "Inter_700Bold" },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 16,
    },
    tabBtn: {
      flex: 1, alignItems: "center", paddingVertical: 10,
      borderBottomColor: "transparent", borderBottomWidth: 2,
    },
    tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "right" },
    sectionTitle: {
      fontSize: 11, color: colors.textMuted, fontFamily: "Inter_500Medium",
      textAlign: "right", marginBottom: 10, marginTop: 4,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    themeGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20, justifyContent: "flex-end",
    },
    themeBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.bgSurface,
      minWidth: "46%",
    },
    themeBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    optionRow: { flexDirection: "row", gap: 8, marginBottom: 20, justifyContent: "flex-end" },
    optionBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      paddingHorizontal: 14, paddingVertical: 11,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.bgSurface,
    },
    optionBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    optionLabel: { color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "right" },
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
    fontSizeRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    fontSizeBtn: {
      width: 46, height: 46, borderRadius: 12,
      borderWidth: 1, alignItems: "center", justifyContent: "center",
    },
    fontSizeBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
    fontSizeDisplay: {
      flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
      flexDirection: "row-reverse", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 14,
    },
    fontSizeValue: { fontSize: 20 },
    fontSizeNumber: { fontSize: 13, fontFamily: "Inter_500Medium" },
    reciterPickerRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
      borderWidth: 1, marginBottom: 20,
    },
    reciterPickerLabel: { fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "right" },
    toggleGroup: {
      backgroundColor: colors.bgSurface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 20, overflow: "hidden",
    },
    toggleRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    toggleLabel: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "right", flex: 1 },
    timeStepper: {
      alignItems: "center", gap: 2,
    },
    stepperBtn: {
      width: 28, height: 22, alignItems: "center", justifyContent: "center",
    },
    stepperVal: {
      fontFamily: "Inter_700Bold", fontSize: 18, minWidth: 28, textAlign: "center",
    },
    timeSep: {
      fontFamily: "Inter_700Bold", fontSize: 22,
      marginHorizontal: 4,
    },
    preview: {
      backgroundColor: colors.bgSurface, borderRadius: 14, padding: 20,
      alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.border,
    },
    previewText: {
      fontSize: 24, color: colors.textPrimary, textAlign: "center", lineHeight: 44,
    },
    subHeaderRow: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 16,
    },
    subTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
    reciterItem: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 16,
      borderRadius: 12, borderWidth: 1,
      marginBottom: 8,
      backgroundColor: colors.bgSurface,
    },
    reciterItemLabel: { fontSize: 16 },
  });
}

const dataActionBtn: import("react-native").ViewStyle = {
  flexDirection: "row-reverse",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
};

const dataStatusBox: import("react-native").ViewStyle = {
  flexDirection: "row-reverse",
  alignItems: "center",
  gap: 8,
  padding: 12,
  borderRadius: 10,
  borderWidth: 1,
};
