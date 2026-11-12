// Genera la voz en off con ElevenLabs, una pista por línea, más los tiempos palabra a palabra.
// Uso (desde produccion/remotion):
//   node scripts/voz-elevenlabs.mjs --voces            → lista las voces de tu cuenta (elige una, p. ej. "Bill")
//   node scripts/voz-elevenlabs.mjs --claves           → comprueba cada clave (saldo, permiso y voz; ≈3 créditos)
//   node scripts/voz-elevenlabs.mjs vo-<carpeta>.txt vo/<carpeta> [--solo N]
//                                                      → public/vo/<carpeta>/N.mp3 + tiempos.json
// Lee de .env (chmod 600; nunca se imprime, se comparte ni se sube):
//   ELEVENLABS_VOICE_ID
//   ELEVENLABS_API_KEY y, si tienes más cuentas, ELEVENLABS_API_KEY_2, ELEVENLABS_API_KEY_3… (se usan en ese orden).
//   ELEVENLABS_DESDE=N (variable de entorno, opcional): usa solo las claves desde la N (para saltar las agotadas).
// Cuando una cuenta se queda sin saldo, sigue con la siguiente clave en la misma línea.
// Si ElevenLabs marca actividad inusual en alguna cuenta, se detiene para no arriesgar las demás.
// Licencia: lo generado con el plan gratuito de ElevenLabs no permite uso comercial.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const claves = Object.keys(process.env)
  .map((k) => k.match(/^ELEVENLABS_API_KEY(?:_(\d+))?$/))
  .filter(Boolean)
  .sort((a, b) => Number(a[1] ?? 1) - Number(b[1] ?? 1))
  .map((m) => ({ nombre: m[0], n: Number(m[1] ?? 1), valor: process.env[m[0]].trim() }))
  // ELEVENLABS_DESDE=N: empieza por la clave N (para no tocar cuentas ya agotadas)
  .filter((c) => c.valor && c.n >= Number(process.env.ELEVENLABS_DESDE ?? 1));
if (!claves.length) {
  console.error("Falta ELEVENLABS_API_KEY en produccion/remotion/.env (ábrelo con un editor y pega tu clave; nunca en el chat)");
  process.exit(1);
}
const API = "https://api.elevenlabs.io/v1";
const headersDe = (c) => ({ "xi-api-key": c.valor, "Content-Type": "application/json" });
const ocultar = (t) => t.replace(/sk_[A-Za-z0-9]{20,}/g, "[clave]");

// Por qué rechazó ElevenLabs una petición: "inusual" detiene todo, los motivos de cuenta
// pasan a la siguiente clave y cualquier otro error se trata como un fallo real.
const motivo = (status, txt) => {
  let d = {};
  try {
    d = JSON.parse(txt).detail ?? {};
  } catch {}
  const s = `${d.code ?? ""} ${d.status ?? ""} ${typeof d === "string" ? d : ""}`;
  if (/unusual/i.test(s) || /unusual activity/i.test(txt)) return { parar: true, texto: "ElevenLabs marcó actividad inusual" };
  if (/quota_exceeded/.test(s)) return { texto: "sin saldo" };
  if (/invalid_api_key/.test(s)) return { texto: "clave no válida" };
  if (/missing_permissions/.test(s)) return { texto: "a la clave le falta el permiso de texto a voz" };
  if (/voice_not_found/.test(s) || status === 404) return { texto: "esta cuenta no tiene la voz (añádela desde su biblioteca de voces)" };
  if (status === 401) return { texto: `rechazada (${s.trim() || status})` };
  return null;
};

const VOICE = process.env.ELEVENLABS_VOICE_ID;
const urlTTS = (conTiempos) =>
  `${API}/text-to-speech/${VOICE}${conTiempos ? "/with-timestamps" : ""}?output_format=mp3_44100_128`;

if (process.argv[2] === "--voces") {
  const r = await fetch(`${API}/voices`, { headers: headersDe(claves[0]) });
  if (!r.ok) throw new Error(`${r.status} ${ocultar(await r.text())}`);
  const { voices } = await r.json();
  for (const v of voices) console.log(`${v.voice_id}  ${v.name}  ${JSON.stringify(v.labels ?? {})}`);
  process.exit(0);
}

if (!VOICE) {
  console.error("Falta ELEVENLABS_VOICE_ID en .env (elige una con: node scripts/voz-elevenlabs.mjs --voces)");
  process.exit(1);
}

