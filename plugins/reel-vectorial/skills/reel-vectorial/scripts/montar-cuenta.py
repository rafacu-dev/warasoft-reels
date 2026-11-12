#!/usr/bin/env python3
"""Monta o actualiza el kit vectorial (skill reel-vectorial) en una cuenta del proyecto.

El proyecto es la carpeta donde trabajas con Claude Code (la que contiene, o va a contener, `cuentas/`).
Se cambia con --proyecto <ruta> o con la variable REELS_PROYECTO.

  montar-cuenta.py <cuenta> --handle @nombre [--sin-demo] [--sin-npm] [--proyecto <ruta>]
      Cuenta nueva. <cuenta> es el nombre de la carpeta (p. ej. curiosidades) o cuentas/<nombre>. No pisa nada:
      · crea cuentas/<nombre>/ con contexto.md, estilo.md, tono-de-voz.md e ideas.md para rellenar (si no existen),
        guiones/, referencias/, assets/logos/ y videos/borradores|finales/movil;
      · copia en produccion/remotion/ el proyecto de Remotion de la skill (assets/plantilla-proyecto/): versiones
        fijadas, el motor, el kit (src/kit/), el grano (public/kit/), brand.tsx con una paleta neutra y un
        protagonista provisional, y los scripts (cola noche.py + turno.sh, voz, master, auditoría, fotogramas…);
      · el video de ejemplo Demo01 con voz simulada, ya registrado (salvo --sin-demo);
      · produccion/ficha-reel.md para rellenar con el usuario;
      · en la raíz del proyecto: recursos/ (candado de la cola), .gitignore y un .env vacío (chmod 600) para las
        claves de ElevenLabs, si no existen. El .env nunca se lee ni se imprime;
      · node_modules: lo clona de otra cuenta del proyecto con el mismo package-lock.json (en macOS, clon APFS que
        no ocupa espacio) o ejecuta `npm ci` (necesita internet). --sin-npm no instala nada.

  montar-cuenta.py <cuenta> --actualizar [--handle @nombre] [--forzar-motor] [--proyecto <ruta>]
      Cuenta que ya tiene produccion/remotion (de una versión anterior de este kit o de otro formato):
      · sincroniza lo que es de la skill: src/kit/, src/engine/Reel.tsx, src/Parallax.tsx, public/kit/ y scripts/.
        Un archivo que la cuenta no ha tocado desde que se montó (lo dice .reel-vectorial.json) se sustituye; uno
        con cambios propios se respeta y la versión nueva queda al lado como <archivo>.kit-nuevo para fusionarla a
        mano. Si no hay registro, el kit y los scripts se sustituyen y el motor se respeta (salvo --forzar-motor,
        que guarda el anterior como Reel.tsx.antes-AAAAMMDD);
      · añade a brand.tsx lo que le falte (HANDLE, PAL, KEY, PROTA) sin cambiar lo que ya hay;
      · crea lo que falte (carpetas, ficha-reel.md, cola) e instala las dependencias npm que falten.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _comun import MAC, SKILL, carpeta_cuenta, fallo, raiz_proyecto, sacar_opcion  # noqa: E402

sys.stdout.reconfigure(line_buffering=True)
PLANTILLA = SKILL / "assets" / "plantilla-proyecto"
PLANTILLA_CUENTA = SKILL / "assets" / "plantilla-cuenta"
REGISTRO = ".reel-vectorial.json"
# Lo que es de la skill (se sincroniza con --actualizar). Lo demás es de la cuenta y no se toca al actualizar.
PROPIOS = ("src/kit/", "public/kit/", "scripts/", "src/engine/Reel.tsx", "src/Parallax.tsx")
# Sin registro (cuenta montada por otra herramienta), solo esto se sustituye sin preguntar; los scripts compartidos
# (cola, voz, master…) y Parallax se respetan, y el motor también salvo --forzar-motor.
SIEMPRE_DEL_KIT = ("src/kit/", "public/kit/", "scripts/auditar-escenas.py", "scripts/voz-simulada.py", "scripts/stills.mjs")
DEMO = ("src/videos/Demo01.tsx", "vo-demo01.txt")
SFX_OK = ["impacto.mp3", "impacto-grave.mp3", "pop-grave.mp3", "moneda-suave.mp3", "monedas-suave.mp3"]
# Dependencias npm que el kit necesita además de Remotion (versión fijada: las 0.0.x cambian sin avisar)
DEPENDENCIAS = {"@paper-design/shaders-react": "0.0.82"}  # src/kit/shaders.tsx

ROOT_DEMO = """import React from "react";
import { Composition, Still } from "remotion";
import { Demo01, PortadaDemo01, TOTAL_DEMO01 } from "./videos/Demo01";

