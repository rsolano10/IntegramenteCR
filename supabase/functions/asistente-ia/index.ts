// Asistente IntegraMente: el chat de "Respuestas rápidas" de la familia.
//
// Conversacional y con contexto: conoce a la persona participante (gustos,
// historia, movilidad, actividades de la semana), recuerda conversaciones
// anteriores (asistente_mensajes + un resumen en asistente_memoria) y la
// respuesta se transmite mientras se escribe.
//
// Capas de seguridad, en orden:
//   1. Reglas de riesgo por palabras clave (en el cliente Y acá): una
//      urgencia siempre muestra la guía de emergencia, sin depender del
//      modelo. El modelo solo agrega una frase de contención.
//   2. El modelo declara en la primera línea la categoría y señales
//      (medicación, riesgo, derivar). Solo se transmite en vivo una
//      respuesta "responder" sin señales; todo lo demás se arma completo.
//   3. Filtro duro oración por oración (dosis, fármacos, diagnósticos,
//      "soy médico"): si salta, se corta y se reemplaza por la derivación.
//   4. Verificador (segunda llamada al modelo) para toda respuesta que no
//      se transmitió en vivo: si no es segura, se reemplaza.
//   5. Lo clínico se deriva a WhatsApp con un mensaje ya redactado (único
//      canal con la clínica). Lo derivado, las emergencias y lo que el
//      filtro reemplazó quedan marcados para que el equipo lo revise.
//
// Respuesta: NDJSON (una línea JSON por evento):
//   {t:"delta", texto}                         texto que se va escribiendo
//   {t:"fin", id, texto, categoria, derivar, whatsapp, sugerencias, emergencia}
//   {t:"limite", texto} | {t:"sin_ia"}         el cliente usa respuestas fijas
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type Contexto,
  type Meta,
  ETIQUETA_RIESGO,
  INSTRUCCIONES_VERIFICADOR,
  TEXTO_EMERGENCIA,
  filtroDuro,
  instrucciones,
  instruccionesMemoria,
  instruccionesSeguimientoRiesgo,
  leerMeta,
  limpiar,
  limpiarTramo,
  riesgoPorPalabras,
  separar,
  textoBloqueado,
  textoFuera,
  whatsappPorDefecto,
} from "./nucleo.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;
const LIMITE_POR_HORA = 30;
const HISTORIAL = 12; // mensajes recientes que van completos al modelo
const RESUMIR_DESDE = 24; // mensajes sin resumir que disparan la memoria

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function ndjsonUna(o: unknown) {
  return new Response(JSON.stringify(o) + "\n", { headers: { ...corsHeaders, "Content-Type": "application/x-ndjson" } });
}

type Admin = ReturnType<typeof createClient>;
interface Turno {
  rol: "usuario" | "asistente";
  texto: string;
  created_at: string;
}

// ─── Contexto ───────────────────────────────────────────────────────────

const INTERESES: Record<string, string> = {
  musica: "escuchar música", fotos_recuerdos: "ver fotos y recordar", conversar: "conversar", leer: "leer", escribir: "escribir",
  cocinar: "cocinar", jardineria: "la jardinería", caminar: "caminar", bailar: "bailar", pintar_manualidades: "pintar y manualidades",
  juegos_mesa: "juegos de mesa y cartas", deportes_ver: "ver deportes", religioso_espiritual: "actividades religiosas o espirituales",
  cuidar_animales: "cuidar animales", television_peliculas: "ver televisión o películas",
};
const HISTORIA: Record<string, string> = {
  familia: "su familia", trabajo: "su trabajo", amistades: "sus amistades", comunidad: "su comunidad", campo_naturaleza: "la vida en el campo",
  religion_espiritualidad: "la religión", musica: "la música", cocina: "la cocina", deporte: "el deporte", viajes: "los viajes",
  estudio_aprendizaje: "el estudio", cuidar_ayudar: "cuidar a otros",
};
const MOV_DENTRO: Record<string, string> = {
  sin_ayuda: "camina sin ayuda en la casa", baston: "camina con bastón", andadera: "camina con andadera",
  acompanado: "camina solo si alguien lo acompaña o sostiene", silla_ruedas: "se moviliza en silla de ruedas", cama: "pasa la mayor parte del tiempo en cama",
};
const MOV_FUERA: Record<string, string> = {
  sale_camina_sin_ayuda: "sale y camina sin ayuda", sale_baston_andadera: "sale con bastón o andadera", necesita_acompanado: "para salir necesita compañía",
  distancias_cortas: "solo camina distancias cortas", no_sale: "generalmente no sale",
};
const ACOMPANANTE: Record<string, string> = {
  diario: "todos o casi todos los días", varias_semana: "varias veces por semana", ocasional: "solo ocasionalmente", sin_acompanante: "no cuenta con una persona disponible",
};
const RELACION: Record<string, string> = { familiar: "familiar", cuidador: "cuidador o cuidadora", profesional: "profesional", otra_persona: "otra persona cercana" };
const ESTADO: Record<string, string> = { realizado: "hecha", parcial: "hecha en parte", no: "no se pudo", pendiente: "pendiente", futuro: "más adelante" };
const DIA: Record<string, string> = { lun: "lunes", mar: "martes", mie: "miércoles", jue: "jueves", vie: "viernes", sab: "sábado", dom: "domingo" };

