// Genera con ElevenLabs (text-to-sound) los cinco efectos que admite el motor, en public/sfx-pro/, y les quita
// los agudos (paso bajo a 4,2 kHz) para que no suenen metálicos bajo la voz.
// Uso (desde produccion/remotion): node scripts/sfx-elevenlabs.mjs [--pisar] [nombre …]
//   Sin nombres genera los que falten; --pisar los rehace aunque existan. Gasta créditos de tu cuenta.
// Necesita ffmpeg y una clave de ElevenLabs (ver scripts/claves.mjs).
// LICENCIA: los efectos generados con el plan gratuito de ElevenLabs NO permiten uso comercial (y piden
// atribución); con un plan de pago sí. Alternativa sin licencias de por medio: efectos CC0 (references/audio.md).
// Prohibidos (el motor los rechaza): whoosh, riser, barridos de aire, arena, tictac, brillos, despertador.
// Se oyen como viento en el micrófono o como un chirrido metálico sobre la voz.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { API, claves, exigirClaves, headersDe, ocultar, root } from "./claves.mjs";

exigirClaves();
const out = path.join(root, "public", "sfx-pro");
fs.mkdirSync(out, { recursive: true });

// nombre: [descripción para el generador, segundos]
const SFX = {
  impacto: ["deep cinematic boom impact with sub bass, trailer hit, short dark reverb tail, no high frequencies", 2.0],
  "impacto-grave": ["very deep dull sub bass thud, heavy body hit, muffled, no click, no high frequencies", 1.5],
  "pop-grave": ["single soft low pop, muted bubble pop, deep and round, very short, no click", 0.5],
  "moneda-suave": ["single coin dropping onto a wooden table, soft and muffled", 1.2],
  "monedas-suave": ["handful of coins poured onto a soft pile of coins, muffled, warm", 2.5],
};

const pisar = process.argv.includes("--pisar");
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const lista = Object.entries(SFX).filter(([n]) => (pedidos.length ? pedidos.includes(n) : true));
const ffmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (ffmpeg.status !== 0) {
  console.error("✗ falta ffmpeg (hace falta para filtrar los agudos)");
  process.exit(1);
}

let actual = 0;
for (const [name, [text, duration_seconds]] of lista) {
  const destino = path.join(out, `${name}.mp3`);
  if (fs.existsSync(destino) && !pisar) {
    console.log(`= ${name} ya existe (usa --pisar para rehacerlo)`);
    continue;
  }
  let audio = null;
  while (!audio && actual < claves.length) {
    const r = await fetch(`${API}/sound-generation`, {
      method: "POST",
      headers: headersDe(claves[actual]),
      body: JSON.stringify({ text, duration_seconds, prompt_influence: 0.5 }),
    });
    if (r.ok) {
      audio = Buffer.from(await r.arrayBuffer());
      break;
    }
    const txt = ocultar(await r.text());
    if (/unusual/i.test(txt)) {
      console.error(`✗ ${claves[actual].nombre}: ElevenLabs marcó actividad inusual. Me detengo.`);
      process.exit(1);
    }
    if (/quota_exceeded|invalid_api_key|missing_permissions/.test(txt) || r.status === 401) {
      console.log(`  · ${claves[actual].nombre}: ${txt.slice(0, 120)} → paso a la siguiente clave`);
      actual++;
      continue;
    }
    console.error(`✗ ${name}: ${r.status} ${txt.slice(0, 200)}`);
    break;
  }
  if (!audio) continue;
  const crudo = path.join(out, `${name}.crudo.mp3`);
  fs.writeFileSync(crudo, audio);
  const f = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", crudo, "-af", "lowpass=f=4200,lowpass=f=4200", "-ar", "44100", "-b:a", "192k", destino]);
  fs.rmSync(crudo, { force: true });
  console.log(f.status === 0 ? `✓ ${name}` : `✗ ${name}: ffmpeg falló`);
}
console.log("Escúchalos antes de usarlos: si alguno suena a aire, a brillo o a clic, descártalo y repítelo con --pisar.");
