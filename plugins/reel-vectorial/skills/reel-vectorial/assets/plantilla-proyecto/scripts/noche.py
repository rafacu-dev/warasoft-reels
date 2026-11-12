#!/usr/bin/env python3
"""Cola de tareas pesadas con control de recursos (skill reel-vectorial).

Por qué existe: un render de Remotion, un generador de imágenes o un modelo de voz local se comen la memoria.
Dos a la vez pueden colgar o reiniciar un portátil (pasó en el equipo donde nació este kit: el sistema mató
procesos por falta de memoria y acabó reiniciándose). Regla de oro: UNA tarea pesada cada vez, y solo cuando hay
recursos.

Cómo funciona:
  · Lee la cola `noche-cola.txt` (una tarea por línea; se puede ampliar mientras corre) y apunta lo hecho en
    `noche-hecho.txt`. Si se reinicia, continúa donde lo dejó.
  · Antes de cada tarea espera a que haya memoria libre, poca carga, sin aviso térmico y con el cargador puesto
    (o batería > 50 %). Si existe el archivo `PAUSA`, no empieza nada nuevo.
  · Mientras corre una tarea la vigila cada 5 s: si la memoria libre baja del 15 % o el swap crece más de 3 GB,
    la mata y la reintenta más tarde. Si hay aviso térmico, la congela (SIGSTOP) hasta que se enfríe.
  · Entre tareas deja enfriar la máquina. Remotion renderiza con concurrencia 2.
  · Las comprobaciones manuales pesadas usan el mismo candado: `scripts/turno.sh <comando>`.
  · El candado (`recursos/turno-mac.lock` en la raíz del proyecto, o REELS_LOCK) es común a todas las cuentas.
  · Pensado para macOS (memory_pressure, pmset, sysctl). En Linux lee /proc y /sys; sin datos, no espera por
    ellos. En Windows, usa WSL.

Tareas:
  render <Composición> <nombre>       render + master a videos/borradores/<nombre>_v1.mp4 (+ copia móvil)
  portada <IdStill> <nombre>          videos/borradores/<nombre>_portada.png
  # comentario
Una línea con sufijo " rN" (r2, r3…) es una repetición: el sufijo se ignora al ejecutarla.

Uso (desde produccion/remotion):
  macOS: caffeinate -i python3 scripts/noche.py --hasta-vaciar      (caffeinate evita que el Mac duerma)
  Linux: python3 scripts/noche.py --hasta-vaciar
  --hasta-vaciar: termina al quedarse sin tareas (si no, sigue esperando líneas nuevas).
"""
import os
import platform
import re
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # produccion/remotion
OUT = ROOT.parent.parent / "videos" / "borradores"
COLA, HECHO, LOG, PAUSA = (ROOT / n for n in ("noche-cola.txt", "noche-hecho.txt", "noche.log", "PAUSA"))
PROYECTO = ROOT.parents[3]  # remotion → produccion → cuenta → cuentas → raíz del proyecto
LOCK = Path(os.environ["REELS_LOCK"]) if os.environ.get("REELS_LOCK") else PROYECTO / "recursos" / "turno-mac.lock"
TMP = Path(os.environ.get("TMPDIR", "/tmp"))
MAC = platform.system() == "Darwin"

LIBRE_MIN = {"render": 45, "portada": 40}  # % de memoria libre para empezar
LIBRE_KILL = 15  # % libre por debajo del cual se mata la tarea
SWAP_KILL_MB = 3000  # crecimiento de swap durante una tarea que obliga a matarla
CARGA_MAX = max(4.0, (os.cpu_count() or 8) * 0.7)  # carga media de 1 min
PAUSA_TRAS = {"render": 150, "portada": 30}
TIMEOUT = {"render": 60 * 60, "portada": 10 * 60}
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


def meminfo() -> dict:
    try:
        return {l.split(":")[0]: int(l.split()[1]) for l in Path("/proc/meminfo").read_text().splitlines() if l.split()[1:]}
    except Exception:
        return {}


def libre() -> int:
    if MAC:
        m = re.search(r"free percentage:\s*(\d+)%", sh("memory_pressure"))
        return int(m.group(1)) if m else 100
    mi = meminfo()
    if mi.get("MemTotal"):
        return int(mi.get("MemAvailable", mi["MemTotal"]) * 100 / mi["MemTotal"])
    return 100  # sin datos: no se espera por memoria


def swap_mb() -> float:
    if MAC:
        m = re.search(r"used = ([\d.]+)M", sh("sysctl vm.swapusage"))
        return float(m.group(1)) if m else 0.0
    mi = meminfo()
    return (mi.get("SwapTotal", 0) - mi.get("SwapFree", 0)) / 1024


def carga() -> float:
    try:
        return os.getloadavg()[0]
    except OSError:
        return 0.0


def caliente() -> bool:
    if not MAC:
        return False
    t = sh("pmset -g therm")
    if "No thermal warning level has been recorded" in t and "No performance warning level has been recorded" in t:
        return False
    lim = re.search(r"CPU_Speed_Limit\s*=\s*(\d+)", t)
    return bool(re.search(r"(thermal|performance) warning level\s*[=:]?\s*[1-9]", t, re.I)) or bool(lim and int(lim.group(1)) < 90)


def bateria_ok() -> tuple[bool, str]:
    if MAC:
        b = sh("pmset -g batt")
        if "AC Power" in b or "%" not in b:
            return True, "AC"
        m = re.search(r"(\d+)%", b)
        pct = int(m.group(1)) if m else 100
        return pct > 50, f"batería {pct}%"
    for bat in Path("/sys/class/power_supply").glob("BAT*"):
        try:
            estado = (bat / "status").read_text().strip()
            pct = int((bat / "capacity").read_text().strip())
        except Exception:
            continue
        if estado == "Discharging":
            return pct > 50, f"batería {pct}%"
    return True, "AC"


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
    if tipo == "render":
        comp, nombre = t[1], t[2]
        raw = TMP / f"{nombre}-raw.mp4"
        return (
            f'set -o pipefail; cd "{ROOT}" && mkdir -p "{OUT}" && npx remotion render {comp} "{raw}" --log=error --concurrency=2 2>&1 | {SIN_PROGRESO} && '
            f'python3 scripts/master.py "{raw}" "{OUT / (nombre + "_v1.mp4")}" && rm -f "{raw}"'
        )
    if tipo == "portada":
        return f'set -o pipefail; cd "{ROOT}" && mkdir -p "{OUT}" && npx remotion still {t[1]} "{OUT / (t[2] + "_portada.png")}" --log=error 2>&1 | {SIN_PROGRESO}'
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
    t = re.sub(r" r\d+$", "", linea).split()  # " r2" marca una repetición: no forma parte de la tarea
    tipo = t[0]
    if tipo not in LIBRE_MIN or len(t) < 3:
        log(f"‼ línea no válida (se ignora): {linea}")
        with open(HECHO, "a") as f:
            f.write(linea + "\n")
        return True
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
        try:
            LOCK.rmdir()
        except OSError:
            pass
        time.sleep(PAUSA_TRAS.get(tipo, 30))


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
