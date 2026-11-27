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

const TONOS = ["bg-verde-profundo text-white", "bg-mostaza-vital text-tinta", "bg-verde-serenidad text-white", "bg-beige-serenidad text-tinta"];
const campo = "w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[16px] text-tinta focus:border-verde-serenidad focus:outline-none";

// En su propia ventana (cuenta del participante).
export function SumarAcompanante({ onClose }: { onClose: () => void }) {
  const { data: persona } = useMyPatient();
  const quien = persona?.nombre.split(" ")[0] ?? "";
  return (
    <Modal onClose={onClose}>
      <h3 className="m-0 mb-1 pr-10 font-serif font-normal text-[25px] leading-tight text-tinta">Quiénes acompañan{quien ? ` a ${quien}` : ""}</h3>
      <AcompanantesContenido onListo={onClose} />
    </Modal>
  );
}

// Quiénes acompañan a la persona y sumar a alguien (también es una pestaña
// de «Perfil de …»).
export function AcompanantesContenido({ onListo }: { onListo?: () => void }) {
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
        Un hijo o hija, la pareja, quien le ayuda en el día a día. Ven las actividades de la semana y pueden registrar cómo les fue.
      </p>

      {acompanan && acompanan.length > 0 && (
        <section>
          <p className="m-0 mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">
            Ya acompañan{quien ? ` a ${quien}` : ""} · {acompanan.length}
          </p>
          <ul className="m-0 p-0 list-none grid gap-2.5 sm:grid-cols-2">
            {acompanan.map((a, i) => {
              const tono = TONOS[i % TONOS.length];
              const etiqueta = a.soy_yo ? "Vos" : a.relation === "participante" ? "Su propia cuenta" : "Familia";
              return (
                <li key={a.profile_id} className="flex items-center gap-3 min-w-0 rounded-[18px] bg-white border border-borde px-3.5 py-3">
                  <span aria-hidden="true" className={`w-11 h-11 shrink-0 rounded-full font-serif text-[19px] inline-flex items-center justify-center ${tono}`}>
                    {a.nombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-semibold text-tinta">{a.nombre}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${a.soy_yo ? "bg-verde-profundo text-white" : "bg-verde-tenue text-verde-profundo"}`}>{etiqueta}</span>
                      {!a.confirmada && <span className="rounded-full bg-mostaza-vital/45 px-2 py-0.5 text-[12px] font-semibold text-[#6e521c]">Invitación pendiente</span>}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[24px] bg-beige-serenidad/55 px-5 py-5 sm:px-6">
        <div aria-hidden="true" className="absolute -right-10 -top-12 w-32 h-32 rounded-full bg-mostaza-vital/30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-verde-profundo text-mostaza-vital inline-flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5M19 8v6M16 11h6" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-[20px] leading-tight text-tinta">{listo ? "Invitación enviada" : `Sumar a alguien${quien ? ` que acompaña a ${quien}` : ""}`}</span>
              {!listo && <span className="block text-[13.5px] text-tinta-suave">Le llega un correo para crear su contraseña.</span>}
            </span>
          </div>

          {listo ? (
            <div className="grid gap-4">
              <p className="m-0 rounded-2xl bg-white px-4 py-3.5 text-[15.5px] leading-relaxed text-tinta">{listo}</p>
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
                {onListo && (
                  <Button variant="principal" onClick={onListo}>
                    Listo
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-[15px] font-semibold text-tinta">
                Nombre
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" className={campo} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 min-w-0 text-[15px] font-semibold text-tinta">
                  Correo
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" autoComplete="off" className={campo} />
                </label>
                <label className="grid gap-1.5 min-w-0 text-[15px] font-semibold text-tinta">
                  <span>
                    WhatsApp <span className="font-normal text-tinta-tenue">(opcional)</span>
                  </span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="8888 8888" className={campo} />
                </label>
              </div>
              {sumar.isError && <p className="m-0 text-[14.5px] text-alerta-texto">{(sumar.error as Error).message}</p>}
              <Button variant="principal" onClick={() => sumar.mutate()} disabled={sumar.isPending || !persona}>
                {sumar.isPending ? "Enviando…" : "Enviar invitación"}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
