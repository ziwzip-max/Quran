import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { SURAHS } from "@/constants/quranData";

/** Opens a random surah (the old "عشوائي" tab, now a button in the home header). */
export function openRandomSurah() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const random = SURAHS[Math.floor(Math.random() * SURAHS.length)];
  router.push({ pathname: "/surah/[id]", params: { id: String(random.number) } });
}
