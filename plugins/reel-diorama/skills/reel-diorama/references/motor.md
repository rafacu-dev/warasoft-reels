# Motor de reels (`src/engine/Reel.tsx`)

Cada video es una configuración (`ReelConfig`) en `src/videos/<Componente>.tsx`. El motor pone:
- cámara 2.5D sobre cada plano, con partículas;
- subtítulos palabra a palabra, con la palabra clave en píldora de color;
- gráficos, efectos y música que baja bajo la voz;
- etiqueta de serie en el gancho y sello con logo y `HANDLE` en la última frase.

Lo que aún no está en `public/` no rompe el video: un plano sin exportar se ve como provisional, y sin voz, música o efectos simplemente no suena. Así se monta y se revisa desde el primer minuto; la cola no renderiza una entrega así.

La demo de la cuenta (`src/videos/Demo.tsx`) es un ejemplo corto y completo: gancho, revelación con `pull`, respiro, barras y bucle.

**Nombres:**
- Componente `Quien04`, con la serie abreviada y el número.
- Composición `Quien04-<tema>`.
- Portada `Portada-Quien04`.
- Carpeta `quien04`, igual en `assets/imagenes/`, `public/` y `public/vo/`.

## Esqueleto (copiar y rellenar)
```tsx
// <Serie> #N: <título>
// Guion: cuentas/<cuenta>/guiones/<AAAA-MM-DD_serie_tema>.md
// (nuevo-video.py crear escribe este esqueleto con los cortes ya puestos a partir de la voz, real o simulada)
// Cifras: <cálculos exactos y fuentes>
import React from "react";
import { C } from "../brand";
import { MOVE, Reel, ReelConfig, timeline } from "../engine/Reel";
import { CamKey } from "../Parallax";
import tiempos from "../../public/vo/<carpeta>/tiempos.json";

const tl = timeline(tiempos);
export const TOTAL_<CARPETA> = tl.total;
const d = (a: Parameters<typeof tl.at>[0], b: Parameters<typeof tl.at>[0]) => tl.at(b) - tl.at(a);
const HOOK: [CamKey, CamKey] = [{ zoom: 1.16, x: 0, y: 0.01, dolly: 0.12 }, { zoom: 1.04, x: 0, y: -0.01, dolly: 0 }];

const cfg: ReelConfig = {
  imgDir: "<carpeta>",
  voDir: "vo/<carpeta>",
  series: "<SERIE> · #N",
  music: { src: "music/<pista>.mp3", high: 0.4, low: 0.18 },
  merges: [["diez por ciento", "10 %"], ["mil euros", "1.000 €"]], // con la moneda de la audiencia
  display: { cinco: "5" },
  keys: [["promete", "dinero:gold"], [], /* … una lista por frase */ ["envíaselo"]],
  shots: [
    { img: "00", at: 0, move: HOOK, center: [0.5, 0.45], fx: "coins", cap: "top" },
    // …
    { img: "00", at: [11, "<palabra>"], move: HOOK, center: [0.5, 0.45], fx: "coins", cap: "top" }, // bucle
  ],
  overlays: [],
  sfx: [["impacto", [1, "<palabra>"], 0.45]],
};

export const <Componente>: React.FC = () => <Reel cfg={cfg} tl={tl} />;
```

## Puntos de corte (`Cut`)
`at` acepta un frame absoluto o `[frase, palabra?, aparición?, desfase?]`:
- `[3]`: inicio de la frase 3 (las frases cuentan desde 1).
- `[3, "trescientos"]`: cuando empieza esa palabra en la frase 3.
  - Se comparan sin tildes, mayúsculas ni puntuación: "envíaselo" = "Envíaselo,".
  - Usa la palabra tal como la escribió la voz en `tiempos.json`, no la de `merges`.
- `[1, "por", 2]`: la segunda vez que sale "por" en la frase 1.
- `[3, "noventa", 1, 4]`: 4 frames después.

Si la palabra no existe, el render falla con el texto de la frase. Corta en **palabras con peso** (el sustantivo, la cifra, el verbo del giro), no en "y" o "de", salvo que haga falta para no pasar de 2,5 s.

