# Randombeat — Baştan Sona Plan

Bu dosya, projeyi sıfırdan devralan bir yardımcının başka hiçbir şeye bakmadan
işe başlayabilmesi için yazıldı. Depoda henüz hiçbir uygulama dosyası yok.

Son güncelleme: 22 Kasım 2026 (1. hafta yapıldı)

---

## 0. Durum

| Adım | Durum |
|---|---|
| Fikir, araştırma, plan | Tamamlandı |
| 1. hafta — Ses | Yapıldı; kapıda, ürün sahibinin dinlemesi bekleniyor |
| 2. hafta — Web sayfası ve WhatsApp denemesi | Başlanmadı |
| 3. hafta — Kartlar ve koleksiyon | Başlanmadı |
| 4. hafta — 10-15 kişilik deneme | Başlanmadı |
| 5-6. hafta — Uygulamaya çevirme ve satış | Başlanmadı |
| 7-8. hafta — Test sürümü ve App Store | Başlanmadı |

Her adımı bitirince bu tabloyu güncelle.

### 1. hafta notları

- Dinleme sayfası: https://claude.ai/artifact/8zffBbe3EJapypJMkpVsxP
  (kaynağı `web/dinle.template.html`, oluşturmak için `npm run dinle`).
- Ses motoru `src/engine/` içinde. Testler: `npm test`; tarayıcıda aynı sesi
  verme testi: `node tools/test-browser.ts`; benzersizlik testi:
  `npm run benzersizlik` (rapor `reports/benzersizlik.md`).