function ahoraCR() {
  return new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
}

function hace(iso: string): string | null {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias < 1) return null;
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

async function cargarContexto(admin: Admin, userId: string) {
  const { data: link } = await admin
    .from("patient_links")
    .select("patient_id, relation")
    .eq("profile_id", userId)
    .in("relation", ["familiar_admin", "participante"])
    .limit(1)
    .maybeSingle();
  const patientId = (link?.patient_id as string | undefined) ?? null;

  const ahora = new Date().toISOString();
  const [{ data: perfil }, { data: patient }, { data: ob }, { data: plan }, { data: memoria }, { data: recientes }] = await Promise.all([
    admin.from("profiles").select("nombre").eq("id", userId).maybeSingle(),
    patientId ? admin.from("patients").select("nombre, edad, modalidad").eq("id", patientId).maybeSingle() : Promise.resolve({ data: null }),
    patientId ? admin.from("onboarding_answers").select("answers").eq("patient_id", patientId).maybeSingle() : Promise.resolve({ data: null }),
    patientId
      ? admin.from("plans").select("id").eq("patient_id", patientId).eq("status", "published").lte("publish_at", ahora).order("publish_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("asistente_memoria").select("resumen").eq("profile_id", userId).maybeSingle(),
    admin.from("asistente_mensajes").select("rol, texto, created_at").eq("profile_id", userId).order("created_at", { ascending: false }).limit(HISTORIAL),
  ]);

  const { data: tareas } = plan?.id
    ? await admin.from("plan_tasks").select("dia, hora, titulo, estado, comentario").eq("plan_id", plan.id).order("sort_order", { ascending: true })
    : { data: [] as Record<string, unknown>[] };

  const a = (ob?.answers ?? {}) as Record<string, unknown>;
  const lista = (v: unknown, mapa: Record<string, string>) => (Array.isArray(v) ? (v.map((x) => mapa[x as string]).filter(Boolean) as string[]) : []);
  const nombreBase = String(a.nombre_participante ?? patient?.nombre ?? "").trim().split(" ")[0] || "tu familiar";
  const nombre = a.tratamiento_preferido === "don_dona" ? `${a.tratamiento_genero === "dona" ? "doña" : "don"} ${nombreBase}` : nombreBase;
  const intereses = lista(a.intereses_actuales, INTERESES);
  if (typeof a.otro_interes_actual === "string" && a.otro_interes_actual.trim()) intereses.push(a.otro_interes_actual.trim());
  if (typeof a.intereses_previos_texto === "string" && a.intereses_previos_texto.trim()) intereses.push(`antes: ${a.intereses_previos_texto.trim()}`);
  const movilidad = [MOV_DENTRO[a.movilidad_dentro_casa as string], MOV_FUERA[a.movilidad_fuera_casa as string]].filter(Boolean) as string[];
  const esParticipante = link?.relation === "participante" || a.rol_respondente === "propia_persona";

  const contexto: Contexto = {
    usuario: {
      nombre: String(perfil?.nombre ?? "").split(" ")[0],
      esParticipante,
      relacion: esParticipante ? null : (RELACION[a.rol_respondente as string] ?? (typeof a.relacion_otro === "string" ? a.relacion_otro : null)),
    },
    paciente: {
      nombre,
      edad: (patient?.edad as string | null) ?? null,
      programa: patient?.modalidad === "autoguiado" ? "Autoguiado" : patient?.modalidad ? "Orientado" : null,
      intereses: intereses.slice(0, 8),
      historia: lista(a.temas_historia_significativa, HISTORIA).slice(0, 6),
      movilidad,
      acompanante: ACOMPANANTE[a.disponibilidad_acompanante as string] ?? null,
    },
    semana: (tareas ?? []).map((t) => ({
      dia: DIA[t.dia as string] ?? String(t.dia),
      hora: (t.hora as string | null)?.slice(0, 5) ?? null,
      titulo: String(t.titulo),
      estado: ESTADO[t.estado as string] ?? String(t.estado),
      comentario: (t.comentario as string | null) ?? null,
    })),
    memoria: (memoria?.resumen as string | undefined) ?? "",
    ahora: ahoraCR(),
  };
  const historial = ((recientes ?? []) as Turno[]).slice().reverse();
  return { contexto, historial, patientId };
}

// ─── Gemini ─────────────────────────────────────────────────────────────

function contenidos(historial: Turno[], mensaje: string) {
  return [
    ...historial.map((t) => {
      const cuando = hace(t.created_at);
      return { role: t.rol === "usuario" ? "user" : "model", parts: [{ text: cuando && t.rol === "usuario" ? `(${cuando}) ${t.texto}` : t.texto }] };
    }),
    { role: "user", parts: [{ text: mensaje }] },
  ];
}

async function* streamGemini(sistema: string, contents: unknown[]): AsyncGenerator<string> {
  const res = await fetch(`${GEMINI}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`gemini ${res.status}`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const linea = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!linea.startsWith("data:")) continue;
      try {
        const d = JSON.parse(linea.slice(5));
        const t = (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string; thought?: boolean }) => (p.thought ? "" : (p.text ?? ""))).join("");
        if (t) yield t;
      } catch {
        // línea parcial o de control
      }
    }
  }
}

async function generar(sistema: string, texto: string, comoJson = false): Promise<string | null> {
  try {
    const res = await fetch(`${GEMINI}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: texto }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500, ...(comoJson ? { responseMimeType: "application/json" } : {}) },
      }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim() || null;
  } catch {
    return null;
  }
}

