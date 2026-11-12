// __SERIE__: <título del video>
// Guion: cuentas/__CUENTA__/guiones/<AAAA-MM-DD_serie_tema>.md · Voz: vo-__CARPETA__.txt
// Mundo del video: <dónde pasa todo, siempre el mismo sitio> · Colores: <qué es cian, qué es oro, qué es rojo>
// Fuentes y cifras: <cálculos exactos, también en el guion>
import React from "react";
import { Reel, ReelConfig, timeline } from "../engine/Reel";
import tiempos from "../../public/vo/__CARPETA__/tiempos.json";
import { C0, cam, GlowBg, Golpe, Look, mv, NeonLabel, PAL, PortadaEscena, rel, S, shake, Svg, useF } from "../kit";

const tl = timeline(tiempos, 2);
export const TOTAL___CARPETA_MAYUS__ = tl.total;
// Frame absoluto: A(3) = empieza la frase 3 · A(3, "seis") = cuando dice "seis" · A(3, "que", 2, 4) = 2.º "que" + 4 frames
const A = (n: number, w?: string, occ = 1, off = 0) => tl.at(w ? [n, w, occ, off] : [n, undefined, undefined, off]);

// ---------- Momentos clave (frames absolutos; las escenas y los efectos se enganchan aquí) ----------
// const GIRO = A(4, "revés") - 2;

// ---------- Escenas ----------
// Cada escena recibe t0 (frame absoluto en que empieza su plano) y dur. Un sitio lleno, con luz y profundidad,
// y algo que cambia en la palabra clave. Sustituye cada Pendiente(n) por escenas de verdad (references/escenas.md).
const Pendiente = (n: number): React.FC<S> => {
  const Escena: React.FC<S> = ({ t0 }) => {
    const F = useF(t0);
    return (
      <Look shk={shake(F, A(n) + 6, 10, 8)}>
        <Svg>
          <GlowBg from="#24305E" to="#090B16" grid />
          <NeonLabel x={540} y={960} text={`ESCENA ${n}`} color={PAL.cyan} size={110} />
          <Golpe x={540} y={960} at={rel(A(n) + 6, t0)} color={PAL.gold} />
        </Svg>
      </Look>
    );
  };
  Escena.displayName = `Pendiente${n}`;
  return Escena;
};

// ---------- Configuración ----------
const HOOK_A = cam([540, 960], 1.04);
const HOOK_B = cam([540, 1000], 1.12);

const cfg: ReelConfig = {
  imgDir: "",
  voDir: "vo/__CARPETA__",
  // por frase: "palabra" (cian) · "palabra:gold" · "palabra:red"; 1–2 por frase y siempre la de la CTA
  keys: [
__KEYS__
  ],
  // un plano cada 1–2,5 s (≤ 75 frames), cortado en palabras con peso; el último vuelve al gancho (bucle)
  shots: [
__SHOTS__
  ],
  // solo impacto, impacto-grave, pop-grave, moneda-suave y monedas-suave, ligados a una palabra
  // (si aún no están en public/sfx-pro/, el motor los omite: references/audio.md)
  sfx: [["impacto-grave", A(1) + 6, 0.7]],
  // música CC BY en public/music/ (atribución en el caption): music: { src: "music/<archivo>.mp3", high: 0.36, low: 0.15 },
  series: "__SERIE__",
};

export const __COMPONENTE__: React.FC = () => <Reel cfg={cfg} tl={tl} />;

// ---------- Portada: el gancho congelado en su momento más raro (título ≤ 18 caracteres por línea) ----------
const PrimeraEscena = cfg.shots[0].scene!;
export const Portada__COMPONENTE__: React.FC = () => (
  <PortadaEscena serie="__SERIE__" titulo={["¿Título de la", "*portada*?"]}>
    <PrimeraEscena t0={30} dur={60} />
  </PortadaEscena>
);
