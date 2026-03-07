export type TajweedRule = "qalqala" | "ghunna" | "madd" | "ikhfa" | "iqlab" | "idgham";

export interface TajweedSegment {
  text: string;
  rule: TajweedRule | null;
}

export const TAJWEED_COLORS: Record<TajweedRule, string> = {
  qalqala: "#C94040",
  ghunna:  "#27AE60",
  madd:    "#1A6BB5",
  ikhfa:   "#D97706",
  iqlab:   "#BE185D",
  idgham:  "#7C3AED",
};

export const TAJWEED_LABELS: Record<TajweedRule, string> = {
  qalqala: "قلقلة",
  ghunna:  "غنة",
  madd:    "مد",
  ikhfa:   "إخفاء",
  iqlab:   "إقلاب",
  idgham:  "إدغام",
};

const SUKUN   = "\u0652";
const SHADDA  = "\u0651";
const FATHA   = "\u064E";
const DAMMA   = "\u064F";
const KASRA   = "\u0650";
const TANWIN_F = "\u064B";
const TANWIN_D = "\u064C";
const TANWIN_K = "\u064D";

const QALQALA_LETTERS  = new Set(["ق", "ط", "ب", "ج", "د"]);
const IDGHAM_LETTERS   = new Set(["ي", "ر", "م", "ل", "و", "ن"]);
const IKHFA_LETTERS    = new Set(["ت","ث","ج","د","ذ","ز","س","ش","ص","ض","ط","ظ","ف","ق","ك"]);
const MADD_LETTERS     = new Set(["ا", "و", "ي"]);

function getBaseLetter(cluster: string): string {
  return cluster[0] ?? "";
}

function getMarks(cluster: string): string {
  return cluster.slice(1);
}

export function parseTajweed(text: string): TajweedSegment[] {
  const clusterRegex = /\p{L}\p{M}*|[^\p{L}]/gu;
  const clusters = text.match(clusterRegex) ?? [];
  const n = clusters.length;

  const rules: (TajweedRule | null)[] = clusters.map((cluster, i) => {
    const base = getBaseLetter(cluster);
    const marks = getMarks(cluster);

    const hasSukun  = marks.includes(SUKUN);
    const hasShadda = marks.includes(SHADDA);
    const hasTanwin = marks.includes(TANWIN_F) || marks.includes(TANWIN_D) || marks.includes(TANWIN_K);

    const nextCluster = clusters[i + 1] ?? "";
    const nextBase = getBaseLetter(nextCluster);
    const prevCluster = clusters[i - 1] ?? "";
    const prevMarks = getMarks(prevCluster);

    if (base === " " || base === "") return null;

    if (hasSukun && QALQALA_LETTERS.has(base)) return "qalqala";

    if (hasShadda && (base === "ن" || base === "م")) return "ghunna";

    if (base === "ن" && hasSukun && nextBase === "ب") return "iqlab";
    if (hasTanwin && nextBase === "ب") return "iqlab";

    if (base === "ن" && hasSukun && IDGHAM_LETTERS.has(nextBase)) return "idgham";
    if (hasTanwin && IDGHAM_LETTERS.has(nextBase)) return "idgham";

    if (base === "ن" && hasSukun && IKHFA_LETTERS.has(nextBase)) return "ikhfa";
    if (hasTanwin && IKHFA_LETTERS.has(nextBase)) return "ikhfa";

    if (MADD_LETTERS.has(base)) {
      const prevHasFatha = prevMarks.includes(FATHA);
      const prevHasDamma = prevMarks.includes(DAMMA);
      const prevHasKasra = prevMarks.includes(KASRA);
      if (base === "ا" && prevHasFatha) return "madd";
      if (base === "و" && prevHasDamma) return "madd";
      if (base === "ي" && prevHasKasra) return "madd";
    }

    return null;
  });

  const segments: TajweedSegment[] = [];
  let i = 0;
  while (i < n) {
    const rule = rules[i];
    let segText = clusters[i];
    let j = i + 1;
    while (j < n && rules[j] === rule) {
      segText += clusters[j];
      j++;
    }
    segments.push({ text: segText, rule });
    i = j;
  }

  return segments;
}
