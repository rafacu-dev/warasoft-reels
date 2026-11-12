# Ficha del kit vectorial: @HANDLE
Lo que la skill `reel-vectorial` necesita para producir un reel de esta cuenta con gráficos dibujados en código (sin imágenes generadas). Se rellena con el usuario, en una entrevista corta, antes del primer video. Si algo cambia, se actualiza aquí.

## Identidad (en `produccion/remotion/src/brand.tsx`)
- **Firma:** `@HANDLE` → `HANDLE`. ¿La cuenta firma sus videos (logo + handle en la última frase)? POR DEFINIR (si no: `firma: false` en cada video).
- **Logo:** POR DEFINIR → `Logo`. Hasta que se cambie, sale un círculo con la inicial.
- **Tipografía:** Nunito 800/900 → `FONT`. Si la cuenta usa otra, cámbiala en `brand.tsx`.
- **Paleta del motor (`C`):** `night` = fondo · `warm` = etiqueta de serie y cifras · `cyan` = marca · `red` = alerta · `white` = texto.
- **Colores con significado (`PAL` y `KEY`):** POR DEFINIR (p. ej. cian = lo que haces tú, oro = el dato, rojo = el problema, verde = la solución). Los gráficos y las píldoras de los subtítulos usan los mismos.

## Protagonista (`PROTA` en `brand.tsx`)
- **Quién es:** POR DEFINIR (mascota, "tú" o ninguno). Colores de cabeza, cuerpo, pelo y manos.
- **Regla:** cada cuenta tiene el suyo. No se usa el de otra cuenta.

## Mundo y estilo de las escenas
- **Escenarios habituales:** POR DEFINIR (salón de noche, ciudad, plató de anillos, fondo de neón…).
- **Acabado:** contorno de tinta, luz cálida y fría, sombras de contacto, grano y viñeta (el kit lo pone).
- **Tono visual:** POR DEFINIR (cartoon pícaro, neón explicativo, interfaz limpia…).

## Voz
- **ElevenLabs:** voz POR DEFINIR (`ELEVENLABS_VOICE_ID`; "Bill" es una voz prediseñada que funciona bien en español a velocidad 1,15). Las claves van en el `.env` de la raíz del proyecto, o en `produccion/remotion/.env` si esta cuenta usa otra voz u otras claves. Las pega el usuario; nunca se escriben en el chat.
- **Ritmo:** ≈3,2 palabras/s (`revisar-voz.py` lo usa para estimar la duración; cámbialo con `--ritmo` si la voz es otra).

## Series (etiqueta en el gancho y en la portada)
| Etiqueta | Carpeta | Componente | Slug | Duración |
|---|---|---|---|---|
| `NOMBRE DE SERIE · #N` | `prefijoNN` | `PrefijoNN` | `slug-serie` | 35–55 s |

El número siguiente sale de `src/Root.tsx`: busca la última etiqueta de esa serie.

## Música (en `public/music/`; la atribución CC BY va en el caption)
| Archivo | Título y autor para la atribución |
|---|---|
| POR DEFINIR | |

Ejemplo de atribución (Kevin MacLeod): `Música: "<Título>" de Kevin MacLeod (incompetech.com) · Licencia CC BY 4.0`

## Llamada a la acción y caption
- **Última frase de la voz:** POR DEFINIR (p. ej. "Envíaselo a alguien que…"). Se ilustra con el móvil del kit (`Movil`).
- **Caption:** POR DEFINIR.

## Cuidado legal
- POR DEFINIR (temas sensibles del nicho, avisos obligatorios).
- El reel lleva voz IA: etiquétalo como "contenido de IA" en Instagram.
- Voz y efectos de un plan gratuito de ElevenLabs: uso no comercial (y piden atribución). Para monetizar, plan de pago.
