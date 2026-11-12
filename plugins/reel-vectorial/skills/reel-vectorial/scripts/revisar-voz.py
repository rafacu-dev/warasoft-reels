#!/usr/bin/env python3
"""Revisa vo-<carpeta>.txt antes de gastar créditos de ElevenLabs.

Uso: revisar-voz.py <vo-carpeta.txt> [--ritmo 3.2]
  --ritmo: palabras por segundo de la voz (Bill a velocidad 1,15 ≈ 3,2; medido en 13 videos).

Sale con 1 si hay errores (lo que obliga a rehacer la voz después). Los avisos son para pensarlos.
"""
import re
import sys
from pathlib import Path

if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(2)
ruta = Path(sys.argv[1])
ritmo = float(sys.argv[sys.argv.index("--ritmo") + 1]) if "--ritmo" in sys.argv else 3.2
lineas = [l.strip() for l in ruta.read_text().splitlines() if l.strip()]
if not lineas:
    print(f"✗ {ruta} está vacío")
    sys.exit(1)

errores, avisos = [], []
for n, l in enumerate(lineas, 1):
    palabras = l.split()
    if "…" in l or "..." in l:
        errores.append(f"frase {n}: puntos suspensivos. La voz hace una pausa larga y el ritmo se cae; usa punto o coma.")
    if re.search(r"\d|[%€$£]", l):
        avisos.append(
            f"frase {n}: cifra o símbolo ({' '.join(re.findall(r'[^ ]*[0-9%€$£][^ ]*', l))}). Escríbelo con letras: "
            "la voz lo lee natural y los cortes se anclan en palabras; en pantalla se ve con `merges`."
        )
    if len(palabras) > 28:
        avisos.append(f"frase {n}: {len(palabras)} palabras (≈{len(palabras) / ritmo:.0f} s). Necesitará 4+ planos; ¿se puede partir?")
    if l.count("¿") != l.count("?"):
        avisos.append(f"frase {n}: signos de interrogación desparejados")
    if l.count("¡") != l.count("!"):
        avisos.append(f"frase {n}: signos de exclamación desparejados")

# lo que se lee en el frame 0 (y en la miniatura): el motor parte en bloques de 3 palabras o en la primera puntuación
primer = []
for w in lineas[0].split():
    primer.append(w)
    if len(primer) >= 3 or re.search(r"[.,?!:…]$", w):
        break
for w in sorted({w.strip("¿?¡!.,;:") for l in lineas for w in l.split() if re.search(r"[A-ZÁÉÍÓÚÑ]{3,}", w)}):
    avisos.append(
        f"«{w}» en mayúsculas: si es una sigla que se deletrea (CNMV), bien; si es una marca que se lee como palabra, "
        f"escríbela «{w.capitalize()}» y recupera la grafía en pantalla con display: {{ {w.lower()}: \"{w}\" }}."
    )
if "?" not in lineas[0]:
    avisos.append("frase 1: el gancho no pregunta. Fórmula de la cuenta: pregunta + lo raro en pantalla en el segundo 1.")
if len(lineas[0].split()) > 18:
    avisos.append(f"frase 1: gancho de {len(lineas[0].split())} palabras (>6 s). Que la pregunta se entienda en 3 s.")
if not re.match(r"(Envíaselo|Envíale|Mándaselo|Sígueme|Comparte|Guárdalo|Guarda)", lineas[-1]):
    avisos.append("última frase: no es una llamada a enviar, guardar o seguir (p. ej. «Envíaselo a quien…» o «Guárdalo para…»).")

total = sum(len(l.split()) for l in lineas)
chars = sum(len(l) for l in lineas)
dur = total / ritmo + 0.07 * len(lineas)
if not 30 <= dur <= 60:
    avisos.append(f"duración estimada {dur:.0f} s, fuera de 30–60 s")
if not 8 <= len(lineas) <= 13:
    avisos.append(f"{len(lineas)} frases (lo habitual son 10–12: una por idea visual)")

print(f"{ruta.name}: {len(lineas)} frases · {total} palabras · ≈{dur:.0f} s · ≈{chars} créditos de ElevenLabs")
print(f"Frame 0 y miniatura: «{' '.join(primer)}» (¿se entiende solo? Es lo único que se lee antes de que hable)")
for e in errores:
    print(f"✗ {e}")
for a in avisos:
    print(f"⚠ {a}")
if not errores and not avisos:
    print("✓ sin problemas")
sys.exit(1 if errores else 0)
