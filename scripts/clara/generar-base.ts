// Genera la base de conocimiento de actividades para Clara
// (business/CLARA_BASE_ACTIVIDADES.md): una ficha por actividad, con el
// guion de la sesión guiada (código) y los campos PÚBLICOS del recurso.
// Nunca lo interno del equipo (media_resources_interno), ni la
// «adaptación» vieja por semáforos, ni nombres de etapas clínicas.
//
// Uso:
//   1. Exportar los recursos (consulta en el comentario de abajo) a un JSON.
//   2. npx tsx scripts/clara/generar-base.ts recursos.json business/CLARA_BASE_ACTIVIDADES.md
//
// select jsonb_agg(jsonb_build_object('codigo', codigo, 'titulo', titulo, 'modulo', modulo,
//   'tipo', tipo, 'duracion', duracion, 'detalle', detalle, 'materiales', materiales,
//   'pasos', pasos, 'precaucion', precaucion, 'ciencia', ciencia, 'por_que', por_que,
//   'sabias_que', sabias_que, 'actividad', actividad, 'dosis', dosis, 'ten_en_cuenta', ten_en_cuenta,
//   'para_cerrar', para_cerrar, 'ayuda', ayuda, 'adaptacion_por_etapa', adaptacion_por_etapa,
//   'modo', extras->>'modo', 'juego', case when extras->>'modo' = 'interactiva' then extras->>'tipo' end,
//   'media_kind', media_kind) order by modulo, codigo) as filas
// from media_resources where activo and coalesce(estado_clinico, 'aprobado') <> 'bloqueado';

import { readFileSync, writeFileSync } from "node:fs";
import { GUIONES, aTenerAMano, resumenPasos } from "../../src/lib/sesiones";
import { describirEscena } from "../../src/lib/claraActividad";
import { antesDeEmpezar, cuandoParar } from "../../src/lib/bloquesGerontogimnasia";
import { moduloLabel, type ResourceModulo } from "../../src/lib/modulos";

interface Recurso {
  codigo: string;
  titulo: string;
  modulo: ResourceModulo;
  tipo: string;
  duracion: string | null;
  detalle: string | null;
  materiales: string | null;
  pasos: string[] | null;
  precaucion: string | null;
  ciencia: { gancho?: string; evidencia?: string; cierre?: string } | null;
  por_que: string | null;
  sabias_que: string | null;
  actividad: string | null;
  dosis: string | null;
  ten_en_cuenta: string | null;
  para_cerrar: string | null;
  ayuda: string | null;
  adaptacion_por_etapa: Record<string, string> | null;
  modo: string | null;
  juego: string | null;
  media_kind: string | null;
}

const [, , entrada, salida] = process.argv;
if (!entrada || !salida) {
  console.error("Uso: npx tsx scripts/clara/generar-base.ts recursos.json salida.md");
  process.exit(1);
}
const recursos = JSON.parse(readFileSync(entrada, "utf8")) as Recurso[];

