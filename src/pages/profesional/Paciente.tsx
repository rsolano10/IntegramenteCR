import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useAppStore } from "../../lib/store";
import { usePatients } from "../../lib/patients";
import { attentionFor, attentionMeta } from "../../lib/patientAttention";
import { questions, type Answers } from "../../lib/onboardingSchema";
import { rolRespondente } from "../../lib/respondentVoice";
import { planTiers } from "../../lib/mockData";
import { EvaluacionTab } from "../../components/profesional/paciente/EvaluacionTab";
import { type PlanSummary } from "../../components/profesional/paciente/SemanaTab";
import { SeguimientoTab } from "../../components/profesional/paciente/SeguimientoTab";
import { PlanificadorTab } from "../../components/profesional/paciente/PlanificadorTab";
import { MensajesTab } from "../../components/profesional/paciente/MensajesTab";
import { VinculosTab } from "../../components/profesional/paciente/VinculosTab";
import { AlertasRiesgoBanner } from "../../components/profesional/AlertasRiesgoBanner";

type Tab = "evaluacion" | "semana" | "planificar" | "mensajes" | "cuentas";

const respondenteLabel: Record<string, string> = {
  propia_persona: "la propia persona",
  familiar: "un familiar",
  cuidador: "su cuidador/a",
  profesional: "un profesional",
  otra_persona: "otra persona",
};

