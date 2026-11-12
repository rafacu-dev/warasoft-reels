// Genera los 3 únicos efectos que usa el motor, con TU clave de ElevenLabs (text-to-sound), en public/sfx-pro/:
//   impacto.mp3        golpe grave de tráiler (revelaciones, cifras grandes)
//   moneda-suave.mp3   una moneda, filtrada por debajo de 4,2 kHz (sin brillo metálico)
//   monedas-suave.mp3  un puñado de monedas, filtrado igual
// Uso (desde produccion/remotion): node scripts/sfx-elevenlabs.mjs   (necesita ffmpeg; gasta pocos créditos)
// Por qué solo estos: los barridos de aire (whoosh, riser) suenan a viento pegado al micrófono y los efectos
// brillantes (arena, tic-tac, campanillas) a chirrido metálico debajo de la voz. El motor los rechaza.
// Licencia: lo generado con el plan gratuito de ElevenLabs no permite uso comercial. Alternativa sin clave:
// efectos CC0 (dominio público), filtrados con ffmpeg -af lowpass=f=4200 (ver public/sfx-pro/LEEME.md).
import { execFileSync } from "node:child_process";
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
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("Falta ELEVENLABS_API_KEY en produccion/remotion/.env (o usa efectos CC0: public/sfx-pro/LEEME.md)");
  process.exit(1);
}
const out = path.join(root, "public", "sfx-pro");
fs.mkdirSync(out, { recursive: true });
const ocultar = (t) => t.replace(/sk_[A-Za-z0-9]{20,}/g, "[clave]");

// nombre final ← [descripción, segundos, filtrar]
const SFX = {
  impacto: ["deep cinematic boom impact with sub bass, trailer hit, short reverb tail", 2.0, false],
  "moneda-suave": ["single gold coin dropping onto a wooden table, warm and soft", 1.2, true],
  "monedas-suave": ["a handful of gold coins pouring onto a pile of coins, warm and soft", 3.0, true],
};

for (const [name, [text, duration_seconds, filtrar]] of Object.entries(SFX)) {
  const destino = path.join(out, `${name}.mp3`);
  if (fs.existsSync(destino)) {
    console.log(`= ${name} (ya existe)`);
    continue;
  }
  const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, duration_seconds, prompt_influence: 0.5 }),
  });
  if (!r.ok) {
    console.error(`✗ ${name}: ${r.status} ${ocultar((await r.text()).slice(0, 200))}`);
    continue;
  }
  const crudo = path.join(out, `${name}.crudo.mp3`);
  fs.writeFileSync(crudo, Buffer.from(await r.arrayBuffer()));
  // sin agudos: lowpass a 4,2 kHz (las monedas) y normalización suave
  const af = filtrar ? "lowpass=f=4200,loudnorm=I=-18:TP=-2" : "loudnorm=I=-16:TP=-1.5";
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", crudo, "-af", af, "-ar", "44100", "-b:a", "192k", destino]);
  fs.unlinkSync(crudo);
  console.log(`✓ ${name}`);
}
