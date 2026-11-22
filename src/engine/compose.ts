// Text -> score. The musical rules of Randombeat (PLAN.md section 4.3).
//
// Two-tier identity:
//  - the stable shape of the text (lower case, repeat count and tail removed)
//    picks style, tempo, key, scale and kit, so "sjsjsj" and "sjsjsjŞ" share
//    them;
//  - the full text only adds details (accents, ghost notes, the final fill).

import { Rng, combine, hashString } from "./hash.ts";
import { analyse, keyDistance, type Analysis, type Letter, type Segment } from "./text.ts";
import {
  BASS,
  HAT,
  KICK,
  MELODY,
  SCALES,
  SCALE_IDS,
  SNARE,
  SPICE,
  STYLES,
  type ScaleId,
  type Style,
} from "./styles.ts";
import { clamp, lerp } from "./dmath.ts";

/** ticks per 16th step; allows splits into 2, 3, 4 and 6 */
export const TPS = 12;
export const BARS = 4;

export interface NoteEvent {
  tick: number;
  role: number;
  variant: number;
  vel: number;
  midi: number; // 0 for unpitched
  durTicks: number;
  alt: number; // 1 = open/long variant
}

export interface Score {
  text: string;
  identityKey: string;
  styleId: string;
  styleName: string;
  stepsPerBar: number;
  stepsPerBeat: number;
  duple: boolean;
  bpm: number;
  stepDur: number; // seconds
  swing: number;
  root: number; // pitch class 0..11
  scaleId: ScaleId;
  kit: number[]; // variant per role
  events: NoteEvent[];
  segments: { raw: string; startBar: number; bars: number }[];
}

export const ROOT_NAMES = ["Do", "Do#", "Re", "Mi♭", "Mi", "Fa", "Fa#", "Sol", "La♭", "La", "Si♭", "Si"];

function euclid(k: number, n: number): boolean[] {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push((i * k) % n < k);
  return out;
}

/** Euclidean pattern rotated so that it still starts on an onset. */
function rotatedEuclid(k: number, n: number, rng: Rng): boolean[] {
  const base = euclid(k, n);
  const onsets = base.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
  const rot = onsets.length ? onsets[rng.int(onsets.length)] : 0;
  return base.map((_, i) => base[(i + rot) % n]);
}

function degreeToMidi(base: number, scale: number[], deg: number): number {
  const len = scale.length;
  const oct = Math.floor(deg / len);
  const idx = deg - oct * len;
  return base + oct * 12 + scale[idx];
}

function styleWeights(a: Analysis): number[] {
  return STYLES.map((s) => {
    let w = 1;
    // Capitals do not change the style: "SJSJSJ" is "sjsjsj" shouted (harder
    // kit, faster tempo, doubled melody), not a different beat.
    if (a.turkishCount > 0) {
      const strong = a.turkishCount >= 3 ? 1.9 : 1.4;
      if (["roman", "aksak7", "aksak5", "halay", "altisekiz"].includes(s.id)) w *= strong;
    }
    if (a.repetitive) {
      if (s.id === "house" || s.id === "dembow" || s.id === "trap") w *= 1.8;
      if (s.id === "lofi") w *= 0.6;
    }
    if (a.flow >= 0.5) {
      if (s.id === "boombap" || s.id === "lofi") w *= 2.2;
      if (s.id === "afro") w *= 1.5;
    }
    return w;
  });
}

function barsPerSegment(n: number): number[] {
  if (n === 1) return [4];
  if (n === 2) return [2, 2];
  if (n === 3) return [2, 1, 1];
  return [1, 1, 1, 1];
}

/** Motif lengths that sound like phrases in this meter. */
function allowedSpans(style: Style, segSteps: number): number[] {
  const bar = style.stepsPerBar;
  const spans: number[] = [];
  if (style.duple) spans.push(bar / 4, bar / 2);
  else if (bar % 2 === 0 && style.groups.length === 2) spans.push(bar / 2);
  spans.push(bar, bar * 2, bar * 4);
  return spans.filter((s) => s <= segSteps && Number.isInteger(s));
}

