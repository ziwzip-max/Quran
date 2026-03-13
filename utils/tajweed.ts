export type TajweedRule =
  | "qalqala"
  | "ghunna"
  | "madd_normal"
  | "madd_lazim"
  | "madd_munfasil"
  | "ikhfa"
  | "iqlab"
  | "idgham_ghunna"
  | "idgham_bila_ghunna"
  | "qalb"
  | "lam_shamsiyya"
  | "hamzat_wasl";

export interface TajweedSegment {
  text: string;
  rule: TajweedRule | null;
}

export interface TajweedRuleInfo {
  label: string;
  color: string;
  shortLabel: string;
  description: string;
  howTo: string;
  example: string;
}

export const TAJWEED_RULES: Record<TajweedRule, TajweedRuleInfo> = {
  qalqala: {
    label: "قَلْقَلَة",
    shortLabel: "قلقلة",
    color: "#E05353",
    description: "اهتزاز أو ارتداد الحرف عند النطق به ساكنًا. حروفها: قطب جد",
    howTo: "انطق الحرف الساكن مع اهتزاز خفيف وصدى بعد النطق به",
    example: "يَقْطِنُ، أَحَطتُ، الْحَقّ",
  },
  ghunna: {
    label: "غُنَّة",
    shortLabel: "غنة",
    color: "#27AE60",
    description: "صوت رنّان يخرج من الخيشوم عند النطق بالنون أو الميم المشددتين",
    howTo: "أمسك أنفك وانطق — يجب أن تستمر جرةً ثابتة مقدار حركتين",
    example: "إِنَّ، ثُمَّ، مِمَّا",
  },
  madd_normal: {
    label: "مَدّ طبيعي",
    shortLabel: "مد",
    color: "#2980B9",
    description: "المد الأصلي بمقدار حركتين، يكون عند حرف المد دون سبب همز أو سكون",
    howTo: "مدّ الصوت بمقدار حركتين متساويتين (عدّ واحد-اثنان)",
    example: "قَالَ، يَقُولُ، قِيلَ",
  },
  madd_lazim: {
    label: "مَدّ لازم",
    shortLabel: "مد لازم",
    color: "#1557A0",
    description: "مد بمقدار ست حركات، يكون عند وقوع السكون الأصلي بعد حرف المد",
    howTo: "مدّ الصوت ست حركات (عدّ واحد إلى ستة) — لازم في جميع الأحوال",
    example: "الضَّالِّين، دَابَّة",
  },
  madd_munfasil: {
    label: "مَدّ مُنفصل",
    shortLabel: "مد منفصل",
    color: "#5B9BD5",
    description: "مد يقع عند وقوع همزة في كلمة بعد حرف المد في كلمة مستقلة",
    howTo: "مدّ الصوت من حركتين إلى خمس حركات حسب المقام",
    example: "إِنَّا أَعْطَيْنَاكَ",
  },
  ikhfa: {
    label: "إِخْفَاء",
    shortLabel: "إخفاء",
    color: "#D97706",
    description: "إخفاء النون الساكنة أو التنوين عند 15 حرفًا مع بقاء الغنة",
    howTo: "أخفِ النون دون إدغام كامل ولا إظهار كامل، مع الغنة مقدار حركتين",
    example: "مَنْ كَانَ، جَنَّات تَجْرِي",
  },
  iqlab: {
    label: "إِقْلَاب",
    shortLabel: "إقلاب",
    color: "#BE185D",
    description: "قلب النون الساكنة أو التنوين ميمًا مخفاةً عند الباء",
    howTo: "حوّل النون إلى ميم مخفاة مع غنة مقدار حركتين قبل الباء",
    example: "مِنْ بَعْدِ، سَمِيعٌ بَصِيرٌ",
  },
  idgham_ghunna: {
    label: "إِدْغَام بِغُنَّة",
    shortLabel: "إدغام",
    color: "#7C3AED",
    description: "إدغام النون الساكنة أو التنوين في: ي ن م و — مع بقاء الغنة",
    howTo: "أدغم النون في الحرف التالي إدغامًا كاملًا مع غنة مقدار حركتين",
    example: "مَنْ يَقُولُ، هُدًى وَرَحْمَة",
  },
  idgham_bila_ghunna: {
    label: "إِدْغَام بِلَا غُنَّة",
    shortLabel: "إدغام لا غنة",
    color: "#6D28D9",
    description: "إدغام النون الساكنة أو التنوين في: ل ر — بدون غنة",
    howTo: "أدغم النون في اللام أو الراء إدغامًا كاملًا بدون غنة",
    example: "مِنْ رَبِّهِمْ، غَفُورٌ رَحِيم",
  },
  qalb: {
    label: "قَلْب",
    shortLabel: "قلب",
    color: "#DB2777",
    description: "قلب الميم الساكنة عند الباء إلى ميم مخفاة مع الغنة",
    howTo: "أطبق الشفتين بخفة ومدّ الغنة حركتين دون فصل الشفتين",
    example: "يَعْتَصِم بِاللَّه",
  },
  lam_shamsiyya: {
    label: "لَام شَمْسِيَّة",
    shortLabel: "لام شمسية",
    color: "#B45309",
    description: "اللام الشمسية تُدغم في الحرف التالي لها، ولا تُنطق في 'ال' التعريف",
    howTo: "أدغم اللام في الحرف التالي — كأن اللام غير موجودة: 'الشمس' = 'اشّمس'",
    example: "الشَّمْس، الرَّحْمن، النُّور",
  },
  hamzat_wasl: {
    label: "هَمْزَة وَصْل",
    shortLabel: "همزة وصل",
    color: "#64748B",
    description: "همزة تُنطق في ابتداء الكلام وتسقط وصلًا في أثناء التلاوة المتواصلة",
    howTo: "ابدأ بها إذا كانت أول ما تقرأ، وأسقطها إذا كنت تواصل القراءة",
    example: "ٱلْحَمْدُ، ٱقْرَأ، ٱلَّذِي",
  },
};

