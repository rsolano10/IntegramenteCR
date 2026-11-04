#!/usr/bin/env python3
# Copia las plantillas de supabase/templates/*.html (con sus asuntos de
# config.toml) a supabase/functions/auth-email/plantillas.ts, para que el
# hook de envío de correos use exactamente el mismo HTML que el SMTP.
# Correr después de editar cualquier plantilla:
#   python3 scripts/email/generar-plantillas.py
import json, pathlib, re

raiz = pathlib.Path(__file__).resolve().parents[2]
# Sin tomllib (Python 3.9 del sistema): las secciones de plantillas de
# config.toml tienen siempre la misma forma.
config = (raiz / "supabase/config.toml").read_text()
patron = re.compile(r'\[auth\.email\.template\.(\w+)\]\s*\nsubject = "([^"]*)"\s*\ncontent_path = "\./([^"]+)"')
salida = {}
for nombre, asunto, ruta in patron.findall(config):
    salida[nombre] = {"asunto": asunto, "html": (raiz / ruta).read_text()}
ts = "// GENERADO por scripts/email/generar-plantillas.py — no editar a mano.\n"
ts += "export const plantillas: Record<string, { asunto: string; html: string }> = " + json.dumps(salida, ensure_ascii=False, indent=2) + ";\n"
(raiz / "supabase/functions/auth-email/plantillas.ts").write_text(ts)
print("plantillas:", ", ".join(salida))
