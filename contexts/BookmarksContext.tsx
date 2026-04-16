import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SURAHS, getVerseKey } from "@/constants/quranData";

const STORAGE_KEY = "al_hifz_bookmarks";

export interface VerseInBlock {
  number: number;
  text: string;
}

export interface VerseBlock {
  id: string;
  surahNumber: number;
  surahNameArabic: string;
  surahNameTranslit: string;
  startVerse: number;
  endVerse: number;
  verses: VerseInBlock[];
}

export interface SurahGroup {
  surahNumber: number;
  surahNameArabic: string;
  surahNameTranslit: string;
  blocks: VerseBlock[];
  totalVerses: number;
}

interface BookmarksContextValue {
  bookmarks: Record<string, boolean>;
  blocks: VerseBlock[];
  surahGroups: SurahGroup[];
  toggleBookmark: (surahNumber: number, verseNumber: number) => void;
  isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
  isLoaded: boolean;
  reloadFromStorage: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function computeBlocks(bookmarks: Record<string, boolean>): VerseBlock[] {
  const bySurah: Record<number, number[]> = {};

  for (const key of Object.keys(bookmarks)) {
    if (!bookmarks[key]) continue;
    const [s, v] = key.split(":").map(Number);
    if (!bySurah[s]) bySurah[s] = [];
    bySurah[s].push(v);
  }

  const result: VerseBlock[] = [];

  for (const surahNumStr of Object.keys(bySurah)) {
    const surahNumber = Number(surahNumStr);
    const surah = SURAHS.find((s) => s.number === surahNumber);
    if (!surah) continue;

    const verseNums = bySurah[surahNumber].slice().sort((a, b) => a - b);

    let i = 0;
    while (i < verseNums.length) {
      let j = i;
      while (j + 1 < verseNums.length && verseNums[j + 1] === verseNums[j] + 1) {
        j++;
      }

      const startVerse = verseNums[i];
      const endVerse = verseNums[j];

      const verses: VerseInBlock[] = [];
      for (let vn = startVerse; vn <= endVerse; vn++) {
        const verseData = surah.verses.find((v) => v.number === vn);
        if (verseData) {
          verses.push({ number: verseData.number, text: verseData.text });
        }
      }

      result.push({
        id: `${surahNumber}:${startVerse}-${endVerse}`,
        surahNumber,
        surahNameArabic: surah.nameArabic,
        surahNameTranslit: surah.nameTranslit,
        startVerse,
        endVerse,
        verses,
      });

      i = j + 1;
    }
  }

  result.sort((a, b) => {
    if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
    return a.startVerse - b.startVerse;
  });

  return result;
}

function groupBySurah(blocks: VerseBlock[]): SurahGroup[] {
  const map: Record<number, SurahGroup> = {};
  for (const block of blocks) {
    if (!map[block.surahNumber]) {
      map[block.surahNumber] = {
        surahNumber: block.surahNumber,
        surahNameArabic: block.surahNameArabic,
        surahNameTranslit: block.surahNameTranslit,
        blocks: [],
        totalVerses: 0,
      };
    }
    map[block.surahNumber].blocks.push(block);
    map[block.surahNumber].totalVerses += block.verses.length;
  }

  return Object.values(map).sort((a, b) => a.surahNumber - b.surahNumber);
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadFromStorage = useCallback(async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setBookmarks(JSON.parse(stored)); } catch {}
    } else {
      setBookmarks({});
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    reloadFromStorage();
  }, []);

  const toggleBookmark = (surahNumber: number, verseNumber: number) => {
    const key = getVerseKey(surahNumber, verseNumber);
    setBookmarks((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (surahNumber: number, verseNumber: number): boolean => {
    return !!bookmarks[getVerseKey(surahNumber, verseNumber)];
  };

  const blocks = useMemo(() => computeBlocks(bookmarks), [bookmarks]);
  const surahGroups = useMemo(() => groupBySurah(blocks), [blocks]);

  const value = useMemo(
    () => ({
      bookmarks,
      blocks,
      surahGroups,
      toggleBookmark,
      isBookmarked,
      isLoaded,
      reloadFromStorage,
    }),
    [bookmarks, blocks, surahGroups, isLoaded, reloadFromStorage]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx)
    throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
