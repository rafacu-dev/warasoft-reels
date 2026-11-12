#!/usr/bin/env python3
"""Andamio y tareas de un video del kit vectorial (skill reel-vectorial). Lo pesado va siempre por el turno de la
máquina (scripts/turno.sh y la cola scripts/noche.py de la cuenta).

<cuenta> es la carpeta de la cuenta: su nombre (curiosidades), cuentas/<nombre> o una ruta. El proyecto es la
carpeta actual o la primera superior que tenga cuentas/ (o --proyecto <ruta>, o la variable REELS_PROYECTO).

  nuevo-video.py crear <cuenta> <carpeta> <Componente> --serie "SERIE · #N"
      Con vo-<carpeta>.txt ya escrito y aprobado: pone voz simulada si aún no hay voz y crea
      src/videos/<Componente>.tsx con planos Pendiente(n) de ≈2 s cortados en palabras, la portada y la
      configuración. No pisa nada que exista.

  nuevo-video.py simular <cuenta> <carpeta>
      Voz simulada (silencio con un ritmo de ≈3,2 palabras/s) para montar y revisar sin gastar créditos.

  nuevo-video.py voz <cuenta> <carpeta> [--solo N]
      Voz real con ElevenLabs (la de ELEVENLABS_VOICE_ID). La genera aparte, comprueba que salió entera, compacta
      las pausas a 0,2 s y solo entonces sustituye la carpeta: la simulada va a la Papelera y una voz real anterior
      se guarda como vo/<carpeta>-anterior-AAAAMMDD-HHMM. Con --solo N rehace solo la frase N de una voz real.

  nuevo-video.py registrar <cuenta> <Componente> <IdComposición>
      Añade a src/Root.tsx la <Composition> y el <Still id="Portada-<Componente>"> (el video exporta
      Portada<Componente>). Exige tiempos.json: si Root importa un video sin voz, fallan TODOS los renders.

  nuevo-video.py stills <cuenta> <IdComposición> [--frames 0,120,…] [--salida <carpeta>]
  nuevo-video.py stills <cuenta> <IdComposición> --tira <frame>[:N]   (N fotogramas seguidos en una fila; 8 por defecto)
      Fotogramas de revisión con un solo empaquetado y en el turno de la máquina: por defecto el frame 0, la mitad
      de cada plano y el último (bucle), más hoja-<IdComposición>.jpg (hoja de contacto). Salida por defecto:
      $TMPDIR/reel-vectorial/<IdComposición>/ (mejor pasa --salida <scratchpad de la sesión>).

  nuevo-video.py cola <cuenta> render <IdComposición> <nombre> [--sin-voz]
      Añade a la cola `render` + `portada`. <nombre> = AAAA-MM-DD_serie_tema. Se niega si la voz es simulada;
      --sin-voz lo permite como vista previa muda (el nombre lleva "-sin-voz": no se entrega).

  nuevo-video.py cola <cuenta> portada <Componente> <nombre>
      Solo la portada (cuando únicamente cambió Portada<Componente>).

Una línea que ya figura en noche-hecho.txt no se vuelve a ejecutar; si hay que repetirla, el script le añade
un sufijo (r2, r3…) que el orquestador ignora.
"""
import json
import math
import os
import re
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _comun import SKILL, a_papelera, carpeta_cuenta, comando_orquestador, fallo, python_whisper, raiz_proyecto, sacar_opcion  # noqa: E402

sys.stdout.reconfigure(line_buffering=True)  # que los mensajes salgan en orden con los de los subprocesos
PROYECTO = raiz_proyecto()  # main() lo cambia si llega --proyecto
S = SKILL / "scripts"


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if not (0x300 <= ord(c) <= 0x36F))
    return re.sub(r"[^a-zñ0-9]", "", w)


