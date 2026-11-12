// Kit vectorial (skill reel-vectorial) · efectos y piezas gráficas: curvas, tiempos, rebotes, temblor, giros,
// estelas tipo cometa, tinta de luz, flechas de giro, chispas, estallidos, líneas de impacto, píldoras y fondo
// de neón. Todo en SVG; los brillos usan filtros CSS (drop-shadow / blur). Nació en los videos de Dato Rarito (YouTube).
// La paleta con significado (PAL) es de cada cuenta y vive en brand.tsx.
import React, { useId } from "react";
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, PAL } from "../brand";

export { PAL };
export const INK = PAL.ink; // contorno de los dibujos
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Pt = [number, number];

export const useUid = () => "u" + useId().replace(/[^a-zA-Z0-9]/g, "");

// ---------- Curvas ----------
// Catmull-Rom: devuelve una polilínea densa que pasa por todos los puntos
export const catmull = (pts: Pt[], seg = 14): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

export const cumLen = (pts: Pt[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};

// Punto a una fracción t (0..1) de la longitud total, con su tangente
export const along = (pts: Pt[], cum: number[], t: number): { p: Pt; tan: Pt; i: number } => {
  const L = cum[cum.length - 1] * Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < L) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const k = (L - cum[i - 1]) / seg;
  const tx = b[0] - a[0];
  const ty = b[1] - a[1];
  const n = Math.hypot(tx, ty) || 1;
  return { p: [a[0] + tx * k, a[1] + ty * k], tan: [tx / n, ty / n], i };
};

// Tramo de la polilínea entre las fracciones t0 y t1
export const partial = (pts: Pt[], cum: number[], t0: number, t1: number): Pt[] => {
  if (t1 <= t0) return [];
  const a = along(pts, cum, t0);
  const b = along(pts, cum, t1);
  const out: Pt[] = [a.p];
  for (let i = a.i; i < b.i; i++) out.push(pts[i]);
  out.push(b.p);
  return out;
};

export const toD = (pts: Pt[]) => (pts.length ? "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") : "");

// ---------- Movimiento ----------
export const easeOut = Easing.bezier(0.22, 0.8, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = easeInOut) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (c1: string, c2: string, t: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = h(c1);
  const b = h(c2);
  return "#" + a.map((v, i) => Math.round(lerp(v, b[i], Math.min(1, Math.max(0, t)))).toString(16).padStart(2, "0")).join("");
};

export const usePop = (delay = 0, damping = 11, stiffness = 190) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, stiffness } });
};

// Temblor que decae (impactos)
export const shake = (f: number, at: number, dur = 12, amp = 16): Pt => {
  if (f < at) return [0, 0];
  const k = interpolate(f, [at, at + dur], [1, 0], clamp) ** 2;
  return [Math.sin(f * 2.9 + 1) * amp * k, Math.cos(f * 3.7) * amp * k * 0.7];
};

// Giro con cambios de sentido suaves. switches: frames en que se invierte. Se cachea por parámetros.
type SpinOpts = { speed?: number; dir?: number; switches?: number[]; ramp?: number; startAt?: number; phase?: number };
const spinCache = new Map<string, number[]>();
export const spinAngle = (f: number, o: SpinOpts = {}) => {
  const { speed = 0.17, dir = 1, switches = [], ramp = 7, startAt, phase = 0 } = o;
  const vel = (k: number) => {
    let s = dir;
    for (const sw of switches) s *= interpolate(k, [sw, sw + ramp], [1, -1], { ...clamp, easing: easeInOut });
    const start = startAt !== undefined ? interpolate(k, [startAt, startAt + 14], [0, 1], { ...clamp, easing: easeInOut }) : 1;
    return s * speed * start;
  };
  const key = JSON.stringify([speed, dir, switches, ramp, startAt, phase]);
  let arr = spinCache.get(key);
  if (!arr) {
    arr = [phase];
    spinCache.set(key, arr);
  }
  const fi = Math.max(0, Math.floor(f));
  while (arr.length <= fi + 1) {
    const k = arr.length - 1;
    arr.push(arr[k] + vel(k));
  }
  return { a: arr[fi], v: vel(fi) };
};

