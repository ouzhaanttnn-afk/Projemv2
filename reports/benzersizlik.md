# Benzersizlik testi

Tarih: 2026-11-22 · Süre: 33 saniye

Benzerlik puanı 0 ile 1 arasında: 0 birebir aynı beat, 1 hiçbir ortak yanı yok.
Puan; hız, ölçü, tarz, ses takımı, ton, gam, davul vuruşlarının yerleri ve
melodi/bas notalarından hesaplanıyor (tools/similarity.ts).
**Eşik şimdilik 0,25.** Kulakla ayarlanacak (PLAN.md 4.7).

Gülüşler gerçek değil, gerçeğe benzetilerek üretildi (tools/corpus.ts). Bu bir
**varsayım**: gerçek random'larla tekrar çalıştırılmalı.

## Sonuç

| Şart | Sonuç | Değer |
|---|---|---|
| Hiçbir iki farklı yazı birebir aynı beat'i vermesin | GEÇTİ | 9991 yazıda 0 çakışma |
| Bağımsız çiftlerin binde birinden azı eşiğin altında | GEÇTİ | 31.990.119 çiftte 27 (0,001‰) |
| Tarzlar dengeli (hiçbiri payının 2 katını geçmesin, 0,4 katının altına düşmesin) | GEÇTİ | en çok 10,3%, en az 6,2% (eşit pay 8,3%) |

Aynı gülüşün farklı uzunlukları (örneğin `sjsjsj` ve `sjsjsjsj`) bağımsız
sayılmadı: bilerek birbirine benziyorlar. Bu türden 5881 çift var;
5586 tanesi eşiğin altında.

## Birbirine en çok benzeyen bağımsız çiftler

Bunlar dinleme sayfasında da var. "Aynı geliyor" dersen eşik yükselir.

| Gülüş A | Gülüş B | Puan |
|---|---|---|
| `JSJSJSJSJSJSJSŞ` | `jzşsjzşsjzşsjzşsş` | 0,19 |
| `JSJSJSJSJSJSJSIÇ` | `jzşsjzşsjzşsjzşsş` | 0,20 |
| `JSJSJS` | `jzşsjzşsjzşsjzşsş` | 0,21 |
| `qkeyöıaöucei` | `IJRHDİ` | 0,21 |
| `JSJSJSJSJSJSJS` | `jzşsjzşsjzşsjzşsş` | 0,21 |
| `zzzzzzzzü` | `FFFFFFFFÇ` | 0,22 |
| `ŞFŞFŞFŞFŞFŞFĞ` | `JAJAJAJAJAJAJAJAÇ` | 0,23 |
| `zzzzzzzzü` | `FFFFFFFÖ` | 0,23 |
| `fff` | `zzzı` | 0,24 |
| `zzzzzzzzü` | `fffffffğ` | 0,24 |
| `vbnm` | `fkdfkdfkdfkdfkdfkdfkd` | 0,24 |
| `dlxdjdrh` | `tkejdz` | 0,24 |

## Küçük değişiklikler

Tanınır kalması isteniyor (puan düşük), ama birebir aynı olmaması gerekiyor.

| Değişiklik | Ortanca puan | En yakın %10 | En uzak %10 | Birebir aynı |
|---|---|---|---|---|
| son harf ekle | 0,77 | 0,04 | 0,96 | 0 |
| bir harf değiştir | 0,80 | 0,47 | 0,95 | 0 |
| bir harfi büyüt | 0,03 | 0,01 | 0,05 | 4 |
| bir tekrar ekle | 0,79 | 0,05 | 0,96 | 1 |
| boşluk ekle | 0,81 | 0,62 | 0,96 | 0 |

| Çift | Puan |
|---|---|
| `sjsjsj` → `sjsjsjŞ` | 0,05 |
| `sjsjsj` → `SJSJSJ` | 0,19 |
| `sjsjsj` → `sjsjsjsjsjsj` | 0,06 |
| `sjsjsj` → `sjsj sjsj` | 0,45 |

Not: Uzun bir random'da tek harf değiştirmek ya da boşluk eklemek beat'in
kimliğini değiştirir; bu yüzden o satırlarda puan yüksek çıkıyor. Bu bilerek
seçildi: her random kendine özgü olsun. Kısa tekrarlı gülüşlerde ("sjsjsj")
son harf, büyük harf ve tekrar sayısı kimliği değiştirmez.

## Dağılım (8000 gerçekçi gülüş)

| Tarz | Pay |
|---|---|
| Türk aksağı 5/8 | 10,3% |
| Halay | 9,5% |
| Roman havası 9/8 | 9,3% |
| 6/8 sallantı | 8,8% |
| Aksak 7/8 | 8,8% |
| House | 8,4% |
| Dembow | 8,0% |
| Drum & bass | 8,0% |
| Boom-bap | 7,9% |
| Trap | 7,8% |
| Afro | 7,0% |
| Lo-fi | 6,2% |

| Ölçü (bir ölçüdeki adım) | Pay |
|---|---|
| 16 | 62,8% |
| 10 | 10,3% |
| 18 | 9,3% |
| 12 | 8,8% |
| 14 | 8,8% |

Hız (dakikadaki dörtlük, 10'a yuvarlanmış):
70: 2,1% · 80: 7,3% · 90: 11,9% · 100: 20,0% · 110: 23,8% · 120: 14,0% · 130: 5,4% · 140: 3,9% · 150: 3,1% · 160: 0,9% · 170: 5,3% · 180: 1,9% · 190: 0,4%

Benzerlik puanlarının dağılımı (bağımsız çiftler, kaba):
0,00–0,05: 0,0% · 0,05–0,10: 0,0% · 0,10–0,15: 0,0% · 0,15–0,20: 0,0% · 0,20–0,25: 0,0% · 0,25–0,30: 0,0% · 0,30–0,35: 0,1% · 0,35–0,40: 0,4% · 0,40–0,45: 1,4% · 0,45–0,50: 2,3% · 0,50–0,55: 2,0% · 0,55–0,60: 1,9% · 0,60–0,65: 2,2% · 0,65–0,70: 23,3% · 0,70–0,75: 22,3% · 0,75–0,80: 23,1% · 0,80–0,85: 21,1% · 0,85–0,90: 0,0% · 0,90–0,95: 0,0% · 0,95–1,00: 0,0%
