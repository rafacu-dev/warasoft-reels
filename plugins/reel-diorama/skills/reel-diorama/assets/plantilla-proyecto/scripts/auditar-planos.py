# Simula la auditoría de planos del motor (src/engine/Reel.tsx) sin abrir Remotion:
# calcula cuánto dura cada plano con los tiempos de la voz y avisa de los que pasan de 75 frames
# (salvo los marcados `long`) o cuya palabra no existe en la frase. Muestra las palabras de las frases afectadas
# para elegir dónde cortar. Revisa también las palabras de efectos y gráficos (todo [frase, "palabra"] del archivo):
# si una no existe, el render fallaría en la cola. Y avisa de los planos que aún no están en public/.
# Uso: python3 scripts/auditar-planos.py src/videos/<Video>.tsx [--frames] [--simular vo-<carpeta>.txt]
#   --frames            lista el frame de cada plano (para sacar stills del gancho, la revelación o un gráfico)
#   --simular <vo.txt>  sin voz todavía: estima los tiempos desde el texto con el ritmo medido de una voz
#                       documental a velocidad 1,15 (0,031 s + 0,057 s por letra en cada palabra + 0,24 s tras
#                       puntuación; error ≈0,3 s por frase)
import json
import math
import re
import sys
import unicodedata
from pathlib import Path

FPS, GAP, MAX = 30, 2, 75
PUBLIC = Path(__file__).resolve().parent.parent / "public"
args = sys.argv[1:]
src = Path(args[0]).read_text()


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


if "--simular" in args:
    tiempos = simular(Path(args[args.index("--simular") + 1]).read_text())
    print("· tiempos SIMULADOS desde el texto (repite la auditoría cuando haya voz)")
else:
    m_vo = re.search(r'import tiempos from "\.\./\.\./public/(vo/[^"]+)/tiempos\.json"', src)
    if not m_vo:
        sys.exit("✗ el video no importa ../../public/vo/<carpeta>/tiempos.json (copia el esqueleto de references/motor.md)")
    vo_dir = PUBLIC / m_vo.group(1)
    if not (vo_dir / "tiempos.json").exists():
        sys.exit(f"✗ aún no hay voz en {vo_dir.relative_to(PUBLIC.parent)}: usa --simular vo-<carpeta>.txt o crea la voz simulada")
    tiempos = json.loads((vo_dir / "tiempos.json").read_text())
    if (vo_dir / ".simulada").exists():
        print("· voz SIMULADA (silencio con tiempos estimados): repite la auditoría cuando llegue la voz real")

VO = [math.ceil(t["duracion"] * FPS) + 1 for t in tiempos]
START, acc = [], 0
for d in VO:
    START.append(acc)
    acc += d + GAP
total = START[-1] + VO[-1] + 8


def at(cut: str) -> int:
    cut = cut.strip()
    if re.fullmatch(r"\d+", cut):
        return int(cut)
    m = re.fullmatch(r'\[\s*(\d+)(?:,\s*"([^"]+)")?(?:,\s*(\d+))?(?:,\s*(-?\d+))?\s*\]', cut)
    if not m:
        raise ValueError(f"no entiendo el punto de corte {cut}")
    n, word, occ, off = int(m.group(1)), m.group(2), int(m.group(3) or 1), int(m.group(4) or 0)
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


def bloque(texto: str, abre: str, cierra: str, desde: int) -> tuple[int, int]:
    """Posición del bloque que empieza en el primer `abre` desde `desde`, con anidamiento."""
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


# planos: cada objeto de primer nivel dentro de `shots: [ … ]`, ocupe una línea o varias
ini, fin = bloque(src, "[", "]", src.index("shots:"))
cuerpo = re.sub(r"//[^\n]*", "", src[ini + 1 : fin])
objetos, k = [], 0
while "{" in cuerpo[k:]:
    a, b = bloque(cuerpo, "{", "}", k)
    objetos.append(cuerpo[a : b + 1])
    k = b + 1
shots = []
errores = 0
for o in objetos:
    mi = re.search(r'img:\s*"([^"]+)"', o)
    ma = re.search(r"at:\s*(\d+|\[[^\]]*\])", o)
    if not mi or not ma:
        print(f"✗ no entiendo este plano: {' '.join(o.split())[:120]}")
        errores += 1
        continue
    shots.append((mi.group(1), ma.group(1), bool(re.search(r"long:\s*true", o))))

fr = []
for img, cut, long_ in shots:
    try:
        fr.append((img, cut, at(cut), long_))
    except ValueError as e:
        print("✗ plano", img, "→", e)
        errores += 1

# todas las demás referencias [frase, "palabra"…] del archivo (efectos, gráficos, d(…))
fuera = src[:ini] + src[fin:]
for m in re.finditer(r'\[\s*\d+\s*,\s*"[^"]+"(?:\s*,\s*-?\d+){0,2}\s*\]', re.sub(r"//[^\n]*", "", fuera)):
    try:
        at(m.group(0))
    except ValueError as e:
        print("✗ efecto o gráfico →", e)
        errores += 1

frases = set()
for i, (img, cut, f, long_) in enumerate(fr):
    nxt = fr[i + 1][2] if i + 1 < len(fr) else total
    dur = nxt - f
    if dur <= 0 or (dur > MAX and not long_):
        errores += 1
        print(f"✗ plano {i} ({img}) en {cut}: {dur} frames")
        frases.add(next(n for n in range(len(START), 0, -1) if START[n - 1] <= f))
    elif dur < 12:
        print(f"⚠ plano {i} ({img}) en {cut}: solo {dur} frames (menos de 0,4 s)")
    if "--frames" in args:
        print(f"  plano {i:2} {img:>4}  frame {f:5}  dura {dur:3} f  {cut}")
for n in sorted(frases):
    t = tiempos[n - 1]
    print(f"  frase {n} (empieza en {START[n - 1]}, {VO[n - 1]} f): " + " ".join(f'{p["text"]}:{START[n - 1] + round(p["start"] * FPS)}' for p in t["palabras"]))
m_img = re.search(r'imgDir:\s*"([^"]+)"', src)
if m_img:
    usados = sorted({img for img, *_ in shots})
    faltan = [i for i in usados if not (PUBLIC / m_img.group(1) / f"{i}.jpg").exists() or not (PUBLIC / m_img.group(1) / f"{i}_depth.png").exists()]
    if faltan:
        print(f"· planos pendientes en public/{m_img.group(1)}/ (se ven como provisionales): {' '.join(faltan)}")
print(f"{len(fr)} planos, {total} frames ({total / FPS:.1f} s) · {'OK' if not errores else str(errores) + ' problemas'}")
sys.exit(1 if errores else 0)
