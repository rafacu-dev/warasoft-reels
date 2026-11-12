// __SERIE__: <título>
// Guion: cuentas/__CUENTA__/guiones/<AAAA-MM-DD_serie_tema>.md
// Cifras: <cálculos exactos y fuentes>
// Esqueleto creado por nuevo-video.py crear: un plano cada ≈2 s cortado en una palabra, imágenes de planos.tsv
// por orden y bucle al 00. Ajusta imágenes, cortes, movimientos, claves, gráficos, efectos y música
// (references/motor.md) y audita: python3 scripts/auditar-planos.py src/videos/__COMPONENTE__.tsx --frames
import React from "react";
import { C } from "../brand";
import { MOVE, Reel, ReelConfig, timeline } from "../engine/Reel";
import { CamKey } from "../Parallax";
import tiempos from "../../public/vo/__CARPETA__/tiempos.json";

const tl = timeline(tiempos);
export const TOTAL___CARPETA_MAYUS__ = tl.total;
const d = (a: Parameters<typeof tl.at>[0], b: Parameters<typeof tl.at>[0]) => tl.at(b) - tl.at(a);
const HOOK: [CamKey, CamKey] = [{ zoom: 1.16, x: 0, y: 0.01, dolly: 0.12 }, { zoom: 1.04, x: 0, y: -0.01, dolly: 0 }];

const cfg: ReelConfig = {
  imgDir: "__CARPETA__",
  voDir: "vo/__CARPETA__",
  series: "__SERIE__",
  music: { src: "music/<pista>.mp3", high: 0.4, low: 0.18 }, // la de la serie (produccion/ficha-reel.md)
  merges: [], // ["diez por ciento", "10 %"]
  display: {}, // { ikea: "IKEA" }
  keys: [
__KEYS__
  ],
  respiros: [], // [[[9, "<palabra de la revelación>"], 15]]
  shots: [
__SHOTS__
  ],
  overlays: [
    // { kind: "flash", at: [9, "<revelación>"], color: C.warm, peak: 0.2 },
  ],
  sfx: [
    // ["impacto", [1, "<palabra>"], 0.45],
  ],
};

export const __COMPONENTE__: React.FC = () => <Reel cfg={cfg} tl={tl} />;