## Planos (`shots`)
| Campo | Valores | Uso |
|---|---|---|
| `img` | `"00"`, `"05a"` | plano en `public/<carpeta>/` |
| `move` | `MOVE.push(±1)` acercarse con deriva · `MOVE.pull(1.3–1.8)` abrir desde cerca (revelación) · `MOVE.punch(1.2–1.3)` golpe de zoom en un detalle · `MOVE.drift(±1)` paneo lateral · `MOVE.rise(±1)` subir o bajar · `HOOK` | alterna: no repitas el mismo movimiento dos planos seguidos |
| `trans` | `cut` (por defecto) · `whip` barrido vertical · `zoom` golpe de zoom · `flash` destello blanco · `fade` | `whip` al cambiar de idea, `zoom`/`flash` en revelaciones, `fade` solo para respirar (1–2 por video) |
| `fx` | `dust` (por defecto) · `sparks` · `coins` · `rain` · `steam` · `none` | partículas que acompañan el tema |
| `cap` | `top` (por defecto) · `bottom` | dónde van los subtítulos mientras se ve el plano; `bottom` si el sujeto ocupa el tercio superior |
| `center` | `[x, y]` 0–1 | punto hacia el que empuja la cámara (el sujeto) |
| `long` | `true` | permite pasar de 75 frames; solo si hay un gráfico encima que sostiene la atención |

**Ritmo:**
- Cambio visual cada 1,5–2,5 s.
- Ningún plano pasa de 75 frames: el render falla si alguno se pasa.
- La misma imagen puede seguir con otro movimiento (`push` → `punch` sobre el mismo `img`): cuenta como cambio y ahorra planos.
- El primer plano arranca en `at: 0` con `HOOK` y el texto del gancho ya está visible en el frame 0: sin fundido desde negro.
- El último plano es el `00` con `HOOK` (bucle).
- **Al menos 4 movimientos distintos** en el video (push, pull, punch, drift, rise) y un **plano firma** con el movimiento más marcado, normalmente un `pull` de revelación.

## Subtítulos
- `keys[i]` es la lista de palabras clave de la frase i+1:
  - `"palabra"` → cian (salida, concepto);
  - `"palabra:gold"` → dorado (dato estrella, tiempo, riqueza);
  - `"palabra:red"` → rojo (pérdida, alerta).
  - Una o dos por frase como máximo, y siempre la palabra de la CTA (`"envíaselo"`).
- `merges`: varias palabras de la voz se muestran como una sola. Por ejemplo, `["noventa millones", "90 millones"]`. Las palabras fusionadas salen en dorado.
- `display`: una palabra suelta se escribe de otra forma (`{ cinco: "5" }`). Por defecto ya convierte cuarenta, veinte, ocho, diez, cien y seis.
- Las cifras de los gráficos usan `LOCALE` de `brand.tsx` (`es-ES` no separa los miles de 4 cifras; `es-MX` sí).
- Las claves de `keys` y `display` se comparan normalizadas (minúsculas, sin tildes ni signos): escribe `{ ikea: "IKEA" }`, no `{ IKEA: … }`.
- **Un dato, un sitio:** si el subtítulo ya dice la cifra, no pongas un contador `number` con la misma cifra. Sí se permite ver a la vez:
  - una proporción (rejilla `dots` o barras) con la cifra en el subtítulo;
  - un contador del valor exacto (3.138 €) bajo un subtítulo redondeado ("más de tres mil").

## Gráficos (`overlays`)
`dur` en frames; usa `d(desde, hasta)` para que dure hasta un punto del guion.

| `kind` | Campos | Cuándo |
|---|---|---|
| `number` | `value`, `from?`, `prefix?`, `suffix?`, `label?`, `color?`, `y?` (760), `size?` (180), `decimals?` | una cifra que cuenta desde `from` en 20 frames |
| `bars` | `title?`, `bars: [{label, value, text, color}]`, `y?` (700) | comparar 2–3 cantidades |
| `race` | `title?`, `suffix?`, `cols: [{label, value, color, delay, note?}]`, `y?` (1060) | columnas que crecen una tras otra (`delay` en frames) |
| `dots` | `total`, `on`, `colorOn`, `colorOff`, `label?`, `y?` (640) | "X de cada 100" |
| `lines` | `title?`, `xLabels: [ini, fin]`, `series: [{label, color, values[], delay?}]`, `y?` | evolución en el tiempo |
| `badges` | `items: [{x, y, text, color, delay}]` | etiquetas sobre puntos de la imagen (px de 1080×1920) |
| `ring` | `x`, `y`, `r`, `color?` | señalar algo de la imagen |
| `flash` | `color`, `peak?` (0.3), `len?` (14) | golpe de color en el giro: rojo en la caída, cian en la salida |
| `shade` | `side` | oscurecer arriba o abajo para leer mejor |

