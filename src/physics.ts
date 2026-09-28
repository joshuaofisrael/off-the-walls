import type { Paddle, Rect, Vec, Wall } from './types';

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function len(v: Vec) {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Vec): Vec {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
}

export function scale(v: Vec, s: number): Vec {
  return { x: v.x * s, y: v.y * s };
}

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function circleRectOverlap(cx: number, cy: number, r: number, rect: Rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

export function circleCircleOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}

/** 0 at cycle start, 1 at the far end. Snap dwells at each end so doors stay open. */
export function moveU(elapsedMs: number, periodMs: number, mode: 'cosine' | 'snap' = 'cosine'): number {
  const period = Math.max(1, periodMs);
  const p = (((elapsedMs % period) + period) % period) / period;
  if (mode === 'snap') {
    // closed/from for 0–0.42, travel, open/to for 0.50–0.88, travel back
    if (p < 0.42) return 0;
    if (p < 0.5) return (p - 0.42) / 0.08;
    if (p < 0.88) return 1;
    return 1 - (p - 0.88) / 0.12;
  }
  const t = p * Math.PI * 2;
  return (1 - Math.cos(t)) / 2;
}

export function movingWallAt(wall: Wall, elapsedMs: number): Wall {
  if (!wall.move) return wall;
  const { from, to, periodMs, mode, phaseMs } = wall.move;
  const u = moveU(elapsedMs + (phaseMs ?? 0), periodMs, mode ?? 'cosine');
  return {
    ...wall,
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u,
  };
}

export type SolidHit = {
  pos: Vec;
  vel: Vec;
  bounced: boolean;
  boosted: boolean;
  touching: boolean;
  hit?: Vec;
  kind: 'wall' | 'pad' | 'reverse' | 'paddle' | 'door';
};

function outwardNormal(pos: Vec, wall: Rect): Vec {
  const nearestX = clamp(pos.x, wall.x, wall.x + wall.w);
  const nearestY = clamp(pos.y, wall.y, wall.y + wall.h);
  let dx = pos.x - nearestX;
  let dy = pos.y - nearestY;
  if (dx === 0 && dy === 0) {
    const left = pos.x - wall.x;
    const right = wall.x + wall.w - pos.x;
    const top = pos.y - wall.y;
    const bottom = wall.y + wall.h - pos.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: -1, y: 0 };
    if (m === right) return { x: 1, y: 0 };
    if (m === top) return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }
  const dist = Math.hypot(dx, dy) || 1;
  return { x: dx / dist, y: dy / dist };
}

function pushOut(pos: Vec, radius: number, wall: Rect): { pos: Vec; normal: Vec; hit: Vec } {
  const nearestX = clamp(pos.x, wall.x, wall.x + wall.w);
  const nearestY = clamp(pos.y, wall.y, wall.y + wall.h);
  const normal = outwardNormal(pos, wall);
  const dx = pos.x - nearestX;
  const dy = pos.y - nearestY;
  const dist = Math.hypot(dx, dy);
  const penetration = dist === 0 ? radius : radius - dist;
  return {
    pos: {
      x: pos.x + normal.x * (Math.max(0, penetration) + 0.65),
      y: pos.y + normal.y * (Math.max(0, penetration) + 0.65),
    },
    normal,
    hit: { x: nearestX, y: nearestY },
  };
}

/**
 * Resolve a circle against a solid wall, pad, door, or CC reverse pad.
 * Reverse pads bank you: after the bounce, the along-surface axis flips,
 * so a floor hit sends you back across the office instead of through.
 */
export function resolveCircleWall(
  pos: Vec,
  vel: Vec,
  radius: number,
  wall: Wall,
  opts?: { slick?: boolean; reflect?: boolean },
): SolidHit {
  const kind = wall.kind === 'pad' || wall.kind === 'reverse' || wall.kind === 'door' ? wall.kind : 'wall';
  const reflect = opts?.reflect !== false;
  if (!circleRectOverlap(pos.x, pos.y, radius, wall)) {
    return { pos, vel, bounced: false, boosted: false, touching: false, kind };
  }

  const separated = pushOut(pos, radius, wall);
  if (!reflect) {
    return { pos: separated.pos, vel, bounced: false, boosted: false, touching: true, hit: separated.hit, kind };
  }

  const { normal } = separated;
  let nVel: Vec;
  if (Math.abs(normal.x) > Math.abs(normal.y)) {
    nVel = { x: -vel.x, y: vel.y };
  } else {
    nVel = { x: vel.x, y: -vel.y };
  }

  let boosted = false;
  if (wall.kind === 'pad') {
    boosted = true;
    nVel = scale(nVel, wall.boost ?? 1.4);
  } else if (wall.kind === 'reverse') {
    boosted = true;
    if (wall.w >= wall.h) nVel = { x: -nVel.x, y: nVel.y };
    else nVel = { x: nVel.x, y: -nVel.y };
    nVel = scale(nVel, wall.boost ?? 1.18);
  } else if (opts?.slick) {
    nVel = scale(nVel, 1.02);
  } else {
    nVel = scale(nVel, 0.992);
  }

  // Keep the bounce leaving the surface.
  const sep = nVel.x * normal.x + nVel.y * normal.y;
  if (sep < 40) {
    nVel = {
      x: nVel.x + normal.x * (40 - sep),
      y: nVel.y + normal.y * (40 - sep),
    };
  }

  return { pos: separated.pos, vel: nVel, bounced: true, boosted, touching: true, hit: separated.hit, kind };
}