- Benzersizlik testi üç şartı da geçti (gülüşler gerçekçi ama yapay;
  gerçek random'larla yeniden çalıştırılmalı). Eşik 0,25, kulakla ayarlanacak.
- Plandan sapmalar ve verilen kararlar:
  - Baharat sesleri (zil, darbuka, tef, kaşık, el çırpma, zurna) şimdilik
    kayıt değil, telefonda üretiliyor. Serbest lisanslı kayıt doğrulanınca
    değiştirilebilir.
  - Büyük harf tarzı değiştirmiyor: "SJSJSJ", "sjsjsj"nin sert takımlı,
    daha hızlı ve melodisi kalınlaşmış hali.
  - Gülüşün uzunluğu (tekrar sayısı) kimliği değiştirmiyor, enerjiyi
    artırıyor (daha sık tıkırtı, açık zil, melodi katlanması).
  - Tekrarsız uzun bir random'da tek harf değiştirmek ya da boşluk eklemek
    tamamen yeni bir beat veriyor. Her random kendine özgü olsun diye.
  - Ses, telefon hoparlörü düşünülerek dengelendi: 36 sesin seviyesi
    `tools/calibrate.ts` ile otomatik ayarlandı, çok kalın sesler kısıldı.
  - iPhone'da aynı sesin çıktığı burada denenemedi; dinleme sayfası bunu
    telefonda kendisi kontrol edip gösteriyor.

---

## 1. Ürün sahibiyle çalışma kuralları

- Her zaman Türkçe, kısa ve sade konuş. Ürün sahibi kod okumuyor; teknik terim
  yerine ne olduğunu anlat.
- Ürün sahibi "YAP" dediğinde bu plandaki sıradaki bitmemiş adımdan başla.
- Her adımın sonunda bir "kapı" var. Kapıda dur, sonucu göster, ürün sahibinin
  kararını bekle. Kapıyı geçmeden sonraki adıma başlama.
- Ücretli reklam önerme. Büyüme yalnızca ücretsiz yollarla olacak.
- Ürün sahibinin Apple geliştirici hesabı var.
- Gerçek telefonda deneme gereken her şeyi ürün sahibi yapar (kendi iPhone'u ve
  bir arkadaşının Android telefonu). Yardımcı telefonda deneyemez; bunu açıkça
  söyle ve neye bakması gerektiğini adım adım yaz.
- Emin olmadığın şeyi "varsayım" diye işaretle. Bu plandaki fiyat, vergi ve
  Apple kuralı bilgilerini kullanmadan önce yeniden kontrol et.

---

## 2. Fikir

İnsanlar grup sohbetinde gülerken klavyeye rastgele basıyor: "sjsjsj",
"asdfghjkl", "gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf". Türkiye'de buna
"random atmak" deniyor.

Randombeat bu yazıyı kısa bir beat'e çevirir. Kullanıcı beat'i arkadaşına
gönderir. Arkadaş bağlantıyı açar, beat'i duyar, kendi random'unu yazar ve
iki beat birleşip ortak bir "çift kart" olur. Beat'ler kart olarak birikir.

İlk kullanıcı: grup sohbetinde zaten böyle gülen, telefondan arkadaşına karşılık
vermek isteyen biri. Müzik bilmesi gerekmiyor.

---

## 3. Kesinleşen kararlar

- Hedef App Store. Ama önce web sayfası yapılır, uygulama onun üstüne kurulur.
  Sebep: Türkiye'de telefonların yaklaşık yüzde 77'si Android; arkadaşların çoğu
  iPhone uygulamasını indiremez.
- Eski prototip yok sayılır, her şey sıfırdan kurulur.
- En önemli ölçüt: iki farklı random'un beat'i birbirine benzemesin.
- Aynı yazı her telefonda, her zaman aynı beat'i verir.
- Oyun hissi koleksiyondan gelir: her beat bir kart, nadir yazışlar nadir sesler
  açar.
- Beat yapmak, göndermek ve harmanlamak her zaman bedava.
- Hesap açma, giriş yapma ve sunucuda kayıt tutma yok. Koleksiyon telefonda durur.
- Beat üretiminde yapay zekâ yok; sesler kurallarla üretilir.
- Paylaşım WhatsApp'ta çalışmak zorunda.

### İlk sürümde OLMAYANLAR
- Yazış hızını ve duraksamayı kaydetmek. (Türkiye'de klavye kullanım biçimi özel
  korunan kişisel veri sayılıyor; yapıştırılan yazıda da çalışmıyor.)
- Poster ve kart baskısı. (Vergi kaydı gerektirebilir; önce muhasebeciye sorulacak.)
- Kendi kartlarını birbiriyle harmanlama.
- Grup beat'i (altı kişinin her birinin bir rol aldığı beat).
- Beat'e komik isim ve yorum yazan yapay zekâ.
- Mesajlar (iMessage) içinde çalışan sürüm.
- Kredi sistemi, parayla şans paketi, uygulama içi reklam, paylaşılan videodaki
  imzayı parayla kaldırma. Bunlar hiç yapılmayacak.

---

## 4. Ses tasarımı

### 4.1 Olmazsa olmazlar
- "sjsjsj" yazınca kısa, tekrarlayan bir motif duyulur.
- "sjsjsjŞ" yazınca aynı motif tanınır ve sonda belirgin bir vurgu duyulur.
- Uzun bir random'un içindeki boşluk, müzikte bir durak olarak duyulur.
- Farklar telefon hoparlöründen de duyulur.

### 4.2 Sesler: 6 rol, her rolde 6 seçenek (toplam 36 ses)

| Rol | Ne işe yarar |
|---|---|
| Kalın vuruş | Beat'in kalbi |
| Tok vuruş | Alkış ya da trampet; ritmi keser |
| Tıkırtı | Hızlı, ince sesler; akışı verir |
| Bas | Alttan gelen kalın nota |
| Kısa melodi | Akılda kalan küçük nağme |
| Baharat | Ş, ç, ğ, ü, ö, ı harflerinin özel sesi |

- Her beat, her rolden bir seçeneği ayrı ayrı seçer. Altı hazır takım yok;
  böylece 46 binden fazla takım çıkar.
- Aynı anda en çok 6 ses çalar.
- Kalın vuruş, bas, tıkırtı ve melodi telefonun kendi ürettiği seslerdir (yer
  kaplamaz, sınırsız çeşitlenir).
- Baharat rolü yerli seslerdir: darbuka, zil, el çırpma, kaşık, bağlama tınısı.

### 4.3 Yazıdan müziğe kurallar

**İki katmanlı kimlik (en önemli kural):**
- Tarz, hız, ton ve ses takımı yazının "değişmeyen şeklinden" seçilir: küçük
  harfe çevrilmiş, tekrarları sadeleştirilmiş hali.
- Yazının tamamı yalnızca ayrıntıyı ekler (vurgu, süsleme, baharat).
- Bu sayede "sjsjsjŞ", "sjsjsj"nin aynısı gibi duyulur ama sonuna vurgu eklenir.

**Diğer kurallar:**
- Harfler vuruşları doğrudan yerleştirmez. Yazı, müzik olarak düzgün duyulan
  seçenekler arasından seçim yapar (iskelet ritim + eşit aralıklı vuruş
  katmanları + kaydırma). Rastgelelik yalnızca küçük farklar için kullanılır.
- Tekrar: tekrar eden parçanın uzunluğu motifin uzunluğu olur. Çok tekrarlı
  yazı hızlı ve seyrek bir beat verir.
- Klavyedeki yer: harfin sütunu notayı belirler. Sol el harfleri kalın vuruş ve
  basa, sağ el harfleri tıkırtı ve melodiye gider. Türkçe Q klavye esas alınır.
- Akıp giden yazı ("asdfghjkl"): basamak basamak ilerleyen melodi ve salınımlı
  ritim.
- Harf değişimi: aynı harfin tekrarı hızlı bir tekrarlama (rulo) olur; klavyede
  uzak bir harfe sıçrama, melodide sıçrama ve vurgu olur.
- Büyük harf: daha yüksek ses ve ek bir katman. Tamamı büyük harf: sert takım ve
  daha hızlı tempo.
- Boşluk: bütün seslerin bir vuruşluk susması, sonra yeniden giriş. Boşluktan
  sonraki kısım "cevap veren yarı" olur.
- Uzunluk: beat hep 4 ölçüdür. Uzun yazı süreyi değil, katman sayısını ve
  yoğunluğu artırır.
- Türkçe harfler (ş, ç, ğ, ü, ö, ı): o noktada bir baharat sesi çalar; ayrıca
  beat'i Türk ritimlerine ve Hicaz tadına doğru iter.

**Beat'leri birbirinden ayıran şeyler, etkisi büyükten küçüğe:**
1. Hız ve ölçü hissi (düz, yarı hız, 6/8, aksak)
2. Ses takımının rengi
3. Yoğunluk ve sessizlik
4. Bas ve melodinin kalınlığı ile hareketi
5. Gamın rengi
6. Salınım
7. Geçiş süslemeleri
8. Ton (tek başına neredeyse duyulmaz; varsayım)

Eski prototipte 1 ve 3 eksikti: 16 adım, düz 4/4, dar hız aralığı, sabit
yoğunluk. Aynı hataya düşme.

**Türk tadı:**
- Ritimler: 9/8 (2+2+2+3, roman havası), 7/8 (2+2+3 ya da 3+2+2),
  5/8 (2+3), halay (2/4 ya da 4/4).
- Gamlar: Hicaz, Kürdi, Nihavend tadı. Uşşak ve Hüseyni tadı için ikinci
  perdeyi biraz pesleştirme denenebilir (öneri).

### 4.4 Üç örnekte ne duyulmalı
- **"sjsjsj":** Hızlı, iki sesli bir gidip gelme: kalın bir tok, ince bir tını.
  Sıkı bir döngü; dördüncü ölçüde küçük bir süsleme.
- **"sjsjsjŞ":** Aynı gidip gelme, ama her cümlenin sonunda yüksek bir zil ve
  darbuka süslemesi.
- **Boşluklu uzun random:** İki ölçü yoğun, orta hızda bir ritim; ani bir
  vuruşluk sessizlik; sonra farklı bir melodiyle ve ek katmanlarla gelen cevap.

### 4.5 Harmanlama (iki kişinin beat'i)
- İkisi aynı hıza ve tona çekilir.
- Önce birinci kişi, sonra ikinci kişi, sonra ikisi birlikte duyulur.
- Roller paylaştırılır: birinci kişi kalın vuruş, bas ve kalın melodiyi; ikinci
  kişi tok vuruş, tıkırtı ve ince melodiyi alır.
- Her kişinin motifi kendi ses rengini ve kendi kalınlığını korur. Sağ-sol
  kulak ayrımı kullanılmaz; telefon hoparlörü tek kanaldır.
- Aynı iki yazı her zaman aynı çift kartı verir.

### 4.6 Telefon hoparlörü
- Telefon hoparlörü kalın sesleri (yaklaşık 200 Hz altı) çalamaz. (Varsayım;
  iPhone için ölçüm bulunamadı.)
- Kalın vuruşa bir "tık" ve hızlı bir perde düşüşü ekle.
- Basa üst tınılar ekle ki kalın nota hoparlörde de algılansın.
- Tek kanal karıştır, en alttaki gürültüyü kes, sonda ses tavanı koy.
- Son kararı gerçek telefonda dinleyerek ver.

### 4.7 Benzersizlik testi (1. haftanın şartı)
- En az 10.000 yazı üret: gerçek random'lara benzeyenler, birbirine çok yakın
  olanlar ve Türkçe harfliler dahil.
- Hiçbir iki farklı yazı birebir aynı beat'i vermemeli.
- İki beat'in benzerliği şu ağırlıklı toplamla ölçülür: her katmandaki vuruş
  yerlerinin farkı, ses takımının ortaklığı, hız farkı, ton farkı, melodi farkı.
- Eşik, yaklaşık 50 çifti kulakla dinleyerek ayarlanır. Çiftlerin binde
  birinden azı bu eşiğin altında kalmalı.
- **En büyük tuzak:** Gerçek random'lar birbirine çok benzer (orta sıradaki
  harfler, benzer uzunluk). Kurallar gerçek random örnekleriyle ayarlanmazsa
  herkes aynı tarza düşer. Çözüm: her tarzın, ölçünün ve hız aralığının
  yaklaşık eşit sıklıkta çıkmasını sağla; hız, yoğunluk ve salınımı basamaklı
  değil, kesintisiz değerler olarak tut; en benzer çiftleri dinle.

