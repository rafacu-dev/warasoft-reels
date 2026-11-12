# Ficha del kit de reels: @HANDLE
Datos que la skill `reel-diorama` necesita para producir un video de esta cuenta. Rellénala con el usuario
(entrevista corta) antes del primer video; si algo cambia, se actualiza aquí.

## Identidad
- **Firma:** `@HANDLE` (en `produccion/remotion/src/brand.tsx` → `HANDLE`).
- **Logo:** POR DEFINIR (`Logo` en `brand.tsx`; hasta cambiarlo sale un anillo provisional).
- **Paleta para gráficos:** `C.cyan` = … · `C.red` = … · `C.warm` = … (ajusta `C` en `brand.tsx` al `estilo.md`).
- **Formato de cifras:** `LOCALE` en `brand.tsx` (`es-ES`, `es-MX`, `es-AR`…).

## Voz
- **ElevenLabs:** claves y voz en `produccion/remotion/.env` (chmod 600; el usuario las pega con un editor, nunca en el chat).
- **Voz elegida:** POR DEFINIR (nombre de la voz; el id va solo en `.env`).
- **Ritmo:** ≈3,2 palabras/s a velocidad 1,15 (medirlo de nuevo si cambia la voz: la voz simulada y la auditoría lo asumen).

## Estilo de imagen
- **Prompt común:** `assets/imagenes/estilo-prompt.txt`.
- **Moneda de la audiencia:** POR DEFINIR (euros, pesos mexicanos, dólares…).
- **Recursos fijos.** Usa siempre el mismo texto en inglés para cada personaje u objeto que se repite:
  - **Protagonista:** POR DEFINIR (p. ej. `a faceless smooth white mannequin figure with no facial features wearing a light blue button shirt and dark grey trousers`)
  - **Antagonista u otros:** POR DEFINIR
  - **Billetes** (si salen): POR DEFINIR según la moneda (p. ej. `green and orange euro banknotes (euro currency, not dollars)`)
  - **Monedas:** `blank unstamped gold coins with completely smooth flat faces and no engraving at all`; en muros y montones, de canto: `tall tight columns of stacked plain gold coins seen strictly from the side, only the ridged golden edges of the coins visible, no coin faces visible`

## Series (etiqueta en el gancho y en la portada)
| Etiqueta | Carpeta | Slug | Duración | Música habitual |
|---|---|---|---|---|
| `NOMBRE DE SERIE · #N` | `prefijoNN` | `slug-serie` | 35–55 s | … |

El número siguiente se saca de `src/Root.tsx`: busca la última etiqueta de esa serie.

## Música (en `produccion/remotion/public/music/`; ver su LEEME.md)
| Archivo | Título para la atribución | Licencia |
|---|---|---|
| POR DEFINIR | | |

Texto CC BY: `Música: "<Título>" de Kevin MacLeod (incompetech.com) · Licencia CC BY 4.0 (creativecommons.org/licenses/by/4.0/)`

## Llamada a la acción y caption
- **Última frase de la voz:** POR DEFINIR (ver `tono-de-voz.md`)
- **Caption:** POR DEFINIR

## Cuidado legal
- POR DEFINIR (temas sensibles del nicho, avisos obligatorios, marcas y personas reales que no se representan)
