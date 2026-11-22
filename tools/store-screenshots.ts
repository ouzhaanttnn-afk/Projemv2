// App Store screenshots (6.9", 1320x2868) in Turkish and English, made from
// the real app page with a caption band on top. Run: node tools/store-screenshots.ts
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const page = new URL("app/native-dist/index.html", root).pathname;

const SHOTS = [
  { id: 1, tr: "Gülüşünü yaz,\npist dans etsin", en: "Type your laugh,\nwatch the floor dance" },
  { id: 2, tr: "Arkadaşın kendi\nrandom'uyla cevap versin", en: "Your friend answers\nwith their own laugh" },
  { id: 3, tr: "On iki tarz,\nyerli sesler", en: "Twelve styles,\nTurkish sounds" },
  { id: 4, tr: "Her beat bir kart:\nkoleksiyonunu büyüt", en: "Every beat is a card:\ngrow your collection" },
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 880 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
// show the app as the App Store build does: no website-only price test or footer
const hideWebOnly = () => p.addStyleTag({ content: "#make-shop, footer, #make-ringtone { display: none !important; }" });
const raw: Record<number, Buffer> = {};
async function playAndShoot(id: number, sel: string, wait = 1300) {
  await p.click(sel);
  await p.waitForTimeout(wait);
  raw[id] = await p.screenshot({ type: "png" });
}
await p.goto("file://" + page);
await p.evaluate(() => localStorage.setItem("rb.tanitim", "1"));
await p.goto("file://" + page);
await hideWebOnly();
await p.fill("#make-input", "sjsjsjŞ");
await p.waitForSelector("#make-beat .beat");
await playAndShoot(1, "#make-beat .play");
await p.click("#make-beat .play");
// send a few so the collection has cards (sharing fails silently here)
for (const t of ["asdfghjkl", "şğüçöı", "kdkdkdk", "HAHAHAHA", "sjsjsjŞ"]) {
  await p.fill("#make-input", t);
  await p.waitForSelector("#make-beat .beat");
  await p.evaluate(() => (document.getElementById("make-send") as HTMLButtonElement).click());
  await p.waitForTimeout(120);
}
await p.goto("file://" + page + "?g=" + encodeURIComponent("sjsjsjŞ"));
await hideWebOnly();
await p.fill("#reply-input", "kdkdkdk");
await p.waitForSelector("#reply-duet .beat");
await p.evaluate(() => document.getElementById("reply-duet")!.scrollIntoView({ block: "center" }));
await playAndShoot(2, "#reply-duet .play", 6300);
await p.click("#reply-duet .play");
await p.evaluate(() => (document.getElementById("reply-send") as HTMLButtonElement).click());
await p.goto("file://" + page);
await hideWebOnly();
await p.fill("#make-input", "aşkdjfaşlkdjş");
await p.waitForSelector("#make-beat .beat");
await playAndShoot(3, "#make-beat .play", 1700);
await p.click("#make-beat .play");
await p.goto("file://" + page + "#koleksiyon");
await hideWebOnly();
await p.waitForTimeout(800);
raw[4] = await p.screenshot({ type: "png" });

const frame = await b.newPage({ viewport: { width: 1320, height: 2868 } });
for (const lang of ["tr", "en"] as const) {
  mkdirSync(new URL(`store/screenshots/${lang}`, root), { recursive: true });
  for (const s of SHOTS) {
    const img = "data:image/png;base64," + raw[s.id].toString("base64");
    const caption = s[lang].replace(/\n/g, "<br>");
    await frame.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&display=swap" rel="stylesheet">
<style>body{margin:0;width:1320px;height:2868px;background:#070b1a;display:flex;flex-direction:column;align-items:center;overflow:hidden}
h1{font:800 92px/1.12 Unbounded,sans-serif;color:#eaf2ff;text-align:center;margin:150px 60px 90px;letter-spacing:-1px}
.ph{width:1100px;height:2250px;border-radius:90px;overflow:hidden;box-shadow:24px 24px 0 #ff4fd8;border:6px solid #22305c;background:#070b1a}
.ph img{width:100%;display:block}
.tile{position:absolute;top:70px;left:70px;width:64px;height:64px;border-radius:12px;background:#3dfcd1;transform:skewX(-12deg);box-shadow:8px 8px 0 #ff4fd8}</style></head>
<body><div class="tile"></div><h1>${caption}</h1><div class="ph"><img src="${img}"></div></body></html>`, { waitUntil: "networkidle" });
    await frame.screenshot({ path: new URL(`store/screenshots/${lang}/${s.id}.png`, root).pathname, type: "png" });
  }
}
await b.close();
console.log("store/screenshots/{tr,en}/1-4.png");
