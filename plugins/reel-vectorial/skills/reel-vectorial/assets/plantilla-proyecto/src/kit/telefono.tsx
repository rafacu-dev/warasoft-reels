// "Envíaselo a alguien" (kit vectorial): un móvil dibujado con HTML/CSS. En su pantalla se ve el propio reel
// (pasa la escena del gancho como `inner`), sube la hoja de compartir, el dedo pulsa "Enviar", el botón
// cambia a "✓ Enviado" y sale un avión de papel. Va encima de un fondo (Salon desenfocado, GlowBg…):
//   <Look><Svg><Salon blur={8} /></Svg><Movil t0={t0} tapAt={A(11, "alguien") + 2} inner={<Gancho t0={0} dur={60} />} /></Look>
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT, HANDLE, PAL } from "../brand";
import { clamp, easeOut, prog } from "./fx";
import { Mano } from "./personaje";

const Icono: React.FC<{ d: string; size: number; fill?: boolean }> = ({ d, size, fill }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ overflow: "visible", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
    <path d={d} fill={fill ? "#fff" : "none"} stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const CORAZON = "M0 9 C-9 3 -11 -3 -8 -7 C-5 -10 -1 -9 0 -6 C1 -9 5 -10 8 -7 C11 -3 9 3 0 9 Z";
const BURBUJA = "M-9 -7 Q-9 -9 -7 -9 L7 -9 Q9 -9 9 -7 L9 4 Q9 6 7 6 L-2 6 L-7 10 L-6 6 L-7 6 Q-9 6 -9 4 Z";
const AVION = "M-10 -1 L10 -9 L4 10 L0 2 Z M0 2 L10 -9";

export const Movil: React.FC<{
  t0: number; // frame absoluto en que empieza el plano (la prop t0 de la escena)
  tapAt: number; // frame ABSOLUTO del toque en "Enviar" (p. ej. A(11, "alguien") + 2)
  inner: React.ReactNode; // lo que se ve en la pantalla, a 1080×1920 (se reduce solo)
  x?: number; // centro del móvil (px de 1080×1920)
  y?: number;
  w?: number; // ancho del móvil
  rot?: number; // inclinación en grados
  dedo?: boolean; // mano que pulsa
  enviar?: string;
  enviado?: string;
  contactos?: string[]; // colores de los contactos de la hoja de compartir
}> = ({ t0, tapAt, inner, x = 540, y = 990, w = 480, rot = -4, dedo = true, enviar = "Enviar", enviado = "✓ Enviado", contactos = ["#FF8A5B", "#5BC0FF", "#9B7BFF", "#38D27E"] }) => {
  const F = useCurrentFrame() + t0;
  const tap = F - tapAt;
  const press = tap >= 0 && tap < 8 ? Math.sin((tap / 8) * Math.PI) : 0;
  const sheet = prog(F, tapAt - 16, tapAt - 6, easeOut); // sube la hoja de compartir
  const sent = prog(F, tapAt + 4, tapAt + 12, easeOut);
  const plane = tap >= 2 ? Math.min(1, (tap - 2) / 22) : 0;
  const h = w * 2.06;
  const bezel = w * 0.035;
  const sw = w - bezel * 2;
  const sh = h - bezel * 2;
  const r = w * 0.13;
  const u = sw / 100; // unidad: 1 % del ancho de la pantalla
  const sheetH = sh * 0.34;
  const btnH = 13 * u;
  const btnY = sh - 5 * u - btnH / 2; // centro del botón, en px de la pantalla
  // el dedo llega desde abajo, pulsa y se retira
  const finger = tap < -12 ? 1 : tap < 0 ? 1 - easeOut((tap + 12) / 12) : tap < 8 ? 0 : Math.min(1, (tap - 8) / 14);
  const fingerY = finger * 34 * u + press * 1.2 * u;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* resplandor de la pantalla sobre la escena */}
      <div style={{ position: "absolute", left: x - w / 2 - 80, top: y - h / 2 - 80, width: w + 160, height: h + 160, borderRadius: r + 80, boxShadow: "0 0 140px 40px rgba(140,170,255,0.16)" }} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg)` }}>
        {/* cuerpo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r,
            background: "linear-gradient(145deg, #3A4060 0%, #171A28 45%, #0B0D16 100%)",
            boxShadow: "0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 3px rgba(255,255,255,0.12), inset 6px 0 14px rgba(255,255,255,0.08)",
          }}
        />
        {/* pantalla */}
        <div style={{ position: "absolute", left: bezel, top: bezel, width: sw, height: sh, borderRadius: r - bezel, overflow: "hidden", background: "#000" }}>
          <div style={{ position: "absolute", left: 0, top: (sh - 1920 * (sw / 1080)) / 2, width: 1080, height: 1920, transform: `scale(${sw / 1080})`, transformOrigin: "0 0" }}>{inner}</div>
          {/* interfaz del reel: iconos a la derecha y la cuenta abajo */}
          <div style={{ position: "absolute", right: 3.5 * u, bottom: sheetH * 0.2 + 18 * u, display: "flex", flexDirection: "column", gap: 4.5 * u, alignItems: "center" }}>
            <Icono d={CORAZON} size={8 * u} />
            <Icono d={BURBUJA} size={8 * u} />
            <Icono d={AVION} size={8 * u} />
          </div>
          <div style={{ position: "absolute", left: 4.5 * u, bottom: sheetH * 0.2 + 20 * u, fontFamily: FONT, fontWeight: 800, fontSize: 4.6 * u, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{HANDLE}</div>
          {/* isla de la cámara */}
          <div style={{ position: "absolute", left: sw / 2 - 13 * u, top: 2.4 * u, width: 26 * u, height: 7 * u, borderRadius: 4 * u, background: "#000" }} />
          {/* hoja de compartir */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: sheetH,
              transform: `translateY(${(1 - sheet) * (sheetH + 20)}px)`,
              background: "rgba(24,26,38,0.97)",
              borderRadius: `${6 * u}px ${6 * u}px 0 0`,
              padding: `${4 * u}px ${4.5 * u}px`,
              boxSizing: "border-box",
              fontFamily: FONT,
              color: "#fff",
            }}
          >
            <div style={{ width: 12 * u, height: 1.2 * u, borderRadius: u, background: "rgba(255,255,255,0.35)", margin: `0 auto ${4 * u}px` }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 * u }}>
              {contactos.map((c, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.6 * u }}>
                  <div
                    style={{
                      width: 15 * u,
                      height: 15 * u,
                      borderRadius: 8 * u,
                      background: `radial-gradient(circle at 35% 30%, #ffffff88, ${c})`,
                      border: `${0.9 * u}px solid ${i === 0 && sent > 0 ? PAL.green : "transparent"}`,
                      transform: `scale(${i === 0 ? 1 + press * 0.08 : 1})`,
                    }}
                  />
                  <div style={{ width: 12 * u, height: 1.6 * u, borderRadius: u, background: "rgba(255,255,255,0.35)" }} />
                </div>
              ))}
            </div>
          </div>
          {/* botón (fuera de la hoja para poder animarlo con el dedo) */}
          <div
            style={{
              position: "absolute",
              left: 4.5 * u,
              right: 4.5 * u,
              top: btnY - btnH / 2,
              height: btnH,
              transform: `translateY(${(1 - sheet) * (sheetH + 20)}px) scale(${1 - press * 0.07})`,
              borderRadius: 3.5 * u,
              background: sent > 0.5 ? PAL.green : "#3E7BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontSize: 6.2 * u,
              fontWeight: 900,
              color: "#fff",
              boxShadow: `0 0 ${36 * press}px #7FB0FF`,
            }}
          >
            {sent > 0.5 ? enviado : enviar}
          </div>
        </div>
        {/* dedo que pulsa (gira con el móvil) */}
        {dedo && finger < 1 && (
          <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g transform={`translate(${bezel + sw * 0.62},${bezel + btnY + fingerY}) scale(${(w / 560) * 0.95})`}>
              <Mano rot={-10} />
            </g>
          </svg>
        )}
      </div>
      {/* avión de papel */}
      {plane > 0 && plane < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {(() => {
            const k = easeOut(plane);
            const px = interpolate(k, [0, 1], [x, 960], clamp);
            const py = interpolate(k, [0, 1], [y + h / 2 - sheetH * 0.4, 260], clamp) - Math.sin(k * Math.PI) * 120;
            const s = 1 + k * 0.6;
            return (
              <g transform={`translate(${px},${py}) rotate(${-28 + k * 10}) scale(${s})`} opacity={1 - Math.max(0, plane - 0.8) * 5}>
                <path d="M-60 10 L60 -40 L10 40 Z" fill="#fff" />
                <path d="M60 -40 L-10 20 L10 40 Z" fill="#C9D6FF" />
                <path d="M-60 10 L-10 20 L60 -40 Z" fill="#E9EEFF" />
              </g>
            );
          })()}
        </svg>
      )}
    </AbsoluteFill>
  );
};
