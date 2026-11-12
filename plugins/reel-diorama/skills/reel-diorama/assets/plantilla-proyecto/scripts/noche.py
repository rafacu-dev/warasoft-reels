#!/usr/bin/env python3
"""Cola de tareas pesadas con control de recursos: UNA tarea pesada cada vez, y solo cuando hay recursos.

Por qué existe: un generador de imágenes de 6.000 millones de parámetros puede ocupar ≈33 GB de memoria
(≈18 GB con --low-ram). Juntar dos generadores y un render basta para que un Mac de 48 GB se quede sin memoria,
el sistema empiece a matar procesos y acabe reiniciándose. Con esta cola eso no pasa.

Cómo funciona:
  · Lee la cola `noche-cola.txt` (una tarea por línea; se puede ampliar mientras corre) y apunta lo hecho en
    `noche-hecho.txt`. Si se reinicia, continúa donde lo dejó.
  · Antes de cada tarea espera a que haya memoria libre, poca carga, sin aviso térmico y con el cargador puesto
    (o batería > 50 %). Si existe el archivo `PAUSA`, no empieza nada nuevo.
  · Mientras corre una tarea la vigila cada 5 s: si la memoria libre baja del 15 % o el swap crece más de 3 GB,
    la mata y la reintenta más tarde. Si hay aviso térmico, la congela (SIGSTOP) hasta que se enfríe.
  · Entre tareas deja enfriar la máquina (pausas). Remotion renderiza con concurrencia 2.
  · Otros procesos pesados (comprobaciones manuales) usan el mismo candado: `scripts/turno.sh <comando>`.
  · El candado (`recursos/turno-mac.lock` en la raíz del proyecto, o REELS_TURNO_LOCK) es común a todas las cuentas.

Tareas:
  img <carpeta> <plano> <semilla>     una imagen (modo low-RAM)
  export <carpeta>                    profundidad + copia a public/<carpeta>
  render <Composición> <nombre>       render + master a videos/borradores/<nombre>_v1.mp4 (+ copia móvil)
  portada <IdStill> <nombre>          videos/borradores/<nombre>_portada.png
  # comentario
Uso: caffeinate -i python3 scripts/noche.py [--hasta-vaciar]
     (--hasta-vaciar: termina al quedarse sin tareas, para que el Mac pueda dormir)
Entorno de imágenes: REELS_IMG_VENV (por defecto ~/imggen/.venv, lo crea preparar-entorno.sh de la skill).
"""
import os
import re
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # produccion/remotion
IMG = ROOT.parent.parent / "assets" / "imagenes"
OUT = ROOT.parent.parent / "videos" / "borradores"
COLA, HECHO, LOG, PAUSA = (ROOT / n for n in ("noche-cola.txt", "noche-hecho.txt", "noche.log", "PAUSA"))
# El turno es del Mac, no de una cuenta: todas las cuentas (cuentas/<cuenta>/produccion/remotion) comparten este
# candado, así que dos colas o una cola y un turno.sh nunca trabajan a la vez.
LOCK = Path(os.environ.get("REELS_TURNO_LOCK") or ROOT.parents[3] / "recursos" / "turno-mac.lock")
TMP = Path(os.environ.get("TMPDIR", "/tmp"))
VENV = Path(os.environ.get("REELS_IMG_VENV", "~/imggen/.venv")).expanduser()
PY_IMG = VENV / "bin" / "python"

LIBRE_MIN = {"img": 55, "export": 50, "render": 45, "portada": 40}  # % de memoria libre para empezar
LIBRE_KILL = 15  # % libre por debajo del cual se mata la tarea
SWAP_KILL_MB = 3000  # crecimiento de swap durante una tarea que obliga a matarla
CARGA_MAX = max(4.0, (os.cpu_count() or 8) * 0.66)  # carga media de 1 min
PAUSA_TRAS = {"img": 20, "export": 30, "render": 150, "portada": 30}
TIMEOUT = {"img": 15 * 60, "export": 20 * 60, "render": 60 * 60, "portada": 10 * 60}
MAX_INTENTOS = 3
# Remotion escribe su progreso línea a línea; en el registro solo queremos errores y resultados
SIN_PROGRESO = '{ grep --line-buffered -vE "^(Rendered|Bundling|Copying|Getting|Stitched|Encoded|Rendering)" || true; }'


