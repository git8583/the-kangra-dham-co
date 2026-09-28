from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZES = (72, 96, 128, 144, 152, 192, 384, 512)


def make_icon(size: int) -> Image.Image:
    scale = size / 64
    image = Image.new("RGBA", (size, size), "#8E4528")
    draw = ImageDraw.Draw(image)

    radius = round(14 * scale)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    image.putalpha(mask)

    def points(values):
        return [(round(x * scale), round(y * scale)) for x, y in values]

    draw.polygon(points([(7, 30), (19, 17), (27, 25), (36, 12), (57, 30)]), fill="#FAF8F5")
    draw.polygon(points([(15, 30), (20, 25), (27, 18), (32, 23), (36, 18), (48, 30)]), fill="#DAA520")
    draw.pieslice(
        (round(13 * scale), round(27 * scale), round(51 * scale), round(55 * scale)),
        start=0,
        end=180,
        fill="#FAF8F5",
    )
    draw.line(points([(17, 41), (47, 41)]), fill="#DAA520", width=max(2, round(3 * scale)))
    for x in (24, 32, 40):
        draw.arc(
            (round((x - 3) * scale), round(23 * scale), round((x + 3) * scale), round(36 * scale)),
            start=80,
            end=280,
            fill="#FAF8F5",
            width=max(1, round(2.5 * scale)),
        )
    return image


icons = ROOT / "icons"
icons.mkdir(exist_ok=True)
for icon_size in SIZES:
    make_icon(icon_size).save(icons / f"icon-{icon_size}.png", optimize=True)

make_icon(64).save(
    ROOT / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
)