### 4.8 Ses kaynakları
- Kaydedilmiş seslerde yalnızca tamamen serbest (CC0) lisanslı olanları kullan.
  Her sesin kaynağını ve kimliğini bir listede tut. Lisansı tek tek doğrula.
- Tamamen serbest lisanslı bir bağlama kaydı bulunamadı. Tel sesini telefonun
  üretmesi ya da bir müzisyenden kayıt alınması gerekir.

---

## 5. Teknik kararlar

Bu bölüm planı uygulayan yardımcı içindir.

### 5.1 Ses motoru
- Tek bir ses motoru yazılır ve hem web sayfasında hem uygulamada aynısı
  kullanılır. Dil: TypeScript.
- Motor sesi kendisi, örnek örnek hesaplar ve yaklaşık 10 saniyelik ham ses
  verisi üretir. Tarayıcının hazır ses kutuları (Web Audio düğümleri,
  OfflineAudioContext) sesi üretmek için KULLANILMAZ: sonuç tarayıcıdan
  tarayıcıya değişir ve Safari ses okumasına bilerek gürültü ekler.
- Sinüs ve üs gibi hesaplarda tarayıcılar arasında fark çıkabilir (varsayım);
  hazır tablolar kullan.
- Yazıdan desen çıkarırken yalnızca tam sayı hesabı kullan. Yazıyı önce
  standart biçime (NFC) getir. Büyük-küçük harf çevirisinde dile bağlı
  davranıştan kaçın: Türkçe i/İ ve ı/I açıkça ele alınmalı.
