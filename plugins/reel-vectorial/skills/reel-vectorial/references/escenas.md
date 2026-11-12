# Escenas que no parecen una plantilla

El riesgo de este formato es que parezca hecho con plantillas: iconos sueltos, fondos planos y cosas quietas. Los primeros intentos del formato se rechazaron justo por eso:
- **Primera versión:** iconos pequeños sobre el mismo fondo de anillos. Se leía como "cosas feas estáticas".
- **Segunda versión:** escenas correctas pero planas, al lado de reels de referencia con mucho más acabado (voz, luz, movimiento). "Correcto" no basta: la referencia es el mejor reel del nicho, no una plantilla.

El estándar: **cada fotograma aguanta una captura de pantalla**, y en cada plano pasa algo en la palabra que se oye.

## 1. El mundo del video (decídelo antes de dibujar)
- **Un solo sitio coherente** para todo el video: el salón de noche, una ciudad, un plató, el interior del cuerpo en neón. Cambiar de mundo a cada frase marea y se ve barato.
- **Una luz que no cambia:** por ejemplo, lámpara cálida a la izquierda y ventana fría a la derecha. La luz cálida cae sobre aquello de lo que habla la voz.
- **Colores con significado** (de `PAL`, iguales a las píldoras de los subtítulos `KEY`). En `Demo01`: mesa y altura = cian, tostada = oro, boca abajo = rojo, vuelta entera = verde. Apúntalos en el guion y en la cabecera del `.tsx` y no los cambies a mitad.
- **Protagonista:** el de la cuenta (`PROTA` en `brand.tsx`). Si el espectador es quien actúa, plano subjetivo.

## 2. Tipos de plano y con qué se hacen
| Plano | Cuándo | Piezas del kit (`references/kit.md`) | Ejemplo en `Demo01` |
|---|---|---|---|
| **Gancho** | Frase 1, frame 0 | Lo raro ya en marcha + `Golpe` + temblor en la palabra clave | `Gancho` (la tostada ya en el aire) |
| **Subjetivo ("tú")** | El espectador hace algo | Su mano o su pie vistos desde sus ojos, con `Mano`, `LightInk`, `Comet` y `ArcArrow` | `Empuja` (tu mano empuja la tostada) |
| **Reacción** | Emoción, sorpresa, "esto te pasa" | `Personaje` (cara y pose que cambian en la palabra) sobre `Salon` | `Fisico`, `Gigante` |
| **Explicación** | El porqué | `GlowBg` + `via`/`ViaGlow`/`Pulses`/`Beacon` + `NeonLabel` | `Altura`, `Diagrama` |
| **Dato** | Una cifra o una proporción | Gráficos del motor (`number`, `bars`, `dots`, `race`, `lines`) sobre una escena, o `FichaAntigua` para un año | `Ficha` (1995) |
| **Veredicto** | Sí/no, mito, sello | `Pill`, `SelloTachado`, `Visto`, `Burst` | `Sello` ("MALA SUERTE" tachado), `Aterriza` |
| **CTA** | "Envíaselo a…" | `Movil` con el gancho dentro de la pantalla | `Envia` |
| **Bucle** | Último plano | La escena del gancho con el mismo estado y la misma cámara (`HOOK_A`) | `Bucle` |

## 3. Composición
- **El sujeto ocupa ≥ 40 % del encuadre.** En el móvil, el reel se ve a 6 cm: un objeto de 150 px no existe.
- **Zonas de subtítulos:** arriba y≈300–520, en medio y≈790–1010, abajo y≈1190–1400. Elige `cap` en cada plano para no tapar al sujeto (`motor.md`).
- **Zonas de Instagram:** a la derecha (x > 960) están los botones y abajo (y > 1550) el texto del post. Nada importante ahí.
- **Profundidad en tres capas:** fondo (escenario, desenfocado en los primeros planos), sujeto y primer plano (algo que pasa por delante, polvo, chispas).
- **Sombra de contacto** (`Sombra`) bajo todo lo que toca el suelo. Sin ella, flota.

