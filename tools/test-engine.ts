// Ses motorunun temel testleri. Çalıştır: npm test
import { analyse, compose, makeBeat, makeDuet, pcmChecksum, TPS } from "../src/engine/index.ts";
import { lowerTR } from "../src/engine/text.ts";
import { SPICE, BASS, MELODY } from "../src/engine/styles.ts";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  (" + detail + ")" : ""}`);
  if (!ok) failed++;
}

// aynı yazı → aynı ses
const a1 = makeBeat("gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf")!;
const a2 = makeBeat("gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf")!;
check("Aynı yazı iki kez aynı sesi veriyor", pcmChecksum(a1.pcm) === pcmChecksum(a2.pcm));

// boş yazı
check("Boş yazı beat üretmiyor", compose("   ") === null);

// Türkçe büyük-küçük harf
check("I → ı, İ → i, Ş → ş", lowerTR("I") === "ı" && lowerTR("İ") === "i" && lowerTR("Ş") === "ş");

// sjsjsj ve sjsjsjŞ
const s1 = compose("sjsjsj")!;
const s2 = compose("sjsjsjŞ")!;
check(
  "\"sjsjsjŞ\" aynı tarz, hız, ton, gam ve sesleri koruyor",
  s1.styleId === s2.styleId && s1.bpm === s2.bpm && s1.root === s2.root && s1.scaleId === s2.scaleId && s1.kit.join() === s2.kit.join(),
);
const motif = (s: typeof s1) =>
  s.events
    .filter((e) => (e.role === BASS || e.role === MELODY) && e.tick < s.stepsPerBar * TPS - 4 * TPS)
    .map((e) => `${e.tick}:${e.role}:${e.midi}`)
    .join(",");
check("\"sjsjsjŞ\" motifi aynen koruyor", motif(s1) === motif(s2));
const spice = (s: typeof s1) => s.events.filter((e) => e.role === SPICE).length;
check("\"sjsjsjŞ\" sonuna baharat vurgusu ekliyor", spice(s2) >= spice(s1) + 4, `${spice(s1)} → ${spice(s2)}`);

// büyük harf
const caps = compose("SJSJSJ")!;
check("\"SJSJSJ\" aynı tarzda ama daha hızlı", caps.styleId === s1.styleId && caps.bpm > s1.bpm, `${s1.bpm} → ${caps.bpm}`);

// boşluk = durak
const sp = compose("akdjf sldkfj")!;
const boundary = sp.segments[1].startBar * sp.stepsPerBar * TPS;
const beat = (sp.duple ? sp.stepsPerBeat : sp.stepsPerBeat === 6 ? 6 : 4) * TPS;
const inBreak = sp.events.filter((e) => e.tick >= boundary - beat && e.tick < boundary).length;
check("Boşluk bir vuruşluk sessizlik yaratıyor", inBreak === 0);
check("Boşluktan sonra ikinci yarı başlıyor", sp.segments.length === 2 && sp.segments[1].startBar === 2);

// uzunluk sınırı
const long = analyse("a".repeat(500))!;
check("Çok uzun yazı 120 karakterde kesiliyor", [...long.text].length === 120);

// emoji ve garip karakterler çökmeye yol açmıyor
const odd = makeBeat("😂😂 asd ŞŞŞ !!! 123 ئ");
check("Emoji ve başka alfabeler çalışıyor", !!odd && odd.pcm.length > 0);

// ses sınırları
let peak = 0;
for (const v of a1.pcm) peak = Math.max(peak, Math.abs(v));
check("Ses taşmıyor (tepe -1 dB civarı)", peak <= 29200 && peak > 28000, `tepe ${peak}`);
const secs = a1.pcm.length / 44100;
check("Beat 5-15 saniye arası", secs > 5 && secs < 15, `${secs.toFixed(1)} sn`);

// hız ayarı
const fast = compose("sjsjsj", { tempoStep: 4 })!;
const slow = compose("sjsjsj", { tempoStep: -4 })!;
check("Hız ayarı tempoyu değiştiriyor, beat'in geri kalanı aynı", fast.bpm > s1.bpm && slow.bpm < s1.bpm && fast.kit.join() === s1.kit.join() && fast.events.length === s1.events.length, `${slow.bpm} / ${s1.bpm} / ${fast.bpm}`);
check("Hız ayarı sınırların dışına çıkmıyor", compose("sjsjsj", { tempoStep: 99 })!.tempoStep === 10);

// harmanlama
const d1 = makeDuet("sjsjsj", "kdkdkdŞ")!;
const d2 = makeDuet("sjsjsj", "kdkdkdŞ")!;
check("Aynı iki gülüş her zaman aynı harmanı veriyor", pcmChecksum(d1.pcm) === pcmChecksum(d2.pcm));
check("Harman 6 ölçü ve ilk gülüşün hızında", d1.score.bars === 6 && d1.score.bpm === s1.bpm);
const replyAlone = compose("kdkdkdŞ", { force: { styleId: s1.styleId, bpm: s1.bpm, root: s1.root, scaleId: s1.scaleId } })!;
const bar = s1.stepsPerBar * TPS;
const firstPart = d1.score.events.filter((e) => e.tick < 2 * bar).length;
const replyPart = d1.score.events.filter((e) => e.tick >= 2 * bar && e.tick < 4 * bar).length;
const together = d1.score.events.filter((e) => e.tick >= 4 * bar).length;
check("Önce ilk gülüş, sonra cevap, sonra ikisi birlikte", firstPart > 0 && replyPart > 0 && together > 0, `${firstPart} / ${replyPart} / ${together}`);
check("Cevap kendi seslerini koruyor", replyAlone.kit.join() !== s1.kit.join());
const swapped = makeDuet("kdkdkdŞ", "sjsjsj")!;
check("Sıra önemli: kim önce gönderdiyse onun hızı", pcmChecksum(swapped.pcm) !== pcmChecksum(d1.pcm));

if (failed) {
  console.log(`\n${failed} test başarısız`);
  process.exit(1);
}
console.log("\nTüm testler geçti");
