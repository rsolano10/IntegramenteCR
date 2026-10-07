import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useMarkRegistro } from "../../lib/usePlan";
import { Button } from "./Button";
import { BigActionButton } from "./BigActionButton";
import { WarningIcon } from "./Icons";

// Full-screen, one-thing-at-a-time activity runner — reached from a
// WhatsApp "Inicio" notification tap or from the "Modo paso a paso" link on
// the regular activity page. Deliberately NOT the dashboard-style Actividad
// page: precaución first (nothing else competes for attention until it's
// acknowledged), then exactly one paso per screen, then registration. No
// shell chrome around it (see App.tsx routing + AppHeader.tsx) — the
// notification's whole point is "open the beautiful screen directly," not
// a detour through Hoy.
export function StepByStepActivity({
  taskId,
  backTo,
  size = "compact",
}: {
  taskId: string | undefined;
  backTo: string;
  size?: "compact" | "large";
}) {
  const navigate = useNavigate();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const markRegistro = useMarkRegistro(myPatient?.id);

  const task = days?.flatMap((d) => d.tasks).find((t) => t.id === taskId) ?? null;

  const large = size === "large";
  const [ackPrecaucion, setAckPrecaucion] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [screen, setScreen] = useState<"pasos" | "registro" | "helpPrompt">("pasos");
  const [helpText, setHelpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"done" | "partial" | "no" | null>(null);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex flex-col bg-fondo-papel px-5 py-6 sm:px-8">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        aria-label="Cerrar"
        className="self-end w-10 h-10 inline-flex items-center justify-center rounded-full text-tinta-tenue hover:bg-campo cursor-pointer border-none bg-transparent mb-2"
      >
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto">{children}</div>
    </div>
  );

  if (loadingPlan) return shell(<div />);

  if (!task) {
    return shell(
      <div>
        <p className={`m-0 ${large ? "text-2xl" : "text-lg"} text-tinta-suave`}>No encontramos esa actividad.</p>
        <Button variant="ink" onClick={() => navigate(backTo)} className="mt-6">
          Volver
        </Button>
      </div>,
    );
  }

  const pasos = task.pasos && task.pasos.length > 0 ? task.pasos : task.detalle ? [task.detalle] : [];
  const showPrecaucionFirst = !!task.precaucion && !ackPrecaucion;

  async function save(v: "done" | "partial" | "no", comentario?: string) {
    setSaving(true);
    setError("");
    try {
      await markRegistro(task!.id, v, comentario);
      setSaved(v);
    } catch {
      setSaving(false);
      setError("No pudimos guardar el registro. Probá de nuevo.");
    }
  }

  function confirmHelp() {
    if (!helpText.trim()) return;
    save("partial", helpText.trim());
  }

  const titleClass = large ? "font-serif font-normal text-[30px] leading-tight m-0 mb-5" : "font-serif font-normal text-2xl m-0 mb-4";
  const bodyClass = large ? "text-[22px] leading-relaxed text-tinta" : "text-[19px] leading-relaxed text-tinta";
  const bigSize = large ? "lg" : "md";

  // 1. Precaución, alone, before anything else competes for attention.
  if (showPrecaucionFirst) {
    return shell(
      <div>
        <p className={`m-0 mb-2 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-sm" : "text-[13px]"}`}>Antes de empezar</p>
        <h1 className={titleClass}>{task.titulo}</h1>
        <div className={`flex items-start gap-2.5 rounded-2xl px-5 py-5 mb-8 bg-aviso text-semaforo-amarillo-texto ${large ? "text-[22px]" : "text-[18px]"} leading-relaxed`}>
          <WarningIcon className="mt-1 shrink-0" /> {task.precaucion}
        </div>
        <BigActionButton size={bigSize} onClick={() => setAckPrecaucion(true)}>
          Entendido, empezar
        </BigActionButton>
      </div>,
    );
  }

  // 2. One paso per screen.
  if (screen === "pasos" && pasos.length > 0) {
    const isLast = stepIdx === pasos.length - 1;
    return shell(
      <div>
        <p className={`m-0 mb-2 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-sm" : "text-[13px]"}`}>
          Paso {stepIdx + 1} de {pasos.length}
        </p>
        <h1 className={titleClass}>{task.titulo}</h1>
        <p className={`${bodyClass} mb-10`}>{pasos[stepIdx]}</p>
        <div className="flex gap-3">
          {stepIdx > 0 && (
            <Button variant="secondary" onClick={() => setStepIdx((i) => i - 1)}>
              Anterior
            </Button>
          )}
          <Button variant="ink" fullWidth onClick={() => (isLast ? setScreen("registro") : setStepIdx((i) => i + 1))}>
            {isLast ? "Terminé — registrar" : "Siguiente"}
          </Button>
        </div>
      </div>,
    );
  }

  // No pasos at all (rare — a resource-less manual task): skip straight to registration.
  if (screen === "helpPrompt") {
    return shell(
      <div>
        <h1 className={titleClass}>¿Qué ayuda necesitó?</h1>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Ej.: hubo que recordarle el siguiente paso, se le acompañó físicamente…"
          className={`w-full rounded-xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans leading-relaxed text-tinta resize-y mb-5 ${large ? "text-[19px]" : "text-[16px]"}`}
        />
        {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setScreen("registro")} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={confirmHelp} disabled={!helpText.trim() || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>,
    );
  }

  // 3. Registration.
  if (saved) {
    const messages: Record<string, string> = {
      done: "Registrado. Mañana hay otra.",
      partial: "Registrado. No pasa nada, cada actividad es distinta.",
      no: "Registrado sin penalizar. No pasa nada, mañana hay otra.",
    };
    return shell(
      <div>
        <p className={`m-0 mb-6 ${large ? "text-[24px]" : "text-[20px]"} leading-relaxed text-verde-profundo`}>{messages[saved]}</p>
        <Button variant="ink" fullWidth onClick={() => navigate(backTo)}>
          Volver
        </Button>
      </div>,
    );
  }

  return shell(
    <div>
      <h1 className={titleClass}>¿Cómo le fue con "{task.titulo}"?</h1>
      {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
      <div className="grid gap-3">
        <BigActionButton variant="primary" size={bigSize} disabled={saving} onClick={() => save("done")}>
          Sí
        </BigActionButton>
        <BigActionButton variant="soft" size={bigSize} disabled={saving} onClick={() => setScreen("helpPrompt")}>
          En parte
        </BigActionButton>
        <BigActionButton variant="secondary" size={bigSize} disabled={saving} onClick={() => save("no")}>
          No
        </BigActionButton>
      </div>
    </div>,
  );
}
