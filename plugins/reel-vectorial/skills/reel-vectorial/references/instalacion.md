# Instalación, requisitos y licencias

## Requisitos
| Qué | Para qué | Cómo |
|---|---|---|
| **Claude Code** | Ejecuta la skill | https://claude.com/claude-code |
| **Node.js 20+** | Remotion (escenas, fotogramas, render) | https://nodejs.org · macOS: `brew install node` |
| **Python 3.10+** | Scripts de la skill y de la cuenta | macOS ya trae `python3`; si es anterior a 3.10, `brew install python` |
| **ffmpeg** | Voz simulada, pausas, master de audio, hojas de contacto | macOS: `brew install ffmpeg` · Debian/Ubuntu: `sudo apt install ffmpeg` |
| **Google Chrome** (opcional) | Navegador del render | Si no está, Remotion descarga su Chrome for Testing la primera vez (unos cientos de MB) |
| **Clave de ElevenLabs** (opcional) | Voz real con tiempos por palabra | https://elevenlabs.io. Sin clave se trabaja con la voz simulada, pero no se entrega |
| **Whisper** (opcional) | Comprobar que la voz dice lo que pone el guion | Ver "Comprobar la voz" |

**Sistema.** Pensado y probado en macOS con Apple Silicon: la cola mide la memoria con `memory_pressure`, la temperatura y la batería con `pmset`, y evita que el Mac se duerma con `caffeinate`. En Linux también funciona: la cola lee `/proc/meminfo` y `/sys/class/power_supply`, no vigila la temperatura y se lanza sin `caffeinate`; los fotogramas usan OpenGL por software (`swangle`), más lento. En Windows, usa WSL.

## Instalar la skill
**Como plugin** (recomendado), dentro de Claude Code:
```
/plugin marketplace add rafacu-dev/warasoft-reels
/plugin install reel-vectorial@warasoft-reels
```
**A mano:** copia la carpeta `plugins/reel-vectorial/skills/reel-vectorial` del repositorio a `~/.claude/skills/reel-vectorial` (para todos tus proyectos) o a `<proyecto>/.claude/skills/reel-vectorial` (solo ese proyecto).

## El proyecto
Abre Claude Code en una carpeta vacía (o en la que ya tenga tus cuentas) y pide, por ejemplo: "crea una cuenta de reels vectoriales llamada curiosidades con el handle @micuenta". La skill ejecuta:
```bash
python3 "<S>/scripts/montar-cuenta.py" curiosidades --handle @micuenta
```
y deja:
```
<proyecto>/
  .env                    claves de ElevenLabs (vacío, chmod 600; lo rellenas tú)
  .gitignore              ignora .env, node_modules y lo temporal
  recursos/               candado de la cola (y, si quieres, sfx/ y musica/ compartidos)
  cuentas/curiosidades/
    contexto.md  estilo.md  tono-de-voz.md  ideas.md
    guiones/  referencias/  assets/logos/
    produccion/ficha-reel.md
    produccion/remotion/  proyecto de Remotion (kit, motor, scripts, Demo01)
    videos/borradores/  videos/finales/
```
`npm ci` instala las versiones fijadas de Remotion la primera vez (unos 200 MB, necesita internet). Una segunda cuenta del mismo proyecto clona `node_modules` de la primera (en macOS, clon APFS que no ocupa espacio).

Para ver la demo: `cd cuentas/curiosidades/produccion/remotion && npx remotion studio` abre el editor de Remotion en el navegador con `Demo01-tostada`.

## Claves de ElevenLabs
1. Crea una clave en tu cuenta de ElevenLabs (permiso de texto a voz; el de lectura de usuario sirve para ver el saldo).
2. **Pégala tú** en `<proyecto>/.env` (`ELEVENLABS_API_KEY=`). Nunca en el chat: Claude no lee ese archivo.
3. Elige la voz: `cd <R> && node scripts/voz-elevenlabs.mjs --voces` lista las voces de tu cuenta con su id. "Bill" es una voz prediseñada que suena bien en español a velocidad 1,15. Pon su id en `ELEVENLABS_VOICE_ID=`.
4. Comprueba: `node scripts/voz-elevenlabs.mjs --claves` (gasta ≈3 créditos por clave).

Opcional:
- Más cuentas de ElevenLabs: `ELEVENLABS_API_KEY_2`, `_3`… Cuando una se queda sin saldo, el script sigue con la siguiente. `ELEVENLABS_DESDE=N` empieza por la clave N.
- Una cuenta con otra voz u otras claves: crea `cuentas/<cuenta>/produccion/remotion/.env` (chmod 600) con las variables que cambian; lo demás sale del `.env` del proyecto.

## Comprobar la voz (Whisper)
Una vez por máquina, en un entorno aparte (torch y el modelo ocupan unos 2–3 GB):
```bash
python3 -m venv ~/.venvs/whisper && ~/.venvs/whisper/bin/pip install transformers torch
```
`nuevo-video.py voz` imprime el comando exacto para comprobar cada voz. Si el entorno está en otro sitio, define `REELS_WHISPER_PY=/ruta/al/python`.

## Variables de entorno
| Variable | Qué hace |
|---|---|
| `REELS_PROYECTO` | Raíz del proyecto, si no es la carpeta actual |
| `REELS_LOCK` | Ruta del candado de la cola (por defecto `<proyecto>/recursos/turno-mac.lock`). Útil para compartir el turno entre varios proyectos de la misma máquina |
| `REELS_LIBRE_MIN` | % de memoria libre que `turno.sh` exige para empezar (45 por defecto) |
| `REELS_WHISPER_PY` | Python con `transformers` para `comprobar-voz.py` |
| `REMOTION_CHROME` | Navegador para los fotogramas y el render |
| `REMOTION_GL` | OpenGL de Chrome: `angle` (macOS, por defecto), `swangle` (resto, por defecto), `egl`, `angle-egl`… |

## Licencias
- **Esta skill:** MIT.
- **Remotion** no es MIT: es gratis para particulares y empresas de hasta 3 personas, incluido el uso comercial; una empresa mayor necesita licencia de empresa. Compruébalo en https://www.remotion.dev/license antes de usarlo en una empresa.
- **Paper Shaders** (`@paper-design/shaders-react`, fondos animados): Apache 2.0.
- **Nunito** (tipografía por defecto, vía Google Fonts): SIL Open Font License.
- **Voz y efectos de ElevenLabs:** con el plan gratuito, uso no comercial y con atribución; con un plan de pago, uso comercial. Revisa sus condiciones vigentes.
- **Música y efectos de terceros:** cada pista con su licencia; ver `audio.md`. La skill no incluye ningún audio.
- **Contenido de IA:** etiqueta el reel como "contenido de IA" al publicarlo (voz sintética).
