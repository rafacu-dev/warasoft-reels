#!/usr/bin/env python3
"""Andamio y tareas de un video del kit reel-diorama. No genera nada pesado: lo pesado va a la cola del Mac.

<cuenta> es la carpeta de la cuenta: `mi-cuenta`, `cuentas/mi-cuenta` o una ruta absoluta. El proyecto es la
carpeta actual (la que contiene cuentas/), REELS_PROYECTO o --proyecto RUTA.

  nuevo-video.py crear <cuenta> <carpeta> [--componente Nombre] [--serie "SERIE · #N"]
      Crea assets/imagenes/<carpeta>/ (generar.sh, planos.tsv, semillas.tsv) y produccion/remotion/vo-<carpeta>.txt.
      Si vo-<carpeta>.txt ya tiene el guion: pone voz simulada si aún no hay voz y escribe
      src/videos/<Componente>.tsx con un plano cada ≈2 s cortado en palabras (imágenes de planos.tsv por orden)
      y el bucle al 00. No pisa nada que exista. Componente por defecto: la carpeta en CamelCase (humo03 → Humo03).

  nuevo-video.py simular <cuenta> <carpeta>
      Voz simulada (silencio con tiempos estimados) para montar y revisar sin gastar créditos.

  nuevo-video.py voz <cuenta> <carpeta> [--solo N]
      Voz real con ElevenLabs (una llamada a la API: no carga el Mac). La genera aparte, comprueba que salió
      entera, compacta las pausas a 0,2 s y solo entonces sustituye la carpeta: la simulada va a la Papelera y una
      voz real anterior se guarda como vo/<carpeta>-anterior-AAAAMMDD-HHMM. --solo N rehace solo la frase N.

  nuevo-video.py registrar <cuenta> <Componente> <IdComposición> --img <carpeta>/<plano> --serie "SERIE · #N"
                 --titulo "línea|línea con *clave*|línea" [--align top|bottom]
      Añade a src/Root.tsx el import, la <Composition> y el <Still id="Portada-<Componente>">. Exige
      tiempos.json (real o simulado): si Root importa un video sin voz, fallan TODOS los renders de la cola.
      Si la portada ya existe, la reemplaza.

  nuevo-video.py cola <cuenta> imagenes <carpeta> [--semilla 11] [--extra PLANO:SEM,SEM ...]
      Añade a noche-cola.txt una línea `img` por cada plano cuyo PNG falte (semilla de semillas.tsv o --semilla),
      las semillas extra pedidas (p. ej. 00:12,13 para tener dónde elegir el gancho) y un `export`.

  nuevo-video.py cola <cuenta> render <IdComposición> <nombre> [--vista-previa]
      Añade `render` + `portada`. <nombre> = AAAA-MM-DD_serie_tema. Se niega si la voz es simulada, si faltan
      planos o si la auditoría no sale limpia; --vista-previa lo permite (el nombre lleva "-vista-previa" y no se
      entrega).

  nuevo-video.py cola <cuenta> portada <Componente> <nombre>
      Solo la portada (cuando únicamente cambió el título o la imagen de la portada).

  nuevo-video.py tira <cuenta> <IdComposición> <frame>[:N] [--salida <carpeta>]
      N fotogramas seguidos desde <frame> (8 por defecto) en una sola fila, a 1/4 de tamaño, por el turno del Mac.
      Para revisar cortes, transiciones y golpes: saltos, fotogramas vacíos o algo que aparece de golpe.

Una línea que ya figura en noche-hecho.txt no se vuelve a ejecutar; si hay que repetirla, el script le añade un
sufijo (r2, r3…) que el orquestador ignora.
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

from comun import SKILL, VENV, a_papelera, cuenta, fallo, opcion, proyecto, remotion_de, tsc

sys.stdout.reconfigure(line_buffering=True)  # que los mensajes salgan en orden con los de los subprocesos
PROY: Path = Path.cwd()


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if not (0x300 <= ord(c) <= 0x36F))
    return re.sub(r"[^a-zñ0-9]", "", w)


def dirs(arg: str) -> tuple[Path, Path, Path]:
    c = cuenta(arg, PROY)
    return c, remotion_de(c), c / "assets" / "imagenes"


def leer_tsv(p: Path) -> list[list[str]]:
    if not p.exists():
        return []
    return [l.split("\t") for l in p.read_text().splitlines() if l.strip()]


def lineas_vo(R: Path, carpeta: str) -> list[str]:
    txt = R / f"vo-{carpeta}.txt"
    return [l.strip() for l in txt.read_text().splitlines() if l.strip()] if txt.exists() else []


def es_simulada(R: Path, carpeta: str) -> bool:
    return (R / "public" / "vo" / carpeta / ".simulada").exists()


def ruta_vo(R: Path, comp: str) -> str | None:
    tsx = R / "src" / "videos" / f"{comp}.tsx"
    if not tsx.exists():
        return None
    m = re.search(r'import tiempos from "\.\./\.\./public/(vo/[^"]+)/tiempos\.json"', tsx.read_text())
    return m.group(1) if m else None


# ---------------------------------------------------------------- simular / voz
def simular(arg: str, carpeta: str) -> None:
    _, R, _ = dirs(arg)
    if not lineas_vo(R, carpeta):
        fallo(f"vo-{carpeta}.txt está vacío: escribe una frase por línea")
    r = subprocess.run(["python3", "scripts/voz-simulada.py", carpeta], cwd=R)
    if r.returncode:
        sys.exit(r.returncode)


def voz(arg: str, carpeta: str, solo: int | None) -> None:
    _, R, _ = dirs(arg)
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
        if not (vo / "tiempos.json").exists() or es_simulada(R, carpeta):
            fallo("--solo necesita una voz real completa; genera primero la voz entera")
        if node(f"vo/{carpeta}", ["--solo", str(solo)]):
            fallo("ElevenLabs no terminó (mira el mensaje de arriba)")
        subprocess.run(["python3", "scripts/compactar-pausas.py", "0.2", f"vo/{carpeta}"], cwd=R, check=True)
    else:
        nueva = pub / f"{carpeta}-nueva"
        if nueva.exists():
            a_papelera(nueva)  # intento anterior que no terminó
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
            if es_simulada(R, carpeta):
                a_papelera(vo)
                print(f"· la voz simulada de vo/{carpeta} va a la Papelera")
            else:
                antes = pub / f"{carpeta}-anterior-{time.strftime('%Y%m%d-%H%M')}"
                vo.rename(antes)
                print(f"· la voz anterior queda en vo/{antes.name}")
        nueva.rename(vo)
    print(f"✓ voz real en public/vo/{carpeta}")
    print("Siguiente: comprueba con Whisper que dice lo que pone el guion (rutas absolutas; va por el turno del Mac):")
    print(f'  "{R}/scripts/turno.sh" "{VENV}/bin/python" "{SKILL}/scripts/comprobar-voz.py" "{vo}" 2>/dev/null')
    print("y repite la auditoría: con la voz real los cortes se mueven.")


# ---------------------------------------------------------------- crear
MOVS = ["MOVE.push(1)", "MOVE.drift(1)", "MOVE.punch(1.25)", "MOVE.rise(1)", "MOVE.drift(-1)", "MOVE.pull(1.4)", "MOVE.push(-1)"]
TRANS = ["whip", "zoom", "whip", "cut"]


def cortes(t: dict, n: int, partes: int) -> list[str]:
    """Puntos de corte de la frase n: su inicio y `partes - 1` palabras con peso repartidas por la frase."""
    dur = math.ceil(t["duracion"] * 30) + 1
    palabras = t["palabras"]
    vistos: dict[str, int] = {}
    occ = []
    for p in palabras:
        w = norm(p["text"])
        vistos[w] = vistos.get(w, 0) + 1
        occ.append(vistos[w])
    usados: set[int] = set()
    for j in range(1, partes):
        objetivo = dur * j / partes / 30
        candidatas = [i for i in range(1, len(palabras)) if i not in usados and norm(palabras[i]["text"])]
        if not candidatas:
            break
        # la palabra más cercana al punto ideal, mejor si tiene peso (4+ letras)
        usados.add(min(candidatas, key=lambda i: abs(palabras[i]["start"] - objetivo) + (0.25 if len(norm(palabras[i]["text"])) < 4 else 0)))
    out = [f"[{n}]"]
    for i in sorted(usados):  # en orden de aparición
        w = re.sub(r"[^\wáéíóúüñÁÉÍÓÚÜÑ]", "", palabras[i]["text"])
        out.append(f'[{n}, "{w}"' + (f", {occ[i]}" if occ[i] > 1 else "") + "]")
    return out


def planos_de(tiempos: list[dict], planos: list[str]) -> list[str]:
    N = len(tiempos)
    resto = [p for p in planos if p != "00"] or [f"{i:02d}" for i in range(1, max(2, N))]
    out: list[str] = []
    k = 0
    for n, t in enumerate(tiempos, 1):
        dur = math.ceil(t["duracion"] * 30) + 1
        partes = max(1, math.ceil((dur + 2) / 62))  # ≤ ≈2 s por plano: margen hasta 75 frames cuando llegue la voz real
        if n == N:
            partes = max(2, partes)  # la última frase acaba en el 00 (bucle)
        cs = cortes(t, n, partes)
        if n == 1:
            imgs = ["00"]
        else:
            a = round((n - 2) * len(resto) / max(1, N - 1))
            b = round((n - 1) * len(resto) / max(1, N - 1))
            imgs = resto[a:b] or [resto[min(a, len(resto) - 1)]]
        for j, c in enumerate(cs):
            if n == 1 and j == 0:
                out.append('    { img: "00", at: 0, move: HOOK, center: [0.5, 0.5], fx: "dust", cap: "top" }, // gancho: lo raro en pantalla desde el frame 0')
                continue
            if n == 1:
                out.append(f'    {{ img: "00", at: {c}, move: MOVE.punch(1.25), fx: "dust", cap: "top" }},')
                continue
            if n == N and j == len(cs) - 1:
                out.append(f'    {{ img: "00", at: {c}, move: HOOK, center: [0.5, 0.5], fx: "dust", cap: "top" }}, // bucle: vuelve al gancho')
                continue
            img = imgs[j % len(imgs)]
            trans = f', trans: "{TRANS[n % len(TRANS)]}"' if j == 0 else ""
            out.append(f'    {{ img: "{img}", at: {c}, move: {MOVS[k % len(MOVS)]}{trans}, fx: "dust", cap: "top" }},')
            k += 1
    return out


def componente_de(carpeta: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in carpeta.split("-"))


def crear(arg: str, carpeta: str, comp: str | None, serie: str | None) -> None:
    if not re.fullmatch(r"[a-z0-9-]+", carpeta):
        fallo("la carpeta va en minúsculas, sin espacios ni acentos (p. ej. humo03)")
    comp = comp or componente_de(carpeta)
    if not re.fullmatch(r"[A-Z][A-Za-z0-9]*", comp):
        fallo("el componente empieza por mayúscula y no lleva guiones (p. ej. Humo03)")
    c, R, img = dirs(arg)
    if not (img / "estilo-prompt.txt").exists():
        fallo(f"falta {img / 'estilo-prompt.txt'} (una línea con el estilo común de los prompts)")
    d = img / carpeta
    d.mkdir(parents=True, exist_ok=True)
    hechos = []
    g = d / "generar.sh"
    if not g.exists():
        g.write_text((SKILL / "assets" / "generar.sh").read_text())
        g.chmod(0o755)
        hechos.append(g)
    for f in (d / "planos.tsv", d / "semillas.tsv", R / f"vo-{carpeta}.txt"):
        if not f.exists():
            f.touch()
            hechos.append(f)
    for f in hechos:
        print(f"✓ {f.relative_to(c)}")

    lineas = lineas_vo(R, carpeta)
    if not lineas:
        vacios = [str(f.relative_to(c)) for f in (d / "planos.tsv", R / f"vo-{carpeta}.txt") if f.stat().st_size == 0]
        print(f"Siguiente: escribe {' y '.join(vacios)} (references/guion.md e imagenes.md) y vuelve a lanzar crear.")
        return
    vo = R / "public" / "vo" / carpeta
    if not (vo / "tiempos.json").exists():
        print("· aún no hay voz: pongo la simulada para poder montar y revisar")
        simular(arg, carpeta)
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
            k = f'["{primera.lower()}"]' if n == len(lineas) and norm(primera) in ("enviaselo", "enviale", "mandaselo", "compartelo", "guardalo") else "[]"
            keys.append(f"    {k}, // {n} · {' '.join(l.split()[:7])}{'…' if len(l.split()) > 7 else ''}")
        planos = [f[0] for f in leer_tsv(d / "planos.tsv")]
        txt = (SKILL / "assets" / "video-plantilla.tsx").read_text()
        for a, b in {
            "__KEYS__": "\n".join(keys),
            "__SHOTS__": "\n".join(planos_de(tiempos, planos)),
            "__SERIE__": serie or "SERIE · #1",
            "__CUENTA__": c.name,
            "__CARPETA_MAYUS__": carpeta.upper().replace("-", "_"),
            "__CARPETA__": carpeta,
            "__COMPONENTE__": comp,
        }.items():
            txt = txt.replace(a, b)
        tsx.parent.mkdir(parents=True, exist_ok=True)
        tsx.write_text(txt)
        print(f"✓ src/videos/{comp}.tsx ({len(lineas)} frases; planos de ≈2 s para ajustar)")
    print("Siguiente: ajusta el montaje (references/motor.md), audita y registra:")
    print(f'  cd "{R}" && python3 scripts/auditar-planos.py src/videos/{comp}.tsx --frames')
    print(f'  python3 "{SKILL}/scripts/nuevo-video.py" registrar {arg} {comp} {comp}-<tema> --img {carpeta}/00 --serie "…" --titulo "…|…|…"')


# ---------------------------------------------------------------- registrar
def registrar(arg: str, comp: str, comp_id: str, img: str, serie: str, titulo: str, align: str | None = None) -> None:
    _, R, _ = dirs(arg)
    tsx = R / "src" / "videos" / f"{comp}.tsx"
    if not tsx.exists():
        fallo(f"falta {tsx}")
    src = tsx.read_text()
    vo = ruta_vo(R, comp)
    total = re.search(r"export const (TOTAL_\w+)\s*=", src)
    if not vo or not total:
        fallo(f"{tsx.name} no importa tiempos.json o no exporta TOTAL_… (copia la estructura de references/motor.md)")
    if not re.search(rf"export const {comp}\b", src):
        fallo(f"{tsx.name} no exporta {comp}")
    if not (R / "public" / vo / "tiempos.json").exists():
        fallo(f"aún no hay voz en public/{vo}/tiempos.json (ni simulada): registrarlo ahora rompería todos los renders")
    if not (R / "public" / f"{img}.jpg").exists():
        print(f"· public/{img}.jpg aún no existe (se exporta con la cola): hasta entonces la portada sale con fondo provisional")
    if not comp_id.startswith(comp + "-") or not re.fullmatch(r"[A-Za-z0-9-]+", comp_id):
        fallo(f"el id de la composición es {comp}-<tema>, sin espacios ni acentos (recibido {comp_id})")

    root = R / "src" / "Root.tsx"
    lineas = root.read_text().split("\n")
    imp = f'import {{ {comp}, {total.group(1)} }} from "./videos/{comp}";'
    composicion = (
        f'    <Composition id="{comp_id}" component={{{comp}}} durationInFrames={{{total.group(1)}}} '
        f"fps={{30}} width={{1080}} height={{1920}} />"
    )
    props = {"img": img, "series": serie, "title": [t.strip() for t in titulo.split("|") if t.strip()]}
    if align:
        props["align"] = align
    largas = [t for t in props["title"] if len(t.replace("*", "")) > 18]
    if largas:
        print(f"⚠ líneas del título de más de 18 caracteres (se parten mal a 100 px): {largas}")
    props_txt = ", ".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in props.items())
    still = f'    <Still id="Portada-{comp}" component={{Portada}} width={{1080}} height={{1920}} defaultProps={{{{ {props_txt} }}}} />'

    previo = next((i for i, l in enumerate(lineas) if l.startswith("import ") and f'from "./videos/{comp}"' in l), None)
    if previo is None:
        idx = max((i for i, l in enumerate(lineas) if l.startswith("import ")), default=0)
        lineas.insert(idx + 1, imp)
        print(f"✓ import {comp}")
    elif lineas[previo] != imp:
        lineas[previo] = imp
    if not any('from "./engine/Portada"' in l for l in lineas):
        lineas.insert(2, 'import { Portada } from "./engine/Portada";')
    rem = next((i for i, l in enumerate(lineas) if l.startswith("import ") and 'from "remotion"' in l), None)
    if rem is None:
        lineas.insert(1, 'import { Composition, Still } from "remotion";')
    else:
        for falta in ("Composition", "Still"):
            if not re.search(rf"\b{falta}\b", lineas[rem]):
                lineas[rem] = lineas[rem].replace("{ ", "{ " + falta + ", ", 1)
    cierre = max(i for i, l in enumerate(lineas) if l.strip() == "</>")
    for ident, nueva in ((f'id="{comp_id}"', composicion), (f'id="Portada-{comp}"', still)):
        i = next((i for i, l in enumerate(lineas) if ident in l), None)
        if i is None:
            lineas.insert(cierre, nueva)
            cierre += 1
            print(f"✓ {ident}")
        elif lineas[i] != nueva:
            lineas[i] = nueva
            print(f"✓ {ident} (reemplazado)")
        else:
            print(f"= {ident} ya estaba")
    root.write_text("\n".join(lineas))
    if es_simulada(R, vo.split("/", 1)[1]):
        print("· la voz es SIMULADA: sirve para montar y revisar; antes de entregar, `voz` y auditoría de nuevo")
    tsc(R)


# ---------------------------------------------------------------- cola
def orquestador(R: Path) -> None:
    pids = subprocess.run(["pgrep", "-f", "scripts/noche.py"], capture_output=True, text=True).stdout.split()
    for pid in pids:
        cwd = subprocess.run(["lsof", "-a", "-p", pid, "-d", "cwd", "-Fn"], capture_output=True, text=True).stdout
        if any(l[1:] == str(R) for l in cwd.splitlines() if l.startswith("n")):
            print(f"· La cola de esta cuenta está en marcha (pid {pid}): recogerá las líneas nuevas.")
            return
    print("· La cola de esta cuenta está parada. Lánzala en segundo plano desde produccion/remotion:")
    print(f'    cd "{R}" && caffeinate -i python3 scripts/noche.py --hasta-vaciar')


def pendiente(R: Path, linea: str) -> bool:
    """¿Ya hay en la cola una línea igual (con o sin sufijo rN) sin hacer?"""
    cola_p, hecho_p = R / "noche-cola.txt", R / "noche-hecho.txt"
    if not cola_p.exists():
        return False
    hecho = set(hecho_p.read_text().splitlines()) if hecho_p.exists() else set()
    base = lambda l: re.sub(r" r\d+$", "", l)
    return any(base(l.strip()) == linea for l in cola_p.read_text().splitlines() if l.strip() and l.strip() not in hecho)


def encolar(R: Path, nuevas: list[str]) -> None:
    cola_p, hecho_p = R / "noche-cola.txt", R / "noche-hecho.txt"
    cola_p.touch()
    hecho_p.touch()
    hecho = set(hecho_p.read_text().splitlines())
    cola = [l.strip() for l in cola_p.read_text().splitlines()]
    base = lambda l: re.sub(r" r\d+$", "", l)  # "export x r3" es la misma tarea que "export x"
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


def cola_imagenes(arg: str, carpeta: str, semilla: str, extras: list[str]) -> None:
    _, R, img = dirs(arg)
    d = img / carpeta
    filas = leer_tsv(d / "planos.tsv")
    if not filas:
        fallo(f"{d / 'planos.tsv'} está vacío o no existe (crea la carpeta con `crear`)")
    malos = [f for f in filas if len(f) != 2 or not f[1].strip()]
    if malos:
        fallo(f"planos.tsv: cada línea es <plano><TAB><prompt>, sin cabecera ni comentarios; revisa {[m[0] for m in malos]}")
    if not (VENV / "bin" / "mflux-generate-z-image-turbo").exists():
        print(f"⚠ no encuentro el generador en {VENV}: prepara el entorno (scripts/preparar-entorno.sh de la skill) antes de lanzar la cola")
    planos = [f[0] for f in filas]
    over = {k: v.strip() for k, v in leer_tsv(d / "semillas.tsv")}
    lineas = [f"img {carpeta} {p} {over.get(p, semilla)}" for p in planos if not (d / f"{p}-s{over.get(p, semilla)}.png").exists()]
    for e in extras:
        p, _, sems = e.partition(":")
        if p not in planos:
            fallo(f"--extra {e}: el plano {p} no está en planos.tsv")
        lineas += [f"img {carpeta} {p} {s}" for s in sems.split(",") if s and not (d / f"{p}-s{s}.png").exists()]
    if not lineas:
        print("= todas las imágenes existen")
    n = len(lineas)
    lineas.append(f"export {carpeta}")
    encolar(R, lineas)
    if n:
        print(f"≈ {n * 1.7:.0f} min de imágenes (≈1,5–2 min por imagen en un Mac Apple Silicon reciente) + exportación")


def cola_render(arg: str, comp_id: str, nombre: str, vista_previa: bool) -> None:
    c, R, _ = dirs(arg)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+", nombre):
        fallo("el nombre sigue el patrón AAAA-MM-DD_serie_tema (minúsculas, guiones)")
    r = (R / "src" / "Root.tsx").read_text()
    comp = comp_id.split("-")[0]
    for i in (comp_id, f"Portada-{comp}"):
        if f'id="{i}"' not in r:
            fallo(f"{i} no está en Root.tsx (usa `registrar` primero)")
    tsx = R / "src" / "videos" / f"{comp}.tsx"
    src = re.sub(r"//[^\n]*", "", tsx.read_text())  # sin comentarios: solo lo que usa el video
    problemas = []
    vo = ruta_vo(R, comp)
    if vo and es_simulada(R, vo.split("/", 1)[1]):
        problemas.append("la voz es SIMULADA (silencio): genera la voz real con `voz`")
    m = re.search(r'imgDir:\s*"([^"]+)"', src)
    if m:
        usados = sorted(set(re.findall(r'img:\s*"([^"]+)"', src)))
        faltan = [i for i in usados if not (R / "public" / m.group(1) / f"{i}.jpg").exists() or not (R / "public" / m.group(1) / f"{i}_depth.png").exists()]
        if faltan:
            problemas.append(f"faltan planos en public/{m.group(1)}/ ({' '.join(faltan)}): encola `imagenes` y `export`")
    for pista in re.findall(r'src:\s*"(music/[^"]+)"', src):
        if not (R / "public" / pista).exists():
            print(f"⚠ no está public/{pista}: el video saldrá sin música (public/music/LEEME.md)")
    for efecto in sorted(set(re.findall(r'\[\s*"([a-z-]+)"\s*,\s*\[', src))):
        if not (R / "public" / "sfx-pro" / f"{efecto}.mp3").exists():
            print(f"⚠ no está public/sfx-pro/{efecto}.mp3: ese efecto no sonará (public/sfx-pro/LEEME.md)")
    if problemas and not vista_previa:
        fallo("no se puede renderizar una entrega:\n  · " + "\n  · ".join(problemas) + "\n  (con --vista-previa sale un borrador que no se entrega)")
    if problemas:
        nombre += "-vista-previa"
    a = subprocess.run(["python3", "scripts/auditar-planos.py", f"src/videos/{comp}.tsx"], cwd=R, capture_output=True, text=True)
    if a.returncode:
        fallo(f"la auditoría no sale limpia; el render fallaría en la cola:\n{a.stdout[-1500:]}")
    linea = f"render {comp_id} {nombre}"
    if not pendiente(R, linea):
        B = c / "videos" / "borradores"
        for f in (B / f"{nombre}_v1.mp4", B / "movil" / f"{nombre}_v1_movil.mp4", B / f"{nombre}_portada.png"):
            if f.exists():
                a_papelera(f)
                print(f"· a la Papelera (versión anterior): {f.name}")
    encolar(R, [linea, f"portada Portada-{comp} {nombre}"])


def cola_portada(arg: str, comp: str, nombre: str) -> None:
    c, R, _ = dirs(arg)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+(-vista-previa)?", nombre):
        fallo("el nombre sigue el patrón AAAA-MM-DD_serie_tema (minúsculas, guiones)")
    if f'id="Portada-{comp}"' not in (R / "src" / "Root.tsx").read_text():
        fallo(f"Portada-{comp} no está en Root.tsx (usa `registrar` primero)")
    linea = f"portada Portada-{comp} {nombre}"
    if not pendiente(R, linea):
        a_papelera(c / "videos" / "borradores" / f"{nombre}_portada.png")
    encolar(R, [linea])


# ---------------------------------------------------------------- tira
def tira(arg: str, comp_id: str, desde: str, salida: str | None) -> None:
    _, R, _ = dirs(arg)
    if f'id="{comp_id}"' not in (R / "src" / "Root.tsx").read_text():
        fallo(f"{comp_id} no está en Root.tsx (usa `registrar` primero)")
    f0, _, n = desde.partition(":")
    a, n = int(f0), int(n or 8)
    out = Path(salida).expanduser().resolve() if salida else Path(os.environ.get("TMPDIR", "/tmp")) / "reel-diorama" / f"tira-{comp_id}-{a}"
    out.mkdir(parents=True, exist_ok=True)
    for viejo in out.glob("element-*.jpeg"):
        viejo.unlink()
    print(f"· fotogramas {a}–{a + n - 1} de {comp_id} → {out} (espera su turno del Mac)")
    r = subprocess.run([str(R / "scripts" / "turno.sh"), "npx", "remotion", "render", comp_id, str(out), "--sequence",
                        f"--frames={a}-{a + n - 1}", "--image-format=jpeg", "--scale=0.25", "--log=error"], cwd=R)
    if r.returncode:
        fallo("el render de la tira falló (mira el error de arriba)")
    fotos = sorted(out.glob("element-*.jpeg"))
    if not fotos:
        fallo(f"no salió ningún fotograma en {out}")
    hoja = out / f"tira-{comp_id}-{a}.jpg"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "1", "-pattern_type", "glob", "-i", str(out / "element-*.jpeg"),
                    "-vf", f"tile={len(fotos)}x1:padding=4:color=0x111111", "-frames:v", "1", str(hoja)], check=True)
    print(f"✓ tira: {hoja} ({len(fotos)} fotogramas, de izquierda a derecha)")


def main() -> None:
    global PROY
    a = sys.argv[1:]
    PROY = proyecto(opcion(a, "--proyecto"))
    if len(a) >= 3 and a[0] == "crear":
        comp, serie = opcion(a, "--componente"), opcion(a, "--serie")
        return crear(a[1], a[2], comp, serie)
    if len(a) >= 3 and a[0] == "simular":
        return simular(a[1], a[2])
    if len(a) >= 3 and a[0] == "voz":
        solo = opcion(a, "--solo")
        return voz(a[1], a[2], int(solo) if solo else None)
    if len(a) >= 4 and a[0] == "registrar":
        opts = {k: opcion(a, k) for k in ("--img", "--serie", "--titulo", "--align")}
        if not all(opts[k] for k in ("--img", "--serie", "--titulo")) or (opts["--align"] or "top") not in ("top", "bottom"):
            fallo("registrar necesita --img, --serie y --titulo (y --align solo admite top o bottom)")
        return registrar(a[1], a[2], a[3], opts["--img"], opts["--serie"], opts["--titulo"], opts["--align"])
    if len(a) >= 4 and a[0] == "cola" and a[2] == "imagenes":
        sem = opcion(a, "--semilla", "11")
        extras = []
        while "--extra" in a:
            extras.append(opcion(a, "--extra"))
        return cola_imagenes(a[1], a[3], sem, extras)
    if len(a) >= 5 and a[0] == "cola" and a[2] == "render":
        return cola_render(a[1], a[3], a[4], "--vista-previa" in a)
    if len(a) >= 5 and a[0] == "cola" and a[2] == "portada":
        return cola_portada(a[1], a[3], a[4])
    if len(a) >= 4 and a[0] == "tira":
        return tira(a[1], a[2], a[3], opcion(a, "--salida"))
    print(__doc__)
    sys.exit(2)


if __name__ == "__main__":
    main()
