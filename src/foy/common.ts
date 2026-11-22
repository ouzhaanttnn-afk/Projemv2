// Kalıpların ortak parçaları: kaçış, yazı tipleri, sayfa iskeleti, bilgi tablosu, alt bilgi.
import { sansMedium, sansRegular, serifItalic, serifRegular } from './fonts.generated';
import { translate, type StringKey } from '../i18n/strings';
import type { FoyData, Lang, RenderOptions } from './types';

/** HTML metni için kaçış. Türkçe karakterler olduğu gibi kalır (belge UTF-8). */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Kaçış + satır sonlarını <br> yapar. */
export function escMultiline(value: string): string {
  return esc(value.trim())
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join('<br>');
}

/** Boş ya da yalnızca boşluktan oluşan metin "yok" sayılır. */
export function has(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Yalnızca gömülü ya da yerel görsel adreslerine izin verilir. */
export function safeSrc(src: string): string | null {
  const s = src.trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(s)) return s;
  if (/^(file|blob):/i.test(s)) return s;
  return null;
}

export const t = (lang: Lang, key: StringKey) => translate(lang, key);

const FONT_CSS = `
@font-face{font-family:'Foy Serif';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${serifRegular}) format('woff2');}
@font-face{font-family:'Foy Serif';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${serifItalic}) format('woff2');}
@font-face{font-family:'Foy Sans';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${sansRegular}) format('woff2');}
@font-face{font-family:'Foy Sans';font-style:normal;font-weight:500;src:url(data:font/woff2;base64,${sansMedium}) format('woff2');}
`;

// Tüm ölçüler milimetre: sayfa A4 dikey (210 × 297 mm), kenar boşlukları 16 mm.
const BASE_CSS = `
@page{size:210mm 297mm;margin:0}
:root{--paper:#FBFAF7;--ink:#1D1B18;--muted:#6F6960;--rule:#D9D3C8;--accent:#A24F2D;--m:16mm}
*{box-sizing:border-box}
figure{margin:0}
html,body{margin:0;padding:0;background:var(--paper)}
body{font-family:'Foy Sans','Helvetica Neue',Arial,sans-serif;color:var(--ink);font-size:8.6pt;line-height:1.45;
  -webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact;
  font-variant-numeric:lining-nums tabular-nums;-webkit-text-size-adjust:100%}
.page{width:210mm;height:296.8mm;padding:13mm var(--m) 10mm;display:flex;flex-direction:column;overflow:hidden;background:var(--paper)}
.kicker{font-size:6.6pt;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:6mm;padding-bottom:2.6mm;border-bottom:.3mm solid var(--ink)}
.top .maker{color:var(--ink);letter-spacing:.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110mm}
.top .dot{display:inline-block;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--accent);margin-right:2.2mm;vertical-align:.15mm}
.head{flex:none}
.title{font-family:'Foy Serif',Georgia,'Times New Roman',serif;font-weight:400;font-size:36pt;line-height:1.02;letter-spacing:-.012em;margin:8mm 0 0;overflow-wrap:anywhere}
.title.l{font-size:29pt}
.title.xl{font-size:23pt;line-height:1.08}
.lede{margin:4mm 0 0;font-size:10pt;line-height:1.5;max-width:132mm;color:var(--ink);overflow-wrap:anywhere}
.ph{position:relative;overflow:hidden;background:#ECE8E1}
.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.info{flex:none;display:grid;grid-template-columns:40mm 1fr;column-gap:6mm;border-top:.3mm solid var(--ink);padding-top:2.6mm}
.info>.kicker{padding-top:1.3mm}
.spec{margin:0;padding:0}
.spec .row{display:grid;grid-template-columns:36mm 1fr;column-gap:4mm;padding:1.55mm 0 1.45mm;border-bottom:.2mm solid var(--rule);break-inside:avoid}
.spec .row:first-child{padding-top:1.3mm}
.spec dt{color:var(--muted);margin:0;overflow-wrap:anywhere}
.spec dd{margin:0;overflow-wrap:anywhere}
.spec .row.solo{grid-template-columns:1fr}
.spec .price dd{font-weight:500}
.foot{flex:none;margin-top:5mm;padding-top:2.6mm;border-top:.2mm solid var(--rule);display:flex;justify-content:space-between;align-items:baseline;gap:8mm}
.contact{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:4.2mm;row-gap:.6mm;font-size:8pt;color:var(--ink);min-width:0}
.contact .kicker{margin-right:.8mm}
.contact span{overflow-wrap:anywhere}
.sig{flex:none;font-size:6.4pt;letter-spacing:.08em;color:var(--muted);white-space:nowrap}
.sig b{font-family:'Foy Serif',Georgia,serif;font-weight:400;font-style:italic;font-size:8pt;letter-spacing:0;color:var(--accent)}
`;

