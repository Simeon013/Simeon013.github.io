"""Génère les vignettes de partage (Open Graph) : public/og-fr.png et public/og-en.png.

Relancer après un changement de nom, de rôle ou de couleurs :
    python scripts/og-image.py
Dépend de Pillow et des polices installées par npm (node_modules/@fontsource).
Le globe reprend la projection de src/scripts/globe.ts pour ressembler au site.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "node_modules" / "@fontsource"
W, H = 1200, 630
S = 2  # dessin en double résolution puis réduction : traits lissés

BLACK = (0, 0, 0)
GREEN = (30, 242, 160)
VIOLET = (114, 24, 250)
WHITE = (240, 255, 247)
MUTED = (143, 179, 162)
FAINT = (94, 127, 112)
LINE = (15, 59, 42)

TEXTS = {
    "fr": {
        "status": "Disponible pour de nouveaux projets",
        "role": "Mercenaire du développement",
        "line": "Web · Mobile · SaaS — Cotonou, Bénin",
    },
    "en": {
        "status": "Available for new projects",
        "role": "Mercenary of development",
        "line": "Web · Mobile · SaaS — Cotonou, Benin",
    },
}


def font(family: str, weight: int, size: int) -> ImageFont.FreeTypeFont:
    path = FONTS / family / "files" / f"{family}-latin-{weight}-normal.woff"
    return ImageFont.truetype(str(path), size * S)


def globe_segments(r, cx, cy, spin, tilt_deg=20, step=10):
    tilt = math.radians(tilt_deg)

    def project(lat, lon):
        la, lo = math.radians(lat), math.radians(lon + spin)
        x, y, z = math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)
        return (
            cx + r * x,
            cy - r * (y * math.cos(tilt) - z * math.sin(tilt)),
            y * math.sin(tilt) + z * math.cos(tilt),
        )

    front, back = [], []
    for lon in range(0, 360, 20):
        for lat in range(-90, 90, step):
            a, b = project(lat, lon), project(lat + step, lon)
            (front if a[2] + b[2] >= 0 else back).append((a[:2], b[:2]))
    for lat in range(-60, 61, 20):
        for lon in range(0, 360, step):
            a, b = project(lat, lon), project(lat, lon + step)
            (front if a[2] + b[2] >= 0 else back).append((a[:2], b[:2]))
    return front, back, project(6.37, 2.42)


def render(locale: str) -> Image.Image:
    t = TEXTS[locale]
    img = Image.new("RGB", (W * S, H * S), BLACK)
    d = ImageDraw.Draw(img)

    # Lignes de balayage sous le dessin : par-dessus, elles hachaient le globe en pointillés.
    for y in range(0, H * S, 4 * S):
        d.line([(0, y), (W * S, y)], fill=(4, 8, 6), width=1)

    # Globe à droite, légèrement coupé par le bord : une signature, pas le sujet.
    cx, cy, r = 935 * S, 315 * S, 240 * S
    front, back, origin = globe_segments(r, cx, cy, spin=-8)
    for a, b in back:
        d.line([a, b], fill=(6, 40, 27), width=1 * S)
    for a, b in front:
        d.line([a, b], fill=GREEN, width=int(1.4 * S))

    # Deux bandes glitch décalées sur le globe, comme sur le site.
    for y0, h, dx, color in [(205, 26, -34, VIOLET), (402, 12, 22, WHITE)]:
        band = img.crop((0, y0 * S, W * S, (y0 + h) * S))
        d.rectangle([0, y0 * S, W * S, (y0 + h) * S], fill=BLACK)
        tint = Image.new("RGB", band.size, color)
        mask = band.convert("L").point(lambda v: 255 if v > 40 else 0)
        img.paste(tint, (dx * S, y0 * S), mask)

    # Cotonou et ses ondes.
    ox, oy, oz = origin
    if oz > 0:
        d.ellipse([ox - 7 * S, oy - 7 * S, ox + 7 * S, oy + 7 * S], fill=GREEN)
        for k, rr in enumerate((26, 52, 80)):
            c = tuple(int(v * (1 - k * 0.3)) for v in GREEN)
            d.ellipse([ox - rr * S, oy - rr * S, ox + rr * S, oy + rr * S], outline=c, width=2 * S)

    left = 72 * S
    # Badge de disponibilité.
    f_small = font("ibm-plex-mono", 400, 22)
    status_w = d.textlength(t["status"], font=f_small)
    d.rectangle([left, 92 * S, left + status_w + 58 * S, 136 * S], outline=LINE, width=2 * S, fill=BLACK)
    d.ellipse([left + 18 * S, 108 * S, left + 30 * S, 120 * S], fill=GREEN)
    d.text((left + 42 * S, 114 * S), t["status"], font=f_small, fill=GREEN, anchor="lm")

    # Nom.
    f_name = font("chakra-petch", 600, 96)
    d.text((left, 190 * S), "Siméon", font=f_name, fill=WHITE)
    d.text((left, 285 * S), "Daouda", font=f_name, fill=WHITE)

    # Rôle, avec le dédoublement vert / violet du glitch.
    f_role = font("chakra-petch", 500, 42)
    y_role = 408 * S
    d.text((left - 2 * S, y_role), t["role"], font=f_role, fill=VIOLET)
    d.text((left, y_role), t["role"], font=f_role, fill=GREEN)

    d.text((left, 482 * S), t["line"], font=f_small, fill=MUTED)

    # Pied : adresse du site et signature du footer.
    d.line([(left, 548 * S), ((W - 72) * S, 548 * S)], fill=LINE, width=2 * S)
    f_foot = font("ibm-plex-mono", 400, 20)
    d.text((left, 580 * S), "simeon013.github.io", font=f_foot, fill=GREEN, anchor="lm")
    d.text(((W - 72) * S, 580 * S), "</SD>", font=f_foot, fill=FAINT, anchor="rm")

    return img.resize((W, H), Image.LANCZOS)


if __name__ == "__main__":
    for loc in TEXTS:
        out = ROOT / "public" / f"og-{loc}.png"
        # 128 couleurs suffisent à ce visuel sombre : le fichier pèse trois fois moins.
        render(loc).quantize(128, dither=Image.Dither.NONE).save(out, optimize=True)
        print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} Ko")
