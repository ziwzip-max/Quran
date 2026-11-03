import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Width from which the tab bar becomes a side menu. */
export const WIDE_BREAKPOINT = 900;

export function useIsWide() {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}

/** Top padding for a screen: the safe-area inset, with a small minimum on the web. */
export function useTopPadding() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;
}
