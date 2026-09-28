import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ChapterId } from '../types';

/**
 * Original beds in assets/audio, synthesized by scripts/compose-bgm.mjs.
 * expo-av was removed from Expo Go in SDK 55, so playback uses expo-audio.
 * playsInSilentMode: false follows the iOS silent switch (and Android silent/vibrate).
 */
const MUTE_KEY = 'off-the-walls:bgm-muted';
const fluorescent = require('../../assets/audio/fluorescent.wav');
const overtimeBed = require('../../assets/audio/overtime.wav');

export type Bed = 'shift' | 'overtime';

type MusicApi = {
  muted: boolean;
  toggleMuted: () => void;
  setBed: (bed: Bed, ducked?: boolean) => void;
};

const MusicContext = createContext<MusicApi | null>(null);

export function bedForChapter(chapter: ChapterId): Bed {
  return chapter === 'overtime' || chapter === 'boss' ? 'overtime' : 'shift';
}

function volumeFor(bed: Bed, ducked: boolean) {
  const base = bed === 'overtime' ? 0.62 : 0.5;
  return ducked ? base * 0.38 : base;
}

function fadePlayer(player: AudioPlayer, to: number, timers: Array<ReturnType<typeof setInterval>>, done?: () => void) {
  const from = typeof player.volume === 'number' ? player.volume : 0;
  if (Math.abs(from - to) < 0.012) {
    player.volume = to;
    done?.();
    return;
  }
  const steps = 10;
  let i = 0;
  const id = setInterval(() => {
    i += 1;
    const u = Math.min(1, i / steps);
    try {
      player.volume = from + (to - from) * u;
    } catch {
      clearInterval(id);
      return;
    }
    if (u >= 1) {
      clearInterval(id);
      done?.();
    }
  }, 60);
  timers.push(id);
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const shift = useAudioPlayer(fluorescent);
  const rush = useAudioPlayer(overtimeBed);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [bed, setBedState] = useState<Bed>('shift');
  const [ducked, setDucked] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: false,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
        });
      } catch {
        // The puzzle still runs if the audio session cannot be configured.
      }
      try {
        const stored = await AsyncStorage.getItem(MUTE_KEY);
        if (!cancel && stored === '1') setMuted(true);
      } catch {
        // Default is music on.
      }
      if (!cancel) setReady(true);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timers: Array<ReturnType<typeof setInterval>> = [];
    const active = bed === 'overtime' ? rush : shift;
    const idle = bed === 'overtime' ? shift : rush;
    try {
      shift.loop = true;
      rush.loop = true;
      shift.muted = muted;
      rush.muted = muted;
      if (!muted) {
        const target = volumeFor(bed, ducked);
        if (!active.playing) {
          active.volume = 0;
          active.play();
        }
        fadePlayer(active, target, timers);
        fadePlayer(idle, 0, timers, () => {
          try {
            if (idle.playing) idle.pause();
            void idle.seekTo(0);
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // Audio is optional.
    }
    return () => {
      for (const id of timers) clearInterval(id);
    };
  }, [ready, muted, bed, ducked, shift, rush]);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      AsyncStorage.setItem(MUTE_KEY, next ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  const setBed = useCallback((next: Bed, nextDucked = false) => {
    setBedState(next);
    setDucked(nextDucked);
  }, []);

  const api = useMemo(() => ({ muted, toggleMuted, setBed }), [muted, toggleMuted, setBed]);

  return <MusicContext.Provider value={api}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used inside MusicProvider');
  }
  return ctx;
}
