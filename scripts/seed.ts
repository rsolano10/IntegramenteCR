// Run once, locally, against a freshly-migrated Supabase project:
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed.ts
//
// Never run this in a browser or put SUPABASE_SERVICE_ROLE_KEY in Vercel env
// vars — it's the admin key and bypasses every RLS policy in this project.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const DEMO_PASSWORD = "IntegraMente2026!";

// Ported verbatim from src/lib/store.ts's `defaultOnboarding`.
const DEFAULT_ONBOARDING = {
  persona_nombre: "Rosa Jiménez",
  persona_edad: "79",
  persona_escolaridad: "primaria",
  persona_convivencia: "familiares",
  persona_tiempo_con: "hijo",
  diagnostico_tiene: "si",
  diagnostico_tipo: "alzheimer",
  diagnostico_tiempo: "mas_2a",
  diagnostico_etapa: "leve",
  condiciones: ["hipertension"],
  medicamentos_toma: "si",
  medicamentos_administra: "familiar_prepara",
  memoria_repite: "algunas",
  memoria_olvida: "algunas",
  memoria_aprender: "algunas",
  memoria_desorientacion: "nunca",
  memoria_lenguaje: "nunca",
  memoria_instrucciones: "dos",
  funcional_medicamentos: "con_ayuda",
  funcional_desayuno: "si",
  funcional_ropa: "si",
  funcional_banarse: "con_ayuda",
  funcional_compra: "no_puede",
  funcional_telefono: "si",
  movimiento_desplazamiento: "baston",
  movimiento_seguridad: "a_veces_inseguro",
  movimiento_caidas: "una",
  movimiento_salir: "acompanado",
  movimiento_levantarse: "con_impulso",
  movimiento_depie: "poco_tiempo",
  movimiento_sigue_indicaciones: "sin_dificultad",
  movimiento_limitacion_medica: "no",
  movimiento_mejorar: "equilibrio",
  nutricion_perdida_peso: "no",
  nutricion_come_menos: "no",
  nutricion_masticar_tragar: "no",
  nutricion_ultraprocesados: "1_2_semana",
  nutricion_frutas_veg: "3_mas_semana",
  nutricion_agua: "3_5",
  nutricion_quien_prepara: "familiar",
  nutricion_meta: "cerebro",
  persona2_actividades: ["cocinar", "musica", "jardineria", "fotos"],
  persona2_fortalezas: ["conversar", "cocinar"],
  persona2_incomoda: ["ruido"],
  persona2_momento_dia: "manana",
  preocupacion_principal: "memoria",
};

// Ported/flattened from src/lib/mockData.ts's `weeklyPlan` (day -> tasks).
const WEEKLY_PLAN_DAYS = [
  {
    dia: "Lunes",
    isToday: false,
    tasks: [
      {
        id: "lun-1",
        hora: "9:00 a.m.",
        titulo: "Movilidad sentada",
        tipo: "video",
        estado: "realizado",
        duracion: "12 min",
        detalle: "Serie de movimientos de brazos y piernas sentada, con apoyo firme.",
      },
    ],
  },
  {
    dia: "Martes",
    isToday: false,
    tasks: [
      {
        id: "mar-1",
        hora: "10:30 a.m.",
        titulo: "Ordenar fotos de familia",
        tipo: "actividad",
        estado: "parcial",
        duracion: "15 min",
        detalle: "Organizar cinco fotografías y conversar sobre cada una.",
        precaucion: "Se cansó a la mitad — está bien dejarla para otro momento.",
      },
    ],
  },
  {
    dia: "Miércoles",
    isToday: true,
    tasks: [
      {
        id: "mie-1",
        hora: "9:30 a.m.",
        titulo: "Movilidad sentada",
        tipo: "video",
        estado: "pendiente",
        duracion: "12 min",
        detalle: "Serie de movimientos de brazos y piernas sentada, con apoyo firme.",
      },
      {
        id: "mie-2",
        hora: "3:00 p.m.",
        titulo: "Preparar una merienda",
        tipo: "actividad",
        estado: "pendiente",
        duracion: "15 min",
        detalle: "Cocina · una instrucción por vez.",
        precaucion: "Nada caliente sin supervisión. Si se frustra, terminá la actividad sin corregir.",
        pasos: [
          "Poné sobre la mesa solo lo que se va a usar.",
          "Pedí una acción por vez y esperá sin apurar.",
          "Dejá que elija el pan o la fruta: la decisión es parte del ejercicio.",
        ],
        porQue:
          "Cocinar aparece entre sus intereses, mantiene secuencia de pasos y se hace de pie con apoyo en la mesa, compatible con su movilidad.",
      },
    ],
  },
  {
    dia: "Jueves",
    isToday: false,
    tasks: [
      { id: "jue-1", hora: "9:00 a.m.", titulo: "Repetir movilidad sentada", tipo: "video", estado: "futuro", duracion: "12 min" },
      {
        id: "jue-2",
        hora: "4:30 p.m.",
        titulo: "Ofrecer agua y merienda ligera",
        tipo: "neuroproteccion",
        estado: "futuro",
        detalle: "Cuidado neuroprotector: hidratación en cada comida y a media tarde.",
      },
    ],
  },
  {
    dia: "Viernes",
    isToday: false,
    tasks: [
      { id: "vie-1", hora: "10:00 a.m.", titulo: "Regar las plantas juntas", tipo: "actividad", estado: "futuro", duracion: "10 min" },
    ],
  },
  { dia: "Sábado", isToday: false, tasks: [] },
  {
    dia: "Domingo",
    isToday: false,
    tasks: [
      {
        id: "dom-1",
        hora: "5:00 p.m.",
        titulo: "Dar una instrucción por vez y evitar corregir innecesariamente",
        tipo: "estrategia",
        estado: "futuro",
        detalle: "Estrategia de la semana para toda la familia, no solo para una actividad puntual.",
      },
    ],
  },
];

