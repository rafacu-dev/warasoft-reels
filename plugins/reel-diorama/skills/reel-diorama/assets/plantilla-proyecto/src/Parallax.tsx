// Cámara 2.5D sobre una imagen fija: un shader WebGL desplaza cada píxel según su profundidad
// (mapa de Depth Pro: blanco = cerca). Así lo cercano se mueve más que el fondo y el empuje de cámara
// tiene volumen de verdad, en lugar de un zoom plano.
// Si el plano aún no existe en public/ (no se han generado las imágenes), dibuja un plano provisional con el
// mismo movimiento de cámara, para poder montar y revisar el video desde el primer minuto.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./brand";
import { existe } from "./engine/archivos";

export type CamKey = {
  zoom: number; // 1 = encuadre completo
  x: number; // desplazamiento lateral de cámara (fracción, ±0.04 es mucho)
  y: number; // desplazamiento vertical de cámara
  dolly: number; // empuje con perspectiva: lo cercano crece más (0 = nada, 0.25 = fuerte)
};

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D tex;
uniform sampler2D depthMap;
uniform vec2 center;
uniform vec2 cam;
uniform float zoom;
uniform float dolly;
uniform float focus;
varying vec2 vUv;
void main() {
  vec2 uv = (vUv - center) / zoom + center;
  vec2 o = uv;
  // búsqueda iterativa: la profundidad se lee en la posición ya desplazada para evitar bordes dobles
  for (int i = 0; i < 6; i++) {
    float d = texture2D(depthMap, clamp(o, 0.0, 1.0)).r - focus;
    o = center + (uv - center) * (1.0 - dolly * d) - cam * d;
  }
  gl_FragColor = texture2D(tex, clamp(o, 0.001, 0.999));
}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

type Props = {
  img: string; // ruta en public/, sin extensión: se cargan <img>.jpg y <img>_depth.png
  from: CamKey;
  to: CamKey;
  duration: number;
  center?: [number, number]; // punto hacia el que empuja la cámara (0–1)
  focus?: number; // profundidad que se queda quieta (0 = fondo, 1 = lo más cercano)
  ease?: (t: number) => number;
};

export const ParallaxImage: React.FC<Props> = (props) =>
  existe(`${props.img}.jpg`) && existe(`${props.img}_depth.png`) ? <ParallaxGL {...props} /> : <PlanoPendiente {...props} />;

const ParallaxGL: React.FC<Props> = ({ img, from, to, duration, center = [0.5, 0.5], focus = 0.5, ease = (t) => t }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{ ctx: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  const [ready] = useState(() => delayRender(`parallax ${img}`));

  // Carga de texturas y programa (una vez)
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(staticFile(`${img}.jpg`)), loadImage(staticFile(`${img}_depth.png`))]).then(([color, depth]) => {
      if (cancelled || !canvas.current) return;
      const ctx = canvas.current.getContext("webgl", { preserveDrawingBuffer: true, antialias: true })!;
      const sh = (type: number, src: string) => {
        const s = ctx.createShader(type)!;
        ctx.shaderSource(s, src);
        ctx.compileShader(s);
        if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(s) ?? "shader");
        return s;
      };
      const prog = ctx.createProgram()!;
      ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VERT));
      ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, FRAG));
      ctx.linkProgram(prog);
      ctx.useProgram(prog);
      const buf = ctx.createBuffer();
      ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
      ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
      const loc = ctx.getAttribLocation(prog, "p");
      ctx.enableVertexAttribArray(loc);
      ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
      [color, depth].forEach((im, unit) => {
        const t = ctx.createTexture();
        ctx.activeTexture(ctx.TEXTURE0 + unit);
        ctx.bindTexture(ctx.TEXTURE_2D, t);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, im);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      });
      ctx.uniform1i(ctx.getUniformLocation(prog, "tex"), 0);
      ctx.uniform1i(ctx.getUniformLocation(prog, "depthMap"), 1);
      gl.current = { ctx, prog };
      draw.current();
      continueRender(ready);
    });
    return () => {
      cancelled = true;
      // libera el contexto: el navegador solo admite ~16 contextos WebGL vivos
      gl.current?.ctx.getExtension("WEBGL_lose_context")?.loseContext();
      gl.current = null;
    };
  }, [img, ready]);

  // Dibujo del frame actual; se llama al terminar la carga y en cada frame (antes de la captura)
  const draw = useRef<() => void>(() => {});
  draw.current = () => {
    if (!gl.current) return;
    const { ctx, prog } = gl.current;
    const t = ease(Math.min(1, Math.max(0, frame / duration)));
    const lerp = (a: number, b: number) => a + (b - a) * t;
    ctx.viewport(0, 0, width, height);
    ctx.uniform2f(ctx.getUniformLocation(prog, "center"), center[0], center[1]);
    ctx.uniform2f(ctx.getUniformLocation(prog, "cam"), lerp(from.x, to.x), lerp(from.y, to.y));
    ctx.uniform1f(ctx.getUniformLocation(prog, "zoom"), lerp(from.zoom, to.zoom));
    ctx.uniform1f(ctx.getUniformLocation(prog, "dolly"), lerp(from.dolly, to.dolly));
    ctx.uniform1f(ctx.getUniformLocation(prog, "focus"), focus);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
  };
  useLayoutEffect(() => draw.current());

  return <canvas ref={canvas} width={width} height={height} style={{ width: "100%", height: "100%" }} />;
};

