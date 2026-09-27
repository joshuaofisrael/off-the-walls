export type Vec = { x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type Wall = Rect & {
  id: string;
  kind?: 'wall' | 'pad' | 'hazard' | 'moving';
  /** bounce pad strength multiplier (default 1.35) */
  boost?: number;
  /** moving platform path (optional) */
  move?: {
    from: Vec;
    to: Vec;
    periodMs: number;
  };
};

export type Distractor = {
  id: string;
  text: string;
  /** when it appears after launch, ms */
  delayMs: number;
  durationMs: number;
  /** impulse applied to Max when it pops */
  impulse: Vec;
  x: number;
  y: number;
};

export type LevelDef = {
  id: number;
  name: string;
  tagline: string;
  /** logical playfield size (portrait) */
  width: number;
  height: number;
  start: Vec;
  goal: Vec;
  goalRadius: number;
  playerRadius: number;
  maxBounces: number;
  walls: Wall[];
  distractors?: Distractor[];
};

export type GameStatus = 'aiming' | 'flying' | 'won' | 'lost';

export type Screen = 'title' | 'levels' | 'game';
