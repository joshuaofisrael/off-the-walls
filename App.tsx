import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { MusicProvider } from './src/audio/MusicProvider';
import { GameScreen } from './src/components/GameScreen';
import { LevelSelect } from './src/components/LevelSelect';
import { TitleScreen } from './src/components/TitleScreen';
import { LEVELS } from './src/levels';
import { loadUnlocked, unlockThrough } from './src/progress';
import { colors } from './src/theme';
import type { Screen } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [levelId, setLevelId] = useState(1);
  const [unlocked, setUnlocked] = useState(1);

  useEffect(() => {
    loadUnlocked().then(setUnlocked);
  }, []);

  const startLevel = useCallback((id: number) => {
    setLevelId(id);
    setScreen('game');
  }, []);

  const onWin = useCallback(async (id: number) => {
    const nextUnlock = Math.min(id + 1, LEVELS[LEVELS.length - 1].id);
    await unlockThrough(nextUnlock);
    setUnlocked((u) => Math.max(u, nextUnlock));
    const next = LEVELS.find((l) => l.id === id + 1);
    if (next) {
      setLevelId(next.id);
    } else {
      setScreen('levels');
    }
  }, []);

  return (
    <MusicProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe}>
          {screen === 'title' && (
            <TitleScreen
              onPlay={() => startLevel(Math.min(unlocked, LEVELS[LEVELS.length - 1].id))}
              onLevels={() => setScreen('levels')}
            />
          )}
          {screen === 'levels' && (
            <LevelSelect
              unlocked={unlocked}
              onBack={() => setScreen('title')}
              onPick={startLevel}
            />
          )}
          {screen === 'game' && (
            <GameScreen
              levelId={levelId}
              onWin={onWin}
              onExit={() => setScreen('levels')}
            />
          )}
        </SafeAreaView>
      </View>
    </MusicProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  safe: { flex: 1 },
});
