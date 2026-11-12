// Gestos gráficos que se repiten en casi todos los reels (kit vectorial): el sello que se tacha en el
// "No es que…", la interrogación de neón, el visto bueno o la X, el bocadillo de pensamiento, el
// temporizador de neón y la ficha antigua con un año. Coordenadas en px de 1080×1920. Los `at` son frames
// LOCALES de la escena (usa rel(ABS, t0)); `p` y los temporizadores reciben progreso 0..1.
import React from "react";
import { useCurrentFrame } from "remotion";
import { FONT } from "../brand";
import { Burst, easeOut, INK, LightInk, PAL, prog, Pt, usePop } from "./fx";

const glow = (c: string, r = 12) => ({ filter: `drop-shadow(0 0 ${r}px ${c}) drop-shadow(0 0 ${r * 2}px ${c})` });

// Sello que cae (rebote) y luego se tacha con una raya blanca: "No es que seas TORPE…"
export const SelloTachado: React.FC<{ x: number; y: number; texto: string; at: number; tachaAt: number; color?: string; size?: number; rot?: number }> = ({
  x,
  y,
  texto,
  at,
  tachaAt,
  color = PAL.red,
  size = 104,
  rot = -8,
}) => {
  const f = useCurrentFrame();
  const s = usePop(at, 9, 230);
  const cross = prog(f, tachaAt, tachaAt + 7, easeOut);
  if (f < at) return null;
  const w = texto.length * size * 0.66 + size * 0.9;
  const h = size * 1.45;
  return (
    <g>
      <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.26} fill="none" stroke={color} strokeWidth={size * 0.13} />
        <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={size * 0.18} fill={color} opacity={0.18} />
        <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} letterSpacing={size * 0.05} fill={color} style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))" }}>
          {texto}
        </text>
        {cross > 0 && <line x1={-w / 2 - 24} y1={0} x2={-w / 2 - 24 + (w + 48) * cross} y2={0} stroke="#fff" strokeWidth={size * 0.17} strokeLinecap="round" style={glow("#fff", 6)} />}
      </g>
      <Burst x={x} y={y} at={tachaAt + 2} color="#ffffff" radius={w * 0.6} />
    </g>
  );
};

// Interrogación de neón que salta y flota
export const Pregunta: React.FC<{ x: number; y: number; at: number; size?: number; color?: string }> = ({ x, y, at, size = 220, color = PAL.gold }) => {
  const f = useCurrentFrame();
  const s = usePop(at, 8, 200);
  if (f < at) return null;
  return (
    <g transform={`translate(${x},${y + Math.sin(f / 9) * 8}) rotate(${Math.sin(f / 13) * 6}) scale(${s})`}>
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill="#fff" style={glow(color, 10)}>
        ?
      </text>
    </g>
  );
};

