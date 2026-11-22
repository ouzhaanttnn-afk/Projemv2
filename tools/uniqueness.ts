// Benzersizlik testi (PLAN.md 4.7).
//
// 1. 10.000 farklı gülüş üret, hiçbir ikisi birebir aynı beat'i vermesin.
// 2. Birbirinden bağımsız gülüş çiftlerinin binde birinden azı eşiğin altında
//    (fazla benzer) kalsın.
// 3. Tarzlar, ölçüler ve hızlar dengeli dağılsın (herkes aynı tarza düşmesin).
// 4. Küçük değişiklikler (son harf, büyük harf...) farklı ama tanınır kalsın.
//
// Çıktı: reports/benzersizlik.md ve reports/benzersizlik.json
// Çalıştır: node tools/uniqueness.ts

import { writeFileSync } from "node:fs";
import { compose } from "../src/engine/compose.ts";
import { STYLES } from "../src/engine/styles.ts";
import { Rng } from "../src/engine/hash.ts";
import { describe } from "../src/engine/describe.ts";
import { cheapDistance, distance, features, type Features } from "./similarity.ts";
import { realisticCorpus, variant, type VariantKind } from "./corpus.ts";

export const THRESHOLD = 0.25; // to be calibrated by ear (PLAN.md 4.7)
const N_INDEPENDENT = 8000;
const N_BASES = 400;
const KINDS: VariantKind[] = ["son harf ekle", "bir harf değiştir", "bir harfi büyüt", "bir tekrar ekle", "boşluk ekle"];

const t0 = Date.now();
const independent = realisticCorpus(N_INDEPENDENT);
const r = new Rng(77);
const bases = independent.slice(0, N_BASES);
const variantPairs: { kind: VariantKind; a: string; b: string }[] = [];
for (const base of bases) for (const kind of KINDS) variantPairs.push({ kind, a: base, b: variant(r, base, kind) });
const fixed = ["sjsjsj", "sjsjsjŞ", "gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf", "SJSJSJ", "sjsj sjsj", "sjsjsjsjsjsj"];

// all distinct inputs
const allTexts = new Set<string>([...independent, ...variantPairs.map((p) => p.b), ...fixed]);
const feats = new Map<string, Features>();
for (const t of allTexts) {
  const s = compose(t);
  if (s) feats.set(t, features(s));
}

// ---- 1. identical scores
const byCanon = new Map<string, string[]>();
for (const [t, f] of feats) {
  const list = byCanon.get(f.canonical) ?? [];
  list.push(t);
  byCanon.set(f.canonical, list);
}
const identical = [...byCanon.values()].filter((l) => l.length > 1);

// ---- 2. independent pairs
const indFeats = independent.map((t) => feats.get(t)!);
let pairs = 0;
let below = 0;
const hist = new Array(20).fill(0);
const nearest: { a: string; b: string; d: number }[] = [];
let worstKept = Infinity;
const KEEP = 12;
let sameIdentity = 0;
let sameIdentityBelow = 0;
for (let i = 0; i < indFeats.length; i++) {
  for (let j = i + 1; j < indFeats.length; j++) {
    if (indFeats[i].identity === indFeats[j].identity) {
      // the same laugh typed longer or shorter: meant to sound related
      sameIdentity++;
      if (distance(indFeats[i], indFeats[j]) < THRESHOLD) sameIdentityBelow++;
      continue;
    }
    pairs++;
    const c = cheapDistance(indFeats[i], indFeats[j]);
    let d = c;
    if (c < Math.max(THRESHOLD, nearest.length < KEEP ? 1 : worstKept) || c < 0.5) {
      d = distance(indFeats[i], indFeats[j]);
    } else {
      // full distance only adds to c; for the histogram use c as a floor
      d = c + 0.16; // typical pattern part, only for the coarse histogram
    }
    hist[Math.min(19, Math.floor(d * 20))]++;
    if (d < THRESHOLD) below++;
    if (nearest.length < KEEP || d < worstKept) {
      nearest.push({ a: independent[i], b: independent[j], d });
      nearest.sort((x, y) => x.d - y.d);
      if (nearest.length > KEEP) nearest.pop();
      worstKept = nearest[nearest.length - 1].d;
    }
  }
}

