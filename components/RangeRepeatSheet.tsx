import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useAudio } from "@/contexts/AudioContext";

const TIMES = [1, 3, 5, 10, 0] as const; // 0 = until stopped
const PAUSES = [0, 3, 5, 10] as const;

/** Sheet to repeat a range of verses N times, with an optional pause to recite from memory. */
export function RangeRepeatSheet({
  visible,
  onClose,
  surahNum,
  verseCount,
  initialFrom,
}: {
  visible: boolean;
  onClose: () => void;
  surahNum: number;
  verseCount: number;
  initialFrom: number;
}) {
  const { colors } = useSettings();
  const { playRange, isSurahMode } = useAudio();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(Math.min(verseCount, initialFrom + 4));
  const [times, setTimes] = useState<number>(3);
  const [pauseSec, setPauseSec] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      setFrom(initialFrom);
      setTo(Math.min(verseCount, initialFrom + 4));
    }
  }, [visible, initialFrom, verseCount]);

  const clamp = (n: number) => Math.max(1, Math.min(verseCount, n));

  const Stepper = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <View style={styles.stepper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} +1`} onPress={() => onChange(clamp(value + 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.stepValue, { color: colors.textPrimary }]}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} −1`} onPress={() => onChange(clamp(value - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
          <Ionicons name="remove" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );

  const Chips = ({ values, value, onChange, format }: { values: readonly number[]; value: number; onChange: (n: number) => void; format: (n: number) => string }) => (
    <View style={styles.chips}>
      {values.map((v) => {
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, { borderColor: active ? colors.gold : colors.border, backgroundColor: active ? colors.gold + "1F" : colors.bgSurface }]}
          >
            <Text style={[styles.chipText, { color: active ? colors.gold : colors.textSecondary }]}>{format(v)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>تكرار مقطع للحفظ</Text>
          {isSurahMode ? (
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              القارئ المختار يوفّر تلاوة السورة كاملة فقط. اختر قارئًا بتلاوة آية بآية من الإعدادات لاستخدام التكرار.
            </Text>
          ) : (
            <>
              <View style={styles.steppers}>
                <Stepper label="من الآية" value={from} onChange={(n) => { setFrom(n); if (n > to) setTo(n); }} />
                <Stepper label="إلى الآية" value={to} onChange={(n) => { setTo(n); if (n < from) setFrom(n); }} />
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>عدد مرات التكرار</Text>
              <Chips values={TIMES} value={times} onChange={setTimes} format={(n) => (n === 0 ? "∞" : `×${n}`)} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>استراحة بين الجولات (للتسميع من الحفظ)</Text>
              <Chips values={PAUSES} value={pauseSec} onChange={setPauseSec} format={(n) => (n === 0 ? "بدون" : `${n} ث`)} />
              <Pressable
                onPress={() => { playRange(surahNum, from, to, times, pauseSec); onClose(); }}
                accessibilityRole="button"
                style={[styles.start, { backgroundColor: colors.gold }]}
              >
                <Ionicons name="repeat" size={20} color={colors.bgCard} />
                <Text style={[styles.startText, { color: colors.bgCard }]}>ابدأ التكرار</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  sheet: { width: "100%", maxWidth: 440, borderRadius: 20, borderWidth: 1, padding: 18, gap: 10 },
  title: { fontFamily: "Tajawal_400Regular", fontSize: 19, textAlign: "right" },
  note: { fontFamily: "Tajawal_400Regular", fontSize: 15, textAlign: "right", lineHeight: 24 },
  label: { fontFamily: "Tajawal_400Regular", fontSize: 14, textAlign: "right" },
  steppers: { flexDirection: "row-reverse", gap: 12 },
  stepper: { flex: 1, gap: 6 },
  stepperRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  stepBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepValue: { fontFamily: "Inter_600SemiBold", fontSize: 20, minWidth: 40, textAlign: "center" },
  chips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { minWidth: 56, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipText: { fontFamily: "Tajawal_400Regular", fontSize: 15 },
  start: { marginTop: 6, minHeight: 48, borderRadius: 24, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  startText: { fontFamily: "Tajawal_400Regular", fontSize: 17 },
});
