// DEMO · #1: "¿Tu tostada cae siempre del lado de la mantequilla?" (video de ejemplo del kit vectorial)
// Voz: vo-demo01.txt (montar-cuenta.py le pone voz simulada; con `nuevo-video.py voz <cuenta> demo01`, la real).
// Mundo del video: un salón de noche con una mesa; la tostada cae por el borde izquierdo y aterriza en la alfombra.
// Luz: lámpara cálida arriba a la izquierda. Colores: cian = la mesa y su altura · oro = la tostada y la mantequilla
// · rojo = boca abajo (el problema) · verde = la vuelta entera (la salida). Los mismos en escenas y subtítulos.
// Fuente: R. A. J. Matthews (1995), "Tumbling toast, Murphy's Law and the fundamental constants", European Journal
// of Physics 16(4), 172–176. Con una mesa normal (≈75 cm) la tostada solo da media vuelta; para la vuelta entera
// haría falta una mesa de unos 3 m.
// Es un ejemplo para copiar trucos: momentos clave como constantes, escenas que usan el frame absoluto (useF),
// una sola escena con varias cámaras, plano subjetivo, diagrama de neón, móvil de la CTA y bucle con el frame 0.
import React from "react";
import { Reel, ReelConfig, timeline } from "../engine/Reel";
import tiempos from "../../public/vo/demo01/tiempos.json";
import {
  ArcArrow,
  Beacon,
  Bocadillo,
  C0,
  cam,
  Capa,
  Comet,
  easeOut,
  FichaAntigua,
  GlowBg,
  Golpe,
  INK,
  Look,
  Luz,
  Mano,
  mezclaCara,
  Movil,
  mv,
  NeonLabel,
  PAL,
  parpadeo,
  Personaje,
  Polvo,
  PortadaEscena,
  Pregunta,
  prog,
  Pt,
  reaccion,
  rel,
  S,
  Salon,
  SelloTachado,
  shake,
  Sombra,
  Svg,
  useF,
  via,
  ViaGlow,
  Visto,
} from "../kit";

const tl = timeline(tiempos, 2);
export const TOTAL_DEMO01 = tl.total;
// Frame absoluto: A(3) = empieza la frase 3 · A(3, "boca") = cuando dice "boca" · A(4, "es", 2) = 2.º "es"
const A = (n: number, w?: string, occ = 1, off = 0) => tl.at(w ? [n, w, occ, off] : [n, undefined, undefined, off]);

// ---------- Momentos clave (frames absolutos) ----------
const CAIDA0 = -16; // el gancho empieza con la tostada ya en el aire (cayó 16 frames "antes" del video)
const CAIDA_DUR = 26;
const ATERRIZA0 = CAIDA0 + CAIDA_DUR; // aterriza a los 0,3 s: golpe en el gancho
const EMPUJE = A(2, "empújala");
const TIRO2 = A(2, "mira") - 4; // segunda caída, a cámara lenta, hasta "aterriza"
const ATERRIZA2 = A(3, "aterriza") + 4;
const NO_ES = A(4, "mala");
const TACHA = A(4, "suerte", 1, 10);
const ALTURA = A(4, "altura");
const CUENTAS = A(5, "cuentas");
const DIAG = A(6);
const MEDIA = A(6, "media");
const ENTERA = A(7, "vuelta");
const TRES = A(7, "tres");
const ENVIA = A(8, "culpa", 1, 2);

// ---------- Mundo: salón con mesa ----------
const MESA = { x0: 330, x1: 1010, y: 1040, grosor: 36, patas: 1500 };
const T_REPOSO: Pt = [450, MESA.y - 30]; // centro de la tostada sobre la mesa (sobresale del borde)
const T_SUELO = 1474; // centro de la tostada en la alfombra
type Tiro = { desde: number; dur: number; vueltas: number; x1?: number };
// p = 0 sobre la mesa … 1 en el suelo. Cae con gravedad (y ∝ p²) y gira a ritmo constante.
const enTiro = (F: number, t: Tiro) => {
  const p = Math.min(1, Math.max(0, (F - t.desde) / t.dur));
  const x1 = t.x1 ?? 300;
  return { p, x: T_REPOSO[0] + (x1 - T_REPOSO[0]) * p, y: T_REPOSO[1] + (T_SUELO - T_REPOSO[1]) * p * p, rot: -360 * t.vueltas * p };
};
const TIRO_GANCHO: Tiro = { desde: CAIDA0, dur: CAIDA_DUR, vueltas: 0.5 };
const TIRO_LENTO: Tiro = { desde: TIRO2, dur: ATERRIZA2 - TIRO2, vueltas: 0.5 };