// ---- 3. distribution over the realistic corpus
const styleCount = new Map<string, number>();
const meterCount = new Map<number, number>();
const tempoBins = new Map<number, number>();
const kitCount = Array.from({ length: 6 }, () => new Array(6).fill(0));
for (const t of independent) {
  const s = compose(t)!;
  styleCount.set(s.styleName, (styleCount.get(s.styleName) ?? 0) + 1);
  meterCount.set(s.stepsPerBar, (meterCount.get(s.stepsPerBar) ?? 0) + 1);
  const pulse = Math.round(60 / (s.stepDur * 4) / 10) * 10; // 16th-based "quarter" tempo
  tempoBins.set(pulse, (tempoBins.get(pulse) ?? 0) + 1);
  s.kit.forEach((v, role) => kitCount[role][v]++);
}
const uniform = 1 / STYLES.length;
const shares = [...styleCount.entries()].map(([k, v]) => [k, v / independent.length] as const).sort((a, b) => b[1] - a[1]);
const maxShare = shares[0][1];
const minShare = shares.length < STYLES.length ? 0 : shares[shares.length - 1][1];

// ---- 4. small edits
const variantStats = KINDS.map((kind) => {
  const ds = variantPairs
    .filter((p) => p.kind === kind)
    .map((p) => {
      const fa = feats.get(p.a);
      const fb = feats.get(p.b);
      return fa && fb ? distance(fa, fb) : 1;
    })
    .sort((x, y) => x - y);
  const same = ds.filter((d) => d === 0).length;
  return { kind, median: ds[Math.floor(ds.length / 2)], p10: ds[Math.floor(ds.length * 0.1)], p90: ds[Math.floor(ds.length * 0.9)], same };
});
const fx = (t: string) => feats.get(t)!;
const keyPairs = [
  ["sjsjsj", "sjsjsjŞ"],
  ["sjsjsj", "SJSJSJ"],
  ["sjsjsj", "sjsjsjsjsjsj"],
  ["sjsjsj", "sjsj sjsj"],
].map(([a, b]) => ({ a, b, d: distance(fx(a), fx(b)) }));

const pBelow = below / pairs;
const pass1 = identical.length === 0;
const pass2 = pBelow < 0.001;
const pass3 = maxShare <= 2 * uniform && minShare >= 0.4 * uniform;
const seconds = ((Date.now() - t0) / 1000).toFixed(0);

const pct = (x: number) => (x * 100).toFixed(1).replace(".", ",") + "%";
const f2 = (x: number) => x.toFixed(2).replace(".", ",");
const ok = (b: boolean) => (b ? "GEÇTİ" : "KALDI");

