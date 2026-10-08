import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface PatientLink {
  profile_id: string;
  nombre: string;
  role: "familiar" | "paciente" | "profesional";
  relation: "familiar_admin" | "participante" | "profesional_asignado";
}

export interface PatientRow {
  id: string;
  nombre: string;
  edad: string | null;
  modalidad: string;
  plan_status: "pendiente" | "asignado";
  onboarding_complete: boolean;
  created_at: string;
  cognitivo: string | null;
  fisico: string | null;
  funcional: string | null;
  nutricional: string | null;
  links: PatientLink[];
  needs_review: boolean;
  needs_assignment: boolean;
  posible_duplicado_de: string | null;
  posible_duplicado_nombre: string | null;
}

// Shared roster query (list_patients RPC) — Panel, Usuarios and the patient
// screen all read the same ["patients"] cache entry.
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });
}

export function patientPath(id: string, tab?: "evaluacion" | "semana" | "planificar" | "mensajes" | "cuentas") {
  return `/app/profesional/paciente/${id}${tab ? `?tab=${tab}` : ""}`;
}
