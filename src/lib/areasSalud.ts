// Áreas de salud del equipo (profiles.especialidad). La clínica y la
// coordinación son el mismo rol («profesional»): ven y hacen lo mismo.
export const AREAS_SALUD = [
  "Coordinación",
  "Dirección del programa",
  "Estimulación cognitiva",
  "Gerontogimnasia",
  "Nutrición",
  "Terapia ocupacional",
  "Psicología",
  "Medicina general",
  "Geriatría",
  "Neuropsicología",
  "Fisioterapia",
] as const;

// Para los profesionales referidores (externos).
export const ESPECIALIDADES_REFERIDOR = ["Geriatría", "Medicina general", "Neurología", "Psiquiatría", "Psicología", "Fisioterapia", "Terapia ocupacional", "Nutrición", "Trabajo social"] as const;

export const ROL_ETIQUETA: Record<string, string> = {
  profesional: "Clínica / Coordinación",
  equipo: "Equipo clínico",
  referidor: "Profesional referidor",
  familiar: "Familiar",
  paciente: "Participante",
};