def log(msg: str) -> None:
    with open(LOG, "a") as f:
        f.write(time.strftime("%H:%M:%S ") + msg + "\n")


def sh(cmd: str) -> str:
    try:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return ""


def libre() -> int:
    m = re.search(r"free percentage:\s*(\d+)%", sh("memory_pressure"))
    return int(m.group(1)) if m else 0


def swap_mb() -> float:
    m = re.search(r"used = ([\d.]+)M", sh("sysctl vm.swapusage"))
    return float(m.group(1)) if m else 0.0


def carga() -> float:
    m = re.search(r"\{ ([\d.]+)", sh("sysctl -n vm.loadavg"))
    return float(m.group(1)) if m else 0.0


def caliente() -> bool:
    t = sh("pmset -g therm")
    if "No thermal warning level has been recorded" in t and "No performance warning level has been recorded" in t:
        return False
    return bool(re.search(r"(thermal|performance) warning level\s*[=:]?\s*[1-9]", t, re.I)) or bool(
        re.search(r"CPU_Speed_Limit\s*=\s*(\d+)", t) and int(re.search(r"CPU_Speed_Limit\s*=\s*(\d+)", t).group(1)) < 90
    )


def bateria_ok() -> tuple[bool, str]:
    b = sh("pmset -g batt")
    if "AC Power" in b:
        return True, "AC"
    m = re.search(r"(\d+)%", b)
    pct = int(m.group(1)) if m else 0
    return pct > 50, f"batería {pct}%"


def estado() -> str:
    return f"libre {libre()}% · carga {carga():.1f} · swap {swap_mb() / 1024:.1f} GB"


def puerta(tipo: str) -> None:
    """Espera hasta que haya recursos para empezar una tarea de este tipo."""
    avisado = ""
    while True:
        bat_ok, bat = bateria_ok()
        motivo = ""
        if PAUSA.exists():
            motivo = "pausa manual (archivo PAUSA)"
        elif LOCK.exists() and time.time() - LOCK.stat().st_mtime < 3 * 3600:
            motivo = "otro proceso tiene el turno"
        elif not bat_ok:
            motivo = f"sin cargador ({bat})"
        elif caliente():
            motivo = "aviso térmico"
        elif libre() < LIBRE_MIN[tipo]:
            motivo = f"poca memoria libre (<{LIBRE_MIN[tipo]} %)"
        elif carga() > CARGA_MAX:
            motivo = "carga alta"
        if not motivo:
            return
        if motivo != avisado:
            log(f"   espera: {motivo} · {estado()}")
            avisado = motivo
        time.sleep(60)


def comando(t: list[str]) -> str:
    tipo = t[0]
    if tipo == "img":
        carpeta, plano, semilla = t[1], t[2], t[3]
        return f'cd "{IMG / carpeta}" && ./generar.sh {semilla} {plano} && test -f {plano}-s{semilla}.png'
    if tipo == "export":
        # falla si falta algún plano (exportar-planos.py marca con ✗ los que no encuentra)
        return f'cd "{ROOT}" && out=$("{PY_IMG}" scripts/exportar-planos.py "{IMG / t[1]}" {t[1]}) && echo "$out" | grep "✗" ; ! echo "$out" | grep -q "✗"'
    if tipo == "render":
        comp, nombre = t[1], t[2]
        raw = TMP / f"{nombre}-raw.mp4"
        return (
            f'set -o pipefail; cd "{ROOT}" && npx remotion render {comp} "{raw}" --log=error --concurrency=2 2>&1 | {SIN_PROGRESO} && '
            f'python3 scripts/master.py "{raw}" "{OUT / (nombre + "_v1.mp4")}" && rm -f "{raw}"'
        )
    if tipo == "portada":
        return f'set -o pipefail; cd "{ROOT}" && npx remotion still {t[1]} "{OUT / (t[2] + "_portada.png")}" --log=error 2>&1 | {SIN_PROGRESO}'
    raise ValueError(f"tarea desconocida: {tipo}")


