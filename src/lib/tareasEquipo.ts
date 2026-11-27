import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { rangoSemana } from "./planWeek";

// Tareas del equipo clínico: la clínica/coordinación pide revisiones (un
// paciente, una semana, una plantilla) a alguien del equipo, que responde
// desde su perfil. Así queda registrado que todo lo revisa el equipo.

export type TipoTarea = "revisar_paciente" | "revisar_semana" | "armar_semana" | "revisar_plantilla" | "otra";
export type EstadoTarea = "pendiente" | "en_curso" | "resuelta" | "cancelada";
export type ResultadoTarea = "aprobado" | "con_cambios" | "comentario";

export const TIPO_TAREA: Record<TipoTarea, string> = {
  revisar_paciente: "Revisar un paciente",
  revisar_semana: "Revisar una semana",
  armar_semana: "Proponer la semana",
  revisar_plantilla: "Revisar una plantilla",
  otra: "Otra consulta",
};
export const ESTADO_TAREA: Record<EstadoTarea, string> = { pendiente: "Pendiente", en_curso: "En curso", resuelta: "Resuelta", cancelada: "Cancelada" };
export const RESULTADO_TAREA: Record<ResultadoTarea, string> = { aprobado: "Aprobado", con_cambios: "Con cambios sugeridos", comentario: "Con comentarios" };

export interface TareaEquipo {
  id: string;
  tipo: TipoTarea;
  titulo: string;
  detalle: string | null;
  estado: EstadoTarea;
  resultado: ResultadoTarea | null;
  respuesta: string | null;
  vence: string | null;
  created_at: string;
  resuelta_en: string | null;
  patient_id: string | null;
  paciente: string | null;
  plan_id: string | null;
  plan_inicio: string | null;
  plantilla_id: string | null;
  plantilla: string | null;
  asignada_a: string;
  asignada_nombre: string;
  asignada_area: string | null;
  creada_por_nombre: string | null;
}

export interface MiembroEquipo {
  profile_id: string;
  nombre: string;
  especialidad: string | null;
  rol: "equipo" | "profesional";
  pendientes: number;
}

export function useTareasEquipo() {
  return useQuery({
    queryKey: ["tareas-equipo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tareas_equipo_lista");
      if (error) throw error;
      return (data ?? []) as TareaEquipo[];
    },
  });
}

export function useEquipoClinico(enabled = true) {
  return useQuery({
    queryKey: ["equipo-clinico"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("equipo_clinico");
      if (error) throw error;
      return (data ?? []) as MiembroEquipo[];
    },
  });
}

export function useResponderTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (x: { id: string; estado: EstadoTarea; resultado?: ResultadoTarea | null; respuesta?: string }) => {
      const { error } = await supabase.rpc("responder_tarea_equipo", { p_id: x.id, p_estado: x.estado, p_resultado: x.resultado ?? null, p_respuesta: x.respuesta ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tareas-equipo"] });
      qc.invalidateQueries({ queryKey: ["equipo-clinico"] });
    },
  });
}

// Sobre qué es la tarea, en una línea.
export function sobreQue(t: TareaEquipo): string {
  if (t.plantilla) return `Plantilla «${t.plantilla}»`;
  if (t.plan_inicio && t.paciente) return `${t.paciente} · semana del ${rangoSemana(t.plan_inicio)}`;
  return t.paciente ?? "";
}