// Tostada vista de canto: miga con corteza y la capa de mantequilla arriba (oro). rot en grados.
const Tostada: React.FC<{ x: number; y: number; rot?: number; s?: number; brillo?: number }> = ({ x, y, rot = 0, s = 1, brillo = 0.6 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-136} y={-24} width={272} height={52} rx={18} fill="#E9A65A" stroke={INK} strokeWidth={7} />
    <rect x={-120} y={-12} width={240} height={26} rx={10} fill="#F7D79A" />
    {[-90, -50, -6, 40, 86].map((cx, i) => (
      <circle key={i} cx={cx} cy={i % 2 ? -2 : 6} r={4} fill="#D9A25E" />
    ))}
    <g style={{ filter: `drop-shadow(0 0 ${14 * brillo}px ${PAL.gold})` }}>
      <path d="M-122 -26 Q-122 -44 -100 -44 L100 -44 Q122 -44 122 -26 Z" fill={PAL.gold} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-60 -26 Q-56 -8 -50 -26 M30 -26 Q36 -4 42 -26" fill={PAL.gold} stroke={INK} strokeWidth={5} />
      <rect x={-96} y={-40} width={90} height={6} rx={3} fill="#fff" opacity={0.55} />
    </g>
  </g>
);

// Mesa de madera con una taza: el tablero es cian cuando se habla de su altura.
const Mesa: React.FC<{ resalta?: number }> = ({ resalta = 0 }) => {
  const borde = resalta > 0 ? PAL.cyan : INK;
  return (
    <g>
      <Sombra x={(MESA.x0 + MESA.x1) / 2} y={MESA.patas} rx={420} opacity={0.4} />
      {[MESA.x0 + 70, MESA.x1 - 70].map((x) => (
        <rect key={`b${x}`} x={x - 14} y={MESA.y} width={28} height={MESA.patas - MESA.y - 60} fill="#4A2A18" stroke={INK} strokeWidth={6} />
      ))}
      {[MESA.x0 + 30, MESA.x1 - 30].map((x) => (
        <rect key={`f${x}`} x={x - 20} y={MESA.y} width={40} height={MESA.patas - MESA.y} rx={8} fill="#7A4A2C" stroke={INK} strokeWidth={7} />
      ))}
      <rect x={MESA.x0} y={MESA.y} width={MESA.x1 - MESA.x0} height={MESA.grosor} rx={10} fill="#9A6038" stroke={borde} strokeWidth={7} style={resalta ? { filter: `drop-shadow(0 0 ${18 * resalta}px ${PAL.cyan})` } : undefined} />
      <rect x={MESA.x0 + 16} y={MESA.y + 6} width={MESA.x1 - MESA.x0 - 32} height={8} rx={4} fill="#fff" opacity={0.18} />
      {/* taza */}
      <g transform={`translate(860,${MESA.y})`}>
        <Sombra x={0} y={0} rx={70} opacity={0.35} blur={6} />
        <path d="M-56 0 L-62 -110 L62 -110 L56 0 Z" fill="#F4F1EA" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M62 -86 C104 -86 104 -30 58 -30" fill="none" stroke={INK} strokeWidth={14} />
        <path d="M62 -86 C96 -86 96 -30 58 -30" fill="none" stroke="#F4F1EA" strokeWidth={6} />
        <rect x={-50} y={-102} width={100} height={16} rx={6} fill="#5B3A22" />
      </g>
    </g>
  );
};