- Çalma, web sayfasında: üretilen ses bir dosya gibi sıradan ses oynatıcısına
  verilir ve bir dokunuştan sonra çalınır. Bu yol iPhone'un sessiz düğmesinden
  etkilenmez. (Tarayıcının ses motoruyla doğrudan çalmak sessiz düğmede susar.)
- Çalma, uygulamada: yerel oynatıcı kullanılır.

### 5.2 Bağlantı
- Beat, bağlantının içinde taşınır; sunucuda kayıt tutulmaz.
- Beat bilgisi bağlantının yol ya da sorgu kısmında durur ("#" sonrası kısımda
  değil). Sebep: her beat'e özel önizleme resmi için küçük bir sunucu işlevi
  gerekir ve "#" sonrası sunucuya ulaşmaz.
- Bağlantı 2.000 karakterin altında kalır (varsayım; resmî sınır bulunamadı).
- Açık karar: bağlantıda yazının kendisi mi, yoksa yalnızca beat ayarları mı
  taşınacak? Öneri: yazı taşınsın (arkadaşın gülüşü görmesi eğlencenin
  parçası), sunucu işlevi hiçbir şey kaydetmesin. Ürün sahibine sor.
- WhatsApp önizlemesi: sayfanın ilk gelen halinde önizleme etiketleri olmalı;
  resim en az 300 piksel genişlikte ve 300 KB altında olmalı. WhatsApp
  önizlemeyi gönderenin telefonunda kurar ve sayfadaki kodu çalıştırmaz.