def cuenta_dirs(cuenta: str) -> tuple[Path, Path]:
    c = carpeta_cuenta(cuenta, PROYECTO)
    R = c / "produccion" / "remotion"
    if not (R / "src" / "kit" / "index.ts").exists() or not (R / "src" / "engine" / "Reel.tsx").exists():
        fallo(f"{c} no tiene el kit vectorial (falta produccion/remotion/src/kit). Móntalo con montar-cuenta.py.")
    return c, R


def tsc(R: Path) -> None:
    r = subprocess.run(["npx", "tsc", "--noEmit", "-p", "."], cwd=R, capture_output=True, text=True)
    print("✓ TypeScript sin errores" if r.returncode == 0 else f"✗ TypeScript:\n{r.stdout[-2500:]}")


def trash(p: Path) -> None:
    a_papelera(p)


def lineas_vo(R: Path, carpeta: str) -> list[str]:
    txt = R / f"vo-{carpeta}.txt"
    if not txt.exists():
        txt.touch()
    return [l.strip() for l in txt.read_text().splitlines() if l.strip()]


# ---------------------------------------------------------------- simular / voz
def simular(cuenta: str, carpeta: str) -> None:
    _, R = cuenta_dirs(cuenta)
    if not lineas_vo(R, carpeta):
        fallo(f"vo-{carpeta}.txt está vacío: escribe una frase por línea")
    r = subprocess.run(["python3", "scripts/voz-simulada.py", carpeta], cwd=R)
    if r.returncode:
        sys.exit(r.returncode)


