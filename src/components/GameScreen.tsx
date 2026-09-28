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
import { colors, fonts } from '../theme';
import type { Distractor, GameStatus, Vec, Wall } from '../types';
import { MAX_ANCHOR_Y, MAX_VIEW, MaxSprite } from './MaxSprite';
import { CourtSurface, FieldPiece, MedsBottle, Notice, OfficeBackdrop } from './office';

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
  const trailRef = useRef<Vec[]>([]);
  const shakeRef = useRef(0);

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
    trailRef.current = [];
    shakeRef.current = 0;
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
        shakeRef.current = Math.min(5.5, shakeRef.current + 4.2);
      }

      shakeRef.current *= 0.84;
      if (shakeRef.current < 0.25) shakeRef.current = 0;

      const lastTrail = trailRef.current[trailRef.current.length - 1];
      if (!lastTrail || Math.hypot(p.x - lastTrail.x, p.y - lastTrail.y) > 9) {
        trailRef.current.push({ x: p.x, y: p.y });
        if (trailRef.current.length > 12) trailRef.current.shift();
      }

      setPos(p);
      setVel(v);

      if (hitGoal) {
        shakeRef.current = 0;
        setStatus('won');
        setVel({ x: 0, y: 0 });
        setMessage('Meds unlocked.');
        return;
      }
      if (hitHazard) {
        shakeRef.current = 0;
        setStatus('lost');
        setVel({ x: 0, y: 0 });
        setMessage('Oof — hazard. Reset and ricochet again.');
        return;
      }
      if (bouncedThisFrame && bouncesRef.current < 0) {
        shakeRef.current = 0;
        setStatus('lost');
        setVel({ x: 0, y: 0 });
        setMessage('Out of bounces — try a sharper angle!');
        return;
      }

      if (len(v) < 12 && elapsedRef.current - launchAtRef.current > 900) {
        shakeRef.current = 0;
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
      trailRef.current = [];
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
  void layout;

  const aim =
    status === 'aiming' && aimFinger
      ? aimFromDrag(pos, aimFinger)
      : null;

  const flying = status === 'flying';
  const rotation =
    flying && len(vel) > 20 ? (Math.atan2(vel.y, vel.x) * 180) / Math.PI + 90 : 0;
  const spriteH = level.playerRadius * 4.55 * sx;
  const spriteW = spriteH * (MAX_VIEW.w / MAX_VIEW.h);
  const shake = shakeRef.current;
  const shx = shake ? Math.sin(elapsed * 0.045) * shake : 0;
  const shy = shake ? Math.cos(elapsed * 0.07) * shake : 0;
  const trail = trailRef.current;
  const fieldW = level.width * sx;
  const fieldH = level.height * sx;

  return (
    <View style={styles.root}>
      <OfficeBackdrop />
      <View style={styles.hud}>
        <Pressable onPress={onExit} hitSlop={10} style={styles.menuBtn}>
          <Text style={styles.menuText}>MENU</Text>
        </Pressable>
        <View style={styles.hudCenter}>
          <Text style={styles.hudKicker}>GATE {String(level.id).padStart(2, '0')}</Text>
          <Text style={styles.hudTitle} numberOfLines={1}>
            {level.name}
          </Text>
          <Text style={styles.hudSub} numberOfLines={1}>
            {message}
          </Text>
        </View>
        <View style={styles.bounceBox}>
          <Text style={styles.bounceLabel}>LEFT</Text>
          <Text style={styles.bounceValue}>
            {String(Math.max(0, bouncesLeft)).padStart(2, '0')}
          </Text>
        </View>
      </View>

      <View style={styles.play} onLayout={onLayout} {...pan.panHandlers}>
        <View
          style={[
            styles.field,
            {
              left: ox,
              top: oy,
              width: fieldW,
              height: fieldH,
              transform: [{ translateX: shx }, { translateY: shy }],
            },
          ]}
        >
          <CourtSurface width={fieldW} height={fieldH} />

          {trail.map((t, i) => {
            const k = (i + 1) / trail.length;
            const d = (2.2 + k * 4.2) * sx;
            return (
              <View
                key={`trail-${i}`}
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: t.x * sx - d / 2,
                  top: t.y * sx - d / 2,
                  width: d,
                  height: d,
                  borderRadius: 99,
                  backgroundColor: k > 0.65 ? colors.fluorescent : colors.accent,
                  opacity: 0.08 + k * 0.28,
                }}
              />
            );
          })}

          {walls.map((w) => (
            <FieldPiece key={w.id} wall={w} s={sx} />
          ))}

          <View
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: (pos.x - level.playerRadius * 1.05) * sx,
              top: (pos.y + level.playerRadius * 0.95) * sx,
              width: level.playerRadius * 2.1 * sx,
              height: level.playerRadius * 0.48 * sx,
              borderRadius: 99,
              backgroundColor: '#000',
              opacity: flying ? 0.16 : 0.32,
            }}
          />

          <View
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: (level.goal.x - level.goalRadius) * sx,
              top: (level.goal.y - level.goalRadius) * sx,
              width: level.goalRadius * 2 * sx,
              height: level.goalRadius * 2 * sx,
            }}
          >
            <MedsBottle size={level.goalRadius * 2 * sx} />
          </View>

          {aim && (
            <>
              {Array.from({ length: 8 }).map((_, i) => {
                const dist =
                  level.playerRadius * 2.15 + (Math.min(aim.drag, 140) * (i + 1)) / 8;
                const dot = (3.2 + i * 0.35) * sx;
                return (
                  <View
                    key={`aim-${i}`}
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      left: (pos.x + aim.dir.x * dist) * sx - dot / 2,
                      top: (pos.y + aim.dir.y * dist) * sx - dot / 2,
                      width: dot,
                      height: dot,
                      borderRadius: 1,
                      backgroundColor: i > 5 ? colors.accent : colors.fluorescent,
                      opacity: 0.28 + i * 0.08,
                      transform: [{ rotate: '45deg' }],
                    }}
                  />
                );
              })}
              <View
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: pos.x * sx - 28,
                  top: (pos.y - level.playerRadius * 2.6) * sx,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 3,
                  backgroundColor: 'rgba(8,10,14,0.82)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.panelLine,
                }}
              >
                <Text style={styles.powerText}>
                  PWR {Math.round((aim.power / 780) * 100)}
                </Text>
              </View>
            </>
          )}

          <View
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: pos.x * sx - spriteW / 2,
              top: pos.y * sx - spriteH * MAX_ANCHOR_Y,
            }}
          >
            <MaxSprite height={spriteH} pose={flying ? 'flight' : 'idle'} rotation={rotation} />
          </View>

          {notifies.map((n) => (
            <View
              key={n.id}
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                left: n.x * sx,
                top: n.y * sx,
              }}
            >
              <Notice text={n.text} maxWidth={168 * sx} />
            </View>
          ))}
        </View>

        {status === 'aiming' && !aimFinger && (
          <Text style={styles.hint}>Drag to aim  ·  release to launch</Text>
        )}
      </View>

      {(status === 'won' || status === 'lost') && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {status === 'won' ? (
              <MedsBottle size={72} />
            ) : (
              <Text style={styles.modalKicker}>AGAIN</Text>
            )}
            <Text style={styles.modalTitle}>
              {status === 'won' ? 'Meds Unlocked' : 'Almost — reset'}
            </Text>
            <Text style={styles.modalBody}>
              {status === 'won'
                ? 'Focus found. Chaotic path, solid finish. Affirming win for Max.'
                : message}
            </Text>
            {status === 'lost' && (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={reset}
              >
                <Text style={styles.primaryBtnText}>RETRY</Text>
              </Pressable>
            )}
            {status === 'won' && <Text style={styles.modalNote}>Loading next…</Text>}
            <Pressable style={styles.ghostBtn} onPress={onExit}>
              <Text style={styles.ghostBtnText}>DEPARTURES</Text>
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
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.panelLine,
    backgroundColor: 'rgba(8,10,14,0.62)',
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: colors.panelLine,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  menuText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  hudCenter: { flex: 1 },
  hudKicker: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  hudTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    marginTop: 1,
  },
  hudSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  bounceBox: {
    minWidth: 46,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.panelLine,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(228,196,138,0.06)',
  },
  bounceLabel: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  bounceValue: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 16,
    letterSpacing: 1,
  },
  play: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  field: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228,196,138,0.32)',
  },
  powerText: {
    color: colors.fluorescent,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  hint: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
    backgroundColor: 'rgba(8,10,14,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.panelLine,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7,8,12,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.panelLine,
  },
  modalKicker: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 4,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    textAlign: 'center',
  },
  modalBody: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalNote: { color: colors.win, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1a140c',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2.2,
  },
  pressed: { opacity: 0.88 },
  ghostBtn: { paddingVertical: 8 },
  ghostBtnText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1.8,
  },
});
