// Synthetic keyboard laughs for testing.
//
// ASSUMPTION: we have no real corpus yet. These rules imitate what is known
// about keysmash (home row heavy, hands alternate, Turkish users type on the
// Turkish Q layout so ş, ı, ğ, ü, ö, ç appear naturally, laughs like "sjsjsj"
// repeat a short unit). Replace or extend with real laughs when available.

import { Rng } from "../src/engine/hash.ts";

const ROWS = ["qwertyuıopğü", "asdfghjklşi", "zxcvbnmöç"];
const LEFT_COLS = [5, 5, 5]; // keys per row typed by the left hand
const TURKISH = ["ş", "ı", "ğ", "ü", "ö", "ç"];
const UPPER: Record<string, string> = { ı: "I", i: "İ", ş: "Ş", ç: "Ç", ğ: "Ğ", ü: "Ü", ö: "Ö" };

export function upperTR(s: string): string {
  return [...s].map((c) => UPPER[c] ?? c.toUpperCase()).join("");
}

function key(r: Rng, left: boolean, homeBias = 0.62, turkishBoost = 0): string {
  if (turkishBoost > 0 && !left && r.chance(turkishBoost)) return r.pick(TURKISH);
  const row = r.float() < homeBias ? 1 : r.chance(0.66) ? 0 : 2;
  const keys = ROWS[row];
  const split = LEFT_COLS[row];
  const cols = left ? keys.slice(0, split) : keys.slice(split);
  // home keys a s d f / j k l are pressed more often
  if (row === 1 && r.chance(0.5)) return left ? r.pick(["a", "s", "d", "f"]) : r.pick(["j", "k", "l"]);
  return cols[r.int(cols.length)];
}

export function smash(r: Rng, len: number, turkishBoost = 0): string {
  let left = r.chance(0.5);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += key(r, left, 0.62, turkishBoost);
    left = r.chance(0.65) ? !left : left;
  }
  return out;
}

function laugh(r: Rng): string {
  const unitLen = r.weighted([0, 2, 6, 2, 1]); // mostly two letters: sj, ks, dk
  let unit = "";
  let left = r.chance(0.5);
  for (let i = 0; i < unitLen; i++) {
    unit += key(r, left, 0.75);
    left = !left;
  }
  if (r.chance(0.08)) unit = r.pick(["ha", "he", "hah", "kh", "sj", "ks", "dk", "jd", "aş", "şk"]);
  const reps = 3 + r.int(6);
  let s = unit.repeat(reps);
  if (r.chance(0.3)) s += r.chance(0.5) ? r.pick(TURKISH) : key(r, r.chance(0.5));
  if (r.chance(0.12)) s += upperTR(r.pick(TURKISH));
  return s;
}

function rowRun(r: Rng): string {
  const row = ROWS[r.weighted([2, 6, 2])];
  const len = 4 + r.int(Math.min(7, row.length - 3));
  const start = r.int(row.length - len + 1);
  return row.slice(start, start + len);
}

function lengthFor(r: Rng): number {
  // most smashes are 8-20 characters, some much longer
  const base = 6 + r.int(10) + r.int(10);
  return r.chance(0.15) ? base + 10 + r.int(20) : base;
}

/** One realistic laugh. */
export function realistic(r: Rng): string {
  const kind = r.weighted([45, 20, 10, 10, 5, 10]);
  let s: string;
  switch (kind) {
    case 0:
      s = smash(r, lengthFor(r));
      break;
    case 1:
      s = laugh(r);
      break;
    case 2:
      s = upperTR(r.chance(0.5) ? smash(r, lengthFor(r)) : laugh(r));
      break;
    case 3: {
      const parts = 2 + (r.chance(0.25) ? 1 : 0);
      const ps: string[] = [];
      for (let i = 0; i < parts; i++) ps.push(r.chance(0.3) ? laugh(r) : smash(r, 5 + r.int(12)));
      s = ps.join(" ");
      break;
    }
    case 4:
      s = rowRun(r);
      break;
    default:
      s = smash(r, lengthFor(r), 0.25);
  }
  // a few people capitalise a single letter mid-smash
  if (kind !== 2 && r.chance(0.06)) {
    const cs = [...s];
    const i = r.int(cs.length);
    cs[i] = upperTR(cs[i]);
    s = cs.join("");
  }
  return s;
}

export function realisticCorpus(n: number, seed = 20261122): string[] {
  const r = new Rng(seed);
  const seen = new Set<string>();
  const out: string[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const s = realistic(r);
    if (s.trim().length === 0 || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export type VariantKind = "son harf ekle" | "bir harf değiştir" | "bir harfi büyüt" | "bir tekrar ekle" | "boşluk ekle";

/** Small edits of a laugh, the kind Deneme 1 tests. */
export function variant(r: Rng, s: string, kind: VariantKind): string {
  const cs = [...s];
  switch (kind) {
    case "son harf ekle":
      return s + r.pick(["Ş", "ş", "k", "ğ", "Ç", "j"]);
    case "bir harf değiştir": {
      const i = r.int(cs.length);
      let c = cs[i];
      while (c === cs[i]) c = key(r, r.chance(0.5));
      cs[i] = c;
      return cs.join("");
    }
    case "bir harfi büyüt": {
      const idx = cs.map((c, i) => (upperTR(c) !== c ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) return s + "A";
      const i = idx[r.int(idx.length)];
      cs[i] = upperTR(cs[i]);
      return cs.join("");
    }
    case "bir tekrar ekle":
      return s + s.slice(0, Math.min(2, s.length));
    default: {
      const i = 2 + r.int(Math.max(1, cs.length - 3));
      cs.splice(i, 0, " ");
      return cs.join("");
    }
  }
}
