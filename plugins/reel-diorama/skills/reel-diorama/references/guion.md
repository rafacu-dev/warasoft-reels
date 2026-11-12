# Guion y voz

Antes de escribir, revisa tres cosas para no repetir tema, metáfora ni gancho:
- `guiones/`;
- `videos/finales/` y `videos/finales/Publicados/`;
- `calendario/`.

## Dirección antes de escribir
1. **Tres caminos, uno elegido.** Escribe 3 ganchos con su estructura (una línea cada uno) y elige uno con un motivo. Apúntalos en el guion, en "Caminos descartados".
2. **Contra la repetición:** compáralo con el último video de la serie. Al menos 4 de estas 6 cosas tienen que cambiar: estructura, arranque, plano firma, recorrido de cámara, forma de la música y final. Si no, cambia el camino. Una serie del tipo "Quién gana de verdad" no puede acabar siempre con el mismo giro ("en realidad es una inmobiliaria").
3. **Un plano firma:** el plano que se recuerda y que se comparte en captura (la pirámide que se agrieta). Normalmente es el de la revelación. Pide 2 semillas extra para él.
4. **Un respiro antes de la revelación:** la música cae casi a cero en los 0,5 s previos (`respiros` en `motor.md`) y el primer sonido después es el impacto.
5. **Cifras, no adjetivos,** en los prompts y en la tabla del guion: "el edificio ocupa el 70 % del alto, luz dorada desde abajo", no "un edificio imponente".

## La fórmula
1. **Frase 1 = pregunta + lo raro en pantalla en el segundo 1.** La imagen del gancho (plano `00`) debe ser una anomalía que se entienda sin sonido: una pirámide humana que se agrieta, un tsunami saliendo de una taza.
2. **Cada frase se ilustra justo cuando se oye.** Si la voz dice "el banco", se ve el banco. Si pregunta "¿quién?", la imagen muestra a alguien.
3. **La respuesta llega justo antes de la salida y la CTA** (≈65–80 % del video). Hasta entonces se acumulan datos y tensión.
4. **El último plano repite el primero con el mismo movimiento (bucle).** El final enlaza con el principio y el reel se ve dos veces.
5. **Una idea, una metáfora y un giro por video.** Si hacen falta dos metáforas, son dos videos.
6. **Las 3 primeras palabras son la miniatura.** El motor parte los subtítulos en bloques de 3 palabras (o hasta la primera coma) y solo el primero se ve en el frame 0. Si el feed se para ahí, tiene que intrigar: "Ikea paga por…" funciona; "¿Por qué las…" no dice nada. `revisar-voz.py` muestra ese bloque.

Estructura de ≈45 s:

| Bloque | Frases | Función |
|---|---|---|
| Gancho | 1 | Pregunta-dolor o contradicción + anomalía visual |
| Espejo / planteamiento | 2–3 | "Esto soy yo": situación concreta o ejemplo con números redondos |
| Escalada | 3–4 | Datos que crecen (1–3 cifras, una por plano) |
| Giro / respuesta | 1–2 | La revelación: cambia el significado de lo visto |
| Salida honesta | 1 | Qué hacer, sin promesas ("no es fácil, pero…") |
| CTA | 1 | "Envíaselo a <persona concreta>…" |

**Medidas de referencia** (reels publicados de @sal.delarueda): 10–12 frases, 130–160 palabras, 40–50 s, 700–900 créditos de ElevenLabs. Cada serie tiene su rango en `ficha-reel.md`; el revisor solo avisa fuera de 30–60 s.

## Escribir para el oído (vo-<carpeta>.txt)
Una frase por línea; cada línea es una pista de audio y un bloque de subtítulos.
- **Sin puntos suspensivos.** La voz hace una pausa larga y el ritmo se cae. Usa punto o coma.
- **Números con letras:** "mil euros al diez por ciento" (con la moneda de la audiencia). La voz los lee natural y los cortes de plano se anclan en palabras. En pantalla se convierten en cifras con `merges` (ver `motor.md`).
- **Frases cortas** de 8–20 palabras. Una de más de 28 obliga a 4 o más planos.
- **Siglas y marcas como suenan.**
  - Las siglas que se deletrean, en mayúsculas: "la CNMV", "el SAT".
  - Las marcas que se leen como palabra, en minúsculas: "Ikea", no "IKEA", porque la voz podría deletrearla. La grafía en pantalla se recupera con `display: { ikea: "IKEA" }`.
  - Si algo se lee mal, escríbelo como se pronuncia.
