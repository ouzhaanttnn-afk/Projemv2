// The 36 sounds (6 roles x 6 variants), synthesised sample by sample with
// deterministic math so every device renders identical audio.
//
// Phone speakers barely reproduce anything below ~200 Hz (assumption, see
// PLAN.md 4.6), so kicks get a click and a pitch drop, and basses get
// saturation harmonics that let the ear infer the low note.

import { Rng } from "./hash.ts";
import { VARIANT_GAIN } from "./calibration.ts";
import { TAU, clamp, dcos, decayFactor, dexp, dsin, dtanh, midiToHz, sinCycle } from "./dmath.ts";

export const SAMPLE_RATE = 44100;
const SR = SAMPLE_RATE;

export const VARIANT_NAMES: string[][] = [
  ["808", "Yumruk", "Tok", "Bozuk", "Yumuşak", "Davul", "Kudüm"],
  ["El çırpma", "Trampet", "Kenar", "Şıklatma", "Darbuka tek", "Eski trampet"],
  ["Kapalı zil", "Shaker", "Tık", "Metal", "Tahta", "Kaşık"],
  ["Sub bas", "Çekme bas", "Hırıltı", "Kalın şerit", "Kare bas", "Saz bas"],
  ["Çekme tel", "Çan", "Atari", "Marimba", "Saz", "Ney ıslığı", "Kanun"],
  ["Zil", "Darbuka", "Halay alkışı", "Kaşık şakırtı", "Tef", "Zurna", "Bendir", "Ters zil"],
];

// ---------------------------------------------------------------- filters

