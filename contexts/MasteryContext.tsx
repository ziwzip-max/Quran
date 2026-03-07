import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "al_hifz_mastery";

export type MasteryLevel = 0 | 1 | 2;

interface MasteryContextValue {
  getMastery: (surahNum: number, verseNum: number) => MasteryLevel;
  setMastery: (surahNum: number, verseNum: number, level: MasteryLevel) => void;
  cycleMastery: (surahNum: number, verseNum: number) => void;
  masteryMap: Record<string, MasteryLevel>;
  isLoaded: boolean;
}

const MasteryContext = createContext<MasteryContextValue | null>(null);

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
      const next: MasteryLevel = current === 2 ? 0 : ((current + 1) as MasteryLevel);
      const updated = { ...prev };
      if (next === 0) delete updated[key];
      else updated[key] = next;
      persist(updated);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ getMastery, setMastery, cycleMastery, masteryMap, isLoaded }),
    [getMastery, setMastery, cycleMastery, masteryMap, isLoaded]
  );

  return <MasteryContext.Provider value={value}>{children}</MasteryContext.Provider>;
}

export function useMastery() {
  const ctx = useContext(MasteryContext);
  if (!ctx) throw new Error("useMastery must be used within MasteryProvider");
  return ctx;
}
