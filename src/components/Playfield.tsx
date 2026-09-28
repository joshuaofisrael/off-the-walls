import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { movingWallAt, paddleAngle, powerT } from '../physics';
import { chapterTheme, colors, mixHex } from '../theme';
import type { HitFx, HitKind, LevelDef, Sim, Vec, Wall, Zone } from '../types';
import { MAX_ANCHOR_Y, MAX_VIEW, MaxSprite } from './MaxSprite';

type Aim = { dir: Vec; power: number; drag: number };

type Props = {
  level: LevelDef;
  sim: Sim;
  worldMs: number;
  aim: Aim | null;
  aimFinger: Vec | null;
  sx: number;
};

const HIT_COLOR: Record<HitKind, string> = {
  wall: '#e7fff6',
  door: '#f5c518',
  pad: '#3ee0a2',
  reverse: '#7dd3fc',
  paddle: '#fdba74',
};

function beltPointsRight(zone: Zone) {
  const dir = zone.dir ?? { x: 1, y: 0 };
  return Math.abs(dir.x) >= Math.abs(dir.y) ? dir.x >= 0 : dir.y >= 0;
}

export function Playfield({ level, sim, worldMs, aim, aimFinger, sx }: Props) {
  const theme = chapterTheme[level.chapter];
  const flicker = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(worldMs / 420));
  const walls = level.walls.map((w) => movingWallAt(w, worldMs));
  const shake = sim.shake * 7 * sx;
  const shakeX = Math.sin(worldMs * 0.09) * shake;
  const shakeY = Math.cos(worldMs * 0.13) * shake;
  const train = level.chapter === 'commute' || level.chapter === 'finale';

  return (
    <View style={[styles.field, { backgroundColor: theme.field }]}>
      <Backdrop sx={sx} flicker={flicker} themeColor={theme.fluorescent} />
      <View style={{ flex: 1, transform: [{ translateX: shakeX }, { translateY: shakeY }] }}>
        {(level.zones ?? []).map((zone) => (
          <ZoneView key={zone.id} zone={zone} sx={sx} />
        ))}
        {walls.map((w) => (
          <WallView key={w.id} wall={w} sx={sx} train={train} />
        ))}
        {(level.paddles ?? []).map((paddle) => {
          const angle = paddleAngle(paddle, worldMs);
          const deg = `${(angle * 180) / Math.PI}deg`;
          return (
            <View
              key={paddle.id}
              style={{
                position: 'absolute',
                left: (paddle.x - paddle.length / 2) * sx,
                top: (paddle.y - paddle.thickness / 2) * sx,
                width: paddle.length * sx,
                height: paddle.thickness * sx,
                borderRadius: 4 * sx,
                backgroundColor: colors.paddle,
                borderWidth: 2,
                borderColor: colors.paddleDark,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: deg }],
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 10 * sx,
                  height: 10 * sx,
                  borderRadius: 99,
                  backgroundColor: colors.ink,
                  borderWidth: 2,
                  borderColor: colors.accent,
                }}
              />
            </View>
          );
        })}
        <Bottle goal={level.goal} radius={level.goalRadius} sx={sx} />
        {sim.trail.map((p, i) => {
          const t = (i + 1) / sim.trail.length;
          const size = (2.5 + t * 7) * sx;
          return (
            <View
              key={`tr-${i}`}
              style={{
                position: 'absolute',
                left: p.x * sx - size / 2,
                top: p.y * sx - size / 2,
                width: size,
                height: size,
                borderRadius: size,
                backgroundColor: sim.zone === 'slick' ? colors.slickHighlight : colors.fluorescent,
                opacity: 0.15 + t * 0.5,
              }}
            />
          );
        })}
        {sim.hits.map((hit) => (
          <HitBurst key={hit.id} hit={hit} sx={sx} />
        ))}
        {aim && <AimGuide pos={sim.pos} aim={aim} finger={aimFinger} sx={sx} />}
        <Max sim={sim} radius={level.playerRadius} sx={sx} />
        {sim.notifies.map((n) => (
          <View
            key={n.id}
            style={{
              position: 'absolute',
              left: n.x * sx,
              top: n.y * sx,
              backgroundColor: colors.notify,
              borderColor: colors.notifyBorder,
              borderWidth: 1,
              borderLeftWidth: 4,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 6,
              maxWidth: 168 * sx,
            }}
          >
            <Text style={styles.pingKicker}>BOSS</Text>
            <Text style={styles.pingText}>{n.text.trim()}</Text>
          </View>
        ))}
        {sim.shake > 0.08 && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#fff', opacity: sim.shake * 0.14 },
            ]}
          />
        )}
      </View>
    </View>
  );
}

