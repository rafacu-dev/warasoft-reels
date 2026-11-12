#!/usr/bin/env python3
"""Escucha la voz generada sin auriculares: transcribe cada N.mp3 con Whisper y lo compara con el guion.

Uso (con el Python del entorno de imágenes, que ya trae transformers y torch; por el turno del Mac):
  <cuenta>/produccion/remotion/scripts/turno.sh ~/imggen/.venv/bin/python <skill>/scripts/comprobar-voz.py <vo>
  <vo> = ruta ABSOLUTA de produccion/remotion/public/vo/<carpeta> (turno.sh cambia de carpeta).
  Si tu entorno de imágenes está en otra ruta (REELS_IMG_VENV), usa su bin/python.
  La primera vez descarga whisper-small (≈1 GB) de Hugging Face. Corre en CPU; necesita ffmpeg.
  Otro entorno sirve igual: python3 -m venv ~/whisper && ~/whisper/bin/pip install transformers torch

tiempos.json solo dice dónde cae cada palabra del texto ENVIADO; no detecta si la voz se comió, cambió o
pronunció mal una palabra. Esto sí: marca las frases cuya transcripción se aparta del texto.
Whisper devuelve los números en cifras ("300.000"); se pasan a letras antes de comparar.
"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

U = ("cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete "
     "dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete "
     "veintiocho veintinueve").split()
D = {3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa"}
C = {1: "ciento", 2: "doscientos", 3: "trescientos", 4: "cuatrocientos", 5: "quinientos", 6: "seiscientos",
     7: "setecientos", 8: "ochocientos", 9: "novecientos"}


def en_letras(n: int) -> str:
    """Número entero en palabras, como lo escribe el guion (Whisper suele devolverlo en cifras)."""
    if n < 30:
        return U[n]
    if n < 100:
        d, u = divmod(n, 10)
        return D[d] + (f" y {U[u]}" if u else "")
    if n == 100:
        return "cien"
    if n < 1000:
        c, r = divmod(n, 100)
        return C[c] + (f" {en_letras(r)}" if r else "")
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        return ("mil" if m == 1 else f"{en_letras(m)} mil") + (f" {en_letras(r)}" if r else "")
    m, r = divmod(n, 1_000_000)
    return ("un millón" if m == 1 else f"{en_letras(m)} millones") + (f" {en_letras(r)}" if r else "")


def limpio(x: str) -> list[str]:
    x = x.lower().replace("%", " por ciento").replace("€", " euros")
    x = re.sub(r"(?<=\d)\.(?=\d{3}\b)", "", x)  # 300.000 → 300000
    x = re.sub(r"(?<=\d),(?=\d)", " coma ", x)  # 19,9 → 19 coma 9
    x = re.sub(r"\d+", lambda m: en_letras(int(m.group(0))) if len(m.group(0)) < 10 else m.group(0), x)
    x = unicodedata.normalize("NFD", x)
    x = "".join(c for c in x if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-zñ0-9 ]", " ", x).split()


vo = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if not vo or not (vo / "tiempos.json").exists():
    print(__doc__)
    sys.exit(2)
if (vo / ".simulada").exists():
    sys.exit("✗ esta voz es SIMULADA (silencio): no hay nada que escuchar. Genera la voz real con `nuevo-video.py voz`.")
from transformers import pipeline  # noqa: E402 (después de comprobar los argumentos: tarda en cargar)

asr = pipeline("automatic-speech-recognition", model="openai/whisper-small", device="cpu")
tiempos = json.loads((vo / "tiempos.json").read_text())
malas = 0
for t in tiempos:
    oido = asr(str(vo / f"{t['linea']}.mp3"), generate_kwargs={"language": "spanish", "task": "transcribe"})["text"]
    a, b = limpio(t["texto"]), limpio(oido)
    r = difflib.SequenceMatcher(None, a, b).ratio()
    if r < 0.85:
        malas += 1
        dif = [f"{op}: «{' '.join(a[i1:i2])}» → «{' '.join(b[j1:j2])}»" for op, i1, i2, j1, j2 in
               difflib.SequenceMatcher(None, a, b).get_opcodes() if op != "equal"]
        print(f"⚠ frase {t['linea']} ({r:.0%}): {'; '.join(dif)}")
    else:
        print(f"✓ frase {t['linea']} ({r:.0%})")
print("✓ la voz dice lo que pone el guion" if not malas else f"{malas} frase(s) para escuchar o rehacer con --solo N")
