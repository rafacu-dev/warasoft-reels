#!/bin/bash
# Prepara este Mac para reel-diorama:
#   1. comprueba Apple Silicon, memoria, disco y herramientas (Node, Python, ffmpeg);
#   2. crea un entorno de Python en $REELS_IMG_VENV (por defecto ~/imggen/.venv) con mflux, que trae
#      Z-Image Turbo (imágenes) y Depth Pro (profundidad) sobre MLX;
#   3. descarga los modelos (≈33 GB de Z-Image Turbo y ≈1,9 GB de Depth Pro), para que la primera imagen de la
#      cola no se quede esperando la descarga.
# Uso: bash preparar-entorno.sh [--comprobar] [--sin-modelos]
#   --comprobar    solo dice qué falta; no instala ni descarga nada
#   --sin-modelos  instala el entorno pero no descarga los modelos (se bajarán con la primera imagen)
# No necesita sudo y se puede repetir: lo que ya está hecho no se vuelve a hacer.
set -uo pipefail

VENV="${REELS_IMG_VENV:-$HOME/imggen/.venv}"
MFLUX="${REELS_MFLUX_VERSION:-0.24.0}"  # versión probada con este kit
COMPROBAR=0
MODELOS=1
for a in "$@"; do
  case "$a" in
    --comprobar) COMPROBAR=1 ;;
    --sin-modelos) MODELOS=0 ;;
    *) echo "Uso: bash preparar-entorno.sh [--comprobar] [--sin-modelos]"; exit 2 ;;
  esac
done
ok() { echo "✓ $*"; }
aviso() { echo "⚠ $*"; }
mal() { echo "✗ $*"; FALTA=1; }
FALTA=0

# ---------------------------------------------------------------- 1. el Mac
if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  echo "✗ Este kit genera las imágenes con MLX y necesita un Mac con Apple Silicon (M1 o posterior)."
  exit 1
fi
RAM=$(( $(sysctl -n hw.memsize) / 1073741824 ))
if [ "$RAM" -ge 32 ]; then ok "memoria: $RAM GB"
elif [ "$RAM" -ge 24 ]; then aviso "memoria: $RAM GB. Puede ir justo: el generador con --low-ram llega a ≈18 GB. Cierra apps pesadas o usa REELS_IMG_QUANTIZE=4."
else aviso "memoria: $RAM GB. No recomendado: el generador con --low-ram llega a ≈18 GB. Prueba REELS_IMG_QUANTIZE=4 bajo tu responsabilidad."
fi
LIBRE=$(df -g "$HOME" | awk 'NR==2 {print $4}')
if [ "$LIBRE" -ge 45 ]; then ok "disco libre: $LIBRE GB"
else aviso "disco libre: $LIBRE GB. Los modelos ocupan ≈35 GB y cada video ≈0,5 GB de imágenes: deja al menos 45 GB."
fi

# ---------------------------------------------------------------- herramientas
if command -v node >/dev/null; then
  NODE=$(node -p 'process.versions.node.split(".")[0]')
  [ "$NODE" -ge 20 ] && ok "Node $(node -v)" || mal "Node $(node -v): hace falta 20 o superior (https://nodejs.org)"
else mal "falta Node.js 20+ (https://nodejs.org o: brew install node)"; fi
if command -v python3 >/dev/null && python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))'; then ok "Python $(python3 -V | cut -d' ' -f2)"
else mal "falta Python 3.10+ (https://www.python.org o: brew install python)"; fi
command -v ffmpeg >/dev/null && ok "ffmpeg" || mal "falta ffmpeg (brew install ffmpeg)"
command -v memory_pressure >/dev/null || aviso "no encuentro memory_pressure: la cola no podrá medir la memoria libre"

# ---------------------------------------------------------------- 2. entorno de imágenes
if [ -x "$VENV/bin/mflux-generate-z-image-turbo" ] && [ -x "$VENV/bin/mflux-save-depth" ]; then
  ok "entorno de imágenes en $VENV ($("$VENV/bin/python" -c 'import importlib.metadata as m; print("mflux", m.version("mflux"))' 2>/dev/null))"