**Colocación:** los subtítulos ocupan y≈300–520 (arriba) o y≈1190–1400 (abajo). Pon los gráficos en y≈700–1100 si los subtítulos van arriba.

**`badges` y `ring`:** se colocan sobre puntos de la imagen, así que solo se añaden después de ver el plano exportado (coordenadas en px de 1080×1920).

**Destellos:** no combines `trans: "flash"` (destello blanco del corte) con un gráfico `flash` en la misma palabra. Elige uno: blanco para el corte, de color para la emoción.

## Sonido
- **Efectos permitidos:** solo `impacto`, `moneda-suave` y `monedas-suave` (en `public/sfx-pro/`, ver su `LEEME.md`), ligados a una palabra: `["impacto", [4, "millones"], 0.55]`. Si falta el archivo, ese efecto no suena.
  - Volúmenes: impacto 0,4–0,55; monedas 0,3–0,35.
  - 6–9 efectos por video, en las cifras y en el giro.
- **Prohibidos:** el motor rechaza whoosh, swoosh, riser, viento, metro, arena, tictac, brillo y despertador. Las transiciones visuales no llevan sonido: en el móvil los barridos se oyen como viento pegado al micrófono y los brillos como agudos metálicos debajo de la voz.
- **Música:** `high` 0,4–0,42 y `low` 0,18–0,2. El motor la baja sola mientras hay voz y la apaga al final. Elige la pista según la serie (ver `ficha-reel.md`); si el archivo no está en `public/music/`, el video sale sin música. `music` es opcional.
- **Respiro antes de la revelación:** `respiros: [[[9, "trampa"], 18]]`. La música cae al 10 % durante 18 frames (15 por defecto) antes de esa palabra y vuelve en ella; pon el `impacto` en la misma palabra y ningún efecto dentro. Uno o dos por video.

## Comprobar sin abrir Remotion
```bash
cd "<P>/cuentas/<cuenta>/produccion/remotion" && python3 scripts/auditar-planos.py src/videos/<Componente>.tsx [--frames] [--simular vo-<carpeta>.txt]
```
- `--frames` lista el frame de cada plano (para los stills).
- `--simular` estima los tiempos desde el texto cuando aún no hay voz (la voz simulada de `crear` usa el mismo cálculo). Usa el ritmo medido de una voz documental a velocidad 1,15 y se equivoca ≈0,3 s por frase, así que deja margen: planos de ≤65 frames simulados.
- Además de los planos, valida todas las palabras de efectos y gráficos.
- Simula el motor con los tiempos reales (o simulados).
- Marca los planos que pasan de 75 frames, las palabras que no existen y los planos de menos de 12 frames, y lista los planos que aún no están en `public/`.
- Muestra las palabras de las frases afectadas para elegir dónde cortar.
- Repítelo hasta que salga limpio, y vuelve a pasarlo siempre que cambie la voz.

## Registrar en `Root.tsx` y portada
Solo cuando exista `public/vo/<carpeta>/tiempos.json` (real o simulado): si Root importa un video sin voz, fallan todos los renders de la cola.
```bash
python3 "<S>/scripts/nuevo-video.py" registrar <cuenta> <Componente> <Componente>-<tema> \
  --img <carpeta>/00 --serie "<SERIE> · #N" --titulo "¿Un 10 % al mes?|Entonces, ¿por qué|no lo hace *él*?" [--align top]
```
**Portada (`Portada.tsx`):**
- Usa la imagen del plano indicado, con la etiqueta de serie, el título y el sello.
- El título va en 3–4 líneas de **18 caracteres como máximo** (a 100 px una línea más larga se parte mal).
- `*palabra*` sale en píldora dorada: una por portada.
- Todo queda dentro de la franja 4:5 que muestra la cuadrícula del perfil.
- El título es la pregunta del gancho, no un resumen.
- Si el sujeto del plano está abajo y el título lo taparía, usa `--align top`. Edita la portada siempre con `registrar`: si la cambias a mano en Root.tsx, el siguiente `registrar` lo pisa.
