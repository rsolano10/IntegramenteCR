import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useAppStore } from "../../lib/store";
import { groupAnswerableByModule, describeAnswer, questions, type Answers } from "../../lib/onboardingSchema";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PillToggle } from "../ui/PillToggle";
import { SemaforoChip } from "../ui/SemaforoChip";
import { planTiers, type Semaforo } from "../../lib/mockData";
import { semaforoData } from "../../lib/rules";
import { AssignPlanModal } from "./AssignPlanModal";
import { RejectPatientModal } from "./RejectPatientModal";

const modalidadOptions = planTiers.map((t) => ({ value: t.id, label: t.nombre }));

const tierOverrideOptions: { value: Semaforo | ""; label: string }[] = [
  { value: "", label: "Automático" },
  { value: "verde", label: "Verde" },
  { value: "amarillo", label: "Amarillo" },
  { value: "rojo", label: "Rojo" },
];

const estadoLabel: Record<string, { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "bg-fila-fria text-[#4c7a4c]" },
  parcial: { text: "En parte", className: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { text: "No se realizó", className: "bg-campo text-tinta-tenue" },
  pendiente: { text: "Pendiente", className: "bg-[#edf4f4] text-verde-profundo" },
  futuro: null,
};

interface PlanTaskReview {
  id: string;
  dia: string;
  titulo: string;
  estado: string;
  comentario: string | null;
}

export interface PatientLink {
  profile_id: string;
  nombre: string;
  role: "familiar" | "paciente" | "profesional";
  relation: "familiar_admin" | "participante" | "profesional_asignado";
}

export interface PatientRow {
  id: string;
  nombre: string;
  edad: string | null;
  modalidad: string;
  plan_status: "pendiente" | "asignado";
  onboarding_complete: boolean;
  created_at: string;
  overall: string | null;
  links: PatientLink[];
  needs_review: boolean;
  needs_assignment: boolean;
}

interface ManagedAccount {
  id: string;
  email: string;
  nombre: string;
  role: "familiar" | "paciente" | "profesional";
}

const relationLabel: Record<string, string> = {
  familiar_admin: "Familiar administrador",
  participante: "Participante",
  profesional_asignado: "Clínica",
};

interface Mensaje {
  id: string;
  texto: string;
  autor_id: string | null;
  created_at: string;
}