// Salón del kit, subido 300 px para que la mesa quede en el centro del encuadre, con suelo de sobra abajo.
const Fondo: React.FC<{ blur?: number }> = ({ blur }) => (
  <g style={blur ? { filter: `blur(${blur}px)` } : undefined}>
    <rect y={1500} width={1080} height={420} fill="#3E2414" />
    <g transform="translate(0,-300)">
      <Salon />
    </g>
  </g>
);

// Mancha de mantequilla en la alfombra (sale al aterrizar boca abajo)
const Mancha: React.FC<{ x: number; on: number }> = ({ x, on }) => (
  <ellipse cx={x} cy={T_SUELO + 30} rx={170 * on} ry={22 * on} fill={PAL.gold} opacity={0.55 * on} style={{ filter: "blur(3px)" }} />
);

// ---------- Escena principal: la caída (gancho, cámara lenta, aterrizaje y bucle) ----------
type CaidaProps = S & { tiro: Tiro; flecha?: boolean; estela?: boolean; pregunta?: number; veredicto?: { at: number; ok: boolean }; empuje?: number; quieto?: boolean };
const Caida: React.FC<CaidaProps> = ({ t0, dur, tiro, flecha, estela, pregunta, veredicto, empuje, quieto }) => {
  const dx = quieto ? 0 : -30; // el gancho y el bucle sin paralaje: así el último fotograma es igual que el frame 0
  const F = useF(t0);
  const t = enTiro(F, tiro);
  const aterriza = tiro.desde + tiro.dur;
  // antes de caer, la mano la empuja por la mesa hasta el borde (plano subjetivo)
  const e = empuje !== undefined ? prog(F, empuje, tiro.desde, easeOut) : 1;
  const x = t.p > 0 ? t.x : T_REPOSO[0] + 120 * (1 - e);
  const rastro: Pt[] = estela ? new Array(14).fill(0).map((_, i) => {
    const k = enTiro(F - 13 + i, tiro);
    return [k.x, k.y] as Pt;
  }) : [];
  return (
    <Look shk={shake(F, aterriza, 12, 14)}>
      <Svg>
        <Capa prof={0.3} dur={dur} dx={dx}>
          <Fondo />
        </Capa>
        <Luz x={380} y={300} r={760} color="#FFC27A" opacity={0.3} />
        <Capa prof={1} dur={dur} dx={dx}>
          <Mesa />
          <Mancha x={tiro.x1 ?? 300} on={prog(F, aterriza, aterriza + 6, easeOut)} />
          {t.p >= 1 && <Sombra x={t.x} y={T_SUELO + 30} rx={150} opacity={0.45} />}
          {estela && t.p > 0 && t.p < 1 && <Comet pts={rastro} color={PAL.gold} width={26} head={false} />}
          <Tostada x={x} y={t.y} rot={t.rot} />
          {flecha && t.p > 0.05 && t.p < 0.95 && <ArcArrow x={t.x} y={t.y} r={190} dir={-1} color={PAL.gold} rot={-20 - 300 * t.p} sweep={200} width={22} />}
          {empuje !== undefined && t.p < 0.2 && (
            <g transform={`translate(${x + 140 + 6 * Math.sin(F / 5)},${T_REPOSO[1] + 6}) scale(0.9)`} opacity={1 - prog(F, tiro.desde + 4, tiro.desde + 10)}>
              <Mano rot={-90} />
            </g>
          )}
        </Capa>
        <Golpe x={tiro.x1 ?? 300} y={T_SUELO} at={rel(aterriza, t0)} color={veredicto?.ok ? PAL.green : PAL.red} radius={230} />
        {pregunta !== undefined && <Pregunta x={330} y={1180} at={rel(pregunta, t0)} size={200} />}
        {veredicto && <Visto x={(tiro.x1 ?? 300) + 210} y={T_SUELO - 150} at={rel(veredicto.at, t0)} ok={veredicto.ok} s={1.4} />}
        <Polvo t0={t0} n={24} />
      </Svg>
    </Look>
  );
};

const Gancho: React.FC<S> = (p) => <Caida {...p} tiro={TIRO_GANCHO} pregunta={A(1, "mantequilla")} quieto />;
// Bucle: la misma escena desplazada para que su último fotograma sea el frame 0 del video
const Bucle: React.FC<S> = (p) => <Caida {...p} t0={p.t0 - (TOTAL_DEMO01 - 1)} tiro={TIRO_GANCHO} quieto />;

