import {
  MAX_SPEED,
  add,
  circleCircleOverlap,
  circleRectOverlap,
  clamp,
  len,
  movingWallAt,
  resolveCirclePaddle,
  resolveCircleWall,
  scale,
} from './physics';
import type { LevelDef, Sim, Vec, Zone, ZoneFeel } from './types';

const TRAIL_MIN = 7;
const HIT_LIFE = 340;

export function createSim(level: LevelDef): Sim {
  return {
    pos: { ...level.start },
    vel: { x: 0, y: 0 },
    bouncesLeft: level.maxBounces,
    elapsedMs: 0,
    status: 'aiming',
    message: level.tagline,
    fired: [],
    notifies: [],
    trail: [],
    hits: [],
    shake: 0,
    contacts: [],
    zone: null,
    hitSeq: 0,
  };
}

function zoneAt(zones: Zone[] | undefined, pos: Vec, radius: number, kind: Zone['kind']) {
  if (!zones) return undefined;
  return zones.find((z) => z.kind === kind && circleRectOverlap(pos.x, pos.y, radius * 0.65, z));
}

function applyZones(pos: Vec, vel: Vec, radius: number, zones: Zone[] | undefined, dt: number) {
  let next = vel;
  let feel: ZoneFeel = null;
  const belt = zoneAt(zones, pos, radius, 'belt');
  if (belt) {
    const dir = belt.dir ?? { x: 1, y: 0 };
    const mag = Math.hypot(dir.x, dir.y) || 1;
    const speed = belt.speed ?? 340;
    next = {
      x: next.x + (dir.x / mag) * speed * dt * 2.6,
      y: next.y + (dir.y / mag) * speed * dt * 2.6,
    };
    feel = 'belt';
  }
  const slick = zoneAt(zones, pos, radius, 'slick');
  if (slick && len(next) > 8) {
    next = scale(next, 1 + 0.55 * dt);
    feel = feel ?? 'slick';
  }
  const shaft = zoneAt(zones, pos, radius, 'shaft');
  if (shaft) {
    const lift = shaft.speed ?? 640;
    const cx = shaft.x + shaft.w / 2;
    next = {
      x: next.x + (cx - pos.x) * dt * 5.5,
      y: next.y - lift * dt * 3.4,
    };
    feel = 'shaft';
  }
  return { vel: next, feel, slick: Boolean(slick) };
}

function ageFx(sim: Sim, dt: number): Sim {
  const ms = dt * 1000;
  return {
    ...sim,
    shake: sim.shake * Math.exp(-dt * 9),
    hits: sim.hits.map((h) => ({ ...h, age: h.age + ms })).filter((h) => h.age < HIT_LIFE),
    notifies: sim.notifies.filter((n) => n.until > sim.elapsedMs),
  };
}

/**
 * Advance a flying Max by dt seconds.
 * `worldMs` drives doors and paddles so they keep moving while you aim.
 */
