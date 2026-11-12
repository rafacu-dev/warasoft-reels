# Requisitos, instalación y licencias

## Requisitos
| Qué | Mínimo | Por qué |
|---|---|---|
| Mac con Apple Silicon (M1 o posterior) | — | Las imágenes y la profundidad se generan con MLX (mflux), que solo corre en Apple Silicon |
| Memoria unificada | 32 GB recomendados; 24 GB justo; 16 GB no recomendado | Z-Image Turbo con `--quantize 8 --low-ram` llega a ≈18 GB (≈33 GB sin `--low-ram`). Probado en un Mac de 48 GB: ≈1,3 min por imagen |
| Disco libre | ≈45 GB | Modelos: ≈33 GB Z-Image Turbo + ≈1,9 GB Depth Pro (+ ≈1 GB Whisper si compruebas la voz). Cada video, ≈0,5 GB de imágenes |
| Claude Code | — | La skill dirige todo el flujo |
| Node.js | 20 o superior | Remotion (montaje y render) y el script de voz |
| Python | 3.10+ para los scripts; 3.11+ para el entorno de imágenes | `preparar-entorno.sh` usa `uv` si lo tienes (y entonces descarga él Python 3.12) |
| ffmpeg | — | Master de audio, voz simulada, pausas, tiras de fotogramas |
| Google Chrome | opcional | Remotion renderiza con tu Chrome si está en /Applications; si no, descarga "Chrome for Testing" la primera vez |
| Cuenta de ElevenLabs | opcional | La voz. Sin clave se monta todo con voz simulada, pero no se entrega. Para publicar, plan Starter o superior |

Instalar lo básico con Homebrew: `brew install node python ffmpeg` (y, opcional, `brew install uv`).

## Instalación
1. **La skill.** En Claude Code:
   ```
   /plugin marketplace add rafacu-dev/warasoft-reels
   /plugin install reel-diorama@warasoft-reels
   ```
   Sin el sistema de plugins, copia la carpeta `plugins/reel-diorama/skills/reel-diorama` del repositorio a `~/.claude/skills/reel-diorama`.
2. **El entorno de imágenes** (una vez por Mac; tarda lo que tarde en bajar ≈35 GB):
   ```bash
   bash "<S>/scripts/preparar-entorno.sh"
   ```
   - Comprueba el Mac, crea `~/imggen/.venv` con mflux 0.24.0 (la versión probada) y descarga Z-Image Turbo y Depth Pro.
   - `--comprobar` solo dice qué falta. `--sin-modelos` instala sin descargar (se bajarán con la primera imagen, que entonces puede agotar el tiempo de la cola).
   - Otra ruta: exporta `REELS_IMG_VENV=/ruta/al/venv` antes (y en tu `~/.zshrc`).
3. **El proyecto y la primera cuenta.** Abre Claude Code en una carpeta vacía (será `<P>`) y pide "crea una cuenta nueva para reels diorama". La skill ejecuta:
   ```bash
   python3 "<S>/scripts/montar-cuenta.py" <nombre> --handle @<handle>
   ```
   Crea `cuentas/<nombre>/` con sus documentos, el proyecto de Remotion en `produccion/remotion/` (con `npm ci`) y un `.env` vacío para las claves.
4. **La demo.** Sin generar nada:
   ```bash
   cd "<P>/cuentas/<nombre>/produccion/remotion" && npx remotion studio
   ```
   Composición `Demo-diorama`: voz simulada, planos provisionales dibujados en código y un gráfico. Para verla con imágenes de verdad: `python3 "<S>/scripts/nuevo-video.py" cola <nombre> imagenes demo` y lanzar la cola.