class Biquad {
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  constructor(type: "lp" | "hp" | "bp", freq: number, q: number) {
    const w0 = (TAU * clamp(freq, 10, SR * 0.45)) / SR;
    const cw = dcos(w0);
    const sw = dsin(w0);
    const alpha = sw / (2 * q);
    const a0 = 1 + alpha;
    let b0: number, b1: number, b2: number;
    if (type === "lp") {
      b0 = (1 - cw) / 2;
      b1 = 1 - cw;
      b2 = (1 - cw) / 2;
    } else if (type === "hp") {
      b0 = (1 + cw) / 2;
      b1 = -(1 + cw);
      b2 = (1 + cw) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
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

function onePoleCoef(freq: number): number {
  return 1 - dexp((-TAU * freq) / SR);
}

// ---------------------------------------------------------------- helpers

type Out = Float64Array;

function write(out: Out, start: number, i: number, v: number) {
  const k = start + i;
  if (k >= 0 && k < out.length) out[k] += v;
}

/** short linear fade at the end of a voice to avoid clicks */
function fadeOut(i: number, len: number): number {
  const f = Math.min(len, 220);
  return i > len - f ? (len - i) / f : 1;
}

function samples(seconds: number): number {
  return Math.max(1, Math.round(seconds * SR));
}

/** decaying filtered noise burst */
function noiseBurst(
  out: Out,
  start: number,
  rng: Rng,
  amp: number,
  tau: number,
  filters: Biquad[],
  delay = 0,
  attack = 0,
) {
  const len = samples(tau * 6);
  const dk = decayFactor(tau, SR);
  const d0 = samples(delay);
  const att = samples(attack);
  let env = amp;
  for (let i = 0; i < len; i++) {
    let x = rng.noise();
    for (const f of filters) x = f.run(x);
    const a = att > 1 && i < att ? i / att : 1;
    write(out, start + d0, i, x * env * a * fadeOut(i, len));
    env *= dk;
  }
}

/** decaying sine with optional exponential pitch drop */
function sineHit(
  out: Out,
  start: number,
  amp: number,
  f0: number,
  f1: number,
  pitchTau: number,
  tau: number,
  drive = 1,
  delay = 0,
) {
  const len = samples(tau * 6);
  const dk = decayFactor(tau, SR);
  const pk = decayFactor(pitchTau, SR);
  const d0 = samples(delay);
  let env = amp;
  let fd = f0 - f1;
  let phase = 0;
  const norm = drive > 1 ? 1 / dtanh(drive) : 1;
  for (let i = 0; i < len; i++) {
    phase += (f1 + fd) / SR;
    fd *= pk;
    let v = sinCycle(phase) * env;
    if (drive > 1) v = dtanh(v * drive) * norm;
    write(out, start + d0, i, v * fadeOut(i, len));
    env *= dk;
  }
}

// ---------------------------------------------------------------- roles

const KICKS: [number, number, number, number, number, number][] = [
  // f0, f1, pitchTau, ampTau, drive, click
  [165, 48, 0.035, 0.085, 3.2, 0.6],
  [200, 58, 0.025, 0.045, 2.4, 0.9],
  [250, 88, 0.02, 0.028, 2, 1],
  [175, 52, 0.03, 0.065, 7, 0.7],
  [130, 56, 0.04, 0.05, 1.8, 0.35],
  [110, 64, 0.05, 0.075, 3, 0.5],
];

function kick(out: Out, start: number, v: number, vel: number, rng: Rng) {
  if (v === 6) {
    // kudüm: a taut low drum, then the small high drum answering softly
    sineHit(out, start, vel, 135, 82, 0.03, 0.07, 2.4);
    sineHit(out, start, vel * 0.3, 270, 200, 0.02, 0.04, 1.6);
    noiseBurst(out, start, rng, vel * 0.35, 0.006, [new Biquad("bp", 700, 1.2)]);
    sineHit(out, start, vel * 0.38, 240, 205, 0.01, 0.035, 1.8, 0.085);
    return;
  }
  const [f0, f1, pt, at, drive, click] = KICKS[v];
  sineHit(out, start, vel, f0, f1, pt, at, drive);
  // second harmonic band so the hit is heard on small speakers
  sineHit(out, start, vel * 0.35, f0 * 2, f1 * 3, pt, at * 0.7, 2);
  noiseBurst(out, start, rng, vel * click * 0.5, 0.0025, [new Biquad("hp", 1800, 0.7)]);
  if (v === 4) noiseBurst(out, start, rng, vel * 0.3, 0.02, [new Biquad("lp", 400, 0.7)]);
  if (v === 5) {
    noiseBurst(out, start, rng, vel * 0.45, 0.05, [new Biquad("bp", 320, 1.2)]);
    noiseBurst(out, start, rng, vel * 0.3, 0.012, [new Biquad("hp", 2500, 0.7)]);
  }
}

function clap(out: Out, start: number, vel: number, rng: Rng, bp = 1200) {
  for (let k = 0; k < 3; k++)
    noiseBurst(out, start, rng, vel * 0.7, 0.005, [new Biquad("bp", bp, 0.9), new Biquad("hp", 500, 0.7)], k * 0.009);
  noiseBurst(out, start, rng, vel * 0.8, 0.045, [new Biquad("bp", bp, 0.8), new Biquad("hp", 500, 0.7)], 0.02);
}

function snareBody(out: Out, start: number, vel: number, rng: Rng, tau: number, lp?: number) {
  sineHit(out, start, vel * 0.55, 200, 175, 0.02, 0.03);
  sineHit(out, start, vel * 0.3, 340, 320, 0.02, 0.02);
  const f = [new Biquad("hp", 1400, 0.7)];
  if (lp) f.push(new Biquad("lp", lp, 0.7));
  noiseBurst(out, start, rng, vel * 0.85, tau, f);
}

function snare(out: Out, start: number, v: number, vel: number, rng: Rng) {
  switch (v) {
    case 0:
      clap(out, start, vel, rng);
      break;
    case 1:
      snareBody(out, start, vel, rng, 0.05);
      break;
    case 2:
      sineHit(out, start, vel * 0.6, 1720, 1700, 0.01, 0.007);
      sineHit(out, start, vel * 0.5, 780, 760, 0.01, 0.01);
      noiseBurst(out, start, rng, vel * 0.4, 0.002, [new Biquad("hp", 2000, 0.7)]);
      break;
    case 3:
      noiseBurst(out, start, rng, vel * 1.2, 0.014, [new Biquad("bp", 2800, 1.4)]);
      sineHit(out, start, vel * 0.25, 1100, 900, 0.005, 0.006);
      break;
    case 4: // darbuka "tek"
      sineHit(out, start, vel * 0.7, 600, 520, 0.01, 0.022);
      sineHit(out, start, vel * 0.3, 1180, 1100, 0.01, 0.012);
      noiseBurst(out, start, rng, vel * 0.5, 0.004, [new Biquad("bp", 4200, 1.2)]);
      break;
    default:
      snareBody(out, start, vel * 0.8, rng, 0.08, 2300);
  }
}

const HAT_RATIOS = [263, 400, 421, 474, 587, 845];

function hat(out: Out, start: number, v: number, vel: number, alt: number, rng: Rng) {
  const open = alt ? 5 : 1;
  switch (v) {
    case 0:
      noiseBurst(out, start, rng, vel, 0.012 * open, [new Biquad("hp", 7000, 0.7)]);
      break;
    case 1:
      noiseBurst(out, start, rng, vel * 1.1, 0.018 * open, [new Biquad("bp", 5500, 1)], 0, 0.008);
      break;
    case 2:
      sineHit(out, start, vel * 0.5, 3300, 3300, 1, 0.004 * open);
      noiseBurst(out, start, rng, vel * 0.5, 0.002 * open, [new Biquad("hp", 8000, 0.7)]);
      break;
    case 3: {
      const len = samples(0.09 * open);
      const dk = decayFactor(0.015 * open, SR);
      const bp = new Biquad("bp", 9000, 0.7);
      const hp = new Biquad("hp", 7000, 0.7);
      const ph = [0, 0, 0, 0, 0, 0];
      let env = vel * 0.6;
      for (let i = 0; i < len; i++) {
        let x = 0;
        for (let k = 0; k < 6; k++) {
          ph[k] += (HAT_RATIOS[k] * 1.7) / SR;
          x += ph[k] - Math.floor(ph[k]) < 0.5 ? 1 : -1;
        }
        write(out, start, i, hp.run(bp.run(x / 6)) * env * fadeOut(i, len));
        env *= dk;
      }
      break;
    }
    case 4:
      sineHit(out, start, vel * 0.6, 880, 870, 0.01, 0.01 * open);
      sineHit(out, start, vel * 0.25, 2200, 2190, 0.01, 0.004 * open);
      break;
    default:
      noiseBurst(out, start, rng, vel * 0.9, 0.004 * open, [new Biquad("bp", 3200, 2)]);
      noiseBurst(out, start, rng, vel * 0.7, 0.004 * open, [new Biquad("bp", 3600, 2)], 0.014);
  }
}

/** Karplus-Strong plucked string. */
function pluckString(
  out: Out,
  start: number,
  freq: number,
  vel: number,
  seconds: number,
  damp: number,
  bright: number,
  rng: Rng,
  buzz = 0,
) {
  const n = Math.max(2, Math.round(SR / freq));
  const buf = new Float64Array(n);
  let lp = 0;
  const c = onePoleCoef(bright);
  for (let i = 0; i < n; i++) {
    lp += c * (rng.noise() - lp);
    buf[i] = lp;
  }
  const len = samples(seconds);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = buf[idx];
    const nxt = buf[(idx + 1) % n];
    buf[idx] = damp * 0.5 * (cur + nxt);
    let v = cur * 2;
    if (buzz > 0) v = dtanh(v * (1 + buzz));
    write(out, start, i, v * vel * fadeOut(i, len));
    idx = (idx + 1) % n;
  }
}

function bass(out: Out, start: number, v: number, midi: number, dur: number, vel: number, rng: Rng) {
  const f = midiToHz(midi);
  const rel = 0.04;
  const len = samples(dur + rel);
  const relStart = samples(dur);
  const att = samples(0.004);
  const env = (i: number) => (i < att ? i / att : 1) * (i > relStart ? Math.max(0, 1 - (i - relStart) / samples(rel)) : 1);
  if (v === 5) {
    pluckString(out, start, f, vel * 0.9, dur + rel, 0.997, 1800, rng, 1.2);
    return;
  }
  let ph = 0;
  let ph2 = 0;
  let decay = 1;
  const dk = decayFactor(v === 0 ? 0.6 : v === 4 ? 0.25 : 0.4, SR);
  const lp1 = new Biquad("lp", v === 3 ? 700 : v === 4 ? 1100 : 900, v === 3 ? 1 : 0.7);
  // time-varying one-pole for the plucked bass
  const aHi = onePoleCoef(2600);
  const aLo = onePoleCoef(320);
  const ek = decayFactor(0.08, SR);
  let fenv = 1;
  let y = 0;
  let idx = 1;
  const ik = decayFactor(0.15, SR);
  for (let i = 0; i < len; i++) {
    ph += f / SR;
    let x: number;
    switch (v) {
      case 0: {
        x = 0.6 * sinCycle(ph) + 0.45 * sinCycle(ph * 2) + 0.3 * sinCycle(ph * 3);
        x = dtanh(x * 3) * 0.8;
        break;
      }
      case 1: {
        const saw = (ph - Math.floor(ph)) * 2 - 1;
        const a = aLo + (aHi - aLo) * fenv;
        y += a * (saw - y);
        fenv *= ek;
        x = dtanh(y * 1.6);
        break;
      }
      case 2: {
        x = dsin(TAU * (ph - Math.floor(ph)) + (1 + 3 * idx) * sinCycle(ph));
        idx *= ik;
        x = dtanh(x * 1.5);
        break;
      }
      case 3: {
        ph2 += (f * 1.007) / SR;
        const s1 = (ph - Math.floor(ph)) * 2 - 1;
        const s2 = (ph2 - Math.floor(ph2)) * 2 - 1;
        x = dtanh(lp1.run((s1 + s2) * 0.6) * 1.8);
        break;
      }
      default: {
        const sq = ph - Math.floor(ph) < 0.5 ? 1 : -1;
        x = dtanh(lp1.run(sq) * 1.4);
      }
    }
    write(out, start, i, x * vel * env(i) * decay * fadeOut(i, len));
    decay *= dk;
  }
}

function melody(out: Out, start: number, v: number, midi: number, dur: number, vel: number, rng: Rng) {
  const f = midiToHz(midi);
  switch (v) {
    case 6: {
      // kanun: bright plucked string, struck twice with the mızrap
      const twin = new Rng(rng.u32());
      pluckString(out, start, f, vel * 0.8, 1.0, 0.998, 9000, rng);
      pluckString(out, start + samples(0.028), f * 1.0017, vel * 0.5, 0.9, 0.998, 9000, twin);
      noiseBurst(out, start, rng, vel * 0.2, 0.002, [new Biquad("hp", 4000, 0.7)]);
      return;
    }
    case 0:
      pluckString(out, start, f, vel, 0.7, 0.996, 5000, rng);
      return;
    case 4:
      pluckString(out, start, f, vel * 0.9, 0.9, 0.998, 7000, rng, 0.8);
      noiseBurst(out, start, rng, vel * 0.25, 0.003, [new Biquad("bp", 3000, 1.5)]);
      return;
    case 1: {
      const len = samples(1.2);
      const dk = decayFactor(0.35, SR);
      const ik = decayFactor(0.12, SR);
      let env = vel * 0.6;
      let index = 2.5;
      let ph = 0;
      for (let i = 0; i < len; i++) {
        ph += f / SR;
        const x = dsin(TAU * (ph - Math.floor(ph)) + index * sinCycle(ph * 3.5));
        write(out, start, i, x * env * fadeOut(i, len));
        env *= dk;
        index *= ik;
      }
      return;
    }
    case 2: {
      const len = samples(Math.max(0.08, dur) + 0.03);
      const dk = decayFactor(0.18, SR);
      let env = vel * 0.32;
      let ph = 0;
      for (let i = 0; i < len; i++) {
        ph += f / SR;
        const x = ph - Math.floor(ph) < 0.25 ? 1 : -1;
        write(out, start, i, x * env * fadeOut(i, len));
        env *= dk;
      }
      return;
    }
    case 3:
      sineHit(out, start, vel * 0.7, f, f, 1, 0.12);
      sineHit(out, start, vel * 0.3, f * 3.93, f * 3.93, 1, 0.02);
      sineHit(out, start, vel * 0.08, f * 10.2, f * 10.2, 1, 0.006);
      return;
    default: {
      // ney-like whistle: soft attack, late vibrato, breath noise
      const total = Math.max(0.12, dur) + 0.08;
      const len = samples(total);
      const att = samples(0.04);
      const relStart = samples(Math.max(0.12, dur));
      const breath = new Biquad("bp", f * 2, 3);
      let ph = 0;
      let vph = 0;
      for (let i = 0; i < len; i++) {
        vph += 5.2 / SR;
        const vib = i > samples(0.08) ? 1 + 0.006 * sinCycle(vph) : 1;
        ph += (f * vib) / SR;
        const a = (i < att ? i / att : 1) * (i > relStart ? Math.max(0, 1 - (i - relStart) / (len - relStart)) : 1);
        const x = sinCycle(ph) * 0.6 + breath.run(rng.noise()) * 0.25;
        write(out, start, i, x * a * vel * fadeOut(i, len));
      }
    }
  }
}

const ZIL_PARTIALS: [number, number, number][] = [
  [1, 1, 0.18],
  [1.47, 0.7, 0.15],
  [2.09, 0.55, 0.12],
  [2.56, 0.45, 0.1],
  [3.17, 0.35, 0.08],
  [3.79, 0.25, 0.06],
];

function spice(out: Out, start: number, v: number, midi: number, vel: number, rng: Rng) {
  switch (v) {
    case 6: {
      // bendir: deep frame drum with its buzzing snare string
      sineHit(out, start, vel * 0.8, 105, 72, 0.02, 0.06, 1.8);
      const len = samples(0.35);
      const dk = decayFactor(0.07, SR);
      const bp = new Biquad("bp", 1400, 0.8);
      let env = vel * 0.55;
      let ph = 0;
      for (let i = 0; i < len; i++) {
        ph += 85 / SR;
        const buzz = bp.run(rng.noise()) * (0.6 + 0.4 * sinCycle(ph));
        write(out, start, i, buzz * env * fadeOut(i, len));
        env *= dk;
      }
      return;
    }
    case 7: {
      // ters zil: a cymbal played backwards, swelling into the beat
      const len = samples(0.42);
      const hp = new Biquad("hp", 5200, 0.7);
      const ph = [0, 0, 0, 0];
      const ratios = [1, 1.47, 2.09, 2.56];
      for (let i = 0; i < len; i++) {
        const k = i / len;
        const env = vel * 0.7 * k * k * k;
        let x = hp.run(rng.noise()) * 0.6;
        for (let j = 0; j < 4; j++) {
          ph[j] += (1700 * ratios[j]) / SR;
          x += 0.12 * sinCycle(ph[j]);
        }
        write(out, start - len, i, x * env);
      }
      return;
    }
    case 0: // zil (finger cymbal)
      for (const [r, a, t] of ZIL_PARTIALS) sineHit(out, start, vel * a * 0.22, 1850 * r, 1850 * r, 1, t);
      noiseBurst(out, start, rng, vel * 0.3, 0.003, [new Biquad("hp", 6000, 0.7)]);
      return;
    case 1: // darbuka "düm-tek" colour
      sineHit(out, start, vel * 0.6, 640, 560, 0.008, 0.02);
      sineHit(out, start, vel * 0.25, 1300, 1250, 0.008, 0.01);
      noiseBurst(out, start, rng, vel * 0.5, 0.005, [new Biquad("bp", 5000, 1.3)]);
      return;
    case 2: // group hand claps
      clap(out, start, vel * 0.8, rng, 1100);
      clap(out, start + samples(0.011), vel * 0.7, rng, 1550);
      return;
    case 3: // spoons rattle
      for (let k = 0; k < 3; k++)
        noiseBurst(out, start, rng, vel * (1 - k * 0.25), 0.004, [new Biquad("bp", 3300 + k * 300, 2)], k * 0.03);
      return;
    case 4: // tef (frame drum with jingles)
      sineHit(out, start, vel * 0.6, 180, 150, 0.01, 0.03, 1.5);
      noiseBurst(out, start, rng, vel * 0.55, 0.05, [new Biquad("hp", 6500, 0.7)], 0.004);
      return;
    default: {
      // zurna blip: nasal reed
      const f = midiToHz(midi);
      const len = samples(0.22);
      const att = samples(0.01);
      const dk = decayFactor(0.08, SR);
      const f1 = new Biquad("bp", 1600, 2);
      const f2 = new Biquad("bp", 3000, 3);
      let env = vel;
      let ph = 0;
      for (let i = 0; i < len; i++) {
        ph += f / SR;
        const saw = (ph - Math.floor(ph)) * 2 - 1;
        const x = dtanh((f1.run(saw) + 0.6 * f2.run(saw)) * 3) * 0.45;
        write(out, start, i, x * env * (i < att ? i / att : 1) * fadeOut(i, len));
        env *= dk;
      }
    }
  }
}

export interface Hit {
  role: number;
  variant: number;
  vel: number;
  midi: number;
  dur: number; // seconds
  alt: number;
  seed: number;
}

/**
 * Render one hit into the mix buffer at sample `start`. `gain` defaults to the
 * calibrated level of this variant (tools/calibrate.ts).
 */
export function renderHit(out: Out, start: number, h: Hit, gain?: number) {
  const rng = new Rng(h.seed);
  const vel = h.vel * (gain ?? VARIANT_GAIN[h.role][h.variant]);
  switch (h.role) {
    case 0:
      kick(out, start, h.variant, vel, rng);
      break;
    case 1:
      snare(out, start, h.variant, vel, rng);
      break;
    case 2:
      hat(out, start, h.variant, vel, h.alt, rng);
      break;
    case 3:
      bass(out, start, h.variant, h.midi, h.dur, vel, rng);
      break;
    case 4:
      melody(out, start, h.variant, h.midi, h.dur, vel, rng);
      break;
    default:
      spice(out, start, h.variant, h.midi, vel, rng);
  }
}
