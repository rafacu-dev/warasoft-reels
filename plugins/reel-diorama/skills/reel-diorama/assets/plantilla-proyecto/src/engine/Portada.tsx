// Portada del reel (imagen fija 1080×1920). El título queda dentro del recorte 4:5 que muestra la cuadrícula
// del perfil (franja central y = 285–1635), para que el feed se vea como una colección uniforme.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, HANDLE, Logo } from "../brand";
import { existe } from "./archivos";

export type PortadaProps = {
  img: string; // ruta en public/ sin extensión (se usa el .jpg)
  series: string;
  // líneas del título; *palabra* va en píldora dorada
  title: string[];
  align?: "top" | "bottom"; // dónde va el bloque de título dentro de la franja 4:5
};

export const Portada: React.FC<PortadaProps> = ({ img, series, title, align = "bottom" }) => (
  <AbsoluteFill style={{ background: C.night }}>
    {existe(`${img}.jpg`) ? (
      <Img src={staticFile(`${img}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.06) saturate(1.08)" }} />
    ) : (
      // el plano aún no está exportado: fondo provisional para poder revisar el título
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${C.slate} 0%, ${C.night} 70%)` }} />
    )}
    <AbsoluteFill
      style={{
        background:
          align === "bottom"
            ? "linear-gradient(180deg, rgba(10,13,24,0) 35%, rgba(10,13,24,0.88) 78%)"
            : "linear-gradient(0deg, rgba(10,13,24,0) 40%, rgba(10,13,24,0.88) 80%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        ...(align === "bottom" ? { bottom: 1920 - 1600 } : { top: 330 }),
        fontFamily: FONT,
        textAlign: "center",
      }}
    >
      <div style={{ display: "inline-block", fontWeight: 800, fontSize: 36, letterSpacing: 3, color: C.warm, border: `3px solid ${C.warm}`, background: "rgba(10,13,24,0.7)", padding: "10px 26px", borderRadius: 40, marginBottom: 26 }}>
        {series}
      </div>
      {title.map((line, i) => (
        <div key={i} style={{ fontSize: 100, fontWeight: 800, lineHeight: 1.12, letterSpacing: -2, color: C.white }}>
          {line.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, k) =>
            part.startsWith("*") ? (
              <span key={k} style={{ background: C.warm, color: C.night, padding: "0 18px", borderRadius: 16, margin: "0 6px" }}>
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
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
        <Logo size={64} />
        <span style={{ fontWeight: 800, fontSize: 38, color: C.white }}>{HANDLE}</span>
      </div>
    </div>
  </AbsoluteFill>
);
