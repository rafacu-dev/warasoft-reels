# Cuenta nueva, o llevar el kit a una cuenta que ya existe

El formato se lleva a cualquier cuenta: voz IA, escenas en código, subtítulos palabra a palabra, móvil de la CTA y portada. La identidad no se lleva: cada cuenta tiene su paleta, su protagonista, su logo y su firma, y no se mezclan estilos entre cuentas.

Todo vive en el proyecto `<P>` (la carpeta donde trabajas con Claude Code), con una carpeta por cuenta en `<P>/cuentas/`. Requisitos y claves: `instalacion.md`.

## 1. Cuenta nueva: montar el kit
Pregunta el nombre de la carpeta (minúsculas, sin espacios) y el handle de Instagram, y ejecuta desde `<P>`:
```bash
python3 "<S>/scripts/montar-cuenta.py" <nombre> --handle @<handle>
```
No pisa nada. Crea:
- `cuentas/<nombre>/` con `contexto.md`, `estilo.md`, `tono-de-voz.md` e `ideas.md` para rellenar, y las carpetas `guiones/`, `referencias/`, `assets/logos/`, `videos/borradores/movil` y `videos/finales/movil`;
- `produccion/ficha-reel.md` para rellenar;
- `produccion/remotion/`, copiado de `<S>/assets/plantilla-proyecto/`:
  - Remotion con versiones fijadas (`package.json` + `package-lock.json`), `remotion.config.ts` y `tsconfig.json`;
  - el motor (`src/engine/Reel.tsx`), el kit (`src/kit/`), el grano (`public/kit/`);
  - `src/brand.tsx` con una paleta neutra de ejemplo y un protagonista provisional, con el `HANDLE`;
  - los scripts: cola (`noche.py`) y turno (`turno.sh`), voz (`voz-elevenlabs.mjs`, `claves.mjs`, `compactar-pausas.py`, `voz-simulada.py`), efectos (`sfx-elevenlabs.mjs`), `master.py`, `auditar-escenas.py` y `stills.mjs`;
  - el video de ejemplo `Demo01` (`vo-demo01.txt`, `src/videos/Demo01.tsx`) con voz simulada, ya registrado como `Demo01-tostada` y `Portada-Demo01` (`--sin-demo` para no incluirlo);
  - `.reel-vectorial.json`: la huella de los archivos de la skill, para poder actualizarlos sin pisar cambios;
- en `<P>`, si no existen: `recursos/` (candado de la cola), `.gitignore` y `.env` vacío (chmod 600) para las claves;
- `node_modules`: clonado de otra cuenta del proyecto con el mismo `package-lock.json` o instalado con `npm ci` (`--sin-npm` para hacerlo después a mano).

Comprueba la demo antes de seguir: `python3 "<S>/scripts/nuevo-video.py" stills <nombre> Demo01-tostada --salida <carpeta temporal>/demo` y mira la hoja de contacto.

## 2. Cuenta que ya tiene Remotion (de este kit o de otro formato): actualizar
```bash
python3 "<S>/scripts/montar-cuenta.py" <nombre> --actualizar [--handle @<handle>] [--forzar-motor]
```
- **Lo que es de la skill** (`src/kit/`, `public/kit/`, `src/engine/Reel.tsx`, `src/Parallax.tsx`, `scripts/`) se sincroniza con la versión instalada de la skill:
  - si la cuenta no lo ha tocado desde que se montó, se sustituye;
  - si tiene cambios propios, se respeta y la versión nueva queda al lado como `<archivo>.kit-nuevo` para fusionarla a mano;
  - en una cuenta montada por otra herramienta (sin `.reel-vectorial.json`), se sustituyen el kit y sus tres scripts (`auditar-escenas.py`, `voz-simulada.py`, `stills.mjs`); los scripts compartidos (cola, voz, master) y `Parallax.tsx` se respetan; el motor también, salvo con `--forzar-motor`, que guarda el anterior como `Reel.tsx.antes-<fecha>`. Si lo fusionas a mano, lo que el kit necesita del motor es: el campo `scene` de `ShotDef`, `SceneCam`, la rama `s.scene ?` de `ShotLayer`, `cap: "mid"`, `KEY` y `HANDLE` de brand, `limpio`, `respiros`, `firma` y `music` opcional.
- **brand.tsx:** añade lo que falte (`HANDLE`, `PAL`, `KEY`, `PROTA`) sin tocar lo que hay.
- **Lo demás:** crea lo que falte (carpetas, `ficha-reel.md`, cola) e instala las dependencias npm del kit que falten.

Después de actualizar, saca un fotograma de un video viejo de la cuenta y compáralo con su final: tiene que verse igual.

## 3. Adaptar la identidad (con el usuario)
1. **Contexto:** rellena `contexto.md`, `estilo.md` y `tono-de-voz.md` con una entrevista corta (marca, audiencia, pilares, qué no decir, paleta, tono). Sin contexto no hay primer guion.
2. **`src/brand.tsx`:**
   - `C`: paleta de `estilo.md`. Mantén los nombres (`night`, `slate`, `warm`, `cyan`, `red`, `white`): el motor los usa.
   - `PAL` y `KEY`: colores con significado para gráficos y píldoras, en #RRGGBB. Se pueden añadir más.
   - `PROTA`: el protagonista (cabeza, cuerpo, pelo, manos). Si la cuenta no tiene mascota, uno neutro o ninguno (solo plano subjetivo y diagramas).
   - `Logo`: el SVG de la cuenta. Usa `assets/logos/` si hay; si no, propón uno simple y enséñaselo.
   - `FONT`: Nunito por defecto; cámbiala si `estilo.md` dice otra (de `@remotion/google-fonts`).
3. **`produccion/ficha-reel.md`:** completa todos los "POR DEFINIR": firma, colores con significado, protagonista, mundo habitual, series, voz, música, CTA, caption y cuidado legal.
4. **Voz:** por defecto, las claves y la voz del `.env` del proyecto. Si esta cuenta quiere otra voz u otras claves:
   - crea `<R>/.env` (chmod 600) con las líneas `ELEVENLABS_VOICE_ID=` (y `ELEVENLABS_API_KEY=` si cambia);
   - pide al usuario que pegue allí los valores, nunca en el chat.

   Para elegir: `cd "<R>" && node scripts/voz-elevenlabs.mjs --voces`. No se clonan voces de otras personas sin su permiso.
5. **Audio:** efectos y música según `audio.md`.

## 4. Primer video de prueba
- Corto (6–8 frases), con voz simulada hasta que el usuario apruebe el aspecto.
- Revisa con él el frame 0, una escena con el protagonista, un diagrama, el móvil de la CTA y la portada. Solo después, la voz real y la serie.
- Cuando la cuenta ya tenga videos propios, la demo sobra: quita sus dos líneas y el import de `src/Root.tsx` y manda `src/videos/Demo01.tsx`, `vo-demo01.txt` y `public/vo/demo01/` a la papelera.
