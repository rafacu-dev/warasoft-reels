import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

// La cámara 2.5D (src/Parallax.tsx) es un shader WebGL: en macOS necesita ANGLE.
Config.setChromiumOpenGlRenderer("angle");

// Navegador para renderizar: un Chrome completo (WebGL con GPU).
//  · REELS_CHROME, si la defines, con la ruta del ejecutable;
//  · si no, tu Google Chrome instalado en /Applications;
//  · si no tienes Chrome, Remotion descarga "Chrome for Testing" la primera vez que renderizas.
const GOOGLE_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
Config.setChromeMode("chrome-for-testing");
const chrome = process.env.REELS_CHROME || (existsSync(GOOGLE_CHROME) ? GOOGLE_CHROME : "");
if (chrome) Config.setBrowserExecutable(chrome);
