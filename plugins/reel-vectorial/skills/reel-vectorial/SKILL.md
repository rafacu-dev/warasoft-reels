---
name: reel-vectorial
description: Produce reels verticales de motion graphics hechos solo con gráficos en código (SVG/HTML en Remotion, sin generador de imágenes), 1080×1920, 30 fps, 35–55 s, de principio a fin. Guion con gancho-pregunta y bucle, voz IA de ElevenLabs con tiempos por palabra (o voz simulada sin créditos), escenas animadas con el kit (escenarios con luz, personaje que actúa, plano subjetivo, diagramas de neón, móvil de "Envíaselo"), subtítulos palabra a palabra, efectos graves, música CC BY, portada y render por una cola que no satura el ordenador. También crea una cuenta nueva con el proyecto de Remotion, los scripts y un video de ejemplo. Úsala cuando pidan un reel o short "vectorial", "con gráficos", "dibujado", "animado en código", "sin imágenes generadas" o "de motion graphics", un video como los de Dato Rarito (YouTube), montar una cuenta para reels así, o cambiar guion, voz, escenas, fotogramas, render o portada de uno, aunque no digan "skill". Si el reel usa imágenes generadas por IA, no es esta skill.
---

# Reels vectoriales (gráficos en código)

Un reel de este kit es un **mini-cartoon que se mueve sin parar**:
- escenas dibujadas en código (SVG/HTML en Remotion): un sitio con luz y profundidad, un protagonista que actúa, plano subjetivo cuando el espectador hace algo y diagramas de neón para explicar;
- una voz IA (ElevenLabs) con los tiempos de cada palabra;
- subtítulos grandes palabra a palabra, con la palabra clave en una píldora del mismo color que su gráfico;
- un gancho-pregunta con lo raro ya en pantalla en el frame 0, cuya respuesta llega al final;
- un último plano que vuelve al primero (bucle);
- grano, viñeta y temblor en los golpes, para que no parezca una plantilla.

