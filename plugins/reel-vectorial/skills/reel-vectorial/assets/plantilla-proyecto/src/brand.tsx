// Identidad de @HANDLE para el kit vectorial (skill reel-vectorial). Este archivo es de la cuenta:
// tipografía, paleta del motor (C), colores con significado (PAL) que comparten gráficos y subtítulos (KEY),
// protagonista (PROTA), firma (HANDLE) y logo. Sale con una paleta neutra de ejemplo (noche azul, cian, oro,
// rojo y verde) y un protagonista provisional: cámbialos con estilo.md; lo marcado POR DEFINIR, con el usuario.
// Mantén los nombres de las claves (night, slate, warm, cyan, red, white; cyan/gold/red en KEY): el motor y el
// kit los usan. Puedes añadir más colores a PAL y KEY.
import React from "react";
import { loadFont } from "@remotion/google-fonts/Nunito";

const { fontFamily } = loadFont("normal", { weights: ["600", "800", "900"], subsets: ["latin"] });
export const FONT = fontFamily;

export const HANDLE = "@HANDLE";

// Paleta del motor: fondo (night), acento dorado de serie y cifras (warm), marca (cyan), alerta (red), texto (white).
export const C = {
  night: "#0E1020",
  slate: "#2E3A4F",
  warm: "#FFC53D",
  cyan: "#3FD9FF",
  red: "#FF4D5E",
  white: "#FFFFFF",
};

// Colores con significado para los gráficos (#RRGGBB). Cada video decide qué es cada uno ("la mano en cian,
// el pie en oro") y lo mantiene en escenas y subtítulos. *Core = centro brillante de estelas y trazos de luz.
export const PAL = {
  cyan: "#3FD9FF",
  cyanCore: "#E8FCFF",
  gold: "#FFC53D",
  goldCore: "#FFF7DA",
  red: "#FF4D5E",
  redCore: "#FFE1E4",
  green: "#38D27E",
  greenCore: "#E2FFEE",
  ink: "#16182A", // contorno de los dibujos
  navy: "#0A1030",
  cream: "#FFF4DE",
};

// Píldoras de los subtítulos: "palabra" (cian), "palabra:gold", "palabra:red". Mismos tonos que PAL.
export const KEY = { cyan: PAL.cyan, gold: PAL.gold, red: PAL.red, green: PAL.green }; // "palabra:green"; puedes añadir más

// Protagonista de la cuenta para Personaje y Mano (#RRGGBB). Provisional: POR DEFINIR con el usuario
// (una mascota propia, "tú" o ninguno; no copies el de otra cuenta).
export const PROTA = {
  head: "#F2C9A0",
  headShade: "#D9A67A",
  skin: "#F2C9A0",
  body: "#2F6BFF",
  bodyShade: "#1F4CC9",
  hair: "spiky" as "curl" | "spiky" | "none",
  hairColor: "#3A2A22",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Palabra = { text: string; start: number; end: number };

// Logo: POR DEFINIR (usa cuentas/<cuenta>/assets/logos/ si hay; si no, propón uno simple en SVG y enséñaselo al
// usuario). Mientras tanto, un círculo con la inicial del handle.
export const Logo: React.FC<{ size?: number; spin?: number }> = ({ size = 260, spin = 0 }) => (
  <svg width={size} height={size} viewBox="-120 -120 240 240">
    <g transform={`rotate(${Math.sin(spin / 40) * 6})`}>
      <circle r={104} fill={PAL.cyan} stroke={PAL.ink} strokeWidth={12} />
      <text y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={140} fill={PAL.ink}>
        {HANDLE.replace("@", "").charAt(0).toUpperCase()}
      </text>
    </g>
  </svg>
);
