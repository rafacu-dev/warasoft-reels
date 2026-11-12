# Masteriza el audio de un render a −14 LUFS (loudnorm en dos pasadas, pico −1,5 dBTP) sin tocar el vídeo.
# Uso: python3 scripts/master.py <entrada.mp4> <salida.mp4>
# Además deja una copia ligera para el móvil (~13 MB, crf 24) en la subcarpeta movil/ junto a la salida.
import json
import os
import re
import subprocess
import sys

src, out = sys.argv[1], sys.argv[2]
target = "I=-14:TP=-1.5:LRA=11"
err = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.findall(r"\{[^{}]+\}", err)[-1])
second = (
    f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
    f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-c:v", "copy", "-af", second, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", out], check=True)
err = subprocess.run(["ffmpeg", "-hide_banner", "-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
i = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]
tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1]
print(f"{out}: {i} LUFS integrado, pico real {tp} dBTP")

movil_dir = os.path.join(os.path.dirname(os.path.abspath(out)), "movil")
os.makedirs(movil_dir, exist_ok=True)
movil = os.path.join(movil_dir, os.path.basename(out).replace(".mp4", "_movil.mp4"))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-c:v", "libx264", "-crf", "24", "-preset", "medium",
                "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", movil], check=True)
print(f"{movil}: {os.path.getsize(movil) / 1e6:.1f} MB")
