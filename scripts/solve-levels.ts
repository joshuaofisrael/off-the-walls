/**
 * Proves campaign levels are winnable and the new surfaces behave.
 * Run: npx tsx scripts/solve-levels.ts
 */
import { readFileSync } from 'node:fs';
import { CHAPTERS } from '../src/chapters';
import { LEVELS } from '../src/levels';
import {
  circleRectOverlap,
  movingWallAt,
  resolveCircleWall,
} from '../src/physics';
import { createSim, stepSim } from '../src/sim';
import type { LevelDef, Sim, Vec } from '../src/types';

const dt = 1 / 60;
const BANNED =
  /\b(suicid|self-harm|kill|killed|death|die|died|dying|hang(?:ing|ed)?|noose|overdose|give up|jump off|funeral|grave|karoshi|game over)\b/i;

function fail(msg: string): never {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}

function assert(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

function fly(level: LevelDef, vel: Vec, frames: number, world0 = 0): Sim {
  let sim: Sim = { ...createSim(level), status: 'flying', vel, elapsedMs: 0 };
  let world = world0;
  for (let i = 0; i < frames && sim.status === 'flying'; i++) {
    world += dt * 1000;
    sim = stepSim(sim, level, dt, world);
  }
  return sim;
}

function mechanicTests() {
  const pad = resolveCircleWall(
    { x: 140, y: 186 },
    { x: 180, y: 320 },
    14,
    { id: 'cc', x: 100, y: 200, w: 80, h: 16, kind: 'reverse', boost: 1.2 },
  );
  assert(pad.bounced, 'reverse pad should bounce');
  assert(pad.vel.x < 0 && pad.vel.y < 0, `reverse pad should bank up-left, got ${pad.vel.x},${pad.vel.y}`);

  const beltLevel: LevelDef = {
    id: 0,
    chapter: 'commute',
    name: 'belt',
    tagline: 'belt',
    mechanics: [],
    width: 360,
    height: 640,
    start: { x: 80, y: 300 },
    goal: { x: 300, y: 80 },
    goalRadius: 18,
    playerRadius: 14,
    maxBounces: 8,
    walls: [],
    zones: [{ id: 'b', kind: 'belt', x: 20, y: 250, w: 280, h: 100, dir: { x: 1, y: 0 }, speed: 420 }],
  };
  const belted = fly(beltLevel, { x: 20, y: 0 }, 30);
  assert(belted.pos.x > 120, `belt should carry Max right, x=${belted.pos.x.toFixed(1)}`);

  const shaftLevel: LevelDef = {
    ...beltLevel,
    name: 'shaft',
    start: { x: 180, y: 400 },
    zones: [{ id: 's', kind: 'shaft', x: 140, y: 40, w: 80, h: 500, speed: 700 }],
  };
  const lifted = fly(shaftLevel, { x: 0, y: 40 }, 40);
  assert(lifted.pos.y < 300, `shaft should lift Max, y=${lifted.pos.y.toFixed(1)}`);

  const slickLevel: LevelDef = {
    ...beltLevel,
    name: 'slick',
    zones: [{ id: 'c', kind: 'slick', x: 10, y: 10, w: 340, h: 620 }],
  };
  const plain = fly({ ...beltLevel, zones: [] }, { x: 200, y: -40 }, 40);
  const slick = fly(slickLevel, { x: 200, y: -40 }, 40);
  const plainSpeed = Math.hypot(plain.vel.x, plain.vel.y);
  const slickSpeed = Math.hypot(slick.vel.x, slick.vel.y);
  assert(slickSpeed > plainSpeed + 20, `slick should keep speed, ${slickSpeed.toFixed(1)} vs ${plainSpeed.toFixed(1)}`);

  const door = movingWallAt(
    {
      id: 'd',
      x: 100,
      y: 200,
      w: 40,
      h: 20,
      kind: 'door',
      move: { from: { x: 100, y: 200 }, to: { x: 20, y: 200 }, periodMs: 2000, mode: 'snap' },
    },
    0,
  );
  const doorOpen = movingWallAt(
    {
      id: 'd',
      x: 100,
      y: 200,
      w: 40,
      h: 20,
      kind: 'door',
      move: { from: { x: 100, y: 200 }, to: { x: 20, y: 200 }, periodMs: 2000, mode: 'snap' },
    },
    1400,
  );
  assert(Math.abs(door.x - 100) < 1, 'doors start closed');
  assert(Math.abs(doorOpen.x - 20) < 1, `doors should be open mid-window, x=${doorOpen.x}`);

  const hazardLevel: LevelDef = {
    ...beltLevel,
    name: 'hazard',
    start: { x: 40, y: 40 },
    walls: [{ id: 'review', x: 80, y: 20, w: 40, h: 30, kind: 'hazard', label: 'REVIEW' }],
    zones: [],
  };
  const hit = fly(hazardLevel, { x: 500, y: 0 }, 30);
  assert(hit.status === 'lost', 'review trap should end the attempt');
  assert(/review/i.test(hit.message), `hazard copy should be a revision, got "${hit.message}"`);
  assert(!BANNED.test(hit.message), 'hazard copy tripped the content filter');

  const paddleLevel: LevelDef = {
    ...beltLevel,
    name: 'paddle',
    start: { x: 180, y: 250 },
    paddles: [{ id: 'p', x: 180, y: 280, length: 120, thickness: 18, periodMs: 4000, phase: 0 }],
    zones: [],
  };
  const slapped = fly(paddleLevel, { x: 0, y: 360 }, 20);
  assert(slapped.hits.some((h) => h.kind === 'paddle') || slapped.bouncesLeft < 8, 'paddle should swat Max');

  console.log('mechanic tests ok');
}

function overlapsSolid(level: LevelDef, pos: Vec, radius: number, worldMs: number) {
  for (const wall of level.walls) {
    if (wall.kind === 'hazard') {
      if (circleRectOverlap(pos.x, pos.y, radius, movingWallAt(wall, worldMs))) return wall.id;
      continue;
    }
    const at = movingWallAt(wall, worldMs);
    if (circleRectOverlap(pos.x, pos.y, radius, at)) return at.id;
  }
  return null;
}

function tryShot(level: LevelDef, angle: number, power: number, delay: number) {
  let sim: Sim = {
    ...createSim(level),
    status: 'flying',
    vel: { x: Math.cos(angle) * power, y: Math.sin(angle) * power },
    elapsedMs: 0,
  };
  let world = delay;
  let best = Math.hypot(level.start.x - level.goal.x, level.start.y - level.goal.y);
  const frames = 60 * 8;
  for (let i = 0; i < frames && sim.status === 'flying'; i++) {
    world += dt * 1000;
    sim = stepSim(sim, level, dt, world);
    const d = Math.hypot(sim.pos.x - level.goal.x, sim.pos.y - level.goal.y);
    if (d < best) best = d;
  }
  return { status: sim.status, best, message: sim.message };
}

function solve(level: LevelDef) {
  const toward = Math.atan2(level.goal.y - level.start.y, level.goal.x - level.start.x);
  const seedAngles = [toward, -Math.PI / 2, 0, Math.PI, Math.PI / 2];
  for (let i = -6; i <= 6; i++) seedAngles.push(toward + i * 0.12);
  const powers = [220, 340, 480, 640, 760];
  const delays = [0, 200, 500, 800, 1100, 1400, 1650, 1900, 2200, 2500, 2800];

  let best = Infinity;
  let bestMsg = '';
  const attempt = (angle: number, power: number, delay: number) => {
    const result = tryShot(level, angle, power, delay);
    if (result.best < best) {
      best = result.best;
      bestMsg = result.message;
    }
    return result.status === 'won';
  };

  for (const delay of delays) {
    for (const power of powers) {
      for (const angle of seedAngles) {
        if (attempt(angle, power, delay)) return { ok: true, best };
      }
    }
  }

  for (let deg = 0; deg < 360; deg += 8) {
    const angle = (deg * Math.PI) / 180;
    for (const power of powers) {
      for (const delay of [0, 400, 900, 1400, 1800, 2300, 2800]) {
        if (attempt(angle, power, delay)) return { ok: true, best };
      }
    }
  }

  return { ok: false, best, bestMsg };
}

function contentAndShape() {
  assert(LEVELS.length >= 36, `expected at least 36 levels, got ${LEVELS.length}`);
  const ids = LEVELS.map((l) => l.id);
  assert(new Set(ids).size === ids.length, 'level ids must be unique');
  for (let i = 0; i < ids.length; i++) assert(ids[i] === i + 1, 'level ids should be 1..n');

  for (const chapter of CHAPTERS) {
    const count = LEVELS.filter((l) => l.chapter === chapter.id).length;
    assert(count >= 2, `${chapter.title} needs at least 2 levels`);
  }
  for (const level of LEVELS) {
    assert(CHAPTERS.some((c) => c.id === level.chapter), `${level.name} has an unknown chapter`);
    const texts = [level.name, level.tagline, level.winTitle ?? '', level.winBody ?? '', ...level.mechanics];
    for (const d of level.distractors ?? []) texts.push(d.text);
    for (const w of level.walls) if (w.label) texts.push(w.label);
    for (const z of level.zones ?? []) if (z.label) texts.push(z.label);
    for (const text of texts) {
      assert(!BANNED.test(text), `banned copy in ${level.name}: "${text}"`);
    }
    const stuck = overlapsSolid(level, level.start, level.playerRadius, 0);
    assert(!stuck, `${level.name} start overlaps ${stuck}`);
    const goalStuck = overlapsSolid(level, level.goal, 4, 0);
    assert(!goalStuck, `${level.name} goal is buried in ${goalStuck}`);
  }

  const kinds = new Set(LEVELS.flatMap((l) => l.walls.map((w) => w.kind ?? 'wall')));
  const zones = new Set(LEVELS.flatMap((l) => (l.zones ?? []).map((z) => z.kind)));
  for (const kind of ['door', 'reverse', 'hazard', 'moving'] as const) {
    assert(kinds.has(kind), `missing wall kind ${kind}`);
  }
  for (const kind of ['belt', 'slick', 'shaft'] as const) {
    assert(zones.has(kind), `missing zone ${kind}`);
  }
  assert(LEVELS.some((l) => (l.paddles?.length ?? 0) > 0), 'missing paddles');
  assert(LEVELS.some((l) => (l.distractors?.length ?? 0) > 0), 'missing boss pings');

  const readme = readFileSync('README.md', 'utf8');
  for (const level of LEVELS) {
    assert(readme.includes(`**${level.name}**`), `README is missing ${level.name}`);
  }
  for (const chapter of CHAPTERS) {
    assert(readme.includes(chapter.title), `README is missing chapter ${chapter.title}`);
  }
  console.log(`campaign shape ok (${LEVELS.length} levels)`);
}

function main() {
  mechanicTests();
  contentAndShape();
  const failed: string[] = [];
  for (const level of LEVELS) {
    const t0 = Date.now();
    const result = solve(level);
    const ms = Date.now() - t0;
    if (result.ok) {
      console.log(`win  ${String(level.id).padStart(2, ' ')} ${level.name} (${ms}ms)`);
    } else {
      console.log(
        `MISS ${String(level.id).padStart(2, ' ')} ${level.name} best=${result.best.toFixed(1)} ${result.bestMsg} (${ms}ms)`,
      );
      failed.push(level.name);
    }
  }
  if (failed.length) fail(`unsolved: ${failed.join(', ')}`);
  console.log('all levels solvable');
}

main();
