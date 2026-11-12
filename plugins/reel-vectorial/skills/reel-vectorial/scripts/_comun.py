"""Utilidades comunes de los scripts de la skill reel-vectorial: raíz del proyecto, cuentas y papelera.

Raíz del proyecto (la carpeta que contiene `cuentas/`), por este orden:
  1. --proyecto <ruta> en la línea de órdenes;
  2. la variable de entorno REELS_PROYECTO;
  3. la carpeta actual o la primera carpeta superior que tenga `cuentas/`;
  4. la carpeta actual (donde se abrió Claude Code), aunque aún no tenga `cuentas/`.
"""
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
MAC = platform.system() == "Darwin"


def fallo(msg: str) -> None:
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def sacar_opcion(args: list[str], nombre: str) -> str | None:
    """Quita `nombre valor` de args (si está) y devuelve el valor."""
    if nombre in args:
        i = args.index(nombre)
        if i + 1 >= len(args):
            fallo(f"{nombre} necesita un valor")
        valor = args[i + 1]
        del args[i : i + 2]
        return valor
    return None


def raiz_proyecto(explicita: str | None = None) -> Path:
    if explicita:
        return Path(explicita).expanduser().resolve()
    if os.environ.get("REELS_PROYECTO"):
        return Path(os.environ["REELS_PROYECTO"]).expanduser().resolve()
    aqui = Path.cwd().resolve()
    for d in (aqui, *aqui.parents):
        if (d / "cuentas").is_dir():
            return d
    return aqui


def carpeta_cuenta(cuenta: str, proyecto: Path) -> Path:
    """`nombre`, `cuentas/nombre` o una ruta (absoluta o relativa a la carpeta actual) → carpeta de la cuenta."""
    c = Path(cuenta).expanduser()
    if c.is_absolute():
        return c.resolve()
    if (Path.cwd() / c / "contexto.md").exists():
        return (Path.cwd() / c).resolve()
    if len(c.parts) == 1:
        return (proyecto / "cuentas" / c).resolve()
    return (proyecto / c).resolve()


def proyecto_de(cuenta: Path) -> Path:
    """La raíz del proyecto de una cuenta (cuentas/<cuenta> → raíz)."""
    return cuenta.parent.parent if cuenta.parent.name == "cuentas" else cuenta.parent


def a_papelera(p: Path) -> str:
    """Manda un archivo o carpeta a la papelera del sistema; nunca borra. Si no hay papelera disponible, lo mueve a
    <proyecto>/recursos/papelera/. Devuelve dónde quedó."""
    for cmd in (["/usr/bin/trash"], ["trash"], ["gio", "trash"], ["trash-put"]):
        if Path(cmd[0]).is_absolute() and not Path(cmd[0]).exists():
            continue
        if not Path(cmd[0]).is_absolute() and not shutil.which(cmd[0]):
            continue
        r = subprocess.run([*cmd, str(p)], capture_output=True, text=True)
        if r.returncode == 0:
            return "la Papelera"
    # sin papelera del sistema: a una carpeta del proyecto (se vacía a mano)
    base = p.resolve()
    raiz = next((d for d in base.parents if (d / "cuentas").is_dir()), base.parent)
    destino = raiz / "recursos" / "papelera" / f"{time.strftime('%Y%m%d-%H%M%S')}-{p.name}"
    destino.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(p), str(destino))
    return str(destino)


def comando_orquestador() -> str:
    """Cómo lanzar la cola en este sistema (caffeinate solo existe en macOS)."""
    return ("caffeinate -i " if MAC and shutil.which("caffeinate") else "") + "python3 scripts/noche.py --hasta-vaciar"


def python_whisper() -> str:
    """Python con transformers para comprobar-voz.py: REELS_WHISPER_PY, ~/.venvs/whisper o python3."""
    if os.environ.get("REELS_WHISPER_PY"):
        return os.environ["REELS_WHISPER_PY"]
    v = Path.home() / ".venvs" / "whisper" / "bin" / "python"
    return str(v) if v.exists() else "python3"