function Backdrop({
  sx,
  flicker,
  themeColor,
}: {
  sx: number;
  flicker: number;
  themeColor: string;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 28 * sx,
            right: 28 * sx,
            top: (48 + i * 110) * sx,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: 28 * sx,
          right: 28 * sx,
          top: 22 * sx,
          height: 8 * sx,
          borderRadius: 99,
          backgroundColor: themeColor,
          opacity: flicker,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 48 * sx,
          right: 48 * sx,
          top: 34 * sx,
          height: 18 * sx,
          backgroundColor: themeColor,
          opacity: 0.08 * flicker,
        }}
      />
    </View>
  );
}

function ZoneView({ zone, sx }: { zone: Zone; sx: number }) {
  const right = beltPointsRight(zone);
  if (zone.kind === 'belt') {
    return (
      <View
        style={{
          position: 'absolute',
          left: zone.x * sx,
          top: zone.y * sx,
          width: zone.w * sx,
          height: zone.h * sx,
          backgroundColor: 'rgba(111, 83, 56, 0.55)',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: colors.beltDark,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: right ? 'row' : 'row-reverse', justifyContent: 'space-evenly' }}>
          {[0, 1, 2, 3].map((i) => (
            <Text key={i} style={{ color: colors.beltArrow, fontWeight: '900', fontSize: 14 * sx, opacity: 0.8 }}>
              {right ? '›' : '‹'}
            </Text>
          ))}
        </View>
      </View>
    );
  }
  if (zone.kind === 'slick') {
    return (
      <View
        style={{
          position: 'absolute',
          left: zone.x * sx,
          top: zone.y * sx,
          width: zone.w * sx,
          height: zone.h * sx,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 6 * sx,
            top: 10 * sx,
            width: zone.w * sx * 0.72,
            height: zone.h * sx * 0.62,
            borderRadius: 999,
            backgroundColor: colors.slick,
            opacity: 0.72,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: zone.w * sx * 0.28,
            top: zone.h * sx * 0.22,
            width: zone.w * sx * 0.46,
            height: zone.h * sx * 0.28,
            borderRadius: 999,
            backgroundColor: colors.slickHighlight,
            opacity: 0.35,
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={{
        position: 'absolute',
        left: zone.x * sx,
        top: zone.y * sx,
        width: zone.w * sx,
        height: zone.h * sx,
        backgroundColor: 'rgba(16, 70, 58, 0.35)',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: colors.shaftGlow,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8 * sx,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Text key={i} style={{ color: colors.shaftGlow, fontSize: 12 * sx, fontWeight: '900', opacity: 0.85 }}>
          ▲
        </Text>
      ))}
    </View>
  );
}

function WallView({ wall, sx, train }: { wall: Wall; sx: number; train: boolean }) {
  const border = wall.id === 'floor' || wall.id === 'ceil' || wall.id === 'left' || wall.id === 'right';
  let background = border ? '#1a2230' : '#d5dee8';
  let borderColor = 'transparent';
  let borderWidth = 0;
  if (wall.kind === 'pad') {
    background = colors.pad;
    borderColor = colors.padDark;
    borderWidth = 2;
  } else if (wall.kind === 'hazard') {
    background = colors.hazard;
    borderColor = colors.hazardDark;
    borderWidth = 2;
  } else if (wall.kind === 'reverse') {
    background = colors.reverse;
    borderColor = colors.reverseDark;
    borderWidth = 2;
  } else if (wall.kind === 'door') {
    background = colors.door;
    borderColor = '#94a3b8';
    borderWidth = 1;
  } else if (wall.kind === 'moving') {
    background = '#c6a36a';
    borderColor = '#f0d7a8';
    borderWidth = 1;
  } else if (!border) {
    borderColor = 'rgba(255,255,255,0.55)';
    borderWidth = 1;
  }

  const showLabel = Boolean(wall.label) && wall.w >= 32 && wall.h >= 12;
  return (
    <View
      style={{
        position: 'absolute',
        left: wall.x * sx,
        top: wall.y * sx,
        width: wall.w * sx,
        height: wall.h * sx,
        backgroundColor: background,
        borderRadius: border ? 0 : 4,
        borderWidth,
        borderColor,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {wall.kind === 'door' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 3 * sx,
              top: 2 * sx,
              bottom: 2 * sx,
              width: 5 * sx,
              backgroundColor: colors.doorStripe,
            }}
          />
          <View
            style={{
              width: Math.max(4, wall.w * sx * 0.35),
              height: Math.max(4, wall.h * sx * 0.45),
              borderRadius: 2,
              backgroundColor: colors.doorGlass,
              opacity: 0.85,
            }}
          />
        </>
      )}
      {wall.kind === 'pad' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '42%', backgroundColor: 'rgba(255,255,255,0.28)' }} />
      )}
      {wall.kind === 'hazard' &&
        Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4 * sx,
              height: wall.h * sx * 3,
              backgroundColor: 'rgba(245,197,24,0.82)',
              left: i * 12 * sx - wall.h * sx,
              top: -wall.h * sx,
              transform: [{ rotate: '32deg' }],
            }}
          />
        ))}
      {!border && !wall.kind && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '36%', backgroundColor: 'rgba(255,255,255,0.28)' }} />
      )}
      {wall.kind === 'moving' && (
        <>
          <View style={{ position: 'absolute', left: 4 * sx, width: 4 * sx, height: 4 * sx, borderRadius: 2, backgroundColor: '#4a341c' }} />
          <View style={{ position: 'absolute', right: 4 * sx, width: 4 * sx, height: 4 * sx, borderRadius: 2, backgroundColor: '#4a341c' }} />
        </>
      )}
      {train && wall.id === 'floor' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4 * sx, backgroundColor: colors.trainLine }} />
      )}
      {wall.id === 'ceil' && (
        <View style={{ position: 'absolute', left: 18 * sx, right: 18 * sx, bottom: 2 * sx, height: 3 * sx, backgroundColor: colors.fluorescent, opacity: 0.8 }} />
      )}
      {showLabel && (
        <Text style={{ color: wall.kind === 'hazard' ? '#fff' : colors.ink, fontSize: Math.max(8, 9 * sx), fontWeight: '900' }}>
          {wall.label}
        </Text>
      )}
    </View>
  );
}

