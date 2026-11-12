// Portada de un reel vectorial: un fotograma de la escena del gancho (el momento más raro, ya resuelto),
// la etiqueta de serie, el título y la firma. Todo queda dentro del recorte 4:5 de la cuadrícula del
// perfil (y = 285–1635). En el video se exporta como Portada<Componente> y se registra con `registrar`.
//   export const PortadaPie04: React.FC = () => (
//     <PortadaEscena serie="MI SERIE · #4" titulo={["¿Por qué tu *pie*", "gira al revés?"]}>
//       <Gancho t0={MOMENTO} dur={60} />
//     </PortadaEscena>
//   );
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, HANDLE, KEY, Logo } from "../brand";
import { Grain, Vignette } from "./look";

export const PortadaEscena: React.FC<{
  children: React.ReactNode; // la escena congelada (pasa un t0 en el que ya se vea lo raro)
  serie: string; // "MI SERIE · #4"
  titulo: string[]; // 2–4 líneas de ≤ 18 caracteres; *palabra* sale en píldora (una por portada)
  align?: "top" | "bottom"; // dónde va el título: arriba (por defecto) o abajo si el sujeto está arriba
  zoom?: number; // acercamiento de la escena
  dy?: number; // desplazamiento vertical de la escena (px)
  pill?: string; // color de la píldora (por defecto, el dorado de las claves)
  firma?: boolean; // false = sin logo ni handle abajo (cuentas que no firman)
}> = ({ children, serie, titulo, align = "top", zoom = 1.06, dy = 40, pill = KEY.gold, firma = true }) => {
  const top = align === "top";
  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateY(${dy}px) scale(${zoom})` }}>{children}</AbsoluteFill>
      <Vignette strength={0.45} />
      <AbsoluteFill
        style={{
          background: top
            ? "linear-gradient(180deg, rgba(8,8,14,0.9) 14%, rgba(8,8,14,0) 38%)"
            : "linear-gradient(0deg, rgba(8,8,14,0.9) 20%, rgba(8,8,14,0) 46%)",
        }}
      />
      <div style={{ position: "absolute", ...(top ? { top: 318 } : { bottom: 520 }), left: 50, right: 50, textAlign: "center", fontFamily: FONT }}>
        <div
          style={{
            display: "inline-block",
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 3,
            color: C.warm,
            border: `3px solid ${C.warm}`,
            background: "rgba(10,13,24,0.7)",
            padding: "8px 24px",
            borderRadius: 40,
            marginBottom: 18,
          }}
        >
          {serie}
        </div>
        {titulo.map((line, i) => (
          <div key={i} style={{ fontSize: 100, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, color: C.white }}>
            {line
              .split(/(\*[^*]+\*)/g)
              .filter(Boolean)
              .map((part, k) =>
                part.startsWith("*") ? (
                  <span key={k} style={{ background: pill, color: C.night, padding: "0 18px", borderRadius: 16, margin: "0 6px" }}>
                    {part.slice(1, -1)}
                  </span>
                ) : (
                  <span key={k} style={{ WebkitTextStroke: "12px rgba(8,10,18,0.9)", paintOrder: "stroke fill" }}>
                    {part}
                  </span>
                ),
              )}
          </div>
        ))}
      </div>
      {firma && (
        <div style={{ position: "absolute", top: 1540, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontFamily: FONT }}>
          <Logo size={64} />
          <span style={{ fontWeight: 800, fontSize: 38, color: C.white, textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>{HANDLE}</span>
        </div>
      )}
      <Grain />
    </AbsoluteFill>
  );
};
