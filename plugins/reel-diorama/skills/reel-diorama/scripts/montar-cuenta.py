#!/usr/bin/env python3
"""Crea una cuenta (si no existe) y le monta el kit de reels "diorama nocturno" desde la plantilla de la skill.

Uso: montar-cuenta.py <cuenta> --handle @nombre [--proyecto RUTA] [--sin-demo] [--sin-npm]

  <cuenta>      nombre de la carpeta (p. ej. mi-cuenta), `cuentas/mi-cuenta` o una ruta absoluta.
  --proyecto    raíz del proyecto (la carpeta con cuentas/). Por defecto: REELS_PROYECTO o la carpeta actual.
  --sin-demo    no añade el video de demostración (Demo-diorama).
  --sin-npm     no instala las dependencias de Remotion (luego: npm ci en produccion/remotion).

No sobrescribe nada. Qué hace:
  · si la cuenta no existe, la crea desde cuentas/_PLANTILLA (si el proyecto la tiene) o desde la plantilla de la
    skill: contexto.md, estilo.md, tono-de-voz.md, ideas.md, referencias/, assets/, guiones/, calendario/, videos/;
  · copia el proyecto de Remotion a produccion/remotion: motor, cámara 2.5D, portada, scripts de la cola,
    voz, auditoría y master; pone la firma en brand.tsx → HANDLE;
  · crea produccion/remotion/.env vacío (chmod 600) para que el usuario pegue sus claves con un editor;
  · copia el estilo de imagen (assets/imagenes/estilo-prompt.txt) y crea produccion/ficha-reel.md para rellenar;
  · añade la demo (voz simulada y planos provisionales; sus prompts en assets/imagenes/demo/planos.tsv);
  · instala las dependencias con npm ci y comprueba TypeScript (por el turno del Mac, si está libre).
Lo que queda a mano: contexto y estilo de la cuenta, paleta y logo en brand.tsx, ficha-reel.md y las claves.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from comun import PLANTILLA, SKILL, cuenta, fallo, opcion, proyecto, tsc

ROOT_SIN_DEMO = """import React from "react";
import { Composition, Still } from "remotion";
import { Portada } from "./engine/Portada";