// ---------- Estela tipo cometa ----------
// pts: del más viejo al más nuevo. colors: color de cada punto (cambia en los cambios de sentido)
export const Comet: React.FC<{ pts: Pt[]; colors?: string[]; color?: string; width: number; core?: string; head?: boolean; layers?: number }> = ({
  pts,
  colors,
  color = "#fff",
  width,
  core = "#fff",
  head = true,
  layers = 7,
}) => {
  const n = pts.length;
  if (n < 2) return null;
  const col = (i: number) => colors?.[i] ?? color;
  const out: React.ReactNode[] = [];
  // brillo difuso por tramos de color
  const runs: [number, number][] = [];
  let s0 = 0;
  for (let i = 1; i < n; i++) {
    if (col(i) !== col(i - 1)) {
      runs.push([s0, i]);
      s0 = i;
    }
  }
  runs.push([s0, n - 1]);
  runs.forEach(([a, b], r) => {
    const seg = pts.slice(a, b + 1);
    if (seg.length < 2) return;
    const fade = (b / (n - 1)) ** 1.4;
    out.push(<path key={`g${r}`} d={toD(seg)} fill="none" stroke={col(b)} strokeWidth={width * 2.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.22 * fade} style={{ filter: `blur(${width * 0.7}px)` }} />);
  });
  // capas apiladas: cada capa cubre el tramo más reciente, más ancha cuanto más nueva
  for (let j = 1; j <= layers; j++) {
    const from = Math.floor((n - 1) * (1 - j / layers));
    const w = width * (1 - 0.72 * ((j - 1) / (layers - 1)));
    const a = 0.62 * (1 - (j - 1) / layers) ** 1.15;
    runs.forEach(([ra, rb], r) => {
      const st = Math.max(from, ra);
      if (rb - st < 1) return;
      out.push(<path key={`l${j}-${r}`} d={toD(pts.slice(st, rb + 1))} fill="none" stroke={col(rb)} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={a} />);
    });
  }
  // núcleo brillante en el tramo más nuevo
  const coreFrom = Math.floor((n - 1) * 0.72);
  out.push(<path key="core" d={toD(pts.slice(coreFrom))} fill="none" stroke={core} strokeWidth={width * 0.28} strokeLinecap="round" opacity={0.85} />);
  const h = pts[n - 1];
  if (head) {
    out.push(<circle key="h1" cx={h[0]} cy={h[1]} r={width * 0.95} fill={col(n - 1)} opacity={0.35} style={{ filter: `blur(${width * 0.5}px)` }} />);
    out.push(<circle key="h2" cx={h[0]} cy={h[1]} r={width * 0.42} fill={core} />);
  }
  return <g>{out}</g>;
};

// Trazo de "tinta de luz" persistente (algo que se dibuja en el aire y se queda)
export const LightInk: React.FC<{ pts: Pt[]; color: string; core?: string; width: number; opacity?: number }> = ({ pts, color, core = "#fff", width, opacity = 1 }) => {
  if (pts.length < 2) return null;
  const d = toD(pts);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width * 3.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} style={{ filter: `blur(${width * 0.9}px)` }} />
      <path d={d} fill="none" stroke={color} strokeWidth={width * 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} style={{ filter: `blur(${width * 0.25}px)` }} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={core} strokeWidth={width * 0.34} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </g>
  );
};