### 5.3 Video ve paylaşım
- Video 6 saniyeden uzun olmalı. Daha kısa videoları WhatsApp sessiz
  gönderebiliyor. Hızlı bir beat 4 ölçüde 6 saniyenin altında kalabilir; o
  zaman video beat'i iki kez çalar.
- Biçim: MP4, H.264, tek ses kanalı AAC, 16 MB altı.
- WhatsApp paylaşımda genelde ya videoyu ya da yazıyı/bağlantıyı tutuyor,
  ikisini birden değil. Bu yüzden: video tek başına paylaşılır, kısa bağlantı
  videonun üstüne yazılır ve panoya kopyalanır.
- Web sayfasında video üretmek belirsiz. 2. haftada denenir. Olmazsa web
  sayfası yalnızca bağlantı paylaşır, video yalnızca uygulamada olur.
- Zil sesi için dışa aktarılan ses 30 saniyeden kısa olmalı (29 saniyede tut).

### 5.4 Uygulamaya çevirme
- Web uygulaması, onu iPhone uygulamasına saran bir araçla paketlenir
  (Capacitor). Derleme, imzalama ve yükleme bulut üzerindeki Mac'lerde yapılır
  (Codemagic; kişisel kullanımda ayda 500 dakika ücretsiz). Mac gerekmez.
- Apple'ın "bu sadece paketlenmiş bir web sitesi" diye reddetme riski orta
  düzeyde. Azaltmak için: internetsiz beat üretimi, Apple üzerinden satın alma,
  yerel paylaşım ekranı, titreşim, kart koleksiyonu.
- Yedek yol: reddedilirse kabuk Expo'ya taşınır, ses motoru aynen kalır.
- Apple'ın uygulama parçacığı (App Clip) özelliği ilk sürümde kullanılmaz.

### 5.5 Apple kuralları (başvurudan önce yeniden kontrol et)
- Ses paketleri ve zil sesi, Apple'ın uygulama içi satın alma sistemiyle satılır.
- Küçük geliştirici programına kaydolunursa Apple'ın payı yüzde 15 olur; kayıt
  kendiliğinden olmaz.
- Hesap olmadığı için hesap silme kuralı uygulanmaz.
- Kullanıcıların paylaştığı içerik kuralı hafif uygulanır (akış ve profil yok;
  varsayım). Yine de bir "bildir" bağlantısı ve iletişim adresi koy.
- Gizlilik etiketi ve gizlilik metni bağlantısı zorunlu.
- İnceleme genelde bir gün sürer; günlerce süren örnekler de var.

### 5.6 Gizlilik
- Yazılan hiçbir şey sunucuda saklanmaz.
- Yazış hızı ve ritmi hiç ölçülmez.
- Koleksiyon yalnızca telefonda durur.

---

## 6. Adım adım plan

### 1. hafta — Ses
Yapılacaklar:
- Ses motoru ve bölüm 4'teki kurallar.
- Ürün sahibinin dinleyebileceği basit bir sayfa: 10 farklı örnek beat, ayrıca
  bölüm 4.4'teki üç örnek.
