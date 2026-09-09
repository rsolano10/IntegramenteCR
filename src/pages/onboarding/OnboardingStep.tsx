import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { applicableQuestions, questions, resolveOptions, resolveText } from "../../lib/onboardingSchema";
import { Button } from "../../components/ui/Button";
import { CheckRow } from "../../components/ui/CheckRow";

function hasAnswer(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

export function OnboardingStep() {
  const navigate = useNavigate();
  const { step: stepId } = useParams();
  // Assisted onboarding: the clinic fills this out in person on an existing
  // patient's behalf (?paciente=<id> — see PatientDetailModal's "Llenar
  // encuesta" entry point) — same wizard, but it writes directly to that
  // patient's onboarding_answers instead of calling self_onboard.
  const [searchParams] = useSearchParams();
  const assistedPatientId = searchParams.get("paciente");
  function withAssisted(path: string) {
    return assistedPatientId ? `${path}?paciente=${assistedPatientId}` : path;
  }
  const answers = useAppStore((s) => s.onboarding2);
  const answerQuestion = useAppStore((s) => s.answerQuestion);
  const toggleMultiAnswer = useAppStore((s) => s.toggleMultiAnswer);
  const perfilEditModule = useAppStore((s) => s.perfilEditModule);
  const endModuleEdit = useAppStore((s) => s.endModuleEdit);
  const perfilEditQuestionId = useAppStore((s) => s.perfilEditQuestionId);
  const endQuestionEdit = useAppStore((s) => s.endQuestionEdit);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // integramente_flujos_interaccion_usuarios.md §3.1/§7.1: antes de crear un
  // paciente nuevo, avisar si ya existe uno con nombre+edad similares —
  // nunca fusionar automáticamente, solo dejar la marca para que el equipo
  // clínico lo revise (ver check_possible_duplicate/posible_duplicado_de).
  const [duplicateCandidate, setDuplicateCandidate] = useState<{ id: string; nombre: string } | null>(null);
  const [duplicateResolved, setDuplicateResolved] = useState<"same" | "different" | null>(null);
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const queryClient = useQueryClient();

  const applicable = applicableQuestions(answers);
  const idx = applicable.findIndex((q) => q.id === stepId);
  const question = idx >= 0 ? applicable[idx] : null;

  const questionSteps = applicable.filter((q) => q.type !== "info");
  const questionIdx = question ? questionSteps.findIndex((q) => q.id === question.id) : -1;

  // Recomputed from live answers (not frozen at edit-start) so it self-
  // corrects if answering a question mid-edit changes which others in the
  // same module still apply.
  const editQuestions = perfilEditModule ? applicable.filter((q) => q.module === perfilEditModule) : null;
  const editIdx = editQuestions && question ? editQuestions.findIndex((q) => q.id === question.id) : -1;

  useEffect(() => {
    if (!question) navigate(withAssisted(`/app/perfil/${questions[0].id}`), { replace: true });
    else setText(typeof answers[question.id] === "string" ? (answers[question.id] as string) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  // Once the duplicate question is answered (via the confirmation panel
  // below), automatically resume the submission that paused for it —
  // goNext reads duplicateResolved via closure, so this needs the value to
  // already be committed, not the same click handler that set it.
  useEffect(() => {
    if (duplicateResolved !== null) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateResolved]);

  if (!question) return null;

  function goTo(id: string | undefined, fallback: string) {
    if (id) navigate(withAssisted(`/app/perfil/${id}`));
    else navigate(fallback);
  }
  async function saveAndReturnToResumen(endEdit: () => void) {
    if (myPatient) {
      setSubmitError("");
      setSubmitting(true);
      const { error } = await supabase.from("onboarding_answers").update({ answers }).eq("patient_id", myPatient.id);
      setSubmitting(false);
      if (error) {
        setSubmitError("No pudimos guardar el cambio. Probá de nuevo.");
        return;
      }
    }
    endEdit();
    navigate("/app/perfil/resumen");
  }

  async function goNext() {
    if (perfilEditQuestionId) {
      await saveAndReturnToResumen(endQuestionEdit);
      return;
    }
    if (editQuestions) {
      const next = editQuestions[editIdx + 1];
      if (next) {
        navigate(`/app/perfil/${next.id}`);
        return;
      }
      // Last question of an edit session on an already-real patient — push
      // the correction back to Supabase (onboarding_answers: familiar
      // update already allows this), not just the local copy.
      await saveAndReturnToResumen(endModuleEdit);
      return;
    }
    const next = applicable[idx + 1]?.id;
    if (next) {
      navigate(withAssisted(`/app/perfil/${next}`));
      return;
    }
    // Last question of the wizard — this is the first time this account's
    // answers become a real patient. Never fall back to the "Rosa Jiménez"
    // demo default here — an empty name blocks submission instead.
    const nombre = typeof answers.nombre_participante === "string" ? answers.nombre_participante.trim() : "";
    if (!nombre) {
      setSubmitError(assistedPatientId ? "Falta el nombre — volvé y completalo antes de continuar." : "Falta el nombre de tu familiar — volvé y completalo antes de continuar.");
      return;
    }
    if (session.status !== "authed") return;
    setSubmitError("");
    setSubmitting(true);

    if (assistedPatientId) {
      // Assisted mode: the clinic already created the patient — just save
      // the answers directly (RLS: "onboarding_answers: profesional
      // insert/update", Fase 7). No self_onboard call, no new patient_links.
      // schema_version=2 explicit: this row is never touched by
      // self_onboard/reregister_onboarding, so it must set the new
      // questionnaire's version itself (Fase 11) or it would default to 1
      // and read as needing re-registration forever.
      const { error: upsertError } = await supabase.from("onboarding_answers").upsert({ patient_id: assistedPatientId, answers, schema_version: 2 });
      setSubmitting(false);
      if (upsertError) {
        setSubmitError("No pudimos guardar la encuesta. Probá de nuevo.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["onboarding-answers", assistedPatientId] });
      navigate(`/app/profesional/usuarios?tab=pacientes&encuestaGuardada=${assistedPatientId}`);
      return;
    }

    const edad = typeof answers.edad === "string" ? answers.edad.trim() : "";

    // Only relevant the first time (self_onboard, brand-new patient) — a
    // re-registration updates an existing record, so there's no
    // duplication risk to check for.
    if (!myPatient && duplicateResolved === null) {
      const { data: dupData } = await supabase.rpc("check_possible_duplicate", { p_nombre: nombre, p_edad: edad || null });
      if (Array.isArray(dupData) && dupData.length > 0) {
        setSubmitting(false);
        setDuplicateCandidate(dupData[0]);
        return; // pause — the confirmation panel below takes over from here
      }
    }

    // Fase 11: myPatient already existing here means this is a forced
    // re-registration (schema_version < 2), not a first-time signup —
    // self_onboard would reject it ("Ya tenés un perfil creado").
    const { error } = myPatient
      ? await supabase.rpc("reregister_onboarding", { p_nombre: nombre, p_edad: edad || null, p_answers: answers })
      : await supabase.rpc("self_onboard", {
          p_nombre: nombre,
          p_edad: edad || null,
          p_answers: answers,
          p_posible_duplicado_de: duplicateResolved === "same" ? duplicateCandidate?.id ?? null : null,
        });
    setSubmitting(false);
    if (error) {
      setSubmitError("No pudimos guardar tu perfil. Probá de nuevo.");
      return;
    }
    completeOnboarding();
    queryClient.invalidateQueries({ queryKey: ["my-patient", session.session.user.id] });
    navigate("/app/perfil/final");
  }
  function goBack() {
    if (perfilEditQuestionId) {
      endQuestionEdit();
      navigate("/app/perfil/resumen");
      return;
    }
    if (editQuestions) {
      const prev = editQuestions[editIdx - 1];
      if (prev) navigate(`/app/perfil/${prev.id}`);
      else navigate("/app/perfil/resumen");
      return;
    }
    goTo(applicable[idx - 1]?.id, assistedPatientId ? "/app/profesional/usuarios?tab=pacientes" : "/app/consent");
  }

  if (duplicateCandidate && !duplicateResolved) {
    return (
      <div className="im-in max-w-[620px] mx-auto px-5 py-14 pb-20 sm:px-8 text-center">
        <h1 className="font-serif font-normal text-[26px] sm:text-[32px] leading-[1.2] m-0 mb-4">Un momento</h1>
        <p className="m-0 mb-8 text-base sm:text-lg leading-relaxed text-tinta-suave">
          Parece que <strong>{duplicateCandidate.nombre}</strong> ya tiene un registro con nosotros. ¿Puede tratarse de la misma persona?
        </p>
        <div className="grid gap-3 max-w-[360px] mx-auto">
          <Button variant="secondary" onClick={() => setDuplicateResolved("same")} disabled={submitting}>
            Sí, puede ser la misma persona
          </Button>
          <Button variant="ink" onClick={() => setDuplicateResolved("different")} disabled={submitting}>
            No, es alguien diferente
          </Button>
        </div>
        <p className="m-0 mt-6 text-sm text-tinta-tenue">
          De cualquier forma vas a poder continuar — si es la misma persona, se lo señalamos al equipo clínico para que lo revise, sin combinar
          la información automáticamente.
        </p>
      </div>
    );
  }

  const value = answers[question.id];
  const warningTriggered = question.warning
    ? typeof value === "string"
      ? question.warning.when(value)
      : Array.isArray(value) && value.some((v) => question.warning!.when(v))
    : false;
  const warningActive = warningTriggered ? question.warning! : null;

  const canContinue = question.type === "text" || question.type === "info" || hasAnswer(value);

  if (question.type === "info") {
    return (
      <div className="im-in max-w-[620px] mx-auto px-5 py-14 pb-20 sm:px-8 text-center">
        <h1 className="font-serif font-normal text-[28px] sm:text-[38px] leading-[1.16] lg:leading-[1.12] m-0 mb-4">{resolveText(question.title, answers)}</h1>
        <p className="m-0 mb-8 text-base sm:text-lg leading-relaxed text-tinta-suave">{resolveText(question.body, answers)}</p>
        <Button onClick={goNext}>{question.cta}</Button>
      </div>
    );
  }

  return (
    <div className="im-in max-w-[680px] mx-auto px-5 pt-8 pb-16 sm:px-8 lg:pt-10 lg:pb-20">
      {perfilEditQuestionId ? (
        <div className="flex items-center gap-2 mb-6 text-sm text-verde-profundo font-semibold">
          <span className="w-2 h-2 rounded-full bg-verde-serenidad" />
          Editando esta pregunta
        </div>
      ) : editQuestions ? (
        <div className="flex items-center gap-2 mb-6 text-sm text-verde-profundo font-semibold">
          <span className="w-2 h-2 rounded-full bg-verde-serenidad" />
          Editando "{perfilEditModule}" · pregunta {editIdx + 1} de {editQuestions.length}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-5 mb-3">
            <span className="text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">
              {question.module ? `${question.module} · ` : ""}
              {questionIdx + 1} de {questionSteps.length}
            </span>
            <span className="text-xs sm:text-sm text-[#4c7a4c] inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-verde-serenidad" />
              Guardado automáticamente
            </span>
          </div>
          <div className="h-2 rounded-full bg-beige-serenidad overflow-hidden mb-8">
            <div
              className="h-full bg-verde-serenidad rounded-full transition-[width]"
              style={{ width: `${((questionIdx + 1) / Math.max(1, questionSteps.length)) * 100}%` }}
            />
          </div>
        </>
      )}

      <h1 className="font-serif font-normal text-[24px] sm:text-[32px] leading-[1.2] lg:leading-[1.14] m-0 mb-2">{resolveText(question.title, answers)}</h1>
      {question.subtitle && <p className="m-0 mb-2 text-[16px] leading-relaxed text-tinta-suave">{resolveText(question.subtitle, answers)}</p>}
      {question.example && <p className="m-0 mb-6 text-[15px] text-tinta-tenue">{question.example}</p>}
      {!question.example && <div className="mb-6" />}

      {question.type === "single" && (
        <div className="grid gap-2.5 mb-2">
          {resolveOptions(question, answers).map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => answerQuestion(question.id, opt.value)}
                className={`text-left min-h-14 px-5 py-3.5 rounded-2xl border-[1.5px] font-sans text-[16px] cursor-pointer ${
                  active ? "border-verde-serenidad bg-[#f5f9f9] font-semibold" : "border-borde bg-white hover:border-verde-serenidad"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "multi" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
          {resolveOptions(question, answers).map((opt) => {
            const list = Array.isArray(value) ? value : [];
            const capReached = !!question.maxSelect && list.filter((v) => !question.exclusive?.includes(v)).length >= question.maxSelect;
            return (
              <CheckRow
                key={opt.value}
                checked={list.includes(opt.value)}
                disabled={capReached}
                onToggle={() => toggleMultiAnswer(question.id, opt.value, question.exclusive, question.maxSelect)}
              >
                {opt.label}
              </CheckRow>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            answerQuestion(question.id, e.target.value);
          }}
          className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta mb-2"
        />
      )}

      {warningActive && (
        <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-4.5 mt-4 mb-2">
          <p className="m-0 mb-3 text-[15px] leading-relaxed text-riesgo-texto">{warningActive.message}</p>
          <Button variant="caution" dense to={warningActive.to}>
            {warningActive.ctaLabel}
          </Button>
        </div>
      )}

      {submitError && <p className="m-0 mt-4 text-[14px] text-alerta-texto">{submitError}</p>}

      <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-borde">
        <Button variant="secondary" onClick={goBack} disabled={submitting}>
          Atrás
        </Button>
        <Button variant="ink" onClick={goNext} disabled={!canContinue || submitting}>
          {submitting
            ? "Guardando…"
            : perfilEditQuestionId
              ? "Guardar y volver"
              : editQuestions && editIdx >= editQuestions.length - 1
                ? "Guardar y volver"
                : !editQuestions && !applicable[idx + 1]
                  ? "Finalizar"
                  : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
