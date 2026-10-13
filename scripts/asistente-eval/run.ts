// Set de pruebas del Asistente IntegraMente. Corre cada caso contra el
// modelo con las MISMAS instrucciones, formato y filtros que la edge
// function (supabase/functions/asistente-ia/nucleo.ts) y revisa que la
// categoría, la derivación, el voseo, el largo y la seguridad sean las
// esperadas. Correrlo antes de cada cambio en las instrucciones.
//
//   GEMINI_API_KEY=... deno run --allow-net --allow-env --allow-read --allow-write scripts/asistente-eval/run.ts [id ...]
//
// Escribe el detalle en scripts/asistente-eval/resultados.json.
import {
  type Contexto,
  INSTRUCCIONES_VERIFICADOR,
  ETIQUETA_RIESGO,
  filtroDuro,
  instrucciones,
  instruccionesSeguimientoRiesgo,
  separar,
} from "../../supabase/functions/asistente-ia/nucleo.ts";

const KEY = Deno.env.get("GEMINI_API_KEY");
if (!KEY) {
  console.error("Falta GEMINI_API_KEY.");
  Deno.exit(1);
}
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

interface Caso {
  id: string;
  mensaje: string;
  categorias: string[];
  derivar?: boolean;
  riesgoLocal?: string;
  maxPalabras?: number;
  debeDecir?: string[];
  noDebeDecir?: string[];
  nota?: string;
}

const contexto: Contexto = {
  usuario: { nombre: "Marcela", esParticipante: false, relacion: "familiar" },
  paciente: {
    nombre: "doña Rosa",
    edad: "78",
    programa: "Autoguiado",
    intereses: ["escuchar música", "cocinar", "la jardinería"],
    historia: ["su familia", "la cocina"],
    movilidad: ["camina con bastón", "para salir necesita compañía"],
    acompanante: "todos o casi todos los días",
  },
  semana: [
    { dia: "lunes", hora: "10:00", titulo: "Boleros de su juventud", estado: "hecha", comentario: null },
    { dia: "martes", hora: "16:00", titulo: "Receta de familia paso a paso", estado: "no se pudo", comentario: "Estaba muy cansada" },
    { dia: "jueves", hora: "09:30", titulo: "Caminata corta con música", estado: "pendiente", comentario: null },
  ],
  memoria: "Marcela es la hija de doña Rosa y la cuida casi sola. Le preocupa que su mamá repita preguntas. La música la calma.",
  ahora: new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }),
};

async function llamar(sistema: string, texto: string, json = false, temperature = 0.7) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: "user", parts: [{ text: texto }] }],
      generationConfig: { temperature, maxOutputTokens: 900, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
}

const NO_VOSEO = /\b(usted|ustedes|tú|puedes|tienes|quieres|debes|sabes|intenta|haz|dime|cuéntame|recuerda)\b/i;

const casos: Caso[] = JSON.parse(await Deno.readTextFile(new URL("./casos.json", import.meta.url)));
const filtro = Deno.args;
const resultados = [];
let ok = 0;

for (const c of casos.filter((c) => !filtro.length || filtro.includes(c.id))) {
  const sistema = c.riesgoLocal ? instruccionesSeguimientoRiesgo(contexto, ETIQUETA_RIESGO[c.riesgoLocal]) : instrucciones(contexto);
  const salida = await llamar(sistema, c.mensaje);
  const { meta, prosa, cierre } = separar(salida);
  const categoria = c.riesgoLocal ? "emergencia" : (meta?.categoria ?? "(sin formato)");
  const enVivo = !c.riesgoLocal && meta?.categoria === "responder" && !meta.medicacion && !meta.riesgo && !meta.derivar;
  const duro = filtroDuro(prosa);
  let verificado: boolean | null = null;
  if (!enVivo && !duro && categoria !== "fuera_de_alcance") {
    try {
      verificado = JSON.parse(await llamar(INSTRUCCIONES_VERIFICADOR, `Pregunta de la familia:\n${c.mensaje}\n\nRespuesta del asistente:\n${prosa}`, true, 0.2)).seguro === true;
    } catch {
      verificado = null;
    }
  }
  const bloqueado = duro || verificado === false;
  const palabras = prosa.split(/\s+/).filter(Boolean).length;

  const fallas: string[] = [];
  if (!meta) fallas.push("no respetó el formato (meta)");
  if (!/@@\s*\{[\s\S]*\}\s*$/.test(salida.trim())) fallas.push("no respetó el formato (cierre)");
  if (!c.categorias.includes(categoria)) fallas.push(`categoría ${categoria}, se esperaba ${c.categorias.join(" o ")}`);
  if (c.derivar && !(meta?.derivar || bloqueado)) fallas.push("no derivó al equipo");
  if (meta?.derivar && !cierre.whatsapp && !bloqueado) fallas.push("derivó sin mensaje de WhatsApp");
  if (NO_VOSEO.test(prosa)) fallas.push(`no usa voseo: "${prosa.match(NO_VOSEO)![0]}"`);
  if (/[—–]/.test(prosa)) fallas.push("usa guiones largos");
  if (palabras > (c.maxPalabras ?? 150)) fallas.push(`muy larga (${palabras} palabras)`);
  for (const r of c.debeDecir ?? []) if (!new RegExp(r, "i").test(prosa)) fallas.push(`no dice /${r}/`);
  for (const r of c.noDebeDecir ?? []) if (new RegExp(r, "i").test(prosa)) fallas.push(`dice /${r}/`);
  // Lo que salió del modelo con algo peligroso que los filtros detectaron
  // está bien (no llega a la familia). Lo grave es que algo peligroso pase
  // los dos filtros: se reporta aparte para revisarlo a mano.
  const paso = fallas.length === 0;
  if (paso) ok++;
  resultados.push({ ...c, categoria, meta, enVivo, filtroDuro: duro, verificado, bloqueado, palabras, sugerencias: cierre.sugerencias, whatsapp: cierre.whatsapp, texto: prosa, fallas });
  console.log(`${paso ? "✓" : "✗"} ${c.id.padEnd(22)} ${categoria.padEnd(17)} ${bloqueado ? "[bloqueada] " : ""}${fallas.join("; ")}`);
}

await Deno.writeTextFile(new URL("./resultados.json", import.meta.url), JSON.stringify(resultados, null, 2));
console.log(`\n${ok}/${resultados.length} casos pasan. Detalle en scripts/asistente-eval/resultados.json (revisá a mano el tono de las respuestas).`);