// La pantalla de un paciente para la clínica — reemplaza al modal que
// mezclaba evaluación, plan, mensajes y cuentas en una sola columna. Cada
// momento del ciclo tiene su pestaña, y el panel abre directo en la que
// corresponde (?tab=): evaluar a alguien nuevo, revisar la semana que
// terminó, o armar la próxima.
export function Paciente() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const resetOnboardingForNewAccount = useAppStore((s) => s.resetOnboardingForNewAccount);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: patients, isLoading: loadingPatients } = usePatients();
  const patient = patients?.find((p) => p.id === id) ?? null;
  const pendiente = patient?.plan_status === "pendiente";

  const { data: answers, isLoading: loadingAnswers } = useQuery({
    queryKey: ["onboarding-answers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", id).maybeSingle();
      if (error) throw error;
      return (data?.answers ?? null) as Answers | null;
    },
    enabled: !!id,
  });

  const { data: extra } = useQuery({
    queryKey: ["patient-extra", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("programa_elegido_en").eq("id", id).maybeSingle();
      // Column only exists once 20261008000000_elegir_programa is applied.
      if (error) return { programa_elegido_en: null as string | null };
      return data as { programa_elegido_en: string | null };
    },
    enabled: !!id,
  });

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["patient-plans", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, publish_at, reviewed_at, feedback_mensaje, family_reviewed_at, week_mood, review_favorita, review_preocupacion")
        .eq("patient_id", id)
        .eq("status", "published")
        .order("publish_at", { ascending: false });
      if (error) throw error;
      return data as PlanSummary[];
    },
    enabled: !!id && !pendiente,
  });

  if (loadingPatients) return <div className="min-h-[50vh]" />;
  if (!patient) {
    return (
      <div className="max-w-[700px] mx-auto px-5 py-16 text-center">
        <p className="m-0 mb-4 text-[16px] text-tinta-suave">No encontramos este paciente — puede que la solicitud ya se haya resuelto.</p>
        <Link to="/app/profesional/panel" className="text-verde-profundo">
          ‹ Volver al panel
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; dot?: boolean }[] = pendiente
    ? [
        { id: "evaluacion", label: "Evaluación inicial", dot: true },
        { id: "planificar", label: "Armar primer plan" },
        { id: "mensajes", label: "Mensajes" },
        { id: "cuentas", label: "Cuentas" },
      ]
    : [
        { id: "semana", label: "Seguimiento", dot: patient.needs_review },
        { id: "planificar", label: "Planificar", dot: patient.needs_assignment },
        { id: "mensajes", label: "Mensajes" },
        { id: "evaluacion", label: "Perfil inicial" },
        { id: "cuentas", label: "Cuentas" },
      ];
  const requested = searchParams.get("tab") as Tab | null;
  const tab: Tab = requested && tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  function done(message: string, isError?: boolean) {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["pending-threads"] });
    navigate("/app/profesional/panel", { state: { statusMsg: { text: message, error: isError } } });
  }

  function changed(message: string, isError?: boolean) {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    setStatusMsg({ text: message, error: isError });
  }

  const attention = attentionFor(patient);
  const familiar = patient.links.find((l) => l.relation === "familiar_admin");
  const tier = planTiers.find((t) => t.id === patient.modalidad);
  const rol = answers ? rolRespondente(answers) : null;

  return (
    <div className="im-in max-w-[1240px] mx-auto px-5 py-7 pb-16 sm:px-8 lg:py-9">
      <Link to="/app/profesional/panel" className="inline-block mb-4 text-[14.5px] text-verde-profundo">
        ‹ Panel
      </Link>

      {patient.posible_duplicado_de && (
        <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl px-5 py-3.5 mb-5">
          <p className="m-0 text-[14px] text-riesgo-texto">
            <strong>Posible duplicado:</strong> la familia indicó que podría ser la misma persona que{" "}
            <strong>{patient.posible_duplicado_nombre ?? "otro registro"}</strong>. No se combinó nada automáticamente — revisá ambos registros.
          </p>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-5 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-14 h-14 rounded-full bg-beige-serenidad text-verde-profundo font-serif text-[22px] flex items-center justify-center shrink-0">
            {patient.nombre
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="font-serif font-normal text-[30px] sm:text-[36px] leading-tight m-0">{patient.nombre}</h1>
            <p className="m-0 mt-0.5 text-[14.5px] text-tinta-tenue">
              {[
                patient.edad ? `${patient.edad} años` : null,
                familiar ? `Familiar: ${familiar.nombre}` : "Sin familiar vinculado",
                rol ? `Respondió ${respondenteLabel[rol] ?? rol}` : null,
                `Registrado el ${new Date(patient.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {attention && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${attentionMeta[attention].bg} ${attentionMeta[attention].text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${attentionMeta[attention].dot}`} />
              {attentionMeta[attention].label}
            </span>
          )}
          <ProgramaSelector
            patientId={patient.id}
            modalidad={patient.modalidad}
            label={
              pendiente && !extra?.programa_elegido_en
                ? "Programa sin elegir"
                : `Programa ${tier?.nombre ?? patient.modalidad}${pendiente ? " · elegido por la familia" : ""}`
            }
            onChanged={changed}
          />
        </div>
      </header>

      <AlertasRiesgoBanner patientId={patient.id} />

      {statusMsg && (
        <div className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}>
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
            Cerrar
          </button>
        </div>
      )}

      <nav role="tablist" className="flex gap-1 border-b border-borde mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-3 text-[15px] font-semibold border-b-2 -mb-px cursor-pointer bg-transparent ${
              tab === t.id ? "border-verde-serenidad text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"
            }`}
          >
            {t.label}
            {t.dot && <span className="w-2 h-2 rounded-full bg-semaforo-amarillo" aria-label="requiere atención" />}
          </button>
        ))}
      </nav>

      {tab === "evaluacion" &&
        (pendiente ? (
          <EvaluacionTab
            patient={patient}
            answers={answers ?? null}
            loadingAnswers={loadingAnswers}
            onAccept={() => setTab("planificar")}
            onRejected={(msg) => done(msg)}
            onStartAssisted={() => {
              resetOnboardingForNewAccount(myUserId);
              navigate(`/app/perfil/${questions[0].id}?paciente=${patient.id}`);
            }}
          />
        ) : (
          <EvaluacionTab
            patient={patient}
            answers={answers ?? null}
            loadingAnswers={loadingAnswers}
            readOnly
            onAccept={() => {}}
            onRejected={() => {}}
            onStartAssisted={() => {}}
          />
        ))}

      {tab === "semana" && (
        <SeguimientoTab patientId={patient.id} patientNombre={patient.nombre} plans={plans ?? []} loadingPlans={loadingPlans} onPlanNext={() => setTab("planificar")} />
      )}

      {tab === "planificar" &&
        (pendiente && !(answers && Object.keys(answers).length > 0) && !loadingAnswers ? (
          <div className="bg-white border border-borde rounded-3xl p-7 max-w-[640px]">
            <p className="m-0 text-[15px] text-tinta-suave">Primero hace falta el cuestionario de {patient.nombre.split(" ")[0]} — completalo desde Evaluación inicial.</p>
          </div>
        ) : (
          <PlanificadorTab
            key={patient.id}
            patientId={patient.id}
            patientNombre={patient.nombre}
            isFirstAssignment={pendiente}
            hasFamiliar={!!familiar}
            plans={plans ?? []}
            onPublished={(msg) => done(msg)}
          />
        ))}

      {tab === "mensajes" && <MensajesTab patient={patient} myUserId={myUserId} />}
      {tab === "cuentas" && <VinculosTab patient={patient} onChanged={changed} />}
    </div>
  );
}

// El programa lo elige la familia al terminar el cuestionario, pero la
// clínica puede ajustarlo en cualquier momento (set_patient_modalidad).
function ProgramaSelector({
  patientId,
  modalidad,
  label,
  onChanged,
}: {
  patientId: string;
  modalidad: string;
  label: string;
  onChanged: (message: string, isError?: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const opciones = planTiers.filter((t) => t.id === "autoguiado" || t.id === "orientado");

  async function elegir(id: string) {
    if (id === modalidad) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("set_patient_modalidad", { p_patient_id: patientId, p_modalidad: id });
    setSaving(false);
    setOpen(false);
    if (error) {
      onChanged("No pudimos cambiar el programa. Probá de nuevo.", true);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["patient-extra", patientId] });
    onChanged(`Programa cambiado a ${opciones.find((o) => o.id === id)?.nombre}.`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold bg-fila-fria text-verde-profundo border border-borde-suave cursor-pointer hover:border-verde-serenidad disabled:opacity-60"
      >
        {saving ? "Guardando…" : label}
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 z-10 w-64 bg-white border border-borde rounded-2xl shadow-elevada p-1.5">
          <p className="m-0 px-3 pt-2 pb-1.5 text-[11.5px] tracking-[0.1em] uppercase text-tinta-tenue font-semibold">Cambiar programa</p>
          {opciones.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitemradio"
              aria-checked={o.id === modalidad}
              onClick={() => elegir(o.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer border-none font-sans ${o.id === modalidad ? "bg-verde-tenue" : "bg-transparent hover:bg-campo"}`}
            >
              <span className="block text-[14.5px] font-semibold text-tinta">
                {o.nombre} {o.id === modalidad && <span className="text-verde-profundo">✓</span>}
              </span>
              <span className="block text-[12.5px] text-tinta-tenue">
                {o.precio} {o.periodo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
