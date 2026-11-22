#!/usr/bin/env python3
"""App Store arama taramasi. Yalnizca Python standart kitapligi.

Kullanim: python3 tara.py
- kelimeler.txt okunur (# ile baslayan satirlar bolum basligidir)
- her kelime icin itunes.apple.com/search cagrilir, cevap onbellek/ klasorune yazilir
- ham.jsonl (her kelime icin ilk 20 sonuc) ve olculer.csv uretilir
"""
import csv, json, os, re, statistics, sys, time, hashlib
import urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone, timedelta

BURASI = os.path.dirname(os.path.abspath(__file__))
ONBELLEK = os.path.join(BURASI, "onbellek")
BUGUN = datetime(2026, 11, 22, tzinfo=timezone.utc)
BEKLEME = 3.3
MAKS_DENEME = 4

os.makedirs(ONBELLEK, exist_ok=True)


def tarih(s):
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def ay_once(n):
    return BUGUN - timedelta(days=round(n * 30.4375))


def onbellek_yolu(kelime):
    ad = re.sub(r"[^a-z0-9]+", "_", kelime.lower()).strip("_")
    h = hashlib.md5(kelime.encode()).hexdigest()[:6]
    return os.path.join(ONBELLEK, f"{ad}_{h}.json")


_son_istek = [0.0]


