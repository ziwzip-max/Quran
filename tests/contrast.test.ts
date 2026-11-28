import test from "node:test";
import assert from "node:assert/strict";
import { ACCENT_COLORS, THEMES, type ThemeName } from "../constants/themes";

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("text and accents are readable on every theme", () => {
  for (const [name, t] of Object.entries(THEMES)) {
    const onDark = (name as ThemeName) === "dark";
    for (const bg of [t.bgDark, t.bgCard, t.bgSurface]) {
      for (const key of ["textPrimary", "textSecondary", "textMuted", "rubric", "leaf"] as const) {
        assert.ok(contrast(t[key], bg) >= 4.5, `${name} ${key} on ${bg}: ${contrast(t[key], bg).toFixed(2)}`);
      }
      for (const [accName, acc] of Object.entries(ACCENT_COLORS)) {
        const c = onDark ? acc.light : acc.primary;
        assert.ok(contrast(c, bg) >= 4.5, `${name} accent ${accName} on ${bg}: ${contrast(c, bg).toFixed(2)}`);
      }
    }
    // Text on a filled accent button.
    for (const [accName, acc] of Object.entries(ACCENT_COLORS)) {
      const fill = onDark ? acc.light : acc.primary;
      assert.ok(contrast(t.bgCard, fill) >= 4.5, `${name} button text on ${accName}: ${contrast(t.bgCard, fill).toFixed(2)}`);
    }
  }
});
