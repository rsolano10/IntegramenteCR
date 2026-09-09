import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

export interface MyPatient {
  id: string;
  nombre: string;
  edad: string | null;
  modalidad: string;
  plan_status: "pendiente" | "asignado";
  vista_completa: boolean;
  welcome_message_pending: boolean;
  // Fase 11: true cuando este paciente todavía tiene onboarding_answers en
  // schema_version < 2 (cuestionario viejo) — RouteGuard lo obliga a
  // completar el cuestionario nuevo antes de seguir usando la app.
  needsReregistration: boolean;
}

// Resolves "which real patient record am I (familiar/paciente) linked to"
// — the family/participant side of the app otherwise has no notion of a
// real Supabase patient id at all yet (weekly plan content still lives in
// the local demo store). Backed by the my_patient() RPC (security definer —
// participante has no direct SELECT policy on onboarding_answers, which
// this needs to read schema_version). Also the source of truth for whether
// onboarding is done (a real link exists), whether it needs to be redone
// (needsReregistration), and whether the clinic has assigned a program yet
// (plan_status) — see RouteGuard/FamiliarShell.
export function useMyPatient() {
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;

  return useQuery({
    queryKey: ["my-patient", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_patient");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        id: row.id,
        nombre: row.nombre ?? "",
        edad: row.edad ?? null,
        modalidad: row.modalidad ?? "orientado",
        plan_status: row.plan_status ?? "pendiente",
        vista_completa: row.vista_completa ?? false,
        welcome_message_pending: row.welcome_message_pending ?? false,
        needsReregistration: row.needs_reregistration ?? false,
      } as MyPatient;
    },
    enabled: !!userId,
  });
}
