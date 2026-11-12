// ¿Existe un archivo en public/? Sirve para que un video se pueda montar y mirar antes de tener todo:
// sin imagen se ve un plano provisional, y sin música, efectos o voz el video simplemente no suena.
// La cola (nuevo-video.py cola render) se niega a renderizar una entrega con planos o voz pendientes.
import { getStaticFiles } from "remotion";

let lista: unknown = null;
let nombres = new Set<string>();

export const existe = (rel: string): boolean => {
  const files = typeof window === "undefined" ? [] : getStaticFiles();
  if (!files.length) return true; // sin lista (fuera del Studio y del render) se asume que existe
  if (files !== lista) {
    lista = files;
    nombres = new Set(files.map((f) => f.name.replace(/^\.\//, "")));
  }
  return nombres.has(rel.replace(/^\//, ""));
};
