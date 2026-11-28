import { useMemo } from "react";
import type { ViewStyle } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

export type SurfaceKind = "soft" | "strong";

export interface Surface {
  /**
   * Style for a panel. Flat paper with a hairline edge, no blur, no shadow.
   * `soft` for bars and rows (same colour as the page), `strong` for sheets and dialogs (the lighter sheet colour).
   */
  surface: (kind?: SurfaceKind) => ViewStyle;
  /** A single hairline above a section, instead of a box around it. */
  rule: () => ViewStyle;
}

export function useSurface(): Surface {
  const { colors } = useSettings();
  return useMemo<Surface>(
    () => ({
      surface: (kind = "soft") => ({
        backgroundColor: kind === "strong" ? colors.bgCard : colors.bgDark,
        borderWidth: 1,
        borderColor: colors.border,
      }),
      rule: () => ({ borderTopWidth: 1, borderColor: colors.border }),
    }),
    [colors.bgCard, colors.bgDark, colors.border],
  );
}