async function createUser(email: string, role: "familiar" | "paciente" | "profesional", nombre: string, especialidad?: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role, nombre, especialidad },
  });
  if (error) throw error;
  return data.user!.id;
}

async function main() {
  console.log("Creando cuentas de prueba…");
  const familiarId = await createUser("familiar@test.com", "familiar", "Marcela Jiménez");
  const pacienteId = await createUser("paciente@test.com", "paciente", "Rosa Jiménez");
  const profesionalId = await createUser("clinica@test.com", "profesional", "Dra. Guiselle Solano", "Neuropsicología");

  console.log("Creando a Rosa…");
  const { data: rosa, error: rosaError } = await admin
    .from("patients")
    .insert({
      nombre: "Rosa Jiménez",
      edad: "79",
      modalidad: "orientado",
      plan_status: "asignado",
      onboarding_complete: true,
    })
    .select()
    .single();
  if (rosaError) throw rosaError;

  const { error: linksError } = await admin.from("patient_links").insert([
    { patient_id: rosa.id, profile_id: familiarId, relation: "familiar_admin" },
    { patient_id: rosa.id, profile_id: pacienteId, relation: "participante" },
    { patient_id: rosa.id, profile_id: profesionalId, relation: "profesional_asignado" },
  ]);
  if (linksError) throw linksError;

  const { error: onboardingError } = await admin
    .from("onboarding_answers")
    .insert({ patient_id: rosa.id, answers: DEFAULT_ONBOARDING });
  if (onboardingError) throw onboardingError;

  console.log("Creando el plan semanal de Rosa…");
  const { data: plan, error: planError } = await admin
    .from("plans")
    .insert({ patient_id: rosa.id, status: "published", created_by: profesionalId })
    .select()
    .single();
  if (planError) throw planError;

  const planTasks = WEEKLY_PLAN_DAYS.flatMap((day, dayIndex) =>
    day.tasks.map((t, taskIndex) => ({
      plan_id: plan.id,
      dia: day.dia,
      is_today: day.isToday,
      hora: t.hora,
      titulo: t.titulo,
      tipo: t.tipo,
      estado: t.estado,
      duracion: "duracion" in t ? t.duracion : null,
      detalle: "detalle" in t ? t.detalle : null,
      precaucion: "precaucion" in t ? t.precaucion : null,
      pasos: "pasos" in t ? t.pasos : null,
      por_que: "porQue" in t ? t.porQue : null,
      sort_order: dayIndex * 10 + taskIndex,
    })),
  );
  if (planTasks.length > 0) {
    const { error: tasksError } = await admin.from("plan_tasks").insert(planTasks);
    if (tasksError) throw tasksError;
  }

  console.log("Creando el mensaje inicial de la clínica…");
  const { error: mensajeError } = await admin.from("mensajes").insert({
    patient_id: rosa.id,
    texto: "Marcela: mantengamos las actividades de la mañana. Bajé la merienda a una sola consigna.",
    autor_id: profesionalId,
  });
  if (mensajeError) throw mensajeError;

  console.log("\nListo. Contraseña de las 3 cuentas de prueba:", DEMO_PASSWORD);
  console.log("  familiar@test.com / paciente@test.com / clinica@test.com");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