// ---------- Flecha de giro ----------
// dir 1 = horario (en pantalla), -1 = antihorario. rot = ángulo inicial en grados.
export const ArcArrow: React.FC<{ x: number; y: number; r: number; dir: 1 | -1; color: string; width?: number; sweep?: number; rot?: number; ry?: number; opacity?: number; outline?: boolean }> = ({
  x,
  y,
  r,
  dir,
  color,
  width = 26,
  sweep = 290,
  rot = 0,
  ry,
  opacity = 1,
  outline = true,
}) => {
  const k = (ry ?? r) / r;
  const a0 = (rot * Math.PI) / 180;
  const steps = 48;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + dir * ((sweep * Math.PI) / 180) * (i / steps);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const end = pts[pts.length - 1];
  const a1 = a0 + dir * ((sweep * Math.PI) / 180);
  const tan: Pt = [-Math.sin(a1) * dir, Math.cos(a1) * dir];
  const nrm: Pt = [Math.cos(a1), Math.sin(a1)];
  const hl = width * 1.9;
  const hw = width * 1.25;
  const tip: Pt = [end[0] + tan[0] * hl * 0.9, end[1] + tan[1] * hl * 0.9];
  const b1: Pt = [end[0] + nrm[0] * hw - tan[0] * hl * 0.15, end[1] + nrm[1] * hw - tan[1] * hl * 0.15];
  const b2: Pt = [end[0] - nrm[0] * hw - tan[0] * hl * 0.15, end[1] - nrm[1] * hw - tan[1] * hl * 0.15];
  const body = pts.slice(0, -2);
  const fadePts = (from: number, to: number) => body.slice(Math.floor(body.length * from), Math.ceil(body.length * to) + 1);
  return (
    <g transform={`translate(${x},${y}) scale(1,${k})`} opacity={opacity}>
      {outline && <path d={toD(body)} fill="none" stroke={INK} strokeWidth={width + 12} strokeLinecap="round" opacity={0.55} />}
      <path d={toD(fadePts(0, 0.35))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={0.45} />
      <path d={toD(fadePts(0.3, 1))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={toD(fadePts(0.55, 1))} fill="none" stroke="#fff" strokeWidth={width * 0.28} strokeLinecap="round" opacity={0.6} />
      <polygon points={`${tip[0]},${tip[1]} ${b1[0]},${b1[1]} ${b2[0]},${b2[1]}`} fill={color} stroke={outline ? INK : color} strokeWidth={outline ? 6 : 0} strokeLinejoin="round" strokeOpacity={0.55} />
    </g>
  );
};

// ---------- Chispas ----------
export const Star4: React.FC<{ x: number; y: number; s: number; color?: string; rot?: number }> = ({ x, y, s, color = "#fff", rot = 0 }) => (
  <path
    transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}
    d="M0 -10 C1.5 -2.5 2.5 -1.5 10 0 C2.5 1.5 1.5 2.5 0 10 C-1.5 2.5 -2.5 1.5 -10 0 C-2.5 -1.5 -1.5 -2.5 0 -10 Z"
    fill={color}
  />
);

// Chispas que salen de un punto que se mueve (pos(f) en frames locales)
export const Sparks: React.FC<{ pos: (f: number) => Pt; color: string; from?: number; to?: number; rate?: number; seed?: string; size?: number }> = ({
  pos,
  color,
  from = 0,
  to = 9999,
  rate = 1,
  seed = "sp",
  size = 1,
}) => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  const life = 16;
  for (let b = Math.max(from, f - life); b <= Math.min(f, to); b++) {
    for (let k = 0; k < rate; k++) {
      const r = (n: string) => random(`${seed}-${b}-${k}-${n}`);
      if (r("on") > 0.75) continue;
      const age = (f - b) / life;
      const [px, py] = pos(b);
      const ang = r("a") * Math.PI * 2;
      const sp = 3 + r("v") * 7;
      const x = px + Math.cos(ang) * sp * (f - b);
      const y = py + Math.sin(ang) * sp * (f - b) + 0.25 * (f - b) ** 2;
      const s = (0.6 + r("s") * 0.9) * size * (1 - age) * (age < 0.15 ? age / 0.15 : 1);
      out.push(<Star4 key={`${b}-${k}`} x={x} y={y} s={s} color={r("c") > 0.5 ? "#fff" : color} rot={r("r") * 90} />);
    }
  }
  return <g>{out}</g>;
};

// Estallido de chispas en un instante
export const Burst: React.FC<{ x: number; y: number; at: number; color: string; n?: number; radius?: number; seed?: string; size?: number }> = ({ x, y, at, color, n = 14, radius = 220, seed = "bu", size = 1.6 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 18;
  if (t < 0 || t > 1) return null;
  const e = easeOut(t);
  return (
    <g>
      <circle cx={x} cy={y} r={radius * 0.55 * e} fill="none" stroke={color} strokeWidth={14 * (1 - t)} opacity={1 - t} />
      {new Array(n).fill(0).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + random(`${seed}${i}`) * 0.4;
        const d = radius * (0.45 + random(`${seed}d${i}`) * 0.55) * e;
        return <Star4 key={i} x={x + Math.cos(a) * d} y={y + Math.sin(a) * d} s={size * (1 - t) * (0.7 + random(`${seed}s${i}`) * 0.8)} color={i % 3 ? color : "#fff"} rot={i * 23} />;
      })}
    </g>
  );
};

