# Tur talimatları

Her turda jüri üyesi önceki turların puanlarını bilmez; kendi rolünün gözünden baştan düşünür.

## Tur 1 — Eleme (50 fikirden 20 yarı finalist)

Fikir dosyasındaki bütün fikirleri kendi rolünün gözünden puanla.

Çıktı (en fazla 120 kelime):
1. Tüm puanlar tek satırda, numara sırasıyla: `1:3, 2:5, 3:4, ...`
2. En yüksek puan verdiğin 3 fikir: numara, ad ve en fazla sekiz kelimelik neden.
3. Kendi rolünün gözünden kesinlikle elenmesi gereken 1 fikir ve en fazla sekiz kelimelik neden.

## Tur 2 — Yarı final (20 fikirden 5 finalist)

Dosyadaki 20 fikirden kendi rolünün gözünden tam 5 finalist seç ve sırala. Birbirine çok benzeyen
iki fikirden yalnızca daha güçlü olanı al.

Çıktı (en fazla 160 kelime):
1. Finalistler tek satırda, sıralı numaralar: `12 > 3 > 41 > 7 > 20`
2. Her finalist için tek cümle: kendi rolünün gözünden neden kaldı.
3. Elemekte en çok zorlandığın 1 fikir ve neden elendiği (tek cümle).
4. Finalistlerinde gördüğün ortak zayıflık varsa tek cümle.

## Tur 3 — Final (5 finalistten 1 kazanan)

Dosyadaki 5 finalisti kendi rolünün gözünden sırala ve tek kazanan seç. Dosyadaki doğrulama
notlarını (doğrulandı, çürütüldü, bulunamadı) dikkate al.

Çıktı (en fazla 180 kelime):
1. Sıralama tek satırda, harflerle: `C > A > B > E > D`
2. Puanlar tek satırda: `A:_, B:_, C:_, D:_, E:_` (beşine farklı puan ver)
3. KAZANAN: tek harf ve kendi rolünün gözünden iki cümle neden.
4. Kazananın kendi rolünün gözünden en ciddi zaafı (tek cümle).
5. Kazanan için "şunu görürsen bırak" dedirtecek tek somut işaret.
6. Dürüstlük notu (tek cümle): kazanan gerçekten yapılmaya değer mi, yoksa yalnızca en az kötüsü mü?

## Tur 4 — Ölçüt (yapılmaya değer bir fikirde ne olmalı?)

Bu turda fikir oylamıyorsun. Önceki turlarda hiçbir fikre 7 ve üstü verilmedi. Dosyadaki beş
finalisti ve doğrulama notlarını "neden olmadı" örneği olarak oku, sonra kendi rolünün gözünden şunu
cevapla: bir fikre 7 ve üstü ("kendi paramı ve üç ayımı yatırırdım") vermen için neyi görmen gerekir?

Çıktı (en fazla 170 kelime):
1. ŞARTLAR: Kendi rolünün gözünden 7 vermen için görmen gereken en fazla 3 somut şart. Her biri
   gözlenebilir ve ölçülebilir olsun ("talep olmalı" değil; neyi, nerede, kaç tane göreceksin).
2. EN UCUZ KANIT: Bu şartlardan en önemlisinin sağlandığını, kod yazmadan ve para harcamadan, bir
   haftada nasıl anlarsın?
3. BU GELİŞTİRİCİ İÇİN: Kadro dosyasındaki geliştirici tanımına bakarak, bu şartları sağlayan bir
   fikri en çok nerede arardın? (tek cümle)
4. YANILTICI İŞARET: İnsanların "değer" sandığı ama senin rolünün gözünden hiçbir şey kanıtlamayan
   bir işaret. (tek cümle)

## Tur 5 — Tek proje değerlendirmesi

Bu turda tek bir proje var ve iki ayrı soruya cevap veriyorsun. İkisini birbirine karıştırma:
(a) geliştiricinin kendi sorununu çözen, parasız ve yaklaşık dört haftalık bir deneme olarak ne kadar
mantıklı; (b) başkalarına satılan bir ürün olarak ne kadar umut verici. "Değişmeyen kurallar"daki
kanıt disiplini geçerli; ama (a) sorusunda risk yalnızca geliştiricinin birkaç haftası olduğu için
"varsayılan karar yapmaya değmez" kuralını (a) için uygulama, yalnızca (b) için uygula.

Çıktı (en fazla 190 kelime):
1. PUANLAR: `Kendisi için deneme: _/10` ve `Ürün olarak: _/10`, her birinin yanında tek cümle neden.
2. EN GÜÇLÜ 2 YAN (kendi rolünün gözünden, birer cümle).
3. EN ZAYIF 2 YAN (kendi rolünün gözünden, birer cümle).
4. İlk sürümde mutlaka olması gereken TEK şey.
5. İlk sürümde kesinlikle olmaması gereken TEK şey.
6. Geliştirici kendi üzerinde denerken "şunu görürsen bırak ya da değiştir" dedirtecek tek somut işaret.
7. Kendi rolünün gözünden cevaplanmamış en önemli soru.
