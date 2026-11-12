# Catálogo del kit (`src/kit/`)

Todo se importa de `"../kit"` en `src/videos/<Componente>.tsx`. Coordenadas en px de 1080×1920.

**Frames locales y absolutos.** Una escena empieza en su plano con frame local 0; su frame absoluto es `F = useF(t0)`.
- **Absolutos:** `prog(F, …)`, `spinAngle(F, …)`, `shake(F, …)`, `Pulses` y `Beacon` (con `t0`), `Polvo` (con `t0`), `Movil` (`tapAt`), y los momentos `A(frase, "palabra")`.
- **Locales:** `Burst`, `ImpactLines`, `Golpe`, `Pill` (`delay`/`out`), `Sparks` (`from`/`to`) y `usePop`. Pásales `rel(ABS, t0)`.

Para ver las piezas en uso, `src/videos/Demo01.tsx` de cualquier cuenta montada con el kit es la referencia (y "Piezas propias de un video", al final).

## escena.tsx: la base de cada escena
| Pieza | Firma | Para qué |
|---|---|---|
| `S` | `{ t0, dur }` | Props que el motor pasa a la escena |
| `useF(t0)` · `rel(abs, t0)` | → frame | Frame absoluto en la escena · absoluto → local |
| `cam(p, z = 1, ty = 960)` | → `CamKey` | Cámara que centra el punto `p` con zoom `z` sin bordes negros (z ≥ 1) |
| `mv(a, b)` · `C0` | → `[CamKey, CamKey]` | Movimiento de un plano (de `a` a `b`) · encuadre completo |
| `Look` | `{ shk?, vig = 0.5, grain = 0.11, bg? }` | Envuelve SIEMPRE la escena: temblor, viñeta y grano |
| `Svg` | `{ blur? }` | Lienzo SVG 1080×1920 (todo lo de abajo va dentro) |
| `Sombra` | `{ x, y, rx, ry?, opacity = 0.35, blur = 10 }` | Sombra de contacto |
| `Luz` | `{ x, y, r, color, opacity = 0.5, pulse = 0.08 }` | Charco de luz que respira |
| `Polvo` | `{ n = 30, color?, seed?, area?, t0? }` | Motas en el aire |
| `Capa` | `{ prof, dur, dx = -30, dy = 0, s = 0 }` | Parallax: prof 0,3 fondo · 1 medio · 1,5–2 primer plano |
| `Golpe` | `{ x, y, at, color, radius = 260 }` | Líneas de impacto + estallido (at local) |

```tsx
const Gancho: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  return (
    <Look shk={shake(F, GIRO, 12, 14)}>
      <Svg>
        <Capa prof={0.3} dur={dur}><Salon /></Capa>
        {/* … sujeto … */}
        <Golpe x={760} y={1150} at={rel(GIRO, t0)} color={PAL.red} />
      </Svg>
    </Look>
  );
};
```

## escenarios.tsx: sitios completos (dentro de `Svg`)
| Pieza | Props | Qué es |
|---|---|---|
| `Salon` | `blur?, warm = 1, dia?, pared = [arriba, abajo], cuadro?` | Interior de noche (luna, lámpara encendida) o de tarde con `dia` (sol y haz de luz por la ventana): estantería, cuadro, alfombra |
| `Ciudad` | `drift = 0, blur?` | Cielo con estrellas y tres filas de edificios (drift en px = parallax) |
| `Cielo` · `Edificios` | `top/mid/bottom, stars` · `seed, y, height, color, drift, ventanas, luz` | Piezas sueltas de la ciudad |
| `Foco` | `a, b, luz = true` | Plató: anillos concéntricos y haz cenital |
| `GlowBg` (fx) | `from, to, cx?, cy?, grid?, gridColor?` | Fondo de neón con rejilla y motas, para explicaciones |

