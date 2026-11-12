// Motor de reels "diorama nocturno". Cada video es solo una configuración (src/videos/<Componente>.tsx):
// voz + tiempos por palabra, planos cortados a la palabra, capa de motion graphics, efectos y música.
//  · subtítulos grandes con contorno, palabra a palabra, palabra clave en píldora de color
//  · subtítulo arriba o abajo según el plano (nunca tapa al protagonista)
//  · ningún plano pasa de `maxShot` frames (el render falla si alguno se pasa)
//  · transiciones con energía (barrido, golpe de zoom, destello) y cámara con arranque rápido; sin efectos de aire
//  · partículas dentro del plano (polvo, chispas, monedas, lluvia, vapor) para que la imagen no esté quieta
//  · gráficos animados: cifras que cuentan, barras comparativas, rejilla de puntos, anillo de señalización
//  · etiqueta de serie en el gancho y sello de marca en la llamada a la acción
// Lo que aún no existe en public/ (planos, voz, música, efectos) no rompe el video: se ve un plano provisional
// y no suena. La cola se niega a renderizar una entrega con planos o voz pendientes.
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, clamp, FONT, HANDLE, LOCALE, Logo, Palabra } from "../brand";
import { existe } from "./archivos";
import { CamKey, ParallaxImage } from "../Parallax";

export const FPS = 30;
const GAP = 2; // frames entre frases

export type Tiempo = { linea: number; texto: string; duracion: number; palabras: Palabra[] };
// Punto de corte: frame absoluto, o [frase, palabra?, aparición?, desfase en frames?]
export type Cut = number | [number, string?, number?, number?];

export const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zñ0-9]/g, "");

export const timeline = (tiempos: Tiempo[]) => {
  const VO = tiempos.map((t) => Math.ceil(t.duracion * FPS) + 1);
  const START: number[] = [];
  let acc = 0;
  VO.forEach((d, i) => {
    START[i] = acc;
    acc += d + GAP;
  });
  const total = START[START.length - 1] + VO[VO.length - 1] + 8;
  const at = (c: Cut): number => {
    if (typeof c === "number") return c;
    const [n, word, occ = 1, off = 0] = c;
    if (!word) return START[n - 1] + off;
    let seen = 0;
    const w = tiempos[n - 1].palabras.find((p) => norm(p.text) === norm(word) && ++seen === occ);
    if (!w) throw new Error(`"${word}" no está en la frase ${n}: ${tiempos[n - 1].texto}`);
    return START[n - 1] + Math.round(w.start * FPS) + off;
  };
  return { VO, START, total, at, tiempos };
};
export type Timeline = ReturnType<typeof timeline>;

// ---------- Movimientos de cámara ----------
export const MOVE = {
  push: (d = 1): [CamKey, CamKey] => [
    { zoom: 1.04, x: 0.012 * d, y: 0, dolly: 0 },
    { zoom: 1.14, x: -0.012 * d, y: -0.006, dolly: 0.18 },
  ],
  drift: (d = 1): [CamKey, CamKey] => [
    { zoom: 1.08, x: 0.028 * d, y: 0.004, dolly: 0.05 },
    { zoom: 1.11, x: -0.028 * d, y: -0.004, dolly: 0.1 },
  ],
  pull: (from = 1.8): [CamKey, CamKey] => [
    { zoom: from, x: 0, y: 0, dolly: 0.2 },
    { zoom: 1.02, x: 0, y: 0, dolly: 0 },
  ],
  rise: (d = 1): [CamKey, CamKey] => [
    { zoom: 1.1, x: 0, y: -0.03 * d, dolly: 0.04 },
    { zoom: 1.13, x: 0, y: 0.03 * d, dolly: 0.12 },
  ],
  punch: (z = 1.4): [CamKey, CamKey] => [
    { zoom: z, x: 0, y: 0, dolly: 0.05 },
    { zoom: z + 0.12, x: -0.01, y: 0, dolly: 0.14 },
  ],
};

