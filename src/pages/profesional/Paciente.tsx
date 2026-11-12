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
import { ContactoWhatsApp } from "../../components/profesional/paciente/ContactoWhatsApp";
import { AsistenteTab } from "../../components/profesional/paciente/AsistenteTab";
import { usePendientesAsistente } from "../../lib/asistenteRevision";
import { VinculosTab } from "../../components/profesional/paciente/VinculosTab";
import { Caja, CajaAviso, CajaPestanas, Pagina } from "../../components/profesional/Caja";
import { Avatar } from "../../components/profesional/usuarios/piezas";
import { AlertasRiesgoBanner } from "../../components/profesional/AlertasRiesgoBanner";
import { PerfilRecursosCard } from "../../components/profesional/paciente/PerfilRecursosCard";

type Tab = "evaluacion" | "semana" | "planificar" | "asistente" | "cuentas";

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
  const { data: pendientesAsistente } = usePendientesAsistente();
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
      const { data, error } = await supabase.from("patients").select("programa_elegido_en, aprobada_en").eq("id", id).maybeSingle();
      if (error) return { programa_elegido_en: null as string | null, aprobada_en: null as string | null };
      return data as { programa_elegido_en: string | null; aprobada_en: string | null };
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
        // Los planes de bienvenida (Fase 3.3) no son semanas de la clínica.
        .eq("origen", "clinica")
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

  const asistentePendiente = !!pendientesAsistente?.some((p) => p.patient_id === patient.id);
  const tabs: { id: Tab; label: string; dot?: boolean }[] = pendiente
    ? [
        { id: "evaluacion", label: "Evaluación inicial", dot: true },
        { id: "planificar", label: "Armar primer plan" },
        { id: "asistente", label: "Asistente", dot: asistentePendiente },
        { id: "cuentas", label: "Cuentas" },
      ]
    : [
        { id: "semana", label: "Seguimiento", dot: patient.needs_review },
        { id: "planificar", label: "Planificar", dot: patient.needs_assignment },
        { id: "asistente", label: "Asistente", dot: asistentePendiente },
        { id: "evaluacion", label: "Perfil inicial" },
        { id: "cuentas", label: "Cuentas" },
      ];
  const requested = searchParams.get("tab") as Tab | null;
  const tab: Tab = requested && tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  function done(message: string, isError?: boolean) {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
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
    <Pagina ancho="max-w-[1240px]">
      <Link to="/app/profesional/panel" className="justify-self-start -mb-2 text-[14.5px] font-semibold text-verde-profundo no-underline hover:underline">
        ‹ Panel
      </Link>

      {patient.posible_duplicado_de && (
        <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl px-5 py-3.5">
          <p className="m-0 text-[14px] text-riesgo-texto">
            <strong>Posible duplicado:</strong> la familia indicó que podría ser la misma persona que{" "}
            <strong>{patient.posible_duplicado_nombre ?? "otro registro"}</strong>. No se combinó nada automáticamente — revisá ambos registros.
          </p>
        </div>
      )}

      <AlertasRiesgoBanner patientId={patient.id} />

      <Caja
        eyebrow="Paciente"
        inicio={<Avatar id={patient.id} nombre={patient.nombre} size={56} />}
        titulo={patient.nombre}
        descripcion={[
          patient.edad ? `${patient.edad} años` : null,
          familiar ? `Familiar: ${familiar.nombre}` : "Sin familiar vinculado",
          rol ? `Respondió ${respondenteLabel[rol] ?? rol}` : null,
          `Registrado el ${new Date(patient.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        acciones={
          <>
            <ContactoWhatsApp patientId={patient.id} patientNombre={patient.nombre} />
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
          </>
        }
        pie={<CajaPestanas etiqueta="Secciones del paciente" activa={tab} onCambiar={setTab} pestanas={tabs.map((t) => ({ id: t.id, label: t.label, aviso: t.dot }))} />}
      >
        {statusMsg ? <CajaAviso texto={statusMsg.text} error={statusMsg.error} onCerrar={() => setStatusMsg(null)} /> : undefined}
      </Caja>

      <div className="grid gap-6 min-w-0">
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
          !pendiente && loadingPlans ? (
            <div className="bg-white border border-borde rounded-3xl p-8 text-center text-tinta-tenue">Cargando…</div>
          ) : (
          <>
          <PerfilRecursosCard patientId={patient.id} />
          <PlanificadorTab
            key={patient.id}
            patientId={patient.id}
            patientNombre={patient.nombre}
            isFirstAssignment={pendiente}
            hasFamiliar={!!familiar}
            plans={plans ?? []}
            aprobada={!!extra?.aprobada_en}
            onAprobada={() => {
              queryClient.invalidateQueries({ queryKey: ["patient-extra", id] });
              queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
            }}
            onPublished={(msg) => done(msg)}
          />
          </>
          )
        ))}

      {tab === "asistente" && <AsistenteTab patientId={patient.id} />}
      {tab === "cuentas" && <VinculosTab patient={patient} onChanged={changed} />}
      </div>
    </Pagina>
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
