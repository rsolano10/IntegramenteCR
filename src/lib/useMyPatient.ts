import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

export interface MyPatient {
  id: string;
  nombre: string;
}

// Resolves "which real patient record am I (familiar/paciente) linked to"
// — the family/participant side of the app otherwise has no notion of a
// real Supabase patient id at all yet (onboarding/plan data still lives in
// the local demo store). Backed by the same patient_links self-read policy
// useSession already relies on elsewhere.
export function useMyPatient() {
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;

  return useQuery({
    queryKey: ["my-patient", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_links")
        .select("patient_id, patients(nombre)")
        .eq("profile_id", userId)
        .in("relation", ["familiar_admin", "participante"])
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const patients = data.patients as unknown as { nombre: string } | { nombre: string }[] | null;
      const nombre = Array.isArray(patients) ? patients[0]?.nombre : patients?.nombre;
      return { id: data.patient_id, nombre: nombre ?? "" } as MyPatient;
    },
    enabled: !!userId,
  });
}
