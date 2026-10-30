// Contenido compartido de gerontogimnasia (business/integramente-recursos-spec.md
// §2.2), texto literal de docs/content-source/gerontogimnasia-manual-2026-10-23.txt.
// Se muestra con cualquier ejercicio GER; "Cuándo parar" va destacado y
// antes del video y las consignas.

export const antesDeEmpezar =
  "Confirmá que la actividad está indicada para hoy. Prepará luz, calzado firme, suelo despejado y una silla estable sin ruedas. Para ejercicios de pie, usá el soporte fijo que se haya indicado. No retires el bastón o andador habitual. El familiar no debe tirar de los brazos ni improvisar transferencias o una ayuda física que no sabe realizar.";

export const cuandoParar =
  "Detené la actividad ante dolor nuevo, mareo, inestabilidad, fatiga inusual, falta de aire, confusión, angustia o rechazo. Dolor en el pecho, desmayo, dificultad respiratoria intensa o síntomas neurológicos súbitos requieren atención urgente. Una caída con lesión o pérdida nueva de capacidad requiere valoración; no se sustituye automáticamente por ejercicio sentado.";

export const comoIncorporarDobleTarea = [
  "Primero se practica el movimiento y la consigna cognitiva por separado. Se combinan solo si ambos y su ejecución conjunta son seguros. Si pensar o responder empeora el movimiento, retirás la consigna cognitiva; si el problema persiste, parás. Marcha, giros, escalones y equilibrio sobre un pie no llevan una segunda tarea por defecto. La duración de un video no define la dosis.",
  "Mantener esfuerzo suave, respiración continua y descansos. Aumentar una sola variable dentro del plan indicado; en fuerza, mantener la recuperación entre sesiones establecida por el terapeuta.",
];

// Para el perfil (clínica): rutas y supervisión.
export const rutasIntro =
  "Los colores son rutas editoriales propuestas para IntegraMente, no una escala clínica validada. Se selecciona la capacidad necesaria para la variante y se registra por separado la supervisión. Una persona de ruta verde también puede hacer ejercicios sentados; un diagnóstico no determina su color.";

export const rutasDescripcion = {
  verde:
    "Puede ponerse de pie y caminar con estabilidad en el entorno evaluado. Utiliza su ayuda habitual si corresponde. Esto no autoriza quitar apoyos ni hacer doble tarea por cuenta propia.",
  amarillo:
    "Conserva actividad sentada y puede realizar tareas de pie o desplazamientos con el apoyo o asistencia indicados, según evaluación. El acompañante debe poder ofrecer la ayuda que exige la ficha.",
  rojo: "Se prioriza movimiento activo sentado con control postural y apoyos evaluados. Si no puede sostener la postura o colaborar, necesita una pauta individual; no se convierte la ficha en movilización pasiva.",
} as const;

export const supervisionYCognicion =
  "Registrar por separado: autonomía comprobada, guía verbal, acompañamiento presencial continuo o ayuda física entrenada. En deterioro cognitivo leve y demencia leve, adaptar consignas; en demencia moderada, comprobar comprensión y tolerancia con acompañamiento. En demencia avanzada, priorizar confort y movimiento activo voluntario individualizado; no asignar doble tarea automáticamente.";

export const supervisionLabel = {
  autonomia_comprobada: "Autonomía comprobada",
  guia_verbal: "Guía verbal",
  acompanamiento_presencial_continuo: "Acompañamiento presencial continuo",
  ayuda_fisica_entrenada: "Ayuda física entrenada",
} as const;
