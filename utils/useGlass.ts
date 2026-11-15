import { useMemo, useSyncExternalStore } from "react";
import { Platform, type ViewStyle } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";
import { glassTokens, type GlassTokens } from "@/constants/glass";

const QUERIES = ["(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)"];

// Web only: people who ask the system for less transparency or more contrast get solid surfaces.
function subscribe(onChange: () => void) {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return () => {};
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}
function wantsSolid(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return false;
  return QUERIES.some((q) => window.matchMedia(q).matches);
}

export type GlassKind = "soft" | "strong";

export interface Glass {
  /** False when the user turned glass off or the system asks for less transparency. */
  enabled: boolean;
  tokens: GlassTokens;
  /**
   * Style for a surface: frosted glass, or a plain solid card when glass is off.
   * `soft` for bars and cards, `strong` for sheets and dialogs that hold text.
   */
  surface: (kind?: GlassKind) => ViewStyle;
}

export function useGlass(): Glass {
  const { glass, effectiveTheme, colors } = useSettings();
  const solid = useSyncExternalStore(subscribe, wantsSolid, () => false);
  const enabled = glass && !solid;
  // `colors.gold` is the accent colour the user picked.
  const tokens = useMemo(() => glassTokens(effectiveTheme, colors.gold), [effectiveTheme, colors.gold]);

  return useMemo<Glass>(() => {
    const surface = (kind: GlassKind = "soft"): ViewStyle => {
      if (!enabled) return { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border };
      const base: ViewStyle = { backgroundColor: tokens[kind], borderWidth: 1, borderColor: tokens.edge };
      if (Platform.OS === "web") {
        // Real background blur and a soft shadow with a light top edge. Web only.
        return {
          ...base,
          backdropFilter: `blur(${tokens.blur}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${tokens.blur}px) saturate(160%)`,
          boxShadow: `0 8px 28px ${tokens.shadow}, inset 0 1px 0 ${tokens.edge}`,
        } as ViewStyle;
      }
      // Android: no reliable blur, so a tinted translucent surface with a light edge. No shadow:
      // a shadow shows through a translucent surface.
      return base;
    };
    return { enabled, tokens, surface };
  }, [enabled, tokens, colors.bgCard, colors.border]);
}