- **Piensa en los cortes.**
  - Los planos cambian en palabras concretas.
  - Las que se confunden al quitar tildes ("que"/"qué", "por"/"¿Por") cuentan como la misma palabra. Si hay varias en la frase, hay que indicar cuál con el número de aparición.
  - Mejor que la frase tenga sustantivos o cifras donde cortar.
- **Nada de dos ideas en una línea.** Cada línea debe poder ilustrarse con 1–3 planos.

Comprueba el texto antes de gastar créditos:
```bash
python3 "<S>/scripts/revisar-voz.py" "<P>/cuentas/<cuenta>/produccion/remotion/vo-<carpeta>.txt"
```

## Archivo del guion: `guiones/AAAA-MM-DD_serie_tema.md`
La fecha es la de publicación prevista (mira el calendario). Formato:

```markdown
# Video: <título>
**Serie:** <Serie> #N · **Guion:** v1 (fórmula: lo raro + pregunta en el segundo 1, respuesta al final) · **Duración estimada:** ~45 s · **Objetivo:** envíos / guardados / comentarios
**Emoción:** <arco en 3–4 pasos>
**Estado:** guion para aprobar

## Concepto
<2–4 frases: la pregunta, la escalada y la respuesta. Por qué funciona para esta audiencia.>

**Premisa:** <el dato que sostiene el video, con su fuente; si se reformuló la idea original, por qué>
**Caminos descartados:** <1) gancho y estructura · 2) … y por qué no> · **Plano firma:** <cuál y cómo>
**Recursos fijos:** <personajes de ficha-reel.md + recursos propios de este video, con su texto exacto en inglés>
**Cuidado legal:** <qué no se nombra o representa y por qué>

## Guion
| # | Voz | Planos | Gráfico |
|---|---|---|---|
| 1 | <frase 1> | **Lo raro primero:** 00 <descripción> → 01 <…> | Etiqueta de serie |
| … | … | 02 <…> | <número / barras / puntos / —> |
| N | <CTA> | … → 00 <gancho> (bucle) | Sello @<handle> |

## Cifras y fuentes
- <cada cifra con su cálculo o su fuente; "comprobar antes de publicar" si caduca>

## Caption
<hook + emoji>

<emoji> <línea 1>
<emoji> <línea 2>
<emoji> <línea 3>

<pregunta> Te leo 👇
<Envíaselo a…>
<aviso legal si aplica>
Música: "<Título>" de Kevin MacLeod (incompetech.com) · Licencia CC BY 4.0
Voz generada con IA.

#… #… #… #… #…
```

**Cuando el usuario lo apruebe:** cambia el `Estado` a medida que avanza: "voz generada", "en borradores", "aprobado el AAAA-MM-DD y en `videos/finales/`".

## Premisa y cifras
- **La premisa se verifica antes de escribir.** Una idea puede ser un titular falso ("Ikea no gana dinero vendiendo muebles": sí lo gana).
  - Fuentes primarias: memoria anual, web corporativa, instituto de estadística, banco central o regulador del país de la audiencia. Un blog no basta.
  - Si no se sostiene, reformula con el dato verificable más cercano (en Ikea, la cuota de franquicia del 3 %).
  - Explícalo arriba del guion, en una línea **Premisa**, para que el usuario lo decida al aprobar.
  - No repitas un giro ya usado en la cuenta.
- **Cálculos:** ponlos en "Cifras y fuentes" y en el comentario de cabecera del `.tsx`. Redondea en la voz ("más de tres mil") y deja el valor exacto para el gráfico.
- **Datos públicos:** que tengan fuente. Si no puedes verificarlo, dilo en el guion en vez de inventarlo.
