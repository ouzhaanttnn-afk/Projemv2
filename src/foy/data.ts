// Ürün kaydından kalıp girdisini üretir ve eksik alanları bulur. Saf fonksiyonlar.
import { has } from './common';
import type { FieldKey, FoyData, Lang, Photo, Product, TemplateId } from './types';

/** Kapak önce, ardından listedeki sıra. */
export function orderedPhotos(product: Pick<Product, 'photos' | 'coverId'>): Photo[] {
  const cover = product.photos.find((p) => p.id === product.coverId) ?? product.photos[0];
  if (!cover) return [];
  return [cover, ...product.photos.filter((p) => p.id !== cover.id)];
}

/**
 * Kalıp girdisini kurar. `srcOf` fotoğrafın gömülü adresini (data: URL) verir.
 * Hiçbir alan tahminle doldurulmaz: yalnızca kullanıcının yazdığı kullanılır.
 */
export function buildFoyData(product: Product, srcOf: (photo: Photo) => string | undefined, lang: Lang): FoyData {
  const photos = orderedPhotos(product)
    .map((p) => ({ src: srcOf(p) ?? '', note: p.note, width: p.width, height: p.height }))
    .filter((p) => p.src);
  const byId = new Map(product.photos.map((p) => [p.id, p]));
  return {
    lang,
    name: product.name,
    description: product.description,
    specs: product.specs.map((s) => ({ label: s.label, value: s.value })),
    material: product.material,
    options: product.options.map((o) => {
      const photo = o.photoId ? byId.get(o.photoId) : undefined;
      return { name: o.name, src: photo ? srcOf(photo) : undefined };
    }),
    price: product.price,
    contact: { ...product.contact },
    photos,
    showNotes: true,
    showOptionPhotos: true,
  };
}

export type MissingItem = {
  key: FieldKey;
  /** Ürün adı gibi alanlar atlanamaz. */
  required: boolean;
  /** Bilgi amaçlı sayı (ör. notu olmayan fotoğraf sayısı). */
  count?: number;
};

/** Seçili kalıpta görünebilecek ama boş olan alanlar. Atlananlar dahil değildir. */
export function findMissing(product: Product, template: TemplateId = product.template): MissingItem[] {
  const out: MissingItem[] = [];
  if (!has(product.name)) out.push({ key: 'name', required: true });
  if (!has(product.description)) out.push({ key: 'description', required: false });
  if (!product.specs.some((s) => has(s.value))) out.push({ key: 'specs', required: false });
  if (!has(product.material)) out.push({ key: 'material', required: false });
  const namedOptions = product.options.filter((o) => has(o.name));
  if (!namedOptions.length) out.push({ key: 'options', required: false });
  if (template === 'options' && namedOptions.length && !namedOptions.some((o) => o.photoId && product.photos.some((p) => p.id === o.photoId))) {
    out.push({ key: 'optionPhotos', required: false });
  }
  if (!has(product.price)) out.push({ key: 'price', required: false });
  const c = product.contact;
  if (![c.name, c.phone, c.email, c.web].some(has)) out.push({ key: 'contact', required: false });
  if (template === 'story') {
    const withoutNote = orderedPhotos(product).slice(0, 6).filter((p) => !has(p.note)).length;
    if (withoutNote > 0) out.push({ key: 'notes', required: false, count: withoutNote });
  }
  return out.filter((m) => m.required || !product.skipped.includes(m.key));
}

/** Atlanmış ve hâlâ boş olan alanlar ("Föyde gösterilmeyecek" listesi). */
export function findSkipped(product: Product, template: TemplateId = product.template): MissingItem[] {
  const all = findMissing({ ...product, skipped: [] }, template);
  return all.filter((m) => !m.required && product.skipped.includes(m.key));
}
