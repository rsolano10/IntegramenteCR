"""Videos de gerontogimnasia: asocia, transcodifica y (con --subir) sube a storage.

Uso (desde la raíz del repo):
  python3 -I scripts/recursos/videos.py                # asocia y transcodifica
  python3 -I scripts/recursos/videos.py --subir        # además sube al bucket
  python3 -I scripts/recursos/videos.py --desde 11 --subir   # solo del 11 en adelante

Originales en assets/video-resources/ con el mismo nombre que en Drive (no se
renombran; assets/ está en .gitignore). Salida en assets/video-out/ con
nombres seguros: ger-0NN.mp4 y ger-0NN-poster.jpg. Del 1 al 10 se llaman
«GER-0NN …»; del 11 al 30, «Video 0NN - …». Se detiene si dos archivos
apuntan al mismo código o si algún código queda sin video; los demás videos
de la carpeta (intro-app, promoción…) se ignoran.
"""
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ORIGEN = RAIZ / "assets" / "video-resources"
DESTINO = RAIZ / "assets" / "video-out"
SWIFT = RAIZ / "scripts" / "recursos" / "transcodificar.swift"
BUCKET = "media-resources"
CARPETA = "gerontogimnasia"
CODIGOS = [f"GER-{n:03d}" for n in range(1, 31)]
INTRO = unicodedata.normalize("NFC", "Introducción Gerontogimnasia")


def codigo_de(nombre: str):
    n = unicodedata.normalize("NFC", nombre).strip()
    m = re.match(r"^GER-(\d{3})", n) or re.match(r"^Video (\d{3})\b", n)
    if m:
        return f"GER-{m.group(1)}"
    if Path(n).stem.strip() == INTRO:
        return "GER-010"
    return None


def main():
    subir = "--subir" in sys.argv
    desde = int(sys.argv[sys.argv.index("--desde") + 1]) if "--desde" in sys.argv else 1
    asociados, sueltos = {}, []
    for f in sorted(ORIGEN.glob("*.mp4")):
        c = codigo_de(f.name)
        if c is None:
            continue  # otros videos de la carpeta
        if c not in CODIGOS:
            sueltos.append(f.name)
        elif c in asociados:
            sueltos.append(f"{f.name} (código repetido {c})")
        else:
            asociados[c] = f
    faltan = [c for c in CODIGOS if c not in asociados]
    if sueltos or faltan:
        print("No se pudo asociar:", sueltos or "-", "| Sin video:", faltan or "-")
        sys.exit(1)

    DESTINO.mkdir(parents=True, exist_ok=True)
    for c in CODIGOS[desde - 1 :]:
        base = c.lower()
        mp4, jpg = DESTINO / f"{base}.mp4", DESTINO / f"{base}-poster.jpg"
        if not mp4.exists():
            subprocess.run(["swift", str(SWIFT), str(asociados[c]), str(mp4), str(jpg)], check=True)
        print(f"{c}\t{asociados[c].name}\t{mp4.stat().st_size / 1e6:.1f} MB")
        if subir:
            for archivo in (mp4, jpg):
                subprocess.run(
                    ["supabase", "storage", "cp", "--experimental", "--linked", str(archivo),
                     f"ss:///{BUCKET}/{CARPETA}/{archivo.name}", "--cache-control", "max-age=31536000"],
                    check=True,
                )


if __name__ == "__main__":
    main()
