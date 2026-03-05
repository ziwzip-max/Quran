import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookmarkedVerse, getVerseKey, SURAHS } from "@/constants/quranData";

const STORAGE_KEY = "al_hifz_bookmarks";

interface BookmarksContextValue {
  bookmarks: Record<string, boolean>;
  bookmarkedVerses: BookmarkedVerse[];
  toggleBookmark: (surahNumber: number, verseNumber: number) => void;
  isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
  isLoaded: boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
      setIsLoaded(true);
    });
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

  const bookmarkedVerses = useMemo<BookmarkedVerse[]>(() => {
    const result: BookmarkedVerse[] = [];
    for (const key of Object.keys(bookmarks)) {
      if (!bookmarks[key]) continue;
      const [s, v] = key.split(":").map(Number);
      const surah = SURAHS.find((su) => su.number === s);
      if (!surah) continue;
      const verse = surah.verses.find((ve) => ve.number === v);
      if (!verse) continue;
      result.push({
        surahNumber: s,
        verseNumber: v,
        surahNameArabic: surah.nameArabic,
        surahNameTranslit: surah.nameTranslit,
        text: verse.text,
      });
    }
    result.sort((a, b) => {
      if (a.surahNumber !== b.surahNumber)
        return a.surahNumber - b.surahNumber;
      return a.verseNumber - b.verseNumber;
    });
    return result;
  }, [bookmarks]);

  const value = useMemo(
    () => ({ bookmarks, bookmarkedVerses, toggleBookmark, isBookmarked, isLoaded }),
    [bookmarks, bookmarkedVerses, isLoaded]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