if (process.argv[2] === "--claves") {
  // Muestra el saldo si la clave tiene permiso de lectura; si no, prueba la voz con una palabra (unos 3 créditos).
  for (const c of claves) {
    let saldo = null;
    const s = await fetch(`${API}/user/subscription`, { headers: headersDe(c) });
    if (s.ok) {
      const j = await s.json();
      saldo = j.character_limit - j.character_count;
      const reinicio = j.next_character_count_reset_unix ? new Date(j.next_character_count_reset_unix * 1000).toISOString().slice(0, 10) : "?";
      console.log(`${c.nombre}: plan ${j.tier}, quedan ${saldo} de ${j.character_limit} créditos (se reinicia el ${reinicio})`);
    }
    if (saldo === 0) continue;
    const r = await fetch(urlTTS(false), {
      method: "POST",
      headers: headersDe(c),
      body: JSON.stringify({ text: "Sí.", model_id: "eleven_multilingual_v2" }),
    });
    if (r.ok) {
      await r.arrayBuffer();
      console.log(`${c.nombre}: funciona con la voz${saldo === null ? " (no puedo ver el saldo: a la clave le falta el permiso de lectura de usuario)" : ""}`);
    } else {
      const m = motivo(r.status, await r.text());
      console.log(`${c.nombre}: ${m ? m.texto : `error ${r.status}`}`);
      if (m?.parar) break;
    }
  }
  process.exit(0);
}

let actual = 0;
const pedir = async (body) => {
  while (actual < claves.length) {
    const c = claves[actual];
    const r = await fetch(urlTTS(true), { method: "POST", headers: headersDe(c), body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const txt = ocultar(await r.text());
    const m = motivo(r.status, txt);
    if (!m) throw new Error(`${r.status} ${txt}`);
    if (m.parar) throw new Error(`${c.nombre}: ${m.texto}. Me detengo para no arriesgar las cuentas.`);
    console.log(`  · ${c.nombre}: ${m.texto}. Paso a la siguiente clave.`);
    actual++;
  }
  throw new Error(`Ninguna de las ${claves.length} claves pudo generar la voz.`);
};

if (!process.argv[2] || process.argv[2].startsWith("--")) {
  console.error("Uso: node scripts/voz-elevenlabs.mjs vo-<carpeta>.txt vo/<carpeta> [--solo N]");
  process.exit(2);
}
const lines = fs.readFileSync(path.resolve(process.argv[2]), "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const outDir = path.join(root, "public", process.argv[3] ?? "vo");
fs.mkdirSync(outDir, { recursive: true });

// Agrupa la alineación por caracteres en palabras con inicio/fin en segundos
const toWords = ({ characters, character_start_times_seconds: s, character_end_times_seconds: e }) => {
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
    } else {
      if (!cur) cur = { text: "", start: s[i], end: e[i] };
      cur.text += ch;
      cur.end = e[i];
    }
  });
  if (cur) words.push(cur);
  return words;
};

// --solo N: regenera solo la línea N y conserva las demás en tiempos.json
const solo = process.argv.includes("--solo") ? Number(process.argv[process.argv.indexOf("--solo") + 1]) : null;
const prev = solo && fs.existsSync(path.join(outDir, "tiempos.json")) ? JSON.parse(fs.readFileSync(path.join(outDir, "tiempos.json"), "utf8")) : null;
const tiempos = [];
for (let i = 0; i < lines.length; i++) {
  if (solo && prev && i + 1 !== solo) {
    tiempos.push(prev[i]);
    continue;
  }
  const body = {
    text: lines[i],
    model_id: "eleven_multilingual_v2",
    previous_text: lines[i - 1],
    next_text: lines[i + 1],
    // velocidad 1,15 ≈ 3,2 palabras/s con una voz documental (el ritmo que asumen la voz simulada y la auditoría)
    voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: Number(process.env.ELEVENLABS_SPEED ?? 1.15) },
  };
  let data;
  try {
    data = await pedir(body);
  } catch (e) {
    throw new Error(`Línea ${i + 1}: ${e.message}`);
  }
  fs.writeFileSync(path.join(outDir, `${i + 1}.mp3`), Buffer.from(data.audio_base64, "base64"));
  const words = toWords(data.alignment);
  tiempos.push({ linea: i + 1, texto: lines[i], duracion: words.at(-1)?.end ?? 0, palabras: words });
  console.log(`✓ ${i + 1}/${lines.length}  ${(words.at(-1)?.end ?? 0).toFixed(2)} s  ${lines[i]}  [${claves[actual].nombre}]`);
}
fs.writeFileSync(path.join(outDir, "tiempos.json"), JSON.stringify(tiempos, null, 2));
console.log(`Listo: ${outDir}`);