// La segunda caída, a cámara lenta, contada en cuatro planos con la misma escena y otra cámara u otro detalle
const Empuja: React.FC<S> = (p) => <Caida {...p} tiro={TIRO_LENTO} empuje={EMPUJE} />;
const Gira: React.FC<S> = (p) => <Caida {...p} tiro={TIRO_LENTO} flecha />;
const Media: React.FC<S> = (p) => <Caida {...p} tiro={TIRO_LENTO} estela flecha />;
const Aterriza: React.FC<S> = (p) => <Caida {...p} tiro={TIRO_LENTO} veredicto={{ at: ATERRIZA2 + 4, ok: false }} />;

// ---------- "No es mala suerte" ----------
const Sello: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  return (
    <Look shk={shake(F, TACHA, 10, 10)}>
      <Svg>
        <Capa prof={0.3} dur={dur}>
          <Fondo blur={7} />
        </Capa>
        <Capa prof={1.2} dur={dur}>
          <Mancha x={300} on={1} />
          <Sombra x={300} y={T_SUELO + 30} rx={150} opacity={0.45} />
          <Tostada x={300} y={T_SUELO} rot={-180} />
        </Capa>
        <SelloTachado x={540} y={1060} texto="MALA SUERTE" at={rel(NO_ES, t0)} tachaAt={rel(TACHA, t0)} size={82} />
        <Polvo t0={t0} n={20} />
      </Svg>
    </Look>
  );
};

// ---------- "Es la altura de tu mesa": regla de neón del suelo al tablero ----------
const REGLA_X = 670;
const REGLA = via([
  [REGLA_X, MESA.patas],
  [REGLA_X, MESA.y + MESA.grosor],
]);
const Altura: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  const p = prog(F, ALTURA, ALTURA + 16, easeOut);
  return (
    <Look>
      <Svg>
        <Capa prof={0.3} dur={dur}>
          <Fondo blur={3} />
        </Capa>
        <rect width={1080} height={1920} fill="#0A1030" opacity={0.35 * p} />
        <Capa prof={1} dur={dur}>
          <Mesa resalta={p} />
          <Mancha x={300} on={1} />
          <Tostada x={300} y={T_SUELO} rot={-180} brillo={0.2} />
          <ViaGlow v={REGLA} p={p} color={PAL.cyan} width={12} />
          <Beacon x={REGLA_X} y={MESA.y + MESA.grosor} r={34} color={PAL.cyan} on={ALTURA + 14} t0={t0} />
          {[MESA.patas, MESA.y + MESA.grosor].map((y) => (
            <line key={y} x1={REGLA_X - 60} x2={REGLA_X + 60} y1={y} y2={y} stroke={PAL.cyan} strokeWidth={10} strokeLinecap="round" opacity={p} style={{ filter: `drop-shadow(0 0 10px ${PAL.cyan})` }} />
          ))}
        </Capa>
        <Polvo t0={t0} n={20} />
      </Svg>
    </Look>
  );
};

// ---------- "Un físico, Robert Matthews, hizo las cuentas" ----------
const Fisico: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  const pensando = { look: [0.5, -0.6] as Pt, brow: 0.6, mouth: "flat" as const, blink: parpadeo(F) };
  const eureka = { look: [0.2, -0.2] as Pt, brow: 1, mouth: "grin" as const, eyes: 1.2, blink: parpadeo(F) };
  const r = reaccion(F, CUENTAS);
  const nube = prog(F, A(5) + 6, A(5) + 16, easeOut);
  return (
    <Look>
      <Svg>
        <Capa prof={0.3} dur={dur}>
          <Salon blur={4} />
        </Capa>
        <Luz x={420} y={700} r={640} color="#FFC27A" opacity={0.35} />
        <Capa prof={1} dur={dur}>
          <Sombra x={420} y={1505} rx={190} />
          <Personaje x={420} y={1280} face={mezclaCara(F, CUENTAS, pensando, eureka)} pose={{ squash: r.squash, headY: r.headY, handR: [150, -250], pointR: true }} />
          <Bocadillo x={780} y={780} w={420} h={300} cola={[540, 900]} s={nube} opacity={nube}>
            <path d="M-150 -60 Q-40 -60 60 90" fill="none" stroke={PAL.cyan} strokeWidth={10} strokeDasharray="4 18" strokeLinecap="round" />
            <Tostada x={60} y={70} rot={-150} s={0.36} />
            <text x={-60} y={100} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK}>
              ½
            </text>
          </Bocadillo>
        </Capa>
        <Polvo t0={t0} n={18} />
      </Svg>
    </Look>
  );
};

