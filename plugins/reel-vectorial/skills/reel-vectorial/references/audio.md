# Efectos y música (sin audio de terceros en la skill)

La skill no incluye efectos ni música: cada archivo tiene su licencia y la decides tú. Mientras falten, el motor los omite (avisa en la consola del navegador) y el video se ve y se renderiza igual, sin ese sonido. Así funcionan la demo y una cuenta recién montada.

## Efectos: cinco y graves
El motor solo admite estos nombres, en `<R>/public/sfx-pro/`:

| Archivo | Uso | Volumen |
|---|---|---|
| `impacto.mp3` | Golpe con cola corta: giros, revelaciones | 0,7–0,85 |
| `impacto-grave.mp3` | Golpe sordo, más bajo: caídas, sellos | 0,7–0,85 |
| `pop-grave.mp3` | Aparición de una etiqueta o un objeto | 0,45–0,7 |
| `moneda-suave.mp3` | Una moneda (dinero, precio) | 0,3–0,35 |
| `monedas-suave.mp3` | Varias monedas | 0,3–0,35 |

**Por qué solo esos:** bajo la voz, todo lo que tiene aire (whoosh, risers, barridos) se oye como viento pegado al micrófono, y todo lo brillante (arena, tic-tac, campanillas, monedas sin filtrar) como un chirrido metálico. Por eso el motor rechaza `whoosh`, `whoosh-grave`, `whoosh-largo`, `riser`, `metro`, `arena`, `tictac`, `brillo` y `despertador`, las transiciones no llevan sonido y cada efecto va ligado a una palabra o a un golpe visual (10–16 por video).

### Opción A: generarlos con tu clave de ElevenLabs
```bash
cd "<R>" && node scripts/sfx-elevenlabs.mjs            # los que falten (--pisar para rehacerlos)
```
Genera los cinco con descripciones pensadas para que suenen graves y les aplica un paso bajo a 4,2 kHz. Escúchalos: si alguno suena a aire, a clic o a brillo, repítelo con `--pisar <nombre>`. **Licencia:** con el plan gratuito de ElevenLabs no se pueden usar en contenido comercial (y piden atribución); con un plan de pago, sí.

### Opción B: efectos CC0 (dominio público)
1. Busca en https://freesound.org con el filtro de licencia "Creative Commons 0" (necesitas una cuenta gratuita para descargar): "sub boom", "low thud", "deep impact", "soft pop low", "coin drop wood", "coins pile".
2. Descárgalos (lo hace el usuario) a una carpeta aparte y conviértelos con el nombre exacto, quitando agudos y recortando a 2 s:
   ```bash
   ffmpeg -i descargado.wav -af "lowpass=f=4200,lowpass=f=4200,atrim=0:2,afade=t=out:st=1.7:d=0.3" -ar 44100 -b:a 192k "<R>/public/sfx-pro/impacto.mp3"
   ```
3. Escúchalos sobre una voz: si se oye aire o brillo, descártalo.

**Compartirlos entre cuentas:** deja los cinco en `<P>/recursos/sfx/`; `montar-cuenta.py` los copia a cada cuenta nueva (y a las que actualices) si les faltan.

## Música: CC BY con atribución
La música baja sola bajo la voz (`high` → `low`) y cae casi a cero en los `respiros`. Busca pistas tranquilas, sin voces y con pocos agudos.

**Kevin MacLeod (incompetech.com), CC BY 4.0:**
1. Entra en https://incompetech.com/music/royalty-free/music.html y filtra por mood (p. ej. "Mysterious", "Calming", "Bright").
2. Descarga el mp3 (lo hace el usuario) y guárdalo en `<R>/public/music/<nombre-en-minúsculas>.mp3` (o en `<P>/recursos/musica/` para todas las cuentas).
3. Copia los créditos que genera la página de licencias de incompetech. En el caption, por ejemplo:
   `Música: "<Título>" de Kevin MacLeod (incompetech.com) · Licencia CC BY 4.0`
4. Anota en `ficha-reel.md` el archivo y su título para la atribución.

En el video:
```tsx
music: { src: "music/<archivo>.mp3", high: 0.36, low: 0.15 },
```
Otras fuentes valen si su licencia permite el uso en redes sociales (comprueba si piden atribución y si admiten uso comercial). No uses canciones comerciales: Instagram silencia o bloquea el reel.
