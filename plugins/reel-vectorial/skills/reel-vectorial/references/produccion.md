# Voz, cola de tareas pesadas, fotogramas, render y entrega

`<S>` = la carpeta de la skill. Los scripts de la skill (`<S>/scripts/…`) se lanzan desde el proyecto `<P>` y reciben la cuenta por su nombre (`curiosidades`) o como `cuentas/<nombre>`; los de la cuenta se lanzan desde `<R>` (`cd "<P>/cuentas/<cuenta>/produccion/remotion"`).

## Voz
### Simulada (para montar sin gastar)
`python3 "<S>/scripts/nuevo-video.py" simular <cuenta> <carpeta>`. `crear` ya la pone si aún no hay voz.
- Silencio con el ritmo medido de una voz IA a velocidad 1,15 (≈3,2 palabras/s), más `tiempos.json` estimados. El error es de ≈0,3 s por frase.
- Lleva un archivo `.simulada`. La auditoría lo avisa y la cola no renderiza con ella (salvo `--sin-voz`, una vista previa muda que no se entrega).
- Sirve para montar y revisar escenas mientras se aprueba el guion o mientras no hay clave o saldo.

### Real (ElevenLabs)
```bash
python3 "<S>/scripts/nuevo-video.py" voz <cuenta> <carpeta>
```
- **Solo después del visto bueno al guion:** gasta ≈1 crédito por carácter.
- Es una llamada a la API, una línea cada vez; no carga el ordenador ni pasa por la cola.
- Modelo `eleven_multilingual_v2`, velocidad 1,15, con el texto anterior y el siguiente como contexto para que la entonación enlace.
- La genera en `vo/<carpeta>-nueva` y comprueba que estén todas las frases. Después compacta las pausas internas a 0,2 s. Solo entonces sustituye la carpeta: la simulada va a la papelera y una voz real anterior queda como `vo/<carpeta>-anterior-AAAAMMDD-HHMM`.
- **Claves y voz:** `<P>/.env` (o `<R>/.env` para una cuenta con otra voz): `ELEVENLABS_API_KEY`, opcionalmente `ELEVENLABS_API_KEY_2`, `_3`…, y `ELEVENLABS_VOICE_ID`. Nunca se leen, se imprimen ni se piden en el chat; si faltan, pide al usuario que las pegue él en el archivo (`instalacion.md`).
  - Cuando una clave se queda sin saldo, el script sigue con la siguiente.
  - Si alguna marca "actividad inusual", se detiene. No lo esquives: avisa al usuario.
- **Saldo:** `cd "<R>" && node scripts/voz-elevenlabs.mjs --claves` (≈3 créditos por clave).
- **Saltar claves agotadas:** `ELEVENLABS_DESDE=3 python3 "<S>/scripts/nuevo-video.py" voz …` usa solo las claves desde la `_3` (también vale con `--claves`).
- **Rehacer una frase:** edita `vo-<carpeta>.txt` y `python3 "<S>/scripts/nuevo-video.py" voz <cuenta> <carpeta> --solo N`. Conserva las demás frases.
- **Sin clave o sin saldo:** sigue con la simulada hasta el render, avisa al usuario y no entregues. Un TTS local de poca calidad no es un sustituto: una voz pobre tumba el video aunque las escenas sean buenas.

### Escuchar sin auriculares (Whisper)
`tiempos.json` solo alinea el texto enviado: no detecta si la voz se comió o pronunció mal una palabra. `voz` imprime el comando exacto; tiene esta forma (va por el turno: carga un modelo de ≈2 GB):
```bash
"<R>/scripts/turno.sh" ~/.venvs/whisper/bin/python "<S>/scripts/comprobar-voz.py" "<R>/public/vo/<carpeta>" 2>/dev/null
```
- Instalación del entorno de Whisper: `instalacion.md`.
- Las frases por debajo del 85 % salen con la diferencia.
- Muchas son confusiones de Whisper (nombres propios, cifras). Si es una palabra cambiada o que falta, reescríbela como suena y rehaz esa frase con `--solo N`.
- **Después de la voz real, repite siempre la auditoría:** los cortes se mueven.

## La cola de tareas pesadas (`scripts/noche.py`)
**Regla: una sola tarea pesada a la vez.** Un render se come la memoria, y dos procesos pesados juntos pueden colgar o reiniciar el ordenador.
- `noche-cola.txt`: una tarea por línea; se puede ampliar mientras corre. `noche-hecho.txt`: lo terminado. `noche.log`: el registro.
- El candado `<P>/recursos/turno-mac.lock` es común a **todas las cuentas** del proyecto (y a `turno.sh`). Si trabajas con varios proyectos en la misma máquina, apúntalos al mismo candado con `REELS_LOCK`.
- Antes de cada tarea espera a que haya memoria libre, poca carga, sin aviso térmico y con el cargador puesto (o batería > 50 %). Si la memoria libre cae por debajo del 15 % durante una tarea, la mata y la reintenta.
- Tareas:
  - `render <Composición> <nombre>`: render (concurrencia 2) + master a −14 LUFS → `videos/borradores/<nombre>_v1.mp4` y `movil/<nombre>_v1_movil.mp4`;
  - `portada <IdStill> <nombre>` → `videos/borradores/<nombre>_portada.png`.
