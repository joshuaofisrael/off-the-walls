import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useMusic } from '../audio/MusicProvider';
import { colors } from '../theme';

export function SoundToggle() {
  const { muted, toggleMuted } = useMusic();
  return (
    <Pressable
      onPress={toggleMuted}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={muted ? 'Unmute music' : 'Mute music'}
      style={[styles.btn, muted && styles.btnMuted]}
    >
      <Text style={[styles.label, muted && styles.labelMuted]}>{muted ? 'MUTE' : 'SND'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(245, 197, 24, 0.12)',
  },
  btnMuted: {
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  label: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  labelMuted: { color: colors.textMuted },
});
