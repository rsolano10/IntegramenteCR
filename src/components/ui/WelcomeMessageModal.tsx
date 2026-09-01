import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Modal } from "./Modal";
import { Button } from "./Button";

// Shown once, the first time a familiar/participante enters after the
// clinic accepts them and assigns a plan — `patients.welcome_message_pending`
// gates it, and the message itself is just the most recent `mensajes` row
// (assign_initial_plan inserts it there when the clinic writes one).
export function WelcomeMessageModal({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const { data: mensaje } = useQuery({
    queryKey: ["welcome-message", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("texto")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.texto ?? null;
    },
  });

  async function dismiss() {
    await supabase.rpc("dismiss_welcome_message", { p_patient_id: patientId });
    queryClient.invalidateQueries({ queryKey: ["my-patient"] });
  }

  if (!mensaje) return null;

  return (
    <Modal onClose={dismiss}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">¡Ya tenés tu programa!</h2>
      <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4.5 mb-5">
        <p className="m-0 mb-1 text-[13px] tracking-[0.12em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
        <p className="m-0 text-[16px] leading-relaxed text-tinta">{mensaje}</p>
      </div>
      <Button variant="ink" fullWidth onClick={dismiss}>
        Empezar
      </Button>
    </Modal>
  );
}
