import { HIZB_START } from "@/constants/quranMeta";

/** Surah numbers that have at least one verse in Juz `juz` (1–30). Juz N starts at hizb 2N−1. */
export function surahsInJuz(juz: number): number[] {
  const start = HIZB_START[(juz - 1) * 2];
  const next = juz < 30 ? HIZB_START[juz * 2] : { surah: 115, verse: 1 };
  const out: number[] = [];
  for (let s = start.surah; s <= Math.min(114, next.surah); s++) {
    if (s === next.surah && next.verse === 1) break; // next Juz starts at this surah's first verse
    out.push(s);
  }
  return out;
}
