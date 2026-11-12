// Fondos y efectos animados con Paper Shaders (@paper-design/shaders-react 0.0.82, Apache 2.0; versión
// fijada porque las 0.0.x cambian sin avisar). Dan luz, textura y profundidad sin generador de imágenes.
//
// Deterministas: el tiempo del shader sale del frame de Remotion (prop `frame` en ms, `speed` 0), nunca del
// reloj, así que cada render sale igual. Cada fotograma espera (delayRender) a que el shader esté dibujado.
//
// Se importa aparte, no desde "../kit" (necesita la dependencia npm, que ya viene en package.json):
//   import { FondoGrano, Rayos } from "../kit/shaders";   (desde src/videos/<Componente>.tsx)
//
// Reglas (references/kit.md → shaders.tsx):
// - Como mucho 2 shaders a la vez en pantalla: cada uno abre un contexto WebGL y el render se alarga.
// - Van DEBAJO de los dibujos (fondo) o encima con opacidad baja y mixBlendMode (luz). Nunca tapan al sujeto.
// - Colores de PAL: el shader no inventa colores nuevos.
// - `t0` = frame absoluto del inicio de la escena (el mismo que useF): así el fondo no salta al cortar.
import React, { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GodRays,
  GrainGradient,
  MeshGradient,
  PulsingBorder,
  SmokeRing,
  Swirl,
  Waves,
  type GodRaysProps,
  type GrainGradientProps,
  type MeshGradientProps,
  type PulsingBorderProps,
  type SmokeRingProps,
  type SwirlProps,
  type WavesProps,
} from "@paper-design/shaders-react";

// Milisegundos de shader para el frame actual. vel 1 = tiempo real; 0,3 = lento (fondos); 0 = quieto.
export const useShaderMs = (t0 = 0, vel = 1) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return ((f + t0) / fps) * 1000 * vel;
};

// Retiene el fotograma hasta que el shader existe y ha pintado (dos requestAnimationFrame tras su efecto).
// Con React 18 los componentes de Paper no reenvían `ref`: se busca dentro del contenedor el div que lleva
// `paperShaderMount` (lo pone el motor al crear el contexto WebGL).
const useListo = (ref: React.RefObject<HTMLElement | null>, ms: number) => {
  const handle = useMemo(() => delayRender(`shader ${ms.toFixed(0)} ms`, { timeoutInMilliseconds: 20000 }), [ms]);
  useEffect(() => {
    let vivo = true;
    let raf = 0;
    const listo = () => {
      if (!vivo) return;
      const divs = Array.from(ref.current?.querySelectorAll("div") ?? []) as (HTMLElement & { paperShaderMount?: unknown })[];
      if (!divs.some((d) => d.paperShaderMount)) {
        raf = requestAnimationFrame(listo);
        return;
      }
      raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => vivo && continueRender(handle))));
    };
    listo();
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [handle, ref]);
};

type Capa = {
  t0?: number; // frame absoluto del inicio de la escena (useF)
  vel?: number; // velocidad de la animación (1 = tiempo real)
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"]; // "screen" para luz, "overlay"/"soft-light" para textura
  box?: { x: number; y: number; w: number; h: number }; // por defecto, todo el cuadro 1080×1920
};

// Envoltorio común: posición, tiempo determinista y espera al dibujo.
function Shader<P extends object>({ de: C, t0 = 0, vel = 1, opacity = 1, blend, box, props }: Capa & { de: React.ComponentType<P>; props: P }) {
  const ref = useRef<HTMLDivElement>(null);
  const ms = useShaderMs(t0, vel);
  useListo(ref, ms);
  const b = box ?? { x: 0, y: 0, w: 1080, h: 1920 };
  const Comp = C as unknown as React.ComponentType<P & { frame: number; speed: number; style: React.CSSProperties }>;
  return (
    <AbsoluteFill ref={ref} style={{ opacity, mixBlendMode: blend, pointerEvents: "none" }}>
      <Comp {...props} frame={ms} speed={0} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h }} />
    </AbsoluteFill>
  );
}

