// Yerleşim dayanıklılık denemesi: alanlar uygulamanın izin verdiği en uzun metinlerle doldurulur,
// üç kalıp Chromium'da çizilir; her biri tek sayfaya sığmalı ve hiçbir öğe sayfadan taşmamalı.
// Çalıştırma: node e2e/layout.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUX = path.join(ROOT, 'e2e', '.out');
fs.mkdirSync(AUX, { recursive: true });

// Kalıpları tek dosyada derle (esbuild, Vite ile birlikte gelir).
const entry = path.join(AUX, 'entry.ts');
fs.writeFileSync(entry, `export { renderFoy } from '../../src/foy/templates';\nexport { buildFoyData } from '../../src/foy/data';\n`);
const bundle = path.join(AUX, 'foy.mjs');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`, '--log-level=warning']);
const { renderFoy, buildFoyData } = await import(pathToFileURL(bundle).href);

const FIX = path.join(ROOT, 'e2e', 'fixtures');
const files = fs.readdirSync(FIX).filter((f) => f.endsWith('.jpg')).sort();
const src = Object.fromEntries(files.map((f) => [f, 'data:image/jpeg;base64,' + fs.readFileSync(path.join(FIX, f)).toString('base64')]));
const long = (n) => 'Uzun metin örneği: ağır şartlarda taşma denemesi, İstanbul ğüşıöç. '.repeat(12).slice(0, n);

// Sınırlar uygulamadaki alan sınırlarıyla aynı (src/app/product/[id]/details.tsx).
const photos = [...files, ...files].map((f, i) => ({ id: `${f}-${i}`, ref: f, width: 1, height: 1, note: long(120) }));
const cases = {
  enUzun: {
    name: long(60), description: long(280),
    specs: Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, label: long(24), value: long(40) })),
    material: long(80), price: long(30),
    options: Array.from({ length: 8 }, (_, i) => ({ id: `o${i}`, name: long(24), photoId: photos[i % 6].id })),
    contact: { name: long(60), phone: '+90 555 000 00 00', email: 'cok.uzun.bir.eposta.adresi@ornek-alanadi.com.tr', web: 'instagram.com/cok_uzun_bir_kullanici_adi' },
    photos,
  },
  enAz: { name: 'A', description: '', specs: [], material: '', price: '', options: [], contact: { name: '', phone: '', email: '', web: '' }, photos: photos.slice(0, 1) },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
let failed = 0;
for (const [caseName, c] of Object.entries(cases)) {
  for (const tpl of ['single', 'options', 'story']) {
    const product = { id: 'x', template: tpl, skipped: [], createdAt: 0, updatedAt: 0, ...c };
    await page.setContent(renderFoy(tpl, buildFoyData(product, (p) => src[p.ref], 'tr')), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(50);
    const r = await page.evaluate(() => {
      const p = document.querySelector('.page');
      const pr = p.getBoundingClientRect();
      const outside = [...p.querySelectorAll('*')].filter((el) => {
        const b = el.getBoundingClientRect();
        return b.height > 0 && (b.bottom > pr.bottom + 0.5 || b.right > pr.right + 0.5);
      }).length;
      const minPhoto = Math.min(...[...p.querySelectorAll('.ph')].map((e) => e.getBoundingClientRect().height));
      return { overflow: p.scrollHeight - p.clientHeight, outside, density: document.body.className, minPhoto: Math.round(minPhoto) };
    });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    await page.screenshot({ path: path.join(AUX, `layout-${caseName}-${tpl}.png`) });
    const ok = pages === 1 && r.overflow <= 0 && r.outside === 0 && r.minPhoto >= 60;
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${caseName} / ${tpl}: ${pages} sayfa, taşma ${r.overflow}px, dışarıda ${r.outside} öğe, en küçük fotoğraf ${r.minPhoto}px, yoğunluk "${r.density}"`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
