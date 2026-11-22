# Proje notları

## Çalışma kuralı (kullanıcı talimatı, kalıcı)

- **Fable sadece planlar; uygulamayı Opus yapar.** Fable kotayı hızlı tükettiği için kod yazma,
  dosya üretme, inceleme gibi uygulama işleri `model: "opus"` ile başlatılan alt ajanlara verilir.
  Ana oturum planı kurar, işi böler, sonucu kontrol eder ve kullanıcıya özetler.
- Kullanıcıyla her zaman Türkçe, kısa ve sade konuş. Kullanıcı kod okumuyor; teknik terim yerine
  ne olduğunu anlat.
- Ücretli reklam önerme; ücretsiz büyüme yolları öner.

## Ürün (geçici ad: "Stüdyodan Paftaya")

Fiziksel ürün tasarlayan bireysel tasarımcı için App Store uygulaması.

1. **Topla (telefon):** Numune, eskiz, yüzey denemesi fotoğrafı çekilir; uygulama tek soru sorar:
   "Bunu neden seçtin ya da eledin?" Cevap yazıyla ya da sesle, on saniyede.
2. **Sakla:** Ölçü, renk, malzeme bilgisi bir kez girilir. Yapay zekâ bilgi uydurmaz; eksik varsa
   kullanıcıya sorar.
3. **Çıkar (iPad):** "Kime sunuyorsun?" sorusuna göre düzenlenebilir föy hazırlanır.

İlk sürümde tek çıktı: müşteri föyü. Kapsam dışı: zihin haritası, araştırma yönü, hoca kritiği,
öğrenci akışı, jüri paftası, alıcının cevap verdiği bağlantı.

Gelir fikri (kesin değil): ilk föy ücretsiz, sonrası aylık 5–8 dolar ya da föy başına ödeme.

## Kurulu ajanlar

`.claude/agents/` altında msitarzewski/agency-agents deposundan seçilmiş sekiz uzman rolü var
(ürün, kullanıcı araştırması, ekran yapısı, App Store görünürlüğü, büyüme, mobil geliştirme,
iş stratejisi, gerçeklik denetimi). Deponun tamamı (300'den fazla rol) bilerek kurulmadı; her
oturumda yüklenip kotayı tüketmesin diye.