const limpio = (t: string | null | undefined) =>
  (t ?? "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]+/g, " ")
    .trim();

// Las adaptaciones, de más autonomía a más apoyo, sin nombrar etapas.
const APOYO: [string, string][] = [
  ["preventivo", "Con mucha autonomía"],
  ["dcl", "Con olvidos leves"],
  ["leve", "Con algo de apoyo"],
  ["moderada", "Con bastante apoyo"],
  ["avanzada", "Con apoyo continuo"],
];

const CATEGORIAS: Record<ResourceModulo, string> = {
  cognicion: "Ejercicios para la atención, la memoria y la organización, con situaciones de la vida diaria. Incluye los juegos en pantalla de «Un día en el pueblo».",
  gerontogimnasia: "Ejercicios físicos indicados por el equipo (equilibrio, fuerza, movilidad), con video, dosis y señales para parar. La dosis la define el equipo.",
  movimiento: "Juegos con el cuerpo que combinan moverse y pensar: pelota, ritmo, caminatas cortas.",
  musica: "Actividades con música, ritmo y canciones conocidas para estimular la memoria y el ánimo.",
  reminiscencia: "Recuerdos de la propia historia con fotos, objetos y conversaciones.",
  sentidos: "Estimulación de los sentidos: olores, texturas, sonidos y sabores conocidos.",
  nutricion: "Fichas de alimentación saludable con recetas y consejos prácticos; respetan las indicaciones de salud de cada persona.",
  bienvenida: "Recursos para empezar: conocer la app y al equipo.",
};

function ficha(r: Recurso): string {
  const g = GUIONES[r.codigo];
  const l: string[] = [];
  l.push(`### ${r.codigo} · ${limpio(r.titulo)}`);
  const tipo = r.juego ? "Juego en pantalla (Un día en el pueblo)" : g ? "Sesión guiada paso a paso" : r.media_kind === "video" ? "Actividad con video" : "Actividad";
  l.push(`- **Categoría:** ${moduloLabel[r.modulo]} · **Formato:** ${tipo}${r.duracion ? ` · **Duración:** ${limpio(r.duracion)}` : ""}`);
  const frase = g?.frase ?? r.detalle;
  if (frase) l.push(`- **De qué se trata:** ${limpio(frase)}`);
  const ciencia = [r.ciencia?.gancho, r.ciencia?.evidencia, r.ciencia?.cierre].map(limpio).filter(Boolean);
  if (ciencia.length) l.push(`- **Por qué sirve:** ${ciencia.join(" ")}`);
  else if (r.sabias_que || r.por_que) l.push(`- **Por qué sirve:** ${limpio(r.sabias_que ?? r.por_que)}`);

  const aMano = g ? aTenerAMano(g).map((i) => i.texto) : [];
  if (aMano.length) l.push(`- **Para tener a mano:** ${aMano.join(", ")}.`);
  else if (r.materiales) l.push(`- **Materiales:** ${limpio(r.materiales)}`);

  if (g) {
    l.push("- **Cómo es la sesión guiada, pantalla por pantalla:**");
    g.escenas.forEach((e, i) => l.push(`  ${i + 1}. ${describirEscena(e, g, {})}${e.si ? " (Solo si eligieron esa opción.)" : ""}`));
    if (g.cuidado) l.push(`- **Cuidado antes de empezar:** ${limpio(g.cuidado)}`);
  } else if (r.pasos?.length) {
    l.push("- **Cómo se hace:**");
    r.pasos.forEach((p, i) => l.push(`  ${i + 1}. ${limpio(p)}`));
  }
  if (r.actividad) l.push(`- **La actividad, según la ficha:** ${limpio(r.actividad)}`);
  if (r.dosis) l.push(`- **Dosis propuesta (la indicación individual del equipo manda sobre esta):** ${limpio(r.dosis)}`);

  const ayuda = [...(g?.ayuda ?? []), ...(r.ayuda ? [r.ayuda] : [])].map(limpio).filter(Boolean);
  if (ayuda.length) l.push(`- **Si necesita ayuda:** ${ayuda.join(" ")}`);
  const por = (g?.ayudaPorEtapa ?? r.adaptacion_por_etapa ?? {}) as Record<string, string>;
  const adapt = APOYO.filter(([k]) => por[k]).map(([k, label]) => `${label}: ${limpio(por[k])}`);
  if (adapt.length) l.push(`- **Cómo adaptarla (de más autonomía a más apoyo):** ${adapt.join(" · ")}`);
  if (r.precaucion) l.push(`- **Precaución:** ${limpio(r.precaucion)}`);
  if (r.ten_en_cuenta) l.push(`- **Tené en cuenta:** ${limpio(r.ten_en_cuenta)}`);
  if (r.para_cerrar) l.push(`- **Para cerrar:** ${limpio(r.para_cerrar)}`);
  if (r.juego) l.push("- **Niveles:** suave, medio o retador; el equipo sugiere uno según cómo le fue antes. Al terminar, el juego pregunta cómo le resultó.");
  return l.join("\n");
}

const porModulo = new Map<ResourceModulo, Recurso[]>();
for (const r of recursos) porModulo.set(r.modulo, [...(porModulo.get(r.modulo) ?? []), r]);
const orden: ResourceModulo[] = ["cognicion", "gerontogimnasia", "movimiento", "musica", "reminiscencia", "sentidos", "nutricion", "bienvenida"];

const md: string[] = [];
md.push(`# Base de conocimiento de Clara: las actividades de IntegraMente en Casa

Generada el ${new Date().toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })} con \`scripts/clara/generar-base.ts\`, a partir de los guiones de la app y del contenido validado de cada recurso. No editar a mano: se regenera.

Total: ${recursos.length} actividades en ${porModulo.size} categorías.

## Cómo funcionan las actividades en la app

- Cada semana el equipo arma un plan con actividades por día y hora. Se ven en **Hoy** y en **Mi semana**.
- Al tocar una actividad se abre su pantalla: de qué se trata, «La ciencia de esta actividad», «Para tener a mano», «Así va a ser» (los pasos) y el botón **Empezar**.
- **Empezar** abre la **sesión guiada**: una idea por pantalla, con **Siguiente**, **Atrás**, **Escuchar** (lee la pantalla en voz alta) y **Ayuda** (pistas, consejos de la actividad, cómo adaptarla y Clara).
- En los ejercicios físicos hay un botón **Parar** arriba: muestra las señales para detenerse y permite terminar por hoy.
- Al final, la app pregunta si pudieron hacer la actividad (**Sí / En parte / No**) y si fue fácil seguir los pasos. Eso es el registro que ve el equipo. Un «No» no es un fracaso: queda registrado sin penalizar.
- Una actividad de otro día, o una ya registrada, se puede hacer **sin registrar**, para practicar.
- Algunas actividades dejan una **misión de la semana** (por ejemplo, repetirla tres veces); se marca en la pantalla de la actividad.
- Las **actividades extra** («¿Con ganas de más?», al final de Hoy) son sugerencias según el perfil, fuera del plan: se hacen para practicar y no se registran.
- Los estados de una actividad son: **Hecha**, **En parte** y **No se hizo**.

## Cómo responde Clara dentro de una actividad

- La app le manda a Clara la actividad, la pantalla en la que está la persona, la ayuda validada y la adaptación para esa persona. Clara responde sobre eso, corto y concreto.
- Clara no cambia lo que indicó el equipo (dosis, repeticiones, nivel, otro ejercicio). Si lo piden, sugiere consultarlo con el equipo por WhatsApp.
- Clara no nombra etapas, diagnósticos ni puntajes.
- Ante dolor, mareo, falta de aire, caída, confusión repentina o malestar: parar. Si es urgente, 9-1-1.

## Seguridad en los ejercicios físicos

- **Antes de empezar:** ${antesDeEmpezar}
- **Cuándo parar:** ${cuandoParar}

## Las categorías
`);
for (const m of orden) if (porModulo.has(m)) md.push(`- **${moduloLabel[m]}** (${porModulo.get(m)!.length}): ${CATEGORIAS[m]}`);
for (const m of orden) {
  const rs = porModulo.get(m);
  if (!rs) continue;
  md.push(`\n## ${moduloLabel[m]}\n`);
  for (const r of rs) md.push(ficha(r) + "\n");
}

writeFileSync(salida, md.join("\n").replace(/\n{3,}/g, "\n\n"));
console.log(`Listo: ${recursos.length} actividades → ${salida}`);
