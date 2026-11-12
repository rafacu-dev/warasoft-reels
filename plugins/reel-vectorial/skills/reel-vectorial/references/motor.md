# Motor de reels (`src/engine/Reel.tsx`) con escenas

Cada video es una configuración (`ReelConfig`) en `src/videos/<Componente>.tsx`. `nuevo-video.py crear` la deja hecha con planos `Pendiente(n)`. El motor pone:
- cada escena con su cámara (`move`) y su transición;
- subtítulos palabra a palabra, con la palabra clave en píldora de color (`KEY` de brand.tsx);
- gráficos de cifras, efectos y la música, que baja sola bajo la voz;
- la etiqueta de serie en el gancho y, en la última frase, el sello con el logo y `HANDLE`;
- un acabado común: viñeta, degradados arriba y abajo para leer y grano fino.

## Tiempos
```tsx
const tl = timeline(tiempos, 2); // 2 frames de pausa entre frases
export const TOTAL_CAFE03 = tl.total;
const A = (n: number, w?: string, occ = 1, off = 0) => tl.at(w ? [n, w, occ, off] : [n, undefined, undefined, off]);
```
- `A(3)`: frame en que empieza la frase 3 (cuentan desde 1).
- `A(3, "seis")`: cuando empieza esa palabra. Se compara sin tildes, mayúsculas ni signos; usa la palabra tal como la dice la voz en `tiempos.json`, no la de `merges`.
- `A(1, "por", 2)`: la segunda vez que sale. `A(3, "seis", 1, 4)`: 4 frames después.
- Si la palabra no existe, el video falla al cargar con el texto de la frase. La auditoría lo detecta antes.
- Pon los momentos clave arriba, como constantes (`const GIRO = A(4, "revés") - 2;`), y úsalos en escenas, efectos y portada.

## Planos (`shots`)
```tsx
shots: [
  { img: "", scene: Gancho, at: [1], move: mv(HOOK_A, HOOK_B) },
  { img: "", scene: Reto, at: [2], move: mv(C0, cam([640, 700], 1.06)), trans: "whip", cap: "bottom" },
  { img: "", scene: (p) => <Enlace {...p} sync />, at: [9, "pie"], move: mv(cam([700, 1320], 1.2), cam([700, 1340], 1.28)) },
  // …
  { img: "", scene: Bucle, at: [11, "y"], move: mv(cam([540, 980], 1.1), HOOK_A), trans: "zoom" },
],
```
| Campo | Valores | Uso |
|---|---|---|
| `img` | `""` | Siempre vacío en este kit (si es una foto, el nombre del plano en `public/<imgDir>/`) |
| `scene` | componente `React.FC<S>` | La escena; recibe `t0` (frame absoluto del inicio del plano) y `dur` |
| `at` | `[frase]`, `[frase, "palabra", aparición?, desfase?]` o un número de frame | Dónde empieza el plano. La auditoría entiende también `A(…) ± n` |
| `move` | `mv(cam(p, z), cam(p2, z2))` | Cámara del plano: centra el punto `p` con zoom `z` (≥ 1, sin bordes negros). Alterna acercar y alejar. Como no deja bordes, el centro se recorta: con zoom `z` solo llega a y ∈ [960/z, 1920 − 960/z] y x ∈ [540/z, 1080 − 540/z]. Para encuadrar algo pegado al suelo o a un lado, sube el zoom o mueve el objeto |
| `trans` | `cut` (defecto) · `whip` · `zoom` · `fade` · `flash` | `whip` al cambiar de idea, `zoom` en revelaciones, `fade` 1–2 por video. `flash` (destello blanco) nunca hacia una escena oscura |
| `cap` | `top` (defecto) · `mid` · `bottom` | Dónde van los subtítulos: arriba y≈300, en medio y≈790, abajo y≈1190. Elige donde no está el sujeto |
| `fx` | `dust` (defecto) · `sparks` · `coins` · `rain` · `steam` · `none` | Partículas del motor encima de la escena. `none` si la escena ya tiene las suyas |
| `ease` | función 0→1 | Curva de la cámara (por defecto: arranque rápido, aterrizaje suave) |
| `long` | `true` | Permite pasar de 75 frames. Solo con una animación continua que sostenga la atención (un trazo largo) o en una prueba quieta. Escríbelo en el propio plano: la auditoría lee el código y no ve un `...PRUEBA` expandido |
| `limpio` | `true` | Quita la viñeta, los degradados y el grano del motor mientras dura el plano. Para pruebas visuales (ilusiones, pantalla blanca, colores exactos). Úsalo con `fx: "none"`, cámara quieta (`mv(C0, C0)`) y la escena sin `Look` |

**Ritmo:**
- Un cambio visual cada 1–2 s.
- Ningún plano pasa de 75 frames.
- Corta en palabras con peso, no en "y" o "de", salvo que haga falta para no pasar de 2,5 s.
- La misma escena con otro encuadre cuenta como cambio y ahorra trabajo: `scene: (p) => <Enlace {...p} sync />` con otra cámara.
- El primer plano empieza en `at: [1]` con `HOOK_A → HOOK_B` y lo raro ya visible. El último vuelve al gancho y termina en `HOOK_A`.

