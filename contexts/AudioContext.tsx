import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { Audio } from "expo-av";
import { useSettings } from "@/contexts/SettingsContext";
import { RECITERS_LIST, DEFAULT_RECITER_ID } from "@/constants/themes";
import { SURAHS } from "@/constants/quranData";
import * as FileSystem from "expo-file-system/legacy";

interface AudioContextValue {
  currentKey: string | null;
  currentSurahNum: number | null;
  currentVerseNum: number | null;
  isLoading: boolean;
  isPlaying: boolean;
  playbackPosition: number;
  playbackDuration: number;
  isSurahMode: boolean;
  downloadProgress: { surahNum: number; percent: number } | null;
  downloadSurah: (surahNum: number) => Promise<void>;
  sleepTimer: number | null;
  sleepTimerActive: boolean;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
  play: (surahNum: number, verseNum: number) => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
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
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const [downloadProgress, setDownloadProgress] = useState<{ surahNum: number; percent: number } | null>(null);

  const [sleepTimer, setSleepTimerValue] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sleepTimer !== null) {
      setSleepTimerRemaining(sleepTimer * 60);
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 0) {
            if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
            stop();
            setSleepTimerValue(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      setSleepTimerRemaining(null);
    }
    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimer]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerValue(minutes);
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

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
  const playSurahInternalRef = useRef<((surahNum: number) => Promise<void>) | null>(null);

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
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    repeatCounterRef.current = 0;
  }, []);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } catch {}
    }
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } catch {}
    }
  }, []);

  const playSurahInternal = useCallback(async (surahNum: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    const surahKey = `surah:${surahNum}`;
    setCurrentKey(surahKey);
    setCurrentSurahNum(surahNum);
    setCurrentVerseNum(null);
    currentSurahNumRef.current = surahNum;
    currentVerseNumRef.current = null;
    setIsLoading(true);
    setPlaybackPosition(0);
    setPlaybackDuration(0);

    try {
      const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
      const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
      const surahPadded = padNum(surahNum, 3);
      const remoteUrl = reciterEntry?.surahUrl?.replace("{SSS}", surahPadded) ?? "";

      if (!remoteUrl) {
        setIsLoading(false);
        setCurrentKey(null);
        return;
      }

      const cacheKey = `${rid}_${surahPadded}`;
      const localUri = FileSystem.cacheDirectory + "audio/" + cacheKey + ".mp3";
      const info = await FileSystem.getInfoAsync(localUri);
      let uri = remoteUrl;

      if (info.exists) {
        uri = localUri;
      } else {
        // Optional: Trigger background download if not exists
        (async () => {
          try {
            const dirInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + "audio/");
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + "audio/", { intermediates: true });
            }
            await FileSystem.downloadAsync(remoteUrl, localUri);
          } catch (e) {
            console.error("Background download failed", e);
          }
        })();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
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
        setPlaybackPosition(status.positionMillis ?? 0);
        if (status.durationMillis) setPlaybackDuration(status.durationMillis);

        if (status.didJustFinish) {
          setPlaybackPosition(0);
          const rMode = repeatModeRef.current;
          const sNum = currentSurahNumRef.current;

          if (rMode > 0 && repeatCounterRef.current < rMode - 1) {
            repeatCounterRef.current += 1;
            try { await sound.replayAsync(); } catch {}
          } else if (continuousPlayRef.current && sNum !== null && sNum < 114) {
            repeatCounterRef.current = 0;
            if (playSurahInternalRef.current) {
              await playSurahInternalRef.current(sNum + 1);
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

  playSurahInternalRef.current = playSurahInternal;

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
    setPlaybackPosition(0);
    setPlaybackDuration(0);

    try {
      const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
      const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
      const folder = reciterEntry?.folder ?? "Alafasy_128kbps";
      const surahPadded = padNum(surahNum, 3);
      const versePadded = padNum(verseNum, 3);
      const remoteUrl = `https://everyayah.com/data/${folder}/${surahPadded}${versePadded}.mp3`;

      const cacheKey = `${rid}_${surahPadded}${versePadded}`;
      const localUri = FileSystem.cacheDirectory + "audio/" + cacheKey + ".mp3";
      const info = await FileSystem.getInfoAsync(localUri);
      let uri = remoteUrl;

      if (info.exists) {
        uri = localUri;
      } else {
        // Background download
        (async () => {
          try {
            const dirInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + "audio/");
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + "audio/", { intermediates: true });
            }
            await FileSystem.downloadAsync(remoteUrl, localUri);
          } catch (e) {}
        })();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
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
        setPlaybackPosition(status.positionMillis ?? 0);
        if (status.durationMillis) setPlaybackDuration(status.durationMillis);

        if (status.didJustFinish) {
          setPlaybackPosition(0);
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
    const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
    const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
    const isSurah = !!reciterEntry?.surahUrl;

    if (isSurah) {
      const surahKey = `surah:${surahNum}`;
      if (currentKey === surahKey && isPlaying) {
        await pause();
        return;
      }
      if (currentKey === surahKey && !isPlaying) {
        await resume();
        return;
      }
      repeatCounterRef.current = 0;
      await playSurahInternal(surahNum);
    } else {
      const key = `${surahNum}:${verseNum}`;
      if (currentKey === key && isPlaying) {
        await pause();
        return;
      }
      if (currentKey === key && !isPlaying) {
        await resume();
        return;
      }
      repeatCounterRef.current = 0;
      await playInternal(surahNum, verseNum);
    }
  }, [currentKey, isPlaying, pause, resume, playInternal, playSurahInternal]);

  const playNext = useCallback(async (surahNum: number, verseNum: number) => {
    repeatCounterRef.current = 0;
    const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
    const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
    const isSurah = !!reciterEntry?.surahUrl;

    if (isSurah) {
      if (surahNum < 114) {
        await playSurahInternal(surahNum + 1);
      }
    } else {
      const surah = SURAHS.find((s) => s.number === surahNum);
      if (!surah) return;
      const nextIdx = surah.verses.findIndex((v) => v.number === verseNum) + 1;
      if (nextIdx < surah.verses.length) {
        await playInternal(surahNum, surah.verses[nextIdx].number);
      } else if (surahNum < 114) {
        await playInternal(surahNum + 1, 1);
      }
    }
  }, [playInternal, playSurahInternal]);

  const downloadSurah = useCallback(async (surahNum: number) => {
    const rid = reciterIdRef.current ?? DEFAULT_RECITER_ID;
    const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
    if (!reciterEntry) return;

    const surahPadded = padNum(surahNum, 3);
    const dir = FileSystem.cacheDirectory + "audio/";
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    if (reciterEntry.surahUrl) {
      const remoteUrl = reciterEntry.surahUrl.replace("{SSS}", surahPadded);
      const localUri = dir + `${rid}_${surahPadded}.mp3`;
      setDownloadProgress({ surahNum, percent: 0 });
      try {
        const downloadResumable = FileSystem.createDownloadResumable(
          remoteUrl,
          localUri,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress({ surahNum, percent: progress * 100 });
          }
        );
        await downloadResumable.downloadAsync();
      } catch (e) {
        console.error("Download failed", e);
      } finally {
        setDownloadProgress(null);
      }
    } else {
      const surah = SURAHS.find((s) => s.number === surahNum);
      if (!surah) return;
      const folder = reciterEntry.folder ?? "Alafasy_128kbps";
      setDownloadProgress({ surahNum, percent: 0 });
      let completed = 0;
      for (const v of surah.verses) {
        const versePadded = padNum(v.number, 3);
        const remoteUrl = `https://everyayah.com/data/${folder}/${surahPadded}${versePadded}.mp3`;
        const localUri = dir + `${rid}_${surahPadded}${versePadded}.mp3`;
        const info = await FileSystem.getInfoAsync(localUri);
        if (!info.exists) {
          try {
            await FileSystem.downloadAsync(remoteUrl, localUri);
          } catch (e) {}
        }
        completed++;
        setDownloadProgress({ surahNum, percent: (completed / surah.verses.length) * 100 });
      }
      setDownloadProgress(null);
    }
  }, []);

  const rid = reciterId ?? DEFAULT_RECITER_ID;
  const reciterEntry = RECITERS_LIST.find((r) => r.id === rid);
  const isSurahMode = !!reciterEntry?.surahUrl;

  return (
    <AudioCtx.Provider value={{
      currentKey, currentSurahNum, currentVerseNum,
      isLoading, isPlaying, playbackPosition, playbackDuration,
      isSurahMode,
      downloadProgress,
      downloadSurah,
      sleepTimer,
      sleepTimerActive: sleepTimer !== null,
      sleepTimerRemaining,
      setSleepTimer,
      play, stop, pause, resume, playNext,
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