export type Fx = "dust" | "sparks" | "coins" | "rain" | "steam" | "none";
export type Trans = "cut" | "whip" | "zoom" | "fade" | "flash";

export type ShotDef = {
  img: string;
  at: Cut;
  move: [CamKey, CamKey];
  center?: [number, number];
  focus?: number;
  ease?: (t: number) => number;
  trans?: Trans;
  fx?: Fx;
  cap?: "top" | "bottom"; // dónde van los subtítulos mientras se ve este plano
  long?: boolean; // permite pasar de maxShot (solo si el plano tiene animación propia encima)
};

export type OverlayDef =
  | { kind: "number"; at: Cut; dur: number; value: number; from?: number; grouping?: boolean; decimals?: number; prefix?: string; suffix?: string; label?: string; color?: string; y?: number; size?: number }
  | { kind: "bars"; at: Cut; dur: number; title?: string; bars: { label: string; value: number; text: string; color: string }[]; y?: number }
  | { kind: "dots"; at: Cut; dur: number; total: number; on: number; colorOn: string; colorOff: string; label?: string; y?: number }
  | { kind: "ring"; at: Cut; dur: number; x: number; y: number; r: number; color?: string }
  | { kind: "flash"; at: Cut; color: string; peak?: number; len?: number }
  | { kind: "shade"; at: Cut; dur: number; side: "top" | "bottom" }
  // columnas que crecen una tras otra (delay en frames desde el inicio del gráfico)
  | { kind: "race"; at: Cut; dur: number; title?: string; suffix?: string; y?: number; cols: { label: string; value: number; color: string; delay: number; note?: string }[] }
  // números o etiquetas que aparecen sobre puntos de la imagen
  | { kind: "badges"; at: Cut; dur: number; items: { x: number; y: number; text: string; color: string; delay: number }[] }
  // gráfico de líneas que se dibuja de izquierda a derecha
  | { kind: "lines"; at: Cut; dur: number; title?: string; y?: number; xLabels: [string, string]; series: { label: string; color: string; values: number[]; delay?: number }[] };

export type ReelConfig = {
  imgDir: string; // carpeta en public/ con <img>.jpg y <img>_depth.png
  voDir: string; // carpeta en public/ con N.mp3
  keys: string[][]; // por frase: "palabra" (cian), "palabra:gold", "palabra:red"
  merges?: [string, string][]; // ["noventa y cinco", "95"]: varias palabras se muestran como una
  display?: Record<string, string>; // palabra → como se escribe ("cien" → "100")
  shots: ShotDef[];
  overlays?: OverlayDef[];
  sfx: [string, Cut, number][];
  music?: { src: string; high: number; low: number }; // pista en public/ (p. ej. "music/pista.mp3"); sin ella no suena
  // Respiro antes de la revelación: la música cae casi a cero durante N frames (15 por defecto) y vuelve en la
  // palabra indicada, para que el golpe pese más. 1–2 por video. Ej.: respiros: [[[9, "trampa"], 18]]
  respiros?: [Cut, number?][];
  series: string; // "QUIÉN GANA DE VERDAD · #1"
  maxShot?: number; // frames
};

// ---------- Subtítulos v2 ----------
const KEY_COLOR: Record<string, string> = { cyan: C.cyan, gold: C.warm, red: C.red };
// Palabras que no dicen nada al final del primer bloque del gancho: si el bloque acaba en una, se alarga.
const DEBILES = new Set("tu tus te la las el los lo le les mi mis su sus un una unos unas de del que y en a al se me nos".split(" "));
const DISPLAY: Record<string, string> = { cuarenta: "40", veinte: "20", ocho: "8", diez: "10", cien: "100", seis: "6" };

const mergeWords = (ps: Palabra[], merges: [string, string][]) => {
  const out: Palabra[] = [];
  for (let i = 0; i < ps.length; i++) {
    const m = merges.find(([phrase]) => {
      const ws = phrase.split(" ");
      return ws.every((w, k) => ps[i + k] && norm(ps[i + k].text) === norm(w));
    });
    if (m) {
      const n = m[0].split(" ").length;
      const last = ps[i + n - 1];
      const punct = last.text.match(/[.,:;?!…]+$/)?.[0] ?? "";
      out.push({ text: m[1] + punct, start: ps[i].start, end: last.end, merged: true } as Palabra & { merged: boolean });
      i += n - 1;
    } else out.push(ps[i]);
  }
  return out;
};

