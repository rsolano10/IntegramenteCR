import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// Quién refirió al paciente (solo la clínica y la administración lo ven).
// Se completa solo si la familia se registró con el enlace del profesional;
// si no, la clínica lo elige acá.
export function ReferidoPor({ patientId, onCambio }: { patientId: string; onCambio: (msg: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const { data: actual } = useQuery({
    queryKey: ["referido-de", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("referidos").select("referidor_id, origen").eq("patient_id", patientId).maybeSingle();
      if (error) throw error;
      return data as { referidor_id: string; origen: "enlace" | "manual" } | null;
    },
  });
  const { data: referidores } = useQuery({
    queryKey: ["referidores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("referidores_lista");
      if (error) throw error;
      return (data ?? []) as { profile_id: string; nombre: string; especialidad: string | null; institucion: string | null; activo: boolean }[];
    },
  });
  const cambiar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("asignar_referidor", { p_patient: patientId, p_referidor: id || null });
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["referido-de", patientId] });
      const r = referidores?.find((x) => x.profile_id === id);
      onCambio(r ? `Referido por ${r.nombre}.` : "Quitaste quién lo refirió.");
    },
    onError: (e) => onCambio((e as Error).message, true),
  });
  if (!referidores?.length && !actual) return null;
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-borde bg-white pl-3.5 pr-1.5 py-1 text-[13px] font-semibold text-tinta-suave">
      Referido por
      <select
        value={actual?.referidor_id ?? ""}
        onChange={(e) => cambiar.mutate(e.target.value)}
        className="min-h-8 max-w-[200px] rounded-full border-0 bg-campo px-2.5 font-sans text-[13px] text-tinta cursor-pointer"
        title={actual?.origen === "enlace" ? "Se registró con el enlace del profesional" : undefined}
      >
        <option value="">Nadie</option>
        {(referidores ?? []).map((r) => (
          <option key={r.profile_id} value={r.profile_id}>
            {r.nombre}
            {r.especialidad ? ` · ${r.especialidad}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
