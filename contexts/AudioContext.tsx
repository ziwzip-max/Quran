import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { Audio } from "expo-av";
import { useSettings } from "@/contexts/SettingsContext";
import { RECITERS_LIST, DEFAULT_RECITER_ID } from "@/constants/themes";
import { SURAHS } from "@/constants/quranData";

interface AudioContextValue {
  currentKey: string | null;
  currentSurahNum: number | null;
  currentVerseNum: number | null;
  isLoading: boolean;
  isPlaying: boolean;
  play: (surahNum: number, verseNum: number) => Promise<void>;
  stop: () => Promise<void>;
  playNext: (surahNum: number, verseNum: number) => Promise<void>;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

function padNum(n: number, len: number): string {
  return n.toString().padStart(len, "0");
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { reciterId, playbackRate, repeatMode, continuousPlay } = useSettings();

  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [currentSurahNum, setCurrentSurahNum] = useState<number | null>(null);
  const [currentVerseNum, setCurrentVerseNum] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const reciterIdRef = useRef(reciterId);
  const playbackRateRef = useRef(playbackRate);
  const repeatModeRef = useRef(repeatMode);
  const continuousPlayRef = useRef(continuousPlay);
  const repeatCounterRef = useRef(0);
  const currentSurahNumRef = useRef<number | null>(null);
  const currentVerseNumRef = useRef<number | null>(null);

  useEffect(() => { reciterIdRef.current = reciterId; }, [reciterId]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { continuousPlayRef.current = continuousPlay; }, [continuousPlay]);

  const playInternalRef = useRef<((surahNum: number, verseNum: number) => Promise<void>) | null>(null);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setCurrentKey(null);
    setCurrentSurahNum(null);
    setCurrentVerseNum(null);
    currentSurahNumRef.current = null;
    currentVerseNumRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    repeatCounterRef.current = 0;
  }, []);

  const playInternal = useCallback(async (surahNum: number, verseNum: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    const key = `${surahNum}:${verseNum}`;
    setCurrentKey(key);
    setCurrentSurahNum(surahNum);
    setCurrentVerseNum(verseNum);
    currentSurahNumRef.current = surahNum;
    currentVerseNumRef.current = verseNum;
    setIsLoading(true);

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
      const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
      const folder = reciterEntry?.folder ?? "Alafasy_128kbps";
      const url = `https://everyayah.com/data/${folder}/${padNum(surahNum, 3)}${padNum(verseNum, 3)}.mp3`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      if (playbackRateRef.current !== 1.0) {
        try { await sound.setRateAsync(playbackRateRef.current, true); } catch {}
      }

      soundRef.current = sound;
      setIsLoading(false);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          const rMode = repeatModeRef.current;
          const sNum = currentSurahNumRef.current;
          const vNum = currentVerseNumRef.current;

          if (rMode > 0 && repeatCounterRef.current < rMode - 1) {
            repeatCounterRef.current += 1;
            try { await sound.replayAsync(); } catch {}
          } else if (continuousPlayRef.current && sNum !== null && vNum !== null) {
            repeatCounterRef.current = 0;
            const surah = SURAHS.find((s) => s.number === sNum);
            if (surah) {
              const nextIdx = surah.verses.findIndex((v) => v.number === vNum) + 1;
              if (nextIdx < surah.verses.length) {
                if (playInternalRef.current) {
                  await playInternalRef.current(sNum, surah.verses[nextIdx].number);
                }
              } else if (sNum < 114) {
                if (playInternalRef.current) {
                  await playInternalRef.current(sNum + 1, 1);
                }
              } else {
                setIsPlaying(false);
                setCurrentKey(null);
                try { sound.unloadAsync(); } catch {}
                soundRef.current = null;
              }
            }
          } else {
            repeatCounterRef.current = 0;
            setIsPlaying(false);
            setCurrentKey(null);
            try { sound.unloadAsync(); } catch {}
            soundRef.current = null;
          }
        }
      });
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentKey(null);
    }
  }, []);

  playInternalRef.current = playInternal;

  const play = useCallback(async (surahNum: number, verseNum: number) => {
    const key = `${surahNum}:${verseNum}`;
    if (currentKey === key && isPlaying) {
      await stop();
      return;
    }
    repeatCounterRef.current = 0;
    await playInternal(surahNum, verseNum);
  }, [currentKey, isPlaying, stop, playInternal]);

  const playNext = useCallback(async (surahNum: number, verseNum: number) => {
    repeatCounterRef.current = 0;
    const surah = SURAHS.find((s) => s.number === surahNum);
    if (!surah) return;
    const nextIdx = surah.verses.findIndex((v) => v.number === verseNum) + 1;
    if (nextIdx < surah.verses.length) {
      await playInternal(surahNum, surah.verses[nextIdx].number);
    } else if (surahNum < 114) {
      await playInternal(surahNum + 1, 1);
    }
  }, [playInternal]);

  return (
    <AudioCtx.Provider value={{
      currentKey, currentSurahNum, currentVerseNum,
      isLoading, isPlaying, play, stop, playNext,
    }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
