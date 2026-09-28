import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import type { Wall } from '../types';

const FRAME_IDS = new Set(['floor', 'ceil', 'left', 'right']);

export function OfficeBackdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.ignore]}>
      <LinearGradient
        colors={['#090b10', '#121820', '#14110e']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(231,238,242,0.18)', 'rgba(231,238,242,0)']}
        style={styles.wash}
      />
      <View style={styles.tube} />
      {[16, 38, 62, 84].map((pct) => (
        <View key={pct} style={[styles.mullion, { left: `${pct}%` }]} />
      ))}
    </View>
  );
}

export function CourtSurface({ width, height }: { width: number; height: number }) {
  const lightW = Math.max(36, width * 0.16);
  return (
    <View style={[StyleSheet.absoluteFill, styles.ignore]}>
      <LinearGradient
        colors={['#1c2533', '#141a24', '#191610']}
        locations={[0, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      {[0.25, 0.5, 0.75].map((p) => (
        <View
          key={p}
          style={{
            position: 'absolute',
            left: width * p,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.035)',
          }}
        />
      ))}
      <LinearGradient
        colors={['rgba(231,238,242,0.14)', 'rgba(231,238,242,0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height * 0.16 }}
      />
      {[0.22, 0.5, 0.78].map((p) => (
        <View
          key={p}
          style={{
            position: 'absolute',
            top: 8,
            left: width * p - lightW / 2,
            width: lightW,
            height: 5,
            borderRadius: 2,
            backgroundColor: 'rgba(231,238,242,0.72)',
          }}
        />
      ))}
      <LinearGradient
        colors={['rgba(228,196,138,0)', 'rgba(228,196,138,0.07)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.14 }}
      />
    </View>
  );
}

export function FieldPiece({ wall, s }: { wall: Wall; s: number }) {
  const left = wall.x * s;
  const top = wall.y * s;
  const w = wall.w * s;
  const h = wall.h * s;
  const frame = FRAME_IDS.has(wall.id);

  if (wall.kind === 'hazard') {
    const stripe = Math.max(5, s * 6);
    const count = Math.ceil(w / stripe) + 4;
    return (
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          backgroundColor: colors.hazard,
          borderRadius: 2,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.35)',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: stripe * 0.55,
              height: h * 3,
              backgroundColor: colors.hazardStripe,
              left: i * stripe - h,
              top: -h,
              transform: [{ rotate: '32deg' }],
              opacity: 0.9,
            }}
          />
        ))}
      </View>
    );
  }

  if (wall.kind === 'pad') {
    return (
      <View style={{ position: 'absolute', left: left - 3, top: top - 4, width: w + 6, height: h + 8 }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 2,
            bottom: 0,
            borderRadius: 6,
            backgroundColor: 'rgba(125,222,192,0.28)',
          }}
        />
        <LinearGradient
          colors={[colors.padLight, colors.pad, colors.padDark]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            left: 3,
            right: 3,
            top: 3,
            bottom: 3,
            borderRadius: 3,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={styles.padShine} />
          <View style={styles.padChevrons}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.chev, { opacity: 0.35 + i * 0.2 }]} />
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (wall.kind === 'moving') {
    return (
      <LinearGradient
        colors={['#f0d7a8', colors.moving, colors.movingDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          justifyContent: 'center',
        }}
      >
        <View style={[styles.bolt, { left: 4 }]} />
        <View style={[styles.bolt, { right: 4 }]} />
        <View style={styles.rail} />
      </LinearGradient>
    );
  }

  if (frame) {
    const lip =
      wall.id === 'floor'
        ? styles.lipTop
        : wall.id === 'ceil'
          ? styles.lipBottom
          : wall.id === 'left'
            ? styles.lipRight
            : styles.lipLeft;
    return (
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          backgroundColor: colors.frame,
        }}
      >
        <View style={[styles.lip, lip]} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#e4ebf2', colors.wall, colors.wallDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        borderRadius: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <View style={styles.glassShine} />
    </LinearGradient>
  );
}

export function MedsBottle({ size }: { size: number }) {
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.85,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glow, {
          toValue: 0.28,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const bottleW = size * 0.7;
  const bottleH = size * 0.92;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: size,
          backgroundColor: 'rgba(228,196,138,0.45)',
          opacity: glow,
        }}
      />
      <Svg width={bottleW} height={bottleH} viewBox="0 0 48 64">
        <Rect x="15" y="1" width="18" height="9" rx="2" fill={colors.bottleCap} />
        <Rect x="12" y="8" width="24" height="3.5" rx="1" fill="#4a4034" />
        <Rect x="18" y="11" width="12" height="6" fill="#e7eef0" />
        <Rect x="8" y="16" width="32" height="46" rx="7" fill={colors.bottle} stroke="#d9d3c8" strokeWidth={1} />
        <Rect x="12" y="22" width="4.5" height="32" rx="2" fill="#fff" opacity={0.7} />
        <Rect x="13" y="28" width="22" height="18" rx="2" fill={colors.label} />
        <Rect x="16" y="39" width="16" height="1" fill="rgba(140,106,56,0.45)" />
        <SvgText
          x="24"
          y="40"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
          fill={colors.tie}
          fontFamily={fonts.display}
        >
          Rx
        </SvgText>
      </Svg>
    </View>
  );
}

export function Notice({ text, maxWidth }: { text: string; maxWidth: number }) {
  return (
    <View style={[styles.notice, { maxWidth }]}>
      <Text style={styles.noticeKicker}>NOTICE</Text>
      <Text style={styles.noticeText}>{text.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ignore: { pointerEvents: 'none' },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 88 },
  tube: {
    position: 'absolute',
    top: 10,
    left: '29%',
    width: '42%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(236,242,245,0.85)',
  },
  mullion: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  padShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  padChevrons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '70%',
  },
  chev: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#f4fffb',
    transform: [{ rotate: '-45deg' }],
  },
  bolt: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4a341c',
    top: '50%',
    marginTop: -2,
  },
  rail: {
    alignSelf: 'center',
    width: '46%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(74,52,28,0.45)',
  },
  lip: { position: 'absolute', backgroundColor: colors.accent },
  lipTop: { left: 0, right: 0, top: 0, height: 1.5 },
  lipBottom: { left: 0, right: 0, bottom: 0, height: 1.5 },
  lipLeft: { left: 0, top: 0, bottom: 0, width: 1.5 },
  lipRight: { right: 0, top: 0, bottom: 0, width: 1.5 },
  glassShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '38%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  notice: {
    backgroundColor: colors.notify,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.notifyBorder,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noticeKicker: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  noticeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});