function Bottle({ goal, radius, sx }: { goal: Vec; radius: number; sx: number }) {
  const w = radius * 1.15 * sx;
  const h = radius * 1.7 * sx;
  return (
    <View
      style={{
        position: 'absolute',
        left: (goal.x - radius) * sx,
        top: (goal.y - radius) * sx,
        width: radius * 2 * sx,
        height: radius * 2 * sx,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: w,
          height: h,
          backgroundColor: colors.goal,
          borderRadius: 5 * sx,
          borderWidth: 1.5,
          borderColor: '#b45309',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            marginTop: -5 * sx,
            width: w * 0.72,
            height: 8 * sx,
            backgroundColor: colors.goalCap,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#cbd5e1',
          }}
        />
        <View
          style={{
            marginTop: 4 * sx,
            width: w * 0.72,
            height: h * 0.42,
            backgroundColor: '#fffaf0',
            borderRadius: 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.goalLabel, fontWeight: '800', fontSize: Math.max(8, 9 * sx) }}>Rx</Text>
        </View>
      </View>
    </View>
  );
}

function Max({ sim, radius, sx }: { sim: Sim; radius: number; sx: number }) {
  const speed = Math.hypot(sim.vel.x, sim.vel.y);
  const flying = sim.status === 'flying' && speed > 20;
  const rotation = flying ? (Math.atan2(sim.vel.y, sim.vel.x) * 180) / Math.PI + 90 : 0;
  const spriteH = radius * 4.35 * sx;
  const spriteW = spriteH * (MAX_VIEW.w / MAX_VIEW.h);
  const ring =
    sim.zone === 'shaft'
      ? colors.shaftGlow
      : sim.zone === 'slick'
        ? colors.slickHighlight
        : sim.zone === 'belt'
          ? colors.beltArrow
          : null;
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: (sim.pos.x - radius * 1.05) * sx,
          top: (sim.pos.y + radius * 0.85) * sx,
          width: radius * 2.1 * sx,
          height: radius * 0.42 * sx,
          borderRadius: 99,
          backgroundColor: '#000',
          opacity: flying ? 0.16 : 0.32,
        }}
      />
      {ring && (
        <View
          style={{
            position: 'absolute',
            left: (sim.pos.x - radius * 0.7) * sx,
            top: (sim.pos.y - radius * 0.7) * sx,
            width: radius * 1.4 * sx,
            height: radius * 1.4 * sx,
            borderRadius: 99,
            borderWidth: 2,
            borderColor: ring,
            opacity: 0.85,
          }}
        />
      )}
      <View
        style={{
          position: 'absolute',
          left: sim.pos.x * sx - spriteW / 2,
          top: sim.pos.y * sx - spriteH * MAX_ANCHOR_Y,
        }}
      >
        <MaxSprite height={spriteH} pose={flying ? 'flight' : 'idle'} rotation={rotation} />
      </View>
    </>
  );
}

