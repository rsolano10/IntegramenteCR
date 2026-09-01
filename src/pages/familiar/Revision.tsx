import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePendingReviews, useSubmitWeekReview } from "../../lib/usePlan";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";

function formatWeekOf(publishAt: string) {
  return new Date(publishAt).toLocaleDateString("es-CR", { day: "numeric", month: "long" });
}

export function Revision() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const session = useSession();
  const isParticipante = session.status === "authed" && session.profile.role === "paciente";
  const revisionBase = isParticipante ? "/app/participante/revision" : "/app/revision";
  const resumenBase = isParticipante ? "/app/participante/resumen" : "/app/resumen";

  const { data: myPatient } = useMyPatient();
  const { data: pending, isLoading: loadingPending } = usePendingReviews(myPatient?.id);
  const submitWeekReview = useSubmitWeekReview(myPatient?.id);

  const weekMood = useAppStore((s) => s.weekMood);
  const setWeekMood = useAppStore((s) => s.setWeekMood);
  const [favorita, setFavorita] = useState("");
  const [preocupacion, setPreocupacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!planId) {
    if (loadingPending) return <div className="flex-1" />;
    return (
      <div>
        <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Semana</p>
        <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Semanas por evaluar</h3>
        {!pending || pending.length === 0 ? (
          <p className="m-0 text-[15px] text-tinta-tenue">No hay semanas pendientes de evaluar por ahora.</p>
        ) : (
          <div className="grid gap-2.5">
            {pending.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`${revisionBase}?plan=${p.id}`)}
                className="text-left flex items-center justify-between gap-3 bg-white border border-borde rounded-2xl px-4 py-3.5 cursor-pointer hover:border-verde-serenidad"
              >
                <span className="text-[15px] font-semibold text-tinta">Semana del {formatWeekOf(p.publishAt)}</span>
                <span className="text-[13px] font-semibold text-verde-profundo">Evaluar ›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  async function submit() {
    setError("");
    setSaving(true);
    try {
      await submitWeekReview(planId!, weekMood, favorita, preocupacion);
      navigate(`${resumenBase}?plan=${planId}`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "No pudimos guardar. Probá de nuevo.");
    }
  }

  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Revisión semanal</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Tres preguntas y listo</h3>
      <div className="grid gap-5 mb-5">
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Cómo estuvo el ánimo esta semana?</p>
          <OptionGroup
            value={weekMood}
            onChange={setWeekMood}
            options={[
              { value: "better", label: "Mejor" },
              { value: "same", label: "Igual" },
              { value: "worse", label: "Peor" },
            ]}
          />
        </div>
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Qué actividad le gustó más?</p>
          <input
            type="text"
            value={favorita}
            onChange={(e) => setFavorita(e.target.value)}
            placeholder="Opcional"
            className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px]"
          />
        </div>
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Hubo algo que te preocupó?</p>
          <input
            type="text"
            value={preocupacion}
            onChange={(e) => setPreocupacion(e.target.value)}
            placeholder="Opcional"
            className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px]"
          />
        </div>
      </div>
      {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
      <Button variant="ink" fullWidth onClick={submit} disabled={saving}>
        {saving ? "Guardando…" : "Ver resumen de la semana"}
      </Button>
    </div>
  );
}
