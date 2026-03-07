import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TajweedRule, TajweedRuleInfo, TAJWEED_RULES, getActiveTajweedRules, TajweedSegment } from "@/utils/tajweed";
import { useSettings } from "@/contexts/SettingsContext";

interface TajweedPopupProps {
  rule: TajweedRule | null;
  word: string;
  visible: boolean;
  onClose: () => void;
}

export function TajweedPopup({ rule, word, visible, onClose }: TajweedPopupProps) {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== "web";
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: useNative, tension: 65, friction: 10 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: useNative }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: useNative }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: useNative }),
      ]).start();
    }
  }, [visible]);

  if (!rule) return null;
  const info: TajweedRuleInfo = TAJWEED_RULES[rule];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.topRow}>
          <View style={[styles.ruleBadge, { backgroundColor: info.color + "22", borderColor: info.color + "66" }]}>
            <View style={[styles.ruleDot, { backgroundColor: info.color }]} />
            <Text style={[styles.ruleLabel, { color: info.color }]}>{info.shortLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.wordDisplay, { color: info.color, borderColor: info.color + "33", backgroundColor: info.color + "10" }]}>
          {word.trim()}
        </Text>

        <Text style={[styles.fullRuleLabel, { color: colors.textPrimary }]}>{info.label}</Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Section icon="book-outline" title="التعريف" color={info.color} textColor={colors.textSecondary}>
            {info.description}
          </Section>

          <Section icon="mic-outline" title="طريقة النطق" color={info.color} textColor={colors.textSecondary}>
            {info.howTo}
          </Section>

          <View style={[styles.exampleBox, { backgroundColor: colors.bgSurface, borderColor: info.color + "30" }]}>
            <Text style={[styles.exampleLabel, { color: colors.textMuted }]}>مثال</Text>
            <Text style={[styles.exampleText, { color: colors.textPrimary }]}>{info.example}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Section({
  icon, title, color, textColor, children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  color: string;
  textColor: string;
  children: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <Text style={[styles.sectionBody, { color: textColor }]}>{children}</Text>
    </View>
  );
}

interface TajweedLegendProps {
  segments: TajweedSegment[];
}

export function TajweedLegend({ segments }: TajweedLegendProps) {
  const { colors } = useSettings();
  const rules = getActiveTajweedRules(segments);
  if (rules.length === 0) return null;

  return (
    <View style={[legendStyles.container, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
      <Text style={[legendStyles.header, { color: colors.textMuted }]}>أحكام التجويد في هذه الآية</Text>
      <View style={legendStyles.chips}>
        {rules.map((rule) => {
          const info = TAJWEED_RULES[rule];
          return (
            <View key={rule} style={[legendStyles.chip, { backgroundColor: info.color + "18", borderColor: info.color + "50" }]}>
              <View style={[legendStyles.chipDot, { backgroundColor: info.color }]} />
              <Text style={[legendStyles.chipLabel, { color: info.color }]}>{info.shortLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "75%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  topRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  ruleBadge: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, gap: 6,
  },
  ruleDot: { width: 8, height: 8, borderRadius: 4 },
  ruleLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  wordDisplay: {
    fontSize: 36,
    textAlign: "center",
    lineHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fullRuleLabel: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  divider: { height: 1, marginBottom: 16 },
  scroll: { flex: 1 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "right" },
  sectionBody: { fontSize: 15, textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" },
  exampleBox: {
    borderRadius: 12, padding: 14, borderWidth: 1,
    marginBottom: 20, gap: 6,
  },
  exampleLabel: { fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "right" },
  exampleText: { fontSize: 20, textAlign: "right", lineHeight: 36 },
});

const legendStyles = StyleSheet.create({
  container: {
    borderRadius: 10, borderWidth: 1, padding: 10,
    marginTop: 10, gap: 8,
  },
  header: { fontFamily: "Inter_500Medium", fontSize: 10, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
