"""Genera el SQL de carga de los recursos de gerontogimnasia 11 a 30.

Fuente: business/claude_code_recursos_gerontogimnasia_11_30.md (apéndice,
transcripción fiel del docx de guiones). El documento usa los códigos GJ-0NN;
la app ya usa GER-0NN para los recursos 1 a 10, así que GJ-011 se carga como
GER-011 (el código GJ queda en las etiquetas internas).

Uso (desde la raíz del repo):
  python3 -I scripts/recursos/generar_ger_11_30.py

Escribe supabase/migrations/20261127010000_recursos_ger_11_30.sql
(idempotente: on conflict (codigo)). La duración real de cada video se mide
del archivo en assets/video-resources/ (mdls). El texto se copia literal:
solo se separan las secciones.
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
FUENTE = RAIZ / "business" / "claude_code_recursos_gerontogimnasia_11_30.md"
VIDEOS = RAIZ / "assets" / "video-resources"
SALIDA = RAIZ / "supabase" / "migrations" / "20261127010000_recursos_ger_11_30.sql"

SECCIONES_A = {
    "Materiales que debés tener listos": "materiales",
    "¿Cómo practicar este ejercicio?": "practica",
    "La ciencia detrás del movimiento": "ciencia",
    "Adaptá el ejercicio a tus capacidades": "adaptacion",
    "¡Sumale un reto cognitivo!": "reto",
    "Recomendaciones de seguridad": "seguridad",
}
PERFIL_A_ETAPA = {
    "Envejecimiento normal": "preventivo",
    "Deterioro cognitivo leve": "dcl",
    "Síntomas demenciales leves": "leve",
    "Síntomas demenciales moderados": "moderada",
    "Síntomas demenciales severos": "avanzada",
}
RUTA = {"Verde": "verde", "Amarilla": "amarillo", "Roja": "rojo"}

avisos: list[str] = []


def q(s):
    if s is None or s == "":
        return "null"
    assert "$c$" not in s
    return f"$c${s}$c$"


def qarr(xs):
    xs = [x for x in (xs or []) if x]
    return "null" if not xs else "array[" + ", ".join(q(x) for x in xs) + "]::text[]"


def qjson(o):
    return "null" if o is None else q(json.dumps(o, ensure_ascii=False)) + "::jsonb"


def sin_vineta(l: str) -> str:
    return re.sub(r"^-\s+", "", l.strip()).strip()


def bloques_por_recurso(texto: str) -> dict[int, list[str]]:
    """Corta el apéndice por recurso. El 29 viene como viñeta, no como título."""
    lineas = texto.split("\n")
    inicio = next(i for i, l in enumerate(lineas) if l.startswith("# Apéndice"))
    marcas = []
    for i in range(inicio, len(lineas)):
        m = re.match(r"^(?:##|-)\s*RECURSO N\.º (\d+)\s*[–-]", lineas[i].strip())
        if m:
            marcas.append((int(m.group(1)), i))
    out = {}
    for j, (n, i) in enumerate(marcas):
        fin = marcas[j + 1][1] if j + 1 < len(marcas) else len(lineas)
        out[n] = lineas[i + 1 : fin]
    return out


def campo(lineas, etiqueta):
    for l in lineas:
        t = sin_vineta(l)
        if t.startswith(etiqueta + ":"):
            return t[len(etiqueta) + 1 :].strip()
    return None


def tabla(lineas, primera_columna: set[str]) -> dict[str, str]:
    filas = {}
    for l in lineas:
        if l.startswith("|"):
            celdas = [c.strip() for c in l.strip().strip("|").split("|")]
            if len(celdas) >= 2 and celdas[0] in primera_columna:
                filas[celdas[0]] = celdas[1]
    return filas


def duracion_real(n: int) -> float:
    candidatos = [f for f in VIDEOS.glob("*.mp4") if re.match(rf"^Video 0?{n:02d}\b", unicodedata.normalize("NFC", f.name)) or re.match(rf"^Video {n:03d} ", unicodedata.normalize("NFC", f.name))]
    if len(candidatos) != 1:
        sys.exit(f"Recurso {n}: se esperaba un video, hay {len(candidatos)}: {[c.name for c in candidatos]}")
    out = subprocess.run(["mdls", "-raw", "-name", "kMDItemDurationSeconds", str(candidatos[0])], capture_output=True, text=True).stdout.strip()
    try:
        return float(out)
    except ValueError:
        sys.exit(f"Recurso {n}: no se pudo medir la duración de {candidatos[0].name}")


def parse(n: int, lineas: list[str]):
    codigo_doc = f"GJ-{n:03d}"
    codigo = f"GER-{n:03d}"
    # A (visible) y B (interno).
    iA = next(i for i, l in enumerate(lineas) if "A. Contenido visible" in l)
    iB = next(i for i, l in enumerate(lineas) if "B. Información interna" in l)
    A, B = lineas[iA + 1 : iB], lineas[iB + 1 :]

    titulo = campo(A, "Título").rstrip(". ").strip()
    subtitulo = campo(A, "Subtítulo")
    tiempo = campo(A, "Tiempo de práctica")
    secciones: dict[str, list[str]] = {}
    actual = None
    for l in A:
        t = re.sub(r"^#+\s*", "", sin_vineta(l)).strip()
        if t in SECCIONES_A:
            actual = SECCIONES_A[t]
            secciones[actual] = []
            continue
        if actual and l.strip().startswith("- "):
            secciones[actual].append(sin_vineta(l))
    faltan = [k for k in SECCIONES_A.values() if not secciones.get(k)]
    if faltan:
        sys.exit(f"{codigo_doc}: faltan secciones visibles {faltan}")

    # Ciencia: «¿Sabías que…?» primero, «Con este ejercicio…» al final y el enlace aparte.
    url = None
    frases = []
    for s in secciones["ciencia"]:
        m = re.match(r"^Consultar estudio científico:\s*(\S+)", s)
        if m:
            url = m.group(1)
        else:
            frases.append(s)
    gancho = frases[0]
    cierre = frases[-1] if len(frases) > 2 and re.match(r"^Con (este|esta) ", frases[-1]) else ""
    evidencia = frases[1 : len(frases) - (1 if cierre else 0)]
    ciencia = {"gancho": gancho, "evidencia": "\n".join(evidencia), "cierre": cierre}
    if url:
        ciencia["url"] = url

    reto = [s for s in secciones["reto"] if not s.startswith("Botón:")]

    # Duración de práctica: «3 a 5 minutos aproximadamente».
    m = re.match(r"^(\d+)\s*a\s*(\d+)\s*minutos", tiempo or "")
    dmin, dmax = (int(m.group(1)), int(m.group(2))) if m else (None, None)
    if not m:
        avisos.append(f"{codigo_doc}: tiempo de práctica sin formato «N a M minutos»: {tiempo!r}")

    # Perfil cognitivo y rutas (internos) → niveles para la asignación.
    perfiles = tabla(B, set(PERFIL_A_ETAPA))
    rutas = tabla(B, set(RUTA))
    if len(perfiles) != 5 or len(rutas) != 3:
        sys.exit(f"{codigo_doc}: tablas de perfil/rutas incompletas ({len(perfiles)}/{len(rutas)})")
    # «No asignar automáticamente» / «No recomendado» quedan fuera de la
    # asignación automática (la clínica decide con una pauta individual).
    niveles_cog = [PERFIL_A_ETAPA[p] for p, ind in perfiles.items() if not ind.lower().startswith("no")]
    # Ruta compatible salvo que diga «No» (muchas dicen solo la variante:
    # «Variante en silla…»). Una celda vacía se toma como compatible y se avisa.
    for r, comp in rutas.items():
        if not comp.strip():
            avisos.append(f"{codigo_doc}: ruta {r} sin dato en el documento; se tomó como compatible.")
    niveles_mot = [RUTA[r] for r, comp in rutas.items() if not comp.lower().startswith("no")]
    compat = campo(B, "Compatible con retos cognitivos") or ""
    doble = compat.lower().startswith("sí")

    # Interno: texto literal de la sección B, separado por partes.
    def limpio(ls):
        out = []
        for l in ls:
            s = l.rstrip()
            if not s.strip() or re.match(r"^\|\s*-", s.strip()):
                continue
            if s.startswith("|"):
                celdas = [c.strip() for c in s.strip().strip("|").split("|")]
                if celdas[0] in ("Perfil", "Ruta", "Tiempo"):
                    continue
                s = " · ".join(celdas)
            out.append(re.sub(r"^#+\s*", "", s).strip())
        return "\n".join(out).strip()

    def indice(pred, desde=0):
        for i in range(desde, len(B)):
            if pred(re.sub(r"^#+\s*", "", sin_vineta(B[i]))):
                return i
        return None

    i_tipo = indice(lambda t: t.startswith("Tipo de entrenamiento"))
    i_perfil = indice(lambda t: "Perfil cognitivo recomendado" in t)
    i_ref = indice(lambda t: t.startswith("Referencia científica"))
    i_guion = indice(lambda t: t.startswith("Guion N.º"))
    if None in (i_tipo, i_perfil, i_ref, i_guion):
        sys.exit(f"{codigo_doc}: no se encontraron las partes internas")
    objetivo = limpio(B[i_tipo:i_perfil])
    reglas = limpio([l for l in B[i_perfil:i_ref] if not sin_vineta(l).startswith("Enlace interno")])
    referencia = [sin_vineta(l) for l in B[i_ref + 1 : i_guion] if sin_vineta(l) and sin_vineta(l) != "---"]
    fuente = " ".join(referencia)
    doi = re.search(r"https?://doi\.org/\S+", fuente)
    fuente_url = doi.group(0).rstrip(".") if doi else url

    guion_ls = [l for l in B[i_guion:] if l.strip() != "---"]
    real = duracion_real(n)
    dur_doc = campo(B, "Duración del video")
    video_notas = limpio(guion_ls) + f"\nDuración real del archivo: {real:.1f} s (documento: {dur_doc})."

    categoria = (campo(B, "Categoría") or "").rstrip(".")
    nivel = campo(B, "Nivel de dificultad") or ""
    if not nivel:
        i_niv = indice(lambda t: t.startswith("Nivel de dificultad"))
        sub = []
        for l in B[i_niv + 1 :]:
            t = sin_vineta(l)
            if not l.strip().startswith("- ") or ":" not in t or t.startswith("Tipo de entrenamiento"):
                break
            sub.append(t)
        nivel = "; ".join(sub)
    pendientes = [a.split(": ", 1)[1] for a in avisos if a.startswith(codigo_doc + ":")]
    pendientes += ["Botón «Ir a nuestra tabla de retos cognitivos» no se muestra: la tabla está pendiente de desarrollo."]
    if re.search(r"segundos\s*\d", " ".join(guion_ls)):
        pendientes.append("El guion trae dos duraciones pegadas; se usa la duración real del archivo.")

    publico = {
        "codigo": q(codigo),
        "titulo": q(titulo),
        "detalle": q(subtitulo),
        "modulo": q("gerontogimnasia") + "::resource_modulo",
        "tipo": q("actividad") + "::task_tipo",
        "media_kind": q("video"),
        "storage_path": q(f"gerontogimnasia/ger-{n:03d}.mp4"),
        "poster_path": q(f"gerontogimnasia/ger-{n:03d}-poster.jpg"),
        "duracion": q(f"{dmin} a {dmax} min" if dmin else tiempo),
        "duracion_min": str(dmin) if dmin else "null",
        "duracion_max": str(dmax) if dmax else "null",
        "materiales": q("\n".join(secciones["materiales"])),
        "actividad": q("\n".join(f"• {s}" for s in secciones["practica"])),
        "ciencia": qjson(ciencia),
        "adaptacion": q("\n".join(secciones["adaptacion"])),
        "reto_cognitivo": q("\n".join(reto)),
        "ten_en_cuenta": q("\n".join(secciones["seguridad"])),
        "niveles_cognitivos": qarr(niveles_cog),
        "niveles_motores": qarr(niveles_mot),
        "permite_doble_tarea": "true" if doble else "false",
        "requiere_plan_individual": "false",
        "estado_clinico": q("aprobado"),
        "orden": str(n),
        "activo": "true",
    }
    interno = {
        "objetivo": q(objetivo),
        "areas_trabajo": qarr([categoria]),
        "reglas": q(reglas),
        "fuente": q(fuente),
        "fuente_url": q(fuente_url),
        "etiquetas": qarr([codigo_doc, f"Nivel de dificultad: {nivel.rstrip('.')}"]),
        "video_notas": q(video_notas),
        "pendientes": q(" ".join(pendientes)),
    }
    resumen = {"codigo": codigo, "doc": codigo_doc, "titulo": titulo, "real_s": round(real, 1), "doc_s": dur_doc, "cog": niveles_cog, "mot": niveles_mot, "doble": doble}
    return publico, interno, resumen


def upsert(publico, interno):
    cols = list(publico.keys())
    upd = ", ".join(f"{k} = excluded.{k}" for k in cols if k != "codigo")
    sql = f"insert into public.media_resources ({', '.join(cols)})\nvalues ({', '.join(publico[k] for k in cols)})\non conflict (codigo) do update set {upd}, updated_at = now();\n"
    icols = list(interno.keys())
    iupd = ", ".join(f"{k} = excluded.{k}" for k in icols)
    sql += (
        f"insert into public.media_resources_interno (resource_id, {', '.join(icols)})\n"
        f"select id, {', '.join(interno[k] for k in icols)} from public.media_resources where codigo = {publico['codigo']}\n"
        f"on conflict (resource_id) do update set {iupd}, updated_at = now();\n"
    )
    return sql


def main():
    bloques = bloques_por_recurso(FUENTE.read_text(encoding="utf-8"))
    faltan = [n for n in range(11, 31) if n not in bloques]
    if faltan:
        sys.exit(f"Recursos sin bloque en el documento: {faltan}")
    partes = [
        "-- Gerontogimnasia 11 a 30 (generado por scripts/recursos/generar_ger_11_30.py;",
        "-- no editar a mano). Fuente: business/claude_code_recursos_gerontogimnasia_11_30.md.",
        "-- Columna nueva: reto_cognitivo («¡Sumale un reto cognitivo!», visible).",
        "alter table public.media_resources add column if not exists reto_cognitivo text;",
        "",
    ]
    resumen = []
    for n in range(11, 31):
        p, i, r = parse(n, bloques[n])
        partes.append(f"-- {r['doc']} → {r['codigo']} · {r['titulo']}")
        partes.append(upsert(p, i))
        resumen.append(r)
    SALIDA.write_text("\n".join(partes), encoding="utf-8")
    for r in resumen:
        print(json.dumps(r, ensure_ascii=False))
    for a in avisos:
        print("AVISO", a)


if __name__ == "__main__":
    main()
