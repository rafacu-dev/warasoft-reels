// Personaje de dibujos (kit vectorial): cabeza con volumen, cejas, bocas expresivas, ojos que miran,
// brazos articulados (cinemática inversa), piernas de palito con zapatillas, taburete y mano que señala/pulsa.
// Sale con los colores del protagonista de la cuenta (PROTA en brand.tsx); cada prop los puede cambiar
// para secundarios. Nació como RARITO, la mascota de @datorarito: en otras cuentas, su propio protagonista.
// Úsalo en planos de reacción y de "esto eres tú"; lo que hace tu cuerpo va mejor en plano subjetivo.
import React from "react";
import { useCurrentFrame } from "remotion";
import { PROTA } from "../brand";
import { INK, mix, Pt, useUid } from "./fx";

export type Pelo = "curl" | "spiky" | "none";

export type Mouth = "smile" | "grin" | "o" | "flat" | "tongue" | "wavy" | "frown" | "open";
export type Face = {
  look?: Pt; // -1..1
  blink?: number; // 0 abierto · 1 cerrado
  brow?: number; // −1 enfadado · 0 normal · 1 preocupado/asombrado
  mouth?: Mouth;
  eyes?: number; // escala de los ojos (asombro)
  blush?: number;
  sweat?: number; // 0..1 progreso de la gota
  spin?: number; // si se define, las pupilas giran en círculo (ángulo en rad)
};

