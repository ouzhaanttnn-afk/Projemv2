#!/usr/bin/env python3
"""projeler.md dosyasini uretir. VERI kismi dogrudan olculer.csv'den okunur."""
import csv, os, re

BURASI = os.path.dirname(os.path.abspath(__file__))
O = {r["kelime"]: r for r in csv.DictReader(open(os.path.join(BURASI, "olculer.csv")))}

# (arama, ad, ne yapar + kim oder, fiyat onerisi, en buyuk risk, zayif mi + neden)
P = [
 # A1 saglayan aramalar
 ("crochet patterns", "Tığ İşi Defteri", "Satır sayar, ilmekleri sevimli bir karakterle gösterir; düzenli örenler öder.",
  "abonelik; rakiplerin hepsi ücretsiz görünüyor.", "Bir yılda çıkan rakipler çok puan topladı.", ""),
 ("sewing patterns", "Dikiş Kalıbı Rafı", "Kalıp, kumaş ve ölçüleri tek rafta tutar; ev dikişçileri öder.",
  "abonelik; peşin ücretli örnek yok.", "Kalıp telifleri.", ""),
 ("sign language", "İşaret Dili Pratik Kartları", "Karakterli el çizimleriyle günlük işaret alıştırması; öğrenen yetişkinler öder.",
  "abonelik; peşin ücretli örnek yok.", "İçerik uzman ister.", ""),
 ("mahjong", "Mahjong Taş Öğretmeni", "Taşları resimli kartlarla öğretir, puan tutar; yeni başlayanlar öder.",
  "abonelik; peşin ücretli örnek yok.", "Kural kartı telifi belirsiz.", ""),
 # A3'un yalnizca eski yarisi
 ("symmetry drawing", "Ayna Çizim Defteri", "Simetrik desen ve mandala çizdiren iPad aracı; çizim meraklıları öder.",
  "4,99$, rakiplere yakın.", "Ücretliler on yıldan eski.", "x"),
 ("anatomy reference", "Çizer İçin Anatomi Kartları", "Sade kas ve oran kartları; sanat öğrencileri öder.",
  "14,99$, rakiplerin altı.", "Ücretliler tıp atlası, çizer değil.", "x"),
 ("manga drawing", "Manga Panel Taslakçısı", "Panel ızgarası ve yüz oranı rehberi; manga çizenler öder.",
  "9,99$, rakip aralığında.", "Ücretliler genel ve eski.", "x"),
 ("star map", "Gece Gökyüzü Defteri", "Gözlemleri takımyıldız çizimli günlüğe çevirir; amatör gözlemciler öder.",
  "4,99$.", "Ücretliler ucuz ve eski.", "x"),
 # zayif ama bir isaret var
 ("camera lucida", "Kopya Çizim Lambası", "Fotoğrafı kâğıda yansıtıp kopya çizdirir; çizim öğrenenler öder.",
  "9,99$, rakip aralığında.", "Ücretsizi çok.", "x"),
 ("metronome for drummers", "Davulcu Metronomu", "Titreşimli, hisli davul metronomu; davul öğrencileri öder.",
  "4,99$.", "Rakipler ucuz; 8$ şartı tutmaz.", "x"),
 ("dungeon master tools", "Anlatıcı Çantası", "Rol oyunu anlatıcısına harita ve sıra kartları; anlatıcılar öder.",
  "9,99$.", "Ücretli sonuçlar konu dışı oyunlar.", "x"),
 ("knitting", "Örgü Sayacı", "Sıra sayar, projeleri fotoğraflı rafa dizer; örenler öder.",
  "abonelik.", "Güçlü yeni rakipler var.", "x"),
 ("art reference organizer", "Referans Panosu", "Çizim referanslarını iPad'de panolara dizer; çizerler öder.",
  "9,99$.", "Talep küçük.", "x"),
 ("hand pose reference", "El Pozu Kütüphanesi", "Döndürülebilir el pozları sunar; çizerler öder.",
  "4,99$.", "Üç boyutlu model zahmetli.", "x"),
 ("gesture drawing timer", "Hızlı Eskiz Zamanlayıcısı", "Süreli poz serileri gösterir; çizim pratiği yapanlar öder.",
  "4,99$.", "Poz fotoğraflarının hakları.", "x"),
 ("habit tracker", "Alışkanlık Bahçesi", "Her alışkanlık bir bitki gibi büyür, ana ekranda görünür.",
  "abonelik.", "Çok kalabalık.", "x"),
 ("morse code trainer", "Mors Pratiği", "Sesli ve titreşimli günlük mors alıştırması; telsiz meraklıları öder.",
  "2,99$.", "Talep çok küçük.", "x"),
 ("birding checklist", "Kuş Gözlem Listesi", "Görülen kuşları çizimli kart koleksiyonuna çevirir; kuş gözlemcileri öder.",
  "9,99$, rakip aralığında.", "Tür verisi ve çizim yükü.", "x"),
 ("drum practice pad metronome", "Pad Pratik Programı", "Günlük davul alıştırma programı ve metronom; davulcular öder.",
  "9,99$, rakip üst sınırı.", "Yeni gelen yok.", "x"),
 ("practice timer", "Pratik Kum Saati", "Çalgı ve çizim pratiğini süre ve seri olarak tutar.",
  "7,99$, rakip alt sınırı.", "Arama genel.", "x"),
 ("note reading", "Nota Okuma Oyunu", "Nota okumayı kısa oyun turlarıyla öğretir; müzik öğrencileri öder.",
  "4,99$, rakip aralığında.", "Yeni gelen yok.", "x"),
 ("loop pedal", "Cep Döngü Pedalı", "Gitarcıya ses katmanı kaydettirir; müzisyenler öder.",
  "4,99$.", "Ses gecikmesi teknik olarak zor.", "x"),
 ("bird song", "Kuş Sesi Kartları", "Kuş seslerini çizimli kartlarla ezberletir; kuş gözlemcileri öder.",
  "4,99$.", "Ses kayıt hakları.", "x"),
 ("light meter", "Film Işık Ölçer", "Analog fotoğrafçıya pozlama önerir, çekim notu tutar.",
  "4,99$, rakip aralığında.", "Ölçüm cihaza göre değişir.", "x"),
 ("violin tuner", "Keman Akort ve Ton", "Keman öğrencisine akort ve uzun ton pratiği.",
  "6,99$, rakiple aynı.", "Ücretsiz akortlar çok.", "x"),
 ("ear training", "Kulak Eğitimi Kartları", "Günlük kısa aralık ve akor tanıma turları; müzik öğrencileri öder.",
  "abonelik.", "Ücretli örnek yok.", "x"),
 ("dice roller", "Zar Kutusu", "Fiziksel hisli zarlar ve zar setleri; masa oyuncuları öder.",
  "2,99$.", "Ödeme kanıtı yok.", "x"),
 ("aquarium log", "Akvaryum Defteri", "Su ölçümlerini ve balıkları sevimli tank çizimiyle tutar; akvaryumcular öder.",
  "9,99$, rakiple aynı.", "Talep küçük.", "x"),
 ("visual timer", "Görsel Zaman Çemberi", "Kalan süreyi renkli çemberle gösterir; ev ve sınıf kullanıcıları.",
  "2,99$.", "Ücretli örnek yok.", "x"),
 ("value study", "Ton Çalışması Aracı", "Fotoğrafı 3–5 tona indirir; ressamlar öder.",
  "4,99$.", "Talep çok küçük.", "x"),
 ("grid drawing method", "Izgara Çizim Aracı", "Fotoğrafa çizim ızgarası koyar; resim öğrencileri öder.",
  "2,99$.", "Ücretsizi bol.", "x"),
 ("comic maker", "Çizgi Roman Sayfası", "Hazır panel ve balonlarla kısa çizgi roman; hobi çizerleri öder.",
  "4,99$.", "Talep küçük.", "x"),
 ("music practice log", "Müzik Pratik Günlüğü", "Çalgı pratiğini gün gün işler, seri tutar; öğrenciler öder.",
  "abonelik.", "Talep küçük.", "x"),
 ("werewolf game", "Köy ve Kurt Anlatıcısı", "Herkes kendi telefonunda gizli rolünü görür; arkadaş grupları öder.",
  "2,99$.", "Arama oyunlarla karışık.", "x"),
 ("embroidery", "Nakış Deseni Defteri", "Fotoğrafı nakış desenine ve iplik listesine çevirir; nakışçılar öder.",
  "4,99$.", "Ücretli örnek yok.", "x"),
 ("bead patterns", "Boncuk Deseni Yapıcı", "Boncuk dizisi desenleri çizdirir; boncukçular öder.",
  "4,99$.", "Talep çok küçük.", "x"),
 ("cosplay", "Kostüm Projesi Defteri", "Kostüm parçalarını, malzemeleri ve tarihleri izler.",
  "4,99$.", "Sonuçlar karışık.", "x"),
 ("bubble level", "Karakterli Su Terazisi", "Kabarcığı canlı bir karakter olan su terazisi.",
  "1,99$.", "Ödeme kanıtı yok.", "x"),
 ("collection organizer", "Koleksiyon Rafı", "Her tür koleksiyonu fotoğraflı rafta sergiler; koleksiyoncular öder.",
  "abonelik.", "Arama çok genel.", "x"),
 ("color harmony", "Renk Uyumu Tekerleği", "Uyumlu renk grupları önerir; tasarımcılar öder.",
  "3,99$, rakiple aynı.", "Talep belirsiz.", "x"),
 ("color palette from photo", "Fotoğraftan Palet", "Fotoğraftan renk paleti çıkarıp saklar; çizerler öder.",
  "3,99$, rakiple aynı.", "Ücretsizi bol.", "x"),
 ("pose reference", "Poz Mankeni", "Döndürülebilir insan mankeniyle poz referansı; çizerler öder.",
  "4,99$.", "Üç boyutlu iş büyük.", "x"),
 ("fretboard", "Klavye Haritası", "Gitar klavyesinde nota ve gam ezberletir; gitar öğrencileri öder.",
  "9,99$, rakibin altı.", "Talep küçük.", "x"),
 ("chess clock", "Satranç Saati", "Dokunma hissi güçlü, şık satranç saati; kulüp oyuncuları.",
  "2,99$.", "Ücretsizi bol.", "x"),
 ("party games", "Parti Kartları", "Herkes kendi telefonundan katılır, sonuç paylaşılan resme döner.",
  "paket başına 2,99$.", "Yeni gelen yok.", "x"),
 ("woodworking plans", "Ahşap Proje Defteri", "Kesim listesi ve proje adımlarını çizimli tutar; ahşap hobicileri.",
  "4,99$.", "Talep küçük.", "x"),
 ("seamless pattern", "Tekrarlı Desen Atölyesi", "Kenarı birleşen desenler çizdirir; desen tasarımcıları öder.",
  "9,99$.", "Talep belirsiz.", "x"),
 ("pottery", "Seramik Fırın Defteri", "Sır denemelerini ve fırın kayıtlarını fotoğraflı tutar; seramikçiler.",
  "4,99$, rakiple aynı.", "Talep küçük.", "x"),
 ("beekeeping", "Arı Kovanı Defteri", "Kovan kontrollerini çizimli kartlarla tutar; arıcılar öder.",
  "9,99$, rakiple aynı.", "Talep çok küçük.", "x"),
 ("kalimba", "Kalimba Tab Defteri", "Kalimba için numaralı notalar ve pratik; yeni başlayanlar.",
  "2,99$.", "Talep çok küçük.", "x"),
]

