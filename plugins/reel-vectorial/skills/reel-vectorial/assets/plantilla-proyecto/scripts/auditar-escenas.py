#!/usr/bin/env python3
"""Auditoría de un video del kit vectorial sin abrir Remotion (skill reel-vectorial; sirve también con fotos).

Con los tiempos de la voz (reales o simulados) calcula cuándo empieza y cuánto dura cada plano y avisa de:
  · planos de más de 75 frames (salvo `long: true`), de menos de 12 o que empiezan antes que el anterior;
  · palabras que no existen en su frase: en los planos, en los efectos y gráficos ([frase, "palabra"]) y en las
    llamadas A(frase, "palabra") de las escenas. Si una no existe, el render falla en la cola;
  · el primer plano que no empieza en el frame 0 y los planos sin escena ni imagen;
  · líneas del título de la portada (titulo={[…]}) de más de 18 caracteres sin contar los asteriscos.

Uso (desde produccion/remotion):
  python3 scripts/auditar-escenas.py src/videos/<Componente>.tsx [--frames] [--json] [--simular vo-<carpeta>.txt]
    --frames   lista el inicio, la mitad y la duración de cada plano (para sacar fotogramas de revisión)
    --json     lo mismo en JSON (lo usa nuevo-video.py stills)
    --simular  sin voz todavía: estima los tiempos desde el texto con el ritmo medido de Bill
               (0,031 s + 0,057 s por letra en cada palabra + 0,24 s tras puntuación; error ≈0,3 s por frase)
"""
import json
import math
import re
import sys
import unicodedata
from pathlib import Path

FPS, MAX, MIN = 30, 75, 12
args = sys.argv[1:]
if not args or args[0].startswith("--"):
    print(__doc__)
    sys.exit(2)
ruta = Path(args[0])
src = ruta.read_text()
ROOT = Path(__file__).resolve().parent.parent  # produccion/remotion
JSON_OUT = "--json" in args


def say(msg: str) -> None:
    if not JSON_OUT:
        print(msg)


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if not (0x300 <= ord(c) <= 0x36F))
    return re.sub(r"[^a-zñ0-9]", "", w)


def simular(texto: str) -> list[dict]:
    out = []
    for n, linea in enumerate([l.strip() for l in texto.splitlines() if l.strip()], 1):
        t, ps = 0.0, []
        for w in linea.split():
            letras = len(re.sub(r"[^\wáéíóúñü]", "", w))
            ps.append({"text": w, "start": round(t, 3)})
            t += 0.031 + 0.0571 * letras + (0.238 if re.search(r"[.,;:?!]$", w) else 0)
        out.append({"linea": n, "texto": linea, "duracion": round(t + 0.13, 3), "palabras": ps})
    return out


simulada = False
if "--simular" in args:
    tiempos = simular(Path(args[args.index("--simular") + 1]).read_text())
    say("· tiempos SIMULADOS desde el texto (repite la auditoría cuando haya voz)")
else:
    m = re.search(r'import tiempos from "\.\./\.\./public/(vo/[^"]+)/tiempos\.json"', src)
    if not m:
        print("✗ el video no importa ../../public/vo/<carpeta>/tiempos.json")
        sys.exit(1)
    vo = ROOT / "public" / m.group(1)
    if not (vo / "tiempos.json").exists():
        print(f"✗ falta {vo / 'tiempos.json'}: genera la voz o la voz simulada (nuevo-video.py simular)")
        sys.exit(1)
    tiempos = json.loads((vo / "tiempos.json").read_text())
    simulada = (vo / ".simulada").exists()
    if simulada:
        say("· voz SIMULADA (silencio con el ritmo de Bill): los cortes se moverán un poco con la voz real")

mg = re.search(r"timeline\(\s*tiempos\s*(?:,\s*(\d+))?\s*\)", src)
GAP = int(mg.group(1)) if mg and mg.group(1) else 2
VO = [math.ceil(t["duracion"] * FPS) + 1 for t in tiempos]
START, acc = [], 0
for d in VO:
    START.append(acc)
    acc += d + GAP
total = START[-1] + VO[-1] + 8


def at(n: int, word: str | None = None, occ: int = 1, off: int = 0) -> int:
    if not 1 <= n <= len(tiempos):
        raise ValueError(f"la frase {n} no existe (hay {len(tiempos)})")
    if not word:
        return START[n - 1] + off
    seen = 0
    for p in tiempos[n - 1]["palabras"]:
        if norm(p["text"]) == norm(word):
            seen += 1
            if seen == occ:
                return START[n - 1] + round(p["start"] * FPS) + off
    veces = f" {occ} veces" if occ > 1 else ""
    raise ValueError(f'"{word}"{veces} no está en la frase {n}: {tiempos[n - 1]["texto"]}')


ARR = r'\[\s*(\d+)\s*(?:,\s*"([^"]+)"\s*)?(?:,\s*(\d+)\s*)?(?:,\s*(-?\d+)\s*)?\]'
CALL = r'\bA\(\s*(\d+)\s*(?:,\s*"([^"]+)"\s*)?(?:,\s*(\d+)\s*)?(?:,\s*(-?\d+)\s*)?\)'


def eval_cut(expr: str) -> int | None:
    """Frame de un punto de corte: 120 · [3, "seis"] · A(3, "seis") + 2. None si no se puede calcular aquí."""
    e = expr.strip()
    if re.fullmatch(r"\d+", e):
        return int(e)
    for pat in (ARR, CALL):
        m = re.fullmatch(pat + r"(?:\s*([+-])\s*(\d+))?", e)
        if m:
            f = at(int(m.group(1)), m.group(2), int(m.group(3) or 1), int(m.group(4) or 0))
            if m.group(5):
                f += int(m.group(6)) * (1 if m.group(5) == "+" else -1)
            return f
    return None


