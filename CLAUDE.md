# Proje notları

## Çalışma kuralı (kullanıcı talimatı, kalıcı)

- **Fable sadece planlar; uygulamayı Opus yapar.** Fable kotayı hızlı tükettiği için kod yazma,
  dosya üretme, inceleme gibi uygulama işleri `model: "opus"` ile başlatılan alt ajanlara verilir.
  Ana oturum planı kurar, işi böler, sonucu kontrol eder ve kullanıcıya özetler.
- Kullanıcıyla her zaman Türkçe, kısa ve sade konuş. Kullanıcı kod okumuyor; teknik terim yerine
  ne olduğunu anlat.
- Ücretli reklam önerme; ücretsiz büyüme yolları öner.

## Durum: Föy rafa kaldırıldı

Kullanıcı Föy projesini bıraktı ("içim ısınmadı"); gerekçe: talep kanıtı zayıf, kitle dar, gelir
küçük. Çalışan ilk sürüm depoda duruyor ama üzerine yeni iş yapılmayacak. Sıradaki iş: kullanıcının
kendi bulgularından bağımsız, yeni ürün fikri araştırması. Araştırma için kullanıcının verdiği
Claude API anahtarı kullanılabilir; harcama sınırı toplam 20 dolar. Anahtar yalnızca güvenli form
üzerinden alınır, depoya ve sohbete asla yazılmaz.

## Fikir elemesi sonucu

Yaklaşık 100 fikir üç ayrı elemeden geçti. Son eleme (`juri/` klasörü): 50 fikir, 24 rollük jüri,
finalistlerin iddiaları internette doğrulandı.

- Kazanan: **Karakterli Akort Aleti** (gitar, ukulele, bağlama; tek seferlik ödeme). 24 oydan 12'si,
  ortalama 3,6/10. İkinci: Rol Yapma Oyunu Zarı (8 oy, 3,2/10).
- Jürinin ortak hükmü: hiçbir fikir "yapılmaya değer" çıkmadı; kazanan "en az kötüsü". Doğrulamada
  akort aletinin üç farkı da (bağlamada rakip az, ücretsiz iyi akort yok, karakterli akort yok)
  çürüdü.
- Eksik olan şey daha fazla jüri değil, gerçek kullanıcı kanıtı. Yapımdan önce önerilen ucuz
  kontroller: mağazadaki karakterli ve bağlama akort uygulamalarının puan sayılarına ve yorumlarına
  bakmak; karakterin kısa videolarını paylaşıp ilgiyi ölçmek.
- Kullanıcı henüz hangi fikirle devam edeceğine karar vermedi.

## Rafa kaldırılan ürün (geçici ad: "Föy")

Elinde fiziksel ürün olan ve bunu mimara, iç mimara, mağazaya ya da müşteriye göstermesi gereken
kişiler için telefon uygulaması: tasarımcılar, seramik atölyeleri, mobilya ve aydınlatma
üreticileri. Telefondaki fotoğraflardan birkaç dakikada temiz bir ürün föyü (tek ürün sayfası,
PDF) çıkarır.

Kullanıcı, kararı Claude'a bıraktı: "mantıklı buluyorsan sormadan araştır ve geliştir."

### İlk sürüm kararları (sekiz uzman değerlendirmesinden sonra)

- **Sadece telefon.** iPad ayrı akış değil; aynı uygulama büyük ekranda açılır.
- **Önce fayda:** İlk föy telefonda zaten duran fotoğraflardan çıkar. "Bunu neden seçtin?" notu
  isteğe bağlıdır ve föy hazırlanırken sorulur.
- **Serbest yerleşim yok.** Üç hazır föy kalıbı; kullanıcı metni ve sırayı değiştirir.
- **Bilgi uydurma yok.** Ölçü, malzeme, renk kullanıcıdan gelir. Eksik alan varsa uygulama sorar
  ya da o alanı föyde göstermez.
- **İlk sürümde yapay zekâ yok.** Her şey telefonda kalır; izin ekranı ve masraf gerekmez. Yapay
  zekâ (metni okuyucuya göre yazma) sonra eklenir ve bir sunucu gerektirir. API anahtarı asla
  depoya konmaz.
- Föyün altında küçük "… ile hazırlandı" imzası (ücretsiz tanıtım; ücretli sürümde kapatılabilir).
- Türkçe ve İngilizce.

Kapsam dışı: zihin haritası, araştırma aşaması, öğrenci akışı, jüri paftası, portfolyo, alıcının
cevap verdiği bağlantı, bulut eşitleme.

Gelir fikri (kesin değil): ilk föyler ücretsiz, sonra föy başına ödeme ya da küçük abonelik.

### Pazar notları

- Genel "katalog yapıcı" uygulamalar App Store'da kalabalık ve ucuz. Fark: tek ürün föyünün
  tasarım kalitesi ve doğrulanmış bilgi.
- İç mimarlar ürün föylerini kendileri hazırlıyor (Houzz Pro, Mydoma gibi araçlarla); üretici
  tarafında küçük işletmeye uygun araç az görünüyor.
- Uzman notları ortalama 5/10: sorun gerçek, kitle dar, gelir şimdilik yan gelir düzeyi.

### Teknik not

Uygulama Expo (React Native) ile yazılır; bu bulut ortamında Xcode yok, önizleme web üzerinden
alınır. Föy kalıpları HTML olarak tutulur ve PDF'e çevrilir.

## Kurulu ajanlar

`.claude/agents/` altında msitarzewski/agency-agents deposundan seçilmiş sekiz uzman rolü var
(ürün, kullanıcı araştırması, ekran yapısı, App Store görünürlüğü, büyüme, mobil geliştirme,
iş stratejisi, gerçeklik denetimi). Deponun tamamı (300'den fazla rol) bilerek kurulmadı; her
oturumda yüklenip kotayı tüketmesin diye.
