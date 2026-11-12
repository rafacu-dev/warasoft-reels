# Montar el kit en una cuenta nueva

El formato (voz IA, dioramas 2.5D, subtítulos palabra a palabra, gráficos y portada) se puede llevar a cualquier cuenta. Lo que no se lleva es la identidad: cada cuenta tiene su firma, paleta, logo, moneda, personajes y series. Nunca mezcles estilos entre cuentas.

## 1. Crear la cuenta y montar el kit
Desde `<P>` (la carpeta del proyecto; si aún no tiene `cuentas/`, se crea):
```bash
python3 "<S>/scripts/montar-cuenta.py" <nombre> --handle @<handle>
```
- `<nombre>`: carpeta en minúsculas, sin espacios ni acentos (`mi-cuenta`).
- No sobrescribe nada: si `produccion/remotion` ya existe, se detiene.
- `--sin-demo` no añade el video de demostración; `--sin-npm` no instala dependencias (luego, `npm ci` en `produccion/remotion`).

**Qué deja:**
- Si la cuenta no existía: `contexto.md`, `estilo.md`, `tono-de-voz.md`, `ideas.md`, `referencias/`, `assets/` (logos, fuentes, audio, imágenes), `guiones/`, `calendario/` y `videos/`. Si el proyecto tiene `cuentas/_PLANTILLA`, usa esa.
- `produccion/remotion/` con:
  - el motor (`src/engine/Reel.tsx`, `Portada.tsx`), la cámara 2.5D (`src/Parallax.tsx`) y la identidad (`src/brand.tsx`, con `HANDLE` ya puesto);
  - `Root.tsx` con la demo registrada (`Demo-diorama` y `Portada-Demo`);
  - los scripts: la cola `noche.py`, el turno `turno.sh`, voz (`voz-elevenlabs.mjs`, `voz-simulada.py`, `compactar-pausas.py`), efectos (`sfx-elevenlabs.mjs`), `auditar-planos.py`, `exportar-planos.py`, `hoja-contacto.py` y `master.py`;
  - `public/music/LEEME.md` y `public/sfx-pro/LEEME.md`: la música y los efectos no vienen incluidos;
  - `.env` vacío con chmod 600 y `node_modules` instalado.
- `assets/imagenes/estilo-prompt.txt` (el estilo común de los prompts) y `assets/imagenes/demo/` (los prompts de la demo).
- `produccion/ficha-reel.md`, una plantilla con "POR DEFINIR".
- `videos/borradores/movil` y `videos/finales/movil`, y `<P>/recursos/` (donde vive el candado del turno).

## 2. La identidad (a mano, con el usuario)
1. **Documentos de la cuenta.** Entrevista corta al usuario para rellenar `contexto.md` (incluida la **moneda de su audiencia**), `estilo.md` y `tono-de-voz.md` (incluida la variante del español). Sin contexto no se puede escribir el primer guion.
2. **`src/brand.tsx`:**
   - `C`: paleta de `estilo.md`. Mantén los nombres de las claves (`night`, `slate`, `warm`, `cyan`, `red`, `white`), porque el motor los usa: `warm` = acento dorado/dato, `cyan` = marca/salida, `red` = alerta.
   - `Logo`: el SVG de la cuenta. Usa `assets/logos/` si hay logo; si no, propón uno simple en SVG y enséñaselo.
   - `LOCALE`: formato de las cifras (`es-ES`, `es-MX`, `es-AR`…).
   - `FONT`: Inter por defecto; cualquier fuente de `@remotion/google-fonts` sirve.
3. **`assets/imagenes/estilo-prompt.txt`:** el estilo común de todos los prompts, en una línea y en inglés.
   - Para el mismo look "diorama nocturno", cambia solo los colores si la paleta es otra (`deep navy blue palette with warm golden lights` → la de la cuenta).
   - Mantén `vertical composition, uncluttered top third of the frame, no text`: los subtítulos van arriba.
4. **`produccion/ficha-reel.md`:** completa todos los "POR DEFINIR":
   - series y su música;
   - recursos fijos con su texto exacto en inglés (protagonista, antagonista, objetos) y los billetes de la moneda de la audiencia;
   - CTA, caption y cuidado legal.
5. **Voz.** El usuario abre `produccion/remotion/.env` con un editor y pega `ELEVENLABS_API_KEY` (y `_2`, `_3`… si tiene más cuentas). Para elegir la voz, `node scripts/voz-elevenlabs.mjs --voces` lista las de su cuenta; una voz prediseñada documental como "Bill" funciona bien en español. El id va en `ELEVENLABS_VOICE_ID`. Tú nunca lees ni imprimes ese archivo, y no se clonan voces de otras personas.
6. **Música y efectos:** sigue los `LEEME.md` de `public/music/` y `public/sfx-pro/`, y apunta las pistas en la ficha.

## 3. Comprobar con la demo
1. Saca el frame 0 de la demo por el turno y míralo con Read: paleta, subtítulos, etiqueta de serie.
   ```bash
   cd "<P>/<R>" && scripts/turno.sh npx remotion still Demo-diorama "<ruta absoluta>/demo-f0.png" --frame=0 --log=error
   ```
2. Si el usuario quiere ver el look real, encola las imágenes de la demo (`nuevo-video.py cola <cuenta> imagenes demo`) y lanza la cola.
3. Cuando ya no la necesite, puede quitarla: borra sus dos líneas y el import de `Root.tsx`, y manda a la Papelera `src/videos/Demo.tsx`, `public/vo/demo`, `vo-demo.txt` y `assets/imagenes/demo`.

## 4. Primer video de prueba
- Corto (8–9 frases), con voz simulada hasta que el usuario apruebe paleta, logo, portada y personajes.
- Revisa con él el frame 0, un gráfico y la portada antes de producir una serie.
