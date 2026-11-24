import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { CONSENTIMIENTOS, VERSION_LEGAL } from "../../../lib/consentimientos";

// Qué autorizó cada cuenta del paciente (consentimientos_de_paciente):
// el equipo sabe, por ejemplo, si puede usar la IA o si llegan los avisos
// por WhatsApp. Solo lectura: cada persona decide en Mis datos y permisos.
interface Fila {
  profile_id: string;
  nombre: string;
  relation: string;
  tipo: string;
  otorgado: boolean;
  version: string;
  created_at: string;
}

const OPCIONALES = CONSENTIMIENTOS.filter((c) => !c.obligatorio);

export function PermisosPaciente({ patientId }: { patientId: string }) {
  const { data } = useQuery({
    queryKey: ["consentimientos-paciente", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("consentimientos_de_paciente", { p_patient: patientId });
      if (error) throw error;
      return (data ?? []) as Fila[];
    },
  });
  const cuentas = [...new Map((data ?? []).map((f) => [f.profile_id, f])).values()];

  return (
    <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 grid gap-4">
      <div>
        <h2 className="m-0 font-serif font-normal text-[22px]">Autorizaciones</h2>
        <p className="m-0 mt-1 text-[14.5px] text-tinta-suave">
          Las decide cada cuenta en Mis datos y permisos. Sin «IA para el equipo», el panorama y los ajustes de la semana se hacen sin IA.
        </p>
      </div>
      {cuentas.length === 0 ? (
        <p className="m-0 text-[14.5px] text-tinta-tenue">Todavía ninguna cuenta aceptó la versión vigente.</p>
      ) : (
        cuentas.map((c) => {
          const de = (data ?? []).filter((f) => f.profile_id === c.profile_id);
          const vigente = de.find((f) => f.tipo === "terminos")?.version === VERSION_LEGAL;
          return (
            <div key={c.profile_id} className="grid gap-2">
              <p className="m-0 text-[15px] font-semibold text-tinta">
                {c.nombre} <span className="font-normal text-tinta-tenue">· {c.relation === "participante" ? "participante" : "familiar"}</span>
                {!vigente && <span className="ml-2 text-[13px] font-semibold text-aviso-texto">Falta aceptar la versión vigente</span>}
              </p>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                {OPCIONALES.map((o) => {
                  const si = !!de.find((f) => f.tipo === o.tipo)?.otorgado;
                  return (
                    <li
                      key={o.tipo}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border ${si ? "bg-verde-tenue border-verde-serenidad text-verde-profundo" : "bg-white border-borde text-tinta-tenue"}`}
                    >
                      {si ? "Sí" : "No"} · {o.titulo}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
