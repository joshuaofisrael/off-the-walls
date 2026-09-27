import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getLevel } from '../levels';
import {
  MAX_SPEED,
  add,
  aimFromDrag,
  circleCircleOverlap,
  clamp,
  len,
  movingWallAt,
  resolveCircleWall,
  scale,
} from '../physics';
import { colors } from '../theme';
import type { Distractor, GameStatus, Vec, Wall } from '../types';

type Props = {
  levelId: number;
  onWin: (levelId: number) => void;
  onExit: () => void;
};

type ActiveNotify = Distractor & { until: number };

export function GameScreen({ levelId, onWin, onExit }: Props) {
  const level = useMemo(() => getLevel(levelId)!, [levelId]);

  const [layout, setLayout] = useState({ w: 360, h: 640 });
  const [status, setStatus] = useState<GameStatus>('aiming');
  const [pos, setPos] = useState<Vec>({ ...level.start });
  const [vel, setVel] = useState<Vec>({ x: 0, y: 0 });
  const [bouncesLeft, setBouncesLeft] = useState(level.maxBounces);
  const [aimFinger, setAimFinger] = useState<Vec | null>(null);
  const [notifies, setNotifies] = useState<ActiveNotify[]>([]);
  const [message, setMessage] = useState(level.tagline);
  const [elapsed, setElapsed] = useState(0);
  const [wallsTick, setWallsTick] = useState(0);

  const statusRef = useRef(status);
  const posRef = useRef(pos);
  const velRef = useRef(vel);
  const bouncesRef = useRef(bouncesLeft);
  const elapsedRef = useRef(0);
  const launchAtRef = useRef(0);
  const firedDistractors = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const scaleRef = useRef({ sx: 1, sy: 1, ox: 0, oy: 0 });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    velRef.current = vel;
  }, [vel]);
  useEffect(() => {
    bouncesRef.current = bouncesLeft;
  }, [bouncesLeft]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    setStatus('aiming');
    setPos({ ...level.start });
    setVel({ x: 0, y: 0 });
    setBouncesLeft(level.maxBounces);
    setAimFinger(null);
    setNotifies([]);
    setMessage(level.tagline);
    setElapsed(0);
    elapsedRef.current = 0;
    launchAtRef.current = 0;
    firedDistractors.current = new Set();
  }, [level]);

  useEffect(() => {
    reset();
  }, [levelId, reset]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
    const sx = width / level.width;
    const sy = height / level.height;
    // letterbox to keep aspect
    const s = Math.min(sx, sy);
    const pw = level.width * s;
    const ph = level.height * s;
    scaleRef.current = {
      sx: s,
      sy: s,
      ox: (width - pw) / 2,
      oy: (height - ph) / 2,
    };
  };

  const toScreen = (v: Vec) => {
    const { sx, sy, ox, oy } = scaleRef.current;
    return { x: ox + v.x * sx, y: oy + v.y * sy };
  };
  const toLogical = (x: number, y: number): Vec => {
    const { sx, sy, ox, oy } = scaleRef.current;
    return { x: (x - ox) / sx, y: (y - oy) / sy };
  };

  const currentWalls = useCallback(
    (tMs: number): Wall[] => level.walls.map((w) => movingWallAt(w, tMs)),
    [level.walls],
  );

  const step = useCallback(
    (ts: number) => {
      if (statusRef.current !== 'flying') return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      let dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      dt = Math.min(dt, 0.033);

      elapsedRef.current += dt * 1000;
      setElapsed(elapsedRef.current);
      setWallsTick((n) => n + 1);

      let p = { ...posRef.current };
      let v = { ...velRef.current };

      // substeps for reliability
      const steps = 3;
      const sdt = dt / steps;
      let bouncedThisFrame = false;
      let hitHazard = false;
      let hitGoal = false;

      for (let i = 0; i < steps; i++) {
        p = add(p, scale(v, sdt));

        const walls = currentWalls(elapsedRef.current);
        for (const wall of walls) {
          if (wall.kind === 'hazard') {
            if (
              circleCircleOverlap(
                p.x,
                p.y,
                level.playerRadius,
                wall.x + wall.w / 2,
                wall.y + wall.h / 2,
                Math.min(wall.w, wall.h) / 2 + 2,
              ) ||
              // also rect overlap for thin hazards
              (p.x + level.playerRadius > wall.x &&
                p.x - level.playerRadius < wall.x + wall.w &&
                p.y + level.playerRadius > wall.y &&
                p.y - level.playerRadius < wall.y + wall.h)
            ) {
              hitHazard = true;
            }
            continue;
          }

          const res = resolveCircleWall(p, v, level.playerRadius, wall);
          if (res.bounced) {
            p = res.pos;
            v = res.vel;
            bouncedThisFrame = true;
          }
        }

        // keep in bounds soft clamp
        p.x = clamp(p.x, level.playerRadius, level.width - level.playerRadius);
        p.y = clamp(p.y, level.playerRadius, level.height - level.playerRadius);

        if (len(v) > MAX_SPEED) v = scale(v, MAX_SPEED / len(v));

        if (
          circleCircleOverlap(
            p.x,
            p.y,
            level.playerRadius,
            level.goal.x,
            level.goal.y,
            level.goalRadius,
          )
        ) {
          hitGoal = true;
          break;
        }
      }

      // distractors
      const sinceLaunch = elapsedRef.current - launchAtRef.current;
      const dist = level.distractors ?? [];
      for (const d of dist) {
        if (firedDistractors.current.has(d.id)) continue;
        if (sinceLaunch >= d.delayMs) {
          firedDistractors.current.add(d.id);
          v = add(v, d.impulse);
          setNotifies((prev) => [
            ...prev.filter((n) => n.until > elapsedRef.current),
            { ...d, until: elapsedRef.current + d.durationMs },
          ]);
          setMessage(d.text.trim());
        }
      }
      setNotifies((prev) => prev.filter((n) => n.until > elapsedRef.current));

      if (bouncedThisFrame) {
        const left = bouncesRef.current - 1;
        bouncesRef.current = left;
        setBouncesLeft(Math.max(0, left));
      }

      setPos(p);
      setVel(v);

      if (hitGoal) {
        setStatus('won');
        setVel({ x: 0, y: 0 });
        setMessage('Meds unlocked! 🎉');
        return;
      }
      if (hitHazard) {
        setStatus('lost');
        setVel({ x: 0, y: 0 });
        setMessage('Oof — hazard. Reset and ricochet again.');
        return;
      }
      if (bouncedThisFrame && bouncesRef.current < 0) {
        setStatus('lost');
        setVel({ x: 0, y: 0 });
        setMessage('Out of bounces — try a sharper angle!');
        return;
      }

      // stalled
      if (len(v) < 12 && elapsedRef.current - launchAtRef.current > 900) {
        setStatus('lost');
        setMessage('Stopped short — more power next time.');
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    },
    [currentWalls, level],
  );

  const launch = useCallback(
    (finger: Vec) => {
      if (statusRef.current !== 'aiming') return;
      const { dir, power } = aimFromDrag(posRef.current, finger);
      const v = scale(dir, power);
      setVel(v);
      velRef.current = v;
      setStatus('flying');
      statusRef.current = 'flying';
      setAimFinger(null);
      setMessage('Go Max go!');
      launchAtRef.current = elapsedRef.current;
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(step);
    },
    [step],
  );

  const launchRef = useRef(launch);
  launchRef.current = launch;

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === 'won') {
      const t = setTimeout(() => onWin(levelId), 650);
      return () => clearTimeout(t);
    }
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
    }),
  ).current;

  const { sx, ox, oy } = scaleRef.current;
  const walls = currentWalls(elapsed);
  void wallsTick;

  const aim =
    status === 'aiming' && aimFinger
      ? aimFromDrag(pos, aimFinger)
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.hud}>
        <Pressable onPress={onExit} hitSlop={10}>
          <Text style={styles.hudLink}>← Menu</Text>
        </Pressable>
        <View style={styles.hudCenter}>
          <Text style={styles.hudTitle}>
            {level.id}. {level.name}
          </Text>
          <Text style={styles.hudSub} numberOfLines={1}>
            {message}
          </Text>
        </View>
        <Text style={styles.hudBounces}>⚡ {Math.max(0, bouncesLeft)}</Text>
      </View>

      <View style={styles.play} onLayout={onLayout} {...pan.panHandlers}>
        <View
          style={[
            styles.field,
            {
              left: ox,
              top: oy,
              width: level.width * sx,
              height: level.height * sx,
            },
          ]}
        >
          {/* walls */}
          {walls.map((w) => {
            const color =
              w.kind === 'pad'
                ? colors.pad
                : w.kind === 'hazard'
                  ? colors.hazard
                  : w.kind === 'moving'
                    ? colors.wallDark
                    : colors.wall;
            return (
              <View
                key={w.id}
                style={{
                  position: 'absolute',
                  left: (w.x - 0) * sx,
                  top: (w.y - 0) * sx,
                  width: w.w * sx,
                  height: w.h * sx,
                  backgroundColor: color,
                  borderRadius: 4,
                  borderWidth: w.kind === 'pad' ? 2 : 0,
                  borderColor: colors.padDark,
                }}
              />
            );
          })}

          {/* goal pill bottle */}
          <View
            style={{
              position: 'absolute',
              left: (level.goal.x - level.goalRadius) * sx,
              top: (level.goal.y - level.goalRadius) * sx,
              width: level.goalRadius * 2 * sx,
              height: level.goalRadius * 2 * sx,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: level.goalRadius * 1.2 * sx,
                height: level.goalRadius * 1.6 * sx,
                backgroundColor: colors.goal,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: '#94a3b8',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  marginTop: -6 * sx,
                  width: level.goalRadius * 0.9 * sx,
                  height: 10 * sx,
                  backgroundColor: colors.goalCap,
                  borderRadius: 3,
                }}
              />
              <Text style={{ fontSize: 10 * sx, marginTop: 2 }}>💊</Text>
            </View>
          </View>

          {/* aim line (dotted path — RN-safe, no transformOrigin) */}
          {aim && (
            <>
              {Array.from({ length: 8 }).map((_, i) => {
                const dist = (Math.min(aim.drag, 140) * (i + 1)) / 8;
                return (
                  <View
                    key={`aim-${i}`}
                    style={{
                      position: 'absolute',
                      left: (pos.x + aim.dir.x * dist - 3) * sx,
                      top: (pos.y + aim.dir.y * dist - 3) * sx,
                      width: 6 * sx,
                      height: 6 * sx,
                      borderRadius: 99,
                      backgroundColor: colors.aim,
                      opacity: 0.35 + i * 0.08,
                    }}
                  />
                );
              })}
              <Text
                style={{
                  position: 'absolute',
                  left: pos.x * sx + 10,
                  top: pos.y * sx - 28,
                  color: colors.aim,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                PWR {Math.round((aim.power / 780) * 100)}%
              </Text>
            </>
          )}

          {/* Max */}
          <View
            style={{
              position: 'absolute',
              left: (pos.x - level.playerRadius) * sx,
              top: (pos.y - level.playerRadius) * sx,
              width: level.playerRadius * 2 * sx,
              height: level.playerRadius * 2 * sx,
              borderRadius: 999,
              backgroundColor: colors.max,
              borderWidth: 2,
              borderColor: colors.maxOutline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: level.playerRadius * 1.1 * sx }}>😄</Text>
          </View>

          {/* notification distractors */}
          {notifies.map((n) => (
            <View
              key={n.id}
              style={{
                position: 'absolute',
                left: n.x * sx,
                top: n.y * sx,
                backgroundColor: colors.notify,
                borderColor: colors.notifyBorder,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 6,
                maxWidth: 160 * sx,
              }}
            >
              <Text style={{ color: '#e2e8f0', fontSize: 11, fontWeight: '700' }}>
                {n.text.trim()}
              </Text>
            </View>
          ))}
        </View>

        {status === 'aiming' && !aimFinger && (
          <Text style={styles.hint}>Drag from Max to aim, release to launch</Text>
        )}
      </View>

      {(status === 'won' || status === 'lost') && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalEmoji}>{status === 'won' ? '💊✨' : '🌀'}</Text>
            <Text style={styles.modalTitle}>
              {status === 'won' ? 'Meds Unlocked!' : 'Almost — reset'}
            </Text>
            <Text style={styles.modalBody}>
              {status === 'won'
                ? 'Focus found. Chaotic path, solid finish. Affirming win for Max.'
                : message}
            </Text>
            {status === 'lost' && (
              <Pressable style={styles.primaryBtn} onPress={reset}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </Pressable>
            )}
            {status === 'won' && (
              <Text style={styles.modalNote}>Loading next…</Text>
            )}
            <Pressable style={styles.ghostBtn} onPress={onExit}>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
  },
  hudLink: { color: colors.aim, fontWeight: '700', width: 64 },
  hudCenter: { flex: 1 },
  hudTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  hudSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  hudBounces: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
    minWidth: 52,
    textAlign: 'right',
  },
  play: {
    flex: 1,
    backgroundColor: '#1a1440',
    overflow: 'hidden',
  },
  field: {
    position: 'absolute',
    backgroundColor: colors.bg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hint: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    color: colors.textMuted,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,10,30,0.72)',
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
    borderColor: colors.wall,
  },
  modalEmoji: { fontSize: 40 },
  modalTitle: { color: colors.text, fontWeight: '900', fontSize: 24 },
  modalBody: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalNote: { color: colors.win, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#1e1b4b', fontWeight: '900', fontSize: 16 },
  ghostBtn: { paddingVertical: 8 },
  ghostBtnText: { color: colors.aim, fontWeight: '700' },
});
