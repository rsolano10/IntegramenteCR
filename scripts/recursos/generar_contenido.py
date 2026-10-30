"""Genera el SQL de carga de GER, PRE y COG (business/integramente-recursos-spec.md).

Uso (desde la raíz del repo):
  python3 -I scripts/recursos/generar_contenido.py

Lee docs/content-source/*.txt (exportados de los .docx con textutil) y escribe
supabase/migrations/20261031020000_recursos_contenido.sql (idempotente) y
docs/content-review/erratas-detectadas.txt. El texto clínico se transcribe
literal: solo se separan secciones y se aplican las correcciones de la §5 de
la especificación (más dobles espacios y dobles puntos). Otras erratas se
reportan, no se corrigen.
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
FUENTES = RAIZ / "docs" / "content-source"
SALIDA = RAIZ / "supabase" / "migrations" / "20261031020000_recursos_contenido.sql"
ERRATAS = RAIZ / "docs" / "content-review" / "erratas-detectadas.txt"

erratas: list[str] = []


# ─── Utilidades ───

def lineas(nombre):
    t = (FUENTES / nombre).read_text(encoding="utf-8").replace(" ", "\n").replace("\r", "\n").replace(" ", " ")
    return [l.strip() for l in t.split("\n")]


def limpiar(s: str, codigo: str = "") -> str:
    """Dobles espacios y dobles puntos (§5); todo lo demás queda literal."""
    if s is None:
        return s
    s2 = re.sub(r"[ \t]{2,}", " ", s)
    s2 = re.sub(r"(?<![.…])\.\.(?!\.)", ".", s2)
    if s2 != s and codigo:
        erratas.append(f"{codigo}: corregido doble espacio o doble punto en «{s.strip()[:70]}…»")
    return s2.strip()


def vineta(l: str) -> str:
    return re.sub(r"^(?:[•·\-\*\.]\s*)+", "", l.strip()).strip()


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


def punto_final(s: str, codigo: str, campo: str) -> str:
    if s and not s.rstrip().endswith((".", "?", "!", "…", "»")):
        erratas.append(f"{codigo}: agregado punto final en «{campo}» (corrección §5)")
        return s.rstrip() + "."
    return s


NIVELES_TODOS = ["preventivo", "dcl", "leve", "moderada", "avanzada"]


# ─── Gerontogimnasia ───

DRIVE = {
    "GER-001": "1E7ozbxRTL1g3EgLKiTnnMkdnhut6e154", "GER-002": "1nTS-4D8LujfY_dIw20ZobXMAKM5fw9GH",
    "GER-003": "1zkC11ZSI_c4PGBZXpT9TBosT5z1v--nv", "GER-004": "1ymazE-gpgP0bfdpI45cOxxUNnA690FaC",
    "GER-005": "1I3rl5oBNh1FbuiicQy70q7ksQ6vuKuAw", "GER-006": "155dS7RdkJU2AXbagceYDScZdy-eDbZGz",
    "GER-007": "1c31SiJ7VOZkdcMMDzMOIaFFlaPl4Kf-f", "GER-008": "1oGAvso_BRGGTTIjEpuKW7grzS0GCMpHo",
    "GER-009": "1GEke_2pB22DLEHBzC59aKsnh-Uj0jD-7", "GER-010": "11i38S_xbG7djVnWxMKH9U8cQs3GUirOT",
}
GER_SECCIONES = {
    "¿para quién?": "para_quien", "¿sabías que…?": "sabias_que", "tu actividad": "actividad",
    "si necesita una adaptación": "adaptacion", "tené en cuenta": "ten_en_cuenta",
    "para cerrar": "para_cerrar", "notas del equipo": "notas",
}
GER_NOTAS = [  # prefijo en la línea → campo interno
    ("Fuente", "fuente"), ("Áreas de trabajo", "areas"), ("Video", "video"),
    ("Progresión solo indicada por el equipo", "progresion"), ("Revisión", "revision"), ("Estado", "estado"),
]


def parse_ger():
    ls = lineas("gerontogimnasia-manual-2026-10-23.txt")
    fichas, cur, sec = [], None, None
    for l in ls:
        m = re.match(r"^(GER-\d{3})\s+(.+?)\s*$", l)
        if m:
            cur = {"codigo": m.group(1), "titulo": m.group(2).strip(), "s": {}}
            fichas.append(cur)
            sec = None
            continue
        if cur is None or not l:
            continue
        h = GER_SECCIONES.get(l.lower())
        if h:
            if h == "actividad" and "actividad" in cur["s"]:
                erratas.append(f"{cur['codigo']}: encabezado «Tu actividad» duplicado, se dejó uno solo (corrección §5)")
            sec = h
            cur["s"].setdefault(sec, [])
            continue
        cur["s"].setdefault(sec, []).append(l)
    return fichas


def ger_sql(f):
    c, s = f["codigo"], f["s"]
    n = int(c[-3:])
    para = s.get("para_quien", [])
    sabias_l = list(s.get("sabias_que", []))
    # GER-003: "…ir al baño.Tu actividad" pegado al final de ¿Sabías que…?, y
    # la línea "Prepará…" quedó antes del encabezado duplicado.
    for i, l in enumerate(sabias_l):
        if l.endswith("Tu actividad"):
            s["actividad"] = sabias_l[i + 1 :] + s.get("actividad", [])
            sabias_l = sabias_l[:i] + [l[: -len("Tu actividad")].rstrip()]
            erratas.append(f"{c}: «Tu actividad» estaba pegado al final de «¿Sabías que…?» y duplicado; se separó y quedó uno solo (corrección §5)")
            break
    sabias = " ".join(sabias_l)
    if c == "GER-002":
        sabias = punto_final(sabias, c, "¿Sabías que…?")
    actividad, dosis = [], None
    for l in s.get("actividad", []):
        if l.startswith("Dosis propuesta del terapeuta"):
            dosis = l[len("Dosis propuesta del terapeuta"):].strip()
            continue
        fijo = l.replace("Podés er el. video", "Podés ver el video").replace("Podés ver video", "Podés ver el video")
        if fijo != l:
            erratas.append(f"{c}: «{l[:30]}» → «{fijo[:30]}» (corrección §5)")
        if l.startswith(("•", "·")):
            fijo = "• " + vineta(fijo)
        actividad.append(fijo)
    notas = {}
    for l in s.get("notas", []):
        for pref, campo in GER_NOTAS:
            if l.startswith(pref):
                resto = re.sub(r"^[:\s]+", "", l[len(pref):])
                notas[campo] = resto
                break
        else:
            notas.setdefault("extra", []).append(l)
    rutas = ["verde", "amarillo", "rojo"] if n in (1, 2, 10) else ["verde", "amarillo"]
    clean = lambda x: limpiar(x, c)
    publico = {
        "codigo": q(c), "titulo": q(f["titulo"]), "modulo": "'gerontogimnasia'::public.resource_modulo",
        "tipo": "'actividad'::public.task_tipo", "media_kind": "'video'",
        "storage_path": q(f"gerontogimnasia/{c.lower()}.mp4"), "poster_path": q(f"gerontogimnasia/{c.lower()}-poster.jpg"),
        "drive_file_id": q(DRIVE[c]), "perfil": q(clean("\n".join(para))), "sabias_que": q(clean(sabias)),
        "actividad": q(clean("\n".join(actividad))), "dosis": q(clean(dosis) if dosis else None),
        "adaptacion": q(clean(" ".join(s.get("adaptacion", [])))), "ten_en_cuenta": q(clean(" ".join(s.get("ten_en_cuenta", [])))),
        "para_cerrar": q(clean(" ".join(s.get("para_cerrar", [])))),
        "niveles_cognitivos": qarr(NIVELES_TODOS), "niveles_motores": qarr(rutas),
        "permite_doble_tarea": "false",
        "requiere_supervision": q("ayuda_fisica_entrenada") if c == "GER-009" else "null",
        "orden": "0" if c == "GER-010" else str(n), "estado_clinico": "'aprobado'", "activo": "true",
    }
    revision = " ".join(x for x in [notas.get("revision"), f"Estado: {notas['estado']}" if notas.get("estado") else None] if x)
    interno = {
        "fuente": q(notas.get("fuente")), "areas_trabajo": qarr([notas["areas"]] if notas.get("areas") else []),
        "video_notas": q(notas.get("video")), "progresion": q(notas.get("progresion")), "revision": q(revision or None),
    }
    return publico, interno


# ─── Nutrición ───

PRE_SECCIONES = [  # encabezado (en su línea o como prefijo de la línea) → campo
    ("¿Para quién?", "para_quien"), ("¿Sabías que…?", "sabias_que"), ("Contenido visible en la app", "sabias_que"),
    ("Tu actividad", "actividad"), ("Tené en cuenta", "ten_en_cuenta"), ("Para cerrar", "para_cerrar"),
    ("Fuente para el equipo", "fuente"), ("Producción y pendientes del equipo", "pendientes"),
    ("Notas internas del equipo", "_notas"), ("Destinatarios", "destinatarios"),
    ("Asignación y precauciones", "asignacion"), ("Fundamento", "fundamento"), ("Producción y pendientes", "pendientes"),
]
ALERGENOS = {
    "PRE-004": ["pescado"], "PRE-037": ["pescado"], "PRE-044": ["pescado"], "PRE-006": ["frutos_secos"],
    "PRE-034": ["frutos_secos"], "PRE-022": ["huevo"], "PRE-048": ["huevo", "leche"], "PRE-016": ["leche"], "PRE-019": ["leche"],
}
EXCLUSIONES = {c: ["disfagia_sin_textura"] for c in ["PRE-006", "PRE-021", "PRE-025", "PRE-036", "PRE-038", "PRE-046"]}
for c in ["PRE-009", "PRE-029", "PRE-030"]:
    EXCLUSIONES.setdefault(c, []).append("desnutricion")
PLAN_INDIVIDUAL = {f"PRE-{n:03d}" for n in [12, 14, 15, 21, 24, 25, 26, 27, 29, 31, 36, 37, 39, 44, 48, 49]}
ROTACION = {
    "PRE-004": "pescado", "PRE-037": "pescado", "PRE-044": "pescado", "PRE-005": "hojas_verdes", "PRE-042": "hojas_verdes",
    "PRE-012": "aceite", "PRE-039": "aceite", "PRE-003": "hidratacion", "PRE-027": "hidratacion",
    "PRE-023": "ritmo_comer", "PRE-046": "ritmo_comer", "PRE-022": "desayuno_proteico", "PRE-048": "desayuno_proteico",
}
PRE_ESPERADOS = (
    [f"PRE-{n:03d}" for n in range(1, 17)] + ["PRE-018", "PRE-019"] + [f"PRE-{n:03d}" for n in range(21, 32)]
    + ["PRE-034"] + [f"PRE-{n:03d}" for n in range(36, 40)] + ["PRE-042", "PRE-043", "PRE-044", "PRE-046", "PRE-048", "PRE-049"]
)


def parse_pre():
    ls = lineas("nutricion-recursos.txt")
    fichas, cur, sec = [], None, None
    for l in ls:
        m = re.match(r"^(PRE-\d{3})\s*(?:·\s*)?(.+?)\s*$", l)
        if m:
            cur = {"codigo": m.group(1), "titulo": m.group(2).strip(), "s": {}}
            fichas.append(cur)
            sec = None
            continue
        if cur is None or not l:
            continue
        for pref, campo in PRE_SECCIONES:
            if l == pref or l.startswith(pref + " "):
                sec = campo
                resto = l[len(pref):].strip()
                cur["s"].setdefault(sec, [])
                if resto:
                    cur["s"][sec].append(resto)
                break
        else:
            # PRE-027: falta «Tu actividad» antes de «Si su plan de líquidos lo permite…»
            if cur["codigo"] == "PRE-027" and l.startswith("Si su plan de líquidos lo permite"):
                sec = "actividad"
                erratas.append("PRE-027: agregado encabezado «Tu actividad» (corrección §5)")
            # PRE-001: el primer párrafo de «Contenido visible en la app» es el ¿Sabías que…?
            cur["s"].setdefault(sec, []).append(l)
    return fichas


def niveles_pre(texto: str):
    t = texto.lower()
    out = []
    if "envejecimiento normal" in t:
        out.append("preventivo")
    if "deterioro cognitivo leve" in t:
        out.append("dcl")
    if "leves" in t or "demencia leve" in t:
        out.append("leve")
    if "moderadas" in t:
        out.append("moderada")
    if "severas" in t:
        out.append("avanzada")
    return out


def pre_sql(f):
    c, s = f["codigo"], f["s"]
    titulo = f["titulo"]
    destinatarios_titulo = None
    m = re.match(r"^(.*?)\s*\((.+)\)$", titulo)
    if m:  # PRE-001: el título trae la audiencia entre paréntesis
        titulo, destinatarios_titulo = m.group(1).strip(), m.group(2)
        erratas.append(f"{c}: el título traía la audiencia entre paréntesis («{destinatarios_titulo}»); se dejó en notas internas")
    para = " ".join(s.get("para_quien", []))
    fijo = para.replace("leves y moderadas y severas", "leves, moderadas y severas")
    if fijo != para:
        erratas.append(f"{c}: «leves y moderadas y severas» → «leves, moderadas y severas» (corrección §5)")
    para = limpiar(fijo, c)
    sabias = " ".join(s.get("sabias_que", [])).strip()
    if c in ("PRE-031", "PRE-038", "PRE-042"):
        sabias = punto_final(sabias, c, "¿Sabías que…?")
    actividad = []
    for l in s.get("actividad", []):
        actividad.append("• " + vineta(l) if l.startswith(("•", "·")) else l)
    fuente_lineas = s.get("fuente", [])
    fuente_url = next((l for l in fuente_lineas if l.startswith("http")), None)
    fuente = " ".join(l for l in fuente_lineas if not l.startswith("http")) or None
    if c == "PRE-001":
        fuente = " ".join(s.get("fundamento", [])) or None
    reglas = " ".join(
        x for x in [
            f"Destinatarios: {' '.join(s['destinatarios'])}" if s.get("destinatarios") else None,
            f"Asignación y precauciones: {' '.join(s['asignacion'])}" if s.get("asignacion") else None,
        ] if x
    ) or None
    pendientes = " ".join(s.get("pendientes", [])) or None
    if destinatarios_titulo:
        pendientes = " ".join(x for x in [pendientes, f"Título original con audiencia: ({destinatarios_titulo})."] if x)
    if not fuente_lineas and c != "PRE-001":
        erratas.append(f"{c}: sin «Fuente para el equipo» ni notas internas")
    clean = lambda x: limpiar(x, c)
    publico = {
        "codigo": q(c), "titulo": q(clean(titulo)), "modulo": "'nutricion'::public.resource_modulo",
        "tipo": "'actividad'::public.task_tipo", "media_kind": "null", "storage_path": "null", "poster_path": "null",
        "drive_file_id": "null", "perfil": q(para), "sabias_que": q(clean(sabias)),
        "actividad": q(clean("\n".join(actividad))), "dosis": "null", "adaptacion": "null",
        "ten_en_cuenta": q(clean(" ".join(s.get("ten_en_cuenta", [])))), "para_cerrar": q(clean(" ".join(s.get("para_cerrar", [])))),
        "niveles_cognitivos": qarr(niveles_pre(para)), "niveles_motores": "null", "permite_doble_tarea": "false",
        "requiere_supervision": "null", "alergenos": qarr(ALERGENOS.get(c)), "exclusiones": qarr(EXCLUSIONES.get(c)),
        "grupo_rotacion": q(ROTACION.get(c)), "requiere_plan_individual": "true" if c in PLAN_INDIVIDUAL else "false",
        "orden": str(int(c[-3:])), "estado_clinico": "'aprobado'", "activo": "true",
    }
    interno = {"fuente": q(fuente), "fuente_url": q(fuente_url), "reglas": q(reglas), "pendientes": q(pendientes)}
    return publico, interno


# ─── Recursos cognitivos (renombra MRC-NN a COG-0NN y reordena campos) ───

COG_ETAPAS = {
    "preventivo": ["preventivo"], "deterioro cognitivo leve": ["dcl"], "demencia leve": ["leve"],
    "demencia moderada": ["moderada"], "demencia severa": ["avanzada"],
    "demencia moderada o severa": ["moderada", "avanzada"], "demencia leve y moderada": ["leve", "moderada"],
}


def parse_cog():
    """Mismo parser que cargó el manual (texto literal, secciones)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("parse_cog", Path(__file__).with_name("parse_cog.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.parsear(FUENTES / "cognitivo-manual.txt")


def niveles_cog(para):
    t = " ".join(para).lower()
    out = []
    for clave, nivel in [("preventivo", "preventivo"), ("deterioro cognitivo leve", "dcl"), ("demencia leve", "leve"),
                         ("moderada", "moderada"), ("severa", "avanzada")]:
        if clave in t and nivel not in out:
            out.append(nivel)
    return out


def cog_sql(a):
    c = f"COG-{a['num']:03d}"
    s, cfg = a["secs"], a["config"]
    para = list(s.get("para_quien", []))
    if a["num"] == 5:
        para = ["Preventivo."] + para
        erratas.append("COG-005: viñeta vacía en «¿Para quién?» → «Preventivo.» (corrección §5)")
    por_etapa = {}
    for l in s.get("adaptacion", []):
        m = re.match(r"^([^:]{3,60}):\s*(.*)$", l)
        etapas = COG_ETAPAS.get(m.group(1).strip().lower()) if m else None
        if not etapas:
            erratas.append(f"{c}: línea de adaptación sin etapa reconocible: «{l[:60]}»")
            continue
        for e in etapas:
            por_etapa[e] = (por_etapa.get(e, "") + " " + m.group(2)).strip()
    clean = lambda x: limpiar(x, c)
    ciencia = None
    paras = [p for p in s.get("ciencia", []) if p]
    if paras:
        m = re.match(r"^(¿[^?]*\?)\s*(.*)$", paras[0])
        gancho, resto = (m.group(1), m.group(2)) if m else (paras[0], "")
        if len(paras) == 1:
            ciencia = {"gancho": clean(gancho), "evidencia": clean(resto), "cierre": ""}
        else:
            ciencia = {"gancho": clean(gancho), "evidencia": clean(" ".join([resto] + paras[1:-1])), "cierre": clean(paras[-1])}
    extras = None
    if a["num"] in (10, 12, 13):
        extras = a["extras"]
    if a["num"] == 16:
        extras = {"modo": "temporizador", "titulo": "Temporizador (opcional)", "segundos": [30, 60, 120]}
    publico = {
        "codigo": q(c), "titulo": q(a["titulo"]), "detalle": q(clean(" ".join(s.get("intro", [])))),
        "perfil": q(clean(" · ".join(para))), "materiales": q(clean(" ".join(s.get("materiales", [])))),
        "pasos": qjson([clean(p) for p in s.get("pasos", [])]), "ayuda": q(clean(" ".join(s.get("ayuda", [])))),
        "adaptacion_por_etapa": qjson({k: clean(v) for k, v in por_etapa.items()} or None),
        "precaucion": q(clean(" ".join(s.get("precauciones", [])))), "ciencia": qjson(ciencia), "extras": qjson(extras),
        "niveles_cognitivos": qarr(niveles_cog(para)), "duracion": q(cfg.get("duracion")), "frecuencia": q(cfg.get("frecuencia")),
        "orden": str(a["num"]), "estado_clinico": "'aprobado'",
        # Lo que pasa a interno se borra de la tabla pública.
        "adaptacion": "null", "por_que": "null", "objetivo": "null", "progresion": "null", "requisito": "null", "dominios": "null",
    }
    interno = {
        "objetivo": q(clean(" ".join(s.get("objetivo", [])))), "objetivo_esperado": q(clean(" ".join(s.get("objetivo_esperado", [])))),
        "areas_trabajo": qarr([vineta(x).rstrip(".") for x in s.get("estimula", [])]),
        "progresion": q(clean("\n".join(s.get("progresion", [])))), "reglas": q(cfg.get("reglas")),
        "etiquetas": qarr([e.strip().rstrip(".") for e in re.sub(r"\s*Configuración para la App\s*$", "", cfg.get("etiquetas") or "").split(",") if e.strip()]),
    }
    return publico, interno


# ─── Pendientes de revisión del equipo (§6 de la especificación) ───
# Se guardan también en media_resources_interno.pendientes de cada recurso.

REVISION = {
    "GER-001": "Registro mezclado usted/vos dentro de la ficha. Verificar que el video editado (25–26 oct) resolvió la carga (tobilleras) señalada en la auditoría.",
    "GER-002": "Verificar que el video editado resolvió la carga y la amplitud señaladas en la auditoría.",
    "GER-003": "Verificar que el video editado resolvió la carga (mancuernas) señalada en la auditoría.",
    "GER-004": "Verificar que el video editado muestra el pasamanos.",
    "GER-005": "Registro mezclado usted/vos («Apóyelo»). Verificar que el video editado muestra las dos manos en el soporte.",
    "GER-006": "Verificar que el video editado empieza en semitándem con apoyo fijo.",
    "GER-007": "Verificar que el video editado ya no transporta la pelota.",
    "GER-008": "Registro mezclado usted/vos («mantenga», «sin inclinarse»). Verificar que el video editado separa los dos movimientos.",
    "GER-009": "Menciona GER-044 y GER-045, que no existen. El título no describe la consigna (tocar una pelota inmovilizada sin cargar peso). «Progresión» menciona el apoyo de la silla aunque se prohíbe usar silla móvil como soporte. Verificar la superficie móvil en el video editado.",
    "GER-010": "El video dura lo mismo que el de GER-001 (37,1 s); confirmar que es el archivo correcto (el contenido es distinto).",
    "PRE-001": "«¿Para quién?» incluye demencia, pero sus notas dicen «Prevención y DCL» y el título dice «…y demencia leve». Referencias numeradas [1–8] sin lista de referencias.",
    "PRE-002": "Sin fuente ni notas internas.",
    "PRE-003": "Sin fuente ni notas internas.",
    "PRE-004": "Sin fuente ni notas internas.",
    "PRE-012": "Unificar la medida de aceite con PRE-039.",
    "PRE-039": "Unificar la medida de aceite con PRE-012.",
    "PRE-021": "No existe la receta de chía/chan que la ficha remite a nutrición.",
    "PRE-034": "La alergia a frutos secos excluye la ficha completa, aunque los frutos secos son solo una de las opciones.",
    "COG-004": "Verificar la cita de «La ciencia detrás» (posible confusión de la revista Folia Phoniatrica et Logopaedica con autores).",
    "COG-005": "Confirmar que la audiencia incluye Preventivo (viñeta vacía en el documento). El «Sabías que» habla de «recordar cómo nos preparábamos» aunque la actividad es imaginar.",
    "COG-007": "Las reglas dicen evitar imágenes recargadas, pero la actividad no usa imágenes.",
    "COG-013": "La cita «Folia y Silva (2024)» parece confundir la revista Folia Phoniatrica et Logopaedica con autores.",
}
for _c in [f"PRE-{n:03d}" for n in [12, 14, 15, 21, 24, 25, 26, 27, 29, 31, 36, 37, 39, 44, 48, 49]]:
    REVISION[_c] = (REVISION.get(_c, "") + " Porciones pendientes de nutrición (ficha con plan individual).").strip()


def con_revision(codigo_sql: str, interno: dict) -> dict:
    codigo = codigo_sql.strip("$c")
    nota = REVISION.get(codigo)
    if not nota:
        return interno
    previo = interno.get("pendientes")
    previo = previo[3:-3] if previo and previo != "null" else ""
    interno = dict(interno)
    interno["pendientes"] = q(" ".join(x for x in [previo, f"Revisión oct 2026: {nota}"] if x))
    return interno


# ─── SQL ───

def upsert(publico, interno):
    interno = con_revision(publico["codigo"], interno)
    cols = list(publico.keys())
    vals = [publico[k] for k in cols]
    upd = ", ".join(f"{k} = excluded.{k}" for k in cols if k != "codigo")
    codigo = publico["codigo"]
    sql = f"insert into public.media_resources ({', '.join(cols)})\nvalues ({', '.join(vals)})\non conflict (codigo) do update set {upd}, updated_at = now();\n"
    icols = list(interno.keys())
    iupd = ", ".join(f"{k} = excluded.{k}" for k in icols)
    sql += (
        f"insert into public.media_resources_interno (resource_id, {', '.join(icols)})\n"
        f"select id, {', '.join(interno[k] for k in icols)} from public.media_resources where codigo = {codigo}\n"
        f"on conflict (resource_id) do update set {iupd}, updated_at = now();\n"
    )
    return sql


def update_cog(publico, interno):
    """COG: los registros ya existen (MRC renombrados); se actualizan por código."""
    codigo = publico["codigo"]
    interno = con_revision(codigo, interno)
    sets = ", ".join(f"{k} = {v}" for k, v in publico.items() if k != "codigo")
    icols = list(interno.keys())
    iupd = ", ".join(f"{k} = excluded.{k}" for k in icols)
    return (
        f"update public.media_resources set {sets}, updated_at = now() where codigo = {codigo};\n"
        f"insert into public.media_resources_interno (resource_id, {', '.join(icols)})\n"
        f"select id, {', '.join(interno[k] for k in icols)} from public.media_resources where codigo = {codigo}\n"
        f"on conflict (resource_id) do update set {iupd}, updated_at = now();\n"
    )


def main():
    ger, pre, cog = parse_ger(), parse_pre(), parse_cog()
    assert [f["codigo"] for f in ger] == [f"GER-{n:03d}" for n in range(1, 11)], [f["codigo"] for f in ger]
    codigos_pre = [f["codigo"] for f in pre]
    assert codigos_pre == PRE_ESPERADOS, sorted(set(codigos_pre) ^ set(PRE_ESPERADOS))
    partes = [
        "-- Carga de contenido de business/integramente-recursos-spec.md (GER, PRE, COG).",
        "-- Generado por scripts/recursos/generar_contenido.py desde docs/content-source/*.txt:",
        "-- texto literal, solo correcciones de la §5. Idempotente: re-ejecutable sin duplicar.",
        "-- Requiere 20261031010000_recursos_modelo.sql.",
        "",
        "-- COG: el manual cognitivo cargado como MRC-NN pasa a COG-0NN (mismos registros).",
        "update public.media_resources set codigo = 'COG-0' || substr(codigo, 5) where codigo ~ '^MRC-[0-9]{2}$';",
        "",
        "-- ─── Gerontogimnasia ───",
    ]
    partes += [upsert(*ger_sql(f)) for f in ger]
    partes += ["-- ─── Nutrición ───"] + [upsert(*pre_sql(f)) for f in pre]
    partes += ["-- ─── Recursos cognitivos ───"] + [update_cog(*cog_sql(a)) for a in cog]
    SALIDA.write_text("\n".join(partes), encoding="utf-8")
    ERRATAS.parent.mkdir(parents=True, exist_ok=True)
    ERRATAS.write_text("\n".join(sorted(set(erratas))) + "\n", encoding="utf-8")
    print(f"GER {len(ger)} · PRE {len(pre)} · COG {len(cog)} · erratas registradas {len(set(erratas))}")


if __name__ == "__main__":
    main()
