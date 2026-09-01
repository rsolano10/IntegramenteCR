import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { usePlanMeta } from "../../lib/usePlan";
import { Metric } from "../../components/ui/Metric";
import { Button } from "../../components/ui/Button";

const moodLabel: Record<string, string> = { better: "Mejor", same: "Igual", worse: "Peor" };

export function Resumen() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") ?? undefined;
  // Right after submitting, router state has the freshest values — the
  // plan-meta query (invalidated by the submit) catches up a beat later and
  // takes over from then on, including on a direct reload of this URL.
  const routerState = (location.state as { favorita?: string; preocupacion?: string } | null) ?? {};

  const { data: planMeta } = usePlanMeta(planId);
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["plan-tasks-summary", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_tasks").select("titulo, estado").eq("plan_id", planId!);
      if (error) throw error;
      return data as { titulo: string; estado: string }[];
    },
    enabled: !!planId,
  });

  if (isLoading) return <div className="flex-1" />;

  const all = tasks ?? [];
  const done = all.filter((t) => t.estado === "realizado").length;
  const total = all.filter((t) => t.estado !== "futuro").length;
  const conAyuda = all.filter((t) => t.estado === "parcial").length;
  const funcionaron = all.filter((t) => t.estado === "realizado").map((t) => t.titulo);
  const costaron = all.filter((t) => t.estado === "no").map((t) => t.titulo);
  const favorita = planMeta?.review_favorita ?? routerState.favorita;
  const preocupacion = planMeta?.review_preocupacion ?? routerState.preocupacion;

  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Resumen</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Cómo fue la semana</h3>
      <div className="grid grid-cols-2 gap-3 mb-4.5">
        <Metric value={`${done}/${total}`} label="actividades registradas" />
        <Metric value={`${conAyuda}`} label="con ayuda" tone="amarillo" />
      </div>
      <div className="grid gap-3 mb-5">
        <div className="border border-borde rounded-2xl p-4">
          <strong className="block text-[15px] mb-1">Funcionó</strong>
          <span className="text-[16px] text-tinta-suave">
            {funcionaron.length > 0 ? funcionaron.join(", ") : "Todavía no hay actividades completadas esta semana."}
          </span>
        </div>
        <div className="border border-borde rounded-2xl p-4">
          <strong className="block text-[15px] mb-1">Costó</strong>
          <span className="text-[16px] text-tinta-suave">
            {costaron.length > 0 ? costaron.join(", ") : "Ninguna actividad quedó sin hacer esta semana."}
          </span>
        </div>
        {(favorita || preocupacion || planMeta?.week_mood) && (
          <div className="border border-borde rounded-2xl p-4">
            <strong className="block text-[15px] mb-1">Lo que contaste</strong>
            {planMeta?.week_mood && <span className="block text-[16px] text-tinta-suave">Ánimo: {moodLabel[planMeta.week_mood] ?? planMeta.week_mood}</span>}
            {favorita && <span className="block text-[16px] text-tinta-suave mt-1">Le gustó: {favorita}</span>}
            {preocupacion && <span className="block text-[16px] text-tinta-suave mt-1">Te preocupó: {preocupacion}</span>}
          </div>
        )}
        {planMeta?.feedback_mensaje && (
          <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4">
            <p className="m-0 mb-1 text-[13px] tracking-[0.1em] uppercase text-verde-profundo">Feedback de tu equipo clínico</p>
            <p className="m-0 text-[16px] leading-relaxed text-tinta">{planMeta.feedback_mensaje}</p>
          </div>
        )}
      </div>
      <Button variant="secondary" fullWidth to="/app/mensajes">
        Escribile a tu equipo clínico
      </Button>
      <p className="m-0 mt-3.5 text-[15px] leading-relaxed text-tinta-tenue">
        {planMeta?.reviewed_at
          ? "Tu equipo clínico ya revisó esta semana."
          : "Tu equipo clínico está revisando esta información para armar la próxima semana."}
      </p>
    </div>
  );
}
