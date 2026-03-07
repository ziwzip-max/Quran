import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "al_hifz_qaloon_";

export async function fetchQaloonSurah(surahNum: number): Promise<string[]> {
  try {
    const cacheKey = CACHE_PREFIX + surahNum;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/qaloon`);
    if (!response.ok) return [];

    const data = await response.json();
    const verses: string[] = (data?.data?.ayahs ?? []).map((a: { text: string }) => a.text);

    if (verses.length > 0) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(verses));
    }

    return verses;
  } catch {
    return [];
  }
}
