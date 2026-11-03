import AsyncStorage from "@react-native-async-storage/async-storage";

/** Last review time per memorisation block id (ms since epoch). */
export const REVIEWS_KEY = "al_hifz_reviews";

export async function loadReviews(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(REVIEWS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export async function saveReviews(reviews: Record<string, number>) {
  try {
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch {}
}
