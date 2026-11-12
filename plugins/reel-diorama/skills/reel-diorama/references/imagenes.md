# Planos (Z-Image Turbo en local)

Cada plano es una imagen vertical 1152×2048 generada en el Mac con Z-Image Turbo (mflux). Después:
1. Se le saca un mapa de profundidad (Depth Pro).
2. El motor la mueve con cámara 2.5D.

Que el diorama se vea "real" depende de que el prompt describa una escena con volumen y una sola acción clara.

## Archivos (en `<cuenta>/assets/imagenes/<carpeta>/`)
| Archivo | Qué es |
|---|---|
| `generar.sh` | Lo crea `nuevo-video.py crear`. Lee el estilo común de `../estilo-prompt.txt` y usa el entorno de `REELS_IMG_VENV` |
| `planos.tsv` | Una línea por plano: `<plano><TAB><prompt en inglés>`. Sin comentarios ni líneas de cabecera: los scripts leen cada línea como un plano |
| `semillas.tsv` | `<plano><TAB><semilla>` solo para los planos que no usan la 11 |
| `<plano>-s<semilla>.png` | Imágenes generadas. Nunca se editan ni se borran a mano |
| `<plano>-s<semilla>.log` | Solo si la generación falló: el error |

**Nombres de plano:**
- `00` es siempre el gancho: también es el plano del bucle final y la imagen de la portada.
- Luego `01`, `02`… en orden de guion.
- Variantes de la misma frase: `05a`, `05b`.
- Un video de ≈45 s necesita **12–16 planos**. Cada plano se reutiliza 2–3 veces con movimientos distintos, así que no hacen falta 40 imágenes.

## Cómo escribir el prompt
`generar.sh` antepone el estilo común. Tú escribes solo la escena:
1. **Sujeto y acción primero, en una frase:** `a human pyramid of faceless white mannequins at night, the ones at the bottom lift gold coins up to …`.
2. **Recursos fijos con el texto exacto de `produccion/ficha-reel.md`.** Copia el texto del protagonista, del antagonista, etc. Si varía, el personaje cambia entre planos.
   - Los recursos propios de este video (la tienda-caja, el edificio dorado…) se definen una vez en el guion ("Recursos fijos"), con su texto exacto en inglés, y se copian igual en cada plano.
3. **Escala y encuadre:** `fills the frame`, `epic scale`, `tiny figures walking around its base`, `close-up`. En el gancho, el sujeto debe ser grande: en el móvil se ve a 6 cm.
4. **Luz con intención:** luz cálida sobre aquello de lo que habla la voz. Rojo para la pérdida y cian para la salida, según la paleta de la cuenta.
5. **Nada que deba leerse.** El modelo escribe mal: los letreros, cifras y nombres van en los gráficos del motor, no en la imagen (`blank signs`, `no logos or text`).

**Reglas aprendidas** (cada una costó regenerar planos):
- **Dinero en la moneda de la audiencia.** El modelo pinta dólares (la cara de Franklin) y monedas con $ o ₿ por defecto.
  - Billetes: nombra la moneda, sus colores y añade "not dollars" si no lo son. Para euros funcionó `green and orange euro banknotes (euro currency, not dollars)`; para otras monedas, describe sus colores reales del mismo modo (p. ej. `pink and blue Mexican peso banknotes (Mexican pesos, not dollars)`) y revisa el resultado ampliado. Si no sale bien, evita los billetes y usa monedas lisas o fajos vistos de canto.
  - Monedas: `blank unstamped gold coins with completely smooth flat faces and no engraving at all`. La fórmula "without any symbols or letters" NO basta.
  - Muros y montones de monedas: mejor **de canto**, `tall tight columns of stacked plain gold coins seen strictly from the side, only the ridged golden edges of the coins visible, no coin faces visible`. Vistas de cara, incluso la fórmula anterior puede sacar $. Las caras que asomen, amplíalas siempre.
- **Personas = maniquíes sin rostro.** Nada de pelo ni ropa de colores en multitudes. Nada que pueda leerse como violencia o autolesión, como figuras colgando.
- **Personas reales y famosos:** nunca se representan; se usa un maniquí genérico. Las marcas, sin logos.
- **Tercio superior despejado.** Los subtítulos van arriba (y≈300). El estilo común ya lo pide; no lo contradigas con "sky full of …".

## Generar (siempre por la cola del Mac)
```bash
python3 "<S>/scripts/nuevo-video.py" cola <cuenta> imagenes <carpeta> --extra 00:12,13
```
- Añade una línea `img` por cada plano que falte (semilla 11 o la de `semillas.tsv`), las semillas extra pedidas y un `export`.
- Pide 2 semillas extra para `00` y para el plano de la revelación (`--extra` se puede repetir): son los que más pesan.
- Coste aproximado: ≈1,3 min por imagen con `--low-ram` en un Mac de 48 GB, más las pausas de enfriamiento. 15 planos y 4 extra son ≈35 min.
- Lanza la cola si está parada (desde `<R>`, en segundo plano): `caffeinate -i python3 scripts/noche.py --hasta-vaciar`.
- Nunca lances `generar.sh` fuera de la cola: dos generadores y un render a la vez pueden reiniciar el Mac.

## Revisar antes de montar
1. **Hoja de contacto.** Es ligera; no hace falta turno:
   ```bash
   "${REELS_IMG_VENV:-$HOME/imggen/.venv}/bin/python" "<P>/<R>/scripts/hoja-contacto.py" "<P>/<cuenta>/assets/imagenes/<carpeta>" "<scratchpad>/hoja.jpg"
   ```
   Para comparar semillas, añade la semilla como tercer argumento.
2. **Abre a tamaño completo** (Read sobre el PNG) estos planos:
   - el `00`;
   - el de la revelación;
   - todos los que tengan billetes o monedas.

   A tamaño de miniatura un $ no se ve.
3. **Plano flojo.** Si el sujeto sale pequeño, la acción no se entiende o hay dinero de otra moneda, haz una de dos cosas:
   - cambia el prompt y encola otra semilla (`--extra <plano>:14`);
   - o elige otra semilla ya generada.

   Apunta la elegida en `semillas.tsv` y vuelve a encolar (`cola … imagenes` añade el `export`; el script pone sufijo si ya se hizo).
4. **Exportación.** `export <carpeta>` deja en `public/<carpeta>/` cada `<plano>.jpg` (1080×1920) con su `<plano>_depth.png`.
   - Si falta algún PNG, falla a propósito.
   - Apunta en `public/<carpeta>/.origen.tsv` de qué PNG sale cada plano: al cambiar la semilla en `semillas.tsv`, reexporta ese plano aunque las imágenes sean del mismo lote.
   - Mientras un plano no está exportado, el motor dibuja un plano provisional ("PLANO 05 · PENDIENTE") con el mismo movimiento: se puede montar, pero la cola no renderiza una entrega así.