## 4. Luz y acabado
- Envuelve cada escena en `Look`: viñeta y grano. Sin ellos, el vector plano parece una plantilla.
- `Luz` en la fuente (lámpara, pantalla, ventana) y sobre el sujeto. Los brillos de lo importante, con `drop-shadow` del color con significado.
- Degradados en fondos y volúmenes (la cabeza del personaje ya tiene luz). Nada de rellenos planos grandes.
- **Primeros planos:** fondo desenfocado (`<Svg blur={6}>` o `Salon blur`) y el sujeto nítido.
- **Fondos vivos con shaders** (`src/kit/shaders.tsx`, ver kit.md): `FondoGrano` o `FondoMalla` detrás de un plano sin escenario (diagramas, cifras, título); `Rayos` con blend "screen" en la revelación; `Humo` detrás del sujeto raro del gancho; `BordeLatido` alrededor del móvil de la CTA. Como mucho 2 a la vez, con los colores de PAL y siempre por debajo del sujeto.

## 5. Movimiento: nada quieto
- **Algo cambia en cada palabra clave:** aparece, gira, se ilumina, golpea o cambia de cara. Engánchalo con `A(frase, "palabra")`.
- **Vida de fondo:** respiración y parpadeo en el personaje, `Polvo`, la luz que respira, `GlowBg` con motas y rejilla en marcha.
- **Movimiento secundario:** las entradas rebotan (`usePop`) y los golpes tiemblan (`shake` en `Look shk`) y sueltan chispas (`Golpe`, `Burst`, `ImpactLines`).
- **Estelas:** lo que se mueve deja rastro (`Comet`); lo que se dibuja deja tinta de luz (`LightInk`).
- **Cámara siempre en marcha:** cada plano tiene un movimiento (`move: mv(cam(a), cam(b))`). Alterna acercar y alejar y nunca repitas el mismo dos veces seguidas. Golpe de zoom en las revelaciones.
- **Parallax dentro del plano:** `Capa prof={0.3}` para el fondo y `prof={1.5}` para el primer plano.
- **Un cambio visual cada 1–2 s.** La misma escena con otro encuadre cuenta como cambio.
- **Al menos 4 movimientos de cámara distintos por video** (acercar, alejar, barrido lateral, subir, golpe de zoom, paralaje), y un **plano firma** que se recuerde.

**Actuación del personaje** (los principios clásicos de animación):
- **La cara nunca salta:** `mezclaCara(F, at, antes, después)` mezcla mirada, cejas y ojos en 6 frames; la boca cambia a mitad.
- **Anticipación, golpe y asentado:** en la revelación o en un golpe, `reaccion(F, at)` encoge al personaje 5 frames antes, lo estira con los ojos muy abiertos y lo asienta con un rebote. Aplícalo a `pose.squash`, `pose.headY` y `face.eyes`.
- **Arcos:** saltos, lanzamientos y giros de cabeza siguen una curva (`catmull` / `along`), nunca una recta.
- **Sin gemelos:** brazos, ojos y personajes no se mueven en fase (`desfase(seed)` para la fase de cada uno).
- **Volumen:** al aplastar, ensancha; al estirar, estrecha. Lo pesado arranca y para despacio; lo ligero rebota.
- **Poses que se leen como silueta:** si la pose no se entiende en negro, exagérala.

## 6. Continuidad y bucle
- Todo lo continuo (un giro, un trazo, una luz, un contador) se calcula con el **frame absoluto** `F = useF(t0)`. Así no salta al cortar: el pie que gira en un plano sigue en la misma fase en el siguiente.
- Para giros, `spinAngle(F, { speed, switches, phase })` (cambios de sentido suaves en los frames de `switches`).
- **Bucle sin salto:** el último plano reproduce el estado del frame 0. Lo más simple: la misma escena del gancho con el tiempo desplazado para que su último fotograma sea el frame 0 (`Bucle` en `Demo01`: `t0={p.t0 - (TOTAL - 1)}`) y sin paralaje en esos dos planos. Si algo gira sin parar, ajusta su fase (`phase: PH0 − SPEED · TOTAL`). La cámara del último plano termina en la del primero (`HOOK_A`). Compara el frame 0 con el último en la revisión.

## 7. Transiciones
- `whip` (barrido) al cambiar de idea, `zoom` en revelaciones y en entrar a un detalle, `cut` dentro de la misma idea.
- **Nada de destello blanco hacia una escena oscura:** se ve como un fotograma vacío.
- `fade` solo para respirar, 1–2 veces por video como mucho.
- Las transiciones no llevan sonido.

