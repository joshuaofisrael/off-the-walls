import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';
import { MaxSprite } from './MaxSprite';
import { OfficeBackdrop } from './office';

type Props = {
  onPlay: () => void;
  onLevels: () => void;
};

const STEPS = [
  { n: '01', t: 'Drag to aim. A longer pull is more power.' },
  { n: '02', t: 'Release to launch. Ricochet off the walls.' },
  { n: '03', t: 'Reach the bottle. Meds unlocked.' },
];

export function TitleScreen({ onPlay, onLevels }: Props) {
  return (
    <View style={styles.root}>
      <OfficeBackdrop />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>A SALARYMAN PUZZLE</Text>
          <View style={styles.stage}>
            <View style={styles.shadow} />
            <MaxSprite height={168} pose="idle" />
          </View>
          <Text style={styles.title}>Off The Walls</Text>
          <View style={styles.rule} />
          <Text style={styles.sub}>
            Max has ADD, a plan, and zero chill.{'\n'}
            Bounce him to his meds.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to play</Text>
          {STEPS.map((step) => (
            <View key={step.n} style={styles.step}>
              <Text style={styles.stepN}>{step.n}</Text>
              <Text style={styles.stepT}>{step.t}</Text>
            </View>
          ))}
          <Text style={styles.cardHint}>
            Warm, chaotic, affirming — never mocking. You and Max got this.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onPlay}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={['#f0d7a8', '#e4c48a', '#c6a36a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryFill}
            >
              <Text style={styles.primaryText}>PLAY</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={onLevels}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>DEPARTURES</Text>
          </Pressable>
        </View>

        <Text style={styles.credit}>JOSHUA ISRAEL VENTURES LLC</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
    justifyContent: 'space-between',
    gap: 18,
  },
  hero: { alignItems: 'center' },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3.2,
    marginBottom: 6,
  },
  stage: {
    height: 176,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shadow: {
    position: 'absolute',
    bottom: 10,
    width: 78,
    height: 12,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 40,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  rule: {
    marginTop: 8,
    width: 42,
    height: 1,
    backgroundColor: colors.accent,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.panelLine,
    gap: 10,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    marginBottom: 2,
  },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepN: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    width: 24,
    marginTop: 2,
  },
  stepT: { color: colors.textMuted, fontSize: 14, lineHeight: 20, flex: 1 },
  cardHint: {
    color: colors.accentHot,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: { gap: 10 },
  primary: { borderRadius: 14, overflow: 'hidden' },
  primaryFill: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#1a140c',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 3,
  },
  secondary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.panelLine,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 2.4,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  credit: {
    color: colors.textDim,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
});
