import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { applicableQuestions, questions, resolveOptions, resolveText } from "../../lib/onboardingSchema";
import { normalizeCrPhone } from "../../lib/phone";
import { Button } from "../../components/ui/Button";
import { CheckRow } from "../../components/ui/CheckRow";
import { IconoCategoria } from "../../components/onboarding/IconoCategoria";
import { categoriaDe, mensajeDeAnimo } from "../../lib/categoriasCuestionario";

function hasAnswer(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

// Shown once, on the very first screen — sets expectations up front
// (time, autosave, pausing) instead of a running item counter.
function AntesDeEmpezar() {
  const puntos = [
    { icono: "◷", titulo: "Unos 10 minutos", detalle: "Respondés a tu ritmo — la mayoría son de tocar una opción." },
    { icono: "✓", titulo: "Se guarda solo", detalle: "Podés pausar y seguir después desde donde te quedaste." },
    { icono: "♡", titulo: "Sin respuestas incorrectas", detalle: "Lo que importa es cómo es su día a día, no cómo debería ser." },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3 text-left mb-9">
      {puntos.map((p) => (
        <div key={p.titulo} className="bg-white border border-borde rounded-2xl p-4">
          <span aria-hidden="true" className="inline-flex w-8 h-8 rounded-full bg-verde-tenue border border-borde-suave items-center justify-center text-verde-profundo mb-2.5">
            {p.icono}
          </span>
          <p className="m-0 mb-1 text-[15px] font-semibold text-tinta">{p.titulo}</p>
          <p className="m-0 text-[14px] leading-relaxed text-tinta-suave">{p.detalle}</p>
        </div>
      ))}
    </div>
  );
}

// Categorías cuyo intro ya se mostró en esta sesión: volver atrás a la
// primera pregunta de un bloque no repite la pantalla de presentación.
const CLAVE_INTROS = "im-intros-vistas";
function introsVistas(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CLAVE_INTROS) ?? "[]"));
  } catch {
    return new Set();
  }
}
function marcarIntroVista(modulo: string) {
  try {
    const s = introsVistas();
    s.add(modulo);
    sessionStorage.setItem(CLAVE_INTROS, JSON.stringify([...s]));
  } catch {
    // sin sessionStorage: el intro puede repetirse, nada más
  }
}