// Visto bueno (ok) o X (no) en un círculo
export const Visto: React.FC<{ x: number; y: number; at: number; ok?: boolean; s?: number }> = ({ x, y, at, ok = true, s = 1 }) => {
  const f = useCurrentFrame();
  const k = usePop(at, 9, 220);
  const col = ok ? PAL.green : PAL.red;
  if (f < at) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${k * s})`} style={glow(col, 10)}>
      <circle r={52} fill="rgba(8,12,30,0.75)" stroke={col} strokeWidth={9} />
      {ok ? (
        <path d="M-24 2 L-6 20 L26 -18" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M-20 -20 L20 20 M20 -20 L-20 20" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
      )}
    </g>
  );
};

// Bocadillo de pensamiento (nube) con la cola hacia la cabeza; children se dibuja centrado en (x, y)
export const Bocadillo: React.FC<{ x: number; y: number; w?: number; h?: number; cola?: Pt; children?: React.ReactNode; opacity?: number; s?: number }> = ({
  x,
  y,
  w = 360,
  h = 240,
  cola,
  children,
  opacity = 1,
  s = 1,
}) => {
  const bultos = [-0.36, -0.12, 0.12, 0.36].map((k, i) => ({ cx: k * w, cy: -h * 0.28 + (i % 2) * 18, r: h * 0.34 }));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
      {cola &&
        [0.35, 0.6, 0.82].map((k, i) => (
          <circle key={i} cx={(cola[0] - x) * k} cy={h * 0.4 + (cola[1] - y - h * 0.4) * k} r={22 - i * 6} fill="#fff" stroke={INK} strokeWidth={5} />
        ))}
      <g>
        {bultos.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#fff" stroke={INK} strokeWidth={7} />
        ))}
        <rect x={-w / 2} y={-h * 0.3} width={w} height={h * 0.62} rx={h * 0.3} fill="#fff" stroke={INK} strokeWidth={7} />
        {bultos.map((b, i) => (
          <circle key={`i${i}`} cx={b.cx} cy={b.cy} r={b.r - 6} fill="#fff" />
        ))}
        <rect x={-w / 2 + 6} y={-h * 0.3 + 6} width={w - 12} height={h * 0.62 - 12} rx={h * 0.27} fill="#fff" />
      </g>
      <g>{children}</g>
    </g>
  );
};

// Temporizador de neón: aro que se llena (p 0..1) y reloj mm:ss que cuenta hasta `seg` segundos
export const Temporizador: React.FC<{ x: number; y: number; r?: number; p: number; color: string; seg?: number; tope?: number }> = ({ x, y, r = 170, p, color, seg = 1200, tope }) => {
  const arc = (a0: number, a1: number): Pt[] => {
    const pts: Pt[] = [];
    const n = Math.max(2, Math.ceil((a1 - a0) * 40));
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (a0 + ((a1 - a0) * i) / n) * Math.PI * 2;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    return pts;
  };
  const q = Math.max(0, Math.min(1, p));
  const total = Math.round(q * seg);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return (
    <g>
      <circle cx={x} cy={y} r={r + 34} fill="rgba(8,12,30,0.72)" stroke="#fff" strokeOpacity={0.12} strokeWidth={4} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={24} />
      {new Array(12).fill(0).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={x + Math.cos(a) * (r - 34)} y1={y + Math.sin(a) * (r - 34)} x2={x + Math.cos(a) * (r - 22)} y2={y + Math.sin(a) * (r - 22)} stroke="#fff" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" />;
      })}
      {q > 0.004 && (
        <g style={glow(color, 10)}>
          <LightInk pts={arc(0, q)} color={color} core="#fff" width={20} />
        </g>
      )}
      {tope !== undefined && tope > 0 && (
        <line x1={x} y1={y - r - 52} x2={x} y2={y - r + 30} stroke={PAL.red} strokeWidth={18} strokeLinecap="round" opacity={tope} style={glow(PAL.red, 10)} />
      )}
      <text x={x} y={y + r * 0.17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.5} fill="#fff" letterSpacing={2} style={glow(color, 8)}>
        {mm}:{ss}
      </text>
    </g>
  );
};

// Ficha antigua (papel envejecido) con un año grande y una línea de texto: "KOHNSTAMM · 1915"
export const FichaAntigua: React.FC<{ x: number; y: number; anio: string; texto: string; at: number; rot?: number; s?: number }> = ({ x, y, anio, texto, at, rot = -4, s = 1 }) => {
  const f = useCurrentFrame();
  const k = usePop(at, 11, 170);
  if (f < at) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + Math.sin(f / 30) * 1}) scale(${k * s})`}>
      <rect x={-330} y={-230} width={660} height={460} rx={18} fill="#000" opacity={0.35} transform="translate(14,22)" style={{ filter: "blur(10px)" }} />
      <rect x={-330} y={-230} width={660} height={460} rx={18} fill="#EAD9B4" stroke={INK} strokeWidth={8} />
      <rect x={-300} y={-200} width={600} height={400} rx={10} fill="none" stroke="#B89A66" strokeWidth={4} strokeDasharray="14 10" />
      <text x={0} y={40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={200} fill="#5A3E1E" letterSpacing={6}>
        {anio}
      </text>
      <text x={0} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill="#7A5A2E" letterSpacing={4}>
        {texto}
      </text>
      <circle cx={250} cy={-150} r={44} fill="none" stroke="#B23A3A" strokeWidth={8} opacity={0.6} />
    </g>
  );
};