## Subtítulos
- `keys[i]`: palabras clave de la frase i+1. `"palabra"` → cian, `"palabra:gold"` → oro, `"palabra:red"` → rojo; cualquier otro color que la cuenta añada a `KEY` en brand.tsx (p. ej. `green: PAL.green` → `"verde:green"`). Usa el color del gráfico de esa palabra: si el pie es oro, "pie:gold". 1–3 por frase, y siempre la de la CTA ("Envíaselo").
- `merges`: varias palabras se ven como una: `["tres de cada diez", "3 de cada 10"]` (salen en oro).
- `display`: una palabra se escribe de otra forma: `{ seis: "6" }`. Por defecto ya convierte cuarenta, veinte, ocho, diez, cien y seis. Claves normalizadas: `{ oms: "OMS" }`.
- El primer bloque (3 palabras o hasta la primera coma) está fijo desde el frame 0: es la miniatura.

## Gráficos del motor (`overlays`)
Para cifras sobre una escena; `dur` en frames (`A(…) - A(…)` para que dure hasta un punto del guion).
| `kind` | Campos | Cuándo |
|---|---|---|
| `number` | `value, from?, prefix?, suffix?, label?, color?, y? (760), size? (180), decimals?` | Una cifra que cuenta |
| `bars` | `title?, bars: [{ label, value, text, color }], y?` | Comparar 2–3 cantidades |
| `race` | `title?, suffix?, cols: [{ label, value, color, delay, note? }], y?` | Columnas que crecen una tras otra |
| `dots` | `total, on, colorOn, colorOff, label?, y?` | "X de cada 100" |
| `lines` | `title?, xLabels: [ini, fin], series: [{ label, color, values[], delay? }], y?` | Evolución en el tiempo |
| `badges` | `items: [{ x, y, text, color, delay }]` | Etiquetas sobre puntos de la escena |
| `ring` · `flash` · `shade` | `x, y, r, color?` · `color, peak?, len?` · `side` | Señalar · golpe de color · oscurecer arriba o abajo |

**Un dato, un sitio:** si el subtítulo dice la cifra, no pongas un `number` con la misma cifra. Muchas veces es mejor dibujar el dato dentro de la escena (diez figuras, tres encendidas) que un gráfico encima.

## Sonido
- `sfx: [["impacto-grave", GIRO + 3, 0.8], ["pop-grave", [6, "mano"], 0.45]]`: el nombre, el momento (frame o corte) y el volumen.
- **Permitidos:** `impacto` y `impacto-grave` (0,7–0,85) para golpes y giros; `pop-grave` (0,45–0,7) para apariciones y etiquetas; `moneda-suave` y `monedas-suave` (0,3–0,35) para dinero. Unos 10–16 por video, siempre en una palabra o en un golpe visual.
- **Prohibidos:** el motor rechaza whoosh, whoosh-grave, whoosh-largo, riser, metro, arena, tictac, brillo y despertador. Las transiciones no llevan sonido.
- **Música** (opcional): `music: { src: "music/<pista>.mp3", high: 0.36, low: 0.15 }`. Baja sola bajo la voz y se apaga al final. Atribución en el caption. Cómo conseguirla: `audio.md`.
- **Archivos que faltan:** un efecto o una música que no está en `public/` se omite (aviso en la consola del navegador) en vez de romper el render.
- **Respiro antes de la revelación:** `respiros: [[[9, "trampa"], 18]]`. La música cae al 10 % durante 18 frames (15 por defecto) antes de esa palabra y vuelve en ella. Pon un impacto en la misma palabra y ningún efecto dentro del respiro. Uno o dos por video: si hay muchos, ya no sorprenden.
- `series: "DATO CURIOSO · #3"`: etiqueta del gancho (igual que en la portada).
- `firma: false`: sin el sello de logo + `HANDLE` en la última frase, para cuentas que no firman (p. ej. una cuenta personal). En la portada, `PortadaEscena firma={false}`.

## Auditoría
```bash
cd "<R>" && python3 scripts/auditar-escenas.py src/videos/<Componente>.tsx [--frames] [--simular vo-<carpeta>.txt]
```
- Simula el motor con los tiempos de la voz (real o simulada) y la pausa de `timeline(tiempos, N)`.
- Marca:
  - planos de más de 75 frames, de menos de 12 o que empiezan antes que el anterior;
  - palabras que no existen (en planos, efectos, gráficos y llamadas `A(…)`);
  - un primer plano que no empieza en 0;
  - títulos de portada de más de 18 caracteres por línea.
- Muestra las palabras con su frame en las frases afectadas, para elegir dónde cortar.
- `--frames` lista el inicio, la mitad y la duración de cada plano.
- Pásala hasta que salga limpia, y otra vez cada vez que cambie la voz.

## Registro y portada
`nuevo-video.py registrar <cuenta> <Componente> <Componente>-<tema>` añade a `Root.tsx` el import, la `<Composition>` y el `<Still id="Portada-<Componente>">`, y comprueba TypeScript. Para cambiar la portada, edita `Portada<Componente>` en el video: no hace falta registrar de nuevo.
