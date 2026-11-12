// Señales de luz (kit vectorial): caminos que se encienden (vías, cables, rutas, conexiones), impulsos que
// viajan por ellos, balizas que laten sobre un punto y etiquetas de neón.
import React from "react";
import { useCurrentFrame } from "remotion";
import { FONT } from "../brand";
import { along, catmull, cumLen, partial, Pt, toD } from "./fx";

export type Via = { pts: Pt[]; cum: number[] };
export const via = (keys: Pt[], seg = 14): Via => {
  const pts = catmull(keys, seg);
  return { pts, cum: cumLen(pts) };
};

// La vía se enciende de 0 a p (fracción) con un halo
export const ViaGlow: React.FC<{ v: Via; p: number; color: string; width?: number; opacity?: number }> = ({ v, p, color, width = 10, opacity = 1 }) => {
  if (p <= 0.001) return null;
  const pts = partial(v.pts, v.cum, 0, Math.min(1, p));
  const d = toD(pts);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width * 3.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} style={{ filter: `blur(${width * 1.1}px)` }} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <path d={d} fill="none" stroke="#fff" strokeWidth={width * 0.32} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </g>
  );
};

// Impulsos: cada `every` frames sale uno desde el inicio y tarda `travel` frames en llegar
export const Pulses: React.FC<{ v: Via; from: number; to?: number; every?: number; travel?: number; color: string; size?: number; t0?: number }> = ({
  v,
  from,
  to = 99999,
  every = 14,
  travel = 24,
  color,
  size = 16,
  t0 = 0,
}) => {
  const F = useCurrentFrame() + t0;
  const out: React.ReactNode[] = [];
  for (let s = from; s <= Math.min(F, to); s += every) {
    const k = (F - s) / travel;
    if (k < 0 || k > 1) continue;
    const head = along(v.pts, v.cum, k).p;
    const tail = partial(v.pts, v.cum, Math.max(0, k - 0.16), k);
    out.push(
      <g key={s}>
        <path d={toD(tail)} fill="none" stroke={color} strokeWidth={size * 0.9} strokeLinecap="round" opacity={0.55} style={{ filter: `blur(${size * 0.35}px)` }} />
        <circle cx={head[0]} cy={head[1]} r={size * 1.5} fill={color} opacity={0.45} style={{ filter: `blur(${size * 0.7}px)` }} />
        <circle cx={head[0]} cy={head[1]} r={size * 0.55} fill="#fff" />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// Anillo que late sobre un punto (algo que se ilumina o se señala)
export const Beacon: React.FC<{ x: number; y: number; r: number; color: string; on: number; t0?: number; ry?: number }> = ({ x, y, r, color, on, t0 = 0, ry }) => {
  const F = useCurrentFrame() + t0;
  if (F < on) return null;
  const k = Math.min(1, (F - on) / 8);
  const rings = [0, 1, 2].map((i) => {
    const ph = ((F - on) / 26 + i / 3) % 1;
    return (
      <ellipse key={i} cx={x} cy={y} rx={r * (0.6 + ph * 1.1)} ry={(ry ?? r) * (0.6 + ph * 1.1)} fill="none" stroke={color} strokeWidth={9 * (1 - ph)} opacity={(1 - ph) * 0.95 * k} />
    );
  });
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r * 1.3} ry={(ry ?? r) * 1.3} fill={color} opacity={0.5 * k} style={{ filter: `blur(${r * 0.5}px)` }} />
      {rings}
      <ellipse cx={x} cy={y} rx={r * 0.32 * k} ry={(ry ?? r) * 0.32 * k} fill="#fff" opacity={0.85} style={{ filter: "blur(2px)" }} />
    </g>
  );
};

// Texto de neón (etiquetas sobre diagramas y escenas oscuras). Pocas palabras: el subtítulo ya cuenta la frase.
export const NeonLabel: React.FC<{ x: number; y: number; text: string; color: string; size?: number }> = ({ x, y, text, color, size = 40 }) => (
  <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} letterSpacing={2} fill="#fff" style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 18px ${color})` }}>
    {text}
  </text>
);