// Cada video se registra con: nuevo-video.py registrar (solo cuando ya tiene voz, real o simulada)
export const Root: React.FC = () => (
  <>
    <Composition id="Demo01-tostada" component={Demo01} durationInFrames={TOTAL_DEMO01} fps={30} width={1080} height={1920} />
    <Still id="Portada-Demo01" component={PortadaDemo01} width={1080} height={1920} />
  </>
);
"""
PAL_DEFECTO = """export const PAL = {
  cyan: "#3FD9FF",
  cyanCore: "#E8FCFF",
  gold: "#FFC53D",
  goldCore: "#FFF7DA",
  red: "#FF4D5E",
  redCore: "#FFE1E4",
  green: "#38D27E",
  greenCore: "#E2FFEE",
  ink: "#16182A",
  navy: "#0A1030",
  cream: "#FFF4DE",
};"""
PROTA_DEFECTO = """export const PROTA = {
  head: "#F2C9A0",
  headShade: "#D9A67A",
  skin: "#F2C9A0",
  body: "#2F6BFF",
  bodyShade: "#1F4CC9",
  hair: "spiky" as "curl" | "spiky" | "none",
  hairColor: "#3A2A22",
}; // POR DEFINIR con el usuario: el protagonista de la cuenta"""
ENV_VACIO = """# Claves de ElevenLabs para todas las cuentas del proyecto (una cuenta puede tener las suyas en
# cuentas/<cuenta>/produccion/remotion/.env). Pégalas tú aquí: nunca en el chat ni en un archivo que se suba.
# ELEVENLABS_API_KEY_2, _3… son claves de otras cuentas de ElevenLabs que se usan cuando la anterior se queda
# sin saldo. ELEVENLABS_VOICE_ID: elígela con `node scripts/voz-elevenlabs.mjs --voces` (p. ej. la voz "Bill").
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
"""
GITIGNORE = """.env
.env.*
node_modules/
noche.log
PAUSA
recursos/turno-mac.lock/
recursos/papelera/
.DS_Store
"""


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def archivos_plantilla() -> list[str]:
    return sorted(str(f.relative_to(PLANTILLA)) for f in PLANTILLA.rglob("*") if f.is_file() and f.name != ".DS_Store")


def es_propio(rel: str) -> bool:
    return any(rel == p or (p.endswith("/") and rel.startswith(p)) for p in PROPIOS)


def leer_registro(R: Path) -> dict:
    try:
        return json.loads((R / REGISTRO).read_text())
    except Exception:
        return {}


def escribir_registro(R: Path, hashes: dict) -> None:
    (R / REGISTRO).write_text(json.dumps({"kit": "reel-vectorial", "fecha": time.strftime("%Y-%m-%d"), "archivos": hashes}, indent=1, ensure_ascii=False) + "\n")


