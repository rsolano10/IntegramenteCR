import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { buildFinalSummary, validateFinalSummary } from "../../lib/finalSummary";
import { nombreConTratamiento, participanteEsRespondente } from "../../lib/respondentVoice";
import { computeActiveAlerts } from "../../lib/alertsEngine";
import { questions, type Option } from "../../lib/onboardingSchema";
import { equipo } from "../../lib/landingContenido";
import { waEquipo } from "../../lib/whatsapp";
import { roleHome, useSession } from "../../lib/useSession";
import { Button } from "../../components/ui/Button";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { IconoCategoria } from "../../components/onboarding/IconoCategoria";
import { supabase } from "../../lib/supabase";

// §13 RES-00/RES-01 + página de resultados (Fase 2.2).
//
// RES-00: animación corta y de duración fija (nunca un spinner indefinido)
// mientras se pide en paralelo el resumen a `generate-summary` (Gemini +
// validación); si no llega a tiempo o no pasa el validador, se usa el
// generador local determinista (finalSummary.ts).
//
// Resultados: es un perfilamiento, no un diagnóstico. Por decisión del
// producto (2026-11-04) NO se clasifican áreas: la regla de oro de
// general_rules.md prohíbe mostrar el semáforo al usuario. Se muestran los
// intereses, qué va a incluir el plan, el resumen permitido por el §13 y,
// si alguna alerta sugiere consulta, una recomendación cuidadosa con
// contacto.
const PROCESANDO_FRASES = [
  "Revisando sus intereses.",
  "Adaptando el nivel de las actividades.",
  "Tomando en cuenta sus necesidades de apoyo.",
  "Preparando su Plan de Salud Cerebral.",
];
const PROCESANDO_MS_POR_FRASE = 700;

// Alertas que piden orientar a una consulta (acciones "Recomendar
// consulta / valoración / atención profesional" en alertsEngine.ts).
const ALERTAS_CONSULTA = new Set([
  "alerta_cambio_agudo",
  "alerta_caida",
  "alerta_nutricional",
  "alerta_deglucion",
  "alerta_dolor_pecho",
  "alerta_debilidad_nueva",
  "alerta_golpe_cabeza",
  "alerta_dificultad_nueva_caminar",
  "alerta_ingesta_muy_baja",
  "alerta_confusion_baja_ingesta",
]);

const incluye: { icono: "cerebro" | "equilibrio" | "manzana"; t: string; d: string; color: string; tinta: string }[] = [
  { icono: "cerebro", t: "Estimulación cognitiva", d: "Memoria, atención y lenguaje, conectados con la vida diaria.", color: "#6a969c", tinta: "#ffffff" },
  { icono: "equilibrio", t: "Gerontogimnasia", d: "Movimiento seguro, a la medida de sus capacidades.", color: "#f4d096", tinta: "#1f3338" },
  { icono: "manzana", t: "Nutrición", d: "Ideas simples para comer e hidratarse mejor.", color: "#ebe6ce", tinta: "#3f6a70" },
];

function interesesElegidos(answers: Record<string, string | string[]>): string[] {
  const q = questions.find((x) => x.id === "intereses_actuales");
  const opciones = (Array.isArray(q?.options) ? q.options : []) as Option[];
  const elegidos = Array.isArray(answers.intereses_actuales) ? answers.intereses_actuales : [];
  return elegidos
    .filter((v) => !["otra", "poco_interes", "no_se"].includes(v))
    .map((v) => opciones.find((o) => o.value === v)?.label)
    .filter((x): x is string => !!x)
    .slice(0, 6);
}