export function compose(input: string): Score | null {
  const a = analyse(input);
  if (!a) return null;

  const idHash = hashString(a.identityKey);
  const g = new Rng(idHash); // identity: stable under tail, case and repeat count
  const d = new Rng(hashString(a.text, 0x2545f491)); // details: every character counts

  // ---- global choices (order of rng calls is part of the format; do not reorder)
  const style = STYLES[g.weighted(styleWeights(a))];
  let bpm = lerp(style.tempo[0], style.tempo[1], g.float());
  if (a.allCaps) bpm *= 1.06;
  if (a.repetitive) bpm *= 1.03;
  bpm = Math.round(bpm * 10) / 10;
  const stepDur = 60 / (bpm * style.stepsPerBeat);
  const swing = style.duple ? lerp(style.swing[0], style.swing[1], g.float()) : 0.5;
  if (!style.duple) g.float();
  const root = g.int(12);
  const scaleWeights = SCALE_IDS.map((id) => {
    let w = style.scales[id] ?? 0.3;
    if (a.turkishCount > 0 && (id === "hicaz" || id === "ussak")) w *= 2;
    return w;
  });
  const scaleId = SCALE_IDS[g.weighted(scaleWeights)];
  const scale = SCALES[scaleId].steps;
  const kit: number[] = [];
  for (let role = 0; role < 6; role++) {
    const w = [1, 1, 1, 1, 1, 1];
    const bias = style.kitBias?.[role];
    if (bias) for (let i = 0; i < 6; i++) w[i] *= bias[i];
    if (a.allCaps && role === KICK) {
      w[3] *= 6;
      w[1] *= 2;
      w[4] *= 0.15;
    }
    if (a.allCaps && role === SNARE) {
      w[1] *= 3;
      w[0] *= 2;
      w[5] *= 0.2;
    }
    kit.push(g.weighted(w));
  }
  const kickIdx = g.int(style.kicks.length);
  const snareIdx = g.int(style.snares.length);
  const hatBase = style.hatDensity[g.int(style.hatDensity.length)];

  const bassBase = 36 + root;
  const melodyBase = 60 + root;
  const zurnaMidi = degreeToMidi(melodyBase + 12, scale, 4);

  const bar = style.stepsPerBar;
  const events: NoteEvent[] = [];
  const add = (step: number, role: number, vel: number, extra: Partial<NoteEvent> = {}) => {
    events.push({
      tick: Math.round(step * TPS),
      role,
      variant: kit[role],
      vel: clamp(vel, 0, 1),
      midi: 0,
      durTicks: TPS,
      alt: 0,
      ...extra,
    });
  };
  const ratchet = (step: number, spanSteps: number, n: number, role: number, vel: number, extra: Partial<NoteEvent> = {}) => {
    for (let i = 0; i < n; i++) add(step + (spanSteps * i) / n, role, vel * (0.7 + (0.3 * (i + 1)) / n), extra);
  };

  const plan = barsPerSegment(a.segments.length);
  const segInfo: Score["segments"] = [];
  let startBar = 0;
  const breakSteps = style.duple ? style.stepsPerBeat : style.stepsPerBeat === 6 ? 6 : 4;

  a.segments.forEach((seg: Segment, si: number) => {
    const nb = plan[si];
    const segStart = startBar * bar;
    const segSteps = nb * bar;
    segInfo.push({ raw: seg.raw, startBar, bars: nb });
    const s = new Rng(combine(idHash, hashString(seg.unitKey) + si));

    // ---- drums skeleton (answering segments switch pattern for contrast)
    const kicks = style.kicks[(kickIdx + si) % style.kicks.length];
    const snares = style.snares[(snareIdx + si) % style.snares.length];
    const lengthBonus = a.letterCount > 20 ? 2 : a.letterCount > 12 ? 1 : 0;
    // a longer laugh ("sjsjsjsjsjsj") is the same beat with more energy
    const energy = seg.periodic ? clamp(Math.floor((seg.reps - 2) / 2), 0, 3) : 0;
    const hatK = clamp(hatBase + lengthBonus + (si > 0 ? 2 : 0) + (energy >= 1 ? 2 : 0), 2, bar);
    const hats = rotatedEuclid(hatK, bar, s);
    for (let b = 0; b < nb; b++) {
      const b0 = segStart + b * bar;
      for (const k of kicks) add(b0 + k, KICK, k === 0 ? 0.95 : 0.82);
      for (const sn of snares) add(b0 + sn, SNARE, 0.88);
      for (let i = 0; i < bar; i++) {
        if (!hats[i]) continue;
        const accent = style.groups.includes(i) ? 0.78 : 0.5;
        add(b0 + i, HAT, accent + (d.float() - 0.5) * 0.14);
      }
      if (energy >= 2) add(b0 + bar - 2, HAT, 0.85, { alt: 1 });
      // ghost notes on the snare, a detail-level choice
      if (style.duple && d.chance(0.5)) {
        const ghost = [2, 7, 9, 13, 15][d.int(5)];
        if (!snares.includes(ghost)) add(b0 + ghost, SNARE, 0.22);
      }
    }

    // ---- motif from the letters
    let slots: Letter[] = seg.periodic ? seg.unit : seg.letters;
    const spans = allowedSpans(style, segSteps);
    const need = seg.periodic ? slots.length * 3 : slots.length * 2;
    const span = spans.find((x) => x >= need) ?? spans[spans.length - 1];
    const capacity = Math.max(1, Math.floor(span * 0.55));
    if (slots.length > capacity) {
      const pickN = capacity;
      const chosen: Letter[] = [];
      for (let i = 0; i < pickN; i++) chosen.push(slots[Math.floor((i * slots.length) / pickN)]);
      slots = chosen;
    }
    const grid = rotatedEuclid(slots.length, span, s);
    const positions = grid.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
    const melodyShift = si > 0 ? 2 + s.int(3) : 0;

    for (let r = 0; r < segSteps / span; r++) {
      for (let i = 0; i < slots.length; i++) {
        const L = slots[i];
        const prev = slots[(i - 1 + slots.length) % slots.length];
        const step = segStart + r * span + positions[i];
        const nextPos = i + 1 < slots.length ? positions[i + 1] : span + positions[0];
        const gap = nextPos - positions[i];
        const leap = slots.length > 1 && keyDistance(prev.pos, L.pos) > 6;
        let vel = 0.82;
        if (L.upper) vel = 1;
        if (leap) vel = 1;
        const count = Math.min(L.run, 4);

        if (!L.pos.onKeyboard) {
          add(step, SPICE, 0.8, { midi: zurnaMidi });
          continue;
        }
        if (L.left) {
          const deg = clamp(Math.floor(L.pos.x - 0.5), 0, 4) + (L.pos.row === 1 ? 1 : 0);
          const midi = degreeToMidi(bassBase, scale, deg);
          const dur = Math.min(gap, 8) * TPS;
          if (count > 1) ratchet(step, 1, count, BASS, vel, { midi, durTicks: TPS / count });
          else add(step, BASS, vel, { midi, durTicks: dur });
        } else {
          let deg = clamp(Math.floor(L.pos.x - 5.5), 0, 6);
          if (L.pos.row === 1) deg += 2;
          if (L.pos.row === 3) deg -= 2;
          if (L.pos.row === 0) deg += 4;
          if (leap) deg += 4;
          deg += melodyShift;
          const midi = degreeToMidi(melodyBase, scale, deg);
          const dur = Math.min(gap, 4) * TPS;
          if (count > 1) ratchet(step, 1, count, MELODY, vel, { midi, durTicks: TPS / count });
          else add(step, MELODY, vel, { midi, durTicks: dur });
          const lift = energy >= 3 && step >= segStart + segSteps / 2;
          if (a.allCaps || lift) add(step, MELODY, 0.45, { midi: midi + 12, durTicks: dur });
        }
        if (L.upper && !a.allCaps) add(step, SNARE, 0.5, { variant: 0 });
        if (L.turkish) add(step, SPICE, 0.78, { midi: zurnaMidi });
      }
    }

    // ---- tail: the accent at the end of every phrase ("sjsjsjŞ")
    if (seg.periodic && seg.tail.length) {
      const phrase = span >= bar ? span : bar;
      const m = Math.min(seg.tail.length, 3);
      for (let q = 1; q * phrase <= segSteps; q++) {
        const end = segStart + q * phrase;
        for (let j = 0; j < m; j++) {
          const T = seg.tail[seg.tail.length - m + j];
          const step = end - (m - j) * 2;
          if (T.turkish || !T.pos.onKeyboard) {
            ratchet(step, 1.5, 3, SNARE, 0.85, { variant: 4 });
            add(step + 1.5, SPICE, 1, { midi: zurnaMidi, variant: 0 });
            add(step + 1.5, SPICE, 0.9, { midi: zurnaMidi });
          } else {
            const midi = T.left
              ? degreeToMidi(bassBase, scale, clamp(Math.floor(T.pos.x - 0.5), 0, 4))
              : degreeToMidi(melodyBase + 12, scale, clamp(Math.floor(T.pos.x - 5.5), 0, 6));
            add(step, T.left ? BASS : MELODY, 1, { midi, durTicks: 2 * TPS });
            add(step, KICK, 0.9);
          }
          if (T.upper) add(step, HAT, 0.9, { alt: 1 });
        }
      }
    }

    startBar += nb;
  });

  // ---- spaces: the whole band stops for one beat, then comes back hard
  for (let si = 1; si < segInfo.length; si++) {
    const boundary = segInfo[si].startBar * bar;
    for (let i = events.length - 1; i >= 0; i--) {
      const st = events[i].tick / TPS;
      if (st >= boundary - breakSteps && st < boundary) events.splice(i, 1);
    }
    add(boundary, KICK, 1);
    add(boundary, SPICE, 0.85, { midi: zurnaMidi });
    add(boundary, HAT, 0.9, { alt: 1 });
  }

  // ---- final fill, a detail-level choice
  const endStep = BARS * bar;
  const fill = d.int(5);
  if (fill === 0) ratchet(endStep - 4, 4, 4, SNARE, 0.8);
  else if (fill === 1) {
    add(endStep - 2, KICK, 0.85);
    add(endStep - 1, KICK, 0.9);
  } else if (fill === 2) ratchet(endStep - 2, 2, 3, HAT, 0.8);
  else if (fill === 3) {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.role !== KICK && e.tick >= (endStep - 2) * TPS) events.splice(i, 1);
    }
  } else {
    add(endStep - 2, MELODY, 0.75, { midi: degreeToMidi(melodyBase, scale, 4), durTicks: TPS });
    add(endStep - 1, MELODY, 0.85, { midi: degreeToMidi(melodyBase, scale, 7), durTicks: TPS });
  }

  events.sort((x, y) => x.tick - y.tick || x.role - y.role || x.midi - y.midi);

  return {
    text: a.text,
    identityKey: a.identityKey,
    styleId: style.id,
    styleName: style.name,
    stepsPerBar: bar,
    stepsPerBeat: style.stepsPerBeat,
    duple: style.duple,
    bpm,
    stepDur,
    swing,
    root,
    scaleId,
    kit,
    events,
    segments: segInfo,
  };
}

/** Event time in seconds, with swing on odd 16ths in duple meters. */
export function tickToSeconds(score: Score, tick: number): number {
  const step = Math.floor(tick / TPS);
  const frac = (tick - step * TPS) / TPS;
  let t = (step + frac) * score.stepDur;
  if (score.duple && step % 2 === 1) t += (score.swing - 0.5) * 2 * score.stepDur;
  return t;
}

export function scoreDuration(score: Score): number {
  return BARS * score.stepsPerBar * score.stepDur;
}
