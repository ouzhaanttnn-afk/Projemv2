// Randombeat on Cloudflare: serves the static site and keeps an anonymous
// event counter for the week-4 test (PLAN.md section 7).
//
// Privacy: only an event name, the day and a random per-browser number are
// stored. Typed laughs, names, IP addresses or anything else are never stored.

import { DurableObject } from "cloudflare:workers";

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  SAYAC: DurableObjectNamespace<Sayac>;
}

// events the page may send; anything else is ignored
const EVENTS = new Set([
  "yeni_dogrudan", // first visit on this phone, not from a link
  "yeni_baglanti", // first visit on this phone, from a friend's link
  "yap", // played a laugh they typed
  "gonder", // tapped "Arkadaşına gönder"
  "video", // made a video
  "acildi", // opened a laugh sent to them
  "dinledi", // played the laugh sent to them
  "cevap", // sent their reply back
  "harman_acildi", // opened a duet link
  "koleksiyon", // opened the collection
  "paket_gor", "paket_tik", // fake door: sound pack
  "zil_gor", "zil_tik", // fake door: ringtone
]);
const D1 = /^d1_(ayni|sonharf|buyuk|bosluk|uzun)_(dogru|yanlis)$/;
const DEVICE = /^[a-z0-9-]{8,40}$/;

export class Sayac extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS olay (gun TEXT NOT NULL, ad TEXT NOT NULL, cihaz TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (gun, ad, cihaz))",
    );
  }
  kaydet(ad: string, cihaz: string) {
    const gun = new Date().toISOString().slice(0, 10);
    this.ctx.storage.sql.exec(
      "INSERT INTO olay (gun, ad, cihaz, n) VALUES (?, ?, ?, 1) ON CONFLICT (gun, ad, cihaz) DO UPDATE SET n = n + 1",
      gun,
      ad,
      cihaz,
    );
  }
  satirlar(baslangic: string) {
    return this.ctx.storage.sql
      .exec("SELECT ad, cihaz, SUM(n) AS n FROM olay WHERE gun >= ? GROUP BY ad, cihaz", baslangic)
      .toArray() as { ad: string; cihaz: string; n: number }[];
  }
}

function stub(env: Env) {
  return env.SAYAC.get(env.SAYAC.idFromName("randombeat"));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/olay") {
      if (req.method !== "POST") return new Response(null, { status: 405 });
      try {
        const body = (await req.json()) as { e?: string; d?: string };
        const e = String(body.e ?? "");
        const d = String(body.d ?? "");
        if ((EVENTS.has(e) || D1.test(e)) && DEVICE.test(d)) await stub(env).kaydet(e, d);
      } catch {
        // a broken event is simply dropped
      }
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    if (url.pathname === "/sayac") {
      const baslangic = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("baslangic") ?? "")
        ? url.searchParams.get("baslangic")!
        : "2000-01-01";
      const rows = await stub(env).satirlar(baslangic);
      return new Response(report(rows, baslangic), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return env.ASSETS.fetch(req);
  },
};

// ---------------------------------------------------------------- report