export const Head: React.FC<{ face?: Face; head?: string; headShade?: string; curl?: number; hair?: Pelo; hairColor?: string }> = ({
  face = {},
  head = PROTA.head,
  headShade = PROTA.headShade,
  curl = 0,
  hair = PROTA.hair,
  hairColor = PROTA.hairColor,
}) => {
  const id = useUid();
  const { look = [0, 0], blink = 0, brow = 0, mouth = "smile", eyes = 1, blush = 0.5, sweat, spin } = face;
  let [lx, ly] = look;
  if (spin !== undefined) {
    lx = Math.cos(spin) * 0.8;
    ly = Math.sin(spin) * 0.6;
  }
  const eyeL = { x: -42, y: -10, r: 24 * eyes };
  const eyeR = { x: 42, y: -15, r: 32 * eyes };
  const sy = Math.max(0.08, 1 - blink);
  const Eye = ({ x, y, r, p }: { x: number; y: number; r: number; p: number }) => (
    <g transform={`translate(${x},${y}) scale(1,${sy})`}>
      <circle r={r} fill="#fff" stroke={INK} strokeWidth={6} />
      <circle cx={lx * (r - p - 4)} cy={ly * (r - p - 4)} r={p} fill={INK} />
      <circle cx={lx * (r - p - 4) - p * 0.35} cy={ly * (r - p - 4) - p * 0.4} r={p * 0.32} fill="#fff" />
    </g>
  );
  const b = brow;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}h`} cx="-40" cy="-55" r="175" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mix(head, "#ffffff", 0.55)} />
          <stop offset="0.5" stopColor={head} />
          <stop offset="1" stopColor={headShade} />
        </radialGradient>
      </defs>
      {/* pelo */}
      {hair === "curl" && (
        <g transform={`rotate(${curl} 18 -98)`}>
          <path d="M-20 -142 Q30 -172 54 -134 Q70 -100 20 -94" fill="none" stroke={hairColor} strokeWidth={13} strokeLinecap="round" />
        </g>
      )}
      {hair === "spiky" && (
        <g transform={`rotate(${curl * 0.6} 0 -110)`}>
          <path d="M-60 -96 L-50 -150 L-22 -112 L-4 -164 L18 -112 L46 -150 L56 -96 Z" fill={hairColor} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      <ellipse rx={112} ry={118} fill={`url(#${id}h)`} stroke={INK} strokeWidth={7} />
      <ellipse cx={-50} cy={-70} rx={30} ry={16} transform="rotate(-32 -50 -70)" fill="#fff" opacity={0.45} />
      {hair === "curl" && <circle cx={20} cy={-78} r={8} fill={hairColor} />}
      {/* mofletes */}
      <ellipse cx={-72} cy={30} rx={20} ry={13} fill="#FF7E6E" opacity={0.25 + blush * 0.45} />
      <ellipse cx={76} cy={26} rx={20} ry={13} fill="#FF7E6E" opacity={0.25 + blush * 0.45} />
      {blush > 0.8 &&
        [-80, -68, 66, 78].map((x, i) => <line key={i} x1={x} y1={20} x2={x - 8} y2={38} stroke="#E0503F" strokeWidth={4} strokeLinecap="round" opacity={0.7} />)}
      {/* ojos */}
      <Eye x={eyeL.x} y={eyeL.y} r={eyeL.r} p={10} />
      <Eye x={eyeR.x} y={eyeR.y} r={eyeR.r} p={12.5} />
      {/* cejas */}
      <path d={`M-66 ${-48 - eyeL.r + 24} L-20 ${-50 - eyeL.r + 24 - b * 12}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M18 ${-58 - eyeR.r + 32 - b * 12} L70 ${-56 - eyeR.r + 32}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      {/* boca */}
      <g transform="translate(4,52)">
        {mouth === "smile" && <path d="M-30 -8 Q2 20 36 -10" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />}
        {mouth === "grin" && (
          <g>
            <path d="M-38 -12 Q2 52 44 -14 Z" fill={INK} />
            <path d="M-30 -8 L36 -10 L30 4 L-24 6 Z" fill="#fff" />
            <ellipse cx={4} cy={22} rx={16} ry={8} fill="#FF6F7E" />
          </g>
        )}
        {mouth === "o" && (
          <g>
            <ellipse cx={0} cy={2} rx={17} ry={22} fill={INK} />
            <ellipse cx={0} cy={13} rx={10} ry={6} fill="#FF6F7E" />
          </g>
        )}
        {mouth === "open" && (
          <g>
            <path d="M-26 -6 Q0 34 30 -6 Q0 2 -26 -6 Z" fill={INK} />
            <ellipse cx={2} cy={10} rx={11} ry={6} fill="#FF6F7E" />
          </g>
        )}
        {mouth === "flat" && <path d="M-24 0 L28 -2" stroke={INK} strokeWidth={8} strokeLinecap="round" />}
        {mouth === "tongue" && (
          <g>
            <path d="M-26 -2 Q4 10 34 -4" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <path d="M14 2 Q18 22 30 20 Q38 16 32 -2" fill="#FF6F7E" stroke={INK} strokeWidth={5} />
          </g>
        )}
        {mouth === "wavy" && <path d="M-30 0 Q-20 -10 -10 0 Q0 10 10 0 Q20 -10 30 0" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {mouth === "frown" && <path d="M-26 10 Q2 -14 32 10" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />}
      </g>
      {/* gota de sudor */}
      {sweat !== undefined && sweat > 0 && (
        <g transform={`translate(${100},${-60 + sweat * 60})`} opacity={sweat < 0.9 ? 1 : (1 - sweat) * 10}>
          <path d="M0 -26 C10 -10 16 0 16 8 C16 18 8 24 0 24 C-8 24 -16 18 -16 8 C-16 0 -10 -10 0 -26 Z" fill="#7FD3FF" stroke={INK} strokeWidth={5} />
          <ellipse cx={-5} cy={8} rx={4} ry={6} fill="#fff" opacity={0.8} />
        </g>
      )}
    </g>
  );
};

// Parpadeo natural para face.blink: 0 abierto … 1 cerrado, unos frames cada `cada` frames (≈2,5 s).
// seed desfasa a dos personajes para que no parpadeen a la vez.
export const parpadeo = (f: number, cada = 76, seed = 0) => {
  const k = (((f + seed * 37) % cada) + cada) % cada;
  return k < 2 ? k / 2 : k < 5 ? 1 - (k - 2) / 3 : 0;
};

// 2 huesos: hombro → codo → mano. bend 1 / −1 elige hacia dónde dobla el codo.
export const ik = (s: Pt, t: Pt, l1: number, l2: number, bend = 1): [Pt, Pt] => {
  const dx = t[0] - s[0];
  const dy = t[1] - s[1];
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const e: Pt = [s[0] + Math.cos(base + bend * a) * l1, s[1] + Math.sin(base + bend * a) * l1];
  const h: Pt = [s[0] + Math.cos(base) * d, s[1] + Math.sin(base) * d];
  return [e, h];
};

const Arm: React.FC<{ s: Pt; t: Pt; bend: number; sleeve: string; cuff: string; skin: string; point?: boolean }> = ({ s, t, bend, sleeve, cuff, skin, point }) => {
  const [e, h] = ik(s, t, 92, 88, bend);
  const d = `M${s[0]} ${s[1]} L${e[0]} ${e[1]} L${h[0]} ${h[1]}`;
  const ang = (Math.atan2(h[1] - e[1], h[0] - e[0]) * 180) / Math.PI;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={52} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={sleeve} strokeWidth={39} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${s[0] - 4} ${s[1] - 8} L${e[0] - 4} ${e[1] - 8}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.18} />
      <g transform={`translate(${h[0]},${h[1]}) rotate(${ang})`}>
        <rect x={-18} y={-24} width={20} height={48} rx={8} fill={cuff} stroke={INK} strokeWidth={5} />
        {point && <rect x={18} y={-10} width={50} height={22} rx={11} fill={skin} stroke={INK} strokeWidth={5} />}
        <circle cx={18} cy={0} r={27} fill={skin} stroke={INK} strokeWidth={6} />
        <circle cx={12} cy={-20} r={10} fill={skin} stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

export type Pose = {
  handL?: Pt; // mano izquierda de pantalla (su mano derecha), coordenadas locales
  handR?: Pt;
  pointL?: boolean;
  pointR?: boolean;
  squash?: number; // 1 normal, <1 aplastado
  tilt?: number; // grados de la cabeza
  headY?: number;
  legs?: number; // balanceo de piernas (rad) cuando cuelgan
  feetUp?: number; // 0 en el suelo, 1 recogidas
};

// Personaje de frente, sentado en el taburete (stool) o de pie sin él. Origen = asiento (cadera).
// Altura total ≈ 760 px a escala 1. face y pose se animan desde la escena (cambian en las palabras clave).
export const Personaje: React.FC<{
  x: number;
  y: number;
  s?: number;
  face?: Face;
  pose?: Pose;
  stool?: boolean;
  body?: string;
  bodyShade?: string;
  head?: string;
  headShade?: string;
  hair?: Pelo;
  hairColor?: string;
  skin?: string; // manos (por defecto, el color de la cabeza)
  curl?: number;
  shoe?: { flyAt?: number; side?: "L" | "R"; dir?: 1 | -1 }; // la zapatilla sale volando (dir: hacia dónde)
  lift?: number; // el cuerpo flota por encima del taburete (caída)
  footCircle?: { side: "L" | "R"; a: number }; // un pie describe círculos
  extraHead?: React.ReactNode;
}> = ({ x, y, s = 1, face, pose = {}, stool = true, body = PROTA.body, bodyShade = PROTA.bodyShade, head = PROTA.head, headShade = PROTA.headShade, hair = PROTA.hair, hairColor = PROTA.hairColor, skin, curl = 0, shoe, lift = 0, footCircle, extraHead }) => {
  const hand = skin ?? (head === PROTA.head ? PROTA.skin : head);
  const f = useCurrentFrame();
  const id = useUid();
  const { handL = [-150, 30], handR = [150, 30], pointL, pointR, squash = 1, tilt = 0, headY = 0, legs = 0, feetUp = 0 } = pose;
  const breathe = Math.sin(f / 9) * 3;
  const sq = squash;
  const shL: Pt = [-112, -168 + breathe * 0.5];
  const shR: Pt = [112, -168 + breathe * 0.5];
  const leg = (side: -1 | 1) => {
    const hip: Pt = [side * 44, 6];
    const knee: Pt = [side * 60, 46];
    const sw = Math.sin(legs + (side > 0 ? 1.4 : 0)) * 0.5 * (legs ? 1 : 0);
    const footBase: Pt = [side * 66, 232 - feetUp * 90];
    const foot: Pt = [knee[0] + (footBase[0] - knee[0]) * Math.cos(sw) - (footBase[1] - knee[1]) * Math.sin(sw) * side * 0.5, knee[1] + (footBase[1] - knee[1]) * Math.cos(sw * 0.6)];
    if (footCircle && (footCircle.side === "L") === (side < 0)) {
      foot[0] += Math.cos(footCircle.a) * 34;
      foot[1] += -40 + Math.sin(footCircle.a) * 14;
    }
    return { hip, knee, foot };
  };
  const L = leg(-1);
  const R = leg(1);
  const shoeFly = shoe?.flyAt !== undefined && f >= shoe.flyAt ? f - shoe.flyAt : -1;
  const Sneaker = ({ p, fly }: { p: Pt; fly: number }) => {
    let tx = p[0];
    let ty = p[1];
    let rot = 0;
    if (fly >= 0) {
      const d = shoe?.dir ?? (shoe?.side === "R" ? 1 : -1);
      tx += fly * 30 * d;
      ty += -fly * 72 + 2.2 * fly * fly;
      rot = fly * 40 * d;
    }
    return (
      <g transform={`translate(${tx},${ty}) rotate(${rot})`}>
        <path d="M-50 18 C-50 -8 -28 -26 0 -26 C28 -26 50 -8 50 18 Z" fill="#fff" stroke={INK} strokeWidth={6} />
        <path d="M-30 -14 L30 -14" stroke={body} strokeWidth={9} strokeLinecap="round" />
        <path d="M-18 -26 L-12 -6 M0 -26 L0 -6 M18 -26 L12 -6" stroke={INK} strokeWidth={4} opacity={0.5} />
        <rect x={-55} y={14} width={110} height={18} rx={9} fill="#D3D8E2" stroke={INK} strokeWidth={6} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="-210" x2="0" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixBody(body, 0.18)} />
          <stop offset="1" stopColor={bodyShade} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6A562" />
          <stop offset="1" stopColor="#B77436" />
        </linearGradient>
      </defs>
      {/* sombra y taburete */}
      <ellipse cx={0} cy={292} rx={210} ry={30} fill="#000" opacity={0.3 * Math.max(0.35, 1 + lift / 900)} style={{ filter: "blur(8px)" }} />
      {stool && (
        <g>
          <path d="M-112 40 L-148 286 M112 40 L148 286" stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path d="M-112 40 L-148 286 M112 40 L148 286" stroke="#B77436" strokeWidth={18} strokeLinecap="round" />
          <ellipse cx={0} cy={196} rx={128} ry={20} fill="none" stroke={INK} strokeWidth={22} />
          <ellipse cx={0} cy={196} rx={128} ry={20} fill="none" stroke="#C98545" strokeWidth={10} />
          <path d={`M-156 14 L-156 ${40} Q0 ${66} 156 40 L156 14 Z`} fill="#A9672F" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <ellipse cx={0} cy={14} rx={156} ry={30 * (2 - sq)} fill={`url(#${id}w)`} stroke={INK} strokeWidth={6} />
          <ellipse cx={-40} cy={8} rx={70} ry={10} fill="#fff" opacity={0.22} />
        </g>
      )}
      <g transform={`translate(0,${lift})`}>
      {/* piernas de palito y zapatillas */}
      {[L, R].map((g, i) => (
        <g key={i}>
          <path d={`M${g.hip[0]} ${g.hip[1]} L${g.knee[0]} ${g.knee[1]} L${g.foot[0]} ${g.foot[1] - 10}`} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
          {!(shoe && shoeFly >= 0 && (shoe.side ?? "L") === (i === 0 ? "L" : "R")) && <Sneaker p={g.foot} fly={-1} />}
        </g>
      ))}
      {/* cuerpo: sudadera */}
      <g transform={`translate(0,8) scale(${1 + (1 - sq) * 0.6},${sq}) translate(0,-8)`}>
        <path d="M-74 -206 C-116 -200 -134 -170 -138 -120 L-146 -8 C-146 14 -126 26 -100 26 L100 26 C126 26 146 14 146 -8 L138 -120 C134 -170 116 -200 74 -206 Z" fill={`url(#${id}b)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M-90 -204 C-64 -246 64 -246 90 -204 C56 -186 -56 -186 -90 -204 Z" fill={bodyShade} stroke={INK} strokeWidth={6} />
        <path d="M-84 -40 L84 -40 L100 22 L-100 22 Z" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={0.55} />
        <path d="M-84 -40 Q0 -20 84 -40" fill="none" stroke="#fff" strokeWidth={5} opacity={0.15} />
        {[-26, 26].map((dx) => (
          <g key={dx}>
            <path d={`M${dx} -196 Q${dx * 1.2} -160 ${dx * 1.1} -128`} stroke="#F2F2F5" strokeWidth={7} fill="none" strokeLinecap="round" />
            <rect x={dx * 1.1 - 6} y={-132} width={12} height={20} rx={4} fill="#F2F2F5" stroke={INK} strokeWidth={3} />
          </g>
        ))}
        <path d="M-120 -150 C-128 -100 -130 -50 -132 -10" stroke="#fff" strokeWidth={10} fill="none" opacity={0.14} strokeLinecap="round" />
      </g>
      {/* brazos */}
      <Arm s={shL} t={handL} bend={-1} sleeve={body} cuff={bodyShade} skin={hand} point={pointL} />
      <Arm s={shR} t={handR} bend={1} sleeve={body} cuff={bodyShade} skin={hand} point={pointR} />
      {/* cabeza */}
      <g transform={`translate(0,${-336 + headY + breathe + (1 - sq) * 120}) rotate(${tilt})`}>
        <Head face={face} head={head} headShade={headShade} curl={curl} hair={hair} hairColor={hairColor} />
        {extraHead}
      </g>
      {/* la zapatilla que sale volando va por delante del cuerpo */}
      {shoe && shoeFly >= 0 && <Sneaker p={(shoe.side ?? "L") === "L" ? L.foot : R.foot} fly={shoeFly} />}
      </g>
    </g>
  );
};

const mixBody = (c: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  return "#" + h(c).map((v) => Math.min(255, Math.round(v + (255 - v) * k)).toString(16).padStart(2, "0")).join("");
};

// Mano que señala o pulsa (dedo índice hacia arriba; la punta del dedo está en (0, 0) antes de rotar).
// Para pulsar un botón: colócala con la punta en el botón y súbela/bájala unos px en el momento del toque.
export const Mano: React.FC<{ rot?: number; skin?: string; sleeve?: string; cuff?: string }> = ({ rot = -28, skin = PROTA.skin, sleeve = PROTA.body, cuff = PROTA.bodyShade }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-6} y={168} width={84} height={96} rx={30} fill={sleeve} stroke={INK} strokeWidth={6} />
    <path d="M-60 116 C-80 92 -84 66 -66 58 C-50 50 -38 72 -28 98 Z" fill={skin} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-58} y={96} width={150} height={128} rx={54} fill={skin} stroke={INK} strokeWidth={6} />
    <rect x={-22} y={2} width={44} height={128} rx={22} fill={skin} stroke={INK} strokeWidth={6} />
    <path d="M-10 92 Q0 98 10 92" stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />
    {[
      [30, 112],
      [62, 122],
      [86, 142],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={24} fill={skin} stroke={INK} strokeWidth={5} />
    ))}
    <path d="M60 150 C80 170 84 200 66 214" stroke={mix(skin, "#000000", 0.12)} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.6} />
    <ellipse cx={-6} cy={28} rx={9} ry={14} fill="#fff" opacity={0.45} />
    <rect x={-10} y={218} width={104} height={44} rx={16} fill={cuff} stroke={INK} strokeWidth={6} />
    {[0, 1, 2, 3, 4].map((k) => (
      <line key={k} x1={4 + k * 19} y1={224} x2={4 + k * 19} y2={256} stroke={mix(sleeve, "#ffffff", 0.15)} strokeWidth={4} />
    ))}
  </g>
);

// ---------- Actuación (principios de animación; ClaudeAnimationBase, MIT) ----------
// Las caras nunca saltan: un cambio de expresión mezcla mirada, cejas, ojos y rubor en `dur` frames; la boca
// cambia a mitad. f y at en el mismo sistema (los dos absolutos con F, o los dos locales).
export const mezclaCara = (f: number, at: number, de: Face, a: Face, dur = 6): Face => {
  const t = Math.min(1, Math.max(0, (f - at) / dur));
  const e = t * t * (3 - 2 * t);
  const n = (x: number | undefined, y: number | undefined, d: number) => (x ?? d) + ((y ?? d) - (x ?? d)) * e;
  const l0 = de.look ?? [0, 0];
  const l1 = a.look ?? [0, 0];
  return {
    ...(t < 0.5 ? de : a),
    look: [l0[0] + (l1[0] - l0[0]) * e, l0[1] + (l1[1] - l0[1]) * e],
    brow: n(de.brow, a.brow, 0),
    eyes: n(de.eyes, a.eyes, 1),
    blush: n(de.blush, a.blush, 0.5),
  };
};

// Reacción a una revelación o a un golpe: anticipación (se encoge los 5 frames previos), golpe (se estira, sube
// la cabeza y abre los ojos) y asentado con rebote amortiguado (≈0,8 s). Aplica el resultado a la pose y la cara:
//   const r = reaccion(F, A(7, "trampa"));  pose={{ squash: r.squash, headY: r.headY }}  face={{ ...cara, eyes: r.eyes }}
export const reaccion = (f: number, at: number, fuerza = 1) => {
  const d = f - at;
  if (d < -5 || d > 24) return { squash: 1, eyes: 1, headY: 0 };
  if (d < 0) {
    const k = (d + 5) / 5;
    return { squash: 1 - 0.07 * fuerza * k, eyes: 1 - 0.15 * fuerza * k, headY: 6 * fuerza * k };
  }
  const am = Math.exp(-d / 6) * Math.cos(d / 2.2);
  return { squash: 1 + 0.08 * fuerza * am, eyes: 1 + 0.35 * fuerza * Math.max(0, am), headY: -14 * fuerza * am };
};

// Sin gemelos: fase distinta y estable por pieza (brazo, ojo, personaje) para que nada se mueva en sincronía.
export const desfase = (seed: number) => (((seed * 9301 + 49297) % 233280) / 233280) * Math.PI * 2;

