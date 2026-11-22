// Integer-only hashing and seeded random numbers. Same input, same output, on
// every JavaScript engine.

/** FNV-1a over the code points of a string, 32-bit unsigned. */
export function hashString(s: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    // feed the code point as up to three bytes so non-Latin letters count fully
    h = Math.imul(h ^ (cp & 0xff), 0x01000193);
    h = Math.imul(h ^ ((cp >>> 8) & 0xff), 0x01000193);
    h = Math.imul(h ^ ((cp >>> 16) & 0xff), 0x01000193);
  }
  return avalanche(h);
}

/** Final mixing step so nearby inputs give unrelated outputs. */
export function avalanche(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function combine(a: number, b: number): number {
  return avalanche((a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0);
}

/** mulberry32: small, fast, fully specified PRNG. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  /** Next unsigned 32-bit integer. */
  u32(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  /** Float in [0, 1) with 32-bit resolution. */
  float(): number {
    return this.u32() / 4294967296;
  }
  /** Integer in [0, n). */
  int(n: number): number {
    return this.u32() % n;
  }
  chance(p: number): boolean {
    return this.float() < p;
  }
  /** Index chosen in proportion to the weights. */
  weighted(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += w;
    let x = this.float() * total;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i];
      if (x < 0) return i;
    }
    return weights.length - 1;
  }
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
  /** Noise sample in [-1, 1). */
  noise(): number {
    return this.u32() / 2147483648 - 1;
  }
}