const Ficha: React.FC<S> = ({ t0, dur }) => (
  <Look>
    <Svg>
      <Capa prof={0.3} dur={dur}>
        <Salon blur={9} warm={0.8} />
      </Capa>
      <Luz x={540} y={1000} r={600} color={PAL.gold} opacity={0.25} />
      <Capa prof={1.3} dur={dur}>
        <FichaAntigua x={540} y={1040} anio="1995" texto="EUR. J. PHYS." at={rel(CUENTAS, t0) - 2} />
      </Capa>
      <Polvo t0={t0} n={20} />
    </Svg>
  </Look>
);

// ---------- Diagrama de neón: la altura decide cuánto gira ----------
// escala 1 = mesa normal; crece hasta 4 alturas (unos 3 m) en "vuelta entera" y el dibujo se aleja para que quepa
const Diagrama: React.FC<S> = ({ t0 }) => {
  const F = useF(t0);
  const crece = prog(F, ENTERA, ENTERA + 30); // 0 = 75 cm · 1 = 3 m
  const alto = 1 + 3 * crece;
  const zoom = 1 / (1 + 0.62 * crece * 3); // aleja el dibujo para que quepa la mesa alta
  const H = 520; // px de una mesa normal en el dibujo
  const suelo = 1560;
  const x0 = 420;
  const vueltas = 0.5 + 0.5 * crece;
  const dibuja = prog(F, DIAG + 4, DIAG + 34, easeOut);
  const n = 6;
  const fantasmas = new Array(n).fill(0).map((_, i) => {
    const q = i / (n - 1);
    return { q, x: x0 + 40 + 280 * (1 + 2 * crece) * q, y: suelo - H * alto + H * alto * q * q, rot: -360 * vueltas * q };
  });
  const ok = crece > 0.98;
  return (
    <Look>
      <Svg>
        <GlowBg from="#1B2A5E" to="#060914" grid />
        <g transform={`translate(540 ${suelo}) scale(${zoom}) translate(-540 ${-suelo})`}>
          <line x1={-600} x2={1700} y1={suelo + 30} y2={suelo + 30} stroke={PAL.cyan} strokeWidth={6} opacity={0.4} />
          {/* la mesa en neón y su altura */}
          <rect x={x0 - 300} y={suelo - H * alto} width={340} height={22} rx={8} fill="none" stroke={PAL.cyan} strokeWidth={8} style={{ filter: `drop-shadow(0 0 12px ${PAL.cyan})` }} />
          <line x1={x0 - 270} x2={x0 - 270} y1={suelo - H * alto + 22} y2={suelo + 30} stroke={PAL.cyan} strokeWidth={8} opacity={0.6} />
          <line x1={x0 + 10} x2={x0 + 10} y1={suelo - H * alto + 22} y2={suelo + 30} stroke={PAL.cyan} strokeWidth={8} opacity={0.6} />
          {/* trayectoria: tostadas fantasma que se encienden en orden */}
          {fantasmas.map((g, i) => {
            const on = prog(dibuja, i / n, (i + 1) / n);
            return on > 0 ? (
              <g key={i} opacity={i === n - 1 ? on : 0.35 + 0.4 * on}>
                <Tostada x={g.x} y={g.y} rot={g.rot} s={0.7 * (1 + 1.2 * crece)} brillo={i === n - 1 ? 0.9 : 0.3} />
              </g>
            ) : null;
          })}
        </g>
        {ok ? <Visto x={880} y={1400} at={rel(TRES, t0)} ok s={1.5} /> : crece === 0 && <Visto x={880} y={1400} at={rel(MEDIA, t0)} ok={false} s={1.5} />}
        {F < A(6, "solo") && dibuja > 0.9 && <NeonLabel x={290} y={980} text="MESA" color={PAL.cyan} size={56} />}
      </Svg>
    </Look>
  );
};

