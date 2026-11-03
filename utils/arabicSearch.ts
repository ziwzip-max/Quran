// Search that works with how people type Arabic, against the fully vowelled
// Uthmani text: vowel marks, Quranic signs and tatweel are ignored, and letter
// variants (أ إ آ ٱ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي) are treated as one.
import { SURAHS } from "@/constants/quranData";

const DAGGER_ALIF = "ٰ";
// Harakat, tanwin, shadda, sukun, Quranic annotation signs, small letters, tatweel.
const MARKS = /[ؐ-ًؚ-ٟۖ-ۭـ]/gu;

function foldLetters(s: string): string {
  return s
    .replace(/[آأإٱ]/gu, "ا") // آ أ إ ٱ → ا
    .replace(/ى/gu, "ي") // ى → ي
    .replace(/ة/gu, "ه") // ة → ه
    .replace(/ؤ/gu, "و") // ؤ → و
    .replace(/ئ/gu, "ي") // ئ → ي
    .replace(/ء(?=ا)/gu, "") // ءا (Uthmani) → ا, as in ءَامَنُوا / آمنوا
    .replace(/\s+/gu, " ")
    .trim();
}

/** Normalises a typed query. */
export function normalizeQuery(q: string): string {
  return foldLetters(q.replace(DAGGER_ALIF, "").replace(MARKS, ""));
}

/**
 * The two readings of a Uthmani text a query may match: the dagger alif
 * dropped (ٱلرَّحْمَٰنِ → الرحمن) or read as a full alif (ٱلْكِتَٰبُ → الكتاب,
 * ٱلصَّلَوٰةَ → الصلاه).
 */
export function normalizeText(text: string): [string, string] {
  const dropped = foldLetters(text.replace(/ٰ/gu, "").replace(MARKS, ""));
  const asAlif = foldLetters(
    text
      .replace(/و\p{M}*ٰ/gu, "ا") // وٰ → ا  (صلوٰة → صلاة)
      .replace(/ى\p{M}*ٰ/gu, "ي") // ىٰ → ي  (عَلَىٰ → على)
      .replace(/ٰ/gu, "ا")
      .replace(MARKS, ""),
  );
  return [dropped, asAlif];
}

export function textMatches(text: string, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return false;
  const [a, b] = normalizeText(text);
  return a.includes(q) || b.includes(q);
}

export interface VerseHit {
  surahNumber: number;
  verseNumber: number;
}

let index: { surahNumber: number; verseNumber: number; forms: [string, string] }[] | null = null;

/** All verses matching `query`, in mushaf order. The normalised index is built once. */
export function searchVerses(query: string): VerseHit[] {
  const q = normalizeQuery(query);
  if (q.length < 2) return [];
  index ??= SURAHS.flatMap((s) =>
    s.verses.map((v) => ({ surahNumber: s.number, verseNumber: v.number, forms: normalizeText(v.text) })),
  );
  return index
    .filter((e) => e.forms[0].includes(q) || e.forms[1].includes(q))
    .map(({ surahNumber, verseNumber }) => ({ surahNumber, verseNumber }));
}

/**
 * Splits a verse into words and marks which ones belong to the match, for
 * highlighting. A word is highlighted when its normalised form overlaps one of
 * the query's words.
 */
export function highlightWords(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = normalizeQuery(query).split(" ").filter(Boolean);
  return text.split(/(\s+)/u).map((part) => {
    if (/^\s*$/u.test(part)) return { text: part, hit: false };
    const forms = normalizeText(part);
    const hit = terms.some((t) => forms.some((f) => f && (f.includes(t) || t.includes(f))));
    return { text: part, hit };
  });
}