## 8. Texto dentro de las escenas
- El subtítulo ya cuenta la frase. En la escena, como mucho 1–2 palabras de etiqueta (`NeonLabel`, `Pill`) que nombran lo que se ve: "MANO", "PIE", "IZQUIERDO".
- **Un dato, un sitio:** si el subtítulo dice la cifra, la escena no la repite.
- **Nada de emoji en SVG:** se renderizan mal. Usa formas o texto.
- Texto de escena ≥ 40 px y con contorno o brillo.

## 9. Cómo se escribe una escena
```tsx
// 3 · "dibuja un seis en el aire": tu mano entra y traza el 6 de luz; en "seis", golpe dorado
const Dibuja: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  const p = prog(F, A(3, "dibuja"), A(3, "dibuja") + 40, easeOut); // 0→1 mientras se dibuja
  const ink = partial(SEIS.pts, SEIS.cum, 0, p);
  const punta = along(SEIS.pts, SEIS.cum, p).p;
  return (
    <Look shk={shake(F, A(3, "seis"), 12, 12)}>
      <Svg>
        <Capa prof={0.3} dur={dur}>
          <Salon blur={6} />
        </Capa>
        <Luz x={260} y={420} r={700} color="#FFC27A" opacity={0.35} />
        <Capa prof={1.2} dur={dur}>
          <g style={{ filter: `drop-shadow(0 0 22px ${PAL.cyan})` }}>
            <LightInk pts={ink} color={PAL.cyan} core={PAL.cyanCore} width={34} />
          </g>
          <g transform={`translate(${punta[0]},${punta[1]}) scale(0.9)`}>
            <Mano rot={-20} />
          </g>
        </Capa>
        <Golpe x={540} y={900} at={rel(A(3, "seis"), t0)} color={PAL.gold} />
        <Polvo t0={t0} />
      </Svg>
    </Look>
  );
};
```
- `SEIS` sale de una curva propia: `const SEIS = (() => { const pts = catmull(PUNTOS); return { pts, cum: cumLen(pts) }; })();`.
- Las piezas propias de un video (un cerebro, un pie desde arriba, una tostada) se dibujan en el `.tsx` del video o en `src/videos/<carpeta>/`. Si sirven para más videos, pásalas a la skill (`assets/plantilla-proyecto/src/kit/`) y sincroniza las cuentas con `montar-cuenta.py --actualizar`.

## 10. Revisión (antes de enseñar nada)
Saca los fotogramas con `nuevo-video.py stills` y míralos con Read. Primero la hoja de contacto y luego a tamaño completo el frame 0, el giro, un gráfico y el último:
- [ ] **Frame 0:** se entiende lo raro sin sonido; el primer bloque de subtítulos y la etiqueta de serie se leen; nada tapado.
- [ ] **Cada plano:** sujeto grande, escenario lleno, luz y sombra; nada de fondo vacío ni de icono suelto.
- [ ] **Movimiento:** en la hoja, planos seguidos se ven distintos (encuadre, acción o escena). Si dos se parecen demasiado, cambia uno.
- [ ] **Bordes:** sin franjas negras (cámara con zoom < 1 o escena que no cubre 1080×1920).
- [ ] **Subtítulos:** no tapan al sujeto (cambia `cap`); las píldoras usan el color del gráfico de esa palabra.
- [ ] **Colores:** cada color significa lo mismo en todo el video.
- [ ] **Contraste:** un trazo del mismo tono que su fondo desaparece (oro sobre un personaje amarillo, verde sobre verde). Dale contorno oscuro (`INK`) o pásalo a rayos X (fondo oscuro y contorno de neón).
- [ ] **Texto contra texto:** palabras dentro de la escena que se pisan entre ellas, o que quedan bajo los subtítulos (y≈300–520 con `cap: "top"`).
- [ ] **Último frame:** igual que el frame 0 (bucle). Lo que aparece en una palabra del gancho (una interrogación, una X, un bocadillo que estalla) tiene que desaparecer al volver: condiciónalo a `F < BUCLE`.
- [ ] **Portada:** el momento más raro, título dentro del recorte 4:5 (y = 285–1635) y legible en pequeño.

- [ ] **Tiras** (`stills … --tira <frame>:10`), fotograma a fotograma, en cada `whip`/`zoom`, en la revelación y en los cambios de cara: ni fotogramas vacíos, ni saltos, ni algo que aparece de golpe sin entrada.
- [ ] **Primeros y últimos 0,5 s de cada plano:** el corte cae en un movimiento, no en un plano muerto.

Si un plano no pasa, arréglalo antes de renderizar: es mucho más barato que otra versión.
