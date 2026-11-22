// Uçtan uca deneme: web sürümünü telefon boyutunda (390 × 844) baştan sona yürütür.
// Ön koşul: `npx expo start --web --port 8081` çalışıyor olmalı.
// Çalıştırma: node e2e/flow.mjs   (BASE_URL ile başka adres verilebilir)
// Çıktılar: onizleme/*.png (ekranlar), onizleme/foy-*.pdf (üç kalıp), e2e/.out/ (yardımcı görseller)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'onizleme');
const AUX = path.join(ROOT, 'e2e', '.out');
const FIX = path.join(ROOT, 'e2e', 'fixtures');
const BASE = process.env.BASE_URL ?? 'http://localhost:8081';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(AUX, { recursive: true });

const fixtures = fs.readdirSync(FIX).filter((f) => f.endsWith('.jpg')).sort().map((f) => path.join(FIX, f));
const problems = [];
const log = (...a) => console.log('•', ...a);

function check(cond, msg) {
  if (!cond) {
    problems.push(msg);
    console.log('  ✗', msg);
  } else console.log('  ✓', msg);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'tr-TR',
  hasTouch: true,
  isMobile: false,
});
const page = await context.newPage();
page.on('pageerror', (e) => problems.push(`Sayfa hatası: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`Konsol hatası: ${m.text().slice(0, 300)}`);
});

const tid = (id) => page.locator(`[data-testid="${id}"] >> visible=true`).first();
const tidAny = (id) => page.locator(`[data-testid="${id}"]`).first();
const shot = async (name) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name) });
  log('ekran görüntüsü', name);
};
const tap = async (id) => {
  await tid(id).click();
  await page.waitForTimeout(250);
};
const fill = async (id, value) => {
  const el = tid(id);
  await el.click();
  await el.fill(value);
};
const waitFor = (id, timeout = 20000) => tid(id).waitFor({ state: 'visible', timeout });
const scrollMain = async (y) => {
  // Ekranın ortasında fare tekerleğiyle kaydır (önce en üste).
  await page.mouse.move(195, 420);
  await page.mouse.wheel(0, -20000);
  await page.waitForTimeout(250);
  if (y) await page.mouse.wheel(0, y === 'end' ? 20000 : y);
  await page.waitForTimeout(400);
};

async function previewHtml() {
  const frame = page.locator('[data-testid="foy-preview-iframe"]');
  await frame.waitFor({ state: 'attached', timeout: 20000 });
  const doc = await frame.evaluate((f) => f.getAttribute('srcdoc') ?? f.srcdoc);
  // Önizleme yalnızca ekrana sığdırmak için bir zoom stili ekler; PDF için çıkarılır.
  return doc.replace(/<style>html\{zoom:[^}]*\}<\/style>/, '');
}

async function savePdf(html, name) {
  const p = await context.browser().newPage();
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const fonts = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  const broken = await p.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length);
  const overflow = await p.evaluate(() => {
    const page = document.querySelector('.page');
    const out = [];
    if (page.scrollHeight > page.clientHeight + 1) out.push(`içerik ${page.scrollHeight - page.clientHeight}px taşıyor`);
    const pr = page.getBoundingClientRect();
    for (const el of page.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5)) out.push(`${el.tagName}.${el.className} sayfa dışında`);
    }
    return out.slice(0, 5);
  });
  const buf = await p.pdf({ path: path.join(OUT, name), preferCSSPageSize: true, printBackground: true });
  await p.setViewportSize({ width: 794, height: 1123 });
  await p.screenshot({ path: path.join(AUX, name.replace('.pdf', '.png')) });
  await p.close();
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  log('PDF', name, `${(buf.length / 1024).toFixed(0)} KB`);
  check(pages === 1, `${name}: tek sayfa (bulunan: ${pages})`);
  check(fonts.includes('Foy Serif') && fonts.includes('Foy Sans'), `${name}: gömülü yazı tipleri yüklendi`);
  check(broken === 0, `${name}: bozuk görsel yok`);
  check(overflow.length === 0, `${name}: taşan öğe yok ${overflow.join(' | ')}`);
  check(html.replace(/<[^>]+>/g, '').includes('Föy ile hazırlandı'), `${name}: imza var`);
}

// ------------------------------------------------------------------ 1. Boş ürün listesi
log('Ürünler (boş)');
await page.goto(BASE);
await waitFor('cta-first', 60000);
await page.evaluate(() => document.fonts.ready);
await shot('01-urunler-bos.png');

// ------------------------------------------------------------------ 2. Fotoğraflar
log('Fotoğraf seç');
await tap('cta-first');
await waitFor('screen-photos');
await shot('02-fotograflar-bos.png');
check(await tid('next').getAttribute('aria-disabled') === 'true', 'fotoğraf yokken Devam kapalı');

const chooserP = page.waitForEvent('filechooser');
await tap('pick-library');
const chooser = await chooserP;
check(chooser.isMultiple(), 'galeri seçici çoklu seçime izin veriyor');
await chooser.setFiles(fixtures);
await waitFor(`photo-row-${fixtures.length - 1}`, 30000);
check((await page.locator('[data-testid^="photo-row-"]').count()) === fixtures.length, `${fixtures.length} fotoğraf eklendi`);

// sıra değiştir ve kapak seç
await tap('down-0'); // 02, 01, 03 …
await tap('make-cover-0'); // 02 kapak
check((await tid('photo-row-0').innerText()).includes('KAPAK'), 'kapak değiştirilebiliyor');
await tap('make-cover-1'); // 01-vazo yeniden kapak
await tap('up-1'); // 01, 02, 03 …
const firstImg = await tid('photo-row-0').locator('img').first().getAttribute('src');
check(!!firstImg && firstImg.startsWith('data:image/jpeg'), 'fotoğraflar JPEG olarak saklandı');
check((await tid('photo-row-0').innerText()).includes('KAPAK'), 'ilk satır kapak');
await shot('03-fotograflar.png');

// ------------------------------------------------------------------ 3. Bilgiler
log('Bilgiler');
await tap('next');
await waitFor('screen-details');
await shot('04-bilgiler-bos.png');
await fill('field-name', 'Ova vazo');
await fill('field-description', 'Elde şekillendirilmiş, yüksek ısıda pişirilmiş taşkil vazo. Ağız kenarı sırsız bırakıldı; iç yüzey su geçirmez.');
await fill('spec-label-0', 'Yükseklik');
await fill('spec-value-0', '32 cm');
for (const [i, [l, v]] of [['Gövde çapı', '18 cm'], ['Ağız çapı', '7,5 cm'], ['Ağırlık', '1,4 kg']].entries()) {
  await tap('spec-add');
  await fill(`spec-label-${i + 1}`, l);
  await fill(`spec-value-${i + 1}`, v);
}
await fill('field-material', 'Taşkil, 1240 °C');
const options = ['Füme', 'Kum', 'Yosun', 'Pişmiş toprak & "doğal"'];
for (const [i, name] of options.entries()) {
  await tap('option-add');
  await fill(`option-name-${i}`, name);
}
// seçeneklere fotoğraf bağla: Füme→04, Kum→05, Yosun→06, Pişmiş toprak→01 (kapak)
await tap('option-0-photo-3');
await tap('option-1-photo-4');
await tap('option-2-photo-5');
await tap('option-3-photo-0');
await page.evaluate(() => document.activeElement?.blur());
await scrollMain(0);
await shot('04-bilgiler.png');
await scrollMain(900);
await shot('04-bilgiler-secenekler.png');
// notlar: bir kısmını boş bırak (eksik kontrolü için)
await fill('note-0', 'Omuz çizgisi elde çekildi; her parça biraz farklı.');
await fill('note-1', 'Üç boy aynı kalıptan.');
await fill('note-2', 'Sırın altında kilin dokusu kalıyor.');
await page.evaluate(() => document.activeElement?.blur());
await scrollMain('end');
await shot('04-bilgiler-notlar.png');
// fiyat ve iletişim bilerek boş bırakıldı

// ------------------------------------------------------------------ 4. Kalıp
log('Kalıp seç');
await tap('next');
await waitFor('screen-template');
await page.locator('[data-testid="screen-template"] iframe').first().waitFor({ state: 'attached', timeout: 20000 });
await page.waitForTimeout(1200);
await tap('template-story');
await shot('05-kalip.png');

// ------------------------------------------------------------------ 5. Eksik kontrolü
log('Eksik kontrolü');
await tap('next');
await waitFor('screen-check');
for (const key of ['price', 'contact', 'notes']) check(await tid(`missing-${key}`).isVisible(), `eksik listesinde: ${key}`);
for (const key of ['name', 'description', 'specs', 'material', 'options']) check((await tid(`missing-${key}`).count()) === 0, `dolu alan eksik sayılmıyor: ${key}`);
check(await tid('next').getAttribute('aria-disabled') === 'true', 'eksikler çözülmeden Devam kapalı');
await shot('06-eksikler.png');

// "Şimdi ekle": iletişim
await tap('add-contact');
await waitFor('screen-details');
await page.waitForTimeout(700);
const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
check(focusedId === 'contact-name', `"Şimdi ekle" ilgili alana götürdü (odak: ${focusedId})`);
await fill('contact-name', 'Kil Atölyesi');
await fill('contact-phone', '+90 555 000 00 00');
await fill('contact-email', 'merhaba@ornek.com');
await page.evaluate(() => document.activeElement?.blur());
await shot('07-simdi-ekle-iletisim.png');
await tap('next'); // Tamam → kontrole dön
await waitFor('screen-check');
check((await tid('missing-contact').count()) === 0, 'iletişim eklenince eksik listesinden çıktı');

// "Föyde gösterme": fiyat ve notlar
await tap('skip-price');
await tap('skip-notes');
await waitFor('check-all-good');
check(await tid('skipped-price').isVisible(), 'fiyat "föyde gösterilmeyecek" listesinde');
await shot('08-eksikler-tamam.png');

// ------------------------------------------------------------------ 6. Önizleme ve paylaş
log('Önizleme');
await tap('next');
await waitFor('screen-preview');
let html = await previewHtml();
await page.waitForTimeout(1200);
await shot('09-onizleme.png');
check(!html.includes('Fiyat'), 'atlanan fiyat föyde yok');
check(html.includes('Kil Atölyesi'), 'iletişim föyde');
check(html.includes('Pişmiş toprak &amp; &quot;doğal&quot;'), 'özel karakterler kaçışlı ve bozulmadan');
await savePdf(html, 'foy-hikaye.pdf');

// Yazdır/PDF düğmesi (web): hata vermemeli
await tap('share');
await page.waitForTimeout(1500);
check(await page.locator('iframe[aria-hidden="true"]').count() >= 1, 'web: yazdırma için föy çerçevesi oluşturuldu');

// diğer iki kalıp
for (const [tpl, file] of [['options', 'foy-secenekler.pdf'], ['single', 'foy-tek-urun.pdf']]) {
  log('Kalıp değiştir →', tpl);
  await tap('edit-template');
  await waitFor('screen-template');
  await tap(`template-${tpl}`);
  await tap('next');
  await waitFor('screen-preview');
  await page.waitForTimeout(500);
  const next = await previewHtml();
  check(next !== html, `${tpl}: önizleme yeni kalıpla güncellendi`);
  html = next;
  await savePdf(html, file);
  if (tpl === 'options') {
    await page.waitForTimeout(800);
    await shot('10-onizleme-secenekler.png');
  }
}
check(html.includes('class="title"') && !html.includes('class="tile"'), 'Tek ürün kalıbında seçenek ızgarası yok');

// ------------------------------------------------------------------ 7. Liste, kalıcılık, ayarlar
log('Ürün listesi');
await tap('to-list');
await waitFor('screen-products');
await page.waitForTimeout(600);
await shot('11-urunler.png');

await page.reload();
await waitFor('product-row-0', 30000);
await page.waitForTimeout(600);
const rowImg = await tid('product-row-0').locator('img').first().getAttribute('src');
check(!!rowImg && rowImg.startsWith('data:image'), 'sayfa yenilenince ürün ve kapak fotoğrafı duruyor');

log('Ayarlar');
await tap('open-settings');
await waitFor('screen-settings');
const savedName = await page.locator('input').first().inputValue();
check(savedName === 'Kil Atölyesi', 'iletişim bilgisi sonraki ürünler için hatırlandı');
check(await tid('pro-placeholder').isVisible(), 'ödeme yer tutucu ("Yakında") var');
await shot('12-ayarlar.png');

// yeni ürün: iletişim önceden dolu gelmeli
await page.goBack();
await waitFor('cta-new');
await tap('cta-new');
await waitFor('screen-photos');
const chooser2P = page.waitForEvent('filechooser');
await tap('pick-library');
await (await chooser2P).setFiles([fixtures[1]]);
await waitFor('photo-row-0', 30000);
await tap('next');
await waitFor('screen-details');
check((await tid('contact-name').inputValue()) === 'Kil Atölyesi', 'yeni üründe iletişim hazır geldi');
await tap('next');
await waitFor('screen-template');
await tap('next');
await waitFor('screen-check');
check(await tid('missing-name').isVisible(), 'ad boşken "Zorunlu" eksik gösteriliyor');
check((await tid('skip-name').count()) === 0, 'ürün adı atlanamıyor');
await shot('13-eksikler-ad-zorunlu.png');

// ------------------------------------------------------------------ 8. İngilizce
log('İngilizce');
const en = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'en-US' });
const enPage = await en.newPage();
await enPage.goto(BASE);
await enPage.locator('[data-testid="cta-first"]').waitFor({ timeout: 60000 });
await enPage.waitForTimeout(500);
check((await enPage.locator('[data-testid="cta-first"]').innerText()).includes('Make your first sheet'), 'İngilizce arayüz');
await enPage.screenshot({ path: path.join(OUT, '14-en-urunler-bos.png') });
await en.close();

await browser.close();

console.log('\n' + (problems.length ? `SORUNLAR (${problems.length}):\n- ` + problems.join('\n- ') : 'Tüm kontroller geçti.'));
process.exit(problems.length ? 1 : 0);