elif [ "$COMPROBAR" = 1 ]; then
  mal "falta el entorno de imágenes en $VENV (ejecuta este script sin --comprobar)"
else
  echo "· creando el entorno de imágenes en $VENV (mflux $MFLUX)…"
  mkdir -p "$(dirname "$VENV")"
  if command -v uv >/dev/null; then
    uv venv --python 3.12 "$VENV" && uv pip install --python "$VENV/bin/python" "mflux==$MFLUX" || { mal "no se pudo instalar mflux con uv"; exit 1; }
  else
    PY=""
    for c in python3.13 python3.12 python3.11 python3; do
      if command -v "$c" >/dev/null && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then PY="$c"; break; fi
    done
    [ -z "$PY" ] && { mal "mflux necesita Python 3.11+ (o instala uv: https://docs.astral.sh/uv/)"; exit 1; }
    "$PY" -m venv "$VENV" && "$VENV/bin/pip" install --upgrade pip >/dev/null && "$VENV/bin/pip" install "mflux==$MFLUX" || { mal "no se pudo instalar mflux"; exit 1; }
  fi
  ok "entorno de imágenes listo"
fi

# ---------------------------------------------------------------- 3. modelos
if [ "$MODELOS" = 1 ] && [ -x "$VENV/bin/python" ]; then
  if [ "$COMPROBAR" = 1 ]; then
    "$VENV/bin/python" - <<'PY'
from pathlib import Path
try:
    from huggingface_hub import scan_cache_dir
    z = [r for r in scan_cache_dir().repos if r.repo_id == "Tongyi-MAI/Z-Image-Turbo"]
    print(f"✓ Z-Image Turbo en caché ({z[0].size_on_disk / 1e9:.0f} GB)" if z and z[0].size_on_disk > 20e9 else "⚠ Z-Image Turbo sin descargar (ejecuta este script sin --comprobar)")
except Exception:
    print("⚠ no pude mirar la caché de Hugging Face")
from mflux.models.common.weights.loading.weight_loader import MFLUX_CACHE_DIR
p = Path(MFLUX_CACHE_DIR) / "depth_pro" / "depth_pro.pt"
print("✓ Depth Pro en caché" if p.exists() else "⚠ Depth Pro sin descargar (ejecuta este script sin --comprobar)")
PY
  else
    echo "· descargando los modelos (≈35 GB la primera vez; se puede cortar y reanudar)…"
    "$VENV/bin/python" - <<'PY' || mal "la descarga de modelos falló; vuelve a lanzar el script para reanudarla"
from huggingface_hub import snapshot_download
REPO = "Tongyi-MAI/Z-Image-Turbo"
try:  # la misma revisión y los mismos archivos que pide mflux
    from mflux.models.common.resolution.model_revisions import ModelRevisions
    rev = ModelRevisions.get(REPO)
except Exception:
    rev = None
try:
    from mflux.models.z_image.weights.z_image_weight_definition import ZImageWeightDefinition
    pats = ZImageWeightDefinition.get_download_patterns()
except Exception:
    pats = ["vae/*", "transformer/*", "text_encoder/*", "tokenizer/*"]
snapshot_download(REPO, revision=rev, allow_patterns=pats)
print("✓ Z-Image Turbo descargado")
from mflux.models.common.weights.loading.weight_loader import WeightLoader
WeightLoader._download_from_url("https://ml-site.cdn-apple.com/models/depth-pro/depth_pro.pt", "depth_pro")
print("✓ Depth Pro descargado")
PY
  fi
fi

echo
echo "Licencias de los modelos: Z-Image Turbo (Tongyi-MAI) es Apache 2.0; Depth Pro usa la licencia de Apple del"
echo "repositorio apple/ml-depth-pro (léela antes de un uso comercial); mflux es MIT."
if [ "$FALTA" = 1 ]; then echo "Falta algo (✗): resuélvelo y vuelve a lanzar el script."; exit 1; fi
echo "Listo. Si tu entorno no está en ~/imggen/.venv, exporta REELS_IMG_VENV=\"$VENV\" en tu ~/.zshrc."
