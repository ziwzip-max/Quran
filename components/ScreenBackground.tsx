import React, { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSettings } from "@/contexts/SettingsContext";
import { useGlass } from "@/utils/useGlass";

// Where each glow sits, in a 100 x 100 space that stretches to the screen: top right (the start of
// the line in a right-to-left app), middle left, and bottom.
const SPOTS = [
  { cx: 86, cy: 4, r: 64 },
  { cx: 6, cy: 40, r: 56 },
  { cx: 58, cy: 100, r: 72 },
];

/**
 * Page background: the theme colour with soft colour glows. Put it as the first child of a screen's
 * container; the content paints above it. With glass off it is just the plain theme colour.
 */
export function ScreenBackground() {
  const { colors } = useSettings();
  const { enabled, tokens } = useGlass();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgDark }]} />
      {enabled && (
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Defs>
            {tokens.glow.map((g, i) => (
              <RadialGradient key={i} id={`${id}g${i}`} cx={SPOTS[i].cx} cy={SPOTS[i].cy} r={SPOTS[i].r} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={g.color} stopOpacity={g.alpha} />
                <Stop offset="1" stopColor={g.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {tokens.glow.map((_, i) => (
            <Rect key={i} x={0} y={0} width={100} height={100} fill={`url(#${id}g${i})`} />
          ))}
        </Svg>
      )}
    </View>
  );
}
