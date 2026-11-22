// Draws the app icon (1024) and launch image (2732) with the real fonts and
// writes them into the iOS project. Run: node tools/build-icons.ts
import { createRequire } from "node:module";
import { copyFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@800&display=swap" rel="stylesheet">`;
const bars = ["#8c9bff", "#3cc9c9", "#f2c14e", "#ff8466", "#8c9bff", "#3cc9c9", "#f07bcb"];

// icon: an amber keycap with "sj" on the night-blue ground, a beat strip below
const icon = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
body{margin:0;width:1024px;height:1024px;background:#0e1220;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px}
.k{width:560px;height:520px;border-radius:120px;background:#e5a93a;box-shadow:inset 0 -46px 0 #b37a12;display:flex;align-items:center;justify-content:center;
font:800 300px/1 'JetBrains Mono',monospace;color:#1b1403;letter-spacing:-18px;padding-bottom:40px;box-sizing:border-box}
.g{display:flex;gap:26px}.g span{width:62px;height:62px;border-radius:16px}
</style></head><body><div class="k">sj</div><div class="g">${bars.map((c) => `<span style="background:${c}"></span>`).join("")}</div></body></html>`;

const splash = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
body{margin:0;width:2732px;height:2732px;background:#f3f5f9;display:flex;align-items:center;justify-content:center}
.k{width:420px;height:390px;border-radius:92px;background:#a86c06;box-shadow:inset 0 -34px 0 #7c5004;display:flex;align-items:center;justify-content:center;
font:800 224px/1 'JetBrains Mono',monospace;color:#fff;letter-spacing:-14px;padding-bottom:30px;box-sizing:border-box}
</style></head><body><div class="k">sj</div></body></html>`;

const b = await chromium.launch();
async function shoot(html: string, size: number, out: string) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.screenshot({ path: new URL(out, root).pathname, type: "png", omitBackground: false });
  await p.close();
}
await shoot(icon, 1024, "assets/icon.png");
await shoot(splash, 2732, "assets/splash.png");
await b.close();

const iconDir = "ios/App/App/Assets.xcassets/AppIcon.appiconset/";
const splashDir = "ios/App/App/Assets.xcassets/Splash.imageset/";
copyFileSync(new URL("assets/icon.png", root), new URL(iconDir + "AppIcon-512@2x.png", root));
for (const n of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"])
  copyFileSync(new URL("assets/splash.png", root), new URL(splashDir + n, root));
console.log("assets/icon.png, assets/splash.png → iOS projesi");
