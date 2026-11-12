// Escenarios completos (kit vectorial). Un plano nunca es un icono sobre un fondo vacío: el sujeto vive en
// un sitio con luz, profundidad y cosas alrededor. Todos van dentro de <Svg> y miden 1080×1920.
//  · Salon: interior de noche o de tarde (dia) con ventana, estantería, lámpara y alfombra. Fondo del personaje.
//  · Ciudad: cielo nocturno con estrellas y edificios con ventanas encendidas (parallax con drift).
//  · Foco: anillos concéntricos con un haz de luz cenital (plató de "presentación").
//  · Para explicaciones, GlowBg (fx.tsx): fondo de neón con rejilla y motas.
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { C } from "../brand";
import { INK, useUid } from "./fx";

// Salón visto de frente (detrás del personaje): pared, ventana, estantería, cuadro, lámpara, suelo y alfombra.
// De noche (por defecto) hay luna y la lámpara encendida; con `dia`, cielo de tarde con sol y un haz de luz
// que entra por la ventana. warm = intensidad de la luz cálida; pared = degradado [arriba, abajo];
// cuadro = lo que se ve dentro del marco (por defecto, un paisaje); blur para los primeros planos.
export const Salon: React.FC<{ blur?: number; warm?: number; dia?: boolean; pared?: [string, string]; cuadro?: React.ReactNode }> = ({
  blur = 0,
  warm = 1,
  dia = false,
  pared = dia ? ["#3F6B92", "#7FA7C6"] : ["#13283F", "#2A4F75"],
  cuadro,
}) => {
  const f = useCurrentFrame();
  const id = useUid();
  const books = ["#E5484D", "#FFD23F", "#2F6BFF", "#38D27E", "#F28C38", "#9B5DE5", "#2F6BFF", "#E5484D"];
  return (
    <g style={blur ? { filter: `blur(${blur}px)` } : undefined}>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pared[0]} />
          <stop offset="1" stopColor={pared[1]} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="230" cy="420" r="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC27A" stopOpacity={0.5 * warm} />
          <stop offset="1" stopColor="#FFC27A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A3F25" />
          <stop offset="1" stopColor="#3E2414" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CC4EA" />
          <stop offset="1" stopColor="#D4F0FA" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#FFF1C4" stopOpacity={0.34} />
          <stop offset="1" stopColor="#FFF1C4" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}w)`} />
      {new Array(18).fill(0).map((_, i) => (
        <rect key={i} x={i * 62 + 10} y={0} width={24} height={1500} fill="#fff" opacity={0.025} />
      ))}
      {/* ventana a la izquierda */}
      <g transform="translate(60,360)">
        <rect x={0} y={0} width={300} height={420} rx={16} fill="#E9DDC6" stroke={INK} strokeWidth={6} />
        <rect x={18} y={18} width={264} height={384} rx={8} fill={dia ? `url(#${id}s)` : "#1B2D5C"} />
        {dia ? (
          <g>
            <circle cx={196} cy={112} r={70} fill="#FFE7A0" opacity={0.35 + 0.05 * Math.sin(f / 13)} style={{ filter: "blur(14px)" }} />
            <circle cx={196} cy={112} r={36} fill="#FFE7A0" />
            <ellipse cx={86} cy={250} rx={52} ry={18} fill="#fff" opacity={0.9} />
            <ellipse cx={120} cy={238} rx={34} ry={16} fill="#fff" opacity={0.9} />
          </g>
        ) : (
          <circle cx={200} cy={110} r={30} fill="#FFF1C2" />
        )}
        <rect x={142} y={18} width={10} height={384} fill="#E9DDC6" />
        <rect x={18} y={204} width={264} height={10} fill="#E9DDC6" />
      </g>
      {/* estantería a la derecha */}
      <g transform="translate(700,330)">
        <rect x={0} y={0} width={330} height={700} rx={10} fill="#5A3826" stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <rect x={14} y={20 + r * 170} width={302} height={150} fill="#3E2618" />
            {new Array(7).fill(0).map((_, k) => {
              const h = 90 + random(`bk${r}${k}`) * 50;
              return <rect key={k} x={24 + k * 40} y={20 + r * 170 + 150 - h} width={32} height={h} rx={4} fill={books[(k + r * 3) % books.length]} stroke={INK} strokeWidth={4} transform={k === 5 ? `rotate(12 ${24 + k * 40} ${170 + r * 170})` : undefined} />;
            })}
            <rect x={6} y={168 + r * 170} width={318} height={14} fill="#6E4630" stroke={INK} strokeWidth={4} />
          </g>
        ))}
      </g>
      {/* cuadro */}
      <g transform="translate(205,1060) rotate(-3)">
        <rect x={-110} y={-120} width={220} height={240} rx={10} fill="#4A2E1E" stroke={INK} strokeWidth={6} />
        <rect x={-90} y={-100} width={180} height={200} rx={4} fill="#F3E7D0" />
        {cuadro ?? (
          <g>
            <rect x={-90} y={-100} width={180} height={200} rx={4} fill="#9FD3E8" />
            <circle cx={40} cy={-50} r={22} fill="#FFE08A" />
            <polygon points="-90,100 -40,10 0,60 40,0 90,80 90,100" fill="#4F8A5B" />
            <polygon points="-40,10 -28,32 -52,32" fill="#fff" />
          </g>
        )}
      </g>
      {/* lámpara */}
      <g transform="translate(470,250)">
        <line x1={0} y1={-260} x2={0} y2={0} stroke="#2B2B35" strokeWidth={6} />
        <path d="M-90 80 L90 80 L56 0 L-56 0 Z" fill="#F8E7BC" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={0} cy={82} rx={86} ry={12} fill="#FFE9AE" />
        <circle cx={0} cy={110} r={150} fill="#FFD48A" opacity={dia ? 0.03 : 0.12 + 0.02 * Math.sin(f / 9)} />
      </g>
      <rect width={1080} height={1920} fill={`url(#${id}g)`} />
      {/* haz de sol que entra por la ventana (de tarde) */}
      {dia && <polygon points="78,378 342,378 900,1500 420,1500" fill={`url(#${id}h)`} style={{ mixBlendMode: "screen", filter: "blur(6px)" }} />}
      {/* suelo */}
      <rect y={1500} width={1080} height={420} fill={`url(#${id}f)`} />
      <rect y={1492} width={1080} height={20} fill="#EADCC4" />
      <ellipse cx={540} cy={1780} rx={640} ry={170} fill="#6E2C22" />
      <ellipse cx={540} cy={1780} rx={600} ry={150} fill="#A8742F" />
      <ellipse cx={540} cy={1780} rx={570} ry={136} fill="#8A3A2A" />
      <ellipse cx={540} cy={1780} rx={500} ry={112} fill="none" stroke="#C9973F" strokeWidth={8} strokeDasharray="4 22" strokeLinecap="round" />
      <ellipse cx={540} cy={1500} rx={800} ry={60} fill="#000" opacity={0.25} style={{ filter: "blur(20px)" }} />
      {dia && <polygon points="420,1500 900,1500 1080,1700 640,1700" fill="#FFE9B0" opacity={0.18} style={{ mixBlendMode: "screen", filter: "blur(10px)" }} />}
    </g>
  );
};

