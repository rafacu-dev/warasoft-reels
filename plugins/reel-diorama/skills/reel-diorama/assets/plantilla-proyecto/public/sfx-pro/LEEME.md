# Efectos de sonido (no vienen incluidos)

El motor solo admite tres efectos, siempre ligados a una palabra del guion:

| Archivo | Qué es | Volumen |
|---|---|---|
| `impacto.mp3` | golpe grave de tráiler | 0,4–0,55 |
| `moneda-suave.mp3` | una moneda, sin agudos | 0,3–0,35 |
| `monedas-suave.mp3` | un puñado de monedas, sin agudos | 0,3–0,35 |

Sin estos archivos el video funciona igual, solo que sin efectos.

## Opción A: generarlos con tu clave de ElevenLabs
```bash
node scripts/sfx-elevenlabs.mjs
```
Lo generado con el plan gratuito de ElevenLabs no permite uso comercial.

## Opción B: efectos CC0 (dominio público)
Busca en un banco de sonidos con licencia CC0 (por ejemplo, Freesound filtrando por "Creative Commons 0")
un golpe grave ("cinematic boom", "sub drop") y monedas ("coin drop", "coins pour"). Después, quítales los agudos:

```bash
ffmpeg -i golpe.wav -af "loudnorm=I=-16:TP=-1.5" impacto.mp3
ffmpeg -i moneda.wav -af "lowpass=f=4200,loudnorm=I=-18:TP=-2" moneda-suave.mp3
ffmpeg -i monedas.wav -af "lowpass=f=4200,loudnorm=I=-18:TP=-2" monedas-suave.mp3
```

## Por qué nada más
- **Nada de whoosh, riser ni barridos** entre escenas: en el móvil se oyen como viento pegado al micrófono.
  Las transiciones visuales van sin sonido.
- **Nada de brillos** (arena, tic-tac, campanillas, despertadores): debajo de la voz suenan a chirrido metálico.
  Antes de usar un efecto nuevo, mide su centroide espectral (`ffmpeg -i x.mp3 -af aspectralstats,ametadata=print -f null -`);
  si pasa de ~4 kHz, fíltralo con `lowpass=f=4200` o descártalo.
- El motor rechaza los nombres prohibidos (whoosh, riser, arena, tictac, brillo…) y el render falla.
