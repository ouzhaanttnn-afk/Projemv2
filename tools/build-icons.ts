// Draws the app icon (1024) and launch image (2732) with the real fonts and
// writes them into the iOS project. Run: node tools/build-icons.ts
import { createRequire } from "node:module";
import { copyFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Onest:wght@800&display=swap" rel="stylesheet">`;

// icon: a mint keycap leaning like a dance-floor tile, with its pink shadow, on night navy
const icon = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
body{margin:0;width:1024px;height:1024px;background:#070b1a;display:flex;align-items:center;justify-content:center}
.k{width:600px;height:540px;border-radius:96px;background:#3dfcd1;transform:skewX(-10deg) translate(-24px,-24px);box-shadow:52px 52px 0 #ff4fd8;
display:flex;align-items:center;justify-content:center;font:800 300px/1 Onest,sans-serif;color:#04121a;letter-spacing:-10px;padding-bottom:40px}
.k span{transform:skewX(10deg)}
</style></head><body><div class="k"><span>sj</span></div></body></html>`;

const splash = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
body{margin:0;width:2732px;height:2732px;background:#070b1a;display:flex;align-items:center;justify-content:center}
.k{width:380px;height:340px;border-radius:62px;background:#3dfcd1;transform:skewX(-10deg);box-shadow:34px 34px 0 #ff4fd8;
display:flex;align-items:center;justify-content:center;font:800 190px/1 Onest,sans-serif;color:#04121a;letter-spacing:-6px;padding-bottom:26px}
.k span{transform:skewX(10deg)}
</style></head><body><div class="k"><span>sj</span></div></body></html>`;

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