def tomar_turno(tipo: str) -> None:
    """Espera recursos y toma el candado de forma atómica (otra cuenta puede adelantarse entre medias)."""
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    while True:
        puerta(tipo)
        try:
            LOCK.mkdir()
            return
        except FileExistsError:
            try:
                if time.time() - LOCK.stat().st_mtime >= 3 * 3600:
                    LOCK.rmdir()  # candado huérfano de un proceso que murió
                    continue
            except OSError:
                continue
            time.sleep(30)


def ejecutar(linea: str) -> bool:
    t = linea.split()
    tipo = t[0]
    tomar_turno(tipo)
    try:
        log(f"▶ {linea} · {estado()}")
        inicio, swap0 = time.time(), swap_mb()
        with open(LOG, "a") as f:
            p = subprocess.Popen(comando(t), shell=True, executable="/bin/bash", stdout=f, stderr=subprocess.STDOUT, start_new_session=True)
        congelado = False
        while p.poll() is None:
            time.sleep(5)
            l, s = libre(), swap_mb()
            if l < LIBRE_KILL or s - swap0 > SWAP_KILL_MB or time.time() - inicio > TIMEOUT[tipo]:
                log(f"✗ MATADA por seguridad: {linea} · {estado()} · swap +{(s - swap0) / 1024:.1f} GB")
                os.killpg(p.pid, signal.SIGKILL)
                p.wait()
                time.sleep(300)  # que el sistema recupere memoria
                return False
            if caliente() and not congelado:
                log("❄ aviso térmico: tarea congelada hasta que enfríe")
                os.killpg(p.pid, signal.SIGSTOP)
                congelado = True
            elif congelado and not caliente():
                log("▶ temperatura normal: tarea reanudada")
                os.killpg(p.pid, signal.SIGCONT)
                congelado = False
        ok = p.returncode == 0
        log(f"{'✓' if ok else '✗'} {linea} ({(time.time() - inicio) / 60:.1f} min)")
        if ok:  # se apunta antes de la pausa: si se reinicia durante la pausa, no se repite
            with open(HECHO, "a") as f:
                f.write(linea + "\n")
        return ok
    finally:
        LOCK.rmdir() if LOCK.exists() else None
        time.sleep(PAUSA_TRAS[tipo])


def main() -> None:
    HECHO.touch()
    COLA.touch()
    log(f"=== orquestador arranca (pid {os.getpid()}) · {estado()}")
    intentos: dict[str, int] = {}
    while True:
        hecho = set(HECHO.read_text().splitlines())
        pendientes = [
            l.strip() for l in COLA.read_text().splitlines()
            if l.strip() and not l.strip().startswith("#") and l.strip() not in hecho and intentos.get(l.strip(), 0) < MAX_INTENTOS
        ]
        if not pendientes:
            if "--hasta-vaciar" in sys.argv:
                log("=== cola vacía: el orquestador termina (--hasta-vaciar)")
                break
            time.sleep(120)  # la cola puede crecer mientras tanto
            continue
        linea = pendientes[0]
        if not ejecutar(linea):
            intentos[linea] = intentos.get(linea, 0) + 1
            if intentos[linea] >= MAX_INTENTOS:
                log(f"‼ abandonada tras {MAX_INTENTOS} intentos: {linea}")


if __name__ == "__main__":
    main()
