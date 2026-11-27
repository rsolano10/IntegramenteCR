import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { callAdminAccounts } from "../../lib/adminAccounts";
import { normalizeCrPhone } from "../../lib/phone";
import { useMyPatient } from "../../lib/useMyPatient";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

// Sumar a otro familiar o acompañante a la persona del programa: la persona
// ya está inscrita (con su cuestionario y su plan), así que solo se piden
// los datos de quien se suma. Le llega un correo para crear su contraseña y
// ve lo mismo que la familia.
interface Acompanante {
  profile_id: string;
  nombre: string;
  relation: "familiar_admin" | "participante";
  confirmada: boolean;
  soy_yo: boolean;
}

const campo = "w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta focus:border-verde-serenidad focus:outline-none";

export function SumarAcompanante({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: persona } = useMyPatient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [listo, setListo] = useState<string | null>(null);
  const quien = persona?.nombre.split(" ")[0] ?? "";
  const { data: acompanan } = useQuery({
    queryKey: ["acompanantes", persona?.id],
    enabled: !!persona,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("acompanantes", { p_patient: persona!.id });
      if (error) throw error;
      return (data ?? []) as Acompanante[];
    },
  });

  const sumar = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("Escribí su nombre.");
      if (!email.trim()) throw new Error("Escribí su correo: ahí le llega la invitación.");
      const tel = whatsapp.trim() ? normalizeCrPhone(whatsapp) : null;
      if (whatsapp.trim() && !tel) throw new Error("El WhatsApp no parece válido: usá los 8 dígitos.");
      return (await callAdminAccounts("sumar_acompanante", {
        patientId: persona!.id,
        nombre: nombre.trim(),
        email: email.trim(),
        ...(tel ? { whatsappPhone: tel } : {}),
      })) as { invitado?: boolean };
    },
    onSuccess: (r) => {
      setListo(
        r?.invitado
          ? `Listo. Le enviamos un correo a ${nombre.split(" ")[0]} para que cree su contraseña. Cuando entre, va a ver lo mismo que vos.`
          : `Listo. ${nombre.split(" ")[0]} ya tenía cuenta: ahora también acompaña a ${quien}.`,
      );
      qc.invalidateQueries({ queryKey: ["acompanantes"] });
    },
  });

  return (
    <Modal onClose={onClose}>
      <h3 className="m-0 mb-1 pr-10 font-serif font-normal text-[25px] leading-tight text-tinta">Sumar a alguien que acompaña{quien ? ` a ${quien}` : ""}</h3>
      <p className="m-0 mb-5 text-[15px] leading-relaxed text-tinta-suave">
        Un hijo o hija, la pareja, quien le ayuda en el día a día. Va a ver las actividades de la semana y podrá registrar cómo les fue.
      </p>

      {acompanan && acompanan.length > 0 && (
        <div className="mb-5">
          <p className="m-0 mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-tinta-tenue">Ya acompañan{quien ? ` a ${quien}` : ""}</p>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
            {acompanan.map((a) => (
              <li key={a.profile_id} className="inline-flex items-center gap-2 rounded-full bg-campo border border-borde-suave pl-1.5 pr-3 py-1 text-[14px] text-tinta">
                <span className="w-7 h-7 rounded-full bg-beige-serenidad text-[12px] font-bold inline-flex items-center justify-center">{a.nombre.charAt(0).toUpperCase()}</span>
                {a.soy_yo ? "Vos" : a.nombre.split(" ")[0]}
                {a.relation === "participante" && <span className="text-tinta-tenue">(su cuenta)</span>}
                {!a.confirmada && <span className="text-tinta-tenue">· invitación pendiente</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {listo ? (
        <div className="grid gap-4">
          <p className="m-0 rounded-2xl bg-verde-tenue border border-verde-serenidad/50 px-4 py-3.5 text-[15.5px] leading-relaxed text-tinta">{listo}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setListo(null);
                setNombre("");
                setEmail("");
                setWhatsapp("");
              }}
            >
              Sumar a otra persona
            </Button>
            <Button variant="principal" onClick={onClose}>
              Listo
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-[15px] font-semibold text-tinta">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" className={campo} />
          </label>
          <label className="grid gap-1.5 text-[15px] font-semibold text-tinta">
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" autoComplete="off" className={campo} />
            <span className="text-[13px] font-normal text-tinta-tenue">Le llega un correo para crear su contraseña.</span>
          </label>
          <label className="grid gap-1.5 text-[15px] font-semibold text-tinta">
            WhatsApp (opcional)
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="8888 8888" className={campo} />
          </label>
          {sumar.isError && <p className="m-0 text-[14.5px] text-alerta-texto">{(sumar.error as Error).message}</p>}
          <Button variant="principal" onClick={() => sumar.mutate()} disabled={sumar.isPending || !persona}>
            {sumar.isPending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
