#!/bin/bash
# Ejecuta un comando pesado respetando el turno de la máquina: el mismo candado que usa scripts/noche.py en
# todas las cuentas del proyecto. Espera a que no haya otra tarea pesada y a que haya memoria libre suficiente.
# Uso (desde cualquier sitio): cuentas/<cuenta>/produccion/remotion/scripts/turno.sh <comando> [args…]
#   p. ej. scripts/turno.sh npx remotion still Demo01-tostada out.png --frame=0
# El comando se ejecuta dentro de produccion/remotion.
# Variables opcionales:
#   REELS_LOCK       ruta del candado (por defecto <proyecto>/recursos/turno-mac.lock)
#   REELS_LIBRE_MIN  % de memoria libre para empezar (por defecto 45)
cd "$(dirname "$0")/.." || exit 1
PROYECTO="$(cd ../../../.. && pwd)"  # remotion → produccion → cuenta → cuentas → raíz del proyecto
LOCK="${REELS_LOCK:-$PROYECTO/recursos/turno-mac.lock}"
LIBRE_MIN="${REELS_LIBRE_MIN:-45}"
mkdir -p "$(dirname "$LOCK")"

libre() {
  if command -v memory_pressure >/dev/null 2>&1; then  # macOS
    memory_pressure | awk '/free percentage/{gsub("%","",$NF); print $NF}'
  elif [ -r /proc/meminfo ]; then  # Linux
    awk '/^MemTotal/{t=$2} /^MemAvailable/{a=$2} END{if (t) print int(a*100/t); else print 100}' /proc/meminfo
  else
    echo 100
  fi
}

avisado=""
until [ "$(libre)" -ge "$LIBRE_MIN" ] 2>/dev/null && mkdir "$LOCK" 2>/dev/null; do
  # candado huérfano (un proceso que murió sin soltarlo): se libera a las 3 h
  if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +180 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null
    continue
  fi
  if [ -z "$avisado" ]; then
    echo "· turno: esperando (otra tarea pesada en marcha o menos del ${LIBRE_MIN} % de memoria libre)…" >&2
    avisado=1
  fi
  sleep 20
done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
"$@"