def copiar(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def requisitos() -> list[str]:
    avisos = []
    if sys.version_info < (3, 10):
        avisos.append(f"Python {sys.version.split()[0]}: hace falta 3.10 o más")
    node = shutil.which("node")
    if not node:
        avisos.append("falta Node.js 20 o más (https://nodejs.org)")
    else:
        v = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip().lstrip("v")
        if v and int(v.split(".")[0]) < 20:
            avisos.append(f"Node {v}: hace falta 20 o más")
    if not shutil.which("ffmpeg"):
        avisos.append("falta ffmpeg (macOS: brew install ffmpeg · Debian/Ubuntu: sudo apt install ffmpeg)")
    return avisos


# ---------------------------------------------------------------- cuenta y proyecto
def esqueleto_cuenta(c: Path, handle: str) -> list[str]:
    hecho = []
    c.mkdir(parents=True, exist_ok=True)
    for f in sorted(PLANTILLA_CUENTA.glob("*.md")):
        if not (c / f.name).exists():
            (c / f.name).write_text(f.read_text().replace("@HANDLE", handle))
            hecho.append(f"+ {f.name}")
    for d in ("guiones", "referencias", "assets/logos", "videos/borradores/movil", "videos/finales/movil"):
        (c / d).mkdir(parents=True, exist_ok=True)
    return hecho


def base_proyecto(P: Path) -> list[str]:
    hecho = []
    (P / "recursos").mkdir(parents=True, exist_ok=True)
    env = P / ".env"
    if not env.exists() and not env.is_symlink():
        fd = os.open(env, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(ENV_VACIO)
        hecho.append(f"+ {env} (vacío, chmod 600: el usuario pega allí sus claves)")
    gi = P / ".gitignore"
    if not gi.exists():
        gi.write_text(GITIGNORE)
        hecho.append(f"+ {gi}")
    elif ".env" not in gi.read_text().split():
        hecho.append(f"⚠ {gi} no ignora .env: añádelo antes de subir el proyecto a ningún sitio")
    return hecho


def ficha(c: Path, handle: str) -> list[str]:
    f = c / "produccion" / "ficha-reel.md"
    if f.exists():
        return []
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text((SKILL / "assets" / "ficha-reel-plantilla.md").read_text().replace("@HANDLE", handle))
    return ["+ produccion/ficha-reel.md (rellenar con el usuario)"]


def audio_compartido(R: Path, P: Path) -> list[str]:
    """Efectos permitidos y música que ya existan en el proyecto (recursos/ u otras cuentas): se copian si faltan."""
    hecho = []
    for nombre in SFX_OK:
        dst = R / "public" / "sfx-pro" / nombre
        if dst.exists():
            continue
        candidatos = [P / "recursos" / "sfx" / nombre, *sorted((P / "cuentas").glob(f"*/produccion/remotion/public/sfx-pro/{nombre}"))]
        src = next((x for x in candidatos if x.exists() and x.resolve() != dst.resolve()), None)
        if src:
            copiar(src, dst)
            hecho.append(f"+ public/sfx-pro/{nombre}")
    for m in sorted((P / "recursos" / "musica").glob("*.mp3")):
        dst = R / "public" / "music" / m.name
        if not dst.exists():
            copiar(m, dst)
            hecho.append(f"+ public/music/{m.name}")
    return hecho


# ---------------------------------------------------------------- node_modules
def huella_lock(f: Path) -> str:
    """Huella de package-lock.json sin el nombre del paquete (que cambia de una cuenta a otra)."""
    try:
        d = json.loads(f.read_text())
        d.pop("name", None)
        d.get("packages", {}).get("", {}).pop("name", None)
        return hashlib.sha256(json.dumps(d, sort_keys=True).encode()).hexdigest()
    except Exception:
        return ""


def node_modules(R: Path, P: Path) -> str:
    if (R / "node_modules").exists():
        return "node_modules ya estaba"
    lock = huella_lock(R / "package-lock.json")
    for otra in sorted((P / "cuentas").glob("*/produccion/remotion")):
        if otra.resolve() == R.resolve() or not (otra / "node_modules").is_dir() or (otra / "node_modules").is_symlink():
            continue
        if not lock or huella_lock(otra / "package-lock.json") != lock:
            continue
        if MAC:  # clon APFS: copia instantánea que no ocupa espacio hasta que algo cambie
            r = subprocess.run(["cp", "-Rc", str(otra / "node_modules"), str(R / "node_modules")], capture_output=True, text=True)
            if r.returncode == 0:
                return f"node_modules clonado de {otra.parent.parent.name} (APFS)"
            shutil.rmtree(R / "node_modules", ignore_errors=True)  # clon a medias (lo acabamos de crear nosotros)
    print("· instalando dependencias con npm ci (la primera vez tarda unos minutos)…")
    r = subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=R, capture_output=True, text=True)
    if r.returncode == 0:
        return "node_modules instalado con npm ci"
    return f"✗ npm ci falló ({r.stderr.strip()[-300:]}). Ejecútalo a mano en {R}"


def dependencias(R: Path) -> list[str]:
    if not (R / "node_modules").exists():
        return ["⚠ sin node_modules: ejecuta `npm install` en produccion/remotion"]
    pkg = json.loads((R / "package.json").read_text())
    tiene = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    faltan = [f"{n}@{v}" for n, v in DEPENDENCIAS.items() if tiene.get(n) != v or not (R / "node_modules" / n).exists()]
    if not faltan:
        return []
    r = subprocess.run(["npm", "install", "--save-exact", "--no-audit", "--no-fund", *faltan], cwd=R, capture_output=True, text=True)
    if r.returncode != 0:
        return [f"✗ npm install {' '.join(faltan)} falló: {r.stderr.strip()[-300:]}"]
    return [f"+ npm: {', '.join(faltan)}"]


def tsc(R: Path) -> str:
    if not (R / "node_modules" / "typescript").exists():
        return "sin comprobar (falta node_modules)"
    t = subprocess.run(["npx", "tsc", "--noEmit", "-p", "."], cwd=R, capture_output=True, text=True)
    return "sin errores" if t.returncode == 0 else "ERRORES →\n" + t.stdout[-1500:]


# ---------------------------------------------------------------- montar
def montar(c: Path, P: Path, handle: str, demo: bool, npm: bool) -> None:
    if not re.fullmatch(r"@[a-z0-9._]+", handle):
        fallo("el handle va con @ y en minúsculas (p. ej. @micuenta)")
    if not re.fullmatch(r"[A-Za-z0-9._-]+", c.name):
        fallo("el nombre de la carpeta de la cuenta va sin espacios ni acentos (p. ej. curiosidades)")
    R = c / "produccion" / "remotion"
    if (R / "src").exists():
        fallo(f"{R} ya tiene un proyecto de Remotion: usa --actualizar")
    for a in requisitos():
        print(f"⚠ {a}")
    hecho = esqueleto_cuenta(c, handle) + base_proyecto(P)
    hashes = {}
    for rel in archivos_plantilla():
        if not demo and rel in DEMO:
            continue
        dst = R / rel
        if dst.exists():
            continue
        if rel == "src/brand.tsx":
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text((PLANTILLA / rel).read_text().replace("@HANDLE", handle))
        elif rel in ("package.json", "package-lock.json"):
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(re.sub(r'"name": "reels-cuenta"', f'"name": "reels-{c.name.lower()}"', (PLANTILLA / rel).read_text()))
        else:
            copiar(PLANTILLA / rel, dst)
        if es_propio(rel):
            hashes[rel] = sha(dst)
    for s in (R / "scripts").iterdir():
        if s.suffix in (".py", ".sh"):
            s.chmod(0o755)
    for d in ("public/vo", "public/music", "public/sfx-pro", "src/videos"):
        (R / d).mkdir(parents=True, exist_ok=True)
    for f in ("noche-cola.txt", "noche-hecho.txt"):
        (R / f).touch()
    escribir_registro(R, hashes)
    hecho += ficha(c, handle) + audio_compartido(R, P)

    demo_msg = "sin demo (--sin-demo)"
    if demo:
        r = subprocess.run(["python3", "scripts/voz-simulada.py", "demo01"], cwd=R, capture_output=True, text=True)
        if r.returncode == 0:
            (R / "src" / "Root.tsx").write_text(ROOT_DEMO)
            demo_msg = "Demo01 con voz simulada, registrado como Demo01-tostada y Portada-Demo01"
        else:
            demo_msg = f"⚠ la voz simulada de la demo falló (¿ffmpeg?): {r.stdout.strip()[-200:]} {r.stderr.strip()[-200:]}. Root.tsx queda vacío"

    nm = "node_modules sin instalar (--sin-npm): ejecuta `npm ci` en produccion/remotion" if not npm else node_modules(R, P)
    print(f"✓ kit vectorial montado en {R}")
    for l in hecho:
        print(f"  {l}")
    print(f"· {nm}\n· {demo_msg}\n· TypeScript: {tsc(R)}")
    print("Falta a mano con el usuario (references/cuenta-nueva.md):")
    print("  1. contexto.md, estilo.md y tono-de-voz.md de la cuenta (entrevista corta)")
    print("  2. src/brand.tsx: paleta C, colores con significado PAL/KEY, protagonista PROTA y Logo")
    print("  3. produccion/ficha-reel.md: series, mundo, protagonista, voz, música, CTA y cuidado legal")
    print(f"  4. claves de ElevenLabs en {P / '.env'} (las pega el usuario; sin ellas, voz simulada)")


# ---------------------------------------------------------------- actualizar
def completar_brand(R: Path, handle: str | None) -> list[str]:
    brand = R / "src" / "brand.tsx"
    b = brand.read_text()
    falta = lambda n: not re.search(rf"export const {n}\b", b)
    añadir, avisos = [], []
    if falta("HANDLE"):
        if not handle:
            fallo("brand.tsx no tiene HANDLE: pásalo con --handle @nombre")
        añadir.append(f'export const HANDLE = "{handle}";')
        avisos.append(f"+ HANDLE = {handle}")
    if falta("PAL"):
        añadir.append("// Colores con significado para los gráficos del kit (cada video decide qué es cada uno)\n" + PAL_DEFECTO)
        avisos.append("+ PAL (colores con significado; revísalos con estilo.md)")
    if falta("KEY"):
        añadir.append("// Píldoras de los subtítulos\nexport const KEY = { cyan: PAL.cyan, gold: PAL.gold, red: PAL.red, green: PAL.green };")
        avisos.append("+ KEY (colores de las píldoras de los subtítulos)")
    if falta("PROTA"):
        añadir.append(PROTA_DEFECTO)
        avisos.append("+ PROTA (protagonista: POR DEFINIR con el usuario)")
    for n in ("FONT", "C", "Logo", "clamp"):
        if falta(n):
            avisos.append(f"⚠ brand.tsx no exporta {n}: el motor lo necesita (mira assets/plantilla-proyecto/src/brand.tsx)")
    if not re.search(r"export type Palabra\b", b):
        avisos.append("⚠ brand.tsx no exporta el tipo Palabra: el motor lo necesita")
    if añadir:
        brand.write_text(b.rstrip() + "\n\n// --- añadido por reel-vectorial (montar-cuenta.py --actualizar) ---\n" + "\n".join(añadir) + "\n")
    return avisos


def actualizar(c: Path, P: Path, handle: str | None, forzar_motor: bool) -> None:
    R = c / "produccion" / "remotion"
    if not (R / "src" / "brand.tsx").exists():
        fallo(f"{c} no tiene produccion/remotion/src/brand.tsx: para una cuenta nueva usa --handle sin --actualizar")
    registro = leer_registro(R).get("archivos", {})
    hashes, cambios = dict(registro), []
    for rel in archivos_plantilla():
        if not es_propio(rel):
            continue
        src, dst = PLANTILLA / rel, R / rel
        nuevo = sha(src)
        if not dst.exists():
            copiar(src, dst)
            hashes[rel] = nuevo
            cambios.append(f"+ {rel}")
            continue
        actual = sha(dst)
        if actual == nuevo:
            hashes[rel] = nuevo
            continue
        sin_tocar = registro.get(rel) == actual
        del_kit = any(rel == k or (k.endswith("/") and rel.startswith(k)) for k in SIEMPRE_DEL_KIT)
        if sin_tocar or (rel not in registro and del_kit):
            copiar(src, dst)
            hashes[rel] = nuevo
            cambios.append(f"✓ {rel}")
        elif rel == "src/engine/Reel.tsx" and forzar_motor:
            copia = dst.with_name(f"Reel.tsx.antes-{time.strftime('%Y%m%d-%H%M%S')}")
            shutil.copy2(dst, copia)
            copiar(src, dst)
            hashes[rel] = nuevo
            cambios.append(f"✓ motor sustituido (el anterior queda en {copia.name}): compara un fotograma de un video viejo antes y después")
        elif rel in registro or rel == "src/engine/Reel.tsx":
            lado = dst.with_name(dst.name + ".kit-nuevo")
            copiar(src, lado)
            cambios.append(f"⚠ {rel} tiene cambios propios: no lo toco. Versión nueva en {lado.name}; fusiónala a mano (diff -u)")
        else:
            cambios.append(f"· {rel}: la cuenta tiene su propia versión (de otro formato); se respeta")
    for s in (R / "scripts").iterdir():
        if s.suffix in (".py", ".sh"):
            s.chmod(0o755)
    avisos = completar_brand(R, handle)
    for d in ("public/vo", "public/music", "public/sfx-pro", "src/videos"):
        (R / d).mkdir(parents=True, exist_ok=True)
    for f in ("noche-cola.txt", "noche-hecho.txt"):
        (R / f).touch()
    m = re.search(r'export const HANDLE = "([^"]+)"', (R / "src" / "brand.tsx").read_text())
    h = handle or (m.group(1) if m else "@HANDLE")
    extra = esqueleto_cuenta(c, h) + base_proyecto(P) + ficha(c, h) + audio_compartido(R, P) + dependencias(R)
    escribir_registro(R, hashes)
    print(f"✓ kit vectorial actualizado en {R}")
    for l in [*cambios, *avisos, *extra] or ["= todo estaba al día"]:
        print(f"  {l}")
    print(f"· TypeScript: {tsc(R)}")


def main() -> None:
    a = sys.argv[1:]
    proyecto = sacar_opcion(a, "--proyecto")
    handle = sacar_opcion(a, "--handle")
    flags = {x for x in a if x.startswith("--")}
    pos = [x for x in a if not x.startswith("--")]
    if len(pos) != 1:
        print(__doc__)
        sys.exit(2)
    P = raiz_proyecto(proyecto)
    c = carpeta_cuenta(pos[0], P)
    if c.parent.name != "cuentas":
        fallo(f"las cuentas viven en <proyecto>/cuentas/<nombre> (recibido {c}); los scripts de la cuenta cuentan con esa estructura")
    P = c.parent.parent
    if "--actualizar" in flags:
        return actualizar(c, P, handle, "--forzar-motor" in flags)
    if not handle:
        print(__doc__)
        sys.exit(2)
    montar(c, P, handle, demo="--sin-demo" not in flags, npm="--sin-npm" not in flags)


if __name__ == "__main__":
    main()