def voz(cuenta: str, carpeta: str, solo: int | None) -> None:
    _, R = cuenta_dirs(cuenta)
    lineas = lineas_vo(R, carpeta)
    if not lineas:
        fallo(f"vo-{carpeta}.txt está vacío")
    pub = R / "public" / "vo"
    vo = pub / carpeta

    def node(destino: str, extra: list[str]) -> int:
        p = subprocess.Popen(["node", "scripts/voz-elevenlabs.mjs", f"vo-{carpeta}.txt", destino, *extra], cwd=R,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for linea in p.stdout:  # las claves nunca se imprimen; por si acaso, se tapan
            print(re.sub(r"sk_[A-Za-z0-9]{20,}", "[clave]", linea), end="")
        return p.wait()

    if solo:
        if not (vo / "tiempos.json").exists() or (vo / ".simulada").exists():
            fallo("--solo necesita una voz real completa; genera primero la voz entera")
        if node(f"vo/{carpeta}", ["--solo", str(solo)]):
            fallo("ElevenLabs no terminó (mira el mensaje de arriba)")
        subprocess.run(["python3", "scripts/compactar-pausas.py", "0.2", f"vo/{carpeta}"], cwd=R, check=True)
    else:
        nueva = pub / f"{carpeta}-nueva"
        if nueva.exists():
            trash(nueva)  # intento anterior que no terminó
        if node(f"vo/{carpeta}-nueva", []):
            fallo(f"ElevenLabs no terminó; la voz que había en vo/{carpeta} sigue intacta")
        try:
            t = json.loads((nueva / "tiempos.json").read_text())
        except Exception:
            t = []
        faltan = [n for n in range(1, len(lineas) + 1) if not (nueva / f"{n}.mp3").exists()]
        if len(t) != len(lineas) or faltan:
            fallo(f"la voz no salió entera ({len(t)}/{len(lineas)} frases, faltan {faltan}); no toco vo/{carpeta}")
        subprocess.run(["python3", "scripts/compactar-pausas.py", "0.2", f"vo/{carpeta}-nueva"], cwd=R, check=True)
        if vo.exists():
            if (vo / ".simulada").exists():
                trash(vo)
                print(f"· la voz simulada de vo/{carpeta} va a la Papelera")
            else:
                antes = pub / f"{carpeta}-anterior-{time.strftime('%Y%m%d-%H%M')}"
                vo.rename(antes)
                print(f"· la voz anterior queda en vo/{antes.name}")
        nueva.rename(vo)
    print(f"✓ voz real en public/vo/{carpeta}")
    print("Siguiente: comprueba con Whisper que dice lo que pone el guion (va por el turno: es pesado):")
    print(f'  "{R}/scripts/turno.sh" "{python_whisper()}" "{S / "comprobar-voz.py"}" "{vo}" 2>/dev/null')
    print("y repite la auditoría: con la voz real los cortes se mueven.")


# ---------------------------------------------------------------- crear
def planos_de(tiempos: list[dict]) -> list[str]:
    """Un plano Pendiente(n) cada ≈2 s, cortado en una palabra de la frase (tiempos simulados o reales)."""
    out = []
    movs = ["mv(C0, cam([540, 900], 1.06))", "mv(cam([540, 1000], 1.12), cam([560, 960], 1.04))", "mv(cam([500, 960], 1.04), cam([580, 940], 1.1))"]
    trans = ["whip", "zoom", "cut"]
    k = 0
    for n, t in enumerate(tiempos, 1):
        dur = math.ceil(t["duracion"] * 30) + 1
        partes = max(1, math.ceil((dur + 2) / 68))  # ≤ 2,3 s por plano: margen hasta 75 frames cuando llegue la voz real
        cortes: list[str] = [f"[{n}]"]
        vistos: dict[str, int] = {}
        palabras = t["palabras"]
        occ = []
        for p in palabras:
            w = norm(p["text"])
            vistos[w] = vistos.get(w, 0) + 1
            occ.append(vistos[w])
        usados = {0}
        for j in range(1, partes):
            objetivo = dur * j / partes / 30
            i = min(range(1, len(palabras)), key=lambda i: abs(palabras[i]["start"] - objetivo), default=None)
            if i is None or i in usados or not norm(palabras[i]["text"]):
                continue
            usados.add(i)
            w = re.sub(r"[^\wáéíóúüñÁÉÍÓÚÜÑ]", "", palabras[i]["text"])
            cortes.append(f'[{n}, "{w}"' + (f", {occ[i]}" if occ[i] > 1 else "") + "]")
        for c in cortes:
            if n == 1 and c == "[1]":
                out.append('    { img: "", scene: Pendiente(1), at: [1], move: mv(HOOK_A, HOOK_B) },')
            else:
                out.append(f'    {{ img: "", scene: Pendiente({n}), at: {c}, move: {movs[k % 3]}, trans: "{trans[k % 3]}" }},')
                k += 1
    out.append('    // último plano: vuelve al gancho con la misma cámara (bucle): { img: "", scene: Bucle, at: [N, "palabra"], move: mv(cam(…), HOOK_A), trans: "zoom" },')
    return out


def crear(cuenta: str, carpeta: str, comp: str, serie: str) -> None:
    if not re.fullmatch(r"[a-z0-9-]+", carpeta):
        fallo("la carpeta va en minúsculas, sin espacios ni acentos (p. ej. tostada02)")
    if not re.fullmatch(r"[A-Z][A-Za-z0-9]*", comp):
        fallo("el componente empieza por mayúscula y no lleva guiones (p. ej. Tostada02)")
    c, R = cuenta_dirs(cuenta)
    lineas = lineas_vo(R, carpeta)
    if not lineas:
        fallo(f"escribe primero el guion y produccion/remotion/vo-{carpeta}.txt (una frase por línea) y pide el visto bueno")
    vo = R / "public" / "vo" / carpeta
    if not (vo / "tiempos.json").exists():
        print("· aún no hay voz: pongo la simulada para poder montar y revisar")
        simular(cuenta, carpeta)
    tiempos = json.loads((vo / "tiempos.json").read_text())
    if len(tiempos) != len(lineas):
        print(f"⚠ vo-{carpeta}.txt tiene {len(lineas)} frases y la voz {len(tiempos)}: el texto cambió; rehaz la voz (o `simular`)")
    tsx = R / "src" / "videos" / f"{comp}.tsx"
    if tsx.exists():
        print(f"= src/videos/{comp}.tsx ya existe; no lo toco")
    else:
        keys = []
        for n, l in enumerate(lineas, 1):
            primera = re.sub(r"[^\wáéíóúüñÁÉÍÓÚÜÑ]", "", l.split()[0])
            k = f'["{primera}"]' if n == len(lineas) and norm(primera) in ("enviaselo", "enviale", "mandaselo", "compartelo") else "[]"
            keys.append(f"    {k}, // {n} · {' '.join(l.split()[:7])}{'…' if len(l.split()) > 7 else ''}")
        txt = (SKILL / "assets" / "video-plantilla.tsx").read_text()
        for a, b in {
            "__KEYS__": "\n".join(keys),
            "__SHOTS__": "\n".join(planos_de(tiempos)),
            "__SERIE__": serie,
            "__CUENTA__": c.name,
            "__CARPETA_MAYUS__": carpeta.upper().replace("-", "_"),
            "__CARPETA__": carpeta,
            "__COMPONENTE__": comp,
        }.items():
            txt = txt.replace(a, b)
        tsx.parent.mkdir(parents=True, exist_ok=True)
        tsx.write_text(txt)
        print(f"✓ src/videos/{comp}.tsx ({len(lineas)} frases; planos Pendiente(n) de ≈2 s para sustituir por escenas)")
    tsc(R)
    print("Siguiente: diseña el mundo y las escenas (references/escenas.md), audita y registra:")
    print(f"  cd \"{R}\" && python3 scripts/auditar-escenas.py src/videos/{comp}.tsx --frames")
    print(f"  python3 \"{S / 'nuevo-video.py'}\" registrar {cuenta} {comp} {comp}-<tema>")


# ---------------------------------------------------------------- registrar
def registrar(cuenta: str, comp: str, comp_id: str) -> None:
    _, R = cuenta_dirs(cuenta)
    tsx = R / "src" / "videos" / f"{comp}.tsx"
    if not tsx.exists():
        fallo(f"falta {tsx}")
    src = tsx.read_text()
    m = re.search(r'import tiempos from "\.\./\.\./public/(vo/[^"]+)/tiempos\.json"', src)
    total = re.search(r"export const (TOTAL_\w+)\s*=", src)
    if not m or not total:
        fallo(f"{tsx.name} no importa tiempos.json o no exporta TOTAL_… (parte de la plantilla de crear)")
    for nombre in (comp, f"Portada{comp}"):
        if not re.search(rf"export const {nombre}\b", src):
            fallo(f"{tsx.name} no exporta {nombre}")
    if not (R / "public" / m.group(1) / "tiempos.json").exists():
        fallo(f"aún no hay voz en public/{m.group(1)}/tiempos.json (ni simulada): registrarlo rompería todos los renders")
    if not comp_id.startswith(comp + "-") or not re.fullmatch(r"[A-Za-z0-9-]+", comp_id):
        fallo(f"el id de la composición es {comp}-<tema> (recibido {comp_id})")

    root = R / "src" / "Root.tsx"
    lineas = root.read_text().split("\n")
    imp = f'import {{ {comp}, Portada{comp}, {total.group(1)} }} from "./videos/{comp}";'
    composicion = f'    <Composition id="{comp_id}" component={{{comp}}} durationInFrames={{{total.group(1)}}} fps={{30}} width={{1080}} height={{1920}} />'
    still = f'    <Still id="Portada-{comp}" component={{Portada{comp}}} width={{1080}} height={{1920}} />'
    previo = next((i for i, l in enumerate(lineas) if l.startswith("import ") and f'from "./videos/{comp}"' in l), None)
    if previo is None:
        idx = max((i for i, l in enumerate(lineas) if l.startswith("import ")), default=0)
        lineas.insert(idx + 1, imp)
        print(f"✓ import {comp}")
    elif lineas[previo] != imp:
        lineas[previo] = imp
        print(f"✓ import {comp} (actualizado)")
    rem = next((i for i, l in enumerate(lineas) if l.startswith("import ") and 'from "remotion"' in l), None)
    if rem is None:
        lineas.insert(1, 'import { Composition, Still } from "remotion";')
    else:
        for falta in ("Composition", "Still"):
            if not re.search(rf"\b{falta}\b", lineas[rem]):
                lineas[rem] = lineas[rem].replace("{ ", "{ " + falta + ", ", 1)
    cierre = max(i for i, l in enumerate(lineas) if l.strip() == "</>")
    hecho = []
    for ident, nueva in ((f'id="{comp_id}"', composicion), (f'id="Portada-{comp}"', still)):
        i = next((i for i, l in enumerate(lineas) if ident in l), None)
        if i is None:
            lineas.insert(cierre, nueva)
            cierre += 1
            hecho.append(f"✓ {ident}")
        elif lineas[i] != nueva:
            lineas[i] = nueva
            hecho.append(f"✓ {ident} (reemplazado)")
        else:
            hecho.append(f"= {ident} ya estaba")
    root.write_text("\n".join(lineas))
    print("\n".join(hecho))
    tsc(R)


# ---------------------------------------------------------------- stills
def stills(cuenta: str, comp_id: str, frames: list[int] | None, salida: str | None, tira: bool = False) -> None:
    _, R = cuenta_dirs(cuenta)
    comp = comp_id.split("-")[0]
    if f'id="{comp_id}"' not in (R / "src" / "Root.tsx").read_text():
        fallo(f"{comp_id} no está en Root.tsx (usa `registrar` primero)")
    etiquetas: dict[int, str] = {}
    if frames is None:
        r = subprocess.run(["python3", "scripts/auditar-escenas.py", f"src/videos/{comp}.tsx", "--json"], cwd=R, capture_output=True, text=True)
        try:
            data = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception:
            fallo(f"la auditoría no se pudo leer:\n{r.stdout[-1500:]}")
        if data["errores"]:
            print(f"⚠ la auditoría tiene {data['errores']} problemas (los fotogramas pueden fallar):\n{r.stdout[:1500]}")
        etiquetas[0] = "frame 0 (miniatura y gancho)"
        for p in data["planos"]:
            etiquetas.setdefault(p["mid"], f"plano {p['i']} · {p['nombre']}")
        etiquetas[data["total"] - 1] = "último frame (bucle: compáralo con el 0)"
        frames = sorted(etiquetas)
    out = Path(salida).expanduser().resolve() if salida else Path(os.environ.get("TMPDIR", "/tmp")) / "reel-vectorial" / comp_id
    out.mkdir(parents=True, exist_ok=True)
    print(f"· {len(frames)} fotogramas → {out} (espera su turno en la máquina)")
    r = subprocess.run([str(R / "scripts" / "turno.sh"), "node", "scripts/stills.mjs", str(out), *[f"{comp_id}:{f}" for f in frames]], cwd=R)
    if r.returncode:
        fallo("stills.mjs falló (mira el error de arriba)")
    pngs = [out / f"{comp_id}_{f}.png" for f in frames if (out / f"{comp_id}_{f}.png").exists()]
    tmp = out / "_hoja"
    tmp.mkdir(exist_ok=True)
    for viejo in tmp.glob("*.png"):
        viejo.unlink()
    for i, p in enumerate(pngs):
        (tmp / f"h_{i:03d}.png").symlink_to(p)
    cols = len(pngs) if tira else min(6, len(pngs))
    filas = math.ceil(len(pngs) / cols)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "1", "-i", str(tmp / "h_%03d.png"),
                    "-vf", f"scale=270:480,tile={cols}x{filas}:padding=6:color=0x111111", "-frames:v", "1", str(out / (f"tira-{comp_id}-{frames[0]}.jpg" if tira else f"hoja-{comp_id}.jpg"))], check=False)
    for l in tmp.glob("*.png"):
        l.unlink()
    tmp.rmdir()
    for i, f in enumerate(frames):
        print(f"  {i + 1:2}. frame {f:5}  {etiquetas.get(f, '')}  → {comp_id}_{f}.png")
    hoja = out / (f"tira-{comp_id}-{frames[0]}.jpg" if tira else f"hoja-{comp_id}.jpg")
    if hoja.exists():
        que = "tira (fotograma a fotograma: busca saltos, fotogramas vacíos y caras que cambian de golpe)" if tira else "hoja de contacto"
        print(f"✓ {que}: {hoja} (en orden, de izquierda a derecha)")


