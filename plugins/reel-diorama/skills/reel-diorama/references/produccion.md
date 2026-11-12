# Voz, cola del Mac, render y entrega

Salvo que se diga otra cosa, las rutas son relativas a `<R>` = `cuentas/<cuenta>/produccion/remotion`, dentro del proyecto (`cd "<P>/cuentas/<cuenta>/produccion/remotion"`).

## Voz
### Simulada (para montar sin gastar)
`nuevo-video.py crear` la pone sola si aún no hay voz; también `python3 "<S>/scripts/nuevo-video.py" simular <cuenta> <carpeta>`.
- Silencio con tiempos por palabra estimados desde el texto (≈3,2 palabras/s; error ≈0,3 s por frase).
- Lleva un archivo `.simulada`. La auditoría lo avisa y la cola no renderiza una entrega con ella (solo `--vista-previa`).
- Sirve para montar, auditar, registrar y sacar stills mientras se genera la voz real o si no hay saldo.

### Real (ElevenLabs)
Es una llamada a una API, una línea cada vez, y no carga el Mac: no pasa por la cola.
```bash
python3 "<S>/scripts/nuevo-video.py" voz <cuenta> <carpeta>
```
- La genera en `public/vo/<carpeta>-nueva` y comprueba que estén todas las frases. Después compacta las pausas internas a 0,2 s y recorta la cola de cada frase (`compactar-pausas.py`). Solo entonces sustituye la carpeta: la simulada va a la Papelera y una voz real anterior queda como `vo/<carpeta>-anterior-AAAAMMDD-HHMM`.
- **Resultado:** `public/vo/<carpeta>/N.mp3` + `tiempos.json` (tiempos por palabra).
- **Rehacer una sola frase:** `… voz <cuenta> <carpeta> --solo N` (conserva las demás en `tiempos.json`). Después, la auditoría.
- **Claves.** El `.env` (chmod 600; nunca se lee, se imprime ni se pide en el chat) admite `ELEVENLABS_API_KEY`, `_2`, `_3`… y `ELEVENLABS_VOICE_ID`.
  - Cuando una cuenta se queda sin saldo, el script sigue con la siguiente en la misma línea. `ELEVENLABS_DESDE=N` salta las primeras.
  - Si alguna marca "actividad inusual", se detiene. No lo esquives: avisa al usuario.
  - Elegir la voz: `node scripts/voz-elevenlabs.mjs --voces`. Una voz prediseñada documental (por ejemplo "Bill") a velocidad 1,15 da el ritmo que asumen la voz simulada y la auditoría.
- **Saldo.** `node scripts/voz-elevenlabs.mjs --claves` (gasta ≈3 créditos por clave). Un video gasta ≈1 crédito por carácter (≈750).
- **Sin clave o sin saldo:** sigue con la simulada hasta el render, avisa al usuario y no entregues.
- **Límites.** No clonar voces de otras personas ni sacar voces de la biblioteca de ElevenLabs fuera de la API.
- **Licencia.** Lo generado con el plan gratuito de ElevenLabs no permite uso comercial: para publicar hace falta Starter o superior. Recuérdalo en la entrega.

### Escuchar sin auriculares (Whisper)
`tiempos.json` solo alinea el texto enviado: no detecta si la voz se comió o pronunció mal una palabra. Transcribe con Whisper y compara. Va por el turno y con rutas absolutas (porque `turno.sh` cambia de carpeta); usa el Python del entorno de imágenes, que ya trae `transformers` y `torch`:
```bash
scripts/turno.sh "${REELS_IMG_VENV:-$HOME/imggen/.venv}/bin/python" "<S>/scripts/comprobar-voz.py" "<P>/<R>/public/vo/<carpeta>" 2>/dev/null
```
- La primera vez descarga whisper-small (≈1 GB).
- Las frases por debajo del 85 % salen con la diferencia.
- Muchas son confusiones de Whisper (nombres propios). Si la diferencia es una palabra cambiada o que falta, reescríbela como suena y rehaz esa frase con `--solo N`.
- Sin el entorno de imágenes: `python3 -m venv ~/whisper && ~/whisper/bin/pip install transformers torch` y usa ese Python.

## La cola del Mac (`scripts/noche.py`)
**Regla: una sola tarea pesada a la vez.** Dos generadores de imágenes y un render juntos bastan para que un Mac de 48 GB se quede sin memoria y se reinicie.

Todo lo pesado (imágenes, exportación, render, portada) va por la cola:
- `noche-cola.txt`: una tarea por línea; se puede ampliar mientras corre.
- `noche-hecho.txt`: lo terminado.
- `noche.log`: el registro.
- El turno se reparte entre **todas las cuentas** con el candado `<P>/recursos/turno-mac.lock` (o `REELS_TURNO_LOCK`): dos colas de cuentas distintas nunca trabajan a la vez.

