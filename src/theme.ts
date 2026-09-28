import type { ChapterId } from './types';

/** Blend two #rrggbb colors. t=0 is `a`, t=1 is `b`. */
export function mixHex(a: string, b: string, t: number) {
  const u = Math.max(0, Math.min(1, t));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * u));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export const colors = {
  bg: '#121826',
  bgDeep: '#0b0f16',
  panel: '#1a2333',
  panelSoft: '#243044',
  accent: '#f5c518',
  accentHot: '#ff5a36',
  max: '#f6c453',
  maxOutline: '#7c4a12',
  maxSuit: '#16324f',
  maxTie: '#ef4444',
  wall: '#b7c3d1',
  wallDark: '#5c6b7f',
  partition: '#d5dee8',
  fluorescent: '#e7fff6',
  fluorescentDim: '#8ee8c8',
  pad: '#3ee0a2',
  padDark: '#0f8f62',
  hazard: '#e11d48',
  hazardDark: '#9f1239',
  door: '#e6edf5',
  doorStripe: '#f5c518',
  doorGlass: '#7ec8ff',
  belt: '#6e5338',
  beltDark: '#3f2e1e',
  beltArrow: '#f3e6cf',
  reverse: '#38bdf8',
  reverseDark: '#0369a1',
  slick: '#5c3d2e',
  slickHighlight: '#c4a484',
  shaft: '#12352c',
  shaftGlow: '#6ee7b7',
  paddle: '#fb923c',
  paddleDark: '#9a3412',
  goal: '#f6d48a',
  goalCap: '#f8fafc',
  goalLabel: '#7c2d12',
  text: '#f8fafc',
  textMuted: '#b7c0ce',
  aim: '#7ee7ff',
  aimHot: '#ff5a36',
  notify: '#101820',
  notifyBorder: '#ff5a36',
  win: '#4ade80',
  lose: '#fb7185',
  trainLine: '#f5c518',
  overtime: '#fb7185',
  ink: '#0b0f16',
  suit: '#5d7290',
  suitDeep: '#3e5168',
  suitLight: '#93a8bf',
  shirt: '#f6f1e7',
  tie: '#8d3a48',
  tieDeep: '#6a2934',
  skin: '#e4b48f',
  skinDeep: '#c99268',
  hair: '#1a140f',
  leather: '#6b4a32',
  leatherDeep: '#4a3222',
  shoe: '#14181e',
};

export type ChapterTheme = {
  field: string;
  rail: string;
  fluorescent: string;
  kicker: string;
};

export const chapterTheme: Record<ChapterId, ChapterTheme> = {
  morning: {
    field: '#1a2740',
    rail: '#8fb4ff',
    fluorescent: '#f4fff9',
    kicker: '#d6e4ff',
  },
  commute: {
    field: '#141c18',
    rail: '#f5c518',
    fluorescent: '#e7fff4',
    kicker: '#f5c518',
  },
  office: {
    field: '#1b2430',
    rail: '#9ff3d0',
    fluorescent: '#f3fffb',
    kicker: '#b7f7d8',
  },
  overtime: {
    field: '#2a1418',
    rail: '#fb7185',
    fluorescent: '#ffe4e6',
    kicker: '#fda4af',
  },
  boss: {
    field: '#171424',
    rail: '#7dd3fc',
    fluorescent: '#e0f2fe',
    kicker: '#7dd3fc',
  },
  finale: {
    field: '#101820',
    rail: '#f5c518',
    fluorescent: '#ecfeff',
    kicker: '#fde68a',
  },
};
