import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { applicableQuestions, questions, resolveOptions } from "../../lib/onboardingSchema";
import { Button } from "../../components/ui/Button";
import { CheckRow } from "../../components/ui/CheckRow";

function hasAnswer(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

export function OnboardingStep() {
  const navigate = useNavigate();
  const { step: stepId } = useParams();
  const answers = useAppStore((s) => s.onboarding2);
  const answerQuestion = useAppStore((s) => s.answerQuestion);
  const toggleMultiAnswer = useAppStore((s) => s.toggleMultiAnswer);
  const perfilEditModule = useAppStore((s) => s.perfilEditModule);
  const endModuleEdit = useAppStore((s) => s.endModuleEdit);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [text, setText] = useState("");

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
    if (!question) navigate(`/app/perfil/${questions[0].id}`, { replace: true });
    else setText(typeof answers[question.id] === "string" ? (answers[question.id] as string) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  if (!question) return null;

  function goTo(id: string | undefined, fallback: string) {
    if (id) navigate(`/app/perfil/${id}`);
    else navigate(fallback);
  }
  function goNext() {
    if (editQuestions) {
      const next = editQuestions[editIdx + 1];
      if (next) navigate(`/app/perfil/${next.id}`);
      else {
        endModuleEdit();
        navigate("/app/perfil/resumen");
      }
      return;
    }
    const next = applicable[idx + 1]?.id;
    if (next) navigate(`/app/perfil/${next}`);
    else {
      completeOnboarding();
      navigate("/app/hoy");
    }
  }
  function goBack() {
    if (editQuestions) {
      const prev = editQuestions[editIdx - 1];
      if (prev) navigate(`/app/perfil/${prev.id}`);
      else navigate("/app/perfil/resumen");
      return;
    }
    goTo(applicable[idx - 1]?.id, "/app/consent");
  }

  const value = answers[question.id];
  const warningActive =
    question.warning && typeof value === "string" && question.warning.when(value) ? question.warning : null;

  const canContinue = question.type === "text" || question.type === "info" || hasAnswer(value);

  if (question.type === "info") {
    return (
      <div className="im-in max-w-[620px] mx-auto px-5 py-14 pb-20 sm:px-8 text-center">
        <h1 className="font-serif font-normal text-[28px] sm:text-[38px] leading-[1.16] lg:leading-[1.12] m-0 mb-4">{question.title}</h1>
        <p className="m-0 mb-8 text-base sm:text-lg leading-relaxed text-tinta-suave">{question.body}</p>
        <Button onClick={goNext}>{question.cta}</Button>
      </div>
    );
  }

  return (
    <div className="im-in max-w-[680px] mx-auto px-5 pt-8 pb-16 sm:px-8 lg:pt-10 lg:pb-20">
      {editQuestions ? (
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

      <h1 className="font-serif font-normal text-[24px] sm:text-[32px] leading-[1.2] lg:leading-[1.14] m-0 mb-2">{question.title}</h1>
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
            return (
              <CheckRow
                key={opt.value}
                checked={list.includes(opt.value)}
                onToggle={() => toggleMultiAnswer(question.id, opt.value, question.exclusive)}
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

      <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-borde">
        <Button variant="secondary" onClick={goBack}>
          Atrás
        </Button>
        <Button variant="ink" onClick={goNext} disabled={!canContinue}>
          {editQuestions && editIdx >= editQuestions.length - 1 ? "Guardar y volver" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