# ---------------------------------------------------------------- cola
def cwd_de(pid: str) -> str:
    try:
        return os.readlink(f"/proc/{pid}/cwd")  # Linux
    except OSError:
        pass
    try:  # macOS
        out = subprocess.run(["lsof", "-a", "-p", pid, "-d", "cwd", "-Fn"], capture_output=True, text=True).stdout
    except OSError:
        return ""
    return next((l[1:] for l in out.splitlines() if l.startswith("n")), "")


def orquestador(R: Path) -> None:
    try:
        pids = subprocess.run(["pgrep", "-f", "scripts/noche.py"], capture_output=True, text=True).stdout.split()
    except OSError:
        pids = []
    for pid in pids:
        if cwd_de(pid) == str(R):
            print(f"· El orquestador de esta cuenta está en marcha (pid {pid}): recogerá las líneas nuevas.")
            return
    print("· El orquestador de esta cuenta está parado. Lánzalo en segundo plano desde produccion/remotion:")
    print(f"    {comando_orquestador()}")


def pendiente(R: Path, linea: str) -> bool:
    """¿Ya hay en la cola una línea igual (con o sin sufijo rN) sin hacer?"""
    cola_p, hecho_p = R / "noche-cola.txt", R / "noche-hecho.txt"
    if not cola_p.exists():
        return False
    hecho = set(hecho_p.read_text().splitlines()) if hecho_p.exists() else set()
    base = lambda l: re.sub(r" r\d+$", "", l)
    return any(base(l.strip()) == linea for l in cola_p.read_text().splitlines() if l.strip() and l.strip() not in hecho)


