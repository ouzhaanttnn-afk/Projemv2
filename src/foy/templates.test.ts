import { describe, expect, it } from 'vitest';
import { buildFoyData, findMissing, findSkipped, orderedPhotos } from './data';
import { esc, safeSrc } from './common';
import { renderFoy } from './templates';
import { EMPTY_CONTACT, TEMPLATE_IDS, type FoyData, type Product } from './types';

// 1×1 piksel PNG
const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function product(over: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Ova sehpa',
    description: '',
    specs: [],
    material: '',
    options: [],
    price: '',
    contact: { ...EMPTY_CONTACT },
    photos: [
      { id: 'a', ref: 'a', width: 10, height: 10, note: '' },
      { id: 'b', ref: 'b', width: 10, height: 10, note: 'Kenar detayı' },
    ],
    template: 'single',
    skipped: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

const data = (p: Product, lang: 'tr' | 'en' = 'tr'): FoyData => buildFoyData(p, () => PX, lang);

/** Görünür metin: etiketler, stil ve betik dışarıda. */
function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('boş alanlar', () => {
  it.each(TEMPLATE_IDS)('%s: boş alanların etiketi föyde görünmez', (tpl) => {
    const html = renderFoy(tpl, data(product({ template: tpl })));
    const text = visibleText(html);
    expect(text).toContain('Ova sehpa');
    for (const label of ['Malzeme', 'Fiyat', 'İletişim', 'Renk / yüzey', 'Bilgiler']) {
      expect(text).not.toContain(label);
    }
    expect(html).not.toContain('class="lede"');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });

  it('yalnızca boşluk olan değerler boş sayılır', () => {
    const p = product({ material: '   ', price: '\n', specs: [{ id: 's', label: 'Ebat', value: '  ' }] });
    const text = visibleText(renderFoy('single', data(p)));
    expect(text).not.toContain('Ebat');
    expect(text).not.toContain('Malzeme');
  });

  it('dolu alanlar görünür', () => {
    const p = product({
      material: 'Masif meşe',
      price: '12.500 TL',
      specs: [{ id: 's', label: 'Ebat', value: '60 × 120 cm' }],
      contact: { name: 'Atölye', phone: '', email: 'a@b.c', web: '' },
    });
    const text = visibleText(renderFoy('single', data(p)));
    for (const v of ['Masif meşe', '12.500 TL', 'Ebat', '60 × 120 cm', 'Atölye', 'a@b.c', 'Bilgiler', 'Fiyat']) {
      expect(text).toContain(v);
    }
  });

  it('notu boş fotoğraf Hikâye kalıbında boş not üretmez', () => {
    const html = renderFoy('story', data(product({ template: 'story' })));
    expect(html.match(/class="note"/g)?.length).toBe(1);
    expect(html).toContain('Kenar detayı');
  });
});

describe('özel karakterler', () => {
  it('Türkçe karakterler bozulmaz, HTML kaçışı yapılır', () => {
    const p = product({
      name: 'Çığ <Şişe> & "İnce" ğüöı',
      description: "Ağız 'kenarı' <b>kalın</b>",
      material: 'Cam & pirinç',
    });
    const html = renderFoy('single', data(p));
    expect(html).toContain('Çığ &lt;Şişe&gt; &amp; &quot;İnce&quot; ğüöı');
    expect(html).toContain('Ağız &#39;kenarı&#39; &lt;b&gt;kalın&lt;/b&gt;');
    expect(html).toContain('Cam &amp; pirinç');
    expect(html).not.toContain('<Şişe>');
    expect(html).not.toContain('<b>kalın</b>');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<html lang="tr">');
  });

  it('betik enjeksiyonu metin olarak kalır', () => {
    const html = renderFoy('story', data(product({ name: '<script>alert(1)</script>', template: 'story' })));
    // Föyde yalnızca kalıbın kendi sığdırma betiği bulunur; kullanıcı metni betik olarak çalışmaz.
    expect(html.match(/<script/gi)?.length).toBe(1);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('esc tüm tehlikeli karakterleri kaçırır', () => {
    expect(esc(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  it('güvensiz görsel adresi föye girmez', () => {
    expect(safeSrc('javascript:alert(1)')).toBeNull();
    expect(safeSrc('https://example.com/a.jpg')).toBeNull();
    expect(safeSrc(PX)).toBe(PX);
    const d = data(product());
    d.photos = [{ src: '" onerror="alert(1)', note: '' }];
    expect(renderFoy('single', d)).not.toContain('onerror');
  });
});

describe('kalıplar', () => {
  it('her kalıp tek A4 sayfa ve imza içerir', () => {
    for (const tpl of TEMPLATE_IDS) {
      const html = renderFoy(tpl, data(product({ template: tpl })));
      expect(html).toContain('size:210mm 297mm');
      expect(html.match(/class="page"/g)?.length).toBe(1);
      expect(visibleText(html)).toContain('Föy ile hazırlandı');
    }
  });

  it('imza kapatılabilir; İngilizce imza', () => {
    expect(visibleText(renderFoy('single', data(product()), { signature: false }))).not.toContain('hazırlandı');
    expect(visibleText(renderFoy('single', data(product(), 'en')))).toContain('Made with Föy');
  });

  it('kapak fotoğrafı önce gelir', () => {
    const p = product({ coverId: 'b' });
    expect(orderedPhotos(p).map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('Seçenekler: fotoğraflı seçenekler ızgarada, diğerleri "Ayrıca" satırında', () => {
    const p = product({
      template: 'options',
      options: [
        { id: '1', name: 'Füme', photoId: 'a' },
        { id: '2', name: 'Şeffaf' },
        { id: '3', name: '  ' },
      ],
    });
    const html = renderFoy('options', data(p));
    expect(html.match(/class="tile"/g)?.length).toBe(1);
    expect(visibleText(html)).toContain('Ayrıca Şeffaf');
    // Izgara varken seçenekler tabloda tekrar etmez
    expect(visibleText(html)).not.toContain('Renk / yüzey ');
  });

  it('Seçenekler: hiç fotoğraf yoksa seçenekler tabloda yazıyla görünür', () => {
    const p = product({ template: 'options', options: [{ id: '1', name: 'Siyah' }] });
    const html = renderFoy('options', data(p));
    expect(html).not.toContain('class="tile"');
    expect(visibleText(html)).toContain('Renk / yüzey Siyah');
  });
});

describe('eksik kontrolü', () => {
  it('boş alanları listeler, atlananları ayırır', () => {
    const p = product({ template: 'story' });
    const keys = findMissing(p).map((m) => m.key);
    expect(keys).toEqual(['description', 'specs', 'material', 'options', 'price', 'contact', 'notes']);
    const skipped = { ...p, skipped: ['price', 'material'] as Product['skipped'] };
    expect(findMissing(skipped).map((m) => m.key)).not.toContain('price');
    expect(findSkipped(skipped).map((m) => m.key)).toEqual(['material', 'price']);
  });

  it('ürün adı zorunludur ve atlanamaz', () => {
    const p = product({ name: ' ', skipped: ['name'] });
    expect(findMissing(p)[0]).toEqual({ key: 'name', required: true });
  });

  it('notlar yalnız Hikâye, seçenek fotoğrafları yalnız Seçenekler kalıbında sorulur', () => {
    const p = product({ options: [{ id: '1', name: 'Siyah' }] });
    expect(findMissing(p, 'single').map((m) => m.key)).not.toContain('notes');
    expect(findMissing(p, 'single').map((m) => m.key)).not.toContain('optionPhotos');
    expect(findMissing(p, 'options').map((m) => m.key)).toContain('optionPhotos');
    expect(findMissing(p, 'story').find((m) => m.key === 'notes')?.count).toBe(1);
  });
});
