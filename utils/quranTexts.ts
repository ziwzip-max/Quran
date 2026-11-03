// Per-surah texts from api.alquran.cloud (tafsir, translations), saved on the
// device after the first download so they also work offline.
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TranslationLang = "none" | "fr" | "en";

/** Editions used by the app. */
export const EDITIONS = {
  tafsir: "ar.muyassar", // التفسير الميسر
  fr: "fr.hamidullah", // Muhammad Hamidullah
  en: "en.sahih", // Saheeh International
} as const;

export const TRANSLATION_CREDITS: Record<Exclude<TranslationLang, "none">, string> = {
  fr: "Traduction : Muhammad Hamidullah",
  en: "Translation: Saheeh International",
};

const CACHE_PREFIX = "al_hifz_ed_";
const inMemory = new Map<string, string[]>();

/** All verse texts of `surahNum` in `edition`, from memory, the device cache, or the network. */
export async function fetchEditionSurah(edition: string, surahNum: number): Promise<string[]> {
  const key = `${CACHE_PREFIX}${edition}_${surahNum}`;
  const mem = inMemory.get(key);
  if (mem) return mem;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const verses = JSON.parse(cached) as string[];
      inMemory.set(key, verses);
      return verses;
    }
  } catch {}
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/${edition}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const verses: string[] = (data?.data?.ayahs ?? []).map((a: { text: string }) => a.text);
  if (verses.length === 0) throw new Error("empty");
  inMemory.set(key, verses);
  AsyncStorage.setItem(key, JSON.stringify(verses)).catch(() => {});
  return verses;
}