def apartar(rutas: list[Path]) -> None:
    """La cola escribe siempre <nombre>_v1.mp4, _v1_movil.mp4 y _portada.png: antes de repetir un render, lo anterior va a
    la Papelera (nunca se pisa ni se borra con rm). Si no se puede, no se encola."""
    for f in rutas:
        if not f.exists():
            continue
        try:
            donde = a_papelera(f)
        except Exception as e:
            fallo(f"no pude apartar {f.name} ({e}): muévelo a mano antes de repetir el render")
        print(f"🗑 versión anterior a {donde}: {f.name}")


def encolar(R: Path, nuevas: list[str]) -> None:
    cola_p, hecho_p = R / "noche-cola.txt", R / "noche-hecho.txt"
    cola_p.touch()
    hecho_p.touch()
    hecho = set(hecho_p.read_text().splitlines())
    cola = [l.strip() for l in cola_p.read_text().splitlines()]
    base = lambda l: re.sub(r" r\d+$", "", l)
    pendientes = {base(l) for l in cola if l and not l.startswith("#") and l not in hecho}
    añadir = []
    for l in nuevas:
        if l in pendientes or l in {base(x) for x in añadir}:
            print(f"= ya pendiente: {l}")
            continue
        final, n = l, 1
        while final in hecho or final in cola or final in añadir:
            n += 1
            final = f"{l} r{n}"
        añadir.append(final)
    if añadir:
        texto = cola_p.read_text()
        with open(cola_p, "a") as f:
            if texto and not texto.endswith("\n"):
                f.write("\n")
            f.write("\n".join(añadir) + "\n")
        for l in añadir:
            print(f"+ {l}")
    orquestador(R)