const md = `# Benzersizlik testi

Tarih: ${new Date().toISOString().slice(0, 10)} · Süre: ${seconds} saniye

Benzerlik puanı 0 ile 1 arasında: 0 birebir aynı beat, 1 hiçbir ortak yanı yok.
Puan; hız, ölçü, tarz, ses takımı, ton, gam, davul vuruşlarının yerleri ve
melodi/bas notalarından hesaplanıyor (tools/similarity.ts).
**Eşik şimdilik ${f2(THRESHOLD)}.** Kulakla ayarlanacak (PLAN.md 4.7).

Gülüşler gerçek değil, gerçeğe benzetilerek üretildi (tools/corpus.ts). Bu bir
**varsayım**: gerçek random'larla tekrar çalıştırılmalı.

## Sonuç

| Şart | Sonuç | Değer |
|---|---|---|
| Hiçbir iki farklı yazı birebir aynı beat'i vermesin | ${ok(pass1)} | ${allTexts.size} yazıda ${identical.length} çakışma |
| Bağımsız çiftlerin binde birinden azı eşiğin altında | ${ok(pass2)} | ${pairs.toLocaleString("tr-TR")} çiftte ${below} (${(pBelow * 1000).toFixed(3).replace(".", ",")}‰) |
| Tarzlar dengeli (hiçbiri payının 2 katını geçmesin, 0,4 katının altına düşmesin) | ${ok(pass3)} | en çok ${pct(maxShare)}, en az ${pct(minShare)} (eşit pay ${pct(uniform)}) |

Aynı gülüşün farklı uzunlukları (örneğin \`sjsjsj\` ve \`sjsjsjsj\`) bağımsız
sayılmadı: bilerek birbirine benziyorlar. Bu türden ${sameIdentity} çift var;
${sameIdentityBelow} tanesi eşiğin altında.

## Birbirine en çok benzeyen bağımsız çiftler

Bunlar dinleme sayfasında da var. "Aynı geliyor" dersen eşik yükselir.

| Gülüş A | Gülüş B | Puan |
|---|---|---|
${nearest.map((p) => `| \`${p.a}\` | \`${p.b}\` | ${f2(p.d)} |`).join("\n")}

## Küçük değişiklikler

Tanınır kalması isteniyor (puan düşük), ama birebir aynı olmaması gerekiyor.

| Değişiklik | Ortanca puan | En yakın %10 | En uzak %10 | Birebir aynı |
|---|---|---|---|---|
${variantStats.map((v) => `| ${v.kind} | ${f2(v.median)} | ${f2(v.p10)} | ${f2(v.p90)} | ${v.same} |`).join("\n")}

| Çift | Puan |
|---|---|
${keyPairs.map((p) => `| \`${p.a}\` → \`${p.b}\` | ${f2(p.d)} |`).join("\n")}

Not: Uzun bir random'da tek harf değiştirmek ya da boşluk eklemek beat'in
kimliğini değiştirir; bu yüzden o satırlarda puan yüksek çıkıyor. Bu bilerek
seçildi: her random kendine özgü olsun. Kısa tekrarlı gülüşlerde ("sjsjsj")
son harf, büyük harf ve tekrar sayısı kimliği değiştirmez.

## Dağılım (${independent.length} gerçekçi gülüş)

| Tarz | Pay |
|---|---|
${shares.map(([k, v]) => `| ${k} | ${pct(v)} |`).join("\n")}

| Ölçü (bir ölçüdeki adım) | Pay |
|---|---|
${[...meterCount.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${pct(v / independent.length)} |`).join("\n")}

Hız (dakikadaki dörtlük, 10'a yuvarlanmış):
${[...tempoBins.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}: ${pct(v / independent.length)}`).join(" · ")}

Benzerlik puanlarının dağılımı (bağımsız çiftler, kaba):
${hist.map((n, i) => `${f2(i / 20)}–${f2((i + 1) / 20)}: ${pct(n / pairs)}`).join(" · ")}
`;

writeFileSync(new URL("../reports/benzersizlik.md", import.meta.url), md);
const describeText = (t: string) => describe(compose(t)!).line;
writeFileSync(
  new URL("../reports/benzersizlik.json", import.meta.url),
  JSON.stringify(
    {
      threshold: THRESHOLD,
      pass: { identical: pass1, similar: pass2, balance: pass3 },
      pairs,
      below,
      sameIdentity,
      sameIdentityBelow,
      nearest: nearest.map((p) => ({ ...p, da: describeText(p.a), db: describeText(p.b) })),
      keyPairs,
      variantStats,
    },
    null,
    2,
  ),
);
console.log(md.split("## Birbirine")[0]);
console.log("en yakın:", nearest.slice(0, 5));
console.log("küçük değişiklikler:", variantStats, keyPairs);
console.log("tarz payları:", shares.map(([k, v]) => `${k} ${pct(v)}`).join(", "));
