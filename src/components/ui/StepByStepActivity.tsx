import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useVolver } from "../../lib/useVolver";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useMarkRegistro } from "../../lib/usePlan";
import { usePerfilRecursos } from "../../lib/usePerfilRecursos";
import { guiaDeTarea } from "../../lib/pasoAPaso";
import { nivelCognitivoLabel, resourceUrl, type NivelCognitivo } from "../../lib/mediaResources";
import { moduloLabel } from "../../lib/modulos";
import { antesDeEmpezar, cuandoParar } from "../../lib/bloquesGerontogimnasia";
import { Button } from "./Button";
import { BigActionButton } from "./BigActionButton";
import { WarningIcon } from "./Icons";
import { MaterialDeApoyo } from "./ResourceDetailView";

// Modo paso a paso: una cosa por pantalla, a pantalla completa (se llega
// desde "Empezar" en Hoy, desde la actividad o desde el recordatorio de
// WhatsApp). Orden: preparación (qué se necesita y los avisos de seguridad;
// en gerontogimnasia, «Cuándo parar» primero) → video si hay → una consigna
// por pantalla, con la ayuda de su etapa a mano → cierre → recién ahí
// «¿Cómo le fue?». Sin el marco de la app alrededor (App.tsx + AppHeader.tsx).

type Fase = { tipo: "preparacion" } | { tipo: "video" } | { tipo: "paso"; i: number } | { tipo: "juego" } | { tipo: "cierre" };
const ETAPAS: NivelCognitivo[] = ["preventivo", "dcl", "leve", "moderada", "avanzada"];

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
  // Cerrar (×) vuelve a la pantalla de la que se vino: la actividad, Hoy o
  // Mi semana. Al terminar de registrar, a la lista (backTo).
  const volver = useVolver(backTo);
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: perfil } = usePerfilRecursos();
  const markRegistro = useMarkRegistro(myPatient?.id);

  const task = days?.flatMap((d) => d.tasks).find((t) => t.id === taskId) ?? null;

  const large = size === "large";
  const [faseIdx, setFaseIdx] = useState(0);
  const [screen, setScreen] = useState<"guia" | "registro" | "helpPrompt">("guia");
  const [helpText, setHelpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"done" | "partial" | "no" | null>(null);

  const shell = (children: ReactNode, progreso?: number) => (
    <div className="min-h-screen flex flex-col bg-fondo-papel px-5 py-6 sm:px-8">
      <div className="flex items-center gap-4 max-w-xl w-full mx-auto mb-2">
        {progreso !== undefined ? (
          <div className="flex-1 h-1.5 rounded-full bg-borde-suave overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progreso * 100)}>
            <div className="h-full rounded-full bg-verde-serenidad transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(4, progreso * 100)}%` }} />
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <button
          type="button"
          onClick={volver}
          aria-label="Cerrar"
          className="w-10 h-10 inline-flex items-center justify-center rounded-full text-tinta-tenue hover:bg-campo cursor-pointer border-none bg-transparent"
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto py-4">{children}</div>
    </div>
  );

  if (loadingPlan) return shell(<div />);

  if (!task) {
    return shell(
      <div>
        <p className={`m-0 ${large ? "text-2xl" : "text-lg"} text-tinta-suave`}>No encontramos esa actividad.</p>
        <Button variant="ink" onClick={volver} className="mt-6">
          Volver
        </Button>
      </div>,
    );
  }

  const guia = guiaDeTarea(task);
  const esGer = task.modulo === "gerontogimnasia";
  const esIntroGer = esGer && task.codigo === "GER-010";
  const videoUrl = task.mediaKind === "video" ? resourceUrl({ storage_path: task.storagePath ?? null, external_url: task.externalUrl ?? null }) : null;
  const posterUrl = task.posterPath ? (resourceUrl({ storage_path: task.posterPath, external_url: null }) ?? undefined) : undefined;
  const dosis = task.indicacionIndividual || task.dosis;
  const avisos = [task.precaucion, task.tenEnCuenta].filter((x): x is string => !!x);
  const hayPreparacion = !!(guia.prepara || avisos.length || dosis || (esGer && !esIntroGer));

  // Ayuda a mano en cada paso: la general y la adaptación de su etapa.
  const etapas = perfil?.etapas ?? [];
  const adaptaciones = task.adaptacionPorEtapa
    ? ETAPAS.filter((e) => task.adaptacionPorEtapa![e] && (!etapas.length || etapas.includes(e)))
    : [];
  const hayAyuda = !!(task.ayuda || task.adaptacion || adaptaciones.length);

  const esJuego = task.extras?.modo === "clasificar";
  const fases: Fase[] = [
    ...(hayPreparacion ? [{ tipo: "preparacion" } as const] : []),
    ...(videoUrl ? [{ tipo: "video" } as const] : []),
    ...guia.pasos.map((_, i) => ({ tipo: "paso", i }) as const),
    // Juego interactivo (p. ej. clasificar números): una fase propia, antes
    // del cierre y del registro.
    ...(esJuego ? [{ tipo: "juego" } as const] : []),
    ...(task.paraCerrar ? [{ tipo: "cierre" } as const] : []),
  ];
  const totalPasos = guia.pasos.length;

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

  const titleClass = large ? "font-serif font-normal text-[30px] leading-tight m-0 mb-5" : "font-serif font-normal text-2xl sm:text-[28px] leading-tight m-0 mb-4";
  const bodyClass = large ? "text-[22px] leading-relaxed text-tinta" : "text-[19px] leading-relaxed text-tinta";
  const smallClass = large ? "text-[18px] leading-relaxed" : "text-[15.5px] leading-relaxed";
  const eyebrow = `m-0 mb-2 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-sm" : "text-[13px]"}`;
  const bigSize = large ? "lg" : "md";

  const siguiente = () => (faseIdx < fases.length - 1 ? setFaseIdx((i) => i + 1) : setScreen("registro"));
  const navegacion = (etiqueta: string) => (
    <div className="flex gap-3 mt-8">
      {faseIdx > 0 && (
        <Button variant="secondary" onClick={() => setFaseIdx((i) => i - 1)}>
          Anterior
        </Button>
      )}
      <Button variant="ink" fullWidth onClick={siguiente}>
        {etiqueta}
      </Button>
    </div>
  );

  if (screen === "guia" && fases.length > 0) {
    const fase = fases[Math.min(faseIdx, fases.length - 1)];
    const progreso = (faseIdx + 1) / (fases.length + 1);
    const ultimaAntesDeRegistrar = faseIdx === fases.length - 1;

    // 1. Preparación: qué se necesita y los avisos, antes de empezar.
    if (fase.tipo === "preparacion") {
      return shell(
        <div>
          <p className={eyebrow}>
            Antes de empezar{task.modulo ? ` · ${moduloLabel[task.modulo]}` : ""}
            {task.duracion ? ` · ${task.duracion}` : ""}
          </p>
          <h1 className={titleClass}>{task.titulo}</h1>
          <div className="grid gap-3.5">
            {esGer && !esIntroGer && (
              <div className={`rounded-2xl px-5 py-4 bg-aviso border border-mostaza-vital text-tinta ${smallClass}`}>
                <p className="m-0 mb-1 font-bold flex items-center gap-2">
                  <WarningIcon className="shrink-0" /> Cuándo parar
                </p>
                <p className="m-0">{cuandoParar}</p>
              </div>
            )}
            {guia.prepara && (
              <div className={`rounded-2xl px-5 py-4 bg-white border border-borde ${smallClass} text-tinta-suave`}>
                <p className="m-0 mb-1 font-bold text-tinta">Qué vas a necesitar</p>
                <p className="m-0">{guia.prepara}</p>
              </div>
            )}
            {esGer && !esIntroGer && <p className={`m-0 text-tinta-suave ${smallClass}`}>{antesDeEmpezar}</p>}
            {avisos.map((a) => (
              <div key={a} className={`flex items-start gap-2.5 rounded-2xl px-5 py-4 bg-aviso text-semaforo-amarillo-texto ${smallClass}`}>
                <WarningIcon className="mt-1 shrink-0" /> {a}
              </div>
            ))}
            {dosis && (
              <p className={`m-0 text-tinta-suave ${smallClass}`}>
                <strong className="text-tinta">{task.indicacionIndividual ? "Dosis indicada por el equipo:" : "Dosis propuesta del terapeuta:"}</strong> {dosis}
              </p>
            )}
          </div>
          <div className="mt-8">
            <BigActionButton size={bigSize} onClick={siguiente}>
              {avisos.length || esGer ? "Entendido, empezar" : "Empezar"}
            </BigActionButton>
          </div>
        </div>,
        progreso,
      );
    }

    // 2. Video, en su propia pantalla.
    if (fase.tipo === "video" && videoUrl) {
      return shell(
        <div>
          <p className={eyebrow}>Mirá cómo se hace</p>
          <h1 className={titleClass}>{task.titulo}</h1>
          {guia.notas.length > 0 && <p className={`m-0 mb-4 text-tinta-suave ${smallClass}`}>{guia.notas.join(" ")}</p>}
          <video controls playsInline preload="metadata" poster={posterUrl} src={videoUrl} className="w-full rounded-2xl bg-tinta object-contain" style={{ maxHeight: "60vh" }} />
          {navegacion(totalPasos > 0 ? "Ir a las consignas" : "Siguiente")}
        </div>,
        progreso,
      );
    }

    // 3. Una consigna por pantalla.
    if (fase.tipo === "paso") {
      const paso = guia.pasos[fase.i];
      return shell(
        <div>
          <p className={eyebrow}>
            Paso {fase.i + 1} de {totalPasos}
          </p>
          <h1 className={`${titleClass} text-tinta-suave`}>{task.titulo}</h1>
          <p className={`${bodyClass} m-0`}>{paso.texto}</p>
          {paso.lista && (
            <ul className={`mt-3 mb-0 pl-6 grid gap-2 ${bodyClass}`}>
              {paso.lista.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          )}
          {task.extras && !esJuego && (
            <div className="mt-6">
              <MaterialDeApoyo extras={task.extras} large={large} />
            </div>
          )}
          {hayAyuda && (
            <details className="mt-6 rounded-2xl border border-borde bg-white px-4 py-3">
              <summary className={`cursor-pointer font-semibold text-verde-profundo ${smallClass}`}>¿Necesita ayuda?</summary>
              <div className={`grid gap-2 mt-2.5 text-tinta-suave ${smallClass}`}>
                {task.ayuda && <p className="m-0">{task.ayuda}</p>}
                {task.adaptacion && <p className="m-0 whitespace-pre-line">{task.adaptacion}</p>}
                {adaptaciones.map((e) => (
                  <p key={e} className="m-0">
                    {(adaptaciones.length > 1 || !etapas.length) && <strong className="text-tinta">{nivelCognitivoLabel[e]}: </strong>}
                    {task.adaptacionPorEtapa![e]}
                  </p>
                ))}
              </div>
            </details>
          )}
          {navegacion(ultimaAntesDeRegistrar ? "Terminamos, registrar" : "Siguiente")}
        </div>,
        progreso,
      );
    }

    // 4. Cierre.
    if (fase.tipo === "juego" && task.extras) {
      return shell(
        <div>
          <MaterialDeApoyo extras={task.extras} large={large} />
          {/* Terminar el juego no registra la actividad: eso lo hace la persona o su familiar. */}
          {navegacion(fases[faseIdx + 1] ? "Siguiente" : "Registrar cómo les fue")}
        </div>,
        progreso,
      );
    }

    if (fase.tipo === "cierre") {
      return shell(
        <div className="text-center">
          <p className={eyebrow}>¡Listo!</p>
          <p className={`m-0 font-serif italic text-verde-profundo leading-snug ${large ? "text-[32px]" : "text-[26px]"}`}>{task.paraCerrar}</p>
          <div className="text-left">{navegacion("Registrar cómo les fue")}</div>
        </div>,
        progreso,
      );
    }
  }

  // Registro: siempre al final.
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
      1,
    );
  }

  if (saved) {
    const messages: Record<string, string> = {
      done: "Registrado. Mañana hay otra.",
      partial: "Registrado. No pasa nada, cada actividad es distinta.",
      no: "Registrado sin penalizar. No pasa nada, mañana hay otra.",
    };
    return shell(
      <div>
        <p className={`m-0 mb-6 ${large ? "text-[24px]" : "text-[20px]"} leading-relaxed text-verde-profundo`}>{messages[saved]}</p>
        <Button variant="ink" fullWidth onClick={() => navigate(backTo, { replace: true })}>
          Volver
        </Button>
      </div>,
      1,
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
      {fases.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setScreen("guia");
            setFaseIdx(fases.length - 1);
          }}
          className="mt-5 border-none bg-transparent p-0 font-sans text-[15px] text-verde-profundo underline decoration-dotted cursor-pointer"
        >
          Volver a los pasos
        </button>
      )}
    </div>,
    1,
  );
}
