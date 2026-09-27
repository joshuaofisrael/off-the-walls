import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  onPlay: () => void;
  onLevels: () => void;
};

export function TitleScreen({ onPlay, onLevels }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🟡</Text>
        <Text style={styles.title}>Off The Walls</Text>
        <Text style={styles.sub}>
          Max has ADD, a plan, and zero chill.{'\n'}
          Bounce him to his meds.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to play</Text>
        <Text style={styles.cardLine}>1. Drag to aim · pull farther = more power</Text>
        <Text style={styles.cardLine}>2. Release to launch · ricochet off walls</Text>
        <Text style={styles.cardLine}>3. Hit the pill bottle · meds unlocked</Text>
        <Text style={styles.cardHint}>
          Warm, chaotic, affirming — never mocking. You and Max got this.
        </Text>
      </View>

      <Pressable style={styles.primary} onPress={onPlay}>
        <Text style={styles.primaryText}>Play</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onLevels}>
        <Text style={styles.secondaryText}>Level Select</Text>
      </Pressable>

      <Text style={styles.credit}>Joshua Israel Ventures LLC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center', gap: 10 },
  emoji: { fontSize: 64 },
  title: {
    color: colors.accent,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sub: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.wall,
  },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 18, marginBottom: 4 },
  cardLine: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  cardHint: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#1e1b4b', fontWeight: '900', fontSize: 18 },
  secondary: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.wall,
  },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  credit: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.7,
  },
});
