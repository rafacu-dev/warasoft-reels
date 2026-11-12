// Piezas comunes para escribir escenas (kit vectorial): cámara sin bordes negros, acabado de cine,
// lienzo SVG a pantalla completa, frame absoluto para la continuidad entre planos, sombras de contacto,
// charcos de luz, polvo en el aire, capas con profundidad (parallax dentro del plano) y golpes.
import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import type { CamKey } from "../Parallax";
import { Burst, easeInOut, ImpactLines, Pt, useUid } from "./fx";
import { Grain, Vignette } from "./look";

// Lo que el motor pasa a cada escena: t0 = frame absoluto en que empieza el plano; dur = frames que dura.
export type S = { t0: number; dur: number };

// Frame absoluto dentro de una escena. Úsalo para todo lo que sigue de un plano al siguiente (un giro, un
// trazo, una luz): así nada salta al cortar y el último plano puede repetir el estado del primero (bucle).
export const useF = (t0: number) => useCurrentFrame() + t0;
// Frame absoluto → frame local de la escena (Burst, Pill, Sparks… cuentan en frames locales).
export const rel = (abs: number, t0: number) => abs - t0;

// Cámara: centra el punto p (px de 1080×1920) en (540, ty) con zoom z. Con z ≥ 1 nunca deja bordes negros.
export const cam = (p: Pt, z = 1, ty = 960): CamKey => {
  let x = -(p[0] - 540) * z;
  let y = ty - 960 - (p[1] - 960) * z;
  if (z >= 1) {
    const mx = (z - 1) * 540;
    const my = (z - 1) * 960;
    x = Math.max(-mx, Math.min(mx, x));
    y = Math.max(-my, Math.min(my, y));
  }
  return { zoom: z, x: x / 1080, y: y / 1920, dolly: 0 };
};
export const mv = (a: CamKey, b: CamKey): [CamKey, CamKey] => [a, b];
export const C0 = cam([540, 960], 1);

// Acabado de cine: envuelve SIEMPRE la escena. shk = temblor (usa shake() de fx en los impactos).
export const Look: React.FC<{ children: React.ReactNode; shk?: Pt; vig?: number; grain?: number; bg?: string }> = ({
  children,
  shk = [0, 0],
  vig = 0.5,
  grain = 0.11,
  bg = "#0b0d16",
}) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `translate(${shk[0]}px,${shk[1]}px) scale(${shk[0] || shk[1] ? 1.03 : 1})` }}>{children}</AbsoluteFill>
    <Vignette strength={vig} />
    <Grain opacity={grain} />
  </AbsoluteFill>
);

// Lienzo SVG de 1080×1920: todas las coordenadas del kit están en estos píxeles.
export const Svg: React.FC<{ children: React.ReactNode; blur?: number }> = ({ children, blur }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", filter: blur ? `blur(${blur}px)` : undefined }}>
    {children}
  </svg>
);

// Sombra de contacto bajo un objeto o personaje: sin ella, las cosas flotan.
export const Sombra: React.FC<{ x: number; y: number; rx: number; ry?: number; opacity?: number; blur?: number }> = ({ x, y, rx, ry, opacity = 0.35, blur = 10 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx * 0.16} fill="#000" opacity={opacity} style={{ filter: `blur(${blur}px)` }} />
);

// Charco de luz que respira (lámpara, ventana, foco sobre el protagonista, brillo de una pantalla).
export const Luz: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number; pulse?: number }> = ({ x, y, r, color, opacity = 0.5, pulse = 0.08 }) => {
  const f = useCurrentFrame();
  const id = useUid();
  const k = 1 + pulse * Math.sin(f / 11);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={Math.min(1, opacity * k)} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );
};

const wrap = (v: number, w: number) => ((v % w) + w) % w;

// Motas de polvo que flotan en la luz: dan profundidad y vida a los planos quietos.
// area = [x, y, ancho, alto] donde flotan; t0 para que sigan igual entre planos.
export const Polvo: React.FC<{ n?: number; color?: string; seed?: string; area?: [number, number, number, number]; t0?: number }> = ({
  n = 30,
  color = "#FFE7B0",
  seed = "polvo",
  area = [0, 0, 1080, 1920],
  t0 = 0,
}) => {
  const f = useCurrentFrame() + t0;
  const [ax, ay, aw, ah] = area;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const d = 0.4 + r("d") * 0.9; // profundidad: las cercanas son más grandes y van más rápido
        const x = ax + wrap(r("x") * aw + Math.sin(f / 50 + i) * 22 * d, aw);
        const y = ay + wrap(r("y") * ah - f * 0.5 * d, ah);
        const o = (0.15 + 0.55 * Math.abs(Math.sin(f / 35 + i * 1.7))) * d;
        return <circle key={i} cx={x} cy={y} r={1.2 + d * 3} fill={color} opacity={Math.min(1, o)} style={d > 1 ? { filter: "blur(1.5px)" } : undefined} />;
      })}
    </g>
  );
};

// Capa con profundidad: dentro de un plano, lo lejano se mueve menos que lo cercano (parallax).
// prof 0 = fondo casi quieto · 1 = plano medio · 2 = primer plano. dx/dy = desplazamiento total (px) a prof 1;
// s = acercamiento extra a prof 1 (0,04 = 4 %). dur = la del plano (prop `dur` de la escena).
export const Capa: React.FC<{ prof: number; dur: number; dx?: number; dy?: number; s?: number; children: React.ReactNode }> = ({ prof, dur, dx = -30, dy = 0, s = 0, children }) => {
  const f = useCurrentFrame();
  const k = easeInOut(Math.min(1, Math.max(0, f / Math.max(1, dur))));
  const z = 1 + s * prof * k;
  return <g transform={`translate(${dx * prof * k} ${dy * prof * k}) translate(540 960) scale(${z}) translate(-540 -960)`}>{children}</g>;
};

// Golpe visual en un punto (líneas de impacto + estallido de chispas). at en frames LOCALES: rel(ABS, t0).
// Acompáñalo de temblor (Look shk={shake(F, ABS, 12, 14)}) y de un efecto grave ligado a la misma palabra.
export const Golpe: React.FC<{ x: number; y: number; at: number; color: string; radius?: number }> = ({ x, y, at, color, radius = 260 }) => (
  <g>
    <ImpactLines x={x} y={y} at={at} color={color} r0={radius * 0.75} r1={radius * 1.3} />
    <Burst x={x} y={y} at={at} color={color} radius={radius} />
  </g>
);
