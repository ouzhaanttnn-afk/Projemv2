// Reading the laugh: normalisation, the Turkish Q keyboard, and the shape of
// the text (repetition, tail, flow, capitals, Turkish letters, spaces).

export const TURKISH_LETTERS = new Set(["ş", "ç", "ğ", "ü", "ö", "ı"]);

// Explicit case mapping. toLocaleLowerCase depends on the device locale and
// toLowerCase gets Turkish I/İ wrong, so neither is used.
const LOWER: Record<string, string> = {
  I: "ı",
  İ: "i",
  Ş: "ş",
  Ç: "ç",
  Ğ: "ğ",
  Ü: "ü",
  Ö: "ö",
};

export function lowerTR(ch: string): string {
  if (LOWER[ch]) return LOWER[ch];
  const cp = ch.codePointAt(0)!;
  if (cp >= 65 && cp <= 90) return String.fromCharCode(cp + 32);
  return ch;
}

export function isUpper(ch: string): boolean {
  return lowerTR(ch) !== ch;
}

// Turkish Q layout. Physical stagger offsets give each key a horizontal
// position x so that hands and distances come out right.
const ROWS: { keys: string; offset: number }[] = [
  { keys: "1234567890*-", offset: 0 },
  { keys: "qwertyuıopğü", offset: 0.5 },
  { keys: "asdfghjklşi,", offset: 0.75 },
  { keys: "zxcvbnmöç.", offset: 1.25 },
];

export interface KeyPos {
  x: number;
  row: number;
  onKeyboard: boolean;
}

const KEYMAP = new Map<string, KeyPos>();
ROWS.forEach((r, row) => {
  [...r.keys].forEach((k, col) => KEYMAP.set(k, { x: col + r.offset, row, onKeyboard: true }));
});

export function keyPos(lower: string): KeyPos {
  const k = KEYMAP.get(lower);
  if (k) return k;
  // Anything else (emoji, other alphabets) lands on a stable pseudo position.
  const cp = lower.codePointAt(0)!;
  return { x: (cp % 12) + 0.5, row: 1 + (cp % 3), onKeyboard: false };
}

/** Left hand covers q-t, a-g, z-b. */
export function isLeftHand(p: KeyPos): boolean {
  return p.x <= 5.25;
}

export function keyDistance(a: KeyPos, b: KeyPos): number {
  const dx = a.x - b.x;
  const dy = a.row - b.row;
  return Math.sqrt(dx * dx + dy * dy);
}

export interface Letter {
  ch: string; // as typed
  lower: string;
  upper: boolean;
  turkish: boolean;
  pos: KeyPos;
  left: boolean;
  /** how many times this letter was typed in a row (collapsed into one slot) */
  run: number;
}

export interface Segment {
  raw: string;
  letters: Letter[]; // runs collapsed
  /** smallest repeating unit if the segment is mostly a repetition */
  periodic: boolean;
  unit: Letter[];
  unitKey: string;
  reps: number;
  tail: Letter[];
  capsRatio: number;
  turkishCount: number;
  /** share of neighbouring letter pairs that sit next to each other on the keyboard */
  flow: number;
}

export interface Analysis {
  text: string; // normalised input
  segments: Segment[];
  /** stable identity: lower-cased, repeat counts and tails removed */
  identityKey: string;
  capsRatio: number;
  allCaps: boolean;
  turkishCount: number;
  flow: number;
  repetitive: boolean;
  letterCount: number;
}

function makeLetter(ch: string): Letter {
  const lower = lowerTR(ch);
  const pos = keyPos(lower);
  return {
    ch,
    lower,
    upper: isUpper(ch),
    turkish: TURKISH_LETTERS.has(lower),
    pos,
    left: isLeftHand(pos),
    run: 1,
  };
}

/** Find the smallest p such that most of the string repeats with period p. */
function findPeriod(lowers: string[]): { p: number; len: number } | null {
  const n = lowers.length;
  if (n < 2) return null;
  for (let p = 1; p <= Math.floor(n / 2); p++) {
    let len = p;
    while (len < n && lowers[len] === lowers[len - p]) len++;
    if (len >= 2 * p && len >= 0.6 * n && n - len <= Math.max(2, Math.floor(len / 3))) {
      return { p, len };
    }
  }
  return null;
}

