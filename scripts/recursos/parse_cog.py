"""Parser del manual de recursos cognitivos (docs/content-source/cognitivo-manual.txt).

Texto literal: solo se separan secciones, viñetas y tablas. Lo usa
generar_contenido.py; es el mismo parser con el que se cargó el manual.
"""
import re
from pathlib import Path

HEADINGS = {
    "objetivo": "objetivo",
    "¿para quién?": "para_quien",
    "materiales": "materiales",
    "lo que verá el familiar en la app": "intro",
    "cómo realizarla": "pasos",
    "¿cómo realizarla?": "pasos",
    "si necesita ayuda": "ayuda",
    "progresión": "progresion",
    "adaptación": "adaptacion",
    "adaptaciones": "adaptacion",
    "precauciones": "precauciones",
    "precaución": "precauciones",
    "la ciencia detrás de esta actividad": "ciencia",
    "¿qué estamos estimulando?": "estimula",
    "objetivo esperado": "objetivo_esperado",
    "configuración para la app": "config",
    "ejemplo para practicar": "ejemplo",
    "ejemplos para conversar": "ejemplo",
    "ejemplo": "ejemplo",
    "tarjetas que se incluirán en el recurso": "tarjetas",
}
CONFIG_KEYS = {"duración": "duracion", "frecuencia": "frecuencia", "reglas": "reglas", "etiquetas": "etiquetas"}
NOISE = {"campo", "contenido", "principio del formulario", "final del formulario", "", "*"}


def clean(l: str) -> str:
    l = l.replace("\t", " ").replace(" ", " ")
    l = re.sub(r"^(?:[•·\-\*\.]\s*)+", "", l.strip())
    return re.sub(r"\s+", " ", l).strip()


def heading_of(l: str):
    k = clean(l).rstrip(":").lower()
    return HEADINGS.get(k)


ACT_RE = re.compile(r"^Actividad\s+(\d+)\s*[-–—]\s*(.+)$")
SECTION_RE = {"reminiscencia:": "reminiscencia", "atención, memoria y funciones ejecutivas:": "cognicion"}

def tabla(lines, columnas_n, modo, titulo):
    """Tablas exportadas una celda por línea: [intro] + encabezados + filas + [cierre]."""
    lines = list(lines)
    intro = None
    # Las filas empiezan después de los encabezados. En el ejemplo de la
    # actividad 10 la primera línea es una frase de introducción.
    if lines and lines[0].startswith("Vamos a"):
        intro = lines.pop(0)
    cierre = None
    if lines and lines[-1].startswith("Después"):
        cierre = lines.pop()
    columnas = lines[:columnas_n]
    celdas = lines[columnas_n:]
    assert len(celdas) % columnas_n == 0, (titulo, len(celdas))
    filas = [celdas[i : i + columnas_n] for i in range(0, len(celdas), columnas_n)]
    ex = {"modo": modo, "titulo": titulo, "columnas": columnas, "filas": filas}
    if intro:
        ex["intro"] = intro
    if cierre:
        ex["cierre"] = cierre
    return ex


EXTRAS = {
    10: lambda s: tabla(s["ejemplo"], 2, "tabla", "Ejemplo para practicar"),
    12: lambda s: tabla(s["ejemplo"], 3, "tabla", "Ejemplos para conversar"),
    13: lambda s: tabla(s["tarjetas"], 3, "tarjetas", "Tarjetas de refranes"),
}


def parsear(ruta: Path):
    raw = Path(ruta).read_text(encoding="utf-8")
    raw = raw.replace("\u2028", "\n").replace("\r", "\n")
    lines = [l.strip() for l in raw.split("\n")]
    acts = []
    modulo = None
    cur = None
    sec = None
    for line in lines:
        c = clean(line)
        if c.lower() in SECTION_RE:
            modulo = SECTION_RE[c.lower()]
            continue
        m = ACT_RE.match(c)
        if m:
            num = int(m.group(1))
            if cur and cur["num"] == num:  # título repetido (Actividad 10)
                continue
            cur = {"num": num, "titulo": m.group(2).strip(), "modulo": modulo, "secs": {}}
            acts.append(cur)
            sec = None
            continue
        if cur is None:
            continue
        h = heading_of(line)
        # "Objetivo" como título vs. la palabra dentro de una tabla de config: solo
        # cuenta como encabezado fuera de config.
        if h and not (sec == "config" and h not in ("tarjetas", "ejemplo")):
            sec = h
            cur["secs"].setdefault(sec, [])
            continue
        if c.lower() in NOISE:
            continue
        # Actividad 01: la configuración viene sin su encabezado, justo después
        # del objetivo esperado.
        if sec == "objetivo_esperado" and c.lower() in CONFIG_KEYS:
            sec = "config"
            cur["secs"].setdefault(sec, [])
        # Actividad 02: el texto para el familiar no tiene encabezado propio.
        if c.startswith("Hoy realizaremos") and sec != "intro":
            cur["secs"].setdefault("intro", []).append(c)
            continue
        cur["secs"].setdefault(sec or "_sin_seccion", []).append(c)

    # Config: pares clave/valor en líneas sucesivas o "Clave valor" en la misma.
    for a in acts:
        cfg = {}
        key = None
        for l in a["secs"].get("config", []):
            low = l.lower()
            hit = next((k for k in CONFIG_KEYS if low == k or low.startswith(k + " ")), None)
            if hit:
                key = CONFIG_KEYS[hit]
                rest = l[len(hit):].strip()
                cfg[key] = [rest] if rest else []
            elif key:
                cfg[key].append(l)
        a["config"] = {k: " ".join(v).strip() for k, v in cfg.items()}


    for a in acts:
        a["extras"] = EXTRAS[a["num"]](a["secs"]) if a["num"] in EXTRAS else None
    return acts
