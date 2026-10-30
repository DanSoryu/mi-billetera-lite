"""Genera los íconos PNG del manifest con el mismo diseño del SVG."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SCALE = 4


def point(value):
    return value * SCALE


def box(coords):
    return tuple(point(value) for value in coords)


image = Image.new("RGB", (point(512), point(512)), "#172b4d")
draw = ImageDraw.Draw(image)
draw.rounded_rectangle(box((104, 158, 408, 374)), radius=point(44), fill="white")
draw.line([box((104, 210))[:2], box((104, 180))[:2], box((118, 147))[:2], box((151, 133))[:2], box((353, 133))[:2]], fill="#b4c8e3", width=point(25), joint="curve")
draw.rounded_rectangle(box((271, 231, 408, 308)), radius=point(22), fill="#4e82c0")
draw.ellipse(box((300, 255, 328, 283)), fill="white")

for size in (192, 512):
    icon = image.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(ROOT / "icons" / f"icon-{size}.png", optimize=True)
