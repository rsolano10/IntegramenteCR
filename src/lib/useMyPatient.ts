import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

export interface MyPatient {
  id: string;
  nombre: string;
  plan_status: "pendiente" | "asignado";
}

// Resolves "which real patient record am I (familiar/paciente) linked to"
// — the family/participant side of the app otherwise has no notion of a
// real Supabase patient id at all yet (weekly plan content still lives in
// the local demo store). Backed by the same patient_links self-read policy
// useSession already relies on elsewhere. Also the source of truth for
// whether onboarding is done (a real link exists) and whether the clinic
// has assigned a program yet (plan_status) — see RouteGuard/FamiliarShell.
export function useMyPatient() {
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;

  return useQuery({
    queryKey: ["my-patient", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_links")
        .select("patient_id, patients(nombre, plan_status)")
        .eq("profile_id", userId)
        .in("relation", ["familiar_admin", "participante"])
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const patients = data.patients as unknown as
        | { nombre: string; plan_status: "pendiente" | "asignado" }
        | { nombre: string; plan_status: "pendiente" | "asignado" }[]
        | null;
      const patient = Array.isArray(patients) ? patients[0] : patients;
      return { id: data.patient_id, nombre: patient?.nombre ?? "", plan_status: patient?.plan_status ?? "pendiente" } as MyPatient;
    },
    enabled: !!userId,
  });
}
