import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { patientPath } from "../../lib/patients";
import { EJES, ejeLabel, type Eje } from "../../lib/revisiones";
import { Caja, CajaAviso, CajaCuerpo } from "../profesional/Caja";
import { NuevaTareaModal } from "../profesional/tareas/NuevaTareaModal";

// Panel de la coordinación: pacientes con algún eje en rojo que nadie del
// área revisó todavía. Un toque para pedirle la revisión al área que
// corresponde. Desaparece cuando no hay ninguno.
interface Fila {
  patient_id: string;
  nombre: string;
  ejes: Eje[];
}

export function EjesRojosSinRevisar() {
  const { data } = useQuery({
    queryKey: ["ejes-rojos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ejes_rojos_sin_revisar");
      if (error) throw error;
      return (data ?? []) as Fila[];
    },
  });
  const [pedir, setPedir] = useState<{ fila: Fila; eje: Eje } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!data || data.length === 0) return aviso ? <CajaAviso texto={aviso} onCerrar={() => setAviso(null)} /> : null;

  return (
    <Caja nivel={2} eyebrow="Valoración" titulo="Ejes en rojo sin revisar" descripcion="Nadie del área los confirmó todavía. Pedile la revisión a quien corresponde.">
      {aviso && <CajaAviso texto={aviso} onCerrar={() => setAviso(null)} />}
      <CajaCuerpo>
        <ul className="m-0 p-0 list-none rounded-[20px] border border-borde bg-white divide-y divide-borde-suave overflow-hidden">
          {data.map((f) => (
            <li key={f.patient_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Link to={patientPath(f.patient_id, "evaluacion")} className="text-[15px] font-semibold text-tinta no-underline hover:text-verde-profundo">
                {f.nombre}
              </Link>
              <span className="flex flex-wrap gap-1.5">
                {f.ejes.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setPedir({ fila: f, eje: e })}
                    className="inline-flex items-center gap-1.5 min-h-8 px-3 rounded-full border-[1.5px] border-borde bg-white text-[12.5px] font-semibold text-tinta cursor-pointer font-sans hover:border-verde-serenidad"
                  >
                    <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-semaforo-rojo" />
                    {ejeLabel(e)} · Pedir revisión
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </CajaCuerpo>
      {pedir && (
        <NuevaTareaModal
          contexto={{ tipo: "valorar_paciente", patientId: pedir.fila.patient_id, patientNombre: pedir.fila.nombre, eje: pedir.eje, areas: EJES.find((x) => x.id === pedir.eje)?.area }}
          onClose={() => setPedir(null)}
          onCreada={(m) => {
            setPedir(null);
            setAviso(m);
          }}
        />
      )}
    </Caja>
  );
}