export function PatientDetailModal({
  patient,
  onClose,
  onChanged,
}: {
  patient: PatientRow;
  onClose: () => void;
  onChanged: (message: string, isError?: boolean) => void;
}) {
  const pending = patient.plan_status === "pendiente";

  const [nombre, setNombre] = useState(patient.nombre);
  const [edad, setEdad] = useState(patient.edad ?? "");
  const [modalidad, setModalidad] = useState(patient.modalidad);
  const [saving, setSaving] = useState(false);
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [assignPlanOpen, setAssignPlanOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const navigate = useNavigate();
  const resetOnboardingForNewAccount = useAppStore((s) => s.resetOnboardingForNewAccount);

  function startEncuestaAsistida() {
    resetOnboardingForNewAccount(myUserId);
    navigate(`/app/perfil/${questions[0].id}?paciente=${patient.id}`);
  }
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
    enabled: linkPickerOpen,
  });

  // Only fetched while evaluating a pending patient — this is the data the
  // clinic decides on, per the same render pattern PerfilResumen.tsx already
  // uses for onboarding_answers, just sourced from a direct fetch instead of
  // the local demo store.
  const { data: onboardingAnswers, isLoading: loadingAnswers } = useQuery({
    queryKey: ["onboarding-answers", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", patient.id).maybeSingle();
      if (error) throw error;
      return (data?.answers ?? {}) as Answers;
    },
    enabled: pending,
  });

  // Read-only view of the currently published plan, so the clinic can see
  // what was actually registered — including the "ayuda que necesitó" note
  // captured when a family/participant marks a task "parcial". Same "current
  // plan" selection as usePlan.ts (latest already-published-by-date), so the
  // clinic reviews the same plan the family is actually looking at.
  const { data: planReview, isLoading: loadingPlanTasks } = useQuery({
    queryKey: ["plan-review", patient.id],
    queryFn: async () => {
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("id, reviewed_at, feedback_mensaje")
        .eq("patient_id", patient.id)
        .eq("status", "published")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (planError) throw planError;
      if (!plan) return null;
      const { data, error } = await supabase
        .from("plan_tasks")
        .select("id, dia, titulo, estado, comentario")
        .eq("plan_id", plan.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return { planId: plan.id, reviewedAt: plan.reviewed_at as string | null, feedbackMensaje: plan.feedback_mensaje as string | null, tasks: data as PlanTaskReview[] };
    },
    enabled: !pending,
  });
  const planTasks = planReview?.tasks ?? [];
  const weekComplete = planTasks.length > 0 && planTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");

  const [feedbackMensaje, setFeedbackMensaje] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  async function markReviewed() {
    if (!planReview) return;
    setFeedbackError("");
    setSavingFeedback(true);
    const { error } = await supabase
      .from("plans")
      .update({ reviewed_at: new Date().toISOString(), feedback_mensaje: feedbackMensaje.trim() || null })
      .eq("id", planReview.planId);
    setSavingFeedback(false);
    if (error) {
      setFeedbackError(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["plan-review", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  const { data: mensajes, isLoading: loadingMensajes } = useQuery({
    queryKey: ["mensajes", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("id, texto, autor_id, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Mensaje[];
    },
  });

  // Names for messages not authored by the viewer come from the patient's
  // already-fetched links (sourced from list_patients(), which bypasses
  // profiles RLS server-side) — never from a profiles join, which RLS would
  // null out for anyone the clinic can't otherwise read.
  const linkNameByProfileId = new Map(patient.links.map((l) => [l.profile_id, l.nombre]));
  function authorLabel(autorId: string | null) {
    if (autorId === myUserId) return "Vos";
    if (autorId && linkNameByProfileId.has(autorId)) return linkNameByProfileId.get(autorId);
    return "Familia";
  }

  const [texto, setTexto] = useState("");
  const [sendingMensaje, setSendingMensaje] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  async function sendMensaje() {
    if (!texto.trim() || !myUserId) return;
    setMensajeError("");
    setSendingMensaje(true);
    const { error } = await supabase.from("mensajes").insert({ patient_id: patient.id, texto: texto.trim(), autor_id: myUserId });
    setSendingMensaje(false);
    if (error) {
      setMensajeError("No pudimos enviar el mensaje. Probá de nuevo.");
      return;
    }
    setTexto("");
    queryClient.invalidateQueries({ queryKey: ["mensajes", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["pending-threads"] });
  }

  // clinical_profiles.overall stays trigger-only (no update policy exists on
  // purpose), so the override lives on patients.tier_override instead — read
  // both here to show the computed value and let the clinic reset to it.
  const { data: tierInfo } = useQuery({
    queryKey: ["tier-info", patient.id],
    queryFn: async () => {
      const [{ data: p, error: pErr }, { data: cp, error: cpErr }] = await Promise.all([
        supabase.from("patients").select("tier_override").eq("id", patient.id).single(),
        supabase.from("clinical_profiles").select("overall").eq("patient_id", patient.id).maybeSingle(),
      ]);
      if (pErr) throw pErr;
      if (cpErr) throw cpErr;
      return { override: (p?.tier_override ?? null) as Semaforo | null, auto: (cp?.overall ?? null) as Semaforo | null };
    },
  });

  async function setTierOverride(v: Semaforo | "") {
    const { error } = await supabase.from("patients").update({ tier_override: v || null }).eq("id", patient.id);
    if (error) {
      onChanged(error.message, true);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["tier-info", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  async function saveBasics() {
    setLocalError("");
    if (!nombre.trim()) {
      setLocalError("El nombre no puede quedar vacío.");
      return;
    }
    setSaving(true);
    // Modalidad only changes here once the patient is accepted — while
    // pending, it's decided together with the plan via "Aceptar", not
    // edited loose.
    const update: Record<string, unknown> = { nombre: nombre.trim(), edad: edad.trim() || null };
    if (!pending) update.modalidad = modalidad;
    const { error } = await supabase.from("patients").update(update).eq("id", patient.id);
    setSaving(false);
    if (error) {
      setLocalError(error.message);
      return;
    }
    onChanged("Datos del paciente actualizados.");
  }

  async function unlink(link: PatientLink) {
    setLinkBusy(`${link.profile_id}-${link.relation}`);
    const { error } = await supabase
      .from("patient_links")
      .delete()
      .match({ patient_id: patient.id, profile_id: link.profile_id, relation: link.relation });
    setLinkBusy(null);
    if (error) {
      onChanged(error.message, true);
      return;
    }
    onChanged(`${link.nombre} ya no está vinculado a ${patient.nombre}.`);
    onClose();
  }

  const linkedProfileIds = new Set(patient.links.map((l) => l.profile_id));
  const linkableAccounts = (accounts ?? []).filter((a) => !linkedProfileIds.has(a.id));

  return (
    <>
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">{patient.nombre}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Datos básicos y cuentas vinculadas.</p>

      <div className="grid gap-4.5 mb-6">
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Edad
            <input
              type="text"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        </div>
        <div className="grid gap-4">
          <div>
            <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Modalidad</p>
            {pending ? (
              <p className="m-0 text-[14px] text-tinta-tenue">
                {modalidadOptions.find((o) => o.value === modalidad)?.label ?? modalidad} — se confirma al aceptar la cuenta.
              </p>
            ) : (
              <PillToggle value={modalidad} onChange={setModalidad} options={modalidadOptions} />
            )}
          </div>
          <div>
            <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Estado del plan</p>
            <p className="m-0 text-[14px] text-tinta-tenue">{pending ? "Pendiente de evaluación" : "Asignado"}</p>
          </div>
          <div>
            <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Categoría</p>
            {tierInfo?.auto && (
              <p className="m-0 mb-2 text-[13px] text-tinta-tenue">
                Calculada automáticamente: <SemaforoChip sem={tierInfo.auto} variant="bare" />
              </p>
            )}
            <PillToggle value={tierInfo?.override ?? ""} onChange={setTierOverride} options={tierOverrideOptions} />
            {tierInfo?.override && (
              <p className={`m-0 mt-2 text-[13px] leading-relaxed ${semaforoData[tierInfo.override].ink}`}>
                Se está mostrando <strong>{semaforoData[tierInfo.override].short}</strong> en vez del cálculo automático.
              </p>
            )}
          </div>
        </div>
        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}
        <Button variant="ink" dense onClick={saveBasics} disabled={saving} className="justify-self-start">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      {pending && (
        <div className="pt-5 border-t border-[#efeada] mb-6">
          <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Evaluación</p>
          {loadingAnswers ? (
            <p className="m-0 text-sm text-tinta-tenue">Cargando cuestionario…</p>
          ) : (
            <div className="grid gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
              {groupAnswerableByModule(onboardingAnswers ?? {}).map((g) => (
                <div key={g.module} className="bg-campo rounded-xl p-3.5">
                  <p className="m-0 mb-2 text-[13px] font-bold text-tinta">{g.module}</p>
                  <div className="grid gap-1.5">
                    {g.questions.map((q) => (
                      <div key={q.id} className="grid grid-cols-[1.2fr_1fr] gap-3 text-[13px]">
                        <span className="text-tinta-tenue">{q.title}</span>
                        <span className="text-tinta font-medium">{describeAnswer(q, onboardingAnswers ?? {})}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <Button variant="ink" dense onClick={() => setAssignPlanOpen(true)}>
              Aceptar y asignar plan
            </Button>
            <Button variant="secondary" dense onClick={startEncuestaAsistida}>
              Llenar encuesta con el paciente
            </Button>
            <Button variant="secondary" dense onClick={() => setRejectOpen(true)} className="text-alerta-texto">
              Rechazar
            </Button>
          </div>
        </div>
      )}

      {!pending && (
        <div className="pt-5 border-t border-[#efeada] mb-6">
          <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Plan asignado</p>
          {loadingPlanTasks ? (
            <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>
          ) : !planTasks || planTasks.length === 0 ? (
            <p className="m-0 text-sm text-tinta-tenue">Sin plan publicado todavía.</p>
          ) : (
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              {planTasks.map((t) => {
                const badge = estadoLabel[t.estado];
                return (
                  <div key={t.id} className="bg-campo rounded-xl p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] text-tinta-tenue">{t.dia}</span>
                      {badge && <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${badge.className}`}>{badge.text}</span>}
                    </div>
                    <p className="m-0 text-[14px] font-medium text-tinta">{t.titulo}</p>
                    {t.comentario && (
                      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-semaforo-amarillo-texto">
                        <strong>Ayuda que necesitó:</strong> {t.comentario}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {weekComplete && planReview && (
            <div className="mt-4 pt-4 border-t border-[#efeada]">
              {planReview.reviewedAt ? (
                <div className="bg-fila-fria rounded-xl p-3.5">
                  <p className="m-0 mb-1 text-[13px] font-bold text-verde-profundo">Semana revisada</p>
                  {planReview.feedbackMensaje && <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">{planReview.feedbackMensaje}</p>}
                </div>
              ) : (
                <>
                  <p className="m-0 mb-2 text-[13px] font-bold text-semaforo-amarillo-texto">Semana completada — lista para revisar</p>
                  <textarea
                    value={feedbackMensaje}
                    onChange={(e) => setFeedbackMensaje(e.target.value)}
                    rows={2}
                    placeholder="Mensaje de feedback para la familia (opcional)"
                    className="w-full rounded-lg border-[1.5px] border-[#ddd7be] bg-white px-3 py-2.5 font-sans text-[13px] text-tinta resize-y mb-2.5"
                  />
                  {feedbackError && <p className="m-0 mb-2 text-[13px] text-alerta-texto">{feedbackError}</p>}
                  <Button variant="ink" dense onClick={markReviewed} disabled={savingFeedback}>
                    {savingFeedback ? "Guardando…" : "Marcar como revisada"}
                  </Button>
                </>
              )}
              <Button variant="secondary" dense onClick={() => setAssignPlanOpen(true)} className="mt-2.5">
                Asignar la próxima semana
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="pt-5 border-t border-[#efeada]">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Cuentas vinculadas</p>
        <div className="grid gap-2 mb-3">
          {patient.links.length === 0 && <p className="m-0 text-sm text-tinta-tenue">Sin cuentas vinculadas todavía.</p>}
          {patient.links.map((l) => (
            <div key={`${l.profile_id}-${l.relation}`} className="flex items-center justify-between gap-3 bg-campo rounded-xl px-3.5 py-2.5">
              <span className="text-[14px] text-tinta">
                {l.nombre} <span className="text-tinta-tenue">· {relationLabel[l.relation]}</span>
              </span>
              <button
                type="button"
                onClick={() => unlink(l)}
                disabled={linkBusy === `${l.profile_id}-${l.relation}`}
                className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer disabled:opacity-60"
              >
                Desvincular
              </button>
            </div>
          ))}
        </div>

        {!linkPickerOpen ? (
          <Button variant="secondary" dense onClick={() => setLinkPickerOpen(true)}>
            Vincular cuenta existente
          </Button>
        ) : (
          <LinkAccountPicker
            patientId={patient.id}
            accounts={linkableAccounts}
            onLinked={(msg) => {
              setLinkPickerOpen(false);
              onChanged(msg);
              onClose();
            }}
            onCancel={() => setLinkPickerOpen(false)}
          />
        )}
      </div>

      <div className="pt-5 mt-5 border-t border-[#efeada]">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Mensajes</p>

        {loadingMensajes && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}

        {!loadingMensajes && (
          <>
            {!mensajes || mensajes.length === 0 ? (
              <p className="m-0 mb-3 text-sm text-tinta-tenue">Todavía no hay mensajes con esta familia.</p>
            ) : (
              <div className="grid gap-2.5 mb-3 max-h-64 overflow-y-auto pr-1">
                {mensajes.map((m) => {
                  const mine = m.autor_id === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl p-3.5 max-w-[85%] ${mine ? "justify-self-end border-[1.5px] border-verde-serenidad bg-[#f5f9f9]" : "justify-self-start border border-borde bg-campo"}`}
                    >
                      <p className="m-0 mb-1 text-[12px] text-tinta-tenue">
                        {authorLabel(m.autor_id)} ·{" "}
                        {new Date(m.created_at).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      <p className="m-0 text-[14px] leading-relaxed text-tinta">{m.texto}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Responder a la familia…"
                rows={2}
                className="w-full min-h-[64px] rounded-xl border-[1.5px] border-[#ddd7be] bg-campo px-3.5 py-2.5 font-sans text-[14px] leading-relaxed text-tinta resize-y"
              />
              {mensajeError && <p className="m-0 text-[13px] text-alerta-texto">{mensajeError}</p>}
              <Button variant="ink" dense onClick={sendMensaje} disabled={sendingMensaje || !texto.trim()} className="justify-self-start">
                {sendingMensaje ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>

    {assignPlanOpen && (
      <AssignPlanModal
        patientId={patient.id}
        patientNombre={patient.nombre}
        hasFamiliar={patient.links.some((l) => l.relation === "familiar_admin")}
        isFirstAssignment={pending}
        onClose={() => setAssignPlanOpen(false)}
        onAssigned={(msg) => {
          setAssignPlanOpen(false);
          onChanged(msg);
          onClose();
        }}
      />
    )}

    {rejectOpen && (
      <RejectPatientModal
        patientId={patient.id}
        patientNombre={patient.nombre}
        onClose={() => setRejectOpen(false)}
        onRejected={(msg) => {
          setRejectOpen(false);
          onChanged(msg);
          onClose();
        }}
      />
    )}
    </>
  );
}

function LinkAccountPicker({
  patientId,
  accounts,
  onLinked,
  onCancel,
}: {
  patientId: string;
  accounts: ManagedAccount[];
  onLinked: (msg: string) => void;
  onCancel: () => void;
}) {
  const [profileId, setProfileId] = useState(accounts[0]?.id ?? "");
  const [relation, setRelation] = useState<"familiar_admin" | "participante" | "profesional_asignado">("familiar_admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!profileId) {
      setError("Elegí una cuenta.");
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from("patient_links").insert({ patient_id: patientId, profile_id: profileId, relation });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const account = accounts.find((a) => a.id === profileId);
    onLinked(`${account?.nombre ?? "Cuenta"} vinculada.`);
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-campo rounded-xl p-4">
        <p className="m-0 text-sm text-tinta-tenue">No hay más cuentas disponibles para vincular. Creá una desde Cuentas.</p>
        <button type="button" onClick={onCancel} className="mt-2 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-campo rounded-xl p-4 grid gap-3">
      <label className="grid gap-1.5 text-[14px] font-semibold text-[#3b4c51]">
        Cuenta
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[15px] text-tinta"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.email})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-[14px] font-semibold text-[#3b4c51]">
        Vínculo
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as typeof relation)}
          className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[15px] text-tinta"
        >
          <option value="familiar_admin">Familiar administrador</option>
          <option value="participante">Participante</option>
          <option value="profesional_asignado">Clínica</option>
        </select>
      </label>
      {error && <p className="m-0 text-[13px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2.5">
        <Button variant="secondary" dense onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="ink" dense onClick={submit} disabled={loading}>
          {loading ? "Vinculando…" : "Vincular"}
        </Button>
      </div>
    </div>
  );
}