| Tarea | Qué hace |
|---|---|
| `img <carpeta> <plano> <semilla>` | una imagen (low-RAM) |
| `export <carpeta>` | profundidad (Depth Pro) + copia a `public/<carpeta>/` |
| `render <Composición> <nombre>` | render (concurrencia 2) + master −14 LUFS → `videos/borradores/<nombre>_v1.mp4` + `movil/<nombre>_v1_movil.mp4` |
| `portada <IdStill> <nombre>` | `videos/borradores/<nombre>_portada.png` |

- **Añadir tareas:** usa `nuevo-video.py cola …`, que evita duplicados. Una línea que ya está en `noche-hecho.txt` no se repite: para rehacerla hace falta un sufijo (`r2`), y el script lo pone solo.
- **Lanzar la cola:** si no está en marcha, ejecútala en segundo plano desde `<R>`. Termina al vaciarse, así el Mac puede dormir.
  ```bash
  caffeinate -i python3 scripts/noche.py --hasta-vaciar
  ```
- **Seguirla:** `tail -n 30 noche.log`.
  - `✗ MATADA por seguridad`: la memoria bajó o el swap creció; la tarea se reintenta sola.
  - `‼ abandonada`: falló 3 veces; hay que leer el error (en las imágenes, el `.log` junto al PNG).
  - Espera porque falta el cargador, hay aviso térmico o poca memoria libre: es lo normal.
- **Pausar:** `touch PAUSA` (no empieza nada nuevo); `rm PAUSA` para seguir.
- **Comprobaciones pesadas a mano** (stills, tiras, Whisper): `scripts/turno.sh <comando>`, que espera su turno con el mismo candado.

## Comprobar antes de renderizar
1. `python3 scripts/auditar-planos.py src/videos/<Componente>.tsx` sale limpio, con la voz real.
2. `scripts/turno.sh npx tsc --noEmit -p .` sin errores (`registrar` ya lo comprueba si el turno está libre).
3. Stills del gancho, de la revelación y de un gráfico, para verlos con Read:
   ```bash
   scripts/turno.sh npx remotion still <Composición> "<scratchpad>/f0.png" --frame=0 --log=error
   ```
   **Qué mirar en el frame 0:**
   - texto del gancho visible;
   - imagen fuerte;
   - etiqueta de serie;
   - nada tapado por subtítulos.

   **En el gráfico:** que no choque con los subtítulos.
4. Dinero: la moneda de la audiencia y monedas lisas en los planos con dinero (revisados a tamaño completo).

## Render y portada
```bash
python3 "<S>/scripts/nuevo-video.py" cola <cuenta> render <Composición> <AAAA-MM-DD_serie_tema>
```
- Se niega si la voz es simulada, si falta algún plano en `public/` o si la auditoría no sale limpia. Avisa si falta la música o algún efecto.
- `--vista-previa` lo permite igualmente: el nombre lleva `-vista-previa` y no se entrega.
- Si ya había un render con ese nombre en `borradores/`, lo manda a la Papelera antes de encolar.

Al terminar, revisa en `noche.log` la línea del master: debe dar ≈ −14 LUFS y un pico de −1,5 dBTP o menos.

**Comprobación del video renderizado:**
- Extrae fotogramas a 1 fps (`ffmpeg -i … -vf fps=1 <scratchpad>/f_%02d.jpg`) y mira la secuencia.
- Detecta silencios con `silencedetect`: no debe haber ninguno de más de 0,4 s salvo el final.

## Entrega
1. Envía al usuario la copia ligera para que la vea en el móvil (`videos/borradores/movil/<nombre>_v1_movil.mp4`) y la portada.
2. **Cuando la apruebe:** pásala a `videos/finales/` sin sufijo de versión:
   - `borradores/<nombre>_v1.mp4` → `finales/<nombre>.mp4`
   - `borradores/<nombre>_portada.png` → `finales/<nombre>_portada.png`
   - `borradores/movil/<nombre>_v1_movil.mp4` → `finales/movil/<nombre>_movil.mp4`
   - Si ya había una versión anterior en `finales/`, va a la Papelera (`/usr/bin/trash` o el Finder; nunca `rm`). En `finales/` solo hay una versión por video.
   - `finales/Publicados/` es del usuario: allí mueve lo que ya ha subido. No lo toques.
3. Recuérdale el caption con la atribución de la música CC BY, que la voz de un plan gratuito de ElevenLabs no permite uso comercial y que etiquete el reel como contenido de IA si la plataforma lo pide.
4. Actualiza:
   - el `Estado` del guion;
   - la fila del calendario;
   - las notas de producción si se aprendió algo nuevo: `produccion/pipeline.md`, en "Reglas aprendidas" (créalo si no existe).
