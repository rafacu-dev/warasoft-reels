---
name: reel-diorama
description: Produce reels verticales de motion graphics 2.5D estilo "diorama nocturno" (1080×1920, 30 fps, 35–55 s) de principio a fin en un Mac con Apple Silicon: guion con gancho-pregunta y bucle, voz IA de ElevenLabs con tiempos por palabra (o voz simulada para montar sin créditos), planos generados en local con Z-Image Turbo y cámara 3D por profundidad, montaje en Remotion con subtítulos palabra a palabra, gráficos, efectos graves, música CC BY, portada, render por una cola que no satura el Mac y entrega. También prepara el entorno de imágenes y monta el kit en una cuenta nueva (carpeta cuentas/ del proyecto). Úsala siempre que el usuario pida un reel, video o guion con imágenes generadas o "dioramas", un video "como los de @sal.delarueda", crear una cuenta para este formato, rehacer la voz, regenerar o revisar planos, cambiar cortes, renderizar, hacer una portada o pasar un video a finales, aunque no diga "skill" ni "diorama". Si el reel se hace solo con gráficos en código, es reel-vectorial.
---

# Reels "diorama nocturno"

Un reel de este kit es una **metáfora visual** que se mueve:
- dioramas 3D generados en local que la cámara recorre con profundidad;
- una voz documental cercana;
- subtítulos grandes palabra a palabra, con la palabra clave en color;
- cifras y gráficos que se construyen en pantalla;
- un gancho-pregunta en el segundo 1 cuya respuesta llega al final;
- un último plano que vuelve al primero (bucle).

