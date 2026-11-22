# Föy

Telefondaki fotoğraflardan birkaç dakikada temiz, tek sayfalık bir ürün föyü (PDF) hazırlayan uygulama.
Tasarımcılar, seramik atölyeleri, mobilya ve aydınlatma üreticileri için.

## Ne yapar?

1. **Ürünler:** Hazırlanan föylerin listesi.
2. **Fotoğraflar:** Galeriden birkaç fotoğraf seçilir ya da kamerayla çekilir. Sıra değiştirilir, biri kapak yapılır.
3. **Bilgiler:** Ad, kısa açıklama, ölçüler, malzeme, renk/yüzey seçenekleri, isteğe bağlı fiyat ve iletişim
   (iletişim bir kez yazılır, sonraki ürünlerde hatırlanır). Her fotoğrafa “Bunu neden seçtin?” notu eklenebilir.
4. **Kalıp:** Üç föy kalıbı: *Tek ürün*, *Seçenekler*, *Hikâye*.
5. **Eksik kontrolü:** Boş kalan her alan için “Şimdi ekle” ya da “Föyde gösterme”. Uygulama hiçbir bilgiyi
   kendisi doldurmaz; boş alan föyde hiç görünmez.
6. **Önizleme ve paylaş:** Föy PDF olarak paylaşılır (telefonda paylaşım menüsü; tarayıcıda yazdır → PDF olarak kaydet).

Her şey telefonda kalır: hesap, sunucu, yapay zekâ ve bulut eşitleme yok. Arayüz cihaz diline göre Türkçe
ya da İngilizce açılır. Ödeme yok; Ayarlar'da yalnızca “Föy Pro — Yakında” yer tutucusu var.

## Telefonda denemek (Expo Go)

Bilgisayarda Node.js 20 ya da üstü kurulu olmalı.

```bash
npm install
npx expo start
```

iPhone'a App Store'dan **Expo Go** uygulamasını kur. Terminalde çıkan karekodu iPhone kamerasıyla okut;
uygulama Expo Go içinde açılır. Bilgisayar ve telefon aynı Wi-Fi ağında olmalı (olmuyorsa `npx expo start --tunnel`).

Tarayıcıda denemek için: `npx expo start --web`.

## Denetimler

```bash
npm run typecheck     # TypeScript denetimi
npm test              # föy kalıplarının otomatik testleri
npm run e2e:layout    # en uzun metinlerle üç kalıbın tek sayfaya sığdığını Chromium'da dener
npm run e2e           # web sürümü çalışırken (npx expo start --web --port 8081) baştan sona akış
```

`npm run e2e` ekran görüntülerini ve üç kalıbın PDF çıktısını `onizleme/` klasörüne yazar.

## App Store'a göndermek için kalan adımlar

1. **Apple Developer hesabı** (yıllık ücretli) aç.
2. `app.json` içindeki geçici paket kimliğini (`com.example.foy`) kendi kimliğinle değiştir; uygulama adını kesinleştir.
3. **Gerçek iPhone'da dene:** Bu sürüm yalnızca web'de ve iOS paketinin derlenmesiyle denendi. Fotoğraf seçme,
   kamera, PDF oluşturma ve paylaşım menüsü telefonda kontrol edilmeli.
4. EAS ile derle ve gönder (Xcode gerekmez):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build:configure
   npx eas-cli@latest build --platform ios
   npx eas-cli@latest submit --platform ios
   ```
5. App Store Connect'te: ekran görüntüleri (6,7" ve 6,5"), açıklama, anahtar kelimeler, destek adresi ve
   **gizlilik politikası** bağlantısı (veri toplanmadığını belirten kısa bir sayfa yeterli), yaş sınırı.
6. Gizlilik bilgisi: “Veri toplanmıyor” işaretlenebilir; uygulama yalnızca seçilen fotoğrafları kendi klasörüne kopyalar.
7. Ödeme eklenecekse Apple'ın uygulama içi satın alma kuralları geçerli (bu sürümde ödeme yok).

## Klasörler

- `src/app/` — ekranlar (expo-router)
- `src/foy/` — föy kalıpları: ürün verisinden A4 HTML üreten saf fonksiyonlar ve testleri
- `src/foy-view/` — föy önizlemesi ve PDF dışa aktarma
- `src/photos/` — fotoğrafların cihazda saklanması (telefonda uygulama klasörü, web'de IndexedDB)
- `src/i18n/` — Türkçe ve İngilizce metinler
- `e2e/` — uçtan uca deneme betikleri ve örnek görseller (çizimle üretildi)
- `onizleme/` — son denemenin ekran görüntüleri ve PDF'leri

Yazı tipleri: Newsreader ve IBM Plex Sans (SIL Open Font License). Föye gömülen küçültülmüş sürümleri
`scripts/build-foy-fonts.py` üretir.
