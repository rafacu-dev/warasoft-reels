// Cámara 2.5D sobre una imagen fija: un shader WebGL desplaza cada píxel según su profundidad
// (mapa de Depth Pro: blanco = cerca). Así lo cercano se mueve más que el fondo y el empuje de cámara
// tiene volumen de verdad, en lugar de un zoom plano.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

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

export const ParallaxImage: React.FC<{
  img: string; // ruta en public/, sin extensión: se cargan <img>.jpg y <img>_depth.png
  from: CamKey;
  to: CamKey;
  duration: number;
  center?: [number, number]; // punto hacia el que empuja la cámara (0–1)
  focus?: number; // profundidad que se queda quieta (0 = fondo, 1 = lo más cercano)
  ease?: (t: number) => number;
}> = ({ img, from, to, duration, center = [0.5, 0.5], focus = 0.5, ease = (t) => t }) => {
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