// Plano provisional: una maqueta nocturna dibujada en SVG (distinta para cada plano) con el mismo movimiento
// de cámara. Solo para montar y revisar; nunca se entrega.
const PlanoPendiente: React.FC<Props> = ({ img, from, to, duration, center = [0.5, 0.5], ease = (t) => t }) => {
  const frame = useCurrentFrame();
  const t = ease(Math.min(1, Math.max(0, frame / duration)));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const zoom = lerp(from.zoom, to.zoom) * (1 + lerp(from.dolly, to.dolly) * 0.25);
  const dx = -lerp(from.x, to.x) * 1080 * 1.5;
  const dy = -lerp(from.y, to.y) * 1920 * 1.5;
  const nombre = img.split("/").pop() ?? img;
  const r = (k: string) => random(`${img}-${k}`);
  const bloques = new Array(9).fill(0).map((_, i) => {
    const w = 120 + r(`w${i}`) * 170;
    const h = 260 + r(`h${i}`) * 620;
    const x = 40 + r(`x${i}`) * (1000 - w);
    return { x, w, h, i };
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #0D1220 0%, ${C.night} 50%, ${C.slate} 100%)`, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${zoom})`, transformOrigin: `${center[0] * 100}% ${center[1] * 100}%` }}>
        <svg width={1080} height={1920}>
          <ellipse cx={540} cy={1500} rx={620} ry={160} fill={C.slate} opacity={0.9} />
          {bloques.map((b) => (
            <g key={b.i}>
              <rect x={b.x} y={1500 - b.h} width={b.w} height={b.h} rx={10} fill={b.i % 2 ? "#252C3D" : "#1A2030"} />
              {new Array(Math.floor(b.h / 70)).fill(0).map((_, k) =>
                r(`v${b.i}-${k}`) > 0.45 ? (
                  <rect key={k} x={b.x + 18} y={1500 - b.h + 30 + k * 70} width={b.w - 36} height={22} rx={4} fill={C.warm} opacity={0.35 + r(`o${b.i}-${k}`) * 0.5} />
                ) : null,
              )}
            </g>
          ))}
          <circle cx={540} cy={1180} r={150} fill={C.warm} opacity={0.12} />
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 560, width: "100%", textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "rgba(255,255,255,0.55)" }}>
        PLANO {nombre.toUpperCase()} · PENDIENTE
      </div>
    </AbsoluteFill>
  );
};
