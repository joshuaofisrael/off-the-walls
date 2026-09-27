import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMusic } from '../audio/MusicProvider';
import { CHAPTERS } from '../chapters';
import { LEVELS } from '../levels';
import { chapterTheme, colors } from '../theme';
import { SoundToggle } from './SoundToggle';

type Props = {
  unlocked: number;
  onBack: () => void;
  onPick: (levelId: number) => void;
};

export function LevelSelect({ unlocked, onBack, onPick }: Props) {
  const { setBed } = useMusic();
  useEffect(() => {
    setBed('shift', false);
  }, [setBed]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Departures</Text>
        <SoundToggle />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {CHAPTERS.map((ch) => {
          const theme = chapterTheme[ch.id];
          const levels = LEVELS.filter((l) => l.chapter === ch.id);
          return (
            <View key={ch.id} style={styles.chapter}>
              <View style={[styles.chapterHead, { borderLeftColor: theme.rail }]}>
                <Text style={[styles.chapterKicker, { color: theme.kicker }]}>
                  {ch.index}  {ch.title.toUpperCase()}
                </Text>
                <Text style={styles.chapterBlurb}>{ch.blurb}</Text>
              </View>
              {levels.map((lvl) => {
                const open = lvl.id <= unlocked;
                return (
                  <Pressable
                    key={lvl.id}
                    disabled={!open}
                    onPress={() => onPick(lvl.id)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !open }}
                    style={[styles.row, !open && styles.rowLocked]}
                  >
                    <View style={[styles.badge, { backgroundColor: open ? theme.rail : '#334155' }]}>
                      <Text style={styles.badgeText}>{lvl.id}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{open ? lvl.name : 'Locked'}</Text>
                      <Text style={styles.tag} numberOfLines={2}>
                        {open ? lvl.tagline : 'Clear the previous stop to unlock'}
                      </Text>
                      {open && (
                        <View style={styles.pills}>
                          {lvl.mechanics.map((m) => (
                            <Text key={m} style={styles.pill}>
                              {m}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={styles.chev}>{open ? '→' : '•'}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, paddingTop: 52 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  back: { color: colors.aim, fontWeight: '700', fontSize: 16, width: 56 },
  title: { color: colors.text, fontWeight: '900', fontSize: 22 },
  list: { padding: 16, gap: 18, paddingBottom: 48 },
  chapter: { gap: 8 },
  chapterHead: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 2,
    marginTop: 4,
  },
  chapterKicker: { fontWeight: '900', letterSpacing: 1.2, fontSize: 12 },
  chapterBlurb: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowLocked: { opacity: 0.45 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.ink, fontWeight: '900' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  tag: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  pill: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(245,197,24,0.12)',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chev: { color: colors.text, fontSize: 18 },
});
