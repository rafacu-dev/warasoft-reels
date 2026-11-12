#!/usr/bin/env python3
"""Voz SIMULADA para montar y revisar un video antes de tener la voz de ElevenLabs (o sin saldo).

Uso (desde produccion/remotion): python3 scripts/voz-simulada.py <carpeta> [<carpeta>…]   (lee vo-<carpeta>.txt)
Deja public/vo/<carpeta>/tiempos.json con tiempos estimados desde el texto (ritmo medido de una voz documental
de ElevenLabs a velocidad 1,15, ≈3,2 palabras/s; error ≈0,3 s por frase), N.mp3 en silencio si hay ffmpeg, y un
archivo .simulada que lo marca. Nunca pisa una voz real. La voz real la pone `nuevo-video.py voz`.
Un video con voz simulada no se entrega: la cola se niega a renderizarlo salvo como vista previa.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent


def simular(texto: str) -> list[dict]:
    out = []
    for n, linea in enumerate([l.strip() for l in texto.splitlines() if l.strip()], 1):
        t, ps = 0.0, []
        for w in linea.split():
            letras = len(re.sub(r"[^\wáéíóúñü]", "", w))
            d = 0.031 + 0.0571 * letras
            ps.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d + (0.238 if re.search(r"[.,;:?!]$", w) else 0)
        out.append({"linea": n, "texto": linea, "duracion": round(t + 0.13, 3), "palabras": ps})
    return out


if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(2)
for c in sys.argv[1:]:
    txt = root / f"vo-{c}.txt"
    if not txt.exists() or not txt.read_text().strip():
        print(f"✗ {c}: falta el texto en {txt.name}")
        sys.exit(1)
    out = root / "public" / "vo" / c
    if (out / "tiempos.json").exists() and not (out / ".simulada").exists():
        print(f"= {c}: ya tiene voz real, no la toco")
        continue
    out.mkdir(parents=True, exist_ok=True)
    for viejo in out.glob("*.mp3"):
        viejo.unlink()  # silencios de una simulación anterior (el texto pudo cambiar de número de frases)
    tiempos = simular(txt.read_text())
    if shutil.which("ffmpeg"):
        for t in tiempos:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                            "-t", str(t["duracion"]), "-q:a", "9", str(out / f"{t['linea']}.mp3")], check=True)
    (out / "tiempos.json").write_text(json.dumps(tiempos, ensure_ascii=False, indent=1))
    (out / ".simulada").write_text("voz simulada (silencio); la sustituye `nuevo-video.py voz`\n")
    print(f"✓ {c}: {len(tiempos)} frases, {sum(t['duracion'] for t in tiempos):.1f} s simulados")