// Líneas de impacto alrededor de un punto
export const ImpactLines: React.FC<{ x: number; y: number; at: number; color?: string; r0?: number; r1?: number; n?: number }> = ({ x, y, at, color = "#fff", r0 = 170, r1 = 300, n = 10 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 10;
  if (t < 0 || t > 1) return null;
  const e = easeOut(t);
  return (
    <g stroke={color} strokeLinecap="round" opacity={1 - t}>
      {new Array(n).fill(0).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.2;
        const a1 = r0 + (r1 - r0) * e * 0.4;
        const a2 = r0 + (r1 - r0) * e;
        return <line key={i} x1={x + Math.cos(a) * a1} y1={y + Math.sin(a) * a1} x2={x + Math.cos(a) * a2} y2={y + Math.sin(a) * a2} strokeWidth={14 * (1 - t) + 2} />;
      })}
    </g>
  );
};

// ---------- Etiquetas ----------
export const Pill: React.FC<{ x: number; y: number; text: string; color: string; textColor?: string; size?: number; delay?: number; rot?: number; out?: number; icon?: React.ReactNode }> = ({
  x,
  y,
  text,
  color,
  textColor = INK,
  size = 54,
  delay = 0,
  rot = -4,
  out,
  icon,
}) => {
  const f = useCurrentFrame();
  const s = usePop(delay, 9, 210);
  const o = out !== undefined ? interpolate(f, [out, out + 6], [1, 0], clamp) : 1;
  if (f < delay) return null;
  const w = text.length * size * 0.66 + size * 1.1 + (icon ? size * 1.1 : 0);
  const h = size * 1.55;
  const wob = Math.sin((f - delay) / 7) * 1.5;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + wob}) scale(${s})`} opacity={o}>
      <rect x={-w / 2 + 6} y={-h / 2 + 10} width={w} height={h} rx={h / 2} fill="#000" opacity={0.28} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={color} stroke={INK} strokeWidth={6} />
      <rect x={-w / 2 + 14} y={-h / 2 + 8} width={w - 28} height={h * 0.32} rx={h * 0.16} fill="#fff" opacity={0.22} />
      {icon && <g transform={`translate(${-w / 2 + size * 0.95},0)`}>{icon}</g>}
      <text x={icon ? size * 0.5 : 0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={textColor} letterSpacing={1}>
        {text}
      </text>
    </g>
  );
};

// Fondo radial con viñeta (para escenas gráficas)
export const GlowBg: React.FC<{ from: string; to: string; cx?: number; cy?: number; grid?: boolean; gridColor?: string }> = ({ from, to, cx = 540, cy = 1000, grid, gridColor = "#5BB8FF" }) => {
  const id = useUid();
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <radialGradient id={id} cx={cx} cy={cy} r={1300} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </radialGradient>
      </defs>
      <rect x={-1080} y={-1920} width={3240} height={5760} fill={`url(#${id})`} />
      {grid && (
        <g stroke={gridColor} strokeWidth={2} opacity={0.07}>
          {new Array(55).fill(0).map((_, i) => (
            <line key={`v${i}`} x1={-1080 + i * 60} y1={-1920} x2={-1080 + i * 60} y2={3840} />
          ))}
          {new Array(97).fill(0).map((_, i) => (
            <line key={`h${i}`} x1={-1080} y1={-1920 + i * 60 + ((f * 0.6) % 60)} x2={2160} y2={-1920 + i * 60 + ((f * 0.6) % 60)} />
          ))}
        </g>
      )}
      {new Array(26).fill(0).map((_, i) => {
        const x = random(`gb${i}`) * 1080;
        const y = (random(`gby${i}`) * 1920 - f * (0.4 + random(`gbs${i}`))) % 1920;
        return <circle key={i} cx={x} cy={y < 0 ? y + 1920 : y} r={1.5 + random(`gbr${i}`) * 3} fill="#fff" opacity={0.1 + 0.25 * Math.abs(Math.sin(f / 20 + i))} />;
      })}
    </g>
  );
};
