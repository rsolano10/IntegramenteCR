import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { buildFinalSummary, validateFinalSummary } from "../../lib/finalSummary";
import { nombreConTratamiento, participanteEsRespondente } from "../../lib/respondentVoice";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";

// §13 RES-00/RES-01/cierre — vive fuera del motor genérico de preguntas
// porque necesita: (a) una animación corta y de duración fija (nunca un
// spinner indefinido) y (b) un resumen construido a partir de las
// respuestas ya guardadas, no otra pregunta más que responder. Mientras se
// muestran las frases rotativas de RES-00, se llama en paralelo a la edge
// function `generate-summary` (Gemini + validación); si no responde a
// tiempo, falla, o el validador la rechaza, se usa el generador local
// determinista (finalSummary.ts) — el usuario nunca ve un error ni un
// resumen fuera de las reglas del §13.
const PROCESANDO_FRASES = [
  "Revisando sus intereses.",
  "Adaptando el nivel de las actividades.",
  "Tomando en cuenta sus necesidades de apoyo.",
  "Preparando su Plan de Salud Cerebral.",
];
const PROCESANDO_MS_POR_FRASE = 700;

export function ResumenFinal() {
  const navigate = useNavigate();
  const answers = useAppStore((s) => s.onboarding2);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [listo, setListo] = useState(false);
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
        <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-snug m-0 mb-4">
          {esPropia ? "Gracias por compartirnos esta información." : `Gracias por compartirnos esta información sobre ${nombre}.`}
        </h1>
        <p className="m-0 mb-10 text-[16px] leading-relaxed text-tinta-suave">
          Estamos preparando {esPropia ? "tu" : "su"} perfil para seleccionar actividades y recomendaciones acordes con {esPropia ? "tus" : "sus"} capacidades, necesidades e intereses.
        </p>
        <p aria-live="polite" className="m-0 text-[15px] font-semibold text-verde-profundo">
          {PROCESANDO_FRASES[fraseIdx]}
        </p>
      </div>
    );
  }

  const generado = llmSummary.current ?? buildFinalSummary(answers);
  const resumen = validateFinalSummary(generado)
    ? generado
    : `Gracias por compartirnos esta información sobre ${nombre}. Prepararemos su Plan de Salud Cerebral a partir de sus capacidades actuales, sus necesidades de apoyo y las experiencias que han sido significativas para él o ella.`;

  return (
    <div className="im-in max-w-[560px] mx-auto px-5 py-14 sm:px-8 lg:py-20 text-center">
      <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-snug m-0 mb-6">
        {esPropia ? "¡Listo! Ya comenzamos a crear tu Plan de Salud Cerebral Personalizado." : `¡Listo! Ya comenzamos a crear el Plan de Salud Cerebral Personalizado de ${nombre}.`}
      </h1>
      <p className="m-0 mb-8 text-[16px] leading-relaxed text-tinta-suave text-left">{resumen}</p>
      <div className="grid gap-3 max-w-[340px] mx-auto">
        <Button variant="ink" onClick={() => navigate("/app/perfil/invitar")}>
          Ver {esPropia ? "tu" : "su"} plan personalizado
        </Button>
        <Button variant="secondary" onClick={() => navigate("/app/perfil/resumen")}>
          Revisar mis respuestas
        </Button>
      </div>
    </div>
  );
}