async function verificar(pregunta: string, respuesta: string): Promise<boolean | null> {
  const r = await generar(INSTRUCCIONES_VERIFICADOR, `Pregunta de la familia:\n${pregunta}\n\nRespuesta del asistente:\n${respuesta}`, true);
  if (!r) return null;
  try {
    return JSON.parse(r).seguro === true;
  } catch {
    return null;
  }
}

// ─── Memoria ────────────────────────────────────────────────────────────

async function actualizarMemoria(admin: Admin, userId: string, patientId: string | null) {
  const { data: mem } = await admin.from("asistente_memoria").select("resumen, resumido_hasta").eq("profile_id", userId).maybeSingle();
  let q = admin.from("asistente_mensajes").select("rol, texto, created_at").eq("profile_id", userId).order("created_at", { ascending: true });
  if (mem?.resumido_hasta) q = q.gt("created_at", mem.resumido_hasta);
  const { data: pendientes } = await q.limit(200);
  if (!pendientes || pendientes.length < RESUMIR_DESDE) return;
  const tramo = pendientes.slice(0, pendientes.length - HISTORIAL);
  const texto = tramo.map((m) => `${m.rol === "usuario" ? "Familia" : "Asistente"}: ${m.texto}`).join("\n").slice(0, 12000);
  const resumen = await generar(instruccionesMemoria((mem?.resumen as string) ?? ""), texto);
  if (!resumen) return;
  await admin.from("asistente_memoria").upsert({
    profile_id: userId,
    patient_id: patientId,
    resumen: limpiar(resumen).slice(0, 1500),
    resumido_hasta: tramo[tramo.length - 1].created_at,
    updated_at: new Date().toISOString(),
  });
}

