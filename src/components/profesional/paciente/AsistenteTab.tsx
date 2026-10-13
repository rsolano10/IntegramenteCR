import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../ui/Button";
import { motivoLabel } from "../../../lib/asistenteRevision";

interface Fila {
  id: string;
  created_at: string;
  dia: string;
  rol: "usuario" | "asistente";
  texto: string;
  categoria: string | null;
  marcado: boolean;
  motivo_marca: string | null;
  feedback: number | null;
  revisado_at: string | null;
  autor_nombre: string | null;
}

// Las conversaciones del Asistente IntegraMente que la familia tuvo y que
// tienen algo para revisar (derivaciones, emergencias, respuestas que el
// filtro reemplazó o que calificaron con 👎). Se muestra el día completo
// para entender el contexto. La familia sabe que el equipo puede verlas.
export function AsistenteTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const { data: filas, isLoading } = useQuery({
    queryKey: ["asistente-revision", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("asistente_revision", { p_patient_id: patientId });
      if (error) throw error;
      return data as Fila[];
    },
  });

  const sinRevisar = (filas ?? []).filter((f) => f.marcado && !f.revisado_at).length;

  async function marcarRevisadas() {
    await supabase.rpc("asistente_marcar_revisadas", { p_patient_id: patientId });
    queryClient.invalidateQueries({ queryKey: ["asistente-revision", patientId] });
    queryClient.invalidateQueries({ queryKey: ["asistente-pendientes"] });
  }

  const dias = new Map<string, Fila[]>();
  for (const f of filas ?? []) {
    if (!dias.has(f.dia)) dias.set(f.dia, []);
    dias.get(f.dia)!.push(f);
  }
  const ordenDias = [...dias.keys()].sort().reverse();

  return (
    <section className="max-w-[860px] grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave max-w-[560px]">
          Conversaciones de la familia con el asistente que tienen algo para revisar: derivaciones al equipo, emergencias, respuestas que el filtro de
          seguridad reemplazó o que no les sirvieron. Lo demás es privado.
        </p>
        {sinRevisar > 0 && (
          <Button variant="secondary" size="sm" onClick={marcarRevisadas}>
            Marcar {sinRevisar === 1 ? "1 como revisada" : `${sinRevisar} como revisadas`}
          </Button>
        )}
      </div>

      {isLoading && <p className="m-0 text-[14.5px] text-tinta-tenue">Cargando…</p>}
      {!isLoading && ordenDias.length === 0 && (
        <p className="m-0 text-[14.5px] text-tinta-tenue bg-white border border-borde rounded-2xl p-5">Nada para revisar en los últimos 90 días.</p>
      )}

      {ordenDias.map((dia) => {
        const fs = dias.get(dia)!;
        return (
          <article key={dia} className="bg-white border border-borde rounded-3xl p-5 sm:p-6">
            <header className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <h3 className="m-0 font-serif font-normal text-[20px]">
                {new Date(`${dia}T12:00:00`).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <span className="text-[13px] text-tinta-tenue">{fs.find((f) => f.autor_nombre)?.autor_nombre ?? "Familia"}</span>
            </header>
            <div className="grid gap-2.5">
              {fs.map((f) => (
                <div
                  key={f.id}
                  className={`rounded-2xl px-4 py-3 max-w-[88%] ${f.rol === "usuario" ? "justify-self-end bg-verde-tenue" : "justify-self-start bg-campo"} ${
                    f.marcado ? (f.revisado_at ? "ring-1 ring-borde" : "ring-2 ring-alerta-borde") : ""
                  }`}
                >
                  <p className="m-0 mb-1 text-[12px] text-tinta-tenue">
                    {f.rol === "usuario" ? "Familia" : "Asistente"} ·{" "}
                    {new Date(f.created_at).toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" })}
                    {f.marcado && f.motivo_marca && (
                      <span className={`ml-2 font-semibold ${f.revisado_at ? "text-tinta-tenue" : "text-alerta-texto"}`}>
                        {motivoLabel[f.motivo_marca] ?? f.motivo_marca}
                        {f.revisado_at ? " · revisado" : ""}
                      </span>
                    )}
                    {f.feedback === 1 && <span className="ml-2">👍</span>}
                    {f.feedback === -1 && <span className="ml-2">👎</span>}
                  </p>
                  <p className="m-0 text-[14.5px] leading-relaxed text-tinta whitespace-pre-line">{f.texto}</p>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
