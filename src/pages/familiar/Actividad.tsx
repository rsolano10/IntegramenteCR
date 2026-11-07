import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";
import { ModuloIcon } from "../../components/ui/ModuloIcon";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useMarkRegistro } from "../../lib/usePlan";
import { contenidoDeTarea } from "../../lib/contenidoRecurso";
import { usePerfilRecursos } from "../../lib/usePerfilRecursos";
import { moduloLabel, moduloTheme } from "../../lib/modulos";
import { origenDeActividad, useVolver } from "../../lib/useVolver";
import { IntroGerontogimnasia } from "../../components/ui/IntroGerontogimnasia";
import type { PlanDayStatus } from "../../lib/mockData";

const regMessages: Record<string, string> = {
  done: "Registrado. ¡Bien hecho!",
  partial: "Registrado. Gracias por contarnos qué ayuda necesitó.",
  no: "Registrado sin penalizar. Nadie tiene que justificar un día difícil.",
};

// Estado de una actividad ya registrada (no se puede volver a hacer).
const estadoHecha: Partial<Record<PlanDayStatus, { texto: string; clase: string }>> = {
  realizado: { texto: "Realizada", clase: "bg-fila-fria text-semaforo-verde-texto" },
  parcial: { texto: "Hecha en parte", clase: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { texto: "No se realizó", clase: "bg-campo text-tinta-suave" },
};

// La pantalla de una actividad, igual desde Hoy (/app/hoy/actividad/:id) y
// desde Mi semana (/app/plan/actividad/:id). Solo una actividad de hoy que
// todavía no se registró se puede hacer (modo paso a paso) y registrar; las
// ya registradas y las de otros días se consultan, sin volver a hacerlas.
export function Actividad() {
  const { data: perfilRecursos } = usePerfilRecursos();
  const etapas = perfilRecursos?.etapas ?? null;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { taskId } = useParams();
  const origen = origenDeActividad(pathname);
  const volver = useVolver(origen.ruta);
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const markRegistro = useMarkRegistro(myPatient?.id);

  const dia = days?.find((d) => d.tasks.some((t) => t.id === taskId)) ?? null;
  const task = dia?.tasks.find((t) => t.id === taskId) ?? null;

  const [step, setStep] = useState<"detail" | "helpPrompt">("detail");
  const [helpText, setHelpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"done" | "partial" | "no" | null>(null);
  const [error, setError] = useState("");

  const botonVolver = (
    <button type="button" onClick={volver} className="inline-flex items-center gap-1 min-h-11 -ml-1 px-1 border-none bg-transparent font-sans text-[15px] font-semibold text-verde-profundo cursor-pointer mb-1">
      ‹ Volver a {origen.nombre}
    </button>
  );

  if (loadingPlan) return <div className="flex-1" />;

  if (!task || !dia) {
    return (
      <div>
        {botonVolver}
        <p className="m-0 text-[16px] text-tinta-suave">No encontramos esa actividad.</p>
      </div>
    );
  }

  const hecha = estadoHecha[task.estado] ?? null;
  const realizable = !!dia.isToday && (task.estado === "pendiente" || task.estado === "futuro") && !saved;
  const pasos = task.pasos && task.pasos.length > 0 ? task.pasos : task.detalle ? [task.detalle] : [];
  const tema = task.modulo ? moduloTheme[task.modulo] : null;

  function pick(v: "done" | "partial" | "no") {
    if (v === "partial") {
      setHelpText("");
      setError("");
      setStep("helpPrompt");
      return;
    }
    save(v);
  }

  async function save(v: "done" | "partial" | "no", comentario?: string) {
    setSaving(true);
    setError("");
    try {
      await markRegistro(task!.id, v, comentario);
      setSaving(false);
      setSaved(v);
      setStep("detail");
    } catch {
      setSaving(false);
      setError("No pudimos guardar el registro. Probá de nuevo.");
    }
  }

  if (step === "helpPrompt") {
    return (
      <div>
        <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-tinta-suave">{task.titulo}</p>
        <p className="m-0 mb-4 text-[18px] font-semibold text-tinta">¿Qué ayuda necesitó?</p>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          rows={4}
          autoFocus
          aria-label="Qué ayuda necesitó"
          placeholder="Ej.: hubo que recordarle el siguiente paso, se le acompañó físicamente…"
          className="w-full min-h-[100px] rounded-xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans text-[16px] leading-relaxed text-tinta resize-y mb-4.5"
        />
        {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep("detail")} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={() => helpText.trim() && save("partial", helpText.trim())} disabled={!helpText.trim() || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    );
  }

  // Datos de la actividad, discretos, debajo del título: área, hora y duración.
  const datos = [
    task.modulo ? moduloLabel[task.modulo] : null,
    !dia.isToday ? dia.dia : null,
    task.hora || null,
  ].filter(Boolean) as string[];

  return (
    <div>
      {botonVolver}

      <header className="flex items-start gap-3.5 mb-5">
        {task.modulo && tema && (
          <span
            aria-hidden="true"
            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white ${hecha || saved ? "saturate-[0.6] opacity-85" : ""}`}
            style={{ backgroundImage: `linear-gradient(140deg, ${tema.from}, ${tema.to})` }}
          >
            <ModuloIcon modulo={task.modulo} className="w-6 h-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif font-normal text-[26px] leading-tight m-0 text-tinta">{task.titulo}</h1>
          <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-tinta-suave">
            {datos.map((d, i) => (
              <span key={d} className="inline-flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                {d}
              </span>
            ))}
            {task.duracion && (
              <span className="inline-flex items-center gap-1.5">
                {datos.length > 0 && <span aria-hidden="true">·</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
                {task.duracion}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Qué se puede hacer con esta actividad, según su estado. */}
      {realizable ? (
        <Link
          to={`${pathname}/pasos`}
          className="mb-6 flex items-center justify-center gap-2.5 min-h-13 rounded-full bg-verde-serenidad text-white font-semibold text-[16.5px] no-underline hover:bg-verde-profundo transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.4-4.8a.6.6 0 0 0 0-1L5.92 2.7A.6.6 0 0 0 5 3.2Z" />
          </svg>
          Empezar paso a paso
        </Link>
      ) : saved ? (
        <p className="m-0 mb-6 rounded-2xl bg-fila-fria px-4 py-3 text-[15px] leading-relaxed text-semaforo-verde-texto" role="status">
          {regMessages[saved]}
        </p>
      ) : hecha ? (
        <p className="m-0 mb-6 flex flex-wrap items-center gap-2.5 text-[14.5px] text-tinta-suave">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13.5px] font-semibold ${hecha.clase}`}>
            {task.estado === "realizado" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {hecha.texto}
          </span>
          Ya está registrada. Podés repasarla cuando quieras.
        </p>
      ) : (
        <p className="m-0 mb-6 rounded-2xl bg-campo border border-borde-suave px-4 py-3 text-[14.5px] leading-relaxed text-tinta-suave">
          {task.estado === "futuro"
            ? `Esta actividad es para el ${dia.dia.toLowerCase()}. Ese día vas a poder hacerla y registrarla.`
            : `Esta actividad era para el ${dia.dia.toLowerCase()}. Podés repasarla, pero ya no se registra.`}
        </p>
      )}

      <div className="grid gap-4.5 mb-4.5">
        {task.modulo === "gerontogimnasia" && task.codigo !== "GER-010" && <IntroGerontogimnasia />}
        <ResourceDetailView content={contenidoDeTarea(task, "", etapas, pasos)} />
      </div>

      {task.notaClinica && (
        <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-2xl p-4 mb-4.5">
          <p className="m-0 mb-1 text-[13px] tracking-[0.1em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}

      {task.precaucion && (
        <p className="m-0 mb-4 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-3.5 py-3">{task.precaucion}</p>
      )}

      {task.comentario && (
        <div className="bg-fila-calida rounded-2xl p-4 mb-4.5">
          <p className="m-0 mb-1.5 text-[15px] font-bold text-semaforo-amarillo-texto">Ayuda que necesitó</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">{task.comentario}</p>
        </div>
      )}

      {/* Registrar sin el paso a paso: solo para la actividad de hoy pendiente. */}
      {realizable && (
        <div className="border-t border-borde pt-4.5 mt-2">
          <p className="m-0 mb-2.5 text-[15px] font-semibold">¿Ya la hicieron? Registrala acá</p>
          <div className="mb-3.5">
            <OptionGroup
              value=""
              onChange={(v) => pick(v as "done" | "partial" | "no")}
              options={[
                { value: "done", label: "Sí" },
                { value: "partial", label: "En parte" },
                { value: "no", label: "No" },
              ]}
            />
          </div>
          {error && <p className="m-0 mb-4.5 text-[14px] text-alerta-texto">{error}</p>}
        </div>
      )}

      <Button variant={realizable ? "secondary" : "ink"} fullWidth onClick={() => (saved ? navigate(origen.ruta, { replace: true }) : volver())} className="mt-2">
        Volver a {origen.nombre}
      </Button>
    </div>
  );
}