export function ResumenFinal() {
  const navigate = useNavigate();
  const session = useSession();
  const queryClient = useQueryClient();
  const answers = useAppStore((s) => s.onboarding2);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [listo, setListo] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState("");
  const llmSummary = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke<{ summary: string | null; source: "llm" | "fallback" }>("generate-summary", { body: { answers } })
      .then(({ data }) => {
        if (!cancelled && data?.source === "llm" && data.summary && validateFinalSummary(data.summary)) {
          llmSummary.current = data.summary;
        }
      })
      .catch(() => {
        // Silencioso a propósito: cae al generador local determinista.
      });
    const interval = setInterval(() => {
      setFraseIdx((i) => (i + 1 < PROCESANDO_FRASES.length ? i + 1 : i));
    }, PROCESANDO_MS_POR_FRASE);
    const timeout = setTimeout(() => setListo(true), PROCESANDO_MS_POR_FRASE * PROCESANDO_FRASES.length);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombre = nombreConTratamiento(answers);
  const esPropia = participanteEsRespondente(answers);

  if (!listo) {
    return (
      <div className="im-in max-w-[560px] mx-auto px-5 py-16 sm:px-8 lg:py-24 text-center">
        <div className="mx-auto mb-8 w-20 h-20 rounded-full border-[5px] border-beige-serenidad border-t-verde-serenidad motion-safe:animate-spin" aria-hidden="true" />
        <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-snug m-0 mb-4">
          {esPropia ? "Gracias por compartirnos esta información." : `Gracias por compartirnos esta información sobre ${nombre}.`}
        </h1>
        <p aria-live="polite" className="m-0 text-[16px] font-semibold text-verde-profundo">
          {PROCESANDO_FRASES[fraseIdx]}
        </p>
      </div>
    );
  }

  const generado = llmSummary.current ?? buildFinalSummary(answers);
  const resumen = validateFinalSummary(generado)
    ? generado
    : `Gracias por compartirnos esta información sobre ${nombre}. Prepararemos su Plan de Salud Cerebral a partir de sus capacidades actuales, sus necesidades de apoyo y las experiencias que han sido significativas para él o ella.`;
  const intereses = interesesElegidos(answers);
  const sugiereConsulta = computeActiveAlerts(answers).some((a) => ALERTAS_CONSULTA.has(a.codigo));
  const wa = waEquipo(
    esPropia ? "Terminé el cuestionario y quisiera conversar sobre mi plan." : `Terminé el cuestionario de ${nombre} y quisiera conversar sobre su plan.`,
  );
  const fotos = equipo.filter((m) => m.foto).slice(0, 5);

  async function activar() {
    if (session.status !== "authed") return;
    setError("");
    setActivando(true);
    const { error: e } = await supabase.rpc("solicitar_semana_gratis");
    setActivando(false);
    if (e) {
      setError("No pudimos activarla. Probá de nuevo o escribinos por WhatsApp.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-patient", session.session.user.id] });
    navigate(roleHome(session.profile.role), { replace: true });
  }

  return (
    <div className="im-paso max-w-[880px] mx-auto px-5 pt-8 pb-20 sm:px-8 lg:pt-12">
      {/* Mensaje central */}
      <section className="relative overflow-hidden rounded-[32px] bg-verde-profundo text-white px-6 py-10 sm:px-12 sm:py-14 text-center">
        <span aria-hidden="true" className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-verde-serenidad/40" />
        <span aria-hidden="true" className="absolute -left-10 -bottom-24 w-56 h-56 rounded-full bg-white/5" />
        <span className="relative mx-auto mb-5 w-16 h-16 rounded-full bg-white text-verde-profundo flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="relative m-0 font-serif font-normal text-[30px] sm:text-[42px] leading-[1.1] text-white" style={{ textWrap: "balance" }}>
          {esPropia ? "Estás a un paso de empezar tu plan personalizado." : `Estás a un paso de empezar el plan personalizado de ${nombre}.`}
        </h1>
      </section>

      {/* Intereses */}
      {intereses.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-tenue">
            {esPropia ? "Lo que disfrutás" : "Lo que disfruta"}
          </h2>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
            {intereses.map((x) => (
              <li key={x} className="inline-flex items-center gap-2 rounded-full bg-white border border-borde px-4 py-2 text-[15px] text-tinta">
                <span aria-hidden="true" className="text-mostaza-vital">★</span>
                {x}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-[14.5px] text-tinta-suave">Vamos a usarlos para elegir las actividades.</p>
        </section>
      )}

      {/* Qué incluye el plan */}
      <section className="mt-10">
        <h2 className="m-0 mb-4 font-serif font-normal text-[24px] sm:text-[28px]">Qué va a incluir {esPropia ? "tu" : "su"} plan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {incluye.map((a) => (
            <article key={a.t} className="rounded-3xl bg-white border border-borde p-5">
              <span className="mb-4 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: a.color, color: a.tinta }}>
                <IconoCategoria icono={a.icono} className="w-6 h-6" />
              </span>
              <h3 className="m-0 mb-1 text-[16.5px] font-bold">{a.t}</h3>
              <p className="m-0 text-[14.5px] leading-snug text-tinta-suave">{a.d}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-3xl bg-white border border-borde px-5 py-4">
          <span className="flex -space-x-3 shrink-0">
            {fotos.map((m) => (
              <img key={m.nombre} src={m.foto!.jpg} alt="" className="w-10 h-10 rounded-full object-cover object-[center_25%] border-2 border-white" />
            ))}
          </span>
          <p className="m-0 text-[14.5px] leading-snug text-tinta">Nuestro equipo profesional revisa {esPropia ? "tus" : "sus"} respuestas y prepara el plan.</p>
        </div>
        <details className="group mt-4">
          <summary className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1.5 min-h-11 cursor-pointer text-[15px] font-semibold text-verde-profundo">
            Leer el resumen
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
              <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="m-0 mt-1 text-[15.5px] leading-relaxed text-tinta-suave">{resumen}</p>
        </details>
      </section>

      {/* Consulta sugerida: con cuidado, nunca como diagnóstico */}
      {sugiereConsulta && (
        <section className="mt-8 rounded-3xl bg-fila-calida border border-mostaza-vital p-5 sm:p-6">
          <h2 className="m-0 mb-1.5 text-[16.5px] font-bold">Un consejo antes de empezar</h2>
          <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta">
            Algunas respuestas nos indican que conviene conversar con {esPropia ? "tu" : "su"} médico. No es un diagnóstico: es para que el plan
            empiece de la forma más segura. Si querés, te orientamos.
          </p>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-white border border-borde-campo text-verde-profundo font-semibold text-[15px] no-underline">
            <WhatsAppIcon size={18} /> Escribirle al equipo
          </a>
        </section>
      )}

      {/* Oferta */}
      <section className="mt-10 rounded-[32px] border-2 border-verde-serenidad bg-verde-tenue p-6 sm:p-10 text-center">
        <span className="inline-block mb-3 text-[12px] tracking-[0.14em] uppercase font-bold bg-mostaza-vital text-tinta rounded-full px-3.5 py-1.5">Sin costo</span>
        <h2 className="m-0 mb-2 font-serif font-normal text-[30px] sm:text-[38px] leading-tight">Una semana gratis</h2>
        <p className="m-0 mb-7 text-[16px] leading-relaxed text-tinta-suave max-w-[30em] mx-auto">
          Empieza cuando nuestro equipo apruebe {esPropia ? "tu" : "la"} cuenta, así no perdés ningún día. Sin cobros automáticos.
        </p>
        <div className="grid gap-3 max-w-[360px] mx-auto">
          <Button onClick={activar} disabled={activando} fullWidth>
            {activando ? "Activando…" : "Activar mi semana gratis"}
          </Button>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-6 rounded-full bg-white border-[1.5px] border-verde-serenidad text-verde-profundo font-semibold text-[16px] no-underline hover:bg-white/70"
          >
            <WhatsAppIcon size={20} /> Hablar con el equipo por WhatsApp
          </a>
        </div>
        {error && <p className="m-0 mt-4 text-[14px] text-alerta-texto">{error}</p>}
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14.5px]">
        <button type="button" onClick={() => navigate("/app/perfil/programa")} className="bg-transparent border-0 p-2 cursor-pointer text-verde-profundo font-semibold">
          Ver los programas
        </button>
        <button type="button" onClick={() => navigate("/app/perfil/resumen")} className="bg-transparent border-0 p-2 cursor-pointer text-tinta-suave">
          Revisar mis respuestas
        </button>
      </div>
    </div>
  );
}
