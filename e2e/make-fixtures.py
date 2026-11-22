"""Uçtan uca deneme için basit örnek ürün görselleri üretir (telifsiz, tamamen çizim).
Çalıştırma: python3 e2e/make-fixtures.py  (Pillow gerekir)
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

def backdrop(w, h, wall=(226, 219, 207), floor=(204, 195, 181), horizon=0.68):
    im = Image.new("RGB", (w, h))
    px = im.load()
    hy = int(h * horizon)
    for y in range(h):
        if y < hy:
            t = y / hy
            c = tuple(int(wall[i] * (1.02 - 0.06 * t)) for i in range(3))
        else:
            t = (y - hy) / (h - hy)
            c = tuple(int(floor[i] * (1.0 - 0.10 * t)) for i in range(3))
        for x in range(w):
            v = 1 - 0.05 * abs(x / w - 0.5)
            px[x, y] = tuple(min(255, int(ch * v)) for ch in c)
    return im, hy

def vase(draw_im, cx, base_y, height, width, color, neck=0.38):
    w, h = draw_im.size
    # gölge
    sh = Image.new("L", (w, h), 0)
    ImageDraw.Draw(sh).ellipse([cx - width * 0.75, base_y - 18, cx + width * 0.75, base_y + 22], fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    draw_im.paste(Image.new("RGB", (w, h), (90, 80, 70)), (0, 0), sh)
    # gövde profili
    pts_l, pts_r = [], []
    for i in range(101):
        t = i / 100
        y = base_y - t * height
        r = width / 2 * (0.62 + 0.42 * math.sin(math.pi * min(1, t * 1.25)) ) * (1 - 0.55 * max(0, t - 0.72) / 0.28 * (1 - neck))
        pts_l.append((cx - r, y)); pts_r.append((cx + r, y))
    body = Image.new("L", (w, h), 0)
    ImageDraw.Draw(body).polygon(pts_l + pts_r[::-1], fill=255)
    # yatay ışık geçişi
    shade = Image.new("RGB", (w, h))
    sp = shade.load()
    x0, x1 = int(cx - width), int(cx + width)
    for x in range(max(0, x0), min(w, x1)):
        t = (x - (cx - width / 2)) / width
        k = 0.72 + 0.42 * math.exp(-((t - 0.34) ** 2) / 0.05) - 0.25 * max(0, t - 0.6)
        col = tuple(max(0, min(255, int(c * k))) for c in color)
        for y in range(int(base_y - height - 5), int(base_y + 2)):
            if 0 <= y < h:
                sp[x, y] = col
    draw_im.paste(shade, (0, 0), body)
    # ağız
    top = pts_l[-1][1]
    rr = pts_r[-1][0] - cx
    ImageDraw.Draw(draw_im).ellipse([cx - rr, top - rr * 0.18, cx + rr, top + rr * 0.18], fill=tuple(int(c * 0.45) for c in color))

def speckle(im, n, col, size=(1, 3), alpha=90):
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    w, h = im.size
    for _ in range(n):
        x, y, s = random.randint(0, w), random.randint(0, h), random.uniform(*size)
        d.ellipse([x - s, y - s, x + s, y + s], fill=col + (alpha,))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def save(im, name):
    im.save(os.path.join(OUT, name), quality=88)
    print(name, im.size)

# 1 — tek vazo, dikey
im, hy = backdrop(1200, 1500)
vase(im, 600, int(1500 * 0.80), 720, 420, (170, 92, 62))
save(speckle(im, 1500, (60, 40, 30), alpha=40), "01-vazo.jpg")

# 2 — üç vazo
im, hy = backdrop(1500, 1100, wall=(220, 214, 204))
vase(im, 420, 880, 420, 260, (120, 118, 110))
vase(im, 760, 900, 600, 330, (170, 92, 62))
vase(im, 1110, 890, 330, 240, (196, 180, 152))
save(im, "02-uclu.jpg")

# 3 — yüzey yakın çekim
im = Image.new("RGB", (1200, 1200), (164, 90, 60))
d = ImageDraw.Draw(im)
for y in range(0, 1200, 9):
    k = 0.9 + 0.1 * math.sin(y / 23)
    d.line([(0, y), (1200, y + 20 * math.sin(y / 90))], fill=(int(164 * k), int(90 * k), int(60 * k)), width=6)
im = im.filter(ImageFilter.GaussianBlur(2))
save(speckle(im, 5000, (70, 40, 25), (1, 2.5), 110), "03-yuzey.jpg")

# 4–6 — sır örnekleri
for name, base, spk in [("04-sir-fume.jpg", (78, 84, 90), (20, 20, 24)),
                        ("05-sir-kum.jpg", (214, 200, 176), (120, 100, 80)),
                        ("06-sir-yosun.jpg", (106, 118, 88), (40, 50, 30))]:
    im, hy = backdrop(1000, 1000, wall=(228, 222, 212), floor=(210, 202, 190), horizon=0.72)
    vase(im, 500, 820, 560, 380, base, neck=0.6)
    save(speckle(im, 900, spk, alpha=50), name)