- **Añadir:** con `nuevo-video.py cola …`, que evita duplicados y pone sufijo (`r2`) a la línea si ya se hizo. La salida se llama siempre igual (`<nombre>_v1.mp4`, `_v1_movil.mp4`, `_portada.png`): al repetir, el script manda antes lo anterior a la papelera.
- **Varios a la vez desde zsh:** escribe cada llamada entera; zsh no parte `$var` en palabras, así que `set -- $par` dentro de un bucle no separa los argumentos.
- **Lanzar el orquestador** si está parado (el script lo dice), en segundo plano desde `<R>`:
  - macOS: `caffeinate -i python3 scripts/noche.py --hasta-vaciar` (`caffeinate` evita que el Mac se duerma);
  - Linux: `python3 scripts/noche.py --hasta-vaciar`.

  Termina al vaciarse la cola. Es lo único que se lanza en segundo plano: nunca un render suelto.
- **Seguirlo:** `tail -n 30 noche.log`.
  - `✗ MATADA por seguridad`: faltó memoria; se reintenta sola.
  - `‼ abandonada`: falló 3 veces; lee el error.
  - Espera por cargador o aviso térmico: es normal.
- **Pausar:** `touch PAUSA` (no empieza nada nuevo); `rm PAUSA` para seguir.

## Fotogramas de revisión
```bash
python3 "<S>/scripts/nuevo-video.py" stills <cuenta> <Composición> --salida <carpeta temporal>/<Composición>
python3 "<S>/scripts/nuevo-video.py" stills <cuenta> <Composición> --frames 0,315,1263 --salida …   # frames concretos
python3 "<S>/scripts/nuevo-video.py" stills <cuenta> Portada-<Componente> --frames 0 --salida …       # la portada
```
- Un solo empaquetado y un solo navegador, en el turno (`turno.sh`): espera si la cola está trabajando.
- Por defecto saca el frame 0, la mitad de cada plano y el último, y monta `hoja-<Composición>.jpg` (6 por fila, en orden).
- Mira primero la hoja y luego a tamaño completo lo importante (lista de `escenas.md`, "Revisión").
- La primera vez, si no hay Google Chrome, Remotion descarga su navegador.

## Antes de renderizar
1. `auditar-escenas.py` sale limpio.
2. Voz real, comprobada con Whisper.
3. Fotogramas revisados: frame 0, giro, un gráfico, último (bucle) y portada.
4. `cd "<R>" && npx tsc --noEmit -p .` sin errores (lo hacen `crear` y `registrar`).

## Render y portada
```bash
python3 "<S>/scripts/nuevo-video.py" cola <cuenta> render <Composición> <AAAA-MM-DD_serie_tema>
```
- Encola `render` y `portada`.
- Se niega si la voz es simulada o si la auditoría falla.

**Al terminar:**
- En `noche.log`, la línea del master: ≈ −14 LUFS y pico de −1,5 dBTP o menos.
- Fotogramas a 1 fps: `ffmpeg -i <video> -vf fps=1 <carpeta temporal>/f_%02d.jpg`. Míralos en orden.
- Silencios: `ffmpeg -i <video> -af silencedetect=n=-40dB:d=0.4 -f null -`. Ninguno salvo el final.

## Entrega
1. Dile al usuario dónde están la copia ligera (`videos/borradores/movil/<nombre>_v1_movil.mp4`) y la portada (adjúntalas si el entorno lo permite).
2. Recuerda:
   - la licencia de la voz y los efectos de ElevenLabs (plan gratuito = uso no comercial);
   - la atribución de la música en el caption;
   - la etiqueta "contenido de IA".
3. **Cuando lo apruebe**, pásalo a `videos/finales/` sin sufijo de versión:
   - `borradores/<nombre>_v1.mp4` → `finales/<nombre>.mp4`;
   - `borradores/<nombre>_portada.png` → `finales/<nombre>_portada.png`;
   - `borradores/movil/<nombre>_v1_movil.mp4` → `finales/movil/<nombre>_movil.mp4`.
4. Si había una versión anterior en `finales/`, va a la papelera del sistema (macOS: `trash`; Linux: `gio trash`), nunca con `rm`. En `finales/` hay una sola versión por video.
5. `finales/Publicados/` es del usuario: no la toques.
6. Actualiza el `Estado` del guion, la fila de `ideas.md` y el calendario si existe. Si aprendiste algo, añádelo a `estilo.md` de la cuenta.
