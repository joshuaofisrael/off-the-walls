import AsyncStorage from '@react-native-async-storage/async-storage';

/** v2 resets progress for the salaryman campaign (level ids were reused). */
const KEY = 'off-the-walls:unlocked:v2';

export async function loadUnlocked(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    const n = v ? parseInt(v, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

export async function unlockThrough(levelId: number): Promise<void> {
  try {
    const current = await loadUnlocked();
    const next = Math.max(current, levelId);
    await AsyncStorage.setItem(KEY, String(next));
  } catch {
    // ignore
  }
}