export const TAJWEED_COLORS: Record<TajweedRule, string> = Object.fromEntries(
  Object.entries(TAJWEED_RULES).map(([k, v]) => [k, v.color])
) as Record<TajweedRule, string>;

export const TAJWEED_LABELS: Record<TajweedRule, string> = Object.fromEntries(
  Object.entries(TAJWEED_RULES).map(([k, v]) => [k, v.label])
) as Record<TajweedRule, string>;

const SUKUN    = "\u0652";
const SHADDA   = "\u0651";
const FATHA    = "\u064E";
const DAMMA    = "\u064F";
const KASRA    = "\u0650";
const TANWIN_F = "\u064B";
const TANWIN_D = "\u064C";
const TANWIN_K = "\u064D";

const QALQALA_LETTERS           = new Set(["ق", "ط", "ب", "ج", "د"]);
const IDGHAM_GHUNNA_LETTERS     = new Set(["ي", "ن", "م", "و"]);
const IDGHAM_BILA_GHUNNA_LETTERS = new Set(["ل", "ر"]);
const IKHFA_LETTERS             = new Set([
  "ت","ث","ج","د","ذ","ز","س","ش","ص","ض","ط","ظ","ف","ق","ك",
]);
const MADD_LETTERS              = new Set(["ا", "و", "ي", "ى"]);
const SHAMSIYYA_LETTERS         = new Set([
  "ت","ث","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ل","ن",
]);
const HAMZAT_WASL_CHAR          = "ٱ";

function getBase(cluster: string): string {
  return cluster[0] ?? "";
}

function getMarks(cluster: string): string {
  return cluster.slice(1);
}

export function parseTajweed(text: string): TajweedSegment[] {
  const clusterRegex = /\p{L}\p{M}*|[^\p{L}]/gu;
  const clusters: string[] = text.match(clusterRegex) ?? [];
  const n = clusters.length;

  const rules: (TajweedRule | null)[] = clusters.map((cluster, i) => {
    const base  = getBase(cluster);
    const marks = getMarks(cluster);

    const hasSukun  = marks.includes(SUKUN);
    const hasShadda = marks.includes(SHADDA);
    const hasTanwin = marks.includes(TANWIN_F) || marks.includes(TANWIN_D) || marks.includes(TANWIN_K);
    const hasFatha  = marks.includes(FATHA);
    const hasDamma  = marks.includes(DAMMA);
    const hasKasra  = marks.includes(KASRA);

    const nextCluster = clusters[i + 1] ?? "";
    const nextBase    = getBase(nextCluster);
    const prevCluster = clusters[i - 1] ?? "";
    const prevMarks   = getMarks(prevCluster);
    const prevBase    = getBase(prevCluster);

    if (base === " " || base === "") return null;

    if (base === HAMZAT_WASL_CHAR) return "hamzat_wasl";

    if (hasSukun && QALQALA_LETTERS.has(base)) return "qalqala";

    if (hasShadda && (base === "ن" || base === "م")) return "ghunna";

    if (base === "ن" && hasSukun && nextBase === "ب") return "iqlab";
    if (hasTanwin && nextBase === "ب") return "iqlab";

    if (base === "م" && hasSukun && nextBase === "ب") return "qalb";

    if (base === "ن" && hasSukun && IDGHAM_GHUNNA_LETTERS.has(nextBase)) return "idgham_ghunna";
    if (hasTanwin && IDGHAM_GHUNNA_LETTERS.has(nextBase)) return "idgham_ghunna";

    if (base === "ن" && hasSukun && IDGHAM_BILA_GHUNNA_LETTERS.has(nextBase)) return "idgham_bila_ghunna";
    if (hasTanwin && IDGHAM_BILA_GHUNNA_LETTERS.has(nextBase)) return "idgham_bila_ghunna";

    if (base === "ن" && hasSukun && IKHFA_LETTERS.has(nextBase)) return "ikhfa";
    if (hasTanwin && IKHFA_LETTERS.has(nextBase)) return "ikhfa";

    if (MADD_LETTERS.has(base)) {
      const prevHasFatha = prevMarks.includes(FATHA);
      const prevHasDamma = prevMarks.includes(DAMMA);
      const prevHasKasra = prevMarks.includes(KASRA);

      const isLongVowel =
        (base === "ا" && prevHasFatha) ||
        (base === "ى" && prevHasFatha) ||
        (base === "و" && prevHasDamma) ||
        (base === "ي" && prevHasKasra);

      if (isLongVowel) {
        const nextMarks = getMarks(nextCluster);
        const nextHasShadda = nextMarks.includes(SHADDA);
        const nextHasSukun  = nextMarks.includes(SUKUN);
        if (nextHasShadda || nextHasSukun) return "madd_lazim";
        const nextIsHamza = nextBase === "أ" || nextBase === "إ" || nextBase === "ؤ" || nextBase === "ئ" || nextBase === "ء";
        if (nextIsHamza) return "madd_munfasil";
        return "madd_normal";
      }
    }

    if (base === "ل" && prevBase === "ٱ") {
      if (SHAMSIYYA_LETTERS.has(nextBase)) return "lam_shamsiyya";
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

export function getActiveTajweedRules(segments: TajweedSegment[]): TajweedRule[] {
  const seen = new Set<TajweedRule>();
  for (const seg of segments) {
    if (seg.rule) seen.add(seg.rule);
  }
  return Array.from(seen);
}
