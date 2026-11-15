// Frosted-glass look: a soft colour glow sits behind translucent surfaces.
// Pure data and maths (no React Native imports) so it can be unit-tested for contrast.

export type GlassThemeName = "dark" | "light" | "sepia" | "violet";

export interface GlassTokens {
  /** Page colour under the glow (the theme's background). */
  base: string;
  /** Three soft glows [top-start, top-end, bottom], as hex + alpha. The first follows the accent colour. */
  glow: [GlowStop, GlowStop, GlowStop];
  /** Chrome and home cards: translucent. */
  soft: string;
  /** Sheets and dialogs that hold text: nearly opaque. */
  strong: string;
  /** Thin light edge that makes a surface look like glass. */
  edge: string;
  shadow: string;
  /** Backdrop blur radius in px (web only). */
  blur: number;
}

export interface GlowStop {
  color: string;
  alpha: number;
}

type Fixed = Omit<GlassTokens, "glow"> & { glow: [Omit<GlowStop, "color">, GlowStop, GlowStop] };

const FIXED: Record<GlassThemeName, Fixed> = {
  dark: {
    base: "#0A0E1A",
    glow: [{ alpha: 0.5 }, { color: "#26B399", alpha: 0.38 }, { color: "#7C5CE0", alpha: 0.5 }],
    soft: "rgba(14,20,38,0.82)",
    strong: "rgba(14,20,38,0.92)",
    edge: "rgba(255,255,255,0.14)",
    shadow: "rgba(0,0,0,0.45)",
    blur: 22,
  },
  light: {
    base: "#F5F0E8",
    glow: [{ alpha: 0.42 }, { color: "#3FB7A2", alpha: 0.32 }, { color: "#A98BE6", alpha: 0.34 }],
    soft: "rgba(255,255,255,0.78)",
    strong: "rgba(255,255,255,0.92)",
    edge: "rgba(255,255,255,0.9)",
    shadow: "rgba(90,70,30,0.16)",
    blur: 22,
  },
  sepia: {
    base: "#F5EDD8",
    glow: [{ alpha: 0.38 }, { color: "#8FB08A", alpha: 0.3 }, { color: "#D9967A", alpha: 0.3 }],
    soft: "rgba(253,246,227,0.76)",
    strong: "rgba(253,246,227,0.93)",
    edge: "rgba(255,250,236,0.9)",
    shadow: "rgba(100,70,30,0.16)",
    blur: 22,
  },
  violet: {
    base: "#FFFFFF",
    glow: [{ alpha: 0.28 }, { color: "#3FB7A2", alpha: 0.24 }, { color: "#A98BE6", alpha: 0.26 }],
    soft: "rgba(255,255,255,0.72)",
    strong: "rgba(255,255,255,0.94)",
    edge: "rgba(255,255,255,0.95)",
    shadow: "rgba(0,0,0,0.12)",
    blur: 22,
  },
};

/** Glass tokens for a theme; the first glow follows the user's accent colour. */
export function glassTokens(theme: GlassThemeName, accent: string): GlassTokens {
  const f = FIXED[theme] ?? FIXED.dark;
  return { ...f, glow: [{ color: accent, alpha: f.glow[0].alpha }, f.glow[1], f.glow[2]] };
}

// ---- colour maths (used by the tests and by nothing at run time) ----

export type RGB = [number, number, number];

export function parseColor(c: string): { rgb: RGB; a: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], a: 1 };
  }
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c);
  if (!m) throw new Error(`unsupported colour: ${c}`);
  return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
}

/** `top` (with its alpha) painted over an opaque `bottom`. */
export function over(top: { rgb: RGB; a: number }, bottom: RGB): RGB {
  return [0, 1, 2].map((i) => top.rgb[i] * top.a + bottom[i] * (1 - top.a)) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Colours text can end up on a glass surface: the surface over the plain page, and over the page
 * under each glow at full strength (the worst case, where two glows overlap, is covered by also
 * adding the next glow on top).
 */
export function worstBackgrounds(t: GlassTokens, surface: "soft" | "strong"): RGB[] {
  const base = parseColor(t.base).rgb;
  const fill = parseColor(t[surface]);
  const under: RGB[] = [base];
  let acc = base;
  for (const g of t.glow) {
    const c = parseColor(g.color).rgb;
    under.push(over({ rgb: c, a: g.alpha }, base));
    acc = over({ rgb: c, a: g.alpha }, acc);
    under.push(acc);
  }
  return under.map((u) => over(fill, u));
}
