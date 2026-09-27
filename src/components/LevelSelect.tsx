import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEVELS } from '../levels';
import { colors } from '../theme';

type Props = {
  unlocked: number;
  onBack: () => void;
  onPick: (levelId: number) => void;
};

export function LevelSelect({ unlocked, onBack, onPick }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Levels</Text>
        <View style={{ width: 56 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {LEVELS.map((lvl) => {
          const open = lvl.id <= unlocked;
          return (
            <Pressable
              key={lvl.id}
              disabled={!open}
              onPress={() => onPick(lvl.id)}
              style={[styles.row, !open && styles.rowLocked]}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{lvl.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{open ? lvl.name : 'Locked'}</Text>
                <Text style={styles.tag} numberOfLines={2}>
                  {open ? lvl.tagline : 'Beat the previous level to unlock'}
                </Text>
              </View>
              <Text style={styles.chev}>{open ? '→' : '🔒'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  back: { color: colors.aim, fontWeight: '700', fontSize: 16, width: 56 },
  title: { color: colors.text, fontWeight: '900', fontSize: 22 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.wallDark,
  },
  rowLocked: { opacity: 0.45 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#1e1b4b', fontWeight: '900' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  tag: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chev: { color: colors.text, fontSize: 18 },
});