**Ejemplo público del formato:** [Dato Rarito](https://www.youtube.com/@DatoRarito), en YouTube. **Ejemplo en código:** el video `Demo01` que trae cada cuenta nueva (`src/videos/Demo01.tsx`): gancho, cámara lenta, sello tachado, diagrama, personaje, móvil de la CTA y bucle. Cuando dudes de cómo se hace algo, míralo ahí.

**Rutas** (el proyecto puede tener espacios: pon las rutas siempre entre comillas):
- `<S>` = la carpeta de esta skill. Claude Code la muestra al cargarla ("Base directory for this skill"). Instalada como plugin es `${CLAUDE_PLUGIN_ROOT}/skills/reel-vectorial`; copiada a mano, `~/.claude/skills/reel-vectorial`. Si no la ves, búscala: `find ~/.claude -path "*reel-vectorial/scripts/nuevo-video.py"`.
- `<P>` = el proyecto: la carpeta donde el usuario trabaja con Claude Code, la que contiene `cuentas/`. Los scripts la encuentran solos desde la carpeta actual (o la primera superior con `cuentas/`); se fuerza con `--proyecto <ruta>` o con la variable `REELS_PROYECTO`.
- `<cuenta>` = el nombre de la carpeta de la cuenta (`curiosidades`) o `cuentas/curiosidades`; `<R>` = `<P>/cuentas/<cuenta>/produccion/remotion`.
- Los scripts de la skill se lanzan desde `<P>`: `python3 "<S>/scripts/nuevo-video.py" … <cuenta> …`. Los de la cuenta (`scripts/…`), desde `<R>`: `cd "<R>" && …`.
- Con Read, Write y Edit, rutas absolutas.

## 0. Antes de nada
1. **Requisitos:** Node 20+, Python 3.10+ y ffmpeg. Si es la primera vez en esta máquina o algo falla al instalar, sigue `references/instalacion.md`. Pensado para macOS (probado en Apple Silicon); en Linux funciona con las salvedades que explica ese archivo.
2. **¿Qué cuenta?** Mira `<P>/cuentas/*/produccion/remotion/src/kit/index.ts`. Si no la nombra y hay más de una posible, pregunta. Si no hay ninguna, o la cuenta no tiene el kit, sigue `references/cuenta-nueva.md` (crea la cuenta, el proyecto de Remotion y el video de ejemplo).
3. **Lee lo de la cuenta:**
   - `contexto.md`, `estilo.md`, `tono-de-voz.md`, `ideas.md` y `referencias/`;
   - `produccion/ficha-reel.md`: identidad, protagonista, mundo, series, voz, música, CTA y cuidado legal;
   - `src/brand.tsx`: paleta y colores con significado.

   Si algo de la ficha está "POR DEFINIR" y hace falta, pregunta antes de inventar. Si el proyecto tiene un `CLAUDE.md` con reglas propias, esas mandan.
4. **Mira qué hay ya:** `guiones/`, `videos/finales/` (y `Publicados/` si existe) y `src/Root.tsx`. No repitas tema, gancho ni giro.
5. **Verifica la premisa** con fuentes primarias (estudios, organismos oficiales, leyes publicadas). Los datos curiosos virales suelen ser medio falsos, y en este formato la credibilidad es lo que se juega: los comentarios de "eso nunca pasó" hunden una cuenta. Si no se sostiene, reformúlala con el dato verificable más cercano y explícalo arriba del guion.

## Lo que no se negocia (y por qué)
- **Escenas llenas que se mueven, nunca "cosas feas estáticas".** Los primeros intentos de este formato fracasaron justo por eso: iconos pequeños sobre el mismo fondo, y luego escenas correctas pero planas frente a un acabado y una voz de más nivel. Cada plano es un sitio con luz y profundidad, con un sujeto que ocupa ≥ 40 % del encuadre y algo que cambia en la palabra clave. Antes de dar nada por bueno, mira los fotogramas a tamaño completo: `references/escenas.md`.
- **Voz IA de calidad en lo que se entrega; la simulada solo para montar.** La voz simulada (silencio con el ritmo medido) sirve para construir y revisar escenas sin gastar créditos; la cola se niega a renderizar con ella salvo como vista previa muda. No sustituyas la voz real por un TTS local mediocre: una voz pobre tumba un video aunque las escenas sean buenas.
- **Una tarea pesada a la vez.** Un render, un modelo de voz local o Whisper se comen la memoria; dos a la vez pueden colgar o reiniciar el ordenador (le pasó al equipo donde nació este kit). Fotogramas: `nuevo-video.py stills`, que va por `scripts/turno.sh`. Render y portada: por la cola (`scripts/noche.py`). El candado (`<P>/recursos/turno-mac.lock`) es común a todas las cuentas del proyecto. Nunca lances un render a mano en segundo plano.
- **Sonido sin aire ni brillo.** Solo `impacto`, `impacto-grave`, `pop-grave`, `moneda-suave` y `monedas-suave`, ligados a una palabra. Nada de whoosh, risers ni brillos: bajo la voz se oyen como viento pegado al micrófono o como un chirrido metálico. El motor rechaza los prohibidos.
- **Planos de 2,5 s como máximo** (75 frames; el render falla si uno se pasa) y un cambio visual cada 1–2 s.
- **Frame 0 lleno:** lo raro del gancho y el primer bloque de subtítulos, sin fundido. **Bucle:** el último plano vuelve al estado y la cámara del primero.
- **Cada cuenta, su identidad.** Paleta, protagonista, logo y firma salen de su `brand.tsx`; no se mezclan estilos ni protagonistas entre cuentas.
- **Claves:** viven en `<P>/.env` (o en `<R>/.env` si una cuenta usa otras). No se leen, no se imprimen y no se piden en el chat: el usuario las pega él mismo en el archivo. Si una cuenta de ElevenLabs marca "actividad inusual", para y avisa.
- **Licencias, en cada entrega:** la voz y los efectos de un plan gratuito de ElevenLabs no permiten uso comercial; la música CC BY exige atribución en el caption; el reel se etiqueta como "contenido de IA". `references/audio.md`.

## Nombres de un video
Con la serie de `ficha-reel.md` y el número siguiente al último de esa serie en `src/Root.tsx`:

| Qué | Patrón | Ejemplo (serie "DATO CURIOSO", #3) |
|---|---|---|
| Carpeta (voz en `public/vo/`) | `<prefijo><NN>` | `cafe03` |
| Texto de la voz | `<R>/vo-<carpeta>.txt` | `vo-cafe03.txt` |
| Componente (`src/videos/`) | `<Prefijo><NN>` | `Cafe03` |
| Composición | `<Componente>-<tema>` | `Cafe03-cerebro` |
| Portada | `Portada-<Componente>` (el video exporta `Portada<Componente>`) | `Portada-Cafe03` |
| Guion y video | `AAAA-MM-DD_<slug>_<tema>` | `2026-11-10_dato-curioso_cafe-cerebro` |

La fecha es la de publicación prevista: la del calendario si existe y, si no, la siguiente libre.

## Flujo de un video
Sigue las fases con un plan de tareas. **Paradas con el usuario: solo dos.** El guion, antes de gastar créditos de voz, y el borrador, antes de pasarlo a finales. Lo demás (escenas, fotogramas, auditorías) lo revisas tú.

### 1. Guion → `references/guion.md`
1. Escribe:
   - `guiones/<nombre>.md`: tabla voz → escenas, con lo que se dibuja y lo que pasa en cada palabra clave, el mundo del video, los colores con significado, las fuentes y el caption;
   - `<R>/vo-<carpeta>.txt`: una frase por línea.
2. Pasa el revisor:
   ```bash
   python3 "<S>/scripts/revisar-voz.py" "<R>/vo-<carpeta>.txt"
   ```
   También dice qué se leerá en el frame 0.
3. **Enseña el guion y espera el visto bueno** (la voz gasta ≈1 crédito de ElevenLabs por carácter, ≈700 por video).

### 2. Andamio y voz → `references/produccion.md`
```bash
python3 "<S>/scripts/nuevo-video.py" crear <cuenta> <carpeta> <Componente> --serie "SERIE · #N"
python3 "<S>/scripts/nuevo-video.py" voz <cuenta> <carpeta>
```
- `crear` pone voz simulada si aún no hay voz y escribe `src/videos/<Componente>.tsx`: planos `Pendiente(n)` de ≈2 s cortados en palabras, configuración y portada. Así se puede montar y mirar desde el primer minuto.
- `voz` genera la voz real (llamada a la API, no carga el ordenador), comprueba que salió entera y compacta las pausas. Solo entonces sustituye la simulada.
- Después, Whisper con `comprobar-voz.py`, por el turno (el comando exacto lo imprime `voz`).
- **Sin clave o sin saldo:** sigue con la voz simulada hasta el render, avisa al usuario y no entregues.

### 3. Escenas → `references/escenas.md` + `references/kit.md`
1. Decide el **mundo** del video (un solo sitio coherente) y qué significa cada color. Apúntalo en la cabecera del `.tsx`.
2. Sustituye cada `Pendiente(n)` por escenas de verdad con el kit (`import { … } from "../kit"`): escenario, sujeto, luz, profundidad y la acción ligada a su palabra con `A(frase, "palabra")`.
3. Lo que sigue de un plano a otro se calcula con el frame absoluto (`useF(t0)`). El último plano repite el primero.

### 4. Montaje → `references/motor.md`
1. Planos cortados a la palabra, cámara con `cam()`, transiciones, subtítulos arriba, en medio o abajo según dónde esté el sujeto, claves, efectos y música.
2. Audita hasta que salga limpio, y repítelo siempre que cambie la voz:
   ```bash
   cd "<R>" && python3 scripts/auditar-escenas.py src/videos/<Componente>.tsx --frames
   ```
3. Registra la composición y la portada (vale con voz simulada):
   ```bash
   python3 "<S>/scripts/nuevo-video.py" registrar <cuenta> <Componente> <Componente>-<tema>
   ```

### 5. Revisión con fotogramas
```bash
python3 "<S>/scripts/nuevo-video.py" stills <cuenta> <Composición> --salida <carpeta temporal>/<Composición>
```
- Saca el frame 0, la mitad de cada plano y el último, más la hoja de contacto `hoja-<Composición>.jpg`. La primera vez Remotion puede descargar su navegador.
- Mira la hoja con Read y abre a tamaño completo el frame 0, el giro, un gráfico y el último. Usa la lista de `references/escenas.md` ("Revisión").
- Corrige y repite hasta que cada plano aguante una captura de pantalla. Saca también la portada (`stills <cuenta> Portada-<Componente> --frames 0`).
- En transiciones, la revelación y los cambios de cara, saca una tira fotograma a fotograma: `stills <cuenta> <Composición> --tira <frame>:10`. Busca saltos y fotogramas vacíos.

### 6. Render
```bash
python3 "<S>/scripts/nuevo-video.py" cola <cuenta> render <Composición> <nombre>
```
- Se niega con voz simulada o si la auditoría no sale limpia.
- Si el orquestador está parado, el script dice cómo lanzarlo (en macOS con `caffeinate` para que no se duerma). Lánzalo en segundo plano desde `<R>`: termina solo al vaciar la cola.
- Al terminar, comprueba en `noche.log` el master (≈ −14 LUFS, pico ≤ −1,5 dBTP) y mira el video a 1 fps.

### 7. Entrega
1. Dile al usuario dónde está la copia ligera (`videos/borradores/movil/`) y la portada; si el entorno permite adjuntar archivos, adjúntalas. Recuérdale las licencias.
2. **Cuando la apruebe**, pásala a `videos/finales/` sin sufijo. Lo viejo va a la papelera del sistema, nunca con `rm`.
3. Actualiza el estado del guion, `ideas.md` y el calendario si hay.
4. `finales/Publicados/` es del usuario: no la toques.

## Cambios sobre un video que ya existe
| Petición | Qué hacer |
|---|---|
| Cambiar una frase de la voz | Editar `vo-<carpeta>.txt` → `voz … --solo N` → Whisper → auditoría (los cortes se mueven) → stills → render (la cola repite la línea con sufijo `r2`; el render anterior va antes a la papelera) |
| Rehacer toda la voz | `voz <cuenta> <carpeta>`: genera aparte y guarda la anterior como `vo/<carpeta>-anterior-…` |
| Cambiar una escena | Editar su componente → `stills --frames` de ese plano → render |
| Cambiar la portada | Editar `Portada<Componente>` en el video (título, momento `t0`, `align`) → `stills Portada-<Componente> --frames 0` → `cola <cuenta> portada <Componente> <nombre>` |
| Llevar el formato a otra cuenta, o actualizar el kit | `references/cuenta-nueva.md` |

## Errores típicos
- **Root.tsx importa un video sin `tiempos.json`:** fallan todos los renders y portadas de la cola, no solo ese. Por eso `registrar` lo impide.
- **Una palabra de `A(…)` o de un corte no existe en la voz real** (la simulada usaba el texto). El render falla en la cola: la auditoría lo detecta.
- **Escena que ignora `t0`:** el objeto, el trazo o la luz saltan al cortar, y el bucle no encaja.
- **Cámara con zoom < 1 o sin `cam()`:** bordes negros.
- **Destello blanco hacia una escena oscura:** se ve como un fotograma vacío. Usa `zoom` o `whip`.
- **Texto pequeño o dentro de la escena repitiendo el subtítulo.** Un dato, un sitio: la cifra va en el subtítulo o en un gráfico, no en los dos.
- **Título de portada con líneas de más de 18 caracteres:** se parte mal a 100 px (la auditoría avisa).
- **Editar `src/kit/`, `src/engine/Reel.tsx` o `scripts/` en una cuenta:** son de la skill y `montar-cuenta.py --actualizar` los sincroniza. Lo propio del video va en `src/videos/`; una pieza que sirva para todos se añade a la skill (`assets/plantilla-proyecto/src/kit/`).
- **Faltan efectos o música:** el motor los omite (y avisa en la consola del navegador); el video se ve igual pero sin ese sonido. `references/audio.md`.
