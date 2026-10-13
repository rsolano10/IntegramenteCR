import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { waLink } from "../../../lib/whatsapp";
import { WhatsAppIcon } from "../../ui/WhatsAppIcon";

interface Contacto {
  profile_id: string;
  nombre: string;
  relation: "familiar_admin" | "participante";
  whatsapp_phone: string | null;
}

function useContactosPaciente(patientId: string) {
  return useQuery({
    queryKey: ["contactos-paciente", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("contactos_paciente", { p_patient_id: patientId });
      if (error) throw error;
      return data as Contacto[];
    },
  });
}

// La app no tiene chat con la familia: WhatsApp es el único canal. Un
// botón por cada cuenta vinculada que registró su número, con el saludo ya
// escrito para que el equipo solo complete el mensaje.
export function ContactoWhatsApp({ patientId, patientNombre, size = "md" }: { patientId: string; patientNombre: string; size?: "sm" | "md" }) {
  const { data: contactos, isLoading } = useContactosPaciente(patientId);
  if (isLoading) return null;
  const conNumero = (contactos ?? []).filter((c) => c.whatsapp_phone);
  if (conNumero.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold bg-campo text-tinta-tenue border border-borde-suave">
        <WhatsAppIcon size={15} /> Sin WhatsApp registrado
      </span>
    );
  }
  return (
    <>
      {conNumero.map((c) => (
        <a
          key={c.profile_id}
          href={waLink(c.whatsapp_phone!, `Hola ${c.nombre.split(" ")[0]}, te escribimos del equipo de IntegraMente por ${patientNombre}.`)}
          target="_blank"
          rel="noreferrer"
          title={`${c.nombre} · ${c.whatsapp_phone}`}
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold no-underline bg-[#25d366] text-white hover:brightness-95 ${
            size === "sm" ? "min-h-9 px-3 text-[13px]" : "px-3.5 py-1.5 text-[13px]"
          }`}
        >
          <WhatsAppIcon size={15} />
          {conNumero.length > 1 || c.relation === "participante" ? `WhatsApp · ${c.nombre.split(" ")[0]}` : "WhatsApp a la familia"}
        </a>
      ))}
    </>
  );
}
