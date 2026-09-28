import type { Distractor, LevelDef, Vec, Wall } from './types';

/**
 * Logical playfield: 360 x 640 (portrait phone units).
 * Scaled to the real screen at render time. Y grows downward.
 */
const W = 360;
const H = 640;

function bounds(): Wall[] {
  return [
    { id: 'floor', x: 0, y: H - 20, w: W, h: 20 },
    { id: 'ceil', x: 0, y: 0, w: W, h: 16 },
    { id: 'left', x: 0, y: 0, w: 16, h: H },
    { id: 'right', x: W - 16, y: 0, w: 16, h: H },
  ];
}

function wall(id: string, x: number, y: number, w: number, h: number, extra?: Partial<Wall>): Wall {
  return { id, x, y, w, h, ...extra };
}

function lvl(
  partial: Omit<LevelDef, 'width' | 'height' | 'playerRadius' | 'goalRadius'> & {
    goalRadius?: number;
    playerRadius?: number;
  },
): LevelDef {
  return {
    width: W,
    height: H,
    playerRadius: partial.playerRadius ?? 14,
    goalRadius: partial.goalRadius ?? 22,
    ...partial,
  };
}

/** Train doors that start shut (from) and slide open (to). */
function doorPair(
  id: string,
  y: number,
  holeX: number,
  holeW: number,
  periodMs: number,
  phaseMs = 0,
  thickness = 24,
): Wall[] {
  const half = holeW / 2;
  const move = (fromX: number, toX: number) => ({
    from: { x: fromX, y },
    to: { x: toX, y },
    periodMs,
    mode: 'snap' as const,
    phaseMs,
  });
  return [
    {
      id: `${id}-L`,
      x: holeX,
      y,
      w: half,
      h: thickness,
      kind: 'door',
      label: 'DOOR',
      move: move(holeX, holeX - half),
    },
    {
      id: `${id}-R`,
      x: holeX + half,
      y,
      w: half,
      h: thickness,
      kind: 'door',
      move: move(holeX + half, holeX + holeW),
    },
  ];
}

function lintel(id: string, y: number, holeX: number, holeW: number, thickness = 24): Wall[] {
  const right = holeX + holeW;
  return [
    wall(`${id}-l`, 16, y, Math.max(0, holeX - 16), thickness),
    wall(`${id}-r`, right, y, Math.max(0, W - 16 - right), thickness),
  ];
}

function ping(
  id: string,
  text: string,
  delayMs: number,
  impulse: Vec,
  x: number,
  y: number,
): Distractor {
  return { id, text, delayMs, durationMs: 1700, impulse, x, y };
}

const shelf = (id: string, y: number, gapX: number, gapW: number, thickness = 18) =>
  lintel(id, y, gapX, gapW, thickness);

