# Hoja de contacto de los planos de un video para revisarlos de un vistazo (ligera: no necesita turno).
# Uso: $REELS_IMG_VENV/bin/python scripts/hoja-contacto.py <carpeta_planos> <salida.jpg> [semilla]
#   respeta semillas.tsv (plano<TAB>semilla) salvo que se pida otra semilla explícitamente (para comparar semillas)
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

d = Path(sys.argv[1])
out = sys.argv[2]
forced = sys.argv[3] if len(sys.argv) > 3 else None
over = {}
if (d / "semillas.tsv").exists():
    for l in (d / "semillas.tsv").read_text().splitlines():
        if l.strip():
            k, v = l.split("\t")
            over[k] = v.strip()
names = [l.split("\t")[0] for l in (d / "planos.tsv").read_text().splitlines() if l.strip()]
W, H = 288, 512
cols = 6
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * (H + 30)), "black")
dr = ImageDraw.Draw(sheet)
try:
    f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
except OSError:
    f = ImageFont.load_default()
for i, n in enumerate(names):
    seed = forced or over.get(n, "11")
    p = d / f"{n}-s{seed}.png"
    x = (i % cols) * W
    y = (i // cols) * (H + 30)
    dr.text((x + 8, y + 2), f"{n} s{seed}" + ("" if p.exists() else " (falta)"), fill="yellow", font=f)
    if p.exists():
        sheet.paste(Image.open(p).convert("RGB").resize((W, H)), (x, y + 30))
sheet.save(out, quality=85)
print(f"✓ {out}")
