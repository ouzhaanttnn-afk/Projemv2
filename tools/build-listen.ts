// Builds web/dinle.html: the listening page with the engine inlined.
// Run: npm run dinle  (run "npm run benzersizlik" first for the nearest pairs)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { bundleEngine } from "./bundle.ts";
import { makeBeat, pcmChecksum } from "../src/engine/index.ts";

const root = new URL("..", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), "utf8");

const MAIN = [
  {
    text: "sjsjsj",
    listen: "Kalın bir bas notası ile ince bir saz teli sırayla gidip geliyor, altında hızlı tıkırtılar var. Bu, gülüşünün motifi.",
  },
  {
    text: "sjsjsjŞ",
    listen: "Aynı gidip gelme duruyor. Her ölçünün sonunda darbuka hızlanıyor, bir zil ve tef çarpıyor. O vurgu, sondaki Ş.",
  },
  {
    text: "gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf",
    listen: "İki ölçü boyunca yoğun bir dembow. Sonra bütün sesler bir vuruşluk susuyor: o senin boşluğun. İkinci yarı başka bir melodiyle geri giriyor.",
  },
];
const TEN = ["asdfghjkl", "fjfjfjfj", "HAHAHAHA", "jdjdjdjdjd", "SKDJFHSKDJ", "şkşkşkşk", "qwpeoıruty", "ahahahaha", "ğüğüğü", "bhbhbhbh"];
const SMALL = [
  { title: "Küçük harf ve büyük harf", a: "sjsjsj", b: "SJSJSJ" },
  { title: "Kısa ve uzun gülüş", a: "sjsjsj", b: "sjsjsjsjsjsj" },
  { title: "Boşluksuz ve boşluklu", a: "akdjfsldkfj", b: "akdjf sldkfj" },
];
const DEVICE = ["sjsjsj", "sjsjsjŞ", "gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf", "HAHAHAHA", "aşkdjfaşlkdj", "😂 ğüşiöçı"];

const reportPath = new URL("reports/benzersizlik.json", root);
const near = existsSync(reportPath)
  ? JSON.parse(readFileSync(reportPath, "utf8")).nearest.slice(0, 5).map((p: { a: string; b: string; d: number }) => ({ a: p.a, b: p.b, d: p.d }))
  : [];

const data = {
  main: MAIN,
  ten: TEN,
  small: SMALL,
  near,
  device: DEVICE.map((text) => ({ text, sum: pcmChecksum(makeBeat(text)!.pcm) })),
};

const html = read("web/dinle.template.html")
  .replace("/*__ENGINE__*/", () => bundleEngine().replace(/<\/script/gi, "<\\/script"))
  .replace("/*__DATA__*/", () => JSON.stringify(data).replace(/</g, "\\u003c"));
writeFileSync(new URL("web/dinle.html", root), html);
console.log(`web/dinle.html yazıldı (${(html.length / 1024).toFixed(0)} KB)`);