## personaje.tsx: protagonista y mano
`Personaje` sale con los colores de `PROTA` (brand.tsx); cada prop los cambia para un secundario.
| Prop | Valores |
|---|---|
| `x, y, s` | Origen en el asiento (cadera). Mide ≈760 px a `s = 1`; la cabeza queda en y − 336·s |
| `face` | `look: [x, y]` (−1..1) · `blink` 0–1 · `brow` −1 enfadado … 1 asombrado · `mouth`: smile, grin, o, open, flat, tongue, wavy, frown · `eyes` (escala) · `blush` · `sweat` 0–1 (gota que cae) · `spin` (ojos en espiral) |
| `pose` | `handL`/`handR` (px locales; reposo [∓150, 30], arriba [∓170, −320]) · `pointL`/`pointR` · `squash` (<1 aplastado) · `tilt` (grados) · `headY` · `legs` (balanceo) · `feetUp` 0–1 |
| `stool` | Taburete (true por defecto) |
| `shoe` | `{ flyAt, side, dir }`: la zapatilla sale volando |
| `lift` · `footCircle` | El cuerpo flota (caída) · un pie hace círculos `{ side, a }` |
| `head, headShade, body, bodyShade, hair (curl/spiky/none), hairColor, skin` | Colores (#RRGGBB) para secundarios |

Cambia `face` y `pose` en las palabras clave (con `prog` o comparando `F` con un momento). Ya respira solo; para que parpadee, `face={{ blink: parpadeo(F), … }}`.
`Mano({ rot, skin, sleeve, cuff })`: mano que señala o pulsa, con la punta del dedo en (0, 0).

**Actuación** (ver escenas.md, "Actuación del personaje"):
| Pieza | Firma | Uso |
|---|---|---|
| `mezclaCara(f, at, de, a, dur = 6)` | → `Face` | Cambio de expresión sin salto |
| `reaccion(f, at, fuerza = 1)` | → `{ squash, eyes, headY }` | Anticipación (5 frames), golpe y asentado con rebote (≈0,8 s) |
| `desfase(seed)` | → radianes | Fase estable por pieza para que nada se mueva en sincronía |

## fx.tsx: trazos, efectos y tiempos
| Pieza | Firma | Uso |
|---|---|---|
| `prog(f, a, b, ease?)` | → 0..1 | Progreso entre dos frames (absolutos si `f = F`) |
| `easeOut` · `easeInOut` · `lerp` · `mix(c1, c2, t)` | | Curvas de tiempo e interpolación de colores #RRGGBB |
| `usePop(delay, damping = 11, stiffness = 190)` | → muelle 0→1 | Entradas con rebote (delay local) |
| `shake(f, at, dur = 12, amp = 16)` | → `[dx, dy]` | Temblor que decae (para `Look shk`) |
| `spinAngle(f, { speed, dir, switches, ramp, startAt, phase })` | → `{ a, v }` | Giro continuo con cambios de sentido suaves |
| `catmull(puntos, seg)` · `cumLen` · `along` · `partial` · `toD` | | Curvas suaves, punto a una fracción, tramo, `d` de un path |
| `Comet` | `{ pts (viejo→nuevo), color, width, core?, colors?, head? }` | Estela con brillo |
| `LightInk` | `{ pts, color, core?, width, opacity? }` | Trazo de luz que se queda |
| `ArcArrow` | `{ x, y, r, dir (1 horario, −1), color, width?, sweep?, rot?, ry?, outline? }` | Flecha de giro |
| `Sparks` | `{ pos: (f) => Pt, color, from?, to?, rate?, seed?, size? }` | Chispas que salen de un punto que se mueve |
| `Burst` · `ImpactLines` · `Star4` | `{ x, y, at, color, … }` | Estallido · líneas de impacto · estrella |
| `Pill` | `{ x, y, text, color, textColor?, size = 54, delay = 0, rot = −4, out?, icon? }` | Etiqueta con rebote (veredictos: "¡AL REVÉS!") |
| `PAL` · `INK` | | Colores con significado y contorno (de brand.tsx) |

## signal.tsx: caminos de luz y etiquetas
| Pieza | Firma | Uso |
|---|---|---|
| `via(puntosClave, seg?)` | → `Via` | Camino suave (nervio, cable, ruta, conexión) |
| `ViaGlow` | `{ v, p (0..1), color, width = 10 }` | El camino se enciende hasta `p` |
| `Pulses` | `{ v, from, to?, every = 14, travel = 24, color, size = 16, t0 }` | Impulsos que viajan por el camino |
| `Beacon` | `{ x, y, r, ry?, color, on, t0 }` | Anillos que laten sobre un punto |
| `NeonLabel` | `{ x, y, text, color, size = 40 }` | Texto de neón (1–2 palabras) |

## shaders.tsx: fondos y luz animados (Paper Shaders, capas HTML fuera de `Svg`)
Se importa aparte: `import { FondoGrano, Rayos } from "../kit/shaders";` desde `src/videos/<Componente>.tsx` (`"../../kit/shaders"` desde una subcarpeta de `src/videos/`).
- **Dependencia:** `@paper-design/shaders-react` 0.0.82, Apache 2.0, sin crédito obligatorio. La versión va fijada y `montar-cuenta.py` la instala.
- **Deterministas:** el tiempo sale del frame y cada fotograma espera a que el shader pinte: el mismo frame sale idéntico (≈0,3 s por fotograma a media escala en un Mac con Apple Silicon).

| Pieza | Para qué | Por defecto |
|---|---|---|
| `FondoGrano` | Fondo con grano de película; `shape`: blob, wave, corners, ripple, sphere, dots, truchet | `vel` 0,35; azul noche, cian y oro |
| `FondoMalla` | Degradado de malla lento: ganchos, títulos, portadas | `vel` 0,3 |
| `Rayos` | Rayos de luz en la revelación (`offsetY` sube o baja el foco) | blend "screen", opacidad 0,7 |
| `Humo` | Anillo de humo detrás del sujeto raro | `box` con el área |
| `BordeLatido` | Brillo que recorre el borde de un móvil o una tarjeta (CTA) | `box` = rectángulo del objeto |
| `Ondas` · `Remolino` | Señal, sonido o agua · hipnosis o plano subjetivo | opacidad baja |
| `ShaderLibre` | Cualquier otro de Paper (`Voronoi`, `NeuroNoise`, `Metaballs`, `DotGrid`…) con el mismo tiempo | `de={Voronoi} props={{…}}` |

Props comunes: `t0` (frame absoluto del inicio de la escena: el fondo no salta al cortar), `vel`, `opacity`, `blend`, `box: { x, y, w, h }` y los colores del shader (de `PAL`). Como mucho 2 a la vez; nunca encima del sujeto.

## look.tsx: acabado (capas HTML, fuera de `Svg`)
`Grain({ opacity })` · `Vignette({ strength, cx, cy })` · `Tint({ top, bottom, opacity, mode })`. `Look` ya pone grano y viñeta.

## objetos.tsx: gestos que se repiten (frames `at` locales)
| Pieza | Firma | Para qué |
|---|---|---|
| `SelloTachado` | `{ x, y, texto, at, tachaAt, color?, size = 104, rot = −8 }` | El "No es que…": el sello cae con rebote y se tacha con una raya blanca. Sin tachar ("MITO", "TRAMPA"): `tachaAt={100000}`. Más de 10 letras: baja `size` (≈ 74 para 12) para que no se salga |
| `Pregunta` | `{ x, y, at, size = 220, color? }` | Interrogación de neón que salta y flota (ganchos y "¿por qué?") |
| `Visto` | `{ x, y, at, ok = true, s? }` | Visto bueno verde o X roja en un círculo |
| `Bocadillo` | `{ x, y, w, h, cola?: [x, y], s?, opacity? }` + children | Nube de pensamiento con burbujas hacia la cabeza; lo de dentro, centrado |
| `Temporizador` | `{ x, y, r, p (0..1), color, seg = 1200, tope? }` | Aro de neón que se llena con reloj mm:ss (seg = segundos al llegar a 1); `tope` = raya roja |
| `FichaAntigua` | `{ x, y, anio, texto, at, rot?, s? }` | Ficha de papel envejecido con un año grande ("1915") para el dato histórico |

## telefono.tsx: la CTA
`Movil({ t0, tapAt, inner, x = 540, y = 990, w = 480, rot = −4, dedo = true, enviar, enviado, contactos })`. Móvil en HTML/CSS: en la pantalla se ve `inner` (pásale la escena del gancho), sube la hoja de compartir, el dedo pulsa en `tapAt` (frame absoluto), el botón pasa a "✓ Enviado" y sale un avión de papel. Con los valores por defecto queda entre los subtítulos de arriba y el sello de la firma (y≈1500); usa `cap: "top"` en ese plano.
```tsx
const Envia: React.FC<S> = ({ t0 }) => (
  <Look>
    <Svg><Salon blur={8} warm={0.8} /></Svg>
    <Movil t0={t0} tapAt={A(11, "alguien") + 2} inner={<Gancho t0={0} dur={60} />} />
  </Look>
);
```

## portada.tsx
`PortadaEscena({ children, serie, titulo, align = "top", zoom = 1.06, dy = 40, pill? })`: escena congelada + etiqueta de serie + título (`*palabra*` en píldora) + logo y firma, todo dentro del recorte 4:5. La plantilla ya exporta `Portada<Componente>`; cambia el `t0` de la escena al momento más raro y el título.
- `firma={false}` quita el logo y el handle de abajo (cuentas sin firma).
- `dy` baja la escena para que el título no tape al sujeto; `pill` cambia el color de la píldora (p. ej. el rojo o el verde de esa palabra en el video).
- `zoom` < 1 deja franjas negras a los lados. Si la escena no cabe bajo el título y sobre la firma (y≈1540–1600), haz una escena propia solo para la portada (un componente `PortadaFondo` en el mismo video, con el sujeto recolocado).

## Piezas propias de un video
Lo que solo necesita un video se dibuja en su `.tsx` (o en `src/videos/<carpeta>/` si son muchas). `Demo01` trae ejemplos que puedes copiar y adaptar:
- `Tostada`: un objeto de canto con capas (miga, corteza, mantequilla con brillo del color con significado) que se gira con `rotate`.
- `Mesa` y `Fondo`: un mueble con patas, sombra de contacto y una taza, y el `Salon` del kit desplazado para que el suelo quede donde hace falta.
- `Caida` + `enTiro`: una trayectoria con gravedad (y ∝ p²) y giro constante calculada con el frame absoluto, reutilizada en varios planos (gancho, cámara lenta con estela y flecha, aterrizaje con veredicto, bucle).
- `Diagrama`: un esquema de neón que cambia de escala en una palabra (la mesa que crece) con fantasmas que se encienden en orden.

Ideas que suelen hacer falta y se dibujan igual: el plano subjetivo de una pierna o una mano vistas desde arriba, un holograma del cuerpo o del cerebro, un dial, una cifra o letra trazada a mano (`catmull` + `partial` + `LightInk`), una taza con vapor, un antifaz como `extraHead` del `Personaje`, una carretera y un volante, una llave y una cerradura, moléculas de fondo, un mapa de neón o una casa en corte lateral. Si una pieza se repite en otro video, pásala al kit de la skill (`assets/plantilla-proyecto/src/kit/`) y sincroniza las cuentas con `montar-cuenta.py --actualizar`.

Para ver piezas así en reels terminados, mira [@datorarito](https://www.instagram.com/datorarito/), donde nació el kit.
