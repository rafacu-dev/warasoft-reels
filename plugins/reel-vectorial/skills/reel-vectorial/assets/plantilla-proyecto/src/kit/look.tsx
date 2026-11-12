// Acabado de cine (kit vectorial): grano de película animado, viñeta y velo de color. Va encima de cada
// escena (debajo de los subtítulos). Sin grano ni viñeta, el vector plano parece una plantilla.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

// Grano: 6 texturas de ruido que se alternan cada frame (como el grano de una película)
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.11 }) => {
  const f = useCurrentFrame();
  const i = Math.abs(f) % 6;
  const dx = ((f * 37) % 40) - 20;
  const dy = ((f * 53) % 40) - 20;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
      <Img
        src={staticFile(`kit/grano-${i}.png`)}
        style={{ position: "absolute", left: -40 + dx, top: -40 + dy, width: 1160, height: 2000, imageRendering: "auto" }}
      />
    </AbsoluteFill>
  );
};

// Viñeta suave: lleva la mirada al centro y oscurece los bordes, como una lente real
export const Vignette: React.FC<{ strength?: number; cx?: number; cy?: number }> = ({ strength = 0.55, cx = 50, cy = 48 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at ${cx}% ${cy}%, rgba(0,0,0,0) 52%, rgba(4,6,14,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Velo de color (gradiente) para unificar la paleta de un plano
export const Tint: React.FC<{ top?: string; bottom?: string; opacity?: number; mode?: React.CSSProperties["mixBlendMode"] }> = ({
  top = "rgba(20,30,70,0.0)",
  bottom = "rgba(10,12,30,0.35)",
  opacity = 1,
  mode = "normal",
}) => <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top}, ${bottom})`, opacity, mixBlendMode: mode, pointerEvents: "none" }} />;
