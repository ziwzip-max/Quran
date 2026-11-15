import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast, glassTokens, parseColor, worstBackgrounds, type GlassThemeName } from "@/constants/glass";
import { ACCENT_COLORS, THEMES } from "@/constants/themes";

const THEME_NAMES: GlassThemeName[] = ["dark", "light", "sepia", "violet"];

test("body and secondary text stay at 4.5:1 or better on glass, for every theme and accent", () => {
  const failures: string[] = [];
  for (const name of THEME_NAMES) {
    for (const [accentName, accent] of Object.entries(ACCENT_COLORS)) {
      const colors = THEMES[name];
      const tokens = glassTokens(name, accent.primary);
      for (const surface of ["soft", "strong"] as const) {
        for (const bg of worstBackgrounds(tokens, surface)) {
          for (const key of ["textPrimary", "textSecondary", "textMuted"] as const) {
            const ratio = contrast(parseColor(colors[key]).rgb, bg);
            if (ratio < 4.5) failures.push(`${name}/${accentName}/${surface}/${key} = ${ratio.toFixed(2)}`);
          }
        }
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("glass surfaces are translucent and sheets are more opaque than chrome", () => {
  for (const name of THEME_NAMES) {
    const t = glassTokens(name, "#C9A227");
    const soft = parseColor(t.soft).a;
    const strong = parseColor(t.strong).a;
    assert.ok(soft > 0.4 && soft < 0.8, `${name} soft alpha ${soft}`);
    assert.ok(strong > soft && strong < 1, `${name} strong alpha ${strong}`);
  }
});

test("the first glow follows the accent colour", () => {
  assert.equal(glassTokens("light", "#2980B9").glow[0].color, "#2980B9");
  assert.equal(glassTokens("light", "#2980B9").glow[1].color, glassTokens("light", "#C0392B").glow[1].color);
});
