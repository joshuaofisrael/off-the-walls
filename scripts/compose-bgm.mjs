/**
 * Original background loops for Off The Walls.
 *
 * These beds are synthesized here from scratch (sines, short noise ticks, envelopes).
 * They are not recordings, transcriptions, or remixes of Karoshi or any other game.
 * Run: node scripts/compose-bgm.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const BPM = 75;
const BEATS = 16;
const BEAT = 60 / BPM;
const DUR = BEATS * BEAT; // 12.8s, so the drones below close on an integer cycle
const N = Math.round(SR * DUR);

const F = {
  sub: 55, // A1, 704 cycles / loop
  bass: 73.4375, // near D2, 940 cycles / loop
  drone: 110, // A2
  clash: 116.5625, // near Bb2, overtime only
  fifth: 155.46875, // near Eb3, a flat fifth over the drone
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function env(t, attack, decay) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  return Math.exp(-(t - attack) / decay);
}

function addNote(buf, startBeat, freq, amp, decay, color) {
  const start = Math.floor(startBeat * BEAT * SR);
  const life = Math.ceil((0.02 + decay * 6) * SR);
  const end = Math.min(N, start + life);
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const e = env(t, 0.012, decay);
    const p = 2 * Math.PI * freq * t;
    const tone = Math.sin(p) + color * Math.sin(2 * p + 0.4);
    buf[i] += amp * e * tone;
  }
}

function addHats(buf, rng, amp, every) {
  for (let b = 0; b < BEATS; b += every) {
    const start = Math.floor((b + 0.5) * BEAT * SR);
    let prev = 0;
    for (let i = 0; i < Math.floor(0.045 * SR); i++) {
      const n = rng() * 2 - 1;
      const hp = n - prev;
      prev = n;
      const t = i / SR;
      if (start + i < N) buf[start + i] += amp * hp * Math.exp(-t / 0.018);
    }
  }
}

function render(kind) {
  const buf = new Float64Array(N);
  const rng = mulberry32(kind === 'overtime' ? 0x0a77e1 : 0x51a17);
  const tense = kind === 'overtime';

  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const wobble = 0.86 + 0.14 * Math.sin(2 * Math.PI * (6 / DUR) * t);
    let drone = 0.07 * Math.sin(2 * Math.PI * F.drone * t);
    drone += 0.028 * Math.sin(2 * Math.PI * F.fifth * t);
    if (tense) drone += 0.04 * Math.sin(2 * Math.PI * F.clash * t);
    buf[i] += drone * wobble;
  }

  const bassBeats = tense
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    : [0, 3, 4, 7, 8, 11, 12];
  for (const b of bassBeats) {
    addNote(buf, b, F.bass, tense ? 0.16 : 0.2, tense ? 0.16 : 0.42, 0.18);
    if (b % 4 === 0) addNote(buf, b, F.sub, tense ? 0.14 : 0.1, 0.5, 0);
  }

  // Original phrases. Fluorescent is sparse; overtime steps on the off-beats and doesn't resolve.
  const lead = tense
    ? [
        [0, 293.66],
        [1, 415.3],
        [2, 392.0],
        [3.5, 349.23],
        [4.5, 311.13],
        [6, 293.66],
        [7, 415.3],
        [8, 466.16],
        [9.5, 392.0],
        [11, 349.23],
        [12, 311.13],
        [13.5, 293.66],
      ]
    : [
        [0, 293.66],
        [2, 349.23],
        [3.5, 311.13],
        [5, 261.63],
        [6.5, 415.3],
        [8, 392.0],
        [10, 349.23],
        [11.5, 293.66],
        [13, 261.63],
      ];
  for (const [beat, freq] of lead) {
    addNote(buf, beat, freq, tense ? 0.11 : 0.09, tense ? 0.2 : 0.34, 0.22);
  }

  addHats(buf, rng, tense ? 0.045 : 0.022, tense ? 0.5 : 1);

  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const gain = 0.86 / (peak || 1);
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const x = Math.tanh(buf[i] * gain * 1.15);
    buf[i] = x;
    sum += x * x;
  }
  const rms = Math.sqrt(sum / N);
  const seam = Math.max(Math.abs(buf[0]), Math.abs(buf[N - 1]));
  if (rms < 0.04 || rms > 0.28) {
    throw new Error(`${kind} rms ${rms.toFixed(3)} is outside the bed range`);
  }
  if (seam > 0.08) {
    throw new Error(`${kind} loop seam is ${seam.toFixed(3)} (would click)`);
  }
  return { samples: buf, rms, seam };
}

function wavBytes(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
mkdirSync(outDir, { recursive: true });

for (const kind of ['fluorescent', 'overtime']) {
  const { samples, rms, seam } = render(kind);
  const file = join(outDir, `${kind}.wav`);
  writeFileSync(file, wavBytes(samples));
  console.log(
    `${kind}.wav  ${DUR.toFixed(1)}s  rms ${rms.toFixed(3)}  seam ${seam.toFixed(4)}  ${samples.length} frames`,
  );
}
