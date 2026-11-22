// Uygulama simgesini ve açılış görselini üretir (Newsreader yazı tipiyle "F" harfi + terrakota nokta).
// Çalıştırma: node scripts/make-icons.mjs  (Playwright/Chromium gerekir)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = fs.readFileSync(path.join(ROOT, 'node_modules/@expo-google-fonts/newsreader/400Regular/Newsreader_400Regular.ttf')).toString('base64');

const page = (size, { bg = '#F6F3EE', glyph = 0.62, dot = true, transparent = false } = {}) => `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(data:font/ttf;base64,${font})}
html,body{margin:0;width:${size}px;height:${size}px;background:${transparent ? 'transparent' : bg}}
.c{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.f{font-family:N;font-size:${size * glyph}px;line-height:1;color:#1D1B18;letter-spacing:-.02em;transform:translate(-3%,-2%)}
.d{position:absolute;width:${size * glyph * 0.12}px;height:${size * glyph * 0.12}px;border-radius:50%;background:#A24F2D;left:${size * (0.5 + glyph * 0.2)}px;top:${size * (0.5 + glyph * 0.09)}px}
</style></head><body><div class="c"><span class="f">F</span>${dot ? '<span class="d"></span>' : ''}</div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage();
async function render(file, size, opts) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(page(size, opts));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(ROOT, 'assets', file), omitBackground: !!opts?.transparent });
  console.log(file);
}
await render('icon.png', 1024);
await render('splash-icon.png', 1024, { transparent: true, glyph: 0.5 });
await render('favicon.png', 96, { glyph: 0.7 });
await render('android-icon-foreground.png', 1024, { transparent: true, glyph: 0.42 });
await render('android-icon-monochrome.png', 1024, { transparent: true, glyph: 0.42, dot: false });
await p.setViewportSize({ width: 1024, height: 1024 });
await p.setContent('<html><body style="margin:0;background:#F6F3EE;width:1024px;height:1024px"></body></html>');
await p.screenshot({ path: path.join(ROOT, 'assets', 'android-icon-background.png') });
await b.close();