def bloque(texto: str, abre: str, cierra: str, desde: int) -> tuple[int, int]:
    i = texto.index(abre, desde)
    prof = 0
    for j in range(i, len(texto)):
        if texto[j] == abre:
            prof += 1
        elif texto[j] == cierra:
            prof -= 1
            if prof == 0:
                return i, j
    raise ValueError("bloque sin cerrar")


sin_coment = re.sub(r"(?<![:\"'])//[^\n]*", "", src)
errores = 0
if "shots:" not in sin_coment:
    print("✗ no encuentro `shots: [ … ]` en el video")
    sys.exit(1)
ini, fin = bloque(sin_coment, "[", "]", sin_coment.index("shots:"))
cuerpo = sin_coment[ini + 1 : fin]
objetos, k = [], 0
while "{" in cuerpo[k:]:
    a, b = bloque(cuerpo, "{", "}", k)
    objetos.append(cuerpo[a : b + 1])
    k = b + 1

def nivel1(o: str) -> str:
    """El objeto del plano sin lo que va entre llaves anidadas (props de JSX como veredicto={{ at: … }}): así `at:`
    es el del plano y no el de una escena."""
    out, prof = [], 0
    for ch in o:
        if ch == "{":
            prof += 1
        if prof <= 1:
            out.append(ch)
        if ch == "}":
            prof -= 1
    return "".join(out)


planos = []
for o in objetos:
    plano = " ".join(o.split())
    ms = re.search(r"scene:\s*(?:\([^)]*\)\s*=>\s*<\s*(\w+)|(\w+(?:\([^)]*\))?))", o)
    mi = re.search(r'img:\s*"([^"]+)"', o)
    nombre = (ms.group(1) or ms.group(2)) if ms else (mi.group(1) if mi else None)
    if not nombre:
        print(f"✗ plano sin escena ni imagen: {plano[:110]}")
        errores += 1
        continue
    ma = re.search(r"at:\s*((?:\[[^\]]*\]|A\([^)]*\)|\d+|[A-Za-z_]\w*)(?:\s*[+-]\s*\d+)?)", nivel1(o))
    if not ma:
        print(f"✗ plano {nombre} sin `at`: {plano[:110]}")
        errores += 1
        continue
    try:
        f = eval_cut(ma.group(1))
    except ValueError as e:
        print(f"✗ plano {nombre} → {e}")
        errores += 1
        continue
    if f is None:
        print(f"⚠ plano {nombre}: no puedo calcular `at: {ma.group(1)}` aquí (usa [frase, \"palabra\"] o A(…))")
        continue
    planos.append({"nombre": nombre, "at": ma.group(1), "frame": f, "long": bool(re.search(r"long:\s*true", o))})

# todas las demás referencias a palabras del archivo (efectos, gráficos, momentos clave de las escenas)
fuera = sin_coment[:ini] + sin_coment[fin:]
vistos = set()
for pat, txt in ((ARR, fuera), (CALL, sin_coment)):
    for m in re.finditer(pat, txt):
        if not m.group(2) or m.group(0) in vistos:
            continue
        vistos.add(m.group(0))
        try:
            at(int(m.group(1)), m.group(2), int(m.group(3) or 1), int(m.group(4) or 0))
        except ValueError as e:
            print(f"✗ {m.group(0)} → {e}")
            errores += 1

if planos and planos[0]["frame"] != 0:
    print(f"✗ el primer plano empieza en el frame {planos[0]['frame']}: el gancho tiene que verse en el frame 0")
    errores += 1

frases = set()
lista = []
for i, p in enumerate(planos):
    nxt = planos[i + 1]["frame"] if i + 1 < len(planos) else total
    dur = nxt - p["frame"]
    lista.append({**p, "i": i, "dur": dur, "mid": p["frame"] + max(0, dur) // 2})
    if dur <= 0 or (dur > MAX and not p["long"]):
        errores += 1
        say(f"✗ plano {i} ({p['nombre']}) en {p['at']}: {dur} frames")
        frases.add(next(n for n in range(len(START), 0, -1) if START[n - 1] <= p["frame"]))
    elif dur < MIN:
        say(f"⚠ plano {i} ({p['nombre']}) en {p['at']}: solo {dur} frames (menos de 0,4 s)")
    if "--frames" in args:
        say(f"  plano {i:2} {p['nombre'][:16]:>16}  frame {p['frame']:5}  mitad {p['frame'] + max(0, dur) // 2:5}  dura {dur:3} f  {p['at']}")
for n in sorted(frases):
    t = tiempos[n - 1]
    say(f"  frase {n} (empieza en {START[n - 1]}, {VO[n - 1]} f): " + " ".join(f'{p["text"]}:{START[n - 1] + round(p["start"] * FPS)}' for p in t["palabras"]))

mt = re.search(r"titulo=\{\[([^\]]*)\]\}|titulo:\s*\[([^\]]*)\]", sin_coment)
if mt:
    for linea in re.findall(r'"([^"]*)"', mt.group(1) or mt.group(2)):
        if len(linea.replace("*", "")) > 18:
            say(f"⚠ portada: «{linea}» pasa de 18 caracteres (a 100 px se parte mal)")

if JSON_OUT:
    print(json.dumps({"total": total, "simulada": simulada, "errores": errores, "planos": lista}, ensure_ascii=False))
else:
    print(f"{len(planos)} planos, {total} frames ({total / FPS:.1f} s) · {'OK' if not errores else str(errores) + ' problemas'}")
sys.exit(1 if errores else 0)
