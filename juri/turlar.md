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