**Ejemplo público del formato:** [@sal.delarueda](https://www.instagram.com/sal.delarueda/). Cuando dudes de cómo se resuelve algo, mira la demo de la cuenta (`<R>/src/videos/Demo.tsx`) y los videos anteriores de `<R>/src/videos/`.

**Rutas.** La sesión puede estar abierta en cualquier carpeta, pero todo el trabajo vive en el proyecto:
- `<S>` = la carpeta de esta skill: la ruta que Claude Code muestra como "Base directory for this skill" al cargarla. Instalada como plugin es `${CLAUDE_PLUGIN_ROOT}/skills/reel-diorama`; copiada a mano, `~/.claude/skills/reel-diorama`.
- `<P>` = el proyecto: la carpeta que contiene `cuentas/` (normalmente donde se abrió Claude Code). Los scripts la buscan solos desde la carpeta actual; si no, `--proyecto <P>` o `REELS_PROYECTO`.
- `<cuenta>` = `cuentas/<carpeta-de-la-cuenta>` y `<R>` = `<cuenta>/produccion/remotion`, ambas dentro de `<P>`.
- Los scripts de la skill se lanzan desde `<P>`: `cd "<P>" && python3 "<S>/scripts/…"`.
- Los de la cuenta (`scripts/…`) se lanzan desde `<R>`: `cd "<P>/<R>" && …`.
- Pon las rutas entre comillas (pueden tener espacios) y usa rutas absolutas con Read, Write y Edit.

## 0. Antes de nada
1. **¿Está listo el Mac?** La primera vez, o si algo falla al generar imágenes o renderizar: `bash "<S>/scripts/preparar-entorno.sh" --comprobar`. Requisitos, instalación y licencias: `references/instalacion.md`.
2. **Reglas del proyecto:** si existe `<P>/CLAUDE.md`, léelo. Son correcciones del usuario que mandan sobre esta skill.
3. **¿Qué cuenta?** Si el usuario no la nombra, mira qué carpetas de `<P>/cuentas/` tienen el kit (`produccion/remotion/src/engine/Reel.tsx`). Si hay varias, pregunta. Si no hay ninguna o es una cuenta nueva, sigue `references/cuenta-nueva.md` y vuelve aquí.
4. **Lee lo de la cuenta** (es lo que mantiene cada cuenta con su estilo; nunca mezcles estilos entre cuentas):
   - `contexto.md`, `estilo.md`, `tono-de-voz.md`, `ideas.md` y `referencias/`;
   - `estrategia/` si existe: pilares y series;
   - `produccion/ficha-reel.md`: firma, series con sus nombres de archivo, personajes fijos, moneda, música, CTA y cuidado legal;
   - `produccion/pipeline.md` si existe, sobre todo sus "Reglas aprendidas".

   Si dos documentos se contradicen, manda el más reciente que venga de una corrección del usuario.
5. **Mira qué hay ya:** `guiones/`, `calendario/`, `videos/finales/` y `videos/finales/Publicados/`. Así no se repiten tema, metáfora, gancho ni giro.
6. **Verifica la premisa.** Una idea de `ideas.md` o del usuario puede ser falsa tal cual ("Ikea no gana dinero vendiendo muebles").
   - Compruébala con fuentes primarias: memorias anuales, la web de la empresa, organismos oficiales.
   - Si no se sostiene, reformúlala con el dato verificable más cercano y explícalo arriba del guion para que el usuario lo decida al aprobarlo.
   - Si falta información clave, pregunta antes de inventar.

## Lo que no se negocia (y por qué)
- **Una tarea pesada a la vez en el Mac.** El generador ocupa ≈18 GB con `--low-ram` (≈33 GB sin él); dos generadores y un render a la vez bastan para que un Mac de 48 GB se quede sin memoria y se reinicie.
  - Imágenes, exportación de profundidad, render y portada van por la cola (`scripts/noche.py`).
  - Las comprobaciones pesadas a mano (stills, tiras, Whisper) van con `scripts/turno.sh`, que espera al mismo candado.
  - El turno lo comparten todas las cuentas del proyecto. Nunca lances `generar.sh`, un render o Depth Pro fuera de la cola o del turno, ni en segundo plano junto a otra tarea pesada.
- **Sonido sin aire ni brillo.** Solo `impacto`, `moneda-suave` y `monedas-suave`, ligados a una palabra. Nada de whoosh, riser ni barridos (en el móvil suenan a viento pegado al micrófono) ni brillos metálicos. El motor rechaza los prohibidos.
- **Dinero en la moneda de la audiencia y monedas lisas; personas = maniquíes sin rostro.** El generador pinta dólares y símbolos ($, ₿) si no se le dice lo contrario (ver `references/imagenes.md`).
- **Planos de 2,5 s como máximo** (75 frames). El render falla si uno se pasa. Un cambio visual cada 1,5–2,5 s.
- **Frame 0 lleno:** imagen fuerte y primer bloque del gancho visibles, sin fundido. **Sin cola muerta:** termina con la última palabra, sobre el plano `00`.
- **Claves:**
  - Las de ElevenLabs viven en `<R>/.env` (chmod 600). No se leen, no se imprimen y no se piden en el chat: el usuario las pega con un editor.
  - Si una cuenta de ElevenLabs marca "actividad inusual", se para y se avisa.
  - No se clonan voces de otras personas.
- **Nada se entrega con voz simulada ni con planos provisionales.** Sirven para montar y revisar; la cola se niega a renderizar una entrega con ellos.
- **Licencias, que se recuerdan en cada entrega:**
  - La voz y los efectos de un plan gratuito de ElevenLabs no permiten uso comercial.
  - La música CC BY exige atribución en el caption.
  - Remotion es gratis para personas y empresas de hasta 3 personas; las mayores necesitan licencia (remotion.dev/license).

## Nombres de un video
Con la serie de `ficha-reel.md` (columnas "Carpeta" y "Slug") y el número siguiente al último de esa serie en `<R>/src/Root.tsx`:

| Qué | Patrón | Ejemplo (Quién gana #4) |
|---|---|---|
| Carpeta (imágenes, `public/`, voz) | `<prefijo><NN>` | `quien04` |
| Texto de la voz | `<R>/vo-<carpeta>.txt` | `vo-quien04.txt` |
| Componente | `<Prefijo><NN>` | `Quien04` |
| Composición | `<Componente>-<tema>` | `Quien04-ikea` |
| Portada | `Portada-<Componente>` | `Portada-Quien04` |
| Guion y video | `AAAA-MM-DD_<slug>_<tema>` | `2026-12-12_quien-gana_ikea` |

La fecha es la de publicación prevista:
- Si el video ya está en el calendario, la que tenga allí.
- Si no, el siguiente hueco de su cadencia. En ese caso, añade la fila al calendario al escribir el guion y marca la idea en `ideas.md`.

## Flujo de un video
Usa el plan de tareas para seguir estas fases. Las fases 3 y 4 pueden ir en paralelo: mientras la cola genera imágenes, genera la voz y monta la configuración (la voz es una llamada a una API y no carga el Mac).

### 1. Guion → `references/guion.md`
1. Escribe:
   - `guiones/<nombre>.md`, con la tabla voz → planos → gráfico, las cifras con fuente y el caption;
   - `<R>/vo-<carpeta>.txt`, con una frase por línea.
2. Pasa el revisor (te dice también qué se leerá en el frame 0):
   ```bash
   python3 "<S>/scripts/revisar-voz.py" "<R>/vo-<carpeta>.txt"
   ```
3. **Enseña el guion y espera el visto bueno antes de generar la voz:** cuesta ≈1 crédito por carácter (≈750 un video) y el saldo es limitado.

### 2. Andamio
```bash
python3 "<S>/scripts/nuevo-video.py" crear <cuenta> <carpeta> --serie "SERIE · #N"
```
- Crea `assets/imagenes/<carpeta>/` (`generar.sh`, `planos.tsv`, `semillas.tsv`) y `vo-<carpeta>.txt` si faltan.
- Si `vo-<carpeta>.txt` ya tiene el guion, pone **voz simulada** (silencio con tiempos estimados) y escribe `<R>/src/videos/<Componente>.tsx` con un plano cada ≈2 s cortado en palabras, las imágenes de `planos.tsv` por orden y el bucle al `00`. Lánzalo de nuevo después de escribir `planos.tsv` si quieres que use sus nombres.

### 3. Planos → `references/imagenes.md`
1. Escribe `planos.tsv`: 12–16 planos; `00` es el gancho, el bucle y la portada.
2. Encola las imágenes, con semillas extra para el gancho y la revelación:
   ```bash
   python3 "<S>/scripts/nuevo-video.py" cola <cuenta> imagenes <carpeta> --extra 00:12,13 --extra <revelación>:12,13
   ```
3. Lanza la cola si está parada (el script te dice si lo está), en segundo plano desde `<R>`: `caffeinate -i python3 scripts/noche.py --hasta-vaciar`.
4. Cuando terminen, revisa la hoja de contacto y abre a tamaño completo el `00`, la revelación y todo plano con dinero.
5. Elige semillas en `semillas.tsv` y vuelve a encolar las imágenes (añade el `export`; se reexporta lo que cambió).

### 4. Voz → `references/produccion.md`
1. `python3 "<S>/scripts/nuevo-video.py" voz <cuenta> <carpeta>`: genera la voz con ElevenLabs aparte, comprueba que salió entera, compacta las pausas a 0,2 s y sustituye la simulada.
2. Pasa `comprobar-voz.py` por el turno: transcribe con Whisper y marca las frases donde la voz no dice lo que pone el guion (el comando exacto lo imprime `voz`).
3. **Sin clave o sin saldo:** sigue con la voz simulada hasta el montaje, avisa al usuario y no entregues.

### 5. Montaje → `references/motor.md`
1. Ajusta `<R>/src/videos/<Componente>.tsx`: cortes en palabras con peso, movimientos alternados, claves, merges, gráficos, respiro, efectos y música.
2. Audita desde `<R>` hasta que salga limpio (vuelve a pasarlo siempre que cambie la voz):
   ```bash
   python3 scripts/auditar-planos.py src/videos/<Componente>.tsx --frames
   ```
3. Registra la composición y la portada (vale con voz simulada):
   ```bash
   python3 "<S>/scripts/nuevo-video.py" registrar <cuenta> <Componente> <Composición> --img <carpeta>/00 --serie "…" --titulo "…|…|…" [--align top]
   ```

### 6. Comprobación y render
1. Saca los stills y míralos con Read (el número de frame de cada plano te lo da `auditar-planos.py --frames`). Siempre por el turno y con rutas absolutas:
   - Frame 0, revelación y un gráfico: `scripts/turno.sh npx remotion still <Composición> "<ruta absoluta>.png" --frame=N --log=error`.
   - Portada: `scripts/turno.sh npx remotion still Portada-<Componente> "<ruta absoluta>.png" --log=error`.
   - **Tira fotograma a fotograma** en la revelación y en cada `whip`, `zoom` o `flash`: `python3 "<S>/scripts/nuevo-video.py" tira <cuenta> <Composición> <frame>:10`. Busca fotogramas vacíos, saltos de plano y destellos sobre escenas oscuras.
2. Encola el render y la portada (se niega con voz simulada, planos que falten o auditoría sucia):
   ```bash
   python3 "<S>/scripts/nuevo-video.py" cola <cuenta> render <Composición> <nombre>
   ```
3. Al terminar, comprueba el master (≈ −14 LUFS) y los fotogramas a 1 fps.

### 7. Entrega
1. Envía al usuario la copia `movil/` y la portada.
2. Cuando la apruebe, pásala a `videos/finales/` sin sufijo; las versiones viejas van a la Papelera (nunca `rm`).
3. Actualiza el estado del guion, el calendario e `ideas.md`, y recuerda las licencias (voz, música).
4. `finales/Publicados/` es del usuario: no la toques.

## Cambios sobre un video que ya existe
| Petición | Qué hacer |
|---|---|
| Cambiar una frase de la voz | Editar `vo-<carpeta>.txt` + `voz … --solo N` + `comprobar-voz` + auditoría (los cortes pueden moverse) + render |
| Rehacer toda la voz | `voz` sin `--solo`: genera aparte y solo sustituye si sale entera; la anterior queda como `vo/<carpeta>-anterior-…` |
| Cambiar un plano | Nuevo prompt o semilla → `cola imagenes` → `semillas.tsv` → `export` → render |
| Cambiar la portada | `registrar` de nuevo con otro `--titulo`, `--img` o `--align` (reemplaza el Still) y `cola <cuenta> portada <Componente> <nombre>` |

## Errores típicos
- **Root.tsx importa un video sin `tiempos.json`:** fallan todos los renders y portadas de la cola, no solo ese. Por eso `registrar` lo impide.
- **Una línea ya hecha no se repite:** la cola la salta. Repetir una tarea exige sufijo; los scripts lo añaden.
- **Al cambiar la voz, los planos cambian de duración.** Vuelve a pasar la auditoría siempre (la simulada se equivoca ≈0,3 s por frase).
- **El primer bloque de subtítulos (3 palabras o hasta la primera coma) es lo único que se lee en el frame 0 y en la miniatura.** Si la tercera es una palabra vacía («¿Por qué tu…»), el motor alarga el bloque hasta 5 palabras («¿Por qué tu nómina»); `revisar-voz.py` lo muestra. "¿Por qué las…" no dice nada; "Ikea paga por" engancha.
- **Título de portada con líneas de más de 18 caracteres** (sin contar asteriscos): se parte mal a 100 px.
- **`scripts/turno.sh` cambia a `<R>` antes de ejecutar:** usa rutas absolutas en lo que le pases.
- **"No browser found" o WebGL en negro al renderizar:** ver "Problemas frecuentes" en `references/instalacion.md`.