def getir(kelime):
    yol = onbellek_yolu(kelime)
    if os.path.exists(yol):
        with open(yol) as f:
            return json.load(f), True
    url = "https://itunes.apple.com/search?" + urllib.parse.urlencode(
        {"term": kelime, "entity": "software", "country": "us", "limit": 25})
    for deneme in range(1, MAKS_DENEME + 1):
        bekle = BEKLEME - (time.time() - _son_istek[0])
        if bekle > 0:
            time.sleep(bekle)
        _son_istek[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (tarama)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                veri = json.loads(r.read().decode("utf-8"))
            if "results" not in veri:
                raise ValueError("results yok")
            with open(yol, "w") as f:
                json.dump(veri, f)
            return veri, False
        except Exception as e:  # 403, 429, zaman asimi vb.
            print(f"  ! hata ({kelime}) deneme {deneme}: {e}", flush=True)
            if deneme < MAKS_DENEME:
                time.sleep(60)
    return None, False


DURAK = {"for", "and", "the", "app", "of", "a", "to", "from", "with", "my", "maker", "tracker",
         "log", "timer", "practice", "game", "games", "tools", "trainer", "counter", "score",
         "generator", "organizer", "collection", "widget", "widgets", "reminder", "routine",
         "checklist", "planner", "journal", "editor", "reader", "calculator", "converter"}


def kok(k):
    k = k.lower()
    for son in ("ing", "ers", "er", "es", "s"):
        if k.endswith(son) and len(k) - len(son) >= 4:
            return k[: -len(son)]
    return k


def ilgisiz_orani(kelime, ilk10):
    """Adinda ya da turunde kelimenin anlamli parcalarindan hicbiri gecmeyen sonuclarin orani."""
    parcalar = [kok(p) for p in re.findall(r"[a-z0-9]+", kelime.lower())
                if p not in DURAK and len(p) >= 3]
    if not parcalar:
        return ""
    sayi = 0
    for a in ilk10:
        metin = (a.get("trackName", "") + " " + a.get("primaryGenreName", "")).lower()
        if not any(p in metin for p in parcalar):
            sayi += 1
    return round(sayi / len(ilk10), 2) if ilk10 else ""


def olc(kelime, sonuc):
    ilk20 = sonuc[:20]
    ilk10 = sonuc[:10]
    t12, t24, t36 = ay_once(12), ay_once(24), ay_once(36)

    def puan(a):
        return a.get("userRatingCount") or 0

    def cikis(a):
        return tarih(a.get("releaseDate"))

    def surum(a):
        return tarih(a.get("currentVersionReleaseDate"))

    yeni12 = [a for a in ilk10 if cikis(a) and cikis(a) >= t12 and puan(a) >= 100]
    yeni24 = [a for a in ilk10 if cikis(a) and cikis(a) >= t24 and puan(a) >= 100]
    bayat = [a for a in ilk10 if surum(a) and surum(a) < t12]
    ucretli500 = [a for a in ilk20 if (a.get("price") or 0) > 0 and puan(a) >= 500]
    ucretli_yeni = [a for a in ilk20 if (a.get("price") or 0) > 0 and cikis(a)
                    and cikis(a) >= t36 and puan(a) >= 100]
    # olcut A3'un harfi harfine hali: ucretli, son 24 ayda cikmis, 500+ puan
    a3_kati = [a for a in ilk20 if (a.get("price") or 0) > 0 and cikis(a)
               and cikis(a) >= t24 and puan(a) >= 500]
    ucretli_hepsi = [a for a in ilk20 if (a.get("price") or 0) > 0]
    puanlar10 = [puan(a) for a in ilk10]
    fiyatlar = sorted(a.get("price") for a in ucretli500)
    dev = sum(1 for a in sonuc[:3] if puan(a) > 50000)

    def ozet(liste):
        return " | ".join(f"{a.get('trackName','')[:40]} ({puan(a)}, {a.get('formattedPrice','')}, "
                          f"{(a.get('releaseDate') or '')[:10]})" for a in liste)

    return {
        "kelime": kelime,
        "sonuc_sayisi": len(sonuc),
        "yeni_12ay": len(yeni12),
        "yeni_24ay": len(yeni24),
        "bayat": len(bayat),
        "ucretli_500": len(ucretli500),
        "ucretli_500_fiyat": (f"{fiyatlar[0]:.2f}-{fiyatlar[-1]:.2f}" if fiyatlar else ""),
        "ucretli_yeni": len(ucretli_yeni),
        "a3_kati": len(a3_kati),
        "ucretli_ilk20": len(ucretli_hepsi),
        "talep_toplam": sum(puanlar10),
        "talep_ortanca": (int(statistics.median(puanlar10)) if puanlar10 else 0),
        "birinci_puan": (puan(sonuc[0]) if sonuc else 0),
        "birinci_ad": (sonuc[0].get("trackName", "") if sonuc else ""),
        "dev": dev,
        "ilgisiz": ilgisiz_orani(kelime, ilk10),
        "yeni_12ay_uygulamalar": ozet(yeni12),
        "ucretli_500_uygulamalar": ozet(ucretli500),
    }


def main():
    kelimeler = []
    bolum = ""
    with open(os.path.join(BURASI, "kelimeler.txt")) as f:
        for satir in f:
            satir = satir.strip()
            if not satir:
                continue
            if satir.startswith("#"):
                bolum = satir.lstrip("# ").strip()
                continue
            if satir not in [k for k, _ in kelimeler]:
                kelimeler.append((satir, bolum))

    olculer, basarisiz = [], []
    with open(os.path.join(BURASI, "ham.jsonl"), "w") as ham:
        for i, (k, bolum) in enumerate(kelimeler, 1):
            veri, onbellekten = getir(k)
            if veri is None:
                basarisiz.append(k)
                print(f"[{i}/{len(kelimeler)}] BASARISIZ {k}", flush=True)
                continue
            sonuc = veri.get("results", [])
            alanlar = ["trackName", "price", "formattedPrice", "userRatingCount",
                       "averageUserRating", "releaseDate", "currentVersionReleaseDate",
                       "sellerName", "artistId", "primaryGenreName", "trackViewUrl"]
            for sira, a in enumerate(sonuc[:20], 1):
                kayit = {"kelime": k, "sira": sira}
                kayit.update({x: a.get(x) for x in alanlar})
                ham.write(json.dumps(kayit, ensure_ascii=False) + "\n")
            o = olc(k, sonuc)
            o["bolum"] = bolum
            olculer.append(o)
            print(f"[{i}/{len(kelimeler)}] {'(onbellek) ' if onbellekten else ''}{k}: "
                  f"y12={o['yeni_12ay']} u500={o['ucretli_500']} a3k={o['a3_kati']}", flush=True)

    sutunlar = ["kelime", "bolum", "sonuc_sayisi", "yeni_12ay", "yeni_24ay", "bayat", "ucretli_500",
                "ucretli_500_fiyat", "ucretli_yeni", "a3_kati", "ucretli_ilk20", "talep_toplam",
                "talep_ortanca", "birinci_puan", "birinci_ad", "dev", "ilgisiz",
                "yeni_12ay_uygulamalar", "ucretli_500_uygulamalar"]
    with open(os.path.join(BURASI, "olculer.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=sutunlar)
        w.writeheader()
        for o in olculer:
            w.writerow({s: o.get(s, "") for s in sutunlar})
    with open(os.path.join(BURASI, "basarisiz.txt"), "w") as f:
        f.write("\n".join(basarisiz) + ("\n" if basarisiz else ""))
    print(f"BITTI: {len(olculer)} basarili, {len(basarisiz)} basarisiz", flush=True)


if __name__ == "__main__":
    main()
