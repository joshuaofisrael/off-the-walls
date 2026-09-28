import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEVELS } from '../levels';
import { colors, fonts } from '../theme';
import { OfficeBackdrop } from './office';

type Props = {
  unlocked: number;
  onBack: () => void;
  onPick: (levelId: number) => void;
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function LevelSelect({ unlocked, onBack, onPick }: Props) {
  const time = useClock();

  return (
    <View style={styles.root}>
      <OfficeBackdrop />
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <View style={styles.chev} />
          <Text style={styles.back}>BACK</Text>
        </Pressable>
        <Text style={styles.headerMeta}>FOCUS LINE</Text>
      </View>

      <View style={styles.board}>
        <View style={styles.boardTop}>
          <View>
            <Text style={styles.kicker}>TERMINAL B</Text>
            <Text style={styles.title}>DEPARTURES</Text>
          </View>
          <View style={styles.clockBlock}>
            <View style={styles.led} />
            <Text style={styles.clock}>{time}</Text>
            <Text style={styles.clockLabel}>LOCAL</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <Text style={[styles.col, styles.colGate]}>GATE</Text>
          <Text style={[styles.col, styles.colDest]}>DESTINATION</Text>
          <Text style={[styles.col, styles.colStatus]}>STATUS</Text>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {LEVELS.map((lvl) => {
            const open = lvl.id <= unlocked;
            return (
              <Pressable
                key={lvl.id}
                disabled={!open}
                onPress={() => onPick(lvl.id)}
                style={({ pressed }) => [
                  styles.row,
                  !open && styles.rowLocked,
                  pressed && open && styles.rowPressed,
                ]}
              >
                <Text style={styles.gate}>{String(lvl.id).padStart(2, '0')}</Text>
                <View style={styles.dest}>
                  <Text style={styles.name} numberOfLines={1}>
                    {open ? lvl.name : '— — —'}
                  </Text>
                  <Text style={styles.tag} numberOfLines={2}>
                    {open ? lvl.tagline : 'Clear the previous gate to board'}
                  </Text>
                </View>
                <View style={[styles.status, open ? styles.statusOpen : styles.statusHold]}>
                  <Text style={[styles.statusText, open && styles.statusTextOpen]}>
                    {open ? 'BOARD' : 'HOLD'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.foot}>
          {String(LEVELS.length).padStart(2, '0')} GATES · CLEAR TO ADVANCE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chev: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  back: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1.8,
  },
  headerMeta: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
  },
  board: {
    flex: 1,
    backgroundColor: 'rgba(8,10,14,0.88)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.panelLine,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  boardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  kicker: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.4,
  },
  title: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 26,
    letterSpacing: 3,
    marginTop: 2,
  },
  clockBlock: { alignItems: 'flex-end', gap: 2 },
  led: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginBottom: 2,
  },
  clock: {
    color: colors.fluorescent,
    fontFamily: fonts.mono,
    fontSize: 16,
    letterSpacing: 1,
  },
  clockLabel: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(228,196,138,0.28)',
  },
  col: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  colGate: { width: 44 },
  colDest: { flex: 1 },
  colStatus: { width: 58, textAlign: 'right' },
  list: { paddingTop: 4, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLocked: { opacity: 0.42 },
  rowPressed: { backgroundColor: 'rgba(228,196,138,0.06)' },
  gate: {
    width: 44,
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 1,
  },
  dest: { flex: 1, paddingRight: 8 },
  name: {
    color: colors.fluorescent,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tag: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  status: {
    minWidth: 58,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOpen: {
    borderColor: 'rgba(228,196,138,0.7)',
    backgroundColor: 'rgba(228,196,138,0.1)',
  },
  statusHold: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textDim,
  },
  statusTextOpen: { color: colors.accent },
  foot: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 8,
  },
});
