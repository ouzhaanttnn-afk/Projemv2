// Builds the web app.
//   npm run app          -> app/dist         (the website, with og.png)
//   npm run app:native   -> app/native-dist  (the iPhone app's page)
// SITE_URL is the website address with a trailing slash. WhatsApp needs it
// for the preview image, and the iPhone app needs it to build share links.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import { bundleEngine } from "./bundle.ts";

const root = new URL("..", import.meta.url);
const site = process.env.SITE_URL ?? "";
const native = process.argv.includes("--native");
const outDir = native ? "app/native-dist" : "app/dist";
mkdirSync(new URL(outDir, root), { recursive: true });

const script = (code: string) => `<script>${code.replace(/<\/script/gi, "<\\/script")}</script>`;
let bridge = "";
if (native) {
  const r = buildSync({
    entryPoints: [new URL("src/native/bridge.ts", root).pathname],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    write: false,
  });
  bridge = script(r.outputFiles[0].text);
}
let template = readFileSync(new URL("app/index.template.html", root), "utf8");
if (native) {
  // inside the app the page must never zoom, like any native screen
  template = template.replace(
    'content="width=device-width, initial-scale=1, viewport-fit=cover"',
    'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"',
  );
}
const html = template
  .replaceAll("__SITE__", site)
  .replace("<script>/*__ENGINE__*/</script>", () => script(bundleEngine()) + bridge);
writeFileSync(new URL(`${outDir}/index.html`, root), html);
if (!native) {
  // privacy policy page, required by the App Store
  const contact = process.env.CONTACT_EMAIL ?? "";
  const policy = readFileSync(new URL("app/gizlilik.html", root), "utf8").replace(
    "__CONTACT__",
    contact ? `Sorular için: ${contact}` : "Sorular için bu sayfanın bağlı olduğu uygulamanın App Store sayfasındaki destek bağlantısını kullan.",
  );
  writeFileSync(new URL("app/dist/gizlilik.html", root), policy);
  const support = readFileSync(new URL("app/destek.html", root), "utf8").replaceAll("__CONTACT__", contact || "App Store sayfasındaki destek bağlantısı");
  writeFileSync(new URL("app/dist/destek.html", root), support);
}
console.log(`${outDir}/index.html (${(html.length / 1024).toFixed(0)} KB)${site ? "" : "  UYARI: SITE_URL yok"}`);

if (!native && process.argv.includes("--og")) {
  // preview image: the real dance floor drawn by the page itself, plus the name
  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 400, height: 800 } });
  await page.goto("file://" + new URL(`${outDir}/index.html`, root).pathname + "#koleksiyon", { waitUntil: "networkidle" });
  const floor: string = await page.evaluate(async () => {
    await document.fonts.ready;
    const cv = document.createElement("canvas");
    cv.width = 1040; cv.height = 832;
    const g = cv.getContext("2d")!;
    const w = window as unknown as Record<string, any>;
    const L = { lv: [0.9, 0.1, 0.4, 0.5, 0.8, 0.6], mel: 67 };
    w.drawFloor(g, 1040, 832, { people: [{ text: "sjsjsjŞ", color: "61,252,209" }, { text: "kdkdkdk", color: "255,79,216" }], who: 2, label: null }, L, 1.3);
    return cv.toDataURL("image/png");
  });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@500;800&family=Unbounded:wght@800&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:#070b1a;color:#eaf2ff;font-family:Onest,sans-serif;display:grid;grid-template-columns:560px 640px;overflow:hidden}
.t{padding:70px 0 0 72px;display:flex;flex-direction:column;gap:30px}
.b{font:800 40px Unbounded,sans-serif;display:flex;gap:18px;align-items:center}.b i{width:38px;height:38px;border-radius:7px;background:#3dfcd1;transform:skewX(-12deg);box-shadow:6px 6px 0 #ff4fd8;display:inline-block}
.k{font:800 70px/1.1 Onest,sans-serif;letter-spacing:-1px}.k span{color:#3dfcd1}.k em{font-style:normal;color:#ff4fd8}
.s{font-size:30px;color:#a9b8da;max-width:440px}
img{width:640px;margin-top:40px;-webkit-mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 62%,transparent 100%)}</style></head><body>
<div class="t"><div class="b"><i></i>Randombeat</div><div class="k"><span>sjsjsjŞ</span><br>+ <em>kdkdkdk</em></div>
<div class="s">Gülüşün beat oldu. Dinle, sen de random'unla cevap ver.</div></div><img src="${floor}"></body></html>`, { waitUntil: "networkidle" });
  await p.screenshot({ path: new URL("app/dist/og.png", root).pathname, type: "png" });
  await b.close();
  console.log("app/dist/og.png");
}