export const LEVELS: LevelDef[] = [
  lvl({
    id: 1,
    chapter: 'morning',
    name: 'Badge In',
    tagline: 'Drag, release, ricochet. The bottle is the whole job.',
    mechanics: ['Aim'],
    start: { x: 72, y: 548 },
    goal: { x: 286, y: 96 },
    maxBounces: 10,
    walls: [
      ...bounds(),
      wall('desk', 36, 300, 78, 18),
      wall('badge-gate', 150, 430, 18, 90),
    ],
  }),
  lvl({
    id: 2,
    chapter: 'morning',
    name: 'Partition Bounce',
    tagline: 'The partition is just a wall with a cost center.',
    mechanics: ['Walls'],
    start: { x: 78, y: 250 },
    goal: { x: 278, y: 168 },
    goalRadius: 24,
    maxBounces: 12,
    walls: [
      ...bounds(),
      wall('divider', 168, 16, 20, 430),
      wall('low-desk', 200, 500, 110, 16),
    ],
  }),
  lvl({
    id: 3,
    chapter: 'morning',
    name: 'Elevator Pitch',
    tagline: 'The shaft is safe. Step in and let it lift you.',
    mechanics: ['Elevator'],
    start: { x: 250, y: 572 },
    goal: { x: 250, y: 58 },
    maxBounces: 12,
    walls: [
      ...bounds(),
      wall('shaft-l', 196, 36, 16, 470),
      wall('shaft-r', 300, 36, 16, 470),
      wall('lobby', 16, 430, 180, 18),
    ],
    zones: [
      {
        id: 'elev',
        kind: 'shaft',
        x: 212,
        y: 40,
        w: 88,
        h: 500,
        speed: 700,
        label: 'ELEV',
      },
    ],
  }),
  lvl({
    id: 4,
    chapter: 'commute',
    name: 'Closing Doors',
    tagline: 'Wait for the gap, then bounce straight through.',
    mechanics: ['Train doors'],
    start: { x: 180, y: 560 },
    goal: { x: 180, y: 78 },
    maxBounces: 14,
    walls: [
      ...bounds(),
      ...lintel('gate', 300, 136, 88),
      ...doorPair('gate', 300, 136, 88, 2600),
    ],
  }),
  lvl({
    id: 5,
    chapter: 'commute',
    name: 'Rush Hour',
    tagline: 'Two gates. One opening. You only need the overlap.',
    mechanics: ['Train doors'],
    start: { x: 180, y: 568 },
    goal: { x: 180, y: 72 },
    maxBounces: 16,
    walls: [
      ...bounds(),
      ...lintel('low', 430, 132, 96),
      ...doorPair('low', 430, 132, 96, 2800, 0),
      ...lintel('high', 250, 132, 96),
      ...doorPair('high', 250, 132, 96, 2800, 400),
      wall('crowd', 40, 510, 78, 14, {
        kind: 'moving',
        move: {
          from: { x: 24, y: 510 },
          to: { x: 250, y: 510 },
          periodMs: 3400,
          mode: 'cosine',
        },
      }),
    ],
  }),
  lvl({
    id: 6,
    chapter: 'commute',
    name: 'Moving Walkway',
    tagline: 'Let the belt do the commuting. The elevator finishes it.',
    mechanics: ['Walkway', 'Elevator'],
    start: { x: 70, y: 560 },
    goal: { x: 294, y: 68 },
    maxBounces: 14,
    walls: [
      ...bounds(),
      wall('station', 16, 16, 236, 484),
      wall('shaft-l', 252, 16, 16, 484),
      wall('shaft-r', 328, 16, 16, 560),
    ],
    zones: [
      {
        id: 'walk',
        kind: 'belt',
        x: 24,
        y: 512,
        w: 230,
        h: 96,
        dir: { x: 1, y: 0 },
        speed: 460,
        label: 'WALK',
      },
      {
        id: 'up',
        kind: 'shaft',
        x: 268,
        y: 36,
        w: 60,
        h: 560,
        speed: 720,
        label: 'ELEV',
      },
    ],
  }),
  lvl({
    id: 7,
    chapter: 'office',
    name: 'Cubicle Grid',
    tagline: 'Cubicles cannot hold a good ricochet.',
    mechanics: ['Maze'],
    start: { x: 70, y: 575 },
    goal: { x: 286, y: 78 },
    goalRadius: 22,
    maxBounces: 16,
    walls: [
      ...bounds(),
      ...shelf('s1', 150, 230, 100),
      ...shelf('s2', 310, 30, 110),
      ...shelf('s3', 460, 210, 110),
      wall('stub', 168, 500, 16, 70),
    ],
  }),
  lvl({
    id: 8,
    chapter: 'office',
    name: 'Coffee Slick',
    tagline: 'Someone spilled the pour-over. Slide, then bank.',
    mechanics: ['Coffee slick'],
    start: { x: 64, y: 540 },
    goal: { x: 292, y: 110 },
    goalRadius: 24,
    maxBounces: 14,
    walls: [
      ...bounds(),
      wall('desk-a', 40, 250, 150, 16),
      wall('desk-b', 230, 390, 100, 16),
    ],
    zones: [
      {
        id: 'coffee',
        kind: 'slick',
        x: 48,
        y: 280,
        w: 260,
        h: 180,
        label: 'COFFEE',
      },
    ],
  }),
  lvl({
    id: 9,
    chapter: 'office',
    name: 'Open Plan',
    tagline: 'Open plan, closed corners. The green pad is a favor.',
    mechanics: ['Slick', 'Boost pad'],
    start: { x: 62, y: 560 },
    goal: { x: 292, y: 86 },
    goalRadius: 24,
    maxBounces: 16,
    walls: [
      ...bounds(),
      ...shelf('row', 200, 240, 90),
      wall('pad', 46, 450, 78, 16, { kind: 'pad', boost: 1.45, label: 'BOOST' }),
      wall('nook', 150, 330, 16, 110),
    ],
    zones: [
      {
        id: 'spill',
        kind: 'slick',
        x: 36,
        y: 470,
        w: 200,
        h: 120,
        label: 'COFFEE',
      },
    ],
  }),
  lvl({
    id: 10,
    chapter: 'overtime',
    name: 'Meeting Paddle',
    tagline: 'The meeting spins. A good smack still gets you out.',
    mechanics: ['Paddle'],
    start: { x: 180, y: 560 },
    goal: { x: 180, y: 78 },
    goalRadius: 26,
    maxBounces: 18,
    walls: [...bounds(), wall('minutes', 36, 180, 70, 14), wall('minutes-r', 250, 420, 80, 14)],
    paddles: [
      {
        id: 'mtg',
        x: 180,
        y: 300,
        length: 132,
        thickness: 16,
        periodMs: 2800,
        phase: 0.4,
        boost: 1.12,
        label: 'MTG',
      },
    ],
  }),
  lvl({
    id: 11,
    chapter: 'overtime',
    name: 'Unpaid Hours',
    tagline: 'The belt feeds the meeting. The bottle is still the exit.',
    mechanics: ['Paddle', 'Walkway'],
    start: { x: 250, y: 545 },
    goal: { x: 180, y: 84 },
    goalRadius: 26,
    maxBounces: 18,
    walls: [...bounds(), ...shelf('slot', 188, 100, 170, 18), wall('inbox', 24, 340, 16, 80)],
    zones: [
      {
        id: 'desk-belt',
        kind: 'belt',
        x: 140,
        y: 488,
        w: 190,
        h: 120,
        dir: { x: -1, y: 0 },
        speed: 360,
        label: 'DESK',
      },
    ],
    paddles: [
      {
        id: 'clock',
        x: 168,
        y: 300,
        length: 108,
        thickness: 16,
        periodMs: 2500,
        phase: 1.1,
        boost: 1.14,
        label: 'MTG',
      },
    ],
  }),
  lvl({
    id: 12,
    chapter: 'overtime',
    name: 'Double Booking',
    tagline: 'Two meetings at once. Bounce through both of them.',
    mechanics: ['Paddles'],
    start: { x: 70, y: 560 },
    goal: { x: 286, y: 90 },
    goalRadius: 26,
    maxBounces: 20,
    walls: [...bounds(), wall('glass', 168, 180, 16, 160)],
    paddles: [
      {
        id: 'am',
        x: 108,
        y: 340,
        length: 110,
        thickness: 16,
        periodMs: 2600,
        phase: 0.2,
        label: 'AM',
      },
      {
        id: 'pm',
        x: 250,
        y: 260,
        length: 120,
        thickness: 16,
        periodMs: 3200,
        phase: 1.6,
        label: 'PM',
      },
    ],
  }),
  lvl({
    id: 13,
    chapter: 'boss',
    name: 'ASAP ASAP',
    tagline: 'Boss pings shove. Your aim gets the last word.',
    mechanics: ['Boss pings'],
    start: { x: 64, y: 548 },
    goal: { x: 292, y: 92 },
    goalRadius: 24,
    maxBounces: 16,
    walls: [
      ...bounds(),
      wall('shelf-a', 48, 210, 150, 16),
      wall('shelf-b', 170, 360, 150, 16),
      wall('pillar', 160, 430, 20, 90),
    ],
    distractors: [
      ping('p1', 'Boss: quick sync?', 550, { x: 120, y: -30 }, 70, 130),
      ping('p2', 'ASAP — no rush (rush)', 1500, { x: -110, y: 50 }, 180, 250),
      ping('p3', 'Per my last ping', 2500, { x: 80, y: -90 }, 60, 430),
    ],
  }),
  lvl({
    id: 14,
    chapter: 'boss',
    name: 'CC: Everyone',
    tagline: 'Reply-all yanks you back across the floor. Bank it.',
    mechanics: ['CC pad'],
    start: { x: 64, y: 430 },
    goal: { x: 72, y: 86 },
    goalRadius: 26,
    maxBounces: 18,
    walls: [
      ...bounds(),
      wall('lid-l', 16, 196, 108, 18),
      wall('lid-r', 196, 196, 148, 18),
      wall('cc-floor', 200, 528, 110, 18, { kind: 'reverse', boost: 1.24, label: 'CC' }),
      wall('cc-bank', 250, 340, 78, 16, { kind: 'reverse', boost: 1.16, label: 'CC' }),
    ],
  }),
  lvl({
    id: 15,
    chapter: 'boss',
    name: 'Performance Review',
    tagline: 'The red stamp means revise the angle. Max is fine.',
    mechanics: ['CC pad', 'Review trap'],
    start: { x: 64, y: 545 },
    goal: { x: 290, y: 100 },
    goalRadius: 24,
    maxBounces: 16,
    walls: [
      ...bounds(),
      wall('review', 150, 300, 64, 20, { kind: 'hazard', label: 'REVIEW' }),
      wall('cc', 240, 480, 80, 18, { kind: 'reverse', boost: 1.2, label: 'CC' }),
      wall('file', 36, 200, 120, 16),
    ],
    distractors: [ping('p1', 'Can you hop on for a sec', 700, { x: 100, y: -40 }, 80, 140)],
  }),
  lvl({
    id: 16,
    chapter: 'finale',
    name: 'Last Train Home',
    tagline: 'Platform belt, closing doors, then the safe car elevator.',
    mechanics: ['Doors', 'Walkway', 'Elevator'],
    start: { x: 72, y: 560 },
    goal: { x: 294, y: 64 },
    maxBounces: 20,
    walls: [
      ...bounds(),
      wall('station', 16, 16, 220, 490),
      wall('shaft-l', 236, 16, 16, 490),
      wall('shaft-r', 328, 16, 16, 580),
      ...doorPair('car', 250, 252, 76, 2800, 200),
    ],
    zones: [
      {
        id: 'platform',
        kind: 'belt',
        x: 24,
        y: 508,
        w: 220,
        h: 100,
        dir: { x: 1, y: 0 },
        speed: 440,
        label: 'WALK',
      },
      {
        id: 'car',
        kind: 'shaft',
        x: 252,
        y: 36,
        w: 76,
        h: 560,
        speed: 680,
        label: 'ELEV',
      },
    ],
  }),
  lvl({
    id: 17,
    chapter: 'finale',
    name: 'Night Transfer',
    tagline: 'Slick platform, a spinning board, an open door if you wait.',
    mechanics: ['Doors', 'Slick', 'Paddle'],
    start: { x: 180, y: 568 },
    goal: { x: 180, y: 74 },
    goalRadius: 26,
    maxBounces: 20,
    walls: [
      ...bounds(),
      ...lintel('transfer', 360, 128, 104),
      ...doorPair('transfer', 360, 128, 104, 2600, 0),
    ],
    zones: [
      {
        id: 'wet',
        kind: 'slick',
        x: 40,
        y: 420,
        w: 280,
        h: 150,
        label: 'COFFEE',
      },
    ],
    paddles: [
      {
        id: 'board',
        x: 262,
        y: 220,
        length: 116,
        thickness: 16,
        periodMs: 3000,
        phase: 0.8,
        boost: 1.1,
        label: 'MTG',
      },
    ],
  }),
  lvl({
    id: 18,
    chapter: 'finale',
    name: 'Platform Meds',
    tagline: 'Whole shift in one launch. The inbox survives until morning.',
    mechanics: ['Full shift'],
    start: { x: 70, y: 562 },
    goal: { x: 292, y: 62 },
    goalRadius: 24,
    maxBounces: 24,
    winTitle: 'Shift complete',
    winBody: 'You got the meds and the last train. The overtime clock can run without you tonight.',
    walls: [
      ...bounds(),
      wall('station', 16, 16, 200, 474),
      wall('shaft-l', 216, 16, 16, 474),
      wall('shaft-r', 328, 16, 16, 580),
      ...doorPair('last', 210, 232, 96, 3000, 250),
      wall('cc', 24, 508, 44, 18, { kind: 'reverse', boost: 1.14, label: 'CC' }),
      wall('review', 20, 590, 46, 14, { kind: 'hazard', label: 'REVIEW' }),
    ],
    zones: [
      {
        id: 'platform',
        kind: 'belt',
        x: 24,
        y: 512,
        w: 200,
        h: 96,
        dir: { x: 1, y: 0 },
        speed: 420,
        label: 'WALK',
      },
      {
        id: 'spill',
        kind: 'slick',
        x: 230,
        y: 470,
        w: 90,
        h: 130,
        label: 'COFFEE',
      },
      {
        id: 'home',
        kind: 'shaft',
        x: 232,
        y: 32,
        w: 96,
        h: 560,
        speed: 700,
        label: 'ELEV',
      },
    ],
    paddles: [
      {
        id: 'finale-mtg',
        x: 300,
        y: 400,
        length: 70,
        thickness: 14,
        periodMs: 2600,
        phase: 0.5,
        label: 'MTG',
      },
    ],
    distractors: [ping('last', 'Boss: one more thing', 900, { x: -60, y: -16 }, 70, 430)],
  }),
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelCount() {
  return LEVELS.length;
}