def cola_render(cuenta: str, comp_id: str, nombre: str, sin_voz: bool) -> None:
    _, R = cuenta_dirs(cuenta)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+", nombre):
        fallo("el nombre sigue el patrón AAAA-MM-DD_serie_tema (minúsculas, guiones)")
    if not (R / "scripts" / "noche.py").exists():
        fallo("esta cuenta no tiene scripts/noche.py (la cola de tareas pesadas): móntalo con montar-cuenta.py --actualizar")
    r = (R / "src" / "Root.tsx").read_text()
    comp = comp_id.split("-")[0]
    for i in (comp_id, f"Portada-{comp}"):
        if f'id="{i}"' not in r:
            fallo(f"{i} no está en Root.tsx (usa `registrar` primero)")
    m = re.search(r'import tiempos from "\.\./\.\./public/(vo/[^"]+)/tiempos\.json"', (R / "src" / "videos" / f"{comp}.tsx").read_text())
    if m and (R / "public" / m.group(1) / ".simulada").exists():
        if not sin_voz:
            fallo("la voz es SIMULADA (silencio): genera la voz real con `voz`, o usa --sin-voz para una vista previa muda")
        nombre += "-sin-voz"
    a = subprocess.run(["python3", "scripts/auditar-escenas.py", f"src/videos/{comp}.tsx"], cwd=R, capture_output=True, text=True)
    if a.returncode:
        fallo(f"la auditoría no sale limpia; el render fallaría en la cola:\n{a.stdout[-1500:]}")
    linea = f"render {comp_id} {nombre}"
    if not pendiente(R, linea):
        B = R.parent.parent / "videos" / "borradores"
        apartar([B / f"{nombre}_v1.mp4", B / "movil" / f"{nombre}_v1_movil.mp4", B / f"{nombre}_portada.png"])
    encolar(R, [linea, f"portada Portada-{comp} {nombre}"])


