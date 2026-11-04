import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { Button } from "../components/ui/Button";

interface Rechazo {
  id: string;
  patient_nombre: string;
  mensaje: string;
  created_at: string;
}

export function Consent() {
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;
  const queryClient = useQueryClient();

  // Una cuenta sin paciente llega acá — pero puede ser porque la clínica
  // rechazó su solicitud (eso borra al paciente). En ese caso, antes de
  // ofrecer empezar de nuevo, mostrarle el mensaje que le dejó la clínica.
  const { data: rechazo, isPending } = useQuery({
    queryKey: ["rechazo-pendiente", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_rechazadas")
        .select("id, patient_nombre, mensaje, created_at")
        .is("visto_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data as Rechazo | null;
    },
    enabled: !!userId,
  });

  if (session.status === "loading" || (userId && isPending)) return <div className="min-h-[40vh]" />;
  if (rechazo) {
    return (
      <SolicitudRechazada
        rechazo={rechazo}
        onContinuar={async () => {
          await supabase.rpc("marcar_rechazo_visto", { p_id: rechazo.id });
          queryClient.setQueryData(["rechazo-pendiente", userId], null);
        }}
      />
    );
  }
  // Sin rechazo pendiente: directo al cuestionario (el consentimiento se
  // da en su primera pantalla, ver ConsentimientoInicial en OnboardingStep).
  return <Navigate to="/app/perfil/bienvenida" replace />;
}

function SolicitudRechazada({ rechazo, onContinuar }: { rechazo: Rechazo; onContinuar: () => Promise<void> }) {
  return (
    <div className="im-in max-w-[620px] mx-auto px-5 py-12 pb-16 sm:px-8 lg:py-16">
      <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Sobre tu solicitud</p>
      <h1 className="font-serif font-normal text-[28px] sm:text-[36px] leading-[1.15] m-0 mb-4">
        Revisamos la información de {rechazo.patient_nombre}
      </h1>
      <p className="m-0 mb-6 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
        Gracias por confiar en IntegraMente. Por ahora el programa en casa no es la mejor opción, y el equipo clínico te dejó este mensaje:
      </p>
      <div className="bg-white border border-borde border-l-4 border-l-verde-serenidad rounded-3xl p-5 sm:p-6 mb-6">
        <p className="m-0 text-[16px] leading-relaxed text-tinta whitespace-pre-wrap">{rechazo.mensaje}</p>
        <p className="m-0 mt-3 text-[13px] text-tinta-tenue">
          {new Date(rechazo.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="bg-campo border border-borde-suave rounded-3xl p-5 sm:p-6 mb-6">
        <p className="m-0 mb-1 text-[15px] font-semibold text-tinta">¿Querés conversarlo?</p>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
          Escribinos por WhatsApp al <strong>+506 8346 4703</strong> o a <strong>info@integramente.com</strong> — con gusto vemos otras
          alternativas juntos.
        </p>
      </div>
      <Button variant="secondary" onClick={onContinuar}>
        Iniciar una nueva solicitud
      </Button>
    </div>
  );
}
