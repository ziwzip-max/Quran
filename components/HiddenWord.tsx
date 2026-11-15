import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

/** Every hidden word is drawn with this size, whatever the word is: the width of a box must
 *  not hint at how long the word is. */
export const HIDDEN_WORD_WIDTH = 56;
export const HIDDEN_WORD_HEIGHT = 40;

/**
 * Placeholder for a word the learner has to recall. It holds no text (not even invisible
 * text), so neither its size nor the page contents or a screen reader reveal the word.
 */
export function HiddenWord({ onPress, label = "كلمة مخفية" }: { onPress?: () => void; label?: string }) {
  const { colors } = useSettings();
  const box = [styles.box, { backgroundColor: colors.bgSurface, borderColor: colors.border }];
  if (!onPress) return <View style={box} accessibilityLabel={label} />;
  return (
    <Pressable onPress={onPress} style={box} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} />
  );
}

const styles = StyleSheet.create({
  box: {
    width: HIDDEN_WORD_WIDTH,
    height: HIDDEN_WORD_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
  },
});
