# Guion y voz

Antes de escribir, revisa `guiones/`, `videos/finales/` y `ideas.md` de la cuenta para no repetir tema, gancho ni giro.

## Dirección antes de escribir
1. **Tres caminos, uno elegido.** Escribe 3 ganchos con su estructura (en una línea cada uno) y elige uno con un motivo. Apúntalos en el guion, en "Caminos descartados", para que el usuario vea que se pensó.
2. **Contra la repetición:** compáralo con el último video de la serie. Al menos 4 de estas 6 cosas tienen que cambiar: estructura, arranque, plano firma, recorrido de cámara, forma de la música y final. Si no, cambia el camino.
3. **Un plano firma:** el plano que se recuerda y que se comparte en captura. Descríbelo en el guion, normalmente en la revelación, con su escena, su luz y su golpe.
4. **Un respiro antes de la revelación:** la música cae casi a cero en los 0,5 s previos (`respiros` en `motor.md`) y el primer sonido después es el impacto de la revelación.
5. **Cifras, no adjetivos:** "el cerebro grande" no es una indicación; "el cerebro ocupa el 60 % del alto, con luz dorada desde arriba" sí.

## La fórmula (la de @datorarito)
1. **Frase 1 = pregunta + lo raro ya en pantalla en el frame 0.** La escena del gancho muestra la anomalía sin necesidad de sonido: tu pie girando al revés mientras tu mano dibuja un 6, o la tostada ya en el aire boca abajo (`Demo01`).
2. **Cada frase se ilustra justo cuando se oye.** Si la voz dice "tu cerebro", se ve el cerebro en esa palabra, no un segundo después.
3. **La historia va en segunda persona cuando el espectador puede hacerlo** ("Siéntate y gira el pie…"). El reto se hace mientras se mira, y eso retiene.
4. **"No es que… Es que…":** el giro desmonta la explicación fácil ("No es que seas torpe. Es que tu cerebro…").
5. **Salida concreta:** un truco, qué hacer o cómo comprobarlo. Nada de promesas.
6. **La respuesta llega al ≈65–80 %** del video, justo antes de la salida y la CTA.
7. **CTA = "Envíaselo a <persona concreta>…"**, ilustrada con el móvil del kit (`Movil`).
8. **El último plano vuelve al primero** (bucle): mismo estado y misma cámara.
9. **Las 3 primeras palabras son la miniatura.** El motor parte los subtítulos en bloques de 3 palabras (o hasta la primera coma) y solo el primero se ve en el frame 0. "¿Por qué tu pie…" engancha; "¿Sabías que…" no dice nada. `revisar-voz.py` te enseña ese bloque.
10. **Una idea, un mundo y un giro por video.** Si hacen falta dos mundos, son dos videos.

Estructura de ≈40 s:

| Bloque | Frases | Función |
|---|---|---|
| Gancho | 1 | Pregunta + anomalía visual en el frame 0 |
| Reto o planteamiento | 2–3 | "Hazlo tú" o "esto te pasa": situación concreta en segunda persona |
| Prueba | 1–2 | Pasa lo raro otra vez ("Inténtalo más despacio. Vuelve a pasar.") |
| Explicación | 2–3 | Por qué pasa, con diagramas de neón |
| Giro | 1 | "No es que… Es que…" |
| Salida | 1 | El truco o qué hacer |
| CTA | 1 | "Envíaselo a…" → móvil → vuelta al gancho |

**Medidas de referencia** (un video típico del formato): 11 frases, ≈120 palabras, 42 s, ≈700 créditos. `revisar-voz.py` solo avisa fuera de 30–60 s (la demo es más corta a propósito).

## Escribir para el oído (`vo-<carpeta>.txt`)
Una frase por línea; cada línea es una pista de audio y un bloque de subtítulos.
- **Sin puntos suspensivos:** la voz hace una pausa larga y el ritmo se cae. Usa punto o coma.
- **Números con letras:** "seis", "tres de cada diez". La voz los lee con naturalidad y los cortes se anclan en palabras. En pantalla se ven como cifras con `display` o `merges` (ver `motor.md`).
- **Frases cortas, de 6 a 18 palabras.** Una de más de 25 obliga a 4 o más planos.
- **Siglas y marcas como suenan:** las siglas que se deletrean, en mayúsculas ("la OMS"); las marcas que se leen como palabra, en minúsculas ("Ikea"), y su grafía en pantalla con `display`.
- **Piensa en los cortes.** Cada plano empieza en una palabra con peso: sustantivo, verbo del giro o cifra. Si una palabra se repite en la frase, el corte necesita el número de aparición.
- **Nada de dos ideas en una línea:** cada línea debe poder dibujarse en 1–3 escenas.

Compruébalo antes de gastar créditos:
```bash
python3 "<S>/scripts/revisar-voz.py" "<R>/vo-<carpeta>.txt"
```

## Archivo del guion: `guiones/AAAA-MM-DD_<slug>_<tema>.md`
```markdown
# Video: <título>
**Cuenta:** @<handle> · **Serie:** <SERIE> #N · **Pilar:** <pilar> · **Duración:** ~40 s · **Objetivo:** envíos / guardados / comentarios
**Estado:** guion para aprobar

## Concepto
<!-- y debajo: **Caminos descartados:** 1) … 2) … (por qué no) · **Plano firma:** … -->
<2–4 frases: la pregunta, la prueba, el giro y la salida. Por qué engancha a esta audiencia.>

**Premisa:** <el dato que sostiene el video, con su fuente; si se reformuló la idea original, por qué>
**Mundo:** <dónde pasa todo (un solo sitio) y el protagonista>
**Colores:** <cian = …, oro = …, rojo = …, verde = …> (los mismos en escenas y subtítulos)

## Guion
| # | Voz | Escenas (qué se dibuja · qué pasa en qué palabra) |
|---|---|---|
| 1 | <frase 1> | **Gancho:** <escena con lo raro ya visible> · en "<palabra>": <golpe> |
| 2 | <frase 2> | <escena> · en "<palabra>": <cambio> → <escena 2> |
| … | … | … |
| N | Envíaselo a … | Tu mano con el móvil: en pantalla, este reel; pulsas "Enviar" → vuelta al gancho (bucle) |

## Verificación
- <cada afirmación con su fuente (autor, año, revista u organismo); "comprobar antes de publicar" si caduca>

## Caption
<gancho + emoji>
<1–2 líneas>
<pregunta para comentarios> 👇
Fuente: <fuente corta>
Música: "<Título>" de <Autor> (<web>) · Licencia CC BY 4.0
#… #… #… #… #…
```

**A medida que avanza**, cambia el `Estado`: "voz generada", "en borradores", "aprobado el AAAA-MM-DD y en `videos/finales/`". Si el usuario pide cambios grandes, deja arriba una nota con qué cambió y por qué: la siguiente versión parte de ahí.

## Premisa y fuentes
- **La premisa se verifica antes de escribir.** Los datos curiosos virales suelen ser medio falsos. Busca la fuente primaria: estudio, ley publicada, organismo oficial. Un blog o un video no bastan.
- **Si no se sostiene tal cual**, reformula con lo verificable ("en Suiza la ley de protección animal exige que las cobayas vivan acompañadas") y explícalo en **Premisa** para que el usuario lo decida al aprobar.
- **Simplificaciones:** se permiten si no cambian la conclusión; anótalas en "Verificación" ("simplificación aceptable").
- **Sin cifras inventadas.** Si un número no tiene fuente, no va.