// ---------- La mesa de tres metros (plano firma): el protagonista mira hacia arriba y la tostada cae del lado bueno ----------
const Gigante: React.FC<S> = ({ t0, dur }) => {
  const F = useF(t0);
  const r = reaccion(F, TRES);
  const tiro: Tiro = { desde: A(7, "medir") - 6, dur: TRES - A(7, "medir") + 10, vueltas: 1, x1: 700 };
  const t = enTiro(F, tiro);
  const y = -400 + (T_SUELO + 400) * t.p * t.p;
  const cara = mezclaCara(F, TRES, { look: [0.3, -1], brow: 1, mouth: "o", eyes: 1.15 }, { look: [0.6, 0.4], brow: 0.8, mouth: "grin", eyes: 1.1 });
  return (
    <Look shk={shake(F, tiro.desde + tiro.dur, 10, 10)}>
      <Svg>
        <Capa prof={0.3} dur={dur}>
          <Fondo blur={4} />
        </Capa>
        <Capa prof={1} dur={dur}>
          {/* patas de una mesa de 3 m: el tablero queda fuera de cuadro */}
          {[150, 960].map((x) => (
            <rect key={x} x={x - 34} y={-200} width={68} height={MESA.patas + 200} rx={12} fill="#7A4A2C" stroke={PAL.cyan} strokeWidth={8} style={{ filter: `drop-shadow(0 0 14px ${PAL.cyan})` }} />
          ))}
          <Sombra x={330} y={1505} rx={150} />
          <Personaje x={330} y={1300} s={0.8} stool={false} face={{ ...cara, eyes: (cara.eyes ?? 1) * r.eyes, blink: parpadeo(F, 70, 2) }} pose={{ squash: r.squash, headY: r.headY, handL: [-160, -300], handR: [160, -300] }} />
          {t.p >= 1 && <Sombra x={700} y={T_SUELO + 30} rx={150} opacity={0.45} />}
          <Tostada x={700} y={y} rot={t.rot} />
        </Capa>
        <Golpe x={700} y={T_SUELO} at={rel(tiro.desde + tiro.dur, t0)} color={PAL.green} />
        <Visto x={860} y={T_SUELO - 170} at={rel(TRES + 8, t0)} ok s={1.3} />
        <Polvo t0={t0} n={20} />
      </Svg>
    </Look>
  );
};

// ---------- CTA: el móvil con este reel en la pantalla ----------
const Envia: React.FC<S> = ({ t0 }) => (
  <Look>
    <Svg>
      <Fondo blur={8} />
    </Svg>
    <Movil t0={t0} tapAt={ENVIA} inner={<Gancho t0={0} dur={60} />} />
  </Look>
);

// ---------- Configuración ----------
const HOOK_A = cam([470, 1200], 1.18);
const HOOK_B = cam([420, 1260], 1.3);