// Tarjeta grande y tocable para una opción (simple o múltiple).
function OpcionTarjeta({
  activa,
  multiple,
  disabled,
  onClick,
  children,
}: {
  activa: boolean;
  multiple: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={activa}
      disabled={disabled}
      onClick={onClick}
      className={`group w-full text-left flex items-center gap-4 min-h-[64px] px-5 py-4 rounded-[20px] border-2 font-sans text-[16.5px] leading-snug cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 disabled:opacity-45 disabled:cursor-default ${
        activa
          ? "im-pop border-verde-serenidad bg-verde-tenue text-tinta font-semibold shadow-[0_10px_24px_-16px_rgba(63,106,112,.7)]"
          : "border-borde bg-white text-tinta hover:border-verde-serenidad hover:shadow-[0_8px_20px_-16px_rgba(31,51,56,.5)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-7 h-7 flex items-center justify-center border-2 transition-colors ${multiple ? "rounded-lg" : "rounded-full"} ${
          activa ? "bg-verde-profundo border-verde-profundo text-white" : "border-borde-campo bg-white group-hover:border-verde-serenidad"
        }`}
      >
        {activa && (
          <svg className="im-check w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

// Encabezado de la categoría: ícono, nombre, "parte X de N" y una barra con
// un tramo por categoría (la actual, llenándose según la pregunta).
function ProgresoCuestionario({ modulo, modulos, idxModulo, fraccionModulo }: { modulo: string; modulos: string[]; idxModulo: number; fraccionModulo: number }) {
  const cat = categoriaDe(modulo);
  const total = modulos.length;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cat.color, color: cat.tinta }}>
            <IconoCategoria icono={cat.icono} className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-tinta truncate">{modulo}</span>
            <span className="block text-[12.5px] text-tinta-tenue">
              Parte {idxModulo + 1} de {total}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-[12.5px] text-semaforo-verde-texto inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Guardado
        </span>
      </div>
      <div className="flex gap-1" role="progressbar" aria-label="Avance del cuestionario" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idxModulo + fraccionModulo}>
        {modulos.map((m, i) => (
          <span key={m} className="flex-1 h-1.5 rounded-full bg-beige-serenidad overflow-hidden">
            <span
              className="block h-full rounded-full bg-verde-serenidad transition-[width] duration-500"
              style={{ width: `${i < idxModulo ? 100 : i === idxModulo ? Math.max(6, fraccionModulo * 100) : 0}%` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

// Pantalla breve al empezar una categoría: ícono, nombre, qué se va a
// conversar y, desde la segunda, un mensaje de ánimo.
function IntroCategoria({ modulo, idxModulo, total, onSeguir }: { modulo: string; idxModulo: number; total: number; onSeguir: () => void }) {
  const cat = categoriaDe(modulo);
  const animo = mensajeDeAnimo(idxModulo, total);
  return (
    <div className="im-paso max-w-[560px] mx-auto px-5 py-14 pb-20 sm:px-8 text-center">
      {animo && <p className="m-0 mb-8 inline-flex items-center gap-2 rounded-full bg-fila-calida border border-mostaza-vital px-4 py-2 text-[14.5px] font-semibold text-tinta">{animo}</p>}
      <span className="mx-auto mb-6 w-24 h-24 rounded-[28px] flex items-center justify-center shadow-[0_20px_40px_-20px_rgba(31,51,56,.6)]" style={{ background: cat.color, color: cat.tinta }}>
        <IconoCategoria icono={cat.icono} className="w-12 h-12" />
      </span>
      <p className="m-0 mb-2 text-[12.5px] tracking-[0.16em] uppercase font-semibold text-tinta-tenue">
        Parte {idxModulo + 1} de {total}
      </p>
      <h1 className="m-0 mb-3 font-serif font-normal text-[30px] sm:text-[38px] leading-tight">{modulo}</h1>
      {cat.linea && <p className="m-0 mb-10 text-[17px] leading-relaxed text-tinta-suave">{cat.linea}</p>}
      <Button onClick={onSeguir}>Empezar</Button>
    </div>
  );
}

// Consentimiento (antes era una pantalla aparte, /app/consent): ahora va en
// la bienvenida del cuestionario, para que el enlace del correo lleve
// directo al cuestionario sin pasos intermedios (Fase 1.6).
function ConsentimientoInicial({ onListo }: { onListo: (ok: boolean) => void }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  useEffect(() => onListo(c1 && c2), [c1, c2, onListo]);
  return (
    <div className="bg-white border border-borde rounded-3xl p-5 sm:p-6 grid gap-4 text-left mb-8">
      <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
        Es un programa de estimulación con acompañamiento profesional. No es un diagnóstico ni reemplaza la atención médica. Ante una
        urgencia, llamá al <strong className="text-tinta">9-1-1</strong>.
      </p>
      <CheckRow checked={c1} onToggle={() => setC1((v) => !v)}>
        Entiendo el alcance del programa y que no sustituye la atención médica.
      </CheckRow>
      <CheckRow checked={c2} onToggle={() => setC2((v) => !v)}>
        Autorizo el uso de los datos ingresados para generar el plan y compartirlo con el equipo tratante.
      </CheckRow>
    </div>
  );
}

export function OnboardingStep() {
  const navigate = useNavigate();
  const { step: stepId } = useParams();
  // Assisted onboarding: the clinic fills this out in person on an existing
  // patient's behalf (?paciente=<id> — see the patient screen's "Llenar
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
  const [consentimiento, setConsentimiento] = useState(false);
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

  // Recomputed from live answers (not frozen at edit-start) so it self-
  // corrects if answering a question mid-edit changes which others in the
  // same module still apply.
  const editQuestions = perfilEditModule ? applicable.filter((q) => q.module === perfilEditModule) : null;
  const editIdx = editQuestions && question ? editQuestions.findIndex((q) => q.id === question.id) : -1;
  const editando = !!perfilEditQuestionId || !!editQuestions;
  const hydrateOnboarding = useAppStore((s) => s.hydrateOnboarding);
  const location = useLocation();

  // Categorías en el orden en que aparecen (solo las que aplican). Una
  // pantalla informativa pertenece a la categoría de la pregunta siguiente.
  const modulos = useMemo(() => {
    const vistos: string[] = [];
    for (const q of applicable) if (q.type !== "info" && q.module && !vistos.includes(q.module)) vistos.push(q.module);
    return vistos;
  }, [applicable]);
  const moduloDe = (i: number): string | undefined => {
    for (let k = i; k < applicable.length; k++) if (applicable[k].type !== "info") return applicable[k].module;
    return undefined;
  };
  const modulo = idx >= 0 ? moduloDe(idx) : undefined;
  const idxModulo = modulo ? modulos.indexOf(modulo) : -1;
  const preguntasDelModulo = modulo ? questionSteps.filter((q) => q.module === modulo) : [];
  const posEnModulo = question ? preguntasDelModulo.findIndex((q) => q.id === question.id) : -1;
  let moduloAnterior: string | undefined;
  for (let k = idx - 1; k >= 0; k--) {
    if (applicable[k].type !== "info") {
      moduloAnterior = applicable[k].module;
      break;
    }
  }
  // Intro de categoría solo si se entra a una categoría nueva y la pantalla
  // anterior no fue ya una de transición del propio cuestionario.
  const entraACategoria =
    !!question && question.type !== "info" && !!modulo && modulo !== moduloAnterior && applicable[idx - 1]?.type !== "info" && !editando && !assistedPatientId;
  const [introCerrada, setIntroCerrada] = useState<string | null>(null);
  const mostrarIntro = entraACategoria && introCerrada !== stepId && !introsVistas().has(modulo!);

  // Guardado automático en el servidor (onboarding_borradores): retoma en
  // otro dispositivo o si el navegador borró los datos.
  const userId = session.status === "authed" ? session.session.user.id : null;
  const guardaBorrador = !!userId && !assistedPatientId && !myPatient && !editando && idx > 0;
  useEffect(() => {
    if (!guardaBorrador || !stepId) return;
    const t = window.setTimeout(() => {
      supabase.from("onboarding_borradores").upsert({ profile_id: userId, answers, paso: stepId, updated_at: new Date().toISOString() }).then(() => {});
    }, 700);
    return () => window.clearTimeout(t);
  }, [guardaBorrador, userId, answers, stepId]);

  // Al volver a entrar (RouteGuard → /app/consent → bienvenida con
  // state.reanudar), seguir donde quedó.
  const reanudado = useRef(false);
  useEffect(() => {
    if (reanudado.current || !userId || assistedPatientId || myPatient || stepId !== "bienvenida") return;
    if (!(location.state as { reanudar?: boolean } | null)?.reanudar) return;
    reanudado.current = true;
    supabase
      .from("onboarding_borradores")
      .select("answers, paso")
      .eq("profile_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.paso || data.paso === "bienvenida") return;
        const local = Object.keys(answers).length;
        if (Object.keys(data.answers ?? {}).length >= local) hydrateOnboarding(data.answers);
        navigate(`/app/perfil/${data.paso}`, { replace: true });
      });
  }, [userId, assistedPatientId, myPatient, stepId, location.state, answers, hydrateOnboarding, navigate]);

  // Elegir una opción simple avanza sola (salvo que muestre un aviso, sea
  // la última o se esté editando).
  const [avanzar, setAvanzar] = useState(0);

  useEffect(() => {
    if (!question) navigate(withAssisted(`/app/perfil/${questions[0].id}`), { replace: true });
    else setText(typeof answers[question.id] === "string" ? (answers[question.id] as string) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  // Modalidad elegida en el home ("Empezar para mí" / "para un ser querido",
  // guardada al crear la cuenta): la primera pregunta arranca marcada con
  // esa respuesta y se puede cambiar. Depende de la respuesta actual porque
  // AppLayout vacía las respuestas al entrar una cuenta nueva.
  const paraHome = session.status === "authed" ? session.session.user.user_metadata?.para : undefined;
  useEffect(() => {
    if (assistedPatientId || question?.id !== "rol_respondente" || answers.rol_respondente) return;
    if (paraHome === "mi") answerQuestion("rol_respondente", "propia_persona");
    else if (paraHome === "ser-querido") answerQuestion("rol_respondente", "familiar");
  }, [question?.id, answers.rol_respondente, paraHome, assistedPatientId, answerQuestion]);

  // Once the duplicate question is answered (via the confirmation panel
  // below), automatically resume the submission that paused for it —
  // goNext reads duplicateResolved via closure, so this needs the value to
  // already be committed, not the same click handler that set it.
  useEffect(() => {
    if (duplicateResolved !== null) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateResolved]);

  useEffect(() => {
    if (!avanzar) return;
    const t = window.setTimeout(() => goNext(), 420);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avanzar]);

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
      navigate(`/app/profesional/paciente/${assistedPatientId}?tab=evaluacion`);
      return;
    }

    const edad = typeof answers.edad === "string" ? answers.edad.trim() : "";
    const whatsappPhone =
      typeof answers.whatsapp_telefono === "string" ? normalizeCrPhone(answers.whatsapp_telefono) : null;

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
      ? await supabase.rpc("reregister_onboarding", {
          p_nombre: nombre,
          p_edad: edad || null,
          p_answers: answers,
          p_whatsapp_phone: whatsappPhone,
        })
      : await supabase.rpc("self_onboard", {
          p_nombre: nombre,
          p_edad: edad || null,
          p_answers: answers,
          p_posible_duplicado_de: duplicateResolved === "same" ? duplicateCandidate?.id ?? null : null,
          p_whatsapp_phone: whatsappPhone,
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
    goTo(applicable[idx - 1]?.id, assistedPatientId ? "/app/profesional/usuarios" : "/app/consent");
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

  if (mostrarIntro && modulo) {
    return (
      <IntroCategoria
        key={`intro-${stepId}`}
        modulo={modulo}
        idxModulo={idxModulo}
        total={modulos.length}
        onSeguir={() => {
          marcarIntroVista(modulo);
          setIntroCerrada(stepId ?? null);
        }}
      />
    );
  }

  if (question.type === "info") {
    const cat = idx > 0 && modulo ? categoriaDe(modulo) : null;
    if (cat && modulo) marcarIntroVista(modulo);
    const animo = cat ? mensajeDeAnimo(idxModulo, modulos.length) : null;
    return (
      <div key={stepId} className="im-paso max-w-[620px] mx-auto px-5 py-14 pb-20 sm:px-8 text-center">
        {animo && <p className="m-0 mb-7 inline-flex rounded-full bg-fila-calida border border-mostaza-vital px-4 py-2 text-[14.5px] font-semibold text-tinta">{animo}</p>}
        {cat ? (
          <span className="mx-auto mb-6 w-20 h-20 rounded-[24px] flex items-center justify-center shadow-[0_18px_36px_-20px_rgba(31,51,56,.6)]" style={{ background: cat.color, color: cat.tinta }}>
            <IconoCategoria icono={cat.icono} className="w-10 h-10" />
          </span>
        ) : (
          <img src="/marca/isotipo.png" alt="" className="mx-auto mb-6 h-16 w-auto" />
        )}
        {cat && (
          <p className="m-0 mb-2 text-[12.5px] tracking-[0.16em] uppercase font-semibold text-tinta-tenue">
            Parte {idxModulo + 1} de {modulos.length} · {modulo}
          </p>
        )}
        <h1 className="font-serif font-normal text-[28px] sm:text-[38px] leading-[1.16] lg:leading-[1.12] m-0 mb-4">{resolveText(question.title, answers)}</h1>
        <p className="m-0 mb-8 text-base sm:text-lg leading-relaxed text-tinta-suave">{resolveText(question.body, answers)}</p>
        {idx === 0 && !assistedPatientId && <AntesDeEmpezar />}
        {idx === 0 && !assistedPatientId && !myPatient && <ConsentimientoInicial onListo={setConsentimiento} />}
        <Button onClick={goNext} disabled={idx === 0 && !assistedPatientId && !myPatient && !consentimiento}>
          {question.cta}
        </Button>
      </div>
    );
  }

  return (
    <div key={stepId} className="im-paso max-w-[680px] mx-auto px-5 pt-8 pb-16 sm:px-8 lg:pt-10 lg:pb-20">
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
        modulo && (
          <ProgresoCuestionario
            modulo={modulo}
            modulos={modulos}
            idxModulo={idxModulo}
            fraccionModulo={preguntasDelModulo.length ? (posEnModulo + 1) / preguntasDelModulo.length : 0}
          />
        )
      )}

      <h1 className="font-serif font-normal text-[24px] sm:text-[32px] leading-[1.2] lg:leading-[1.14] m-0 mb-2">{resolveText(question.title, answers)}</h1>
      {question.subtitle && <p className="m-0 mb-2 text-[16px] leading-relaxed text-tinta-suave">{resolveText(question.subtitle, answers)}</p>}
      {question.example && <p className="m-0 mb-6 text-[15px] text-tinta-tenue">{question.example}</p>}
      {!question.example && <div className="mb-6" />}

      {question.type === "single" && (
        <div role="radiogroup" className="grid gap-3 mb-2">
          {resolveOptions(question, answers).map((opt) => (
            <OpcionTarjeta
              key={opt.value}
              multiple={false}
              activa={value === opt.value}
              onClick={() => {
                answerQuestion(question.id, opt.value);
                const avisa = question.warning?.when(opt.value);
                if (!editando && !avisa && applicable[idx + 1] && !submitting) setAvanzar((n) => n + 1);
              }}
            >
              {opt.label}
            </OpcionTarjeta>
          ))}
        </div>
      )}

      {question.type === "multi" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {resolveOptions(question, answers).map((opt) => {
            const list = Array.isArray(value) ? value : [];
            const capReached = !!question.maxSelect && list.filter((v) => !question.exclusive?.includes(v)).length >= question.maxSelect;
            const checked = list.includes(opt.value);
            return (
              <OpcionTarjeta
                key={opt.value}
                multiple
                activa={checked}
                disabled={capReached && !checked}
                onClick={() => toggleMultiAnswer(question.id, opt.value, question.exclusive, question.maxSelect)}
              >
                {opt.label}
              </OpcionTarjeta>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <input
          type="text"
          inputMode={question.inputMode ?? "text"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            answerQuestion(question.id, e.target.value);
          }}
          className="w-full min-h-14 px-5 rounded-[18px] border-2 border-borde-campo bg-white font-sans text-[18px] text-tinta mb-2 focus:outline-none focus:border-verde-serenidad"
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