def cola_portada(cuenta: str, comp: str, nombre: str) -> None:
    _, R = cuenta_dirs(cuenta)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+", nombre):
        fallo("el nombre sigue el patrón AAAA-MM-DD_serie_tema (minúsculas, guiones)")
    if f'id="Portada-{comp}"' not in (R / "src" / "Root.tsx").read_text():
        fallo(f"Portada-{comp} no está en Root.tsx (usa `registrar` primero)")
    linea = f"portada Portada-{comp} {nombre}"
    if not pendiente(R, linea):
        apartar([R.parent.parent / "videos" / "borradores" / f"{nombre}_portada.png"])
    encolar(R, [linea])


def main() -> None:
    global PROYECTO
    a = sys.argv[1:]
    p = sacar_opcion(a, "--proyecto")
    if p:
        PROYECTO = raiz_proyecto(p)
    if len(a) >= 4 and a[0] == "crear" and "--serie" in a:
        return crear(a[1], a[2], a[3], a[a.index("--serie") + 1])
    if len(a) >= 3 and a[0] == "simular":
        return simular(a[1], a[2])
    if len(a) >= 3 and a[0] == "voz":
        return voz(a[1], a[2], int(a[a.index("--solo") + 1]) if "--solo" in a else None)
    if len(a) >= 4 and a[0] == "registrar":
        return registrar(a[1], a[2], a[3])
    if len(a) >= 3 and a[0] == "stills":
        fr = [int(x) for x in a[a.index("--frames") + 1].split(",")] if "--frames" in a else None
        tira = "--tira" in a
        if tira:  # --tira F[:N] → N fotogramas seguidos desde F (8 por defecto)
            f0, _, n = a[a.index("--tira") + 1].partition(":")
            fr = list(range(int(f0), int(f0) + int(n or 8)))
        return stills(a[1], a[2], fr, a[a.index("--salida") + 1] if "--salida" in a else None, tira)
    if len(a) >= 5 and a[0] == "cola" and a[2] == "portada":
        return cola_portada(a[1], a[3], a[4])
    if len(a) >= 5 and a[0] == "cola" and a[2] == "render":
        return cola_render(a[1], a[3], a[4], "--sin-voz" in a)
    print(__doc__)
    sys.exit(2)


if __name__ == "__main__":
    main()
