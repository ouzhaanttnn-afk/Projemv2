// Score -> mono audio -> WAV. Mixing is mono on purpose: a phone speaker is
// one channel, so left/right separation would be lost anyway.

import { combine, hashString } from "./hash.ts";
import { TPS, compose, scoreDuration, tickToSeconds, type ComposeOptions, type Score } from "./compose.ts";
import { duet } from "./duet.ts";
import { SAMPLE_RATE, renderHit } from "./synth.ts";
import { TAU, dcos, dexp, dsin, dtanh } from "./dmath.ts";

const TAIL_SECONDS = 1.2;
const PEAK = 0.89; // about -1 dB
const LOW_CUT = 0.45; // share of the band below ~140 Hz removed (about -5 dB)
const LIMIT = 0.22; // limiter threshold after normalising (about -13 dB)
const DRIVE = 1.6; // soft saturation

/** 2nd-order high-pass (RBJ) used on the master bus. */
class MasterHighPass {
  private b0: number;
  private b1: number;
  private b2: number;
  private a1: number;
  private a2: number;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  constructor(freq: number, q: number) {
    const w0 = (TAU * freq) / SAMPLE_RATE;
    const cw = dcos(w0);
    const alpha = dsin(w0) / (2 * q);
    const a0 = 1 + alpha;
    this.b0 = (1 + cw) / 2 / a0;
    this.b1 = -(1 + cw) / a0;
    this.b2 = (1 + cw) / 2 / a0;
    this.a1 = (-2 * cw) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  run(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export function renderScore(score: Score, loops = 1, normalize = true): Float32Array {
  const loopLen = scoreDuration(score);
  const total = Math.ceil((loopLen * loops + TAIL_SECONDS) * SAMPLE_RATE);
  const mix = new Float64Array(total);
  const textSeed = hashString(score.text);
  for (let l = 0; l < loops; l++) {
    score.events.forEach((e, i) => {
      const t = tickToSeconds(score, e.tick) + l * loopLen;
      const start = Math.round(t * SAMPLE_RATE);
      renderHit(mix, start, {
        role: e.role,
        variant: e.variant,
        vel: e.vel,
        midi: e.midi,
        dur: (e.durTicks / TPS) * score.stepDur,
        alt: e.alt,
        seed: combine(textSeed, i * 7919 + e.tick),
      });
    });
  }
  // master: remove rumble the phone cannot play, turn the deep lows down so
  // they do not eat the headroom, glue with soft saturation, then bring every
  // beat to the same peak so all play equally loud
  const hp = new MasterHighPass(70, 0.7);
  if (!normalize) {
    const raw = new Float32Array(total);
    for (let i = 0; i < total; i++) raw[i] = hp.run(mix[i]);
    return raw;
  }
  const lpA = 1 - dexp((-TAU * 140) / SAMPLE_RATE);
  let low = 0;
  let peak = 0;
  for (let i = 0; i < total; i++) {
    const x = hp.run(mix[i]);
    low += lpA * (x - low);
    const v = x - LOW_CUT * low;
    mix[i] = v;
    const a = v < 0 ? -v : v;
    if (a > peak) peak = a;
  }
  // peak limiter: instant attack, smooth release, so the loud kick peaks are
  // held down and everything else can come up
  const pre = peak > 0 ? 1 / peak : 0;
  const rel = dexp(-1 / (0.08 * SAMPLE_RATE));
  let env = 0;
  peak = 0;
  for (let i = 0; i < total; i++) {
    const x = mix[i] * pre;
    const a = x < 0 ? -x : x;
    env = a > env ? a : env * rel + a * (1 - rel);
    const gain = env > LIMIT ? LIMIT / env : 1;
    const v = dtanh(x * gain * DRIVE);
    mix[i] = v;
    const b = v < 0 ? -v : v;
    if (b > peak) peak = b;
  }
  const g = peak > 0 ? PEAK / peak : 0;
  const out = new Float32Array(total);
  for (let i = 0; i < total; i++) out[i] = mix[i] * g;
  return out;
}

export function toPCM16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] < -1 ? -1 : samples[i] > 1 ? 1 : samples[i];
    pcm[i] = Math.round(v * 32767);
  }
  return pcm;
}

export function encodeWav(pcm: Int16Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const bytes = new Uint8Array(44 + pcm.length * 2);
  const dv = new DataView(bytes.buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  dv.setUint32(4, 36 + pcm.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  str(36, "data");
  dv.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, pcm[i], true);
  return bytes;
}

/** Checksum of the rendered audio, used to prove devices agree. */
export function pcmChecksum(pcm: Int16Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pcm.length; i++) {
    h = Math.imul(h ^ (pcm[i] & 0xff), 0x01000193);
    h = Math.imul(h ^ ((pcm[i] >> 8) & 0xff), 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + ":" + pcm.length;
}

export interface Beat {
  score: Score;
  pcm: Int16Array;
}

export function makeBeat(text: string, loops = 1, opts: ComposeOptions = {}): Beat | null {
  const score = compose(text, opts);
  if (!score) return null;
  return { score, pcm: toPCM16(renderScore(score, loops)) };
}

/** The first laugh, then the reply, then both together. */
export function makeDuet(first: string, reply: string, loops = 1, opts: ComposeOptions = {}): Beat | null {
  const score = duet(first, reply, opts);
  if (!score) return null;
  return { score, pcm: toPCM16(renderScore(score, loops)) };
}
