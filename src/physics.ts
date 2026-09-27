import type { Rect, Vec, Wall } from './types';

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

/** Resolve circle vs AABB; returns new position + velocity and whether a bounce happened. */
export function resolveCircleWall(
  pos: Vec,
  vel: Vec,
  radius: number,
  wall: Wall,
): { pos: Vec; vel: Vec; bounced: boolean; boosted: boolean } {
  if (!circleRectOverlap(pos.x, pos.y, radius, wall)) {
    return { pos, vel, bounced: false, boosted: false };
  }

  const nearestX = clamp(pos.x, wall.x, wall.x + wall.w);
  const nearestY = clamp(pos.y, wall.y, wall.y + wall.h);
  let dx = pos.x - nearestX;
  let dy = pos.y - nearestY;

  // Center inside rect — push out via smallest overlap
  if (dx === 0 && dy === 0) {
    const left = pos.x - wall.x;
    const right = wall.x + wall.w - pos.x;
    const top = pos.y - wall.y;
    const bottom = wall.y + wall.h - pos.y;
    const m = Math.min(left, right, top, bottom);
    let nPos = { ...pos };
    let nVel = { ...vel };
    if (m === left) {
      nPos.x = wall.x - radius;
      nVel.x = -Math.abs(vel.x);
    } else if (m === right) {
      nPos.x = wall.x + wall.w + radius;
      nVel.x = Math.abs(vel.x);
    } else if (m === top) {
      nPos.y = wall.y - radius;
      nVel.y = -Math.abs(vel.y);
    } else {
      nPos.y = wall.y + wall.h + radius;
      nVel.y = Math.abs(vel.y);
    }
    const boosted = wall.kind === 'pad';
    if (boosted) nVel = scale(nVel, wall.boost ?? 1.4);
    return { pos: nPos, vel: nVel, bounced: true, boosted };
  }

  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const penetration = radius - dist;
  const nPos = {
    x: pos.x + nx * (penetration + 0.5),
    y: pos.y + ny * (penetration + 0.5),
  };

  // Reflect velocity across normal
  const dot = vel.x * nx + vel.y * ny;
  let nVel = {
    x: vel.x - 2 * dot * nx,
    y: vel.y - 2 * dot * ny,
  };

  // Prefer clean axis bounce when nearly axis-aligned (pinball feel)
  if (Math.abs(nx) > Math.abs(ny)) {
    nVel = { x: -vel.x, y: vel.y };
  } else {
    nVel = { x: vel.x, y: -vel.y };
  }

  const boosted = wall.kind === 'pad';
  if (boosted) nVel = scale(nVel, wall.boost ?? 1.4);

  // Tiny energy loss so paths settle
  nVel = scale(nVel, boosted ? 1 : 0.992);

  return { pos: nPos, vel: nVel, bounced: true, boosted };
}

export function movingWallAt(wall: Wall, elapsedMs: number): Wall {
  if (!wall.move) return wall;
  const { from, to, periodMs } = wall.move;
  const t = ((elapsedMs % periodMs) / periodMs) * Math.PI * 2;
  // smooth ping-pong via cos
  const u = (1 - Math.cos(t)) / 2;
  return {
    ...wall,
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u,
  };
}

export const MAX_SPEED = 920;
export const MIN_LAUNCH = 180;
export const MAX_LAUNCH = 780;

export function aimFromDrag(origin: Vec, finger: Vec): { dir: Vec; power: number; drag: number } {
  const raw = { x: finger.x - origin.x, y: finger.y - origin.y };
  const drag = len(raw);
  const dir = drag < 4 ? { x: 0, y: -1 } : normalize(raw);
  const power = clamp(drag * 2.2, MIN_LAUNCH, MAX_LAUNCH);
  return { dir, power, drag };
}
