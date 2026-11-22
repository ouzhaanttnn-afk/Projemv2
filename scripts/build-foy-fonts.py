"""Föy kalıplarına gömülen yazı tiplerini üretir.

Newsreader ve IBM Plex Sans (ikisi de SIL Open Font License) dosyalarını
Latin + Türkçe karakterlere indirger, WOFF2'ye çevirir ve
src/foy/fonts.generated.ts içine base64 olarak yazar.

Gerekli: pip install fonttools brotli
Çalıştırma: python3 scripts/build-foy-fonts.py
"""
import base64, io, os
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NM = os.path.join(ROOT, "node_modules", "@expo-google-fonts")
FONTS = [
    ("serifRegular", "newsreader/400Regular/Newsreader_400Regular.ttf"),
    ("serifItalic", "newsreader/400Regular_Italic/Newsreader_400Regular_Italic.ttf"),
    ("sansRegular", "ibm-plex-sans/400Regular/IBMPlexSans_400Regular.ttf"),
    ("sansMedium", "ibm-plex-sans/500Medium/IBMPlexSans_500Medium.ttf"),
]
UNICODES = "U+0020-007E,U+00A0-017F,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+20AC,U+20BA,U+2116,U+2122,U+2212,U+00D7"

out = ["// Bu dosya scripts/build-foy-fonts.py ile üretildi. Elle düzenlemeyin.",
       "// Yazı tipleri: Newsreader, IBM Plex Sans — SIL Open Font License 1.1.", ""]
for name, rel in FONTS:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = TTFont(os.path.join(NM, rel))
    s = subset.Subsetter(options=opts)
    s.populate(unicodes=subset.parse_unicodes(UNICODES))
    s.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    print(name, len(buf.getvalue()), "bytes")
    out.append(f"export const {name} = '{b64}';")
with open(os.path.join(ROOT, "src", "foy", "fonts.generated.ts"), "w") as f:
    f.write("\n".join(out) + "\n")
