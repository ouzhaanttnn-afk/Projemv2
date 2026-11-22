// Ürün kaydından föy HTML'i üretir: fotoğrafları gömülü (data: URL) hâle getirir, kalıbı çağırır.
import { buildFoyData, orderedPhotos } from '../foy/data';
import { renderFoy } from '../foy/templates';
import type { Product, TemplateId } from '../foy/types';
import { lang } from '../i18n';
import { photoStore } from '../photos/storage';

export async function loadPhotoSources(product: Product): Promise<Map<string, string>> {
  const refs = new Set<string>(orderedPhotos(product).map((p) => p.ref));
  const map = new Map<string, string>();
  await Promise.all(
    [...refs].map(async (ref) => {
      const src = await photoStore.dataUrl(ref);
      if (src) map.set(ref, src);
    }),
  );
  return map;
}

export function htmlFor(product: Product, sources: Map<string, string>, template: TemplateId = product.template): string {
  const data = buildFoyData(product, (p) => sources.get(p.ref), lang);
  return renderFoy(template, data, { signature: true });
}

export async function buildFoyHtml(product: Product, template: TemplateId = product.template): Promise<string> {
  return htmlFor(product, await loadPhotoSources(product), template);
}

export function fileNameFor(product: Product): string {
  const base = product.name
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'foy'}-foy`;
}
