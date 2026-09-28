import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** Viewbox of the composed salaryman. Chest sits on the physics origin. */
export const MAX_VIEW = { w: 110, h: 150 };
/** Vertical fraction of the sprite that aligns to the collider center (mid-torso). */
export const MAX_ANCHOR_Y = 0.53;

type Pose = 'idle' | 'flight';

type Props = {
  height: number;
  pose?: Pose;
  /** Degrees. 0 is upright; flight aims the head along velocity. */
  rotation?: number;
};

/**
 * Adult salaryman, drawn as flat shapes so he still reads at playfield scale:
 * shoulders wider than the head, shirt and tie, two legs, shoes, briefcase.
 */
export function MaxSprite({ height, pose = 'idle', rotation = 0 }: Props) {
  const width = height * (MAX_VIEW.w / MAX_VIEW.h);
  return (
    <View
      style={{
        width,
        height,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${MAX_VIEW.w} ${MAX_VIEW.h}`}>
        {pose === 'flight' ? <FlightBody /> : <IdleBody />}
        <Head mood={pose === 'flight' ? 'focus' : 'calm'} />
      </Svg>
    </View>
  );
}

function IdleBody() {
  return (
    <>
      <Path
        d="M46 102 L40 132"
        stroke={colors.suitDeep}
        strokeWidth={11}
        strokeLinecap="round"
      />
      <Path
        d="M66 102 L72 132"
        stroke={colors.suitDeep}
        strokeWidth={11}
        strokeLinecap="round"
      />
      <Rect x="30" y="128" width="20" height="8" rx="3" fill={colors.shoe} />
      <Rect x="62" y="128" width="20" height="8" rx="3" fill={colors.shoe} />
      <Rect x="33" y="129" width="7" height="2" rx="1" fill="rgba(255,255,255,0.28)" />
      <Rect x="65" y="129" width="7" height="2" rx="1" fill="rgba(255,255,255,0.28)" />

      <Path
        d="M36 64 C22 76 18 92 26 106"
        stroke={colors.suit}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Circle cx="26" cy="108" r="4.2" fill={colors.skin} />

      <Jacket />

      <Path
        d="M78 64 C94 78 98 94 88 106"
        stroke={colors.suitDeep}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Circle cx="87" cy="108" r="4.2" fill={colors.skinDeep} />
      <Briefcase x={78} y={110} />
    </>
  );
}

function FlightBody() {
  return (
    <>
      <Path
        d="M48 104 L32 128"
        stroke={colors.suitDeep}
        strokeWidth={11}
        strokeLinecap="round"
      />
      <Path
        d="M66 102 L82 122"
        stroke={colors.suitDeep}
        strokeWidth={11}
        strokeLinecap="round"
      />
      <Rect x="22" y="124" width="18" height="7" rx="3" fill={colors.shoe} />
      <Rect x="74" y="118" width="18" height="7" rx="3" fill={colors.shoe} />

      <Path
        d="M38 66 C16 84 14 104 28 116"
        stroke={colors.suit}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Circle cx="30" cy="118" r="4" fill={colors.skin} />

      <Jacket />

      <Path
        d="M76 66 C98 82 100 100 86 114"
        stroke={colors.suitDeep}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Circle cx="84" cy="116" r="4" fill={colors.skinDeep} />
      <Briefcase x={86} y={112} />
    </>
  );
}

function Jacket() {
  return (
    <>
      <Path
        d="M34 62
           C28 54 26 66 28 78
           L34 106
           L48 110
           L55 103
           L62 110
           L76 106
           L82 78
           C84 66 82 54 76 62
           L66 52
           L55 64
           L44 52
           Z"
        fill={colors.suit}
        stroke={colors.suitLight}
        strokeWidth={1.4}
      />
      <Path
        d="M34 64 C44 56 50 60 55 66"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M44 54 L55 76" stroke={colors.suitDeep} strokeWidth={1.3} fill="none" />
      <Path d="M66 54 L55 76" stroke={colors.suitDeep} strokeWidth={1.3} fill="none" />
      <Path d="M46 56 L55 82 L64 56 Z" fill={colors.shirt} />
      <Path d="M52.6 58 L57.4 58 L59.2 86 L55 90 L50.8 86 Z" fill={colors.tie} />
      <Path d="M51.8 55 L58.2 55 L56.6 63 L53.4 63 Z" fill={colors.tieDeep} />
      <Rect x="36" y="100" width="38" height="4" rx="1" fill="#1a2030" />
      <Rect x="52" y="99" width="6" height="6" rx="1.2" fill={colors.accent} />
    </>
  );
}

function Briefcase({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width="22" height="16" rx="2" fill={colors.leatherDeep} />
      <Rect x={x} y={y} width="22" height="4" rx="1" fill={colors.leather} />
      <Rect
        x={x + 7}
        y={y - 5}
        width="8"
        height="6"
        rx="1.5"
        fill="none"
        stroke={colors.leatherDeep}
        strokeWidth={1.6}
      />
      <Rect x={x + 9} y={y + 7} width="4" height="2.4" rx="0.4" fill={colors.accent} />
    </>
  );
}

function Head({ mood }: { mood: 'calm' | 'focus' }) {
  const smile =
    mood === 'calm' ? 'M48 46 Q55 49.4 62 46' : 'M49 46.2 Q55 48.2 61 46.2';
  return (
    <>
      <Rect x="50" y="44" width="10" height="12" rx="3" fill={colors.skinDeep} />
      <Ellipse cx="41" cy="36" rx="3" ry="4" fill={colors.skinDeep} />
      <Ellipse cx="69" cy="36" rx="3" ry="4" fill={colors.skinDeep} />
      <Ellipse cx="55" cy="34" rx="12" ry="13" fill={colors.skin} />
      <Path
        d="M44 30
           C44 20 66 20 66 30
           C66 24 62 21 55 21
           C48 21 44 24 44 30 Z"
        fill={colors.hair}
      />
      <Path d="M44 26 C42 32 42 38 44.5 40 C45.2 34 45.4 30 46.5 26 Z" fill={colors.hair} />
      <Path d="M66 26 C68 32 68 38 65.5 40 C64.8 34 64.6 30 63.5 26 Z" fill={colors.hair} />
      <Path
        d="M46.2 28.4 Q49 27.4 51.6 28.5"
        stroke={colors.hair}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M58.4 28.5 Q61 27.4 63.8 28.4"
        stroke={colors.hair}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="49.2" cy="34.2" rx="1.45" ry="1.65" fill={colors.hair} />
      <Ellipse cx="60.8" cy="34.2" rx="1.45" ry="1.65" fill={colors.hair} />
      <Circle cx="48.7" cy="33.6" r="0.4" fill="#fff" />
      <Circle cx="60.3" cy="33.6" r="0.4" fill="#fff" />
      <Path
        d="M55 35.4 L55 39"
        stroke={colors.skinDeep}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <Path
        d={smile}
        stroke="#8d5344"
        strokeWidth={1.15}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}
