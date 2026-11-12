# Prepara los planos de un video para Remotion: crea el mapa de profundidad (Depth Pro) si falta
# y exporta <plano>.jpg + <plano>_depth.png (suavizado) a public/<destino>/.
# Solo lee los PNG originales; nunca escribe en ellos. Va por la cola (tarea `export`): Depth Pro es pesado.
# Uso: $REELS_IMG_VENV/bin/python scripts/exportar-planos.py <carpeta_planos> <destino_en_public> [semilla=11]
#   Un plano puede usar otra semilla con una línea "plano<TAB>semilla" en <carpeta>/semillas.tsv
# Apunta en public/<destino>/.origen.tsv de qué PNG sale cada plano: si cambia la semilla elegida, lo reexporta
# aunque el jpg sea más nuevo.
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageFilter

folder = Path(sys.argv[1]).resolve()
dest = Path(__file__).resolve().parent.parent / "public" / sys.argv[2]
seed = sys.argv[3] if len(sys.argv) > 3 else "11"
dest.mkdir(parents=True, exist_ok=True)

overrides = {}
if (folder / "semillas.tsv").exists():
    for l in (folder / "semillas.tsv").read_text().splitlines():
        if l.strip():
            k, v = l.split("\t")
            overrides[k] = v.strip()

depth_bin = Path(os.environ.get("REELS_IMG_VENV", "~/imggen/.venv")).expanduser() / "bin" / "mflux-save-depth"
origen_p = dest / ".origen.tsv"
origen = dict(l.split("\t") for l in origen_p.read_text().splitlines() if "\t" in l) if origen_p.exists() else {}
names = [l.split("\t")[0] for l in (folder / "planos.tsv").read_text().splitlines() if l.strip()]
for n in names:
    src = folder / f"{n}-s{overrides.get(n, seed)}.png"
    if not src.exists():
        print(f"✗ {n}: falta {src.name}")
        continue
    depth = src.with_name(src.stem + "_depth.png")
    if not depth.exists():
        subprocess.run([str(depth_bin), "--image-path", str(src)], check=True, capture_output=True)
    out_jpg, out_depth = dest / f"{n}.jpg", dest / f"{n}_depth.png"
    if origen.get(n) == src.name and out_jpg.exists() and out_jpg.stat().st_mtime > src.stat().st_mtime and out_depth.exists():
        print(f"= {n}")
        continue
    Image.open(src).convert("RGB").resize((1080, 1920), Image.LANCZOS).save(out_jpg, quality=92)
    Image.open(depth).convert("L").resize((1080, 1920), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2)).save(out_depth)
    origen[n] = src.name
    origen_p.write_text("".join(f"{k}\t{v}\n" for k, v in origen.items()))
    print(f"✓ {n} ({src.name})")
