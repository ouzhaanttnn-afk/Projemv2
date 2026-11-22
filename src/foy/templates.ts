// Üç föy kalıbı. Her biri saf bir fonksiyon: ürün verisi -> A4 dikey tek sayfa HTML.
// Aynı çıktı uygulama içi önizlemede ve PDF'te kullanılır.
import {
  documentHtml,
  esc,
  footer,
  has,
  head,
  img,
  infoRows,
  infoSection,
  safeSrc,
  t,
} from './common';
import type { FoyData, FoyPhoto, RenderOptions, TemplateId } from './types';

export const MAX_STORY_PHOTOS = 6;
export const MAX_OPTION_TILES = 8;

function usablePhotos(d: FoyData): FoyPhoto[] {
  return d.photos.filter((p) => safeSrc(p.src) !== null);
}

// ---------------------------------------------------------------- Tek ürün

const SINGLE_CSS = `
.single .cover{flex:1 1 auto;min-height:60mm;margin:7mm 0 6mm}
`;

export function renderSingle(d: FoyData, opts: RenderOptions = {}): string {
  const photos = usablePhotos(d);
  const cover = photos[0];
  const figure = cover ? `<figure class="ph cover">${img(cover.src, d.name)}</figure>` : '<div style="flex:1 1 auto"></div>';
  const info = infoSection(d, infoRows(d, { includeOptions: true }));
  const body = `<main class="page">${head(d)}${figure}${info}${footer(d, opts)}</main>`;
  return documentHtml(d.lang, d.name, 'single', SINGLE_CSS, body);
}

// ---------------------------------------------------------------- Seçenekler

const OPTIONS_CSS = `
.options .body{flex:1 1 auto;min-height:50mm;display:grid;grid-template-columns:7fr 5fr;column-gap:6mm;margin:7mm 0 0}
.options .body.full{grid-template-columns:1fr}
.options .body .ph{margin:0;height:100%}
.options .body .info{grid-template-columns:1fr;row-gap:1mm;align-self:start}
.options .body .spec .row{grid-template-columns:24mm 1fr}
.options .tiles{flex:none;margin-top:6mm;border-top:.3mm solid var(--ink);padding-top:2.6mm}
.options .tiles>.kicker{display:block;margin-bottom:3mm}
.options .grid{display:grid;grid-template-columns:repeat(4,1fr);column-gap:4mm;row-gap:4mm}
.options .tile{margin:0}
.options .tile .ph{aspect-ratio:1/1;width:100%}
.options .tile figcaption{display:flex;gap:2mm;align-items:baseline;margin-top:1.8mm;font-size:8.2pt;line-height:1.3}
.options .tile .n{flex:none;font-size:6.6pt;letter-spacing:.08em;color:var(--accent);font-weight:500}
.options .tile .nm{overflow-wrap:anywhere}
.options .also{margin:3.2mm 0 0;font-size:8.2pt}
.options .also .kicker{margin-right:2mm}
`;

export function renderOptions(d: FoyData, opts: RenderOptions = {}): string {
  const photos = usablePhotos(d);
  const cover = photos[0];
  const named = d.options.filter((o) => has(o.name));
  const withPhoto = d.showOptionPhotos ? named.filter((o) => o.src && safeSrc(o.src)).slice(0, MAX_OPTION_TILES) : [];
  const textOnly = named.filter((o) => !withPhoto.includes(o));
  const hasGrid = withPhoto.length > 0;

  // Izgara varsa seçenekler tabloda tekrar edilmez.
  const rows = infoRows(d, { includeOptions: !hasGrid });
  const sideInfo = infoSection(d, rows);

  let tiles = '';
  if (hasGrid) {
    const items = withPhoto
      .map(
        (o, i) =>
          `<figure class="tile"><div class="ph">${img(o.src!, o.name)}</div><figcaption><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="nm">${esc(o.name.trim())}</span></figcaption></figure>`,
      )
      .join('');
    const also = textOnly.length
      ? `<p class="also"><span class="kicker">${esc(t(d.lang, 'foyAlso'))}</span>${textOnly.map((o) => esc(o.name.trim())).join(' · ')}</p>`
      : '';
    tiles = `<section class="tiles"><span class="kicker">${esc(t(d.lang, 'foyOptionsGrid'))}</span><div class="grid">${items}</div>${also}</section>`;
  }

  const figure = cover ? `<figure class="ph">${img(cover.src, d.name)}</figure>` : '';
  const bodyCls = sideInfo && figure ? 'body' : 'body full';
  const body = `<main class="page">${head(d)}<div class="${bodyCls}">${figure}${sideInfo}</div>${tiles}${footer(d, opts)}</main>`;
  return documentHtml(d.lang, d.name, 'options', OPTIONS_CSS, body);
}

// ---------------------------------------------------------------- Hikâye

const STORY_CSS = `
.story .seq{flex:1 1 auto;min-height:70mm;display:grid;column-gap:5mm;row-gap:5mm;margin:7mm 0 6mm}
.story .item{display:flex;flex-direction:column;min-height:0;margin:0}
.story .item .ph{flex:1 1 auto;min-height:24mm}
.story .item figcaption{flex:none;display:grid;grid-template-columns:7mm 1fr;column-gap:1.5mm;margin-top:2.2mm}
.story .item .n{font-size:6.6pt;letter-spacing:.08em;color:var(--accent);font-weight:500;padding-top:.9mm}
.story .item .note{font-family:'Foy Serif',Georgia,serif;font-style:italic;font-size:10pt;line-height:1.35;overflow-wrap:anywhere}
.story .info .spec{display:grid;grid-template-columns:1fr 1fr;column-gap:8mm}
.story .info .spec .row:first-child,.story .info .spec .row:nth-child(2){padding-top:1.3mm}
.story .info .spec .row{grid-template-columns:28mm 1fr}
`;

function storyColumns(n: number): number {
  if (n <= 3) return Math.max(1, n);
  if (n === 4) return 2;
  return 3;
}

export function renderStory(d: FoyData, opts: RenderOptions = {}): string {
  const photos = usablePhotos(d).slice(0, MAX_STORY_PHOTOS);
  const cols = storyColumns(photos.length);
  const rowsCount = Math.max(1, Math.ceil(photos.length / cols));
  const items = photos
    .map((p, i) => {
      const note = d.showNotes && has(p.note) ? `<span class="note">${esc(p.note.trim())}</span>` : '<span></span>';
      return `<figure class="item"><div class="ph">${img(p.src, d.name)}</div><figcaption><span class="n">${String(i + 1).padStart(2, '0')}</span>${note}</figcaption></figure>`;
    })
    .join('');
  const seq = photos.length
    ? `<section class="seq" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rowsCount},minmax(0,1fr))">${items}</section>`
    : '<div style="flex:1 1 auto"></div>';
  const info = infoSection(d, infoRows(d, { includeOptions: true }));
  const body = `<main class="page">${head(d)}${seq}${info}${footer(d, opts)}</main>`;
  return documentHtml(d.lang, d.name, 'story', STORY_CSS, body);
}

// ----------------------------------------------------------------

export function renderFoy(template: TemplateId, data: FoyData, opts: RenderOptions = {}): string {
  switch (template) {
    case 'options':
      return renderOptions(data, opts);
    case 'story':
      return renderStory(data, opts);
    case 'single':
    default:
      return renderSingle(data, opts);
  }
}
