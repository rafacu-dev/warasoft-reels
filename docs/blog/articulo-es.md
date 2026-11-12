*[Read this guide in English](https://warasoft.com/blog/reels-with-claude-skills/)*

En Warasoft llevamos semanas produciendo videos cortos para varias cuentas de Instagram y YouTube sin abrir un editor de video. Le pedimos a **Claude Code** "hazme un reel sobre…" y él escribe el guion, genera la voz, dibuja y anima cada escena, pone los subtítulos palabra a palabra, mezcla la música y entrega el MP4 listo para subir.

Ese método vive en dos **skills**, y hoy las publicamos gratis. En esta guía verás qué hace cada una, ejemplos reales de los videos que producen y cómo instalarlas en tu ordenador paso a paso.

## Qué es una skill de Claude

Una *skill* es una carpeta con instrucciones, scripts y plantillas que Claude Code carga cuando la tarea lo pide. Es como darle a Claude el manual de un oficio: en lugar de explicarle cada vez cómo quieres tus videos, la skill ya sabe el formato, las reglas que hacen que un reel retenga y los pasos para producirlo de principio a fin.

Las nuestras se instalan como **plugin** de Claude Code desde un repositorio público de GitHub. Más información en la [documentación oficial de skills](https://code.claude.com/docs/en/skills).

## Las dos skills

<div style="overflow-x:auto;margin:24px 0"><table style="width:100%;border-collapse:collapse;font-size:.95rem;line-height:1.5"><thead><tr><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"></th><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"><strong>reel-vectorial</strong></th><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"><strong>reel-diorama</strong></th></tr></thead><tbody><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Estilo</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Todo dibujado en código: personajes, escenarios, diagramas de neón y cifras animadas</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Dioramas 3D nocturnos con maniquíes, generados por IA y recorridos por una cámara 2.5D</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Cómo se hacen las escenas</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">SVG y HTML dentro de Remotion. No usa generador de imágenes</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Z-Image Turbo genera cada plano en tu Mac y Depth Pro saca la profundidad</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Ejemplos</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><a href="https://www.youtube.com/@DatoRarito">Dato Rarito</a> (YouTube) y <a href="https://www.instagram.com/_rafaelarango/">@_rafaelarango</a> (Instagram)</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><a href="https://www.instagram.com/sal.delarueda/">@sal.delarueda</a> (Instagram)</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Ordenador</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Cualquier Mac reciente (también Linux, o Windows con WSL)</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Mac con Apple Silicon, 32 GB de memoria recomendados</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Ideal para</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Curiosidades, explicaciones, educación, marca personal</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Economía, finanzas, historias con metáforas visuales</td></tr></tbody></table></div>

![Reels hechos con reel-vectorial](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/galeria-vectorial.webp)

![Reels hechos con reel-diorama](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/galeria-diorama.webp)

Las dos producen el mismo formato: video vertical 1080×1920 a 30 fps, de 35 a 55 segundos, con subtítulos grandes palabra a palabra y la palabra clave resaltada en color.

## Cómo trabaja por dentro

![Los seis pasos de un video](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/flujo.webp)

1. **Guion.** Claude escribe un guion con la fórmula que mejor nos ha funcionado:
    - una **pregunta-gancho** con algo raro ya en pantalla desde el primer fotograma;
    - la respuesta llega entre el 65 % y el 80 % del video;
    - el último plano vuelve al primero, para que el reel se vea en bucle.

    Antes de seguir, te lo enseña y **espera tu visto bueno**.

2. **Voz.** Se genera con [ElevenLabs](https://elevenlabs.io), con los tiempos de cada palabra para sincronizar subtítulos y cortes. Si todavía no tienes clave, hay una **voz simulada** para montar el video sin gastar créditos. Después, Whisper "escucha" el audio y avisa si la voz se comió alguna palabra.
3. **Escenas.** Cada frase se ilustra justo cuando se oye. En vectorial, Claude dibuja escenarios con luz, profundidad y un protagonista que actúa. En diorama, escribe los prompts de cada plano y los genera en tu ordenador.
4. **Montaje.** Los cortes caen en la palabra con peso, ningún plano dura más de 2,5 segundos y hay un cambio visual cada 1–2 segundos. Solo se usan efectos de sonido graves, ligados a un golpe visual.
5. **Revisión.** Claude saca fotogramas de cada plano y una hoja de contacto, los mira y corrige lo que no aguante una captura de pantalla.
6. **Render.** Una cola de tareas evita saturar el ordenador. El audio se masteriza a −14 LUFS y se entregan el video, una versión ligera para el móvil y la portada. Tú apruebas el borrador antes de pasarlo a "finales".

## Requisitos

- **[Claude Code](https://code.claude.com/docs/en/quickstart)**, en la terminal o en la pestaña Code de la app de escritorio de Claude.
- **Node.js 20 o superior**, **Python 3.10 o superior** y **ffmpeg**.
- **Para reel-vectorial:** cualquier Mac reciente. También funciona en Linux, y en Windows a través de WSL.
- **Para reel-diorama:**
    - un Mac con Apple Silicon y **32 GB de memoria** (con 24 GB va justo; con 16 GB no lo recomendamos);
    - unos **45 GB libres** para los modelos de imagen.

- **Opcional:**
    - una clave de API de ElevenLabs para la voz; sin ella puedes montar todo con la voz simulada;
    - Google Chrome, porque si no está, Remotion descarga su propio navegador.

## Instalación paso a paso

![Instalar las skills en Claude Code](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/instalar.webp)

**1. Crea una carpeta para tus reels y abre Claude Code en ella.**

```bash
mkdir mis-reels && cd mis-reels
claude
```

**2. Añade nuestro catálogo de plugins** (solo la primera vez):

```text
/plugin marketplace add rafacu-dev/warasoft-reels
```

**3. Instala la skill que quieras, o las dos:**

```text
/plugin install reel-vectorial@warasoft-reels
/plugin install reel-diorama@warasoft-reels
```

Claude Code te pedirá el alcance: elige **"Install for you"** para tenerlas en todos tus proyectos. Después, al escribir `/` verás `/reel-vectorial:reel-vectorial` y `/reel-diorama:reel-diorama`.

**4. Monta tu primera cuenta.** Pídeselo con tus palabras:

> Monta el kit de reel-vectorial para mi cuenta @mi.marca

Claude crea la carpeta `cuentas/mi-marca/` con:

- el proyecto de Remotion;
- los scripts;
- un video de demostración, para que veas el formato antes de gastar nada.

Después te pregunta lo que define tu marca: colores, tipo de protagonista, música y llamada a la acción.

**5. Solo para reel-diorama: prepara el generador de imágenes.** Es un único comando: instala el entorno y descarga los modelos (Z-Image Turbo y Depth Pro). Pídeselo a Claude ("prepara el entorno de imágenes de reel-diorama") o ejecuta el script `preparar-entorno.sh` de la skill. Tarda un rato la primera vez.

**6. (Opcional) Añade tu clave de ElevenLabs.** Va en el archivo `.env` del proyecto de la cuenta, nunca en el chat. Claude te dice dónde está y no lo lee ni lo muestra.

**7. Pide tu primer video:**

> Hazme un reel de 40 segundos para @mi.marca sobre por qué el café no quita el sueño

Claude escribirá el guion y esperará tu aprobación. Después producirá el video y te dejará el borrador en `videos/borradores/`.

**¿Prefieres instalarlo a mano?** Clona el [repositorio](https://github.com/rafacu-dev/warasoft-reels) y copia la carpeta de la skill (`plugins/reel-vectorial/skills/reel-vectorial`) en `~/.claude/skills/`. Toda la documentación está en el [README](https://github.com/rafacu-dev/warasoft-reels#readme).

## Ejemplos y canales para inspirarte

**Hechos con estas skills:**

- [Dato Rarito](https://www.youtube.com/@DatoRarito), en YouTube: curiosidades rápidas, 100 % vectorial.
- [@sal.delarueda](https://www.instagram.com/sal.delarueda/), en Instagram: economía y dinero con dioramas nocturnos.
- [@_rafaelarango](https://www.instagram.com/_rafaelarango/), en Instagram: marca personal, con las poses del fundador recortadas sobre gráficos en código.

**Cuentas y canales que nos inspiraron:**

- [@bolsaolavida](https://www.instagram.com/bolsaolavida/), en Instagram: finanzas explicadas con escenas 3D.
- [@resultaaquee](https://www.instagram.com/resultaaquee/), en Instagram: curiosidades animadas con ritmo muy alto.
- [@javiernegocios.online](https://www.instagram.com/javiernegocios.online/), en Instagram: el creador actúa en poses sobre gráficos animados.
- [Kurzgesagt – In a Nutshell](https://www.youtube.com/@kurzgesagt), en YouTube: el referente del motion graphics vectorial explicativo.
- [Remotion Showcase](https://www.remotion.dev/showcase): videos hechos con código, la misma tecnología que usamos.

## Licencias y buenas prácticas

- **Las skills** son gratis y de código abierto (licencia MIT).
- **Remotion**, el motor de video, es gratis para personas y empresas de hasta 3 personas. Las demás necesitan una [licencia de empresa](https://www.remotion.dev/license).
- **Los modelos de reel-diorama** también son abiertos:
    - Z-Image Turbo, con licencia Apache 2.0;
    - Depth Pro, con la licencia de Apple;
    - mflux, con licencia MIT.

- **La voz** de un plan gratuito de ElevenLabs no permite uso comercial. Si vas a monetizar, usa un plan de pago.
- **La música** recomendada es de Kevin MacLeod ([incompetech.com](https://incompetech.com)) con licencia CC BY: pon la atribución en el caption.
- **Etiqueta el reel como "contenido de IA"** en Instagram cuando la voz o las imágenes sean generadas.
- **Verifica los datos.** Las skills piden fuentes primarias para cada afirmación. Una cuenta de curiosidades vive de su credibilidad.
- **No clones voces de otras personas** sin su permiso.

## Preguntas frecuentes

### ¿Necesito saber programar?
No. Hablas con Claude en español y él escribe y ejecuta el código. Sí te ayuda perderle el miedo a la terminal: son tres comandos.

### ¿Cuánto cuesta?
Las skills son gratis. Necesitas una suscripción de Claude que incluya Claude Code y, si quieres voz real, un plan de ElevenLabs. Las imágenes de reel-diorama se generan en tu Mac, sin coste por imagen.

### ¿Cuánto se tarda en hacer un video?
Lo que más tiempo lleva es tu revisión del guion. El resto depende de tu ordenador: un reel vectorial se renderiza en minutos, y uno con dioramas tarda más porque genera las imágenes en local.

### ¿Funciona en Windows o Linux?
reel-vectorial funciona en macOS, en Linux y en Windows a través de WSL. Lo hemos probado a fondo en Mac. reel-diorama necesita un Mac con Apple Silicon, porque genera las imágenes con MLX.

### ¿Puedo usarlo para mi negocio?
Sí, respetando las licencias de arriba: Remotion según el tamaño de tu empresa, voz de pago para uso comercial y atribución de la música.

---

¿Quieres que montemos este sistema para tu negocio, o que tus reels hablen de tus productos? [Escríbenos a contact@warasoft.com](mailto:contact@warasoft.com) y cuéntanos tu idea. Y si quieres ver cómo seguimos mejorándolo, sigue a [@_rafaelarango](https://www.instagram.com/_rafaelarango/) en Instagram.
