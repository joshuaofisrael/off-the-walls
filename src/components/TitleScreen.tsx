import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CHAPTERS } from '../chapters';
import { colors } from '../theme';

type Props = {
  onPlay: () => void;
  onLevels: () => void;
};

export function TitleScreen({ onPlay, onLevels }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.tube} />
        <Text style={styles.kicker}>SALARYMAN SHIFT</Text>
        <Text style={styles.title}>Off The Walls</Text>
        <Text style={styles.sub}>
          Max has ADD, a commuter pass, and a boss who pings past midnight.{'\n'}
          Bounce him through the overtime to his meds.
        </Text>
      </View>

      <View style={styles.board}>
        <Text style={styles.boardHead}>DEPARTURES</Text>
        {CHAPTERS.map((ch) => (
          <View key={ch.id} style={styles.boardRow}>
            <Text style={styles.boardIndex}>{ch.index}</Text>
            <Text style={styles.boardTitle}>{ch.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to play</Text>
        <Text style={styles.cardLine}>Drag from Max to aim. Farther means more power.</Text>
        <Text style={styles.cardLine}>Train doors slide. Wait for the gap, then launch.</Text>
        <Text style={styles.cardLine}>Green pads boost. Blue CC pads bank you across the floor.</Text>
        <Text style={styles.cardLine}>Coffee slicks speed the slide. Elevator shafts are safe — they lift you.</Text>
        <Text style={styles.cardLine}>A red REVIEW stamp sends you back to your desk to retry.</Text>
        <Text style={styles.cardHint}>Reach the amber bottle. Meds unlocked. The inbox can wait.</Text>
      </View>

      <Pressable style={styles.primary} onPress={onPlay} accessibilityRole="button">
        <Text style={styles.primaryText}>Badge In</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onLevels} accessibilityRole="button">
        <Text style={styles.secondaryText}>Level Select</Text>
      </Pressable>

      <Text style={styles.credit}>Joshua Israel Ventures LLC</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  content: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 36, gap: 16 },
  hero: { alignItems: 'center', gap: 8 },
  tube: {
    width: 140,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.fluorescent,
    marginBottom: 6,
  },
  kicker: { color: colors.accent, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: -0.6 },
  sub: { color: colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 23 },
  board: {
    backgroundColor: '#101610',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#345c34',
    gap: 4,
  },
  boardHead: { color: '#86efac', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 4 },
  boardRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  boardIndex: { color: colors.accent, fontWeight: '800', width: 28, fontVariant: ['tabular-nums'] },
  boardTitle: { color: '#d1fae5', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 16,
    gap: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 18, marginBottom: 2 },
  cardLine: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  cardHint: { color: colors.accent, fontSize: 13, marginTop: 6, fontWeight: '700' },
  primary: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: colors.ink, fontWeight: '900', fontSize: 18 },
  secondary: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d4d63',
  },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  credit: { color: colors.textMuted, textAlign: 'center', fontSize: 12, opacity: 0.75 },
});
