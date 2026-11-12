#!/bin/bash
# Genera los planos de este video con Z-Image Turbo (mflux), en local. Mejor a través de la cola del Mac:
#   python3 <skill>/scripts/nuevo-video.py cola <cuenta> imagenes <carpeta>   (noche.py → img <carpeta> <plano> <semilla>)
# Uso directo, solo si no hay nada pesado en marcha: ./generar.sh [semilla=11] [plano]
# El estilo común de la cuenta vive en ../estilo-prompt.txt; aquí solo van las escenas (planos.tsv).
# Entorno: REELS_IMG_VENV (por defecto ~/imggen/.venv) · REELS_IMG_QUANTIZE (8 por defecto; 4 = menos memoria)
cd "$(dirname "$0")" || exit 1
SEED=${1:-11}
GEN="${REELS_IMG_VENV:-$HOME/imggen/.venv}/bin/mflux-generate-z-image-turbo"
[ -x "$GEN" ] || { echo "✗ falta $GEN: prepara el entorno con scripts/preparar-entorno.sh de la skill" >&2; exit 1; }
STYLE=$(tr -d '\n' < ../estilo-prompt.txt)
fallos=0
while IFS=$'\t' read -r name desc; do
  [ -z "$name" ] && continue
  [ -n "$2" ] && [[ "$name" != $2 ]] && continue
  [ -f "$name-s$SEED.png" ] && { echo "= $name-s$SEED (ya existe)"; continue; }
  if "$GEN" --quantize "${REELS_IMG_QUANTIZE:-8}" --low-ram --steps 9 --seed "$SEED" --width 1152 --height 2048 \
       --prompt "$STYLE. $desc" --output "$name-s$SEED.png" </dev/null >"$name-s$SEED.log" 2>&1; then
    echo "✓ $name-s$SEED"
    rm -f "$name-s$SEED.log"
  else
    echo "✗ $name-s$SEED (el error está en $name-s$SEED.log)"
    fallos=1
  fi
done < planos.tsv
exit $fallos
