# Acorta las pausas internas de cada línea de voz (public/vo/N.mp3) a un máximo y reajusta tiempos.json.
# Uso: python3 scripts/compactar-pausas.py [max_pausa_s=0.2] [carpeta=vo]
import json
import re
import subprocess
import sys
from pathlib import Path

MAX = float(sys.argv[1]) if len(sys.argv) > 1 else 0.2
vo = Path(__file__).resolve().parent.parent / "public" / (sys.argv[2] if len(sys.argv) > 2 else "vo")
tiempos = json.loads((vo / "tiempos.json").read_text())

for t in tiempos:
    src = vo / f"{t['linea']}.mp3"
    err = subprocess.run(["ffmpeg", "-i", str(src), "-af", "silencedetect=n=-38dB:d=0.1", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    # solo pausas internas (entre palabras), no el silencio final
    cuts = [(a, b) for a, b in zip(starts, ends) if a > 0.05 and b < t["duracion"] - 0.02 and b - a > MAX]
    if not cuts:
        continue
    # tramos a conservar: de cada pausa se quedan MAX/2 al principio y MAX/2 al final
    keep, cur = [], 0.0
    for a, b in cuts:
        keep.append((cur, a + MAX / 2))
        cur = b - MAX / 2
    keep.append((cur, None))
    parts = "".join(
        f"[0:a]atrim=start={s}{f':end={e}' if e is not None else ''},asetpts=PTS-STARTPTS[p{i}];" for i, (s, e) in enumerate(keep)
    )
    graph = parts + "".join(f"[p{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[out]"
    tmp = vo / f"{t['linea']}.tmp.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-filter_complex", graph, "-map", "[out]", "-b:a", "192k", str(tmp)], check=True)
    tmp.replace(src)

    def remap(x: float) -> float:
        removed = 0.0
        for a, b in cuts:
            if x >= b - MAX / 2:
                removed += (b - a) - MAX
            elif x > a + MAX / 2:
                removed += x - (a + MAX / 2)
        return x - removed

    for p in t["palabras"]:
        p["start"], p["end"] = round(remap(p["start"]), 3), round(remap(p["end"]), 3)
    old = t["duracion"]
    t["duracion"] = t["palabras"][-1]["end"]
    print(f"L{t['linea']}: {old:.2f}s → {t['duracion']:.2f}s ({len(cuts)} pausas acortadas)")

# Cola final: ElevenLabs alarga la última palabra hasta el final del archivo, con el silencio dentro.
# Se recorta el audio al final real de la voz (+ un respiro corto) y se ajusta la última palabra.
TAIL = 0.08
for t in tiempos:
    src = vo / f"{t['linea']}.mp3"
    err = subprocess.run(["ffmpeg", "-i", str(src), "-af", "silencedetect=n=-38dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    last = t["palabras"][-1]
    trailing = [s for s in starts if s > last["start"] + 0.15]
    if not trailing:
        continue
    end = trailing[-1] + TAIL
    if t["duracion"] - end < 0.1:
        continue
    tmp = vo / f"{t['linea']}.tmp.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", f"atrim=end={end},afade=t=out:st={end - 0.05}:d=0.05", "-b:a", "192k", str(tmp)],
        check=True,
    )
    tmp.replace(src)
    print(f"L{t['linea']}: cola recortada {t['duracion'] - end:.2f}s")
    last["end"] = round(end, 3)
    t["duracion"] = last["end"]

(vo / "tiempos.json").write_text(json.dumps(tiempos, indent=2, ensure_ascii=False))
print("total voz:", round(sum(t["duracion"] for t in tiempos), 2), "s")
