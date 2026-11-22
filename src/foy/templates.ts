// Üç föy kalıbı. Her biri saf bir fonksiyon: ürün verisi -> A4 dikey tek sayfa HTML.
// Aynı çıktı uygulama içi önizlemede ve PDF'te kullanılır.
import { documentHtml, esc, footer, has, head, img, infoRows, infoSection, safeSrc, t } from './common';
import type { FoyData, FoyPhoto, RenderOptions, TemplateId } from './types';

export const MAX_STORY_PHOTOS = 6;
export const MAX_OPTION_TILES = 8;

function usablePhotos(d: FoyData): FoyPhoto[] {
  return d.photos.filter((p) => safeSrc(p.src) !== null);
}

function num(i: number): string {
  return String(i + 1).padStart(2, '0');
}

// ---------------------------------------------------------------- Tek ürün

const SINGLE_CSS = `
.single .cover{flex:1 1 auto;min-height:calc(var(--ph-min) + 20mm);margin:var(--gap) 0 calc(var(--gap) * .85)}
.single .spacer{flex:1 1 auto}
`;

export function renderSingle(d: FoyData, opts: RenderOptions = {}): string {
  const cover = usablePhotos(d)[0];
  const rows = infoRows(d, { includeOptions: true });
  const figure = cover ? `<figure class="ph cover">${img(cover.src, d.name)}</figure>` : '<div class="spacer"></div>';
  // Satır çoksa tablo iki sütuna geçer.
  const info = infoSection(d, rows, { cols: rows.length > 8 });
  const body = `<main class="page">${head(d)}${figure}${info}${footer(d, opts)}</main>`;
  return documentHtml(d.lang, d.name, 'single', SINGLE_CSS, body);
}

// ---------------------------------------------------------------- Seçenekler

const OPTIONS_CSS = `
.options .body{flex:1 1 auto;display:grid;grid-template-columns:7fr 5fr;column-gap:6mm;margin:var(--gap) 0 0}
.options .body.full{grid-template-columns:1fr}
.options .body>.ph{min-height:var(--ph-min)}
.options .body .info{grid-template-columns:1fr;row-gap:1mm;align-self:start}
.options .body .spec .row{grid-template-columns:24mm 1fr}
.options.stack .body{grid-template-columns:1fr;grid-template-rows:minmax(var(--ph-min),1fr) auto;row-gap:calc(var(--gap) * .8)}
.options.stack .body .info{grid-template-columns:40mm 1fr}
.options.stack .body .spec{display:grid;grid-template-columns:1fr 1fr;column-gap:8mm}
.options.stack .body .spec .row{grid-template-columns:24mm 1fr}
.options.stack .body .spec .row:nth-child(2){padding-top:calc(var(--row) - .2mm)}
.options .tiles{flex:none;margin-top:calc(var(--gap) * .85);border-top:.3mm solid var(--ink);padding-top:2.6mm}
.options .tiles>.kicker{display:block;margin-bottom:calc(var(--gap) * .4)}
.options .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:4mm;row-gap:calc(var(--gap) * .55)}
.options .tile .ph{aspect-ratio:var(--tile);width:100%}
.options .tile figcaption{display:flex;gap:2mm;align-items:baseline;margin-top:1.6mm;font-size:var(--fs);line-height:1.3}
.options .tile .n{flex:none;font-size:6.6pt;letter-spacing:.08em;color:var(--accent);font-weight:500}
.options .tile .nm{overflow-wrap:anywhere;min-width:0}
.options .also{margin:calc(var(--gap) * .45) 0 0;font-size:var(--fs)}
.options .also .kicker{margin-right:2mm}
`;

export function renderOptions(d: FoyData, opts: RenderOptions = {}): string {
  const cover = usablePhotos(d)[0];
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
          `<figure class="tile"><div class="ph">${img(o.src!, o.name)}</div><figcaption><span class="n">${num(i)}</span><span class="nm">${esc(o.name.trim())}</span></figcaption></figure>`,
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
  // Bilgi sütunu uzunsa önce tablo fotoğrafın altına iner ("stack"), sonra yazı küçülür.
  const levels = ['d1', 'stack d1', 'stack d2', 'stack d3'];
  return documentHtml(d.lang, d.name, 'options', OPTIONS_CSS, body, levels);
}

// ---------------------------------------------------------------- Hikâye

const STORY_CSS = `
.story .seq{flex:1 1 auto;display:grid;column-gap:5mm;margin:var(--gap) 0 calc(var(--gap) * .85)}
.story .item{display:grid;grid-row:span 2;grid-template-rows:subgrid;min-height:0;margin:0}
.story .item figcaption{display:grid;grid-template-columns:7mm 1fr;column-gap:1.5mm;padding-top:2mm;padding-bottom:calc(var(--gap) * .6);align-self:start}
.story .item.last-row figcaption{padding-bottom:0}
.story .item .n{font-size:6.6pt;letter-spacing:.08em;color:var(--accent);font-weight:500;padding-top:.2em}
.story .item .note{font-family:'Foy Serif',Georgia,serif;font-style:italic;font-size:var(--note);line-height:1.35;overflow-wrap:anywhere;min-width:0}
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
  // Fotoğraf satırları için en az yükseklik: tek satırda büyük, üç satırda küçük.
  const minPh = rowsCount === 1 ? 'calc(var(--ph-min) + 20mm)' : `calc(var(--ph-min) * ${rowsCount === 2 ? 0.62 : 0.45})`;
  const items = photos
    .map((p, i) => {
      const last = Math.floor(i / cols) === rowsCount - 1 ? ' last-row' : '';
      const note = d.showNotes && has(p.note) ? `<span class="note">${esc(p.note.trim())}</span>` : '<span></span>';
      return `<figure class="item${last}"><div class="ph">${img(p.src, d.name)}</div><figcaption><span class="n">${num(i)}</span>${note}</figcaption></figure>`;
    })
    .join('');
  const seq = photos.length
    ? `<section class="seq" style="grid-template-columns:repeat(${cols},minmax(0,1fr));grid-template-rows:repeat(${rowsCount},minmax(${minPh},1fr) auto)">${items}</section>`
    : '<div style="flex:1 1 auto"></div>';
  const rows = infoRows(d, { includeOptions: true });
  const info = infoSection(d, rows, { cols: rows.length > 3 });
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
