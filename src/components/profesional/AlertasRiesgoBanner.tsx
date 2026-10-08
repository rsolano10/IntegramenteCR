import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { patientPath } from "../../lib/patients";
import { Button } from "../ui/Button";

interface AlertaAbierta {
  id: string;
  patient_id: string;
  patient_nombre: string;
  tipo: string;
  automatica: boolean;
  created_at: string;
  vista_at: string | null;
  creado_por_nombre: string | null;
}

const etiqueta: Record<string, string> = {
  ideacion: "Posible riesgo de autolesión",
  maltrato: "Sospecha de maltrato o abandono",
  caida: "Caída",
  cambio: "Cambio repentino de salud",
  extravio: "Riesgo de extravío",
};

function haceCuanto(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

// Avisos de riesgo enviados por familias y todavía sin atender — siempre
// lo primero que ve la clínica (panel) o, filtrado, en la pantalla del
// paciente. Abrir el paciente marca el aviso como visto (la familia ve
// "tu profesional ya lo vio"); "Atendida" lo cierra.
export function AlertasRiesgoBanner({ patientId }: { patientId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["alertas-abiertas"],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("list_alertas_abiertas");
      if (error) throw error;
      return rows as AlertaAbierta[];
    },
    refetchInterval: 60_000,
  });
  const alertas = (data ?? []).filter((a) => !patientId || a.patient_id === patientId);

  // Estar en la pantalla del paciente = visto.
  useEffect(() => {
    if (!patientId) return;
    const sinVer = alertas.filter((a) => !a.vista_at);
    if (sinVer.length === 0) return;
    Promise.all(sinVer.map((a) => supabase.rpc("marcar_alerta_vista", { p_id: a.id }))).then(() =>
      queryClient.invalidateQueries({ queryKey: ["alertas-abiertas"] }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, alertas.map((a) => a.id + a.vista_at).join()]);

  async function atender(id: string) {
    await supabase.rpc("atender_alerta", { p_id: id });
    queryClient.invalidateQueries({ queryKey: ["alertas-abiertas"] });
  }

  if (alertas.length === 0) return null;

  return (
    <section role="alert" className="border-[1.5px] border-semaforo-rojo bg-alerta rounded-3xl p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className="relative flex w-3 h-3">
          <span className="absolute inline-flex w-full h-full rounded-full bg-semaforo-rojo opacity-60 animate-ping" />
          <span className="relative inline-flex w-3 h-3 rounded-full bg-semaforo-rojo" />
        </span>
        <p className="m-0 text-[13px] tracking-[0.14em] uppercase text-alerta-texto font-bold">
          {alertas.length === 1 ? "Aviso de riesgo sin atender" : `${alertas.length} avisos de riesgo sin atender`}
        </p>
      </div>
      <div className="grid gap-2.5">
        {alertas.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 bg-white border border-alerta-borde rounded-2xl px-4 py-3.5">
            <div className="min-w-0">
              <p className="m-0 text-[16px] font-bold text-tinta">
                {etiqueta[a.tipo] ?? a.tipo}
                {!patientId && <span className="font-semibold text-tinta-suave"> · {a.patient_nombre}</span>}
              </p>
              <p className="m-0 mt-0.5 text-[13px] text-alerta-texto-suave">
                {a.automatica ? "Aviso automático" : `Enviado por ${a.creado_por_nombre ?? "la familia"}`} · {haceCuanto(a.created_at)}
                {!a.vista_at && " · sin ver"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!patientId && (
                <Button variant="urgency" size="sm" onClick={() => navigate(patientPath(a.patient_id, "mensajes"))}>
                  Ver paciente
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => atender(a.id)}>
                Marcar atendida
              </Button>
            </div>
          </div>
        ))}
      </div>
      {patientId && (
        <p className="m-0 mt-3 text-[13px] text-alerta-texto-suave">Contactá a la familia (Mensajes o por teléfono) y marcá el aviso como atendido.</p>
      )}
    </section>
  );
}
