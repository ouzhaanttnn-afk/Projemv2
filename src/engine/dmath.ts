// Deterministic math.
//
// Every device must produce bit-identical audio for the same text. JavaScript
// engines are free to implement Math.sin, Math.exp, Math.pow etc. slightly
// differently, so the engine never calls them. Only + - * /, Math.sqrt,
// Math.floor/round/abs/min/max and Math.imul are used, which are exactly
// specified by IEEE 754 / ECMAScript.

export const PI = 3.141592653589793;
export const TAU = 6.283185307179586;
const HALF_PI = 1.5707963267948966;
const LN2 = 0.6931471805599453;

/** sin(x) via range reduction and an odd Taylor polynomial (error < 1e-7). */
export function dsin(x: number): number {
  let r = x - Math.round(x / TAU) * TAU; // [-PI, PI]
  if (r > HALF_PI) r = PI - r;
  else if (r < -HALF_PI) r = -PI - r;
  const r2 = r * r;
  let p = 1 / 6227020800;
  p = -1 / 39916800 + r2 * p;
  p = 1 / 362880 + r2 * p;
  p = -1 / 5040 + r2 * p;
  p = 1 / 120 + r2 * p;
  p = -1 / 6 + r2 * p;
  p = 1 + r2 * p;
  return r * p;
}

export function dcos(x: number): number {
  return dsin(x + HALF_PI);
}

/** sin(2*PI*phase) for a phase in cycles. */
export function sinCycle(phase: number): number {
  return dsin((phase - Math.floor(phase)) * TAU);
}

/** exp(x) via reduction by ln2, Taylor series and exact powers of two. */
export function dexp(x: number): number {
  if (x < -700) return 0;
  if (x > 700) return Infinity;
  const k = Math.round(x / LN2);
  const r = x - k * LN2; // |r| <= 0.347
  let term = 1;
  let sum = 1;
  for (let i = 1; i <= 12; i++) {
    term = (term * r) / i;
    sum += term;
  }
  let p = 1;
  if (k > 0) for (let i = 0; i < k; i++) p *= 2;
  else for (let i = 0; i < -k; i++) p *= 0.5;
  return sum * p;
}

/** Per-sample multiplier so that a value decays by 1/e every `seconds`. */
export function decayFactor(seconds: number, sampleRate: number): number {
  if (seconds <= 0) return 0;
  return dexp(-1 / (seconds * sampleRate));
}

/** Smooth saturation, a rational tanh approximation clipped at +-1. */
export function dtanh(x: number): number {
  if (x >= 3) return 1;
  if (x <= -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

// 2^(i/12) for i = 0..11, written as literals so no engine computes them.
const SEMITONES = [
  1, 1.0594630943592953, 1.122462048309373, 1.189207115002721, 1.2599210498948732,
  1.3348398541700344, 1.4142135623730951, 1.4983070768766815, 1.5874010519682994,
  1.6817928305074292, 1.7817974362806788, 1.8877486253633868,
];
const QUARTER_TONE = 1.029302236643492; // 2^(1/24)

/** MIDI note (integer or half-step multiple of 0.5) to frequency in Hz. */
export function midiToHz(midi: number): number {
  const doubled = Math.round(midi * 2);
  const half = ((doubled % 2) + 2) % 2 === 1;
  const whole = (doubled - (half ? 1 : 0)) / 2 - 69; // semitones from A4
  const octave = Math.floor(whole / 12);
  const semi = whole - octave * 12;
  let f = 440 * SEMITONES[semi];
  if (octave > 0) for (let i = 0; i < octave; i++) f *= 2;
  else for (let i = 0; i < -octave; i++) f *= 0.5;
  if (half) f *= QUARTER_TONE;
  return f;
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
