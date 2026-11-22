// Ses motorunun temel testleri. Çalıştır: npm test
import { analyse, compose, makeBeat, pcmChecksum, TPS } from "../src/engine/index.ts";
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

if (failed) {
  console.log(`\n${failed} test başarısız`);
  process.exit(1);
}
console.log("\nTüm testler geçti");