const cfg: ReelConfig = {
  imgDir: "",
  voDir: "vo/demo01",
  keys: [
    ["mantequilla:gold"], // 1 · ¿Tu tostada cae siempre del lado…
    ["gira:gold"], // 2 · Empújala fuera de la mesa…
    ["abajo:red"], // 3 · Media vuelta, y aterriza boca abajo.
    ["suerte:red", "altura"], // 4 · No es mala suerte. Es la altura…
    ["cuentas:gold"], // 5 · Un físico, Robert Matthews…
    ["media:red"], // 6 · A setenta y cinco centímetros…
    ["entera:green"], // 7 · Para la vuelta entera…
    ["Envíaselo"], // 8 · Envíaselo a quien siempre culpa…
  ],
  merges: [
    ["setenta y cinco centímetros", "75 cm"],
    ["tres metros", "3 m"],
  ],
  shots: [
    { img: "", scene: Gancho, at: [1], move: mv(HOOK_A, HOOK_B) },
    { img: "", scene: Gancho, at: [1, "lado"], move: mv(cam([320, 1380], 1.5), cam([330, 1360], 1.62)), trans: "zoom", cap: "top" },
    { img: "", scene: Empuja, at: [2], move: mv(cam([560, 1040], 1.45), cam([500, 1060], 1.55)), trans: "whip" },
    { img: "", scene: Gira, at: [2, "mira"], move: mv(cam([420, 1180], 1.2), cam([400, 1240], 1.32)), trans: "cut" },
    { img: "", scene: Media, at: [3], move: mv(cam([380, 1300], 1.5), cam([360, 1340], 1.4)) },
    { img: "", scene: Aterriza, at: [3, "aterriza"], move: mv(cam([360, 1400], 1.35), cam([330, 1420], 1.5)), trans: "zoom" },
    { img: "", scene: Sello, at: [4], move: mv(cam([540, 1100], 1.08), cam([540, 1080], 1.18)), trans: "whip", cap: "top" },
    { img: "", scene: Altura, at: [4, "altura"], move: mv(cam([520, 1200], 1.25), cam([480, 1240], 1.1)), trans: "zoom" },
    { img: "", scene: Fisico, at: [5], move: mv(cam([560, 1000], 1.1), cam([520, 1040], 1.2)), trans: "whip", cap: "top" },
    { img: "", scene: Ficha, at: [5, "cuentas"], move: mv(cam([540, 1040], 1.15), cam([540, 1020], 1.05)), trans: "zoom", cap: "top" },
    { img: "", scene: Diagrama, at: [6], move: mv(C0, cam([560, 1200], 1.12)), trans: "whip", cap: "top" },
    { img: "", scene: Diagrama, at: [6, "solo"], move: mv(cam([700, 1300], 1.3), cam([720, 1320], 1.4)), trans: "cut", cap: "top" },
    { img: "", scene: Diagrama, at: [7], move: mv(cam([600, 1200], 1.25), C0), trans: "zoom", cap: "top" },
    { img: "", scene: Gigante, at: [7, "tendría"], move: mv(cam([540, 900], 1.05), cam([560, 1100], 1.2)), trans: "whip", cap: "top" },
    { img: "", scene: Envia, at: [8], move: mv(C0, cam([540, 980], 1.06)), trans: "whip", cap: "top" },
    // último plano: vuelve al gancho y termina en la cámara del frame 0 (bucle)
    { img: "", scene: Bucle, at: [8, "mala"], move: mv(cam([470, 1220], 1.3), HOOK_A), trans: "zoom" },
  ],
  // solo impacto, impacto-grave, pop-grave, moneda-suave y monedas-suave, ligados a una palabra.
  // Si aún no están en public/sfx-pro/ se omiten (references/audio.md explica cómo conseguirlos).
  sfx: [
    ["impacto-grave", ATERRIZA0 + 3, 0.75],
    ["pop-grave", [1, "mantequilla"], 0.5],
    ["impacto", ATERRIZA2, 0.75],
    ["impacto-grave", TACHA, 0.7],
    ["pop-grave", [5, "cuentas"], 0.5],
    ["impacto-grave", [6, "media"], 0.7],
    ["impacto", TRES, 0.8],
    ["pop-grave", ENVIA, 0.5],
  ],
  // música CC BY (references/audio.md): music: { src: "music/<archivo>.mp3", high: 0.36, low: 0.15 },
  respiros: [[[7, "tres"], 15]],
  series: "DEMO · #1",
};

export const Demo01: React.FC = () => <Reel cfg={cfg} tl={tl} />;

// ---------- Portada: la tostada boca abajo y la mancha, justo después del golpe ----------
export const PortadaDemo01: React.FC = () => (
  <PortadaEscena serie="DEMO · #1" titulo={["¿Por qué cae", "siempre del lado", "de la *mantequilla*?"]} dy={-300} zoom={1.35}>
    <Gancho t0={A(1, "mantequilla") + 12} dur={60} />
  </PortadaEscena>
);
