// Renderiza varios fotogramas sueltos con un solo empaquetado y un solo navegador (revisión rápida).
// Uso (desde produccion/remotion): node scripts/stills.mjs <carpeta_salida> Comp:frame [Comp:frame …]
// Mismo navegador que remotion.config.ts: REMOTION_CHROME, Google Chrome de macOS o el Chrome for Testing
// que descarga Remotion; OpenGL "angle" en macOS y "swangle" en el resto (REMOTION_GL lo cambia).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [outDir, ...items] = process.argv.slice(2);
if (!outDir || !items.length) {
  console.error("Uso: node scripts/stills.mjs <carpeta_salida> Comp:frame [Comp:frame …]");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browserExecutable = process.env.REMOTION_CHROME || (process.platform === "darwin" && fs.existsSync(MAC_CHROME) ? MAC_CHROME : null);
const chromiumOptions = { gl: process.env.REMOTION_GL || (process.platform === "darwin" ? "angle" : "swangle") };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions, chromeMode: "chrome-for-testing" });
for (const it of items) {
  const [id, fr] = it.split(":");
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance });
  const output = path.join(outDir, `${id}_${fr}.png`);
  await renderStill({ composition, serveUrl, output, frame: Number(fr), puppeteerInstance });
  console.log("✓", output);
}
await puppeteerInstance.close({ silent: true });