5. **Las claves de ElevenLabs.** Abre `produccion/remotion/.env` con un editor y pega `ELEVENLABS_API_KEY` (y, si tienes más cuentas, `_2`, `_3`…). Elige la voz con `node scripts/voz-elevenlabs.mjs --voces` (por ejemplo, la prediseñada "Bill") y pega su id en `ELEVENLABS_VOICE_ID`. Nunca las pegues en el chat.
6. **Música y efectos.** No vienen incluidos: ver `public/music/LEEME.md` (Kevin MacLeod, CC BY, de incompetech.com) y `public/sfx-pro/LEEME.md` (con tu clave de ElevenLabs o CC0).
7. **El primer video:** pide a Claude un reel sobre un tema de la cuenta. El render final queda en `cuentas/<nombre>/videos/borradores/`.

## Licencias
| Pieza | Licencia | Qué implica |
|---|---|---|
| Este kit | MIT | Úsalo y modifícalo libremente |
| Remotion | Licencia propia | Gratis para personas y empresas de hasta 3 personas, también con uso comercial. Empresas mayores necesitan una licencia de empresa: remotion.dev/license |
| Z-Image Turbo (Tongyi-MAI) | Apache 2.0 | Uso comercial permitido. Ficha: huggingface.co/Tongyi-MAI/Z-Image-Turbo |
| Depth Pro (Apple) | Licencia de Apple del repositorio apple/ml-depth-pro | Permisiva (uso, modificación y redistribución con el aviso de copyright); léela antes de un uso comercial: github.com/apple/ml-depth-pro |
| mflux | MIT | |
| Voz y efectos de ElevenLabs | Términos de ElevenLabs | El plan gratuito no permite uso comercial y exige atribuir a ElevenLabs: para publicar, Starter o superior (comprueba sus términos vigentes) |
| Música de Kevin MacLeod | CC BY 4.0 | Atribución obligatoria en el caption |
| Whisper (openai/whisper-small) | Apache 2.0 | Solo para comprobar la voz |

Etiqueta los reels como contenido generado con IA cuando la plataforma lo pida.

## Variables de entorno (todas opcionales)
| Variable | Por defecto | Para qué |
|---|---|---|
| `REELS_PROYECTO` | la carpeta actual (o la primera carpeta padre con `cuentas/`) | Raíz del proyecto para los scripts de la skill |
| `REELS_IMG_VENV` | `~/imggen/.venv` | Entorno de Python con mflux |
| `REELS_IMG_QUANTIZE` | `8` | Cuantización del generador; `4` usa menos memoria con algo menos de calidad |
| `REELS_TURNO_LOCK` | `<P>/recursos/turno-mac.lock` | Candado del turno del Mac (compártelo si tienes varios proyectos) |
| `REELS_TURNO_LIBRE` | `45` | % de memoria libre que espera `turno.sh` |
| `REELS_CHROME` | Chrome de /Applications | Navegador para renderizar |
| `ELEVENLABS_DESDE` | `1` | Empezar por la clave N (para saltar cuentas agotadas) |
| `ELEVENLABS_SPEED` | `1.15` | Velocidad de la voz (la simulada y la auditoría asumen ≈3,2 palabras/s) |

## Problemas frecuentes
- **"No browser found" al renderizar:** una descarga del navegador de Remotion quedó a medias. Instala Google Chrome o define `REELS_CHROME` con la ruta de un Chrome; o borra `produccion/remotion/node_modules/.remotion` y vuelve a renderizar para que lo descargue de nuevo.
- **La cámara 2.5D sale en negro:** WebGL no arrancó. Renderiza con un Chrome completo (`REELS_CHROME`) y no quites `setChromiumOpenGlRenderer("angle")` de `remotion.config.ts`.
- **La cola "espera" mucho:** mira `tail -n 30 noche.log`. Espera con poca memoria libre, sin cargador, con aviso térmico o si otra tarea tiene el turno. Es lo normal; cierra apps pesadas o conecta el cargador.
- **Una imagen tarda o se mata por tiempo:** el modelo no estaba descargado. Ejecuta `preparar-entorno.sh` (sin `--sin-modelos`) y vuelve a encolar.
- **Memoria justa (24 GB o menos):** `export REELS_IMG_QUANTIZE=4` antes de lanzar la cola y cierra el navegador y otras apps.
