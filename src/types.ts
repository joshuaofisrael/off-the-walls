export type Vec = { x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type ChapterId = 'morning' | 'commute' | 'office' | 'overtime' | 'boss' | 'finale';

export type WallKind = 'wall' | 'pad' | 'hazard' | 'moving' | 'door' | 'reverse';

export type MoveMode = 'cosine' | 'snap';

export type Wall = Rect & {
  id: string;
  kind?: WallKind;
  /** bounce pad / reverse-pad strength multiplier */
  boost?: number;
  /** short in-world label, e.g. CC or REVIEW */
  label?: string;
  /** moving platform or train-door path */
  move?: {
    from: Vec;
    to: Vec;
    periodMs: number;
    mode?: MoveMode;
    /** shifts the cycle so gates can open together */
    phaseMs?: number;
  };
};

export type ZoneKind = 'belt' | 'slick' | 'shaft';

/** Non-solid regions. Belts push, slicks speed you up, shafts lift. */
export type Zone = Rect & {
  id: string;
  kind: ZoneKind;
  /** belt travel direction (any length; it is normalized) */
  dir?: Vec;
  /** belt push speed, or shaft lift speed */
  speed?: number;
  label?: string;
};

export type Paddle = {
  id: string;
  /** pivot */
  x: number;
  y: number;
  /** full tip-to-tip length */
  length: number;
  thickness: number;
  periodMs: number;
  /** starting angle in radians */
  phase?: number;
  boost?: number;
  label?: string;
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
  chapter: ChapterId;
  name: string;
  tagline: string;
  /** tiny labels shown on the level board */
  mechanics: string[];
  /** logical playfield size (portrait) */
  width: number;
  height: number;
  start: Vec;
  goal: Vec;
  goalRadius: number;
  playerRadius: number;
  maxBounces: number;
  walls: Wall[];
  zones?: Zone[];
  paddles?: Paddle[];
  distractors?: Distractor[];
  winTitle?: string;
  winBody?: string;
};

export type GameStatus = 'aiming' | 'flying' | 'won' | 'lost';

export type Screen = 'title' | 'levels' | 'game';

export type HitKind = 'wall' | 'pad' | 'reverse' | 'paddle' | 'door';

export type HitFx = {
  id: number;
  x: number;
  y: number;
  age: number;
  kind: HitKind;
};

export type ActiveNotify = {
  id: string;
  text: string;
  x: number;
  y: number;
  until: number;
};

export type ZoneFeel = 'belt' | 'slick' | 'shaft' | null;

export type Sim = {
  pos: Vec;
  vel: Vec;
  bouncesLeft: number;
  elapsedMs: number;
  status: GameStatus;
  message: string;
  fired: string[];
  notifies: ActiveNotify[];
  trail: Vec[];
  hits: HitFx[];
  shake: number;
  /** surface ids Max is currently touching, so one hit doesn't multi-bounce */
  contacts: string[];
  zone: ZoneFeel;
  hitSeq: number;
};
