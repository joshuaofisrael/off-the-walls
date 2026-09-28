import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { bedForChapter, useMusic } from '../audio/MusicProvider';
import { chapterById } from '../chapters';
import { getLevel } from '../levels';
import { aimFromDrag, scale } from '../physics';
import { createSim, stepSim } from '../sim';
import { chapterTheme, colors } from '../theme';
import type { Sim, Vec } from '../types';
import { Playfield } from './Playfield';
import { SoundToggle } from './SoundToggle';

type Props = {
  levelId: number;
  onWin: (levelId: number) => void;
  onExit: () => void;
};

type ScaleBox = { s: number; ox: number; oy: number; pw: number; ph: number };

function formatUnpaid(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameScreen({ levelId, onWin, onExit }: Props) {
  const level = useMemo(() => getLevel(levelId)!, [levelId]);
  const chapter = chapterById(level.chapter);
  const theme = chapterTheme[level.chapter];
  const { setBed } = useMusic();

  const simRef = useRef<Sim>(createSim(level));
  const worldRef = useRef(0);
  const levelRef = useRef(level);
  const statusRef = useRef(simRef.current.status);
  const scaleRef = useRef<ScaleBox>({ s: 1, ox: 0, oy: 0, pw: 360, ph: 640 });
  const seenLevel = useRef(level.id);
  const [tick, setTick] = useState(0);
  const [aimFinger, setAimFinger] = useState<Vec | null>(null);
  const [box, setBox] = useState<ScaleBox>(scaleRef.current);

  if (seenLevel.current !== level.id) {
    seenLevel.current = level.id;
    simRef.current = createSim(level);
    worldRef.current = 0;
  }
  levelRef.current = level;
  statusRef.current = simRef.current.status;

  const retry = () => {
    simRef.current = createSim(level);
    statusRef.current = 'aiming';
    setAimFinger(null);
    setTick((n) => n + 1);
  };

  const toLogical = (x: number, y: number): Vec => {
    const { s, ox, oy } = scaleRef.current;
    return { x: (x - ox) / s, y: (y - oy) / s };
  };

  const launch = (finger: Vec) => {
    const current = simRef.current;
    if (current.status !== 'aiming') return;
    const { dir, power } = aimFromDrag(current.pos, finger);
    simRef.current = {
      ...current,
      vel: scale(dir, power),
      status: 'flying',
      message: 'Go, Max.',
      elapsedMs: 0,
      trail: [],
      hits: [],
      contacts: [],
      shake: 0,
    };
    statusRef.current = 'flying';
    setAimFinger(null);
  };
  const launchRef = useRef(launch);
  launchRef.current = launch;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.033);
      last = ts;
      worldRef.current += dt * 1000;
      if (simRef.current.status === 'flying') {
        simRef.current = stepSim(simRef.current, levelRef.current, dt, worldRef.current);
        statusRef.current = simRef.current.status;
      }
      setTick((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const status = simRef.current.status;
  const bed = bedForChapter(level.chapter);
  useEffect(() => {
    setBed(bed, status === 'won');
  }, [bed, status, setBed]);

  useEffect(() => {
    if (status !== 'won') return;
    const t = setTimeout(() => onWin(levelId), 900);
    return () => clearTimeout(t);
  }, [status, levelId, onWin]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => statusRef.current === 'aiming',
      onMoveShouldSetPanResponder: () => statusRef.current === 'aiming',
      onPanResponderGrant: (evt) => {
        if (statusRef.current !== 'aiming') return;
        const { locationX, locationY } = evt.nativeEvent;
        setAimFinger(toLogical(locationX, locationY));
      },
      onPanResponderMove: (evt) => {
        if (statusRef.current !== 'aiming') return;
        const { locationX, locationY } = evt.nativeEvent;
        setAimFinger(toLogical(locationX, locationY));
      },
      onPanResponderRelease: (evt) => {
        if (statusRef.current !== 'aiming') return;
        const { locationX, locationY } = evt.nativeEvent;
        launchRef.current(toLogical(locationX, locationY));
      },
      onPanResponderTerminate: () => setAimFinger(null),
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const s = Math.min(width / level.width, height / level.height);
    const pw = level.width * s;
    const ph = level.height * s;
    const next = { s, ox: (width - pw) / 2, oy: (height - ph) / 2, pw, ph };
    scaleRef.current = next;
    setBox(next);
  };

  const sim = simRef.current;
  const aim =
    sim.status === 'aiming' && aimFinger ? aimFromDrag(sim.pos, aimFinger) : null;
  const lowBounces = sim.bouncesLeft <= 3;
  const hasNext = Boolean(getLevel(levelId + 1));
  void tick;

  return (
    <View style={styles.root}>
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <Pressable onPress={onExit} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to levels">
            <Text style={styles.hudLink}>← Menu</Text>
          </Pressable>
          <SoundToggle />
        </View>
        <View style={styles.hudCenter}>
          <Text style={[styles.kicker, { color: theme.kicker }]}>
            {chapter.index}  {chapter.title.toUpperCase()}
          </Text>
          <Text style={styles.hudTitle} numberOfLines={1}>
            {level.id}. {level.name}
          </Text>
          <Text style={styles.hudSub} numberOfLines={1}>
            {sim.message}
          </Text>
        </View>
        <View style={styles.hudRight}>
          <Text style={[styles.hudBounces, lowBounces && styles.hudBouncesHot]}>
            {String(Math.max(0, sim.bouncesLeft)).padStart(2, '0')}
          </Text>
          <Text style={styles.bounceLabel}>BOUNCES</Text>
          <Text style={styles.unpaid}>UNPAID {formatUnpaid(sim.elapsedMs)}</Text>
        </View>
      </View>

      <View style={styles.play} onLayout={onLayout} {...pan.panHandlers}>
        <View style={{ position: 'absolute', left: box.ox, top: box.oy, width: box.pw, height: box.ph }}>
          <Playfield
            level={level}
            sim={sim}
            worldMs={worldRef.current}
            aim={aim}
            aimFinger={aimFinger}
            sx={box.s}
          />
        </View>
        {sim.status === 'aiming' && !aimFinger && (
          <Text style={styles.hint}>Drag from Max to aim · release to launch</Text>
        )}
      </View>

      {(sim.status === 'won' || sim.status === 'lost') && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalKicker}>{sim.status === 'won' ? 'CLEARED' : 'AGAIN'}</Text>
            <Text style={styles.modalTitle}>
              {sim.status === 'won' ? (level.winTitle ?? 'Meds Unlocked') : 'Back to Your Desk'}
            </Text>
            <Text style={styles.modalBody}>
              {sim.status === 'won'
                ? (level.winBody ?? 'Chaotic path, solid finish. The bottle is yours, Max.')
                : sim.message}
            </Text>
            {sim.status === 'lost' && (
              <Pressable style={styles.primaryBtn} onPress={retry} accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </Pressable>
            )}
            {sim.status === 'won' && (
              <Text style={styles.modalNote}>{hasNext ? 'Next level…' : 'Back to the board…'}</Text>
            )}
            <Pressable style={styles.ghostBtn} onPress={onExit} accessibilityRole="button">
              <Text style={styles.ghostBtnText}>Levels</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  hud: {
    paddingTop: 52,
    paddingBottom: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderBottomWidth: 2,
    borderBottomColor: colors.trainLine,
  },
  hudLeft: { width: 72, gap: 6 },
  hudLink: { color: colors.aim, fontWeight: '700' },
  hudCenter: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  hudTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  hudSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  hudRight: { alignItems: 'flex-end', minWidth: 78 },
  hudBounces: { color: colors.accent, fontWeight: '800', fontSize: 18, letterSpacing: 0.6 },
  hudBouncesHot: { color: colors.accentHot },
  bounceLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  modalKicker: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 2.4 },
  unpaid: { color: colors.overtime, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, marginTop: 2 },
  play: { flex: 1, backgroundColor: '#070b10', overflow: 'hidden' },
  hint: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    color: colors.text,
    fontWeight: '700',
    backgroundColor: 'rgba(8,12,18,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.45)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7,10,16,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#3d4d63',
  },
  modalTitle: { color: colors.text, fontWeight: '900', fontSize: 24, textAlign: 'center' },
  modalBody: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  modalNote: { color: colors.win, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  ghostBtn: { paddingVertical: 8 },
  ghostBtnText: { color: colors.aim, fontWeight: '700' },
});
