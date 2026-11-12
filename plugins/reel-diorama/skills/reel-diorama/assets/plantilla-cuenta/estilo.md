# Guía de estilo visual

## Paleta de colores
| Rol | HEX | En el motor (`src/brand.tsx` → `C`) |
|---|---|---|
| Fondo | #1E2433 | `night` |
| Secundario | #2E3A4F | `slate` |
| Dato estrella / dinero | #F2C46D | `warm` |
| Marca / salida | #4FC3F7 | `cyan` |
| Pérdida / alerta | #E5484D | `red` |
| Texto | #FFFFFF | `white` |

## Tipografía
- **Subtítulos y títulos:** Inter 800 (cámbiala en `brand.tsx` si la cuenta usa otra de Google Fonts)
- Archivos propios en `assets/fuentes/`

## Formato
- 1080×1920 (9:16) · 30 fps · 35–55 s
- Zonas seguras: nada importante en los 250 px superiores ni en los 400 px inferiores (interfaz de Instagram)

## Estilo de imagen
- Look: diorama 3D nocturno, maqueta en miniatura, luz cálida sobre lo importante
- Prompt común (en inglés): `assets/imagenes/estilo-prompt.txt`
- Personas: maniquíes sin rostro

## Lenguaje de animación
- **Ritmo:** un cambio visual cada 1,5–2,5 s
- **Transiciones:** corte, barrido (`whip`), golpe de zoom, destello; fundido solo para respirar
- **Subtítulos:** palabra a palabra, palabra clave en píldora de color

## Audio
- Música: instrumental oscura o ambiental, CC BY o propia (atribución en el caption)
- Voz en off: (voz de ElevenLabs elegida)
- Efectos: solo impacto grave y monedas filtradas, ligados a una palabra. Nada de whoosh ni brillos.

## Logo y cierre
- Logo: `assets/logos/` (en el motor, componente `Logo` de `brand.tsx`)
- Sello final: logo + @handle en la última frase