const Captions: React.FC<{
  palabras: Palabra[];
  keys: string[];
  display: Record<string, string>;
  lineStart: number;
  posAt: (absFrame: number) => "top" | "bottom";
  hook?: boolean;
}> = ({ palabras, keys, display, lineStart, posAt, hook }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: Palabra[][] = [];
  let cur: Palabra[] = [];
  for (const p of palabras) {
    cur.push(p);
    // primer bloque del gancho: si acaba en palabra vacía («¿Por qué tu»), sigue hasta la palabra con sentido («…tu nómina»)
    const sigue = hook && chunks.length === 0 && cur.length < 5 && DEBILES.has(norm(p.text));
    if ((cur.length >= 3 && !sigue) || /[.,?!:…]$/.test(p.text)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  let idx = 0;
  chunks.forEach((c, i) => {
    if (t >= c[0].start - 0.03) idx = i;
  });
  const chunk = chunks[idx];
  const pos = posAt(lineStart + Math.round(chunk[0].start * FPS));
  const keyMap = new Map(
    keys.map((k) => {
      const [w, col = "cyan"] = k.split(":");
      return [norm(w), KEY_COLOR[col]] as const;
    }),
  );
  const size = hook ? 104 : 84;
  return (
    <div
      style={{
        position: "absolute",
        top: pos === "top" ? 300 : 1190,
        width: "100%",
        padding: "0 70px",
        boxSizing: "border-box",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.18,
        letterSpacing: -1,
        color: C.white,
      }}
    >
      {chunk.map((p, i) => {
        const n = norm(p.text);
        const shown = display[n] ? p.text.replace(/[A-Za-zÁÉÍÓÚáéíóúñÑ]+/, display[n]) : p.text;
        const local = t - p.start;
        // el primer bloque del gancho está entero desde el frame 0 (portada); el resto aparece palabra a palabra
        const always = hook && idx === 0;
        // mismo adelanto que al elegir el bloque (−0,03 s): si no, el bloque nuevo sale vacío un fotograma
        const visible = always || local >= -0.035;
        const pop = always ? 1 : interpolate(local, [0, 0.07, 0.2], [0.86, 1.05, 1], clamp);
        const col = keyMap.get(n) ?? ((p as Palabra & { merged?: boolean }).merged ? C.warm : undefined);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "4px 17px",
              opacity: visible ? 1 : 0,
              transform: `scale(${visible ? pop : 0.8})`,
              ...(col
                ? { background: col, color: C.night, padding: "0 16px", borderRadius: 14, boxShadow: "0 8px 26px rgba(0,0,0,0.45)" }
                : { WebkitTextStroke: "10px rgba(8,10,18,0.9)", paintOrder: "stroke fill", textShadow: "0 8px 26px rgba(0,0,0,0.6)" }),
            }}
          >
            {shown}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Partículas dentro del plano ----------
const Particles: React.FC<{ fx: Fx }> = ({ fx }) => {
  const frame = useCurrentFrame();
  if (fx === "none") return null;
  const items: React.ReactNode[] = [];
  if (fx === "dust") {
    for (let i = 0; i < 36; i++) {
      const d = 0.4 + random(`d${i}`) * 0.9;
      const x = (random(`x${i}`) * 1080 + Math.sin(frame / 40 + i) * 18 * d + 1080) % 1080;
      const y = (random(`y${i}`) * 1920 + frame * 1.1 * d) % 1920;
      const o = 0.15 + 0.45 * Math.abs(Math.sin(frame / 30 + i * 1.7));
      items.push(<circle key={i} cx={x} cy={y} r={1.4 + d * 2.4} fill={C.warm} opacity={o * d} />);
    }
  }
  if (fx === "sparks") {
    for (let i = 0; i < 40; i++) {
      const d = 0.5 + random(`sd${i}`) * 0.8;
      const life = 60 + random(`sl${i}`) * 50;
      const ph = ((frame + random(`sp${i}`) * life) % life) / life;
      const x = random(`sx${i}`) * 1080 + Math.sin(ph * 6 + i) * 30;
      const y = 1920 - ph * 1500 * d - random(`sy${i}`) * 300;
      items.push(<circle key={i} cx={x} cy={y} r={1.5 + d * 2.5} fill="#FFD98A" opacity={(1 - ph) * 0.9 * d} />);
    }
  }
  if (fx === "coins") {
    for (let i = 0; i < 22; i++) {
      const d = 0.5 + random(`cd${i}`) * 0.9;
      const life = 50 + random(`cl${i}`) * 40;
      const ph = ((frame + random(`cp${i}`) * life) % life) / life;
      const x = 60 + random(`cx${i}`) * 960;
      const y = -80 + ph * 2100;
      const spin = Math.abs(Math.cos(frame / (6 + i % 5) + i));
      items.push(
        <g key={i} transform={`translate(${x},${y}) scale(${d})`} opacity={0.85}>
          <ellipse rx={22 * Math.max(0.15, spin)} ry={22} fill="#E8B550" stroke="#A8792A" strokeWidth={3} />
          <ellipse rx={10 * Math.max(0.1, spin)} ry={10} fill="#F6D58A" opacity={0.7} />
        </g>,
      );
    }
  }
  if (fx === "rain") {
    for (let i = 0; i < 70; i++) {
      const d = 0.5 + random(`rd${i}`) * 0.8;
      const x = (random(`rx${i}`) * 1180 - frame * 4 * d + 2000) % 1180;
      const y = (random(`ry${i}`) * 1920 + frame * 46 * d) % 2000 - 80;
      items.push(<line key={i} x1={x} y1={y} x2={x - 8 * d} y2={y + 60 * d} stroke="#BFD8FF" strokeWidth={2 * d} opacity={0.28 * d} />);
    }
  }
  if (fx === "steam") {
    for (let i = 0; i < 9; i++) {
      const life = 90 + random(`vl${i}`) * 60;
      const ph = ((frame + random(`vp${i}`) * life) % life) / life;
      const x = 300 + random(`vx${i}`) * 480 + Math.sin(ph * 4 + i) * 40;
      const y = 1300 - ph * 900;
      items.push(<circle key={i} cx={x} cy={y} r={80 + ph * 160} fill="#fff" opacity={Math.sin(ph * Math.PI) * 0.08} />);
    }
  }
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <defs>
          <filter id="soft">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <g filter={fx === "steam" ? "url(#soft)" : undefined}>{items}</g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Plano ----------
const DEFAULT_EASE = Easing.bezier(0.22, 0.62, 0.32, 1); // arranque rápido, aterrizaje suave

const ShotLayer: React.FC<{ s: ShotDef; dur: number; imgDir: string }> = ({ s, dur, imgDir }) => {
  const frame = useCurrentFrame();
  const tr = s.trans ?? "cut";
  let style: React.CSSProperties = {};
  if (tr === "fade") style = { opacity: interpolate(frame, [0, 8], [0, 1], clamp) };
  if (tr === "whip") {
    const k = interpolate(frame, [0, 6], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    style = { transform: `translateY(${-k * 260}px) scale(${1 + k * 0.08})`, filter: `blur(${k * 26}px) brightness(${1 + k * 0.4})` };
  }
  if (tr === "zoom") {
    const k = interpolate(frame, [0, 7], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    style = { transform: `scale(${1 + k * 0.3})`, filter: `blur(${k * 16}px)` };
  }
  return (
    <AbsoluteFill style={style}>
      <ParallaxImage
        img={`${imgDir}/${s.img}`}
        from={s.move[0]}
        to={s.move[1]}
        duration={dur}
        center={s.center}
        focus={s.focus}
        ease={s.ease ?? DEFAULT_EASE}
      />
      <Particles fx={s.fx ?? "dust"} />
      {tr === "flash" && <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [0, 2, 10], [0.55, 0.4, 0], clamp) }} />}
    </AbsoluteFill>
  );
};

// ---------- Gráficos ----------
const fmt = (v: number, decimals = 0, grouping = true) =>
  v.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping });

const Panel: React.FC<{ dur: number; y: number; children: React.ReactNode }> = ({ dur, y, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: out, transform: `scale(${0.7 + inS * 0.3})` }}>
      {children}
    </div>
  );
};

const BigNumber: React.FC<Extract<OverlayDef, { kind: "number" }>> = ({ dur, value, from = 0, grouping = true, decimals, prefix = "", suffix = "", label, color = C.warm, y = 760, size = 180 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Panel dur={dur} y={y}>
      <div style={{ textAlign: "center", fontFamily: FONT }}>
        <div style={{ fontSize: size, fontWeight: 800, color, letterSpacing: -4, WebkitTextStroke: "12px rgba(8,10,18,0.85)", paintOrder: "stroke fill", textShadow: `0 0 60px ${color}66` }}>
          {prefix}
          {fmt(from + (value - from) * t, decimals, grouping)}
          {suffix}
        </div>
        {label && (
          <div style={{ marginTop: 6, display: "inline-block", fontSize: 46, fontWeight: 700, color: C.white, background: "rgba(10,13,24,0.78)", padding: "8px 22px", borderRadius: 14 }}>{label}</div>
        )}
      </div>
    </Panel>
  );
};

const Bars: React.FC<Extract<OverlayDef, { kind: "bars" }>> = ({ dur, title, bars, y = 700 }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <Panel dur={dur} y={y}>
      <div style={{ width: 880, background: "rgba(10,13,24,0.82)", borderRadius: 28, padding: "34px 40px", fontFamily: FONT, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {title && <div style={{ fontSize: 40, fontWeight: 700, color: "#AFC0DA", marginBottom: 22 }}>{title}</div>}
        {bars.map((b, i) => {
          const g = interpolate(frame, [6 + i * 8, 26 + i * 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ marginBottom: i < bars.length - 1 ? 26 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 44, fontWeight: 800, color: C.white, marginBottom: 10 }}>
                <span>{b.label}</span>
                <span style={{ color: b.color, opacity: g }}>{b.text}</span>
              </div>
              <div style={{ height: 46, borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: "100%", width: `${(b.value / max) * 100 * g}%`, borderRadius: 12, background: b.color, boxShadow: `0 0 30px ${b.color}88` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const Dots: React.FC<Extract<OverlayDef, { kind: "dots" }>> = ({ dur, total, on, colorOn, colorOff, label, y = 640 }) => {
  const frame = useCurrentFrame();
  const cols = 10;
  const cell = 66;
  const lit = Math.round(interpolate(frame, [4, 34], [0, on], clamp));
  return (
    <Panel dur={dur} y={y}>
      <div style={{ background: "rgba(10,13,24,0.8)", borderRadius: 28, padding: 30, fontFamily: FONT, textAlign: "center" }}>
        <svg width={cols * cell} height={Math.ceil(total / cols) * cell}>
          {new Array(total).fill(0).map((_, i) => {
            // se encienden en orden de lectura; las "apagadas" son las últimas
            const isOn = i < lit;
            const cx = (i % cols) * cell + cell / 2;
            const cy = Math.floor(i / cols) * cell + cell / 2;
            // las que quedan sin encender solo toman su color cuando termina el recuento
            const off = lit >= on ? colorOff : "#3A4560";
            return <circle key={i} cx={cx} cy={cy} r={isOn ? 24 : 20} fill={isOn ? colorOn : off} opacity={isOn ? 1 : 0.9} />;
          })}
        </svg>
        {label && <div style={{ marginTop: 18, fontSize: 46, fontWeight: 800, color: C.white }}>{label}</div>}
      </div>
    </Panel>
  );
};

const Race: React.FC<Extract<OverlayDef, { kind: "race" }>> = ({ dur, title, suffix = "", cols, y = 1060 }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...cols.map((c) => c.value), 1);
  const H = 300;
  return (
    <Panel dur={dur} y={y}>
      <div style={{ width: 900, background: "rgba(10,13,24,0.84)", borderRadius: 28, padding: "26px 34px 22px", fontFamily: FONT, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {title && <div style={{ fontSize: 36, fontWeight: 700, color: "#AFC0DA", marginBottom: 14, textAlign: "center" }}>{title}</div>}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: H + 70 }}>
          {cols.map((c, i) => {
            const g = interpolate(frame, [c.delay, c.delay + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const shown = frame >= c.delay;
            const txt = shown ? `${fmt(c.value * g)}${suffix}` : "?";
            // una sola línea: si la cifra es larga ("262.481 €") se reduce en vez de partirse y chocar con el título
            const largo = `${fmt(c.value)}${suffix}`.length;
            return (
              <div key={i} style={{ width: 230, textAlign: "center", opacity: shown ? 1 : 0.25 }}>
                <div style={{ fontSize: largo > 8 ? 44 : 52, fontWeight: 800, color: c.color, marginBottom: 8, letterSpacing: -1, whiteSpace: "nowrap", marginLeft: -40, marginRight: -40 }}>
                  {txt}
                </div>
                <div style={{ height: Math.max(6, (c.value / max) * H * g), background: c.color, borderRadius: "12px 12px 4px 4px", boxShadow: `0 0 30px ${c.color}77` }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
          {cols.map((c, i) => (
            <div key={i} style={{ width: 230, textAlign: "center", fontSize: 34, fontWeight: 800, color: C.white }}>
              {c.label}
              {c.note && <div style={{ fontSize: 22, fontWeight: 500, color: "#AFC0DA", marginTop: 4 }}>{c.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

const Badges: React.FC<Extract<OverlayDef, { kind: "badges" }>> = ({ dur, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {items.map((b, i) => {
        const s = spring({ frame: frame - b.delay, fps, config: { damping: 11, stiffness: 180 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              transform: `translate(-50%, -50%) scale(${s})`,
              minWidth: 110,
              height: 110,
              padding: "0 18px",
              boxSizing: "border-box",
              borderRadius: 60,
              background: b.color,
              color: C.night,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 6px rgba(10,13,24,0.8), 0 10px 40px ${b.color}99`,
            }}
          >
            {b.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Lines: React.FC<Extract<OverlayDef, { kind: "lines" }>> = ({ dur, title, y = 700, xLabels, series }) => {
  const frame = useCurrentFrame();
  const W = 780;
  const H = 380;
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo) * 0.15;
  const sy = (v: number) => H - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * H;
  return (
    <Panel dur={dur} y={y}>
      <div style={{ background: "rgba(10,13,24,0.86)", borderRadius: 28, padding: "28px 40px", fontFamily: FONT, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {title && <div style={{ fontSize: 36, fontWeight: 700, color: "#AFC0DA", marginBottom: 16 }}>{title}</div>}
        <svg width={W + 120} height={H + 50}>
          <line x1={0} y1={sy(series[0].values[0])} x2={W} y2={sy(series[0].values[0])} stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="10 10" />
          {series.map((s, k) => {
            const prog = interpolate(frame, [4 + (s.delay ?? 0), 40 + (s.delay ?? 0)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            const n = s.values.length - 1;
            const upto = prog * n;
            const pts: string[] = [];
            for (let i = 0; i <= Math.floor(upto); i++) pts.push(`${(i / n) * W},${sy(s.values[i])}`);
            const fi = Math.floor(upto);
            let ex = (fi / n) * W;
            let ey = sy(s.values[fi]);
            if (fi < n) {
              const fr = upto - fi;
              ex = ((fi + fr) / n) * W;
              ey = sy(s.values[fi] + (s.values[fi + 1] - s.values[fi]) * fr);
              pts.push(`${ex},${ey}`);
            }
            return (
              <g key={k}>
                <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${s.color})` }} />
                <circle cx={ex} cy={ey} r={14} fill={s.color} />
                <text x={ex + 22} y={ey + 12} fill={s.color} fontSize={38} fontWeight={800} fontFamily={FONT} opacity={prog > 0.95 ? 1 : 0}>
                  {s.label}
                </text>
              </g>
            );
          })}
          <text x={0} y={H + 44} fill="#AFC0DA" fontSize={30} fontFamily={FONT}>
            {xLabels[0]}
          </text>
          <text x={W} y={H + 44} fill="#AFC0DA" fontSize={30} fontFamily={FONT} textAnchor="end">
            {xLabels[1]}
          </text>
        </svg>
      </div>
    </Panel>
  );
};

const Ring: React.FC<Extract<OverlayDef, { kind: "ring" }>> = ({ dur, x, y, r, color = C.warm }) => {
  const frame = useCurrentFrame();
  const len = 2 * Math.PI * r;
  const draw = interpolate(frame, [0, 12], [len, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const o = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={1080} height={1920}>
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={len} strokeDashoffset={draw} strokeLinecap="round" transform={`rotate(-90 ${x} ${y})`} style={{ filter: `drop-shadow(0 0 14px ${color})` }} />
      </svg>
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ color: string; peak?: number; len?: number }> = ({ color, peak = 0.3, len = 14 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: color, opacity: interpolate(frame, [0, 3, len], [0, peak, 0], clamp), mixBlendMode: "screen" }} />;
};

const Shade: React.FC<{ side: "top" | "bottom" }> = ({ side }) => (
  <AbsoluteFill
    style={{ background: side === "bottom" ? "linear-gradient(0deg, rgba(10,13,24,0.85) 0%, rgba(10,13,24,0) 45%)" : "linear-gradient(180deg, rgba(10,13,24,0.85) 0%, rgba(10,13,24,0) 40%)" }}
  />
);

const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 52%, transparent 52%, rgba(8,10,18,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,13,24,0.6) 0%, rgba(10,13,24,0) 26%, rgba(10,13,24,0) 70%, rgba(10,13,24,0.5) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay" }}>
        <svg width={1080} height={1920}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
          </filter>
          <rect width={1080} height={1920} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

const SeriesTag: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [dur - 8, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 196, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, letterSpacing: 3, color: C.warm, background: "rgba(10,13,24,0.75)", border: `2px solid ${C.warm}`, padding: "10px 24px", borderRadius: 40 }}>{text}</div>
    </div>
  );
};

const Bug: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", bottom: 330, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: o }}>
      <Logo size={86} spin={frame * 3} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.white, textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>{HANDLE}</div>
    </div>
  );
};

// ---------- Reel ----------
export const Reel: React.FC<{ cfg: ReelConfig; tl: Timeline }> = ({ cfg, tl }) => {
  const { START, VO, total, at, tiempos } = tl;
  const max = cfg.maxShot ?? 75;
  const shots = cfg.shots.map((s) => ({ ...s, f: at(s.at) }));
  shots.forEach((s, i) => {
    const next = shots[i + 1]?.f ?? total;
    if (next <= s.f) throw new Error(`Plano ${i} (${s.img}) empieza después del siguiente`);
    if (next - s.f > max && !s.long) throw new Error(`Plano ${i} (${s.img}) dura ${next - s.f} frames (máximo ${max}). Divídelo o márcalo long.`);
  });
  const posAt = (f: number) => {
    let p: "top" | "bottom" = "top";
    shots.forEach((s) => {
      if (f >= s.f - 2) p = s.cap ?? "top";
    });
    return p;
  };
  const display = { ...DISPLAY, ...(cfg.display ?? {}) };
  const music = cfg.music && existe(cfg.music.src) ? cfg.music : null;
  const musicVolume = (f: number) => {
    if (!music) return 0;
    let v = music.high;
    START.forEach((s, i) => {
      const d = interpolate(f, [s - 4, s, s + VO[i], s + VO[i] + 4], [0, 1, 1, 0], clamp);
      v = Math.min(v, music.high - d * (music.high - music.low));
    });
    (cfg.respiros ?? []).forEach(([c, n = 15]) => {
      const r = at(c);
      v *= interpolate(f, [r - n - 6, r - n, r, r + 4], [1, 0.1, 0.1, 1], clamp);
    });
    return v * interpolate(f, [total - 10, total], [1, 0.6], clamp);
  };
  // Sin barridos de aire ni brillos: un whoosh entre escenas se oye como viento pegado al micrófono y los efectos
  // brillantes (arena, tic-tac, campanillas) como un chirrido metálico debajo de la voz. Las transiciones visuales
  // NO llevan sonido propio y el render falla si una configuración pide uno de estos efectos.
  const PROHIBIDOS = ["whoosh", "whoosh-grave", "whoosh-largo", "swoosh", "riser", "metro", "arena", "tictac", "brillo", "despertador", "viento"];
  const pedidos = cfg.sfx.filter(([n]) => PROHIBIDOS.includes(n)).map(([n]) => n);
  if (pedidos.length) {
    throw new Error(
      `Efectos prohibidos en ${cfg.imgDir}: ${pedidos.join(", ")}. Suenan a viento o a brillo metálico; ` +
        `usa solo impacto, moneda-suave o monedas-suave, ligados a una palabra.`,
    );
  }
  const sfxList = cfg.sfx.filter(([n]) => existe(`sfx-pro/${n}.mp3`));

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ filter: "contrast(1.05) saturate(1.06)" }}>
        {shots.map((s, i) => {
          const next = shots[i + 1];
          const dur = (next?.f ?? total) - s.f + (next?.trans === "fade" ? 8 : 0);
          return (
            <Sequence key={i} from={s.f} durationInFrames={dur} premountFor={10}>
              <ShotLayer s={s} dur={dur} imgDir={cfg.imgDir} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Finish />

      {(cfg.overlays ?? []).map((o, i) => {
        const f = at(o.at);
        if (o.kind === "flash")
          return (
            <Sequence key={`o${i}`} from={f} durationInFrames={o.len ?? 16}>
              <Flash color={o.color} peak={o.peak} len={o.len} />
            </Sequence>
          );
        return (
          <Sequence key={`o${i}`} from={f} durationInFrames={o.dur}>
            {o.kind === "number" && <BigNumber {...o} />}
            {o.kind === "bars" && <Bars {...o} />}
            {o.kind === "dots" && <Dots {...o} />}
            {o.kind === "ring" && <Ring {...o} />}
            {o.kind === "shade" && <Shade side={o.side} />}
            {o.kind === "race" && <Race {...o} />}
            {o.kind === "badges" && <Badges {...o} />}
            {o.kind === "lines" && <Lines {...o} />}
          </Sequence>
        );
      })}

      <Sequence from={0} durationInFrames={Math.min(80, VO[0] + 20)}>
        <SeriesTag text={cfg.series} dur={Math.min(80, VO[0] + 20)} />
      </Sequence>

      {START.map((s, i) => (
        <Sequence key={`l${i}`} from={s} durationInFrames={(START[i + 1] ?? total) - s}>
          <Captions
            palabras={mergeWords(tiempos[i].palabras, cfg.merges ?? [])}
            keys={cfg.keys[i] ?? []}
            display={display}
            lineStart={s}
            posAt={posAt}
            hook={i === 0}
          />
          {existe(`${cfg.voDir}/${i + 1}.mp3`) && <Audio src={staticFile(`${cfg.voDir}/${i + 1}.mp3`)} />}
        </Sequence>
      ))}
      <Sequence from={START[START.length - 1]}>
        <Bug />
      </Sequence>

      {music && <Audio src={staticFile(music.src)} volume={musicVolume} />}
      {sfxList.map(([n, c, v]) => [n, at(c), v] as [string, number, number]).map(([name, f, vol], i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, f)}>
          <Audio src={staticFile(`sfx-pro/${name}.mp3`)} volume={vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
