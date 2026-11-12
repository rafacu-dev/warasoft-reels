// Claves de ElevenLabs para los scripts de voz y efectos (skill reel-vectorial).
// Se leen, por este orden, de:
//   1. las variables de entorno ya definidas;
//   2. produccion/remotion/.env de la cuenta (opcional: para que una cuenta use otra voz u otras claves);
//   3. .env de la raíz del proyecto (el que crea montar-cuenta.py; sirve para todas las cuentas).
// Variables:
//   ELEVENLABS_API_KEY y, si hay más cuentas, ELEVENLABS_API_KEY_2, _3… (se usan en ese orden)
//   ELEVENLABS_VOICE_ID   la voz (elígela con: node scripts/voz-elevenlabs.mjs --voces)
//   ELEVENLABS_DESDE=N    opcional: empieza por la clave N (para saltar cuentas ya agotadas)
// Las claves nunca se imprimen: los mensajes de error pasan por `ocultar`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // produccion/remotion
export const proyecto = path.resolve(root, "../../../.."); // remotion → produccion → cuenta → cuentas → raíz

for (const envFile of [path.join(root, ".env"), path.join(proyecto, ".env")]) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    const v = m ? m[2].trim().replace(/^["']|["']$/g, "") : "";
    if (m && v && !process.env[m[1]]) process.env[m[1]] = v;
  }
}

export const claves = Object.keys(process.env)
  .map((k) => k.match(/^ELEVENLABS_API_KEY(?:_(\d+))?$/))
  .filter(Boolean)
  .map((m) => ({ nombre: m[0], n: Number(m[1] ?? 1), valor: process.env[m[0]].trim() }))
  .filter((c) => c.valor && c.n >= Number(process.env.ELEVENLABS_DESDE ?? 1))
  .sort((a, b) => a.n - b.n);

export const API = "https://api.elevenlabs.io/v1";
export const headersDe = (c) => ({ "xi-api-key": c.valor, "Content-Type": "application/json" });
export const ocultar = (t) => String(t).replace(/sk_[A-Za-z0-9]{20,}/g, "[clave]");

export const exigirClaves = () => {
  if (claves.length) return;
  console.error(
    "Falta ELEVENLABS_API_KEY. Pégala tú (no en el chat) en el .env de la raíz del proyecto\n" +
      `(${path.join(proyecto, ".env")}) o en ${path.join(root, ".env")}. Sin clave, sigue con la voz simulada.`,
  );
  process.exit(1);
};
