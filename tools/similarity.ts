// How alike two beats are, measured on the score (not the audio).
// 0 = identical, 1 = nothing in common. Weights follow PLAN.md 4.3: tempo and
// meter matter most to listeners, then kit colour, then the patterns.

import { TPS, type Score } from "../src/engine/compose.ts";

export const WEIGHTS = {
  tempo: 0.22,
  meter: 0.12,
  style: 0.1,
  kit: 0.14,
  root: 0.05,
  scale: 0.05,
  drums: 0.16,
  pitched: 0.16,
};

const BINS = 192; // positions across the 4 bars

export interface Features {
  stepDur: number;
  meter: number;
  style: string;
  kit: number[];
  root: number;
  scale: string;
  drums: Set<number>[]; // roles 0..2, bins
  pitched: Set<number>; // bin * 128 + midi, roles 3..4
  canonical: string; // exact fingerprint of the score
  identity: string; // same laugh, different length or tail
}

export function features(s: Score): Features {
  const total = 4 * s.stepsPerBar * TPS;
  const drums = [new Set<number>(), new Set<number>(), new Set<number>()];
  const pitched = new Set<number>();
  for (const e of s.events) {
    const bin = Math.min(BINS - 1, Math.floor((e.tick / total) * BINS));
    if (e.role <= 2) drums[e.role].add(bin);
    else if (e.role <= 4) pitched.add(bin * 128 + Math.round(e.midi));
  }
  const canonical = JSON.stringify([
    s.styleId,
    s.bpm,
    s.swing,
    s.root,
    s.scaleId,
    s.kit,
    s.events.map((e) => [e.tick, e.role, e.variant, Math.round(e.vel * 1000), e.midi, e.durTicks, e.alt]),
  ]);
  return {
    stepDur: s.stepDur,
    meter: s.stepsPerBar,
    style: s.styleId,
    kit: s.kit,
    root: s.root,
    scale: s.scaleId,
    drums,
    pitched,
    canonical,
    identity: s.identityKey,
  };
}

function jaccardDistance(a: Set<number>, b: Set<number>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return 1 - inter / (a.size + b.size - inter);
}

const LN115 = Math.log(1.15);

/** Cheap part of the distance; the full distance is never below it. */
export function cheapDistance(a: Features, b: Features): number {
  const W = WEIGHTS;
  const dt = Math.min(1, Math.abs(Math.log(a.stepDur / b.stepDur)) / LN115);
  let kit = 0;
  for (let i = 0; i < 6; i++) if (a.kit[i] !== b.kit[i]) kit++;
  return (
    W.tempo * dt +
    W.meter * (a.meter === b.meter ? 0 : 1) +
    W.style * (a.style === b.style ? 0 : 1) +
    W.kit * (kit / 6) +
    W.root * (a.root === b.root ? 0 : 1) +
    W.scale * (a.scale === b.scale ? 0 : 1)
  );
}

export function distance(a: Features, b: Features): number {
  const W = WEIGHTS;
  let dd = 0;
  for (let r = 0; r < 3; r++) dd += jaccardDistance(a.drums[r], b.drums[r]);
  return cheapDistance(a, b) + W.drums * (dd / 3) + W.pitched * jaccardDistance(a.pitched, b.pitched);
}