def fiyat(r):
    f = r["ucretli_500_fiyat"]
    if not f:
        return "—"
    a, b = f.split("-")
    return f"${a}" if a == b else f"${a}–${b}"

def veri(k):
    r = O[k]
    a1 = int(r["yeni_12ay"]) >= 2
    a3 = int(r["a3_kati"]) >= 3
    v = (f'VERİ: arama "{k}"; ilk 10\'da son 12 ayda çıkan 100+ puanlı: {r["yeni_12ay"]}; '
         f'son 24 ayda: {r["yeni_24ay"]}; ilk 10\'da bir yıldır güncellenmeyen: {r["bayat"]}; '
         f'peşin ücretli 500+ puanlı: {r["ucretli_500"]} ({fiyat(r)}); birincinin puanı: {r["birinci_puan"]}; '
         f'büyük rakip: {"var" if int(r["dev"]) > 0 else "yok"}. Ölçüt: A1 {"✓" if a1 else "✗"}, A3 {"✓" if a3 else "✗"}.')
    return v, a1, a3

BAS = """# 50 proje adayı (App Store taraması, 22 Kasım 2026)

**Bu veri neyi gösterir, neyi göstermez.**
- Gösterir: Apple'ın herkese açık aramasında, ABD mağazasında, 413 arama kelimesi için ilk 20 sonucun çıkış tarihi, son güncelleme tarihi, peşin fiyatı ve puan sayısı.
- Göstermez: uygulama içi satın alma ve abonelik. "Ücretsiz" görünen birçok uygulama aslında abonelikle para kazanıyor olabilir; bunu bu veriden göremiyoruz.
- Göstermez: kaç kişinin bu kelimeyi aradığı. Puan sayısı talebin yalnızca kaba bir işaretidir.
- Bu servisin sıralaması mağazadaki gerçek arama sıralamasıyla birebir aynı olmayabilir.
- A1 = ilk 10'da son 12 ayda çıkmış, 100+ puanlı en az 2 uygulama. A3 = ilk 20'de son 24 ayda çıkmış, peşin ücretli, 500+ puanlı en az 3 uygulama (ölçütteki gibi). "Büyük şirkete ait değil" şartı bu veriden kontrol edilemedi.
- Sonuç: 413 aramanın hiçbiri A1 ve A3'ü birlikte sağlamadı. A3'ü sağlayan hiç arama yok; A1'i sağlayan 6 arama var (4 projeye birleştirildi). Kalan 46 madde zayıf adaydır.
- Fiyat önerileri veri değil, tahmindir; yanında piyasadaki ücretli rakiplerin fiyatı varsa yazılmıştır.

"""

def main():
    satirlar = [BAS]
    sorun = []
    for i, (k, ad, ne, fy, risk, zayif) in enumerate(P, 1):
        v, a1, a3 = veri(k)
        etiket = " *Zayıf aday:* A1 ve A3 sağlanmıyor." if zayif else ""
        p = f"{i}. **{ad}** — {ne} {v} Fiyat: {fy} Risk: {risk}{etiket}"
        govde = p
        kel = len(govde.split())
        if kel > 70:
            sorun.append((i, kel))
        satirlar.append(p + "\n")
    open(os.path.join(os.path.dirname(BURASI), "projeler.md"), "w").write("\n".join(satirlar))
    print("madde:", len(P), "70 kelimeyi asan:", sorun)
    print("tekrar eden arama:", [k for k in {x[0] for x in P} if [x[0] for x in P].count(k) > 1])

main()
