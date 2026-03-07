import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { Audio } from "expo-av";
import { getGlobalVerseNumber } from "@/constants/quranMeta";

const BASE_URL = "https://cdn.islamic.network/quran/audio/128/ar.alafasy/";

interface AudioContextValue {
  currentKey: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  play: (surahNum: number, verseNum: number) => Promise<void>;
  stop: () => Promise<void>;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setCurrentKey(null);
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(async (surahNum: number, verseNum: number) => {
    const key = `${surahNum}:${verseNum}`;
    if (currentKey === key && isPlaying) {
      await stop();
      return;
    }
    await stop();
    setCurrentKey(key);
    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const globalNum = getGlobalVerseNumber(surahNum, verseNum);
      const url = `${BASE_URL}${globalNum}.mp3`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsLoading(false);
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentKey(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentKey(null);
    }
  }, [currentKey, isPlaying, stop]);

  return (
    <AudioCtx.Provider value={{ currentKey, isLoading, isPlaying, play, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