function report(rows: { ad: string; cihaz: string; n: number }[], baslangic: string): string {
  const devices = new Map<string, Set<string>>();
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!devices.has(r.ad)) devices.set(r.ad, new Set());
    devices.get(r.ad)!.add(r.cihaz);
    totals.set(r.ad, (totals.get(r.ad) ?? 0) + Number(r.n));
  }
  const dev = (ad: string) => devices.get(ad) ?? new Set<string>();
  const both = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x)).length;
  const union = (...sets: Set<string>[]) => new Set(sets.flatMap((s) => [...s]));
  const all = union(...devices.values());
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");
  const ratio = (a: number, b: number) => `${a} / ${b} (${pct(a, b)})`;

  const makers = dev("yap");
  const senders = union(dev("gonder"), dev("video"));
  const opened = dev("acildi");
  const replied = dev("cevap");
  const A = both(makers, senders);
  const B = both(opened, replied);
  const verdict = (ok: boolean, fix: boolean) => (ok ? "Devam" : fix ? "Düzelt" : "Bırak");
  const aOk = makers.size > 0 && A / makers.size >= 1 / 3;
  const bOk = opened.size > 0 && B / opened.size >= 0.5;
  const bLow = opened.size > 0 && B / opened.size < 0.2;
  const deneme2 = makers.size && opened.size ? verdict(aOk && bOk, (aOk || bOk) && !(A === 0 && bLow)) : "Henüz veri yok";

  const d1Types = ["ayni", "sonharf", "buyuk", "bosluk", "uzun"];
  const d1Names: Record<string, string> = {
    ayni: "Aynı beat iki kez",
    sonharf: "Sona harf (sjsjsj / sjsjsjŞ)",
    buyuk: "Büyük / küçük harf",
    bosluk: "Boşluklu / boşluksuz",
    uzun: "Kısa / uzun gülüş",
  };
  let d1Right = 0;
  let d1All = 0;
  const d1Rows = d1Types
    .map((t) => {
      const r = totals.get(`d1_${t}_dogru`) ?? 0;
      const w = totals.get(`d1_${t}_yanlis`) ?? 0;
      d1Right += r;
      d1All += r + w;
      return `<tr><td>${d1Names[t]}</td><td>${ratio(r, r + w)}</td></tr>`;
    })
    .join("");
  const d1Share = d1All ? d1Right / d1All : 0;
  const deneme1 = d1All ? (d1Share >= 0.8 ? "Devam" : d1Share >= 0.6 ? "Düzelt" : "Kuralı bırak") : "Henüz veri yok";

  const rowsHtml = [...EVENTS]
    .map((e) => `<tr><td>${e}</td><td>${dev(e).size}</td><td>${totals.get(e) ?? 0}</td></tr>`)
    .join("");

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Randombeat sayaç</title><style>
:root{--bg:#f3f5f9;--fg:#161b2e;--mut:#5a6377;--line:#dbe0ea;--card:#fff;--acc:#a86c06}
@media (prefers-color-scheme:dark){:root{--bg:#0e1220;--fg:#e8ecf5;--mut:#9aa3b8;--line:#2a3146;--card:#161b2b;--acc:#e5a93a}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:20px max(16px,env(safe-area-inset-left))}
main{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:18px}h1{margin:0;font-size:1.5rem}h2{margin:0;font-size:1.1rem}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px}
.v{font-weight:700;color:var(--acc)}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}td{padding:5px 0;border-top:1px solid var(--line)}td+td{text-align:right}
.m{color:var(--mut);font-size:.85rem}</style></head><body><main>
<h1>Randombeat sayaç</h1>
<p class="m">${baslangic === "2000-01-01" ? "Bütün zamanlar." : `${baslangic} ve sonrası.`} Belli bir günden saymak için adrese <code>?baslangic=2026-12-01</code> ekle. Sayılar telefon başına; gülüşler ve kişiler kaydedilmez. Toplam ${all.size} telefon.</p>
<div class="box"><h2>Deneme 2: kendiliğinden paylaşım ve cevap</h2>
<table><tr><td>A: beat yapanlardan gönderen</td><td>${ratio(A, makers.size)}</td></tr>
<tr><td>B: gelen bağlantıyı açanlardan cevap veren</td><td>${ratio(B, opened.size)}</td></tr>
<tr><td>Bağlantıyla gelen yeni telefon</td><td>${dev("yeni_baglanti").size}</td></tr>
<tr><td>Doğrudan gelen yeni telefon</td><td>${dev("yeni_dogrudan").size}</td></tr></table>
<p>Karar (önceden seçilen ölçüt): <span class="v">${deneme2}</span></p>
<p class="m">Devam: A en az üçte bir ve B en az yarı. Düzelt: biri tutuyor, diğeri tutmuyor. Bırak: kimse kendiliğinden göndermiyor ve B %20'nin altında.</p></div>
<div class="box"><h2>Deneme 1: küçük değişiklik duyuluyor mu?</h2>
<table>${d1Rows}<tr><td><b>Toplam</b></td><td><b>${ratio(d1Right, d1All)}</b></td></tr></table>
<p>Karar: <span class="v">${deneme1}</span></p>
<p class="m">Şans eseri doğru oranı %50. Devam: %80 ve üstü. Düzelt: %60-80. Kuralı bırak: %60 altı.</p></div>
<div class="box"><h2>Fiyat denemesi (ödeme alınmadı)</h2>
<table><tr><td>Ses paketi: görenlerden dokunan</td><td>${ratio(both(dev("paket_gor"), dev("paket_tik")), dev("paket_gor").size)}</td></tr>
<tr><td>Zil sesi: görenlerden dokunan</td><td>${ratio(both(dev("zil_gor"), dev("zil_tik")), dev("zil_gor").size)}</td></tr></table></div>
<div class="box"><h2>Bütün olaylar</h2><table><tr><td class="m">olay</td><td class="m">telefon</td><td class="m">toplam</td></tr>${rowsHtml}</table></div>
</main></body></html>`;
}