export function documentHtml(lang: Lang, title: string, bodyClass: string, css: string, body: string): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=794">
<title>${esc(title)}</title>
<style>${FONT_CSS}${BASE_CSS}${css}</style>
</head>
<body class="${bodyClass}">
${body}
</body>
</html>`;
}

export function titleClass(name: string): string {
  const n = name.trim().length;
  if (n > 40) return 'title xl';
  if (n > 22) return 'title l';
  return 'title';
}

/** Üst satır: "Ürün föyü" ve (varsa) üreticinin adı. */
export function topBar(d: FoyData): string {
  const maker = has(d.contact.name) ? `<span class="kicker maker">${esc(d.contact.name.trim())}</span>` : '';
  return `<div class="top"><span class="kicker"><span class="dot"></span>${esc(t(d.lang, 'foyEyebrow'))}</span>${maker}</div>`;
}

export function head(d: FoyData): string {
  const lede = has(d.description) ? `<p class="lede">${escMultiline(d.description)}</p>` : '';
  return `<header class="head">${topBar(d)}<h1 class="${titleClass(d.name)}">${esc(d.name.trim())}</h1>${lede}</header>`;
}

export type InfoRow = { label: string; value: string; className?: string };

/** Bilgi tablosunun satırları. Boş değerli satır hiç üretilmez. */
export function infoRows(d: FoyData, opts: { includeOptions: boolean }): InfoRow[] {
  const rows: InfoRow[] = [];
  for (const s of d.specs) {
    if (!has(s.value)) continue;
    rows.push({ label: s.label.trim(), value: s.value.trim() });
  }
  if (has(d.material)) rows.push({ label: t(d.lang, 'foyMaterial'), value: d.material.trim() });
  if (opts.includeOptions) {
    const names = d.options.map((o) => o.name.trim()).filter(Boolean);
    if (names.length) rows.push({ label: t(d.lang, 'foyOptions'), value: names.join(' · ') });
  }
  if (has(d.price)) rows.push({ label: t(d.lang, 'foyPrice'), value: d.price.trim(), className: 'price' });
  return rows;
}

export function specList(rows: InfoRow[], extraClass = ''): string {
  if (!rows.length) return '';
  const items = rows
    .map((r) => {
      const cls = ['row', r.className, r.label ? '' : 'solo'].filter(Boolean).join(' ');
      const dt = r.label ? `<dt>${esc(r.label)}</dt>` : '';
      return `<div class="${cls}">${dt}<dd>${esc(r.value)}</dd></div>`;
    })
    .join('');
  return `<dl class="spec ${extraClass}">${items}</dl>`;
}

/** "Bilgiler" bölümü; hiç satır yoksa bölüm de yoktur. */
export function infoSection(d: FoyData, rows: InfoRow[], extraClass = ''): string {
  if (!rows.length) return '';
  return `<section class="info ${extraClass}"><div class="kicker">${esc(t(d.lang, 'foyDetails'))}</div>${specList(rows)}</section>`;
}

export function footer(d: FoyData, opts: RenderOptions = {}): string {
  const c = d.contact;
  const parts = [c.name, c.phone, c.email, c.web].filter(has).map((v) => `<span>${esc(v.trim())}</span>`);
  const contact = parts.length
    ? `<div class="contact"><span class="kicker">${esc(t(d.lang, 'foyContact'))}</span>${parts.join('')}</div>`
    : '<div class="contact"></div>';
  const signature = opts.signature === false ? '' : `<div class="sig">${signatureHtml(d.lang)}</div>`;
  if (!parts.length && !signature) return '';
  return `<footer class="foot">${contact}${signature}</footer>`;
}

function signatureHtml(lang: Lang): string {
  // "Föy" sözcüğü serif italik ve vurgu renginde.
  const s = esc(t(lang, 'foySignature'));
  return s.replace('Föy', '<b>Föy</b>');
}

export function img(src: string, alt: string): string {
  const safe = safeSrc(src);
  if (!safe) return '';
  return `<img src="${esc(safe)}" alt="${esc(alt)}">`;
}
