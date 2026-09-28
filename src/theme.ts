import { Platform } from 'react-native';

/**
 * Midnight office: ink, brass, and fluorescent light.
 * Cool architecture, warm human accents.
 */
export const colors = {
  bg: '#10141c',
  bgDeep: '#07080c',
  bgWarm: '#16130f',
  panel: '#141922',
  panelSoft: '#1c2430',
  panelLine: 'rgba(228, 196, 138, 0.22)',
  glass: 'rgba(16, 20, 28, 0.78)',
  accent: '#e4c48a',
  accentHot: '#f0d7a8',
  accentDeep: '#8c6a38',
  fluorescent: '#e7eef2',
  text: '#f3efe6',
  textMuted: '#a7adba',
  textDim: '#6d7584',
  aim: '#d5e4ea',
  notify: 'rgba(10, 12, 16, 0.94)',
  notifyBorder: 'rgba(228, 196, 138, 0.45)',
  win: '#9dcebb',
  lose: '#e3a8a4',

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

  wall: '#c5d0dc',
  wallDark: '#7e8c9c',
  wallEdge: 'rgba(255,255,255,0.55)',
  frame: '#1a1f28',
  frameEdge: '#2c3442',
  pad: '#1f8a68',
  padLight: '#7ddec0',
  padDark: '#0e4d3a',
  hazard: '#7a2e32',
  hazardStripe: '#e4c48a',
  moving: '#c6a36a',
  movingDeep: '#7a5a32',
  bottle: '#f7f4ee',
  bottleCap: '#2c241c',
  label: '#f3e6c8',
};

export const fonts = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", serif',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  }) as string,
};