// Cada video se registra con: nuevo-video.py registrar (solo cuando ya tiene voz, real o simulada, y tiempos.json)
export const Root: React.FC = () => (
  <>
  </>
);
"""


def main() -> None:
    a = sys.argv[1:]
    handle = opcion(a, "--handle")
    proy = proyecto(opcion(a, "--proyecto"))
    sin_demo = "--sin-demo" in a
    sin_npm = "--sin-npm" in a
    a = [x for x in a if x not in ("--sin-demo", "--sin-npm")]
    if len(a) != 1 or not handle:
        print(__doc__)
        sys.exit(2)
    if not re.fullmatch(r"@[a-z0-9._]+", handle):
        fallo("el handle va con @ y en minúsculas (p. ej. @mi.cuenta)")
    c = cuenta(a[0], proy)
    if not re.fullmatch(r"[a-z0-9][a-z0-9._-]*", c.name):
        fallo("la carpeta de la cuenta va en minúsculas, sin espacios ni acentos (p. ej. mi-cuenta)")
    R = c / "produccion" / "remotion"
    if R.exists():
        fallo(f"{R} ya existe; no sobrescribo nada")

    # 1. La cuenta
    if not c.exists():
        origen = proy / "cuentas" / "_PLANTILLA"
        if not (origen / "contexto.md").exists():
            origen = SKILL / "assets" / "plantilla-cuenta"
        shutil.copytree(origen, c, ignore=shutil.ignore_patterns(".gitkeep", ".DS_Store"))
        ctx = c / "contexto.md"
        ctx.write_text(ctx.read_text().replace("@NOMBRE_CUENTA", handle))
        print(f"✓ cuenta creada en {c} (desde {origen.name}): falta rellenar contexto.md, estilo.md y tono-de-voz.md")
    elif not (c / "contexto.md").exists():
        fallo(f"{c} existe pero no parece una cuenta (falta contexto.md)")

    # 2. El proyecto de Remotion
    shutil.copytree(PLANTILLA, R, ignore=shutil.ignore_patterns(".DS_Store", "node_modules", "__pycache__"))
    (R / "gitignore").rename(R / ".gitignore")
    env = R / ".env"
    (R / "env.ejemplo").rename(env)
    env.chmod(0o600)
    brand = R / "src" / "brand.tsx"
    brand.write_text(re.sub(r'export const HANDLE = "[^"]*";', f'export const HANDLE = "{handle}";', brand.read_text()))
    nombre_pkg = "reels-" + re.sub(r"[^a-z0-9-]", "-", c.name)
    for f in ("package.json", "package-lock.json"):
        p = R / f
        if p.exists():
            data = json.loads(p.read_text())
            data["name"] = nombre_pkg
            if "packages" in data and "" in data["packages"]:
                data["packages"][""]["name"] = nombre_pkg
            p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    for s in (R / "scripts").iterdir():
        if s.suffix in (".sh", ".py"):
            s.chmod(0o755)
    for f in ("noche-cola.txt", "noche-hecho.txt"):
        (R / f).touch()
    if sin_demo:
        (R / "src" / "videos" / "Demo.tsx").unlink()
        shutil.rmtree(R / "public" / "vo" / "demo")
        (R / "vo-demo.txt").unlink()
        (R / "src" / "Root.tsx").write_text(ROOT_SIN_DEMO)

    # 3. Imágenes, ficha y carpetas de entrega
    img = c / "assets" / "imagenes"
    img.mkdir(parents=True, exist_ok=True)
    if not (img / "estilo-prompt.txt").exists():
        shutil.copy2(SKILL / "assets" / "estilo-prompt.txt", img / "estilo-prompt.txt")
    if not sin_demo and not (img / "demo").exists():
        (img / "demo").mkdir()
        shutil.copy2(SKILL / "assets" / "demo" / "planos.tsv", img / "demo" / "planos.tsv")
        shutil.copy2(SKILL / "assets" / "generar.sh", img / "demo" / "generar.sh")
        (img / "demo" / "generar.sh").chmod(0o755)
        (img / "demo" / "semillas.tsv").touch()
    ficha = c / "produccion" / "ficha-reel.md"
    if not ficha.exists():
        ficha.write_text((SKILL / "assets" / "ficha-reel-plantilla.md").read_text().replace("@HANDLE", handle))
    for d in ("guiones", "calendario", "videos/borradores/movil", "videos/finales/movil"):
        (c / d).mkdir(parents=True, exist_ok=True)
    (proy / "recursos").mkdir(exist_ok=True)  # aquí vive el candado del turno del Mac (turno-mac.lock)

    print(f"✓ kit montado en {R}")
    print("· .env vacío (chmod 600): el usuario pega ahí sus claves de ElevenLabs con un editor, nunca en el chat")

    # 4. Dependencias
    if sin_npm:
        print("· dependencias sin instalar: ejecuta `npm ci` en produccion/remotion")
    elif not shutil.which("npm"):
        print("✗ no encuentro npm: instala Node.js 20 o superior (https://nodejs.org) y ejecuta `npm ci` en produccion/remotion")
    else:
        print("· instalando dependencias de Remotion (npm ci)…", flush=True)
        r = subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=R, capture_output=True, text=True)
        print("✓ dependencias instaladas" if r.returncode == 0 else f"✗ npm ci falló:\n{(r.stdout + r.stderr)[-1500:]}")
    tsc(R)

    print("Siguiente (references/cuenta-nueva.md):")
    print("  1. contexto.md, estilo.md y tono-de-voz.md de la cuenta (entrevista al usuario)")
    print("  2. src/brand.tsx: paleta C, Logo y LOCALE · assets/imagenes/estilo-prompt.txt: colores de la cuenta")
    print("  3. produccion/ficha-reel.md: series, recursos fijos, moneda, música, CTA y cuidado legal")
    if not sin_demo:
        print(f'  · la demo ya se puede ver: cd "{R}" && npx remotion studio  (composición Demo-diorama)')


if __name__ == "__main__":
    main()