- Benzersizlik testi (bölüm 4.7).

**Kapı:** Ürün sahibi dinler. "Bunu arkadaşıma atarım" diyorsa ve benzersizlik
testi geçiyorsa devam. Demiyorsa ses düzeltilir; iki denemede de olmuyorsa
proje bırakılır.

### 2. hafta — Web sayfası ve WhatsApp denemesi
Yapılacaklar:
- Web sayfası: yaz, duy, gönder. Arkadaş bağlantıyı açar, duyar, cevap yazar,
  harmanlanmış beat çıkar.
- Telefonda açılacak şekilde yayına alma (alan adı ve barındırma yaklaşık
  0-15 dolar).
- WhatsApp denemesi: video gidiyor mu, sesi çıkıyor mu, bağlantıya
  dokunulabiliyor mu, önizleme resmi çıkıyor mu?

Ekranlar:
- İlk kez açan: tek bir yazı kutusu ("Gülüşünü yaz"), altında çal düğmesi,
  ritmi gösteren basit bir görüntü, "Gönder" düğmesi.
- Davet alan arkadaş: üstte gönderenin gülüşü ve çal düğmesi, altında "Sen de
  random'unu yaz" kutusu, sonra harmanlanmış beat ve "Geri gönder" düğmesi.

**Kapı:** Ürün sahibi kendi iPhone'unda ve bir Android telefonda dener. Video
ile bağlantı düzgün gitmiyorsa yedek yola geçilir: yalnızca bağlantı, her
beat'e özel önizleme resmiyle.

### 3. hafta — Kartlar ve koleksiyon
Yapılacaklar:
- Her beat bir kart olur; kapak resmi aynı yazıdan, kurallarla üretilir.
- Çift kartlar.
- Telefonda duran koleksiyon.
- Nadir yazışlar (çok uzun, yalnızca Türkçe harfli, tersinden aynı okunan)
  nadir sesleri açar.

Kapı yok.

### 4. hafta — 10-15 kişilik deneme
Bölüm 7'deki iki deneme yapılır.

**Kapı:** Bölüm 7'deki ölçütlere göre devam, düzelt ya da bırak.

### 5-6. hafta — Uygulamaya çevirme ve satış
Yapılacaklar:
- Web uygulamasını iPhone uygulamasına sarma.
- Video üretimi ve yerel paylaşım.
- Ses paketleri ve zil sesi satışı.
- Bulutta derleme hattı.
- Apple tarafı: anlaşmalar, banka ve vergi bilgileri, küçük geliştirici
  programı, gizlilik etiketi. Bunları ürün sahibi kendi hesabında yapar;
  adım adım tarif et.

### 7-8. hafta — Test sürümü ve App Store
Yapılacaklar:
- Test sürümü (TestFlight).
- App Store başvurusu. Bir iki ret turuna pay bırak.

Toplam tahmin: yaklaşık 8 hafta, 115-130 dolar (Apple hesabı zaten var; bu
tutar düşebilir).

---

## 7. Denemeler

Örneklem küçük. Sonuçlar yalnızca yön gösterir; pazar büyüklüğü çıkarılmaz.
Aşağıdaki eşikler öneridir; bu tür bir deneme için yayımlanmış bir ölçüt yok.

### Deneme 1 — Küçük değişiklik duyuluyor mu?
- Kişi ekrana bakmadan iki beat dinler ve sorulur: "Bunlar aynı mı, farklı mı?
  Farklıysa fark nerede?"
- Çiftler: aynı beat iki kez; "sjsjsj" ile "sjsjsjŞ"; boşluklu ve boşluksuz;
  büyük harfli ve küçük harfli.
- Ölçü: doğru cevap sayısı bölü toplam dinletilen çift sayısı.
- Şans eseri doğru cevap oranı yüzde 50.
- Devam: yüzde 80 ve üstü. Düzelt: yüzde 60-80. Kuralı bırak: yüzde 60 altı.