function analyseSegment(raw: string): Segment {
  const chars = [...raw];
  const all = chars.map(makeLetter);
  const lowers = all.map((l) => l.lower);
  const period = findPeriod(lowers);

  // Collapse runs of the same letter ("kkk" -> k x3) for melodic slots.
  const collapse = (ls: Letter[]): Letter[] => {
    const out: Letter[] = [];
    for (const l of ls) {
      const prev = out[out.length - 1];
      if (prev && prev.lower === l.lower) {
        prev.run++;
        if (l.upper) prev.upper = true;
      } else out.push({ ...l });
    }
    return out;
  };

  let unit: Letter[];
  let tail: Letter[] = [];
  let reps = 1;
  let periodic = false;
  if (period && period.p < chars.length) {
    periodic = true;
    // Unit keeps the case of its first occurrence; capitals anywhere in the
    // repeated part mark the unit letter as upper.
    unit = collapse(
      all.slice(0, period.p).map((l, i) => {
        let upper = false;
        for (let j = i; j < period.len; j += period.p) if (all[j].upper) upper = true;
        return { ...l, upper };
      }),
    );
    reps = period.len / period.p;
    tail = collapse(all.slice(period.len));
  } else {
    unit = collapse(all);
  }

  const letters = collapse(all);
  // Shape features come from the identity part only (one repeating unit, or
  // the whole segment), so a tail or extra repeats never change them.
  const core = periodic ? all.slice(0, period!.p) : all;
  let caps = 0;
  let alpha = 0;
  let tr = 0;
  for (const l of core) {
    if (/\p{L}/u.test(l.ch)) alpha++;
    if (l.upper) caps++;
    if (l.turkish) tr++;
  }
  if (periodic) {
    // capitals are counted over the whole repeated part, so one capital in
    // "sSssss" does not make the laugh all caps
    caps = 0;
    alpha = 0;
    for (const l of all.slice(0, period!.len)) {
      if (/\p{L}/u.test(l.ch)) alpha++;
      if (l.upper) caps++;
    }
  }
  let near = 0;
  let pairs = 0;
  const cyclic = periodic && core.length > 1;
  const pairCount = cyclic ? core.length : core.length - 1;
  for (let i = 0; i < pairCount; i++) {
    const a = core[i];
    const b = core[(i + 1) % core.length];
    pairs++;
    if (keyDistance(a.pos, b.pos) <= 1.2) near++;
  }

  return {
    raw,
    letters,
    periodic,
    unit,
    unitKey: (periodic ? "P:" : "R:") + unit.map((l) => l.lower).join(""),
    reps,
    tail,
    capsRatio: alpha ? caps / alpha : 0,
    turkishCount: tr,
    flow: pairs ? near / pairs : 0,
  };
}

export const MAX_SEGMENTS = 4;
export const MAX_CHARS = 120;

export function analyse(input: string): Analysis | null {
  const text = [...input.normalize("NFC")].slice(0, MAX_CHARS).join("");
  let parts = text.split(/\s+/u).filter((s) => s.length > 0);
  if (parts.length === 0) return null;
  if (parts.length > MAX_SEGMENTS) {
    parts = [...parts.slice(0, MAX_SEGMENTS - 1), parts.slice(MAX_SEGMENTS - 1).join("")];
  }
  const segments = parts.map(analyseSegment);
  let letters = 0;
  let caps = 0;
  let tr = 0;
  let flowSum = 0;
  let weight = 0;
  for (const s of segments) {
    const n = s.periodic ? s.unit.length : [...s.raw].length;
    letters += [...s.raw].length;
    weight += n;
    caps += s.capsRatio * n;
    tr += s.turkishCount;
    flowSum += s.flow * n;
  }
  const capsRatio = weight ? caps / weight : 0;
  return {
    text,
    segments,
    identityKey: segments.map((s) => s.unitKey).join("|"),
    capsRatio,
    allCaps: capsRatio >= 0.7,
    turkishCount: tr,
    flow: weight ? flowSum / weight : 0,
    repetitive: segments.every((s) => s.periodic && s.unit.length <= 4),
    letterCount: letters,
  };
}