// Cielo nocturno con estrellas que titilan
export const Cielo: React.FC<{ top?: string; mid?: string; bottom?: string; stars?: number }> = ({ top = "#121726", mid = C.night, bottom = C.slate, stars = 70 }) => {
  const f = useCurrentFrame();
  const id = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id})`} />
      {new Array(stars).fill(0).map((_, i) => (
        <circle key={i} cx={random(`sx${i}`) * 1080} cy={random(`sy${i}`) * 1100} r={random(`sr${i}`) * 2 + 0.6} fill="#fff" opacity={0.25 + 0.5 * Math.abs(Math.sin(f / 25 + i))} />
      ))}
    </g>
  );
};

// Fila de edificios con ventanas encendidas. Varias filas con distinto drift = profundidad.
export const Edificios: React.FC<{ seed: string; y: number; height: number; color: string; drift?: number; ventanas?: string; luz?: number }> = ({
  seed,
  y,
  height,
  color,
  drift = 0,
  ventanas = C.warm,
  luz = 0.85,
}) => {
  const out: React.ReactNode[] = [];
  let x = -200;
  let i = 0;
  while (x < 1400) {
    const w = 70 + random(`${seed}w${i}`) * 110;
    const h = height * (0.35 + random(`${seed}h${i}`) * 0.65);
    const bx = x;
    const by = y + height - h;
    out.push(<rect key={`b${i}`} x={bx} y={by} width={w} height={h + 400} fill={color} />);
    for (let wy = by + 18; wy < y + height - 10; wy += 34) {
      for (let wx = bx + 12; wx < bx + w - 18; wx += 26) {
        const r = random(`${seed}${i}-${wx}-${wy}`);
        if (r > 0.62) out.push(<rect key={`w${i}-${wx}-${wy}`} x={wx} y={wy} width={12} height={16} fill={ventanas} opacity={luz * (0.4 + r * 0.6)} />);
      }
    }
    x += w + 6;
    i++;
  }
  return <g transform={`translate(${drift} 0)`}>{out}</g>;
};

// Ciudad de noche: cielo + tres filas de edificios. drift (px) desplaza las filas con profundidad.
export const Ciudad: React.FC<{ drift?: number; blur?: number }> = ({ drift = 0, blur = 0 }) => (
  <g style={blur ? { filter: `blur(${blur}px)` } : undefined}>
    <Cielo />
    <Edificios seed="lejos" y={900} height={520} color="#1E2536" drift={drift * 0.3} luz={0.5} />
    <Edificios seed="medio" y={1060} height={560} color="#252C3D" drift={drift * 0.6} />
    <Edificios seed="cerca" y={1300} height={640} color="#1A2030" drift={drift} />
  </g>
);

// Plató: anillos concéntricos en dos tonos y haz de luz cenital sobre el centro (y≈1250)
export const Foco: React.FC<{ a: string; b: string; luz?: boolean }> = ({ a, b, luz = true }) => {
  const f = useCurrentFrame();
  const id = useUid();
  return (
    <g>
      <rect width={1080} height={1920} fill={b} />
      {new Array(9).fill(0).map((_, i) => (
        <ellipse key={i} cx={540} cy={1250} rx={1400 - i * 150 + Math.sin(f / 20) * 6} ry={(1400 - i * 150) * 0.42} fill={i % 2 ? b : a} />
      ))}
      {luz && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFF6D8" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFF6D8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points="470,0 610,0 860,1300 220,1300" fill={`url(#${id})`} />
        </>
      )}
    </g>
  );
};