// ─── Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  const mensaje = String(payload.mensaje ?? "").trim().slice(0, 800);
  if (!mensaje) return json({ error: "Mensaje vacío." }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { count } = await admin
    .from("asistente_mensajes")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("rol", "usuario")
    .gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= LIMITE_POR_HORA) {
    return ndjsonUna({ t: "limite", texto: "Hiciste muchas consultas en la última hora. Probá de nuevo en un rato, o escribile a nuestro equipo por WhatsApp." });
  }
  if (!GEMINI_API_KEY) return ndjsonUna({ t: "sin_ia" });

  const { contexto, historial, patientId } = await cargarContexto(admin, user.id);
  const nombre = contexto.paciente.nombre;
  // Riesgo: lo que detectó el cliente o, por si acaso, las mismas reglas acá.
  const riesgoCliente = typeof payload.riesgoLocal === "string" && ETIQUETA_RIESGO[payload.riesgoLocal] ? payload.riesgoLocal : null;
  const riesgo = riesgoCliente ?? riesgoPorPalabras(mensaje);

  await admin.from("asistente_mensajes").insert({
    profile_id: user.id,
    patient_id: patientId,
    rol: "usuario",
    texto: mensaje,
    marcado: !!riesgo,
    motivo_marca: riesgo ? "emergencia" : null,
  });

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      const enviar = (o: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      const sistema = riesgo ? instruccionesSeguimientoRiesgo(contexto, ETIQUETA_RIESGO[riesgo]) : instrucciones(contexto);

      let salida = "";
      let meta: Meta | null = null;
      let metaLeida = false;
      let enVivo = false;
      let enviado = 0; // caracteres de prosa ya transmitidos
      let bloqueado = false;

      // Prosa transmitible: después de la línea de meta y antes del cierre @@.
      const prosaActual = () => {
        const i = salida.indexOf("\n");
        let p = i >= 0 ? salida.slice(i + 1) : "";
        const c = p.indexOf("@@");
        if (c >= 0) p = p.slice(0, c);
        else if (p.endsWith("@")) p = p.slice(0, -1);
        return p;
      };

      try {
        for await (const trozo of streamGemini(sistema, contenidos(historial, mensaje))) {
          salida += trozo;
          if (!metaLeida) {
            const t = salida.replace(/^\s+/, "");
            if (!t.startsWith("@") && t.length > 2) {
              metaLeida = true; // no respetó el formato: se arma completo y se verifica
            } else if (t.includes("\n")) {
              metaLeida = true;
              salida = t;
              meta = leerMeta(t.slice(0, t.indexOf("\n")));
              enVivo = !riesgo && !!meta && meta.categoria === "responder" && !meta.medicacion && !meta.riesgo && !meta.derivar;
            }
          }
          if (enVivo && !bloqueado) {
            // Solo oraciones completas, y cada una pasa el filtro duro.
            const prosa = prosaActual();
            const corte = Math.max(prosa.lastIndexOf(". "), prosa.lastIndexOf("? "), prosa.lastIndexOf("! "), prosa.lastIndexOf("\n"));
            if (corte + 1 > enviado) {
              const tramo = prosa.slice(enviado, corte + 1);
              if (filtroDuro(tramo)) bloqueado = true;
              else {
                enviar({ t: "delta", texto: limpiarTramo(tramo) });
                enviado = corte + 1;
              }
            }
          }
        }
      } catch {
        if (!salida.trim()) {
          enviar({ t: "sin_ia" });
          ctrl.close();
          return;
        }
      }

      const partes = separar(salida);
      meta = meta ?? partes.meta;
      let categoria: string = riesgo ? "emergencia" : (meta?.categoria ?? "responder");
      let derivar = !riesgo && !!meta?.derivar;
      let texto = partes.prosa;
      let whatsapp = derivar ? (partes.cierre.whatsapp ?? whatsappPorDefecto(nombre, mensaje)) : null;
      let sugerencias = categoria === "emergencia" ? [] : partes.cierre.sugerencias;
      let motivo: string | null = categoria === "emergencia" ? "emergencia" : derivar ? "derivado" : meta?.riesgo ? "riesgo" : null;

      if (!texto || texto.length < 8) bloqueado = true;
      if (!bloqueado && filtroDuro(texto)) bloqueado = true;
      if (!bloqueado && !enVivo && categoria !== "fuera_de_alcance") {
        // Todo lo que no se transmitió en vivo pasa por el verificador.
        const seguro = await verificar(mensaje, texto);
        if (seguro === false || (seguro === null && (meta?.medicacion || !meta))) bloqueado = true;
      }

      if (categoria === "fuera_de_alcance") {
        texto = textoFuera(nombre);
        sugerencias = [];
      } else if (categoria === "emergencia") {
        if (bloqueado || !texto) texto = riesgo ? `¿Está a salvo ${nombre} ahora? Contame cómo está y seguimos juntos.` : TEXTO_EMERGENCIA;
      } else if (bloqueado) {
        categoria = "profesional";
        derivar = true;
        texto = textoBloqueado(nombre);
        whatsapp = whatsapp ?? whatsappPorDefecto(nombre, mensaje);
        sugerencias = [];
        motivo = "filtro_seguridad";
      }
      texto = texto.slice(0, 2000);

      const { data: msg } = await admin
        .from("asistente_mensajes")
        .insert({
          profile_id: user.id,
          patient_id: patientId,
          rol: "asistente",
          texto,
          categoria,
          senales: { ...(meta ?? {}), en_vivo: enVivo, bloqueado, riesgo_local: riesgo },
          sugerencias,
          whatsapp,
          marcado: !!motivo,
          motivo_marca: motivo,
        })
        .select("id")
        .single();

      enviar({
        t: "fin",
        id: msg?.id ?? null,
        texto,
        categoria,
        derivar,
        whatsapp,
        sugerencias,
        // El cliente ya mostró la guía si la detectó él; si la detectó el
        // servidor o el modelo, el cliente agrega el botón de emergencia.
        emergencia: categoria === "emergencia" && !riesgoCliente,
      });
      ctrl.close();

      const tarea = actualizarMemoria(admin, user.id, patientId).catch(() => {});
      // deno-lint-ignore no-explicit-any
      (globalThis as any).EdgeRuntime?.waitUntil?.(tarea);
    },
  });

  return new Response(body, { headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" } });
});
