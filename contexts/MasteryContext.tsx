import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "al_hifz_mastery";

export type MasteryLevel = 0 | 1 | 2 | 3;

interface MasteryContextValue {
  getMastery: (surahNum: number, verseNum: number) => MasteryLevel;
  setMastery: (surahNum: number, verseNum: number, level: MasteryLevel) => void;
  cycleMastery: (surahNum: number, verseNum: number) => void;
  recordDailyReview: (count?: number) => void;
  masteryMap: Record<string, MasteryLevel>;
  isLoaded: boolean;
}

const MasteryContext = createContext<MasteryContextValue | null>(null);

const DAILY_COUNTS_KEY = "al_hifz_daily_counts";

function makeKey(surahNum: number, verseNum: number) {
  return `${surahNum}:${verseNum}`;
}

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryLevel>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setMasteryMap(JSON.parse(stored)); } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = (map: Record<string, MasteryLevel>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  };

  const recordDailyReview = useCallback(async (count = 1) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stored = await AsyncStorage.getItem(DAILY_COUNTS_KEY);
      const counts = stored ? JSON.parse(stored) : {};
      counts[today] = (counts[today] || 0) + count;
      await AsyncStorage.setItem(DAILY_COUNTS_KEY, JSON.stringify(counts));
    } catch (e) {
      console.error("Failed to record daily review", e);
    }
  }, []);

  const getMastery = useCallback(
    (surahNum: number, verseNum: number): MasteryLevel =>
      (masteryMap[makeKey(surahNum, verseNum)] as MasteryLevel) ?? 0,
    [masteryMap]
  );

  const setMastery = useCallback((surahNum: number, verseNum: number, level: MasteryLevel) => {
    setMasteryMap((prev) => {
      const updated = { ...prev, [makeKey(surahNum, verseNum)]: level };
      if (level === 0) delete updated[makeKey(surahNum, verseNum)];
      persist(updated);
      return updated;
    });
  }, []);

  const cycleMastery = useCallback((surahNum: number, verseNum: number) => {
    setMasteryMap((prev) => {
      const key = makeKey(surahNum, verseNum);
      const current: MasteryLevel = (prev[key] as MasteryLevel) ?? 0;
      const next: MasteryLevel = current === 3 ? 0 : ((current + 1) as MasteryLevel);
      const updated = { ...prev };
      if (next === 0) delete updated[key];
      else updated[key] = next;
      persist(updated);
      return updated;
    });
    recordDailyReview();
  }, [recordDailyReview]);

  const value = useMemo(
    () => ({ getMastery, setMastery, cycleMastery, recordDailyReview, masteryMap, isLoaded }),
    [getMastery, setMastery, cycleMastery, recordDailyReview, masteryMap, isLoaded]
  );

  return <MasteryContext.Provider value={value}>{children}</MasteryContext.Provider>;
}

export function useMastery() {
  const ctx = useContext(MasteryContext);
  if (!ctx) throw new Error("useMastery must be used within MasteryProvider");
  return ctx;
}
