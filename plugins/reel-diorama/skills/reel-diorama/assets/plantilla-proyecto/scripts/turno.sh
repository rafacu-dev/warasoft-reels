#!/bin/bash
# Ejecuta un comando pesado respetando el turno del Mac: el mismo candado que la cola (scripts/noche.py) de todas
# las cuentas del proyecto. Espera a que no haya otra tarea pesada y a que haya memoria libre.
# Uso (desde cualquier carpeta; usa rutas absolutas en lo que le pases, porque cambia a produccion/remotion):
#   scripts/turno.sh npx remotion still <Composición> /ruta/absoluta/f0.png --frame=0
# Variables opcionales: REELS_TURNO_LOCK (ruta del candado; por defecto <proyecto>/recursos/turno-mac.lock)
#                       REELS_TURNO_LIBRE (% de memoria libre para empezar; 45 por defecto)
cd "$(dirname "$0")/.." || exit 1
LOCK="${REELS_TURNO_LOCK:-$(cd ../../../.. && pwd)/recursos/turno-mac.lock}"  # remotion → produccion → cuenta → cuentas → proyecto
MIN="${REELS_TURNO_LIBRE:-45}"
mkdir -p "$(dirname "$LOCK")"
libre() { memory_pressure 2>/dev/null | awk '/free percentage/{gsub("%","",$NF); print $NF}'; }
avisado=""
until [ "$(libre)" -ge "$MIN" ] 2>/dev/null && mkdir "$LOCK" 2>/dev/null; do
  # candado huérfano (un proceso que murió hace más de 3 h): se libera
  if [ -d "$LOCK" ] && [ $(( $(date +%s) - $(stat -f %m "$LOCK") )) -gt 10800 ]; then rmdir "$LOCK" 2>/dev/null; continue; fi
  [ -z "$avisado" ] && { echo "· esperando el turno del Mac (otra tarea pesada o poca memoria libre)…" >&2; avisado=1; }
  sleep 20
done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
"$@"
