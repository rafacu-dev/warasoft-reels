// Identidad de la cuenta: paleta, tipografía, firma y logo. Es lo ÚNICO que cambia de una cuenta a otra;
// el motor (src/engine) y la cámara (src/Parallax.tsx) son comunes. Ajusta C y Logo al estilo.md de la cuenta.
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONT = fontFamily;

// Firma de la cuenta (sello de la última frase y portada). montar-cuenta.py la rellena.
export const HANDLE = "@tu.cuenta";

// Formato de las cifras de los gráficos. "es-ES" no separa los miles de 4 cifras (1000); "es-MX" sí (1,000).
export const LOCALE = "es-ES";

// Paleta. El motor usa estos nombres de clave: no los cambies, cambia solo los colores.
//   night = fondo y texto sobre píldora · slate = secundario · warm = dato estrella / dinero (píldora dorada)
//   cyan = marca / salida (palabra clave por defecto) · red = pérdida / alerta · white = texto
export const C = {
  night: "#1E2433",
  slate: "#2E3A4F",
  warm: "#F2C46D",
  cyan: "#4FC3F7",
  red: "#E5484D",
  white: "#FFFFFF",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Palabra con sus tiempos (public/vo/<carpeta>/tiempos.json)
export type Palabra = { text: string; start: number; end: number };

// Logo provisional: un anillo con un punto. Sustitúyelo por el SVG de la cuenta (assets/logos/).
// `spin` lo usa el sello final para girarlo despacio.
export const Logo: React.FC<{ size?: number; spin?: number }> = ({ size = 260, spin = 0 }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <circle r={96} fill={C.night} stroke={C.slate} strokeWidth={4} />
    <g transform={`rotate(${spin})`}>
      <circle r={56} fill="none" stroke={C.cyan} strokeWidth={10} strokeDasharray="250 102" strokeLinecap="round" />
    </g>
    <circle r={20} fill={C.warm} />
  </svg>
);
