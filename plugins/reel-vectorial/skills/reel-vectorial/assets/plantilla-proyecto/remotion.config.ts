// Configuración de Remotion para el kit vectorial (skill reel-vectorial).
// Navegador: los fondos con shaders (src/kit/shaders.tsx) necesitan WebGL, así que se usa Chrome completo
// ("chrome-for-testing") y no el modo sin cabeza ligero.
//  · REMOTION_CHROME=/ruta/a/chrome usa ese ejecutable.
//  · Si no, en macOS usa Google Chrome si está instalado en /Applications.
//  · Si no hay ninguno, Remotion descarga su Chrome for Testing la primera vez (unos cientos de MB).
// OpenGL: "angle" en macOS (GPU); "swangle" (por software, más lento pero funciona en cualquier sitio) en
// Linux y Windows. Se cambia con REMOTION_GL=angle|swangle|egl|angle-egl|swiftshader|vulkan.
import { Config } from "@remotion/cli/config";
import fs from "node:fs";

const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = process.env.REMOTION_CHROME || (process.platform === "darwin" && fs.existsSync(MAC_CHROME) ? MAC_CHROME : null);
if (chrome) Config.setBrowserExecutable(chrome);
Config.setChromeMode("chrome-for-testing");
type Gl = "angle" | "swangle" | "egl" | "angle-egl" | "swiftshader" | "vulkan";
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as Gl) || (process.platform === "darwin" ? "angle" : "swangle"));