// ---------- Presets ----------
// Fondo con grano: degradado vivo con textura de película. Formas: "wave" | "dots" | "truchet" | "corners" |
// "ripple" | "blob" | "sphere". El fondo por defecto de un escenario sin dibujo detrás.
export const FondoGrano: React.FC<Capa & Omit<GrainGradientProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.35, opacity, blend, box, ...p }) => (
  <Shader de={GrainGradient} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#0A1030", colors: ["#1B2A6B", "#3FD9FF", "#FFC53D"], softness: 0.6, intensity: 0.35, noise: 0.3, shape: "blob", ...p }} />
);

// Degradado de malla: colores que se funden despacio. Para ganchos, títulos y portadas.
export const FondoMalla: React.FC<Capa & Omit<MeshGradientProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.3, opacity, blend, box, ...p }) => (
  <Shader de={MeshGradient} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colors: ["#0A1030", "#1B2A6B", "#3FD9FF", "#16182A"], distortion: 0.8, swirl: 0.3, grainOverlay: 0.15, ...p }} />
);

// Rayos de luz: la revelación, "se hace la luz". Encima con blend "screen" y opacidad 0,5–0,8.
export const Rayos: React.FC<Capa & Omit<GodRaysProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.5, opacity = 0.7, blend = "screen", box, ...p }) => (
  <Shader de={GodRays} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#00000000", colors: ["#FFC53D", "#FFF7DA"], colorBloom: "#FFC53D", intensity: 0.8, density: 0.4, bloom: 0.4, offsetY: -0.55, ...p }} />
);

// Borde que late: marca un móvil, una tarjeta o la CTA. Dale `box` con el rectángulo del objeto.
export const BordeLatido: React.FC<Capa & Omit<PulsingBorderProps, "frame" | "speed" | "style">> = ({ t0, vel = 1, opacity, blend = "screen", box, ...p }) => (
  <Shader de={PulsingBorder} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#00000000", colors: ["#3FD9FF", "#FFC53D"], roundness: 0.25, thickness: 0.12, softness: 0.6, intensity: 0.6, bloom: 0.3, spots: 4, ...p }} />
);

// Anillo de humo: misterio, "algo raro aquí". Detrás del sujeto del gancho.
export const Humo: React.FC<Capa & Omit<SmokeRingProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.6, opacity, blend = "screen", box, ...p }) => (
  <Shader de={SmokeRing} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#00000000", colors: ["#3FD9FF", "#1B2A6B"], radius: 0.4, thickness: 0.6, noiseScale: 3, ...p }} />
);

// Ondas: ritmo, sonido, agua, señal. Como fondo con opacidad baja.
export const Ondas: React.FC<Capa & Omit<WavesProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.5, opacity = 0.5, blend, box, ...p }) => (
  <Shader de={Waves} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#0A1030", colorFront: "#3FD9FF", ...p } as WavesProps} />
);

// Remolino: hipnosis, mareo, "te absorbe". Fondo de un plano subjetivo.
export const Remolino: React.FC<Capa & Omit<SwirlProps, "frame" | "speed" | "style">> = ({ t0, vel = 0.4, opacity, blend, box, ...p }) => (
  <Shader de={Swirl} t0={t0} vel={vel} opacity={opacity} blend={blend} box={box}
    props={{ colorBack: "#0A1030", colors: ["#1B2A6B", "#3FD9FF", "#FFC53D"], ...p } as SwirlProps} />
);

// Cualquier otro de Paper Shaders (Voronoi, NeuroNoise, Metaballs, DotGrid…), con el mismo tiempo y espera:
//   <ShaderLibre de={Voronoi} t0={t0} vel={0.4} props={{ colors: [...], ... }} />
export const ShaderLibre = Shader;
