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
const html = readFileSync(new URL("app/index.template.html", root), "utf8")
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
}
console.log(`${outDir}/index.html (${(html.length / 1024).toFixed(0)} KB)${site ? "" : "  UYARI: SITE_URL yok"}`);

if (!native && process.argv.includes("--og")) {
  // preview image, rendered once with the real fonts
  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Space+Grotesk:wght@700&family=Inter:wght@500&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:#0e1220;color:#e8ecf5;font-family:Inter,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;gap:34px}
.b{font:700 44px 'Space Grotesk',sans-serif;display:flex;gap:18px;align-items:center}.b i{width:40px;height:40px;border-radius:10px;background:#e5a93a;display:inline-block}
.k{font:700 92px 'JetBrains Mono',monospace;letter-spacing:-2px}.s{font-size:36px;color:#9aa3b8}
.g{display:flex;gap:10px}.g span{width:34px;height:20px;border-radius:4px}</style></head><body>
<div class="b"><i></i>Randombeat</div><div class="k">sjsjsjŞ</div>
<div class="g">${["#8c9bff","#3cc9c9","#f2c14e","#8c9bff","#ff8466","#3cc9c9","#f2c14e","#f07bcb","#8c9bff","#3cc9c9","#f2c14e","#ff8466"].map((c,i)=>`<span style="background:${c};opacity:${i%3?0.6:1}"></span>`).join("")}</div>
<div class="s">Gülüşün beat oldu. Dinle, sen de random'unla cevap ver.</div></body></html>`, { waitUntil: "networkidle" });
  await p.screenshot({ path: new URL("app/dist/og.png", root).pathname, type: "png" });
  await b.close();
  console.log("app/dist/og.png");
}