export function paddleAngle(paddle: Paddle, worldMs: number) {
  return (paddle.phase ?? 0) + (worldMs / paddle.periodMs) * Math.PI * 2;
}

export function paddlePose(paddle: Paddle, worldMs: number) {
  const angle = paddleAngle(paddle, worldMs);
  const hx = Math.cos(angle) * (paddle.length / 2);
  const hy = Math.sin(angle) * (paddle.length / 2);
  return {
    angle,
    ax: paddle.x - hx,
    ay: paddle.y - hy,
    bx: paddle.x + hx,
    by: paddle.y + hy,
  };
}

function closestOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / ab2, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

/** Meeting paddle: a spinning capsule that smacks Max with its angular speed. */
export function resolveCirclePaddle(
  pos: Vec,
  vel: Vec,
  radius: number,
  paddle: Paddle,
  worldMs: number,
  reflect: boolean,
): SolidHit {
  const pose = paddlePose(paddle, worldMs);
  const closest = closestOnSegment(pos.x, pos.y, pose.ax, pose.ay, pose.bx, pose.by);
  let dx = pos.x - closest.x;
  let dy = pos.y - closest.y;
  let dist = Math.hypot(dx, dy);
  const minDist = radius + paddle.thickness / 2;
  if (dist > minDist) {
    return { pos, vel, bounced: false, boosted: false, touching: false, kind: 'paddle' };
  }

  let nx: number;
  let ny: number;
  if (dist < 1e-3) {
    nx = -Math.sin(pose.angle);
    ny = Math.cos(pose.angle);
    dist = 0;
  } else {
    nx = dx / dist;
    ny = dy / dist;
  }

  const nPos = {
    x: pos.x + nx * (minDist - dist + 0.7),
    y: pos.y + ny * (minDist - dist + 0.7),
  };
  if (!reflect) {
    return { pos: nPos, vel, bounced: false, boosted: false, touching: true, hit: closest, kind: 'paddle' };
  }

  const dot = vel.x * nx + vel.y * ny;
  let nVel = {
    x: vel.x - 2 * dot * nx,
    y: vel.y - 2 * dot * ny,
  };

  const rx = closest.x - paddle.x;
  const ry = closest.y - paddle.y;
  const omega = (Math.PI * 2) / (paddle.periodMs / 1000);
  // Match on-screen rotation: positive angle swings the right-hand tip downward.
  nVel.x += -omega * ry * 1.35;
  nVel.y += omega * rx * 1.35;
  nVel = scale(nVel, paddle.boost ?? 1.1);

  const sep = nVel.x * nx + nVel.y * ny;
  if (sep < 60) {
    nVel = { x: nVel.x + nx * (60 - sep), y: nVel.y + ny * (60 - sep) };
  }

  return { pos: nPos, vel: nVel, bounced: true, boosted: true, touching: true, hit: closest, kind: 'paddle' };
}

export const MAX_SPEED = 980;
export const MIN_LAUNCH = 180;
export const MAX_LAUNCH = 780;

export function aimFromDrag(origin: Vec, finger: Vec): { dir: Vec; power: number; drag: number } {
  const raw = { x: finger.x - origin.x, y: finger.y - origin.y };
  const drag = len(raw);
  const dir = drag < 4 ? { x: 0, y: -1 } : normalize(raw);
  const power = clamp(drag * 2.2, MIN_LAUNCH, MAX_LAUNCH);
  return { dir, power, drag };
}

export function powerT(power: number) {
  return clamp((power - MIN_LAUNCH) / (MAX_LAUNCH - MIN_LAUNCH), 0, 1);
}