function AimGuide({ pos, aim, finger, sx }: { pos: Vec; aim: Aim; finger: Vec | null; sx: number }) {
  const t = powerT(aim.power);
  const color = t < 0.55 ? mixHex(colors.aim, colors.accent, t / 0.55) : mixHex(colors.accent, colors.aimHot, (t - 0.55) / 0.45);
  const count = 9;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const dist = (Math.min(aim.drag, 150) * (i + 1)) / count;
        const size = (4 + t * 5 + i * 0.3) * sx;
        return (
          <View
            key={`aim-${i}`}
            style={{
              position: 'absolute',
              left: (pos.x + aim.dir.x * dist) * sx - size / 2,
              top: (pos.y + aim.dir.y * dist) * sx - size / 2,
              width: size,
              height: size,
              borderRadius: 99,
              backgroundColor: color,
              opacity: 0.3 + i * 0.07,
            }}
          />
        );
      })}
      {finger && (
        <View
          style={{
            position: 'absolute',
            left: finger.x * sx - 7 * sx,
            top: finger.y * sx - 7 * sx,
            width: 14 * sx,
            height: 14 * sx,
            borderRadius: 99,
            borderWidth: 2,
            borderColor: color,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        />
      )}
      <View
        style={{
          position: 'absolute',
          left: (pos.x + 16) * sx,
          top: (pos.y - 28) * sx,
          backgroundColor: 'rgba(8,12,18,0.82)',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: color,
        }}
      >
        <Text style={{ color, fontWeight: '900', fontSize: 11 }}>PWR {Math.round(t * 100)}%</Text>
      </View>
    </>
  );
}

function HitBurst({ hit, sx }: { hit: HitFx; sx: number }) {
  const life = Math.max(0, 1 - hit.age / 340);
  const color = HIT_COLOR[hit.kind];
  const r = (7 + hit.age * 0.06) * sx;
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: hit.x * sx - r,
          top: hit.y * sx - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          borderWidth: 2,
          borderColor: color,
          opacity: life,
        }}
      />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + hit.id * 0.7;
        const d = (5 + hit.age * 0.05) * sx;
        const s = 3.5 * sx;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: hit.x * sx + Math.cos(a) * d - s / 2,
              top: hit.y * sx + Math.sin(a) * d - s / 2,
              width: s,
              height: s,
              borderRadius: s,
              backgroundColor: color,
              opacity: life,
            }}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, overflow: 'hidden' },
  pingKicker: {
    color: colors.accentHot,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pingText: { color: '#f8fafc', fontSize: 12, fontWeight: '700', marginTop: 1 },
});
