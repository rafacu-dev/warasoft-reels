// Demo del kit: un reel corto que se ve sin generar nada (voz simulada y planos provisionales).
// Para verlo con imágenes reales: encola los planos de assets/imagenes/demo (nuevo-video.py cola <cuenta> imagenes demo).
// Para oírlo: genera la voz (nuevo-video.py voz <cuenta> demo), añade música en public/music y efectos en public/sfx-pro.
import React from "react";
import { C } from "../brand";
import { MOVE, Reel, ReelConfig, timeline } from "../engine/Reel";
import { CamKey } from "../Parallax";
import tiempos from "../../public/vo/demo/tiempos.json";

const tl = timeline(tiempos);
export const TOTAL_DEMO = tl.total;
const d = (a: Parameters<typeof tl.at>[0], b: Parameters<typeof tl.at>[0]) => tl.at(b) - tl.at(a);
const HOOK: [CamKey, CamKey] = [{ zoom: 1.16, x: 0, y: 0.01, dolly: 0.12 }, { zoom: 1.04, x: 0, y: -0.01, dolly: 0 }];

const cfg: ReelConfig = {
  imgDir: "demo",
  voDir: "vo/demo",
  series: "DEMO · #1",
  music: { src: "music/interloper.mp3", high: 0.4, low: 0.18 },
  keys: [["ciudad:gold"], ["guion"], ["maqueta:gold"], ["profundidad"], ["palabra"], ["barra:gold"], ["envíaselo"]],
  respiros: [[[3, "maqueta"], 15]],
  shots: [
    // 1 · gancho: lo raro en pantalla desde el frame 0
    { img: "00", at: 0, move: HOOK, center: [0.5, 0.5], fx: "dust", cap: "top" },
    { img: "00", at: [1, "nadie"], move: MOVE.punch(1.25), fx: "dust", cap: "top" },
    // 2 · el guion
    { img: "01", at: [2], move: MOVE.drift(1), trans: "whip", fx: "dust", cap: "top" },
    { img: "01", at: [2, "frase"], move: MOVE.punch(1.3), fx: "dust", cap: "top" },
    // 3 · la respuesta: plano firma con revelación
    { img: "02", at: [3], move: MOVE.push(1), trans: "zoom", fx: "sparks", cap: "top" },
    { img: "03", at: [3, "maqueta"], move: MOVE.pull(1.6), center: [0.5, 0.55], fx: "dust", cap: "top" },
    // 4 · la cámara 2.5D
    { img: "03", at: [4], move: MOVE.drift(-1), trans: "whip", fx: "dust", cap: "top" },
    { img: "03", at: [4, "profundidad"], move: MOVE.punch(1.25), fx: "dust", cap: "top" },
    // 5 · subtítulos
    { img: "04", at: [5], move: MOVE.rise(1), trans: "whip", fx: "dust", cap: "top" },
    { img: "04", at: [5, "palabra"], move: MOVE.push(1), fx: "dust", cap: "top" },
    { img: "04", at: [5, "ritmo"], move: MOVE.drift(1), fx: "dust", cap: "top" },
    // 6 · gráficos (los subtítulos arriba, el gráfico en el centro)
    { img: "05", at: [6], move: MOVE.push(-1), trans: "zoom", fx: "coins", cap: "top" },
    { img: "05", at: [6, "barra"], move: MOVE.punch(1.25), fx: "coins", cap: "top" },
    // 7 · CTA y vuelta al gancho (bucle)
    { img: "06", at: [7], move: MOVE.drift(1), trans: "whip", fx: "dust", cap: "top" },
    { img: "00", at: [7, "tiempo"], move: HOOK, center: [0.5, 0.5], fx: "dust", cap: "top" },
  ],
  overlays: [
    { kind: "flash", at: [3, "maqueta"], color: C.warm, peak: 0.2 },
    {
      kind: "bars",
      at: [6, "datos"],
      dur: d([6, "datos"], [7]),
      title: "Gráfico de ejemplo",
      bars: [
        { label: "A", value: 40, text: "40", color: C.cyan },
        { label: "B", value: 65, text: "65", color: C.warm },
        { label: "C", value: 90, text: "90", color: C.red },
      ],
    },
  ],
  sfx: [
    ["impacto", [1, "construido"], 0.45],
    ["impacto", [3, "maqueta"], 0.5],
    ["moneda-suave", [6, "barra"], 0.3],
  ],
};

export const Demo: React.FC = () => <Reel cfg={cfg} tl={tl} />;