### Deneme 2 — Kendiliğinden paylaşan çıkıyor mu?
- Kimseye "arkadaşına gönder" denmez. Yalnızca bağlantı verilir.
- Ölçü A: kendiliğinden birine gönderenler bölü en az bir beat yapanlar.
- Ölçü B: kendi random'uyla cevap verenler bölü gönderilen bağlantıyı açanlar.
- Devam: A en az üçte bir ve B en az yarı.
- Düzelt: ikisinden biri tutuyor, diğeri tutmuyor.
- Bırak: kimse kendiliğinden göndermiyor ve B yüzde 20'nin altında.

### Fiyat denemesi
- Bir ses paketine ve zil sesine fiyat konur, gerçek ödeme alınmaz.
- Dokunana hemen "bu henüz hazır değil" denir ve isterse haber verilmesi için
  kayıt alınır. Para alınmaz.
- Ölçü: düğmeye dokunanlar bölü düğmeyi görenler. Eşiği denemeden önce belirle.

---

## 8. Gelir

- **Ses paketleri:** Halay, arabesk, düğün (davul zurna), eski oyun sesleri.
  Tek seferlik küçük ödeme. Fiyat tahmini 49-99 TL (varsayım; Apple 3 Aralık
  2026'da Türkiye fiyatlarını yeniden düzenliyor, başvuruda kontrol et).
- **Zil sesi:** Beat'i zil sesi olarak kaydetmek ücretli. Yeni iPhone sürümünde
  30 saniyeden kısa sesler doğrudan zil sesi yapılabiliyor.
- **Sonra:** Müzikle uğraşanlar için her sesi ayrı dosya olarak dışa aktarma.
- **Sonra, muhasebeciye sorulduktan sonra:** Çift kartın poster olarak baskısı.
  Apple bu tür fiziksel ürünlerde kendi ödeme sistemini istemiyor ve pay almıyor.

Bu tür uygulamalarda genelde kullanıcıların yüzde 2-3'ü bir şey satın alır
(genel tahmin). Gelir ancak çok kişi kullanırsa anlam kazanır.

---

## 9. Riskler

1. **WhatsApp'a video ve bağlantıyı birlikte göndermek.** Belgelenmemiş
   davranışa dayanıyor; arkadaş döngüsü buna bağlı. 2. haftada gerçek
   telefonda denenir.
2. **Beat'lerin birbirine benzemesi.** Bölüm 4.7.
3. **Bir kere oynanıp bırakılması.** Benzer oyuncaklar (Typedrummer, Ditty,
   MusicMessages) parladı ama kalıcı olamadı. Koleksiyon ve arkadaş cevabı
   bunu kırmak için var; kıracağının kanıtı yok.
4. **Apple'ın reddetmesi.** Bölüm 5.4.
5. **Kopyalanma.** Fikir tutarsa kolayca taklit edilir. Kopyalanması zor olan
   kısım sesin kalitesi ve beat'lerin çeşitliliği.

---

## 10. Rakipler

| Ürün | Ne yapıyor | Eksiği |
|---|---|---|
| Typedrummer (web, 2015) | Her harf bir davul sesi; bağlantıyla paylaşım | Cevap, harmanlama ve koleksiyon yok; hız ve takım hep aynı |
| Typatone (web ve iPhone) | Her harf bir nota | Ritim yok; yıllardır güncellenmemiş |
| MusicMessages (iMessage, 2016) | Arkadaşla sırayla katman ekleme | Yalnızca iMessage; yazıdan değil; terk edilmiş görünüyor |
| TinySong, TextTunes | Mesajdan yapay zekâyla şarkı | Beat değil sözlü şarkı; aylık ücretli |

En güçlü itiraz: "Bu, Typedrummer ile MusicMessages'ın birleşimi; ikisi de
bedava ve ikisi de büyüyemedi."

Bizi ayıran: girdinin kullanıcının zaten yazdığı kahkaha olması, WhatsApp ve
Android öncelikli olması, çift kart ve koleksiyon, beat'lerin gerçekten
birbirine benzememesi.

---

## 11. Ücretsiz büyüme

- Paylaşılan her videoda küçük bir imza ve kısa bağlantı bulunur.
- Yayılım dar bir çevreden başlatılır: tek bir arkadaş grubu, tek bir
  üniversite ya da tek bir mizah sayfası.
- Kısa video içerikleri: "Arkadaşımın gülüşü beat olsa" türünde.
- Koleksiyon paylaşmayı ödüllendirir: çift kart almak için birine göndermek
  gerekir.

---

## 12. Doğrulanmamış bilgiler

Araştırma sırasında birçok sayfa doğrudan açılamadı; bulguların çoğu arama
özetlerine dayanıyor. Hiçbir şey gerçek telefonda denenmedi. Kullanmadan önce
yeniden kontrol et:

- Apple ücretleri, Türkiye fiyat basamakları ve inceleme süreleri.
- Türkiye'de vergi kuralları (uygulama geliri kolaylığı, dijital hizmet vergisi,
  fiziksel ürün satışı). Muhasebeciye sorulmalı.
