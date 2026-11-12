"""Utilidades comunes de los scripts de la skill reel-diorama (proyecto, cuenta, turno, papelera)."""
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
PLANTILLA = SKILL / "assets" / "plantilla-proyecto"
VENV = Path(os.environ.get("REELS_IMG_VENV", "~/imggen/.venv")).expanduser()


def fallo(msg: str) -> None:
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def opcion(args: list[str], nombre: str, defecto: str | None = None) -> str | None:
    """Valor de `--nombre valor` (y lo quita de args)."""
    if nombre in args:
        i = args.index(nombre)
        if i + 1 >= len(args):
            fallo(f"{nombre} necesita un valor")
        valor = args[i + 1]
        del args[i : i + 2]
        return valor
    return defecto


def proyecto(explicito: str | None = None) -> Path:
    """Raíz del proyecto (la carpeta que contiene cuentas/): --proyecto, REELS_PROYECTO o la carpeta actual
    (o la primera de sus carpetas padre que tenga cuentas/)."""
    p = explicito or os.environ.get("REELS_PROYECTO")
    if p:
        return Path(p).expanduser().resolve()
    cwd = Path.cwd().resolve()
    for c in (cwd, *cwd.parents):
        if (c / "cuentas").is_dir():
            return c
    return cwd


def cuenta(arg: str, proy: Path) -> Path:
    """Carpeta de la cuenta: ruta absoluta, `cuentas/<nombre>` o solo `<nombre>`."""
    c = Path(arg).expanduser()
    if c.is_absolute():
        return c.resolve()
    if c.parts and c.parts[0] == "cuentas":
        return (proy / c).resolve()
    if (Path.cwd() / c / "contexto.md").exists():
        return (Path.cwd() / c).resolve()
    return (proy / "cuentas" / c).resolve()


def remotion_de(c: Path) -> Path:
    R = c / "produccion" / "remotion"
    if not (R / "src" / "engine" / "Reel.tsx").exists():
        fallo(f"{c} no tiene el kit (falta produccion/remotion/src/engine/Reel.tsx). Móntalo con montar-cuenta.py.")
    return R


def candado(R: Path) -> Path:
    """El mismo candado que scripts/turno.sh y scripts/noche.py de la cuenta."""
    return Path(os.environ.get("REELS_TURNO_LOCK") or R.parents[3] / "recursos" / "turno-mac.lock")


def turno_ocupado(R: Path) -> bool:
    lock = candado(R)
    return lock.exists() and time.time() - lock.stat().st_mtime < 3 * 3600


def tsc(R: Path) -> None:
    """Comprueba TypeScript por el turno del Mac, pero solo si está libre: nunca compite con la cola ni la espera."""
    if not (R / "node_modules" / "typescript").exists():
        print("· TypeScript sin comprobar: faltan las dependencias (npm ci en produccion/remotion)")
        return
    if turno_ocupado(R):
        print("· TypeScript sin comprobar: la cola tiene el turno. Compruébalo luego con scripts/turno.sh npx tsc --noEmit -p .")
        return
    r = subprocess.run([str(R / "scripts" / "turno.sh"), "npx", "tsc", "--noEmit", "-p", "."], cwd=R, capture_output=True, text=True)
    print("✓ TypeScript sin errores" if r.returncode == 0 else f"✗ TypeScript:\n{(r.stdout + r.stderr)[-2500:]}")


def a_papelera(p: Path) -> None:
    """Nunca se borra con rm: a la Papelera (con /usr/bin/trash si existe; si no, se mueve a ~/.Trash)."""
    if not p.exists():
        return
    if Path("/usr/bin/trash").exists():
        r = subprocess.run(["/usr/bin/trash", str(p)], capture_output=True, text=True)
        if r.returncode == 0:
            return
    destino = Path.home() / ".Trash" / f"{p.name}-{time.strftime('%Y%m%d-%H%M%S')}"
    try:
        shutil.move(str(p), destino)
    except OSError as e:
        fallo(f"no pude mandar {p} a la Papelera ({e}): muévelo a mano")
