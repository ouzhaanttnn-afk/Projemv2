# iPhone uygulamasını TestFlight'a çıkarma rehberi

Bu adımlar yalnızca senin hesaplarınla yapılabilir. Bir kez yapılır;
sonrasında her yeni sürüm tek tıkla derlenir. Menü adları değişmiş olabilir,
takılırsan ekran görüntüsü gönder.

Uygulama kimliği şu an `com.lumoza.randombeat`. Başka bir kimlik istersen
önce bana söyle, ben değiştireyim.

## 1. Apple: uygulama kimliğini kaydet (5 dakika)

1. developer.apple.com → **Account** → **Certificates, Identifiers & Profiles**.
2. **Identifiers** → **+** → **App IDs** → **App**.
3. Description: `Randombeat`. Bundle ID: **Explicit**, `com.lumoza.randombeat`.
4. Ek özellik seçme → **Continue** → **Register**.

## 2. App Store Connect: uygulama kaydını aç (5 dakika)

1. appstoreconnect.apple.com → **Apps** → **+** → **New App**.
2. Platform: **iOS**. Name: `Randombeat` (alınmışsa `Randombeat: Gülüş Beat` gibi).
3. Primary Language: **Turkish**. Bundle ID: `com.lumoza.randombeat`. SKU: `randombeat`.
4. User Access: **Full Access** → **Create**.

## 3. App Store Connect: Codemagic için anahtar oluştur (3 dakika)

1. App Store Connect → **Users and Access** → **Integrations** →
   **App Store Connect API** → **Team Keys** → **+**.
2. Name: `Codemagic`. Access: **App Manager** → **Generate**.
3. **Issuer ID** ve **Key ID**'yi bir yere not et, **.p8 dosyasını indir**.
   Dosya yalnızca bir kez indirilebilir; kaybolursa yeni anahtar oluşturulur.

Bu dosya bir şifre gibidir. Bana ya da başka birine gönderme; yalnızca
Codemagic'e yükle.

## 4. Codemagic: hesabı aç ve bağla (5 dakika)

1. codemagic.io → GitHub hesabınla ücretsiz kaydol.
2. **Add application** → GitHub → `Projemv2` deposunu seç → proje türü
   sorulursa **codemagic.yaml** kullandığını seç.
3. **Team settings** (ya da kişisel ayarlar) → **Integrations** →
   **Developer Portal** → **Connect**.
   - Name: **`Randombeat ASC`** (birebir bu ad; derleme ayarı bu adı arıyor)
   - Issuer ID, Key ID ve .p8 dosyasını gir → **Save**.
4. Codemagic'in ücretsiz planında ayda 500 dakika Mac süresi var; bir
   derleme yaklaşık 10-20 dakika sürer (varsayım, kendi sayfasından kontrol et).

## 5. İlk derleme (20 dakika bekleme)

1. Codemagic'te uygulamaya gir → **Start new build**.
2. Branch: `claude/friendly-brown-lyp3ex`. Workflow: **Randombeat iOS → TestFlight**.
3. **Start new build**. Bittiğinde yeşil olur; kırmızıysa ekran görüntüsünü
   ve günlükteki son satırları bana gönder.
4. Başarılı derleme App Store Connect'e kendiliğinden yüklenir. Apple'ın onu
   işlemesi 5-30 dakika sürebilir.

## 6. Telefonda dene (TestFlight)

1. App Store Connect → uygulama → **TestFlight** → **Internal Testing** →
   **+** ile kendini test kullanıcısı olarak ekle. Kendi ekibindekiler için
   Apple incelemesi gerekmez.
2. iPhone'a App Store'dan **TestFlight** uygulamasını kur, gelen davetle
   Randombeat'i yükle.
3. Bak:
   - Sessiz düğmesi açıkken ses geliyor mu?
   - "Arkadaşına gönder" iPhone'un paylaşım ekranını açıyor mu, WhatsApp'a
     gidiyor mu, giden bağlantı web sitesini açıyor mu?
   - Video hazırlanıp paylaşılıyor mu, WhatsApp'ta sesli oynuyor mu?
   - iOS 26 kullanıyorsan "Zil sesi olarak kaydet" görünüyor mu, paylaşım
     ekranında zil sesi seçeneği çıkıyor mu?
   - Dokununca hafif titreşim var mı?
   - Koleksiyon uygulamayı kapatıp açınca duruyor mu?

## 7. App Store'a göndermeden önce (sonra yapacağız)

- **Gizlilik etiketi:** "Data Not Collected" (uygulama veri toplamaz).
  Gizlilik sayfası: https://randombeat.oguzhaanttnn.workers.dev/gizlilik.html
- **Yaş derecelendirmesi** anketi: büyük ihtimalle en düşük yaş grubu (varsayım).
- **Ekran görüntüleri:** büyük iPhone boyutunda en az bir set (ben hazırlarım).
- **Açıklama metinleri:** taslak `docs/app-store-metin.md` içinde.
- **Satış yapılacaksa:** Paid Apps sözleşmesi, banka ve vergi bilgileri,
  Small Business Program kaydı (Apple payı %15). Fiyat denemesinin
  sonucuna göre karar vereceğiz. Vergi için muhasebeciye danış.

Apple'ın ücret, kural ve süre bilgileri sık değişir; başvurudan önce
yeniden kontrol edilecek.