export function stepSim(prev: Sim, level: LevelDef, dt: number, worldMs: number): Sim {
  if (prev.status !== 'flying') return ageFx(prev, dt);

  const sim: Sim = {
    ...prev,
    pos: { ...prev.pos },
    vel: { ...prev.vel },
    fired: prev.fired.slice(),
    notifies: prev.notifies.filter((n) => n.until > prev.elapsedMs),
    trail: prev.trail,
    hits: prev.hits.map((h) => ({ ...h, age: h.age + dt * 1000 })).filter((h) => h.age < HIT_LIFE),
    contacts: prev.contacts.slice(),
    shake: prev.shake * Math.exp(-dt * 9),
    elapsedMs: prev.elapsedMs + dt * 1000,
  };

  const steps = 4;
  const sdt = dt / steps;
  const touched = new Set(sim.contacts);
  let bouncedThisFrame = false;
  let hitHazard = false;
  let hitGoal = false;
  let feel: ZoneFeel = null;

  for (let i = 0; i < steps; i++) {
    const at = worldMs - dt * 1000 + (i + 1) * sdt * 1000;
    sim.pos = add(sim.pos, scale(sim.vel, sdt));
    const zoned = applyZones(sim.pos, sim.vel, level.playerRadius, level.zones, sdt);
    sim.vel = zoned.vel;
    if (zoned.feel) feel = zoned.feel;

    const walls = level.walls.map((w) => movingWallAt(w, at));
    for (const wall of walls) {
      if (wall.kind === 'hazard') {
        if (circleRectOverlap(sim.pos.x, sim.pos.y, level.playerRadius, wall)) {
          hitHazard = true;
        }
        continue;
      }
      const overlapping = circleRectOverlap(sim.pos.x, sim.pos.y, level.playerRadius, wall);
      if (!overlapping) {
        touched.delete(wall.id);
        continue;
      }
      const fresh = !touched.has(wall.id);
      const res = resolveCircleWall(sim.pos, sim.vel, level.playerRadius, wall, {
        slick: zoned.slick,
        reflect: fresh,
      });
      sim.pos = res.pos;
      if (fresh && res.bounced) {
        sim.vel = res.vel;
        bouncedThisFrame = true;
        touched.add(wall.id);
        sim.hitSeq += 1;
        sim.shake = Math.min(1, sim.shake + (res.boosted ? 1 : 0.72));
        if (res.hit) {
          sim.hits = [...sim.hits, { id: sim.hitSeq, x: res.hit.x, y: res.hit.y, age: 0, kind: res.kind }];
        }
      } else {
        touched.add(wall.id);
      }
    }

    for (const paddle of level.paddles ?? []) {
      const res = resolveCirclePaddle(sim.pos, sim.vel, level.playerRadius, paddle, at, !touched.has(paddle.id));
      if (!res.touching) {
        touched.delete(paddle.id);
        continue;
      }
      sim.pos = res.pos;
      if (res.bounced) {
        sim.vel = res.vel;
        bouncedThisFrame = true;
        touched.add(paddle.id);
        sim.hitSeq += 1;
        sim.shake = 1;
        if (res.hit) {
          sim.hits = [
            ...sim.hits,
            { id: sim.hitSeq, x: res.hit.x, y: res.hit.y, age: 0, kind: 'paddle' },
          ];
        }
      } else {
        touched.add(paddle.id);
      }
    }

    sim.pos = {
      x: clamp(sim.pos.x, level.playerRadius + 1, level.width - level.playerRadius - 1),
      y: clamp(sim.pos.y, level.playerRadius + 1, level.height - level.playerRadius - 1),
    };
    if (len(sim.vel) > MAX_SPEED) sim.vel = scale(sim.vel, MAX_SPEED / len(sim.vel));

    if (
      circleCircleOverlap(
        sim.pos.x,
        sim.pos.y,
        level.playerRadius,
        level.goal.x,
        level.goal.y,
        level.goalRadius,
      )
    ) {
      hitGoal = true;
      break;
    }
    if (hitHazard) break;
  }

  sim.zone = feel;
  sim.contacts = [...touched];

  const sinceLaunch = sim.elapsedMs;
  for (const d of level.distractors ?? []) {
    if (sim.fired.includes(d.id)) continue;
    if (sinceLaunch >= d.delayMs) {
      sim.fired.push(d.id);
      sim.vel = add(sim.vel, d.impulse);
      sim.notifies = [
        ...sim.notifies,
        { id: d.id, text: d.text, x: d.x, y: d.y, until: sim.elapsedMs + d.durationMs },
      ];
      sim.message = d.text.trim();
    }
  }

  if (bouncedThisFrame) {
    sim.bouncesLeft -= 1;
  }

  const last = sim.trail[sim.trail.length - 1];
  if (!last || Math.hypot(sim.pos.x - last.x, sim.pos.y - last.y) > TRAIL_MIN) {
    sim.trail = [...sim.trail, { x: sim.pos.x, y: sim.pos.y }].slice(-16);
  }

  if (hitGoal) {
    sim.status = 'won';
    sim.vel = { x: 0, y: 0 };
    sim.message = level.winTitle ?? 'Meds unlocked.';
    return sim;
  }
  if (hitHazard) {
    sim.status = 'lost';
    sim.vel = { x: 0, y: 0 };
    sim.message = 'Review trap. Back to your desk — aim again.';
    return sim;
  }
  if (bouncedThisFrame && sim.bouncesLeft < 0) {
    sim.status = 'lost';
    sim.vel = { x: 0, y: 0 };
    sim.message = 'Out of ricochets. The shift can wait — try a sharper angle.';
    return sim;
  }
  if (feel !== 'shaft' && feel !== 'belt' && len(sim.vel) < 16 && sim.elapsedMs > 1100) {
    sim.status = 'lost';
    sim.vel = { x: 0, y: 0 };
    sim.message = 'Stopped in the aisle. More power next launch.';
    return sim;
  }

  return sim;
}