- WhatsApp'ın video ve bağlantı davranışı.
- Typedrummer'ın hâlâ çalışıp çalışmadığı.
- Ses kaynaklarının lisansları.
- Telefon hoparlörünün gerçek ses aralığı.

---

## 13. Kaynaklar

- Apple geliştirici programı: https://developer.apple.com/programs/enroll/
- App Store inceleme kuralları: https://developer.apple.com/app-store/review/guidelines/
- Küçük geliştirici programı: https://developer.apple.com/app-store/small-business-program/
- TestFlight: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview
- Codemagic fiyatları: https://docs.codemagic.io/billing/pricing/
- WhatsApp bağlantı önizlemeleri: https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/
- WhatsApp video biçimi: https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/video-messages
- Safari ses korumasının eklediği gürültü: https://9to5mac.com/2025/07/29/with-ios-26-safari-will-counter-one-of-the-webs-most-invasive-tracking-methods/
- iPhone sessiz düğmesi ve web sesi: https://bugs.webkit.org/show_bug.cgi?id=237322
- Eşit aralıklı ritimler (Toussaint): https://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf
- Ritim benzerliği ölçüleri (Toussaint): https://archives.ismir.net/ismir2004/paper/000134.pdf
- Orta düzey aksaklık ve hareket isteği (Witek 2014): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3989225/
- Salınım oranları: https://attackmagazine.com/features/interview/roger-linn-swing-groove-magic-mpc-timing/2
- Telefon hoparlöründe bas: https://blog.landr.com/make-bass-audible-phone-speakers
- Küçük hoparlörde karıştırma: https://www.waves.com/tips-for-great-mixes-on-small-speakers
- Kalın vuruş üretimi: https://www.soundonsound.com/techniques/practical-bass-drum-synthesis
- İki parçayı harmanlama (AutoMashUpper): https://staff.aist.go.jp/m.goto/PAPER/IEEETASLP201412davies.pdf
- Freesound lisansları: https://freesound.org/help/faq
- Serbest lisanslı ses kütüphanesi (VCSL): https://github.com/sgossner/VCSL
- Typedrummer: https://technical.ly/software-development/typedrummer-kyle-stetz/
- Typatone: https://jonofyi.substack.com/p/ten-years-of-typing-melodies
- MusicMessages: https://apps.apple.com/us/app/musicmessages/id1157850075
- Ditty'nin kapanışı: https://piunikaweb.com/2019/10/14/ditty-shutdown-export-dittys-says-team-zya
- Random atmak: https://www.webtekno.com/random-atmak-nedir-h117179.html
- WhatsApp'ın Türkiye'deki kullanımı: https://www.karar.com/teknoloji-haberleri/turkiyede-en-cok-kullanilan-uygulama-whatsapp-oldu-2063759
- Biyometrik veri rehberi: https://www.alomaliye.com/2021/09/16/biyometrik-verilerin-islenmesinde-dikkat-edilecek-hususlara-iliskin-rehber/
- Zil sesi özelliği: https://www.macrumors.com/2025/06/17/ios-26-use-as-ringtone-option/
- Elde tutma oranları: https://www.adjust.com/blog/what-makes-a-good-retention-rate/
- Sahte kapı denemesi: https://userpilot.com/blog/fake-door-testing/
