import { useMemo, useState } from "react";
import { describeAnswer, groupAnswerableByModule, resolveText, type Answers } from "../../../lib/onboardingSchema";
import { computeActiveAlerts } from "../../../lib/alertsEngine";
import { buildFinalSummary } from "../../../lib/finalSummary";
import { Button } from "../../ui/Button";
import { RejectPanel } from "./RejectPanel";
import type { PatientRow } from "../../../lib/patients";

// Evaluación inicial: todo lo que la familia respondió, en solo lectura y
// fácil de recorrer, con la decisión (aceptar / rechazar) siempre a mano en
// la columna derecha. Nada de esto es editable desde acá — son las
// respuestas de la familia, no datos de la clínica.
export function EvaluacionTab({
  patient,
  answers,
  loadingAnswers,
  onAccept,
  onRejected,
  onStartAssisted,
  readOnly = false,
}: {
  patient: PatientRow;
  // Paciente ya activo: el perfil inicial queda como referencia, sin la
  // columna de decisión.
  readOnly?: boolean;
  answers: Answers | null;
  loadingAnswers: boolean;
  onAccept: () => void;
  onRejected: (message: string) => void;
  onStartAssisted: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const hasAnswers = !!answers && Object.keys(answers).length > 0;

  return (
    <div className={`grid gap-6 items-start ${readOnly ? "max-w-[900px]" : "lg:grid-cols-[minmax(0,1fr)_340px]"}`}>
      <div className="grid gap-5 min-w-0">
        {loadingAnswers ? (
          <div className="bg-white border border-borde rounded-3xl p-8 text-center text-tinta-tenue text-[15px]">Cargando el cuestionario…</div>
        ) : !hasAnswers && readOnly ? (
          <div className="bg-white border border-borde rounded-3xl p-7 text-[15px] text-tinta-suave">Este paciente no tiene cuestionario registrado.</div>
        ) : !hasAnswers ? (
          <div className="bg-white border border-borde rounded-3xl p-7">
            <h3 className="font-serif font-normal text-[22px] m-0 mb-2">Todavía no hay cuestionario</h3>
            <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta-suave">
              Este paciente lo creó la clínica y nadie completó el perfil todavía. Podés llenarlo junto con la persona en consulta.
            </p>
            <Button variant="ink" dense onClick={onStartAssisted}>
              Llenar el cuestionario con el paciente
            </Button>
          </div>
        ) : (
          <>
            <ResumenPerfil answers={answers!} />
            <AlertasActivas answers={answers!} />
            <Cuestionario answers={answers!} />
          </>
        )}
      </div>

      {!readOnly && (
      <aside className="lg:sticky lg:top-24 grid gap-4">
        <div className="bg-white border border-borde rounded-3xl p-5 sm:p-6 shadow-elevada">
          <p className="m-0 mb-1 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Tu decisión</p>
          {!rejecting ? (
            <>
              <h3 className="font-serif font-normal text-[22px] m-0 mb-2">¿Aceptamos a {patient.nombre.split(" ")[0]}?</h3>
              <p className="m-0 mb-5 text-[14px] leading-relaxed text-tinta-suave">
                Al aceptar armás su primera semana en el planificador. La familia recibe el aviso por el chat de la app, correo y WhatsApp.
              </p>
              <div className="grid gap-2.5">
                <Button variant="ink" fullWidth onClick={onAccept} disabled={!hasAnswers}>
                  Aceptar y armar el plan
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setRejecting(true)} className="text-alerta-texto">
                  Rechazar solicitud
                </Button>
              </div>
            </>
          ) : (
            <RejectPanel patientId={patient.id} patientNombre={patient.nombre} onCancel={() => setRejecting(false)} onRejected={onRejected} />
          )}
        </div>
      </aside>
      )}
    </div>
  );
}

function ResumenPerfil({ answers }: { answers: Answers }) {
  const resumen = useMemo(() => buildFinalSummary(answers), [answers]);
  return (
    <section className="bg-verde-tenue border border-borde rounded-3xl p-5 sm:p-7">
      <p className="m-0 mb-2 text-[12px] tracking-[0.14em] uppercase text-verde-profundo font-semibold">Resumen del perfil</p>
      <p className="m-0 text-[16px] leading-relaxed text-tinta">{resumen}</p>
    </section>
  );
}

// §14 — cada alerta activa con su origen y acciones sugeridas. Solo informa
// a la clínica; nunca bloquea nada del lado de la familia.
function AlertasActivas({ answers }: { answers: Answers }) {
  const activas = computeActiveAlerts(answers);
  if (activas.length === 0) {
    return (
      <section className="flex items-center gap-3 bg-white border border-borde rounded-2xl px-5 py-4">
        <span className="w-8 h-8 rounded-full bg-fila-fria text-semaforo-verde-texto flex items-center justify-center shrink-0">✓</span>
        <p className="m-0 text-[15px] text-tinta-suave">Sin alertas activas en el cuestionario.</p>
      </section>
    );
  }
  return (
    <section className="bg-white border-[1.5px] border-riesgo-borde rounded-3xl p-5 sm:p-6">
      <p className="m-0 mb-3.5 text-[12px] tracking-[0.14em] uppercase text-riesgo-texto font-semibold">
        Alertas activas · {activas.length}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {activas.map((alerta) => (
          <div key={alerta.codigo} className="rounded-2xl bg-riesgo border border-riesgo-borde p-4">
            <p className="m-0 mb-1 text-[15px] font-bold text-riesgo-texto">{alerta.etiqueta}</p>
            <p className="m-0 mb-2 text-[12px] text-riesgo-texto/75">Origen: {alerta.origenPantalla}</p>
            <ul className="m-0 pl-4 text-[13.5px] text-riesgo-texto leading-relaxed">
              {alerta.acciones.map((accion) => (
                <li key={accion}>{accion}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cuestionario({ answers }: { answers: Answers }) {
  const groups = useMemo(() => groupAnswerableByModule(answers), [answers]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map((g) => g.module)));
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = groups
    .map((g) => ({
      ...g,
      rows: g.questions
        .map((qq) => ({ id: qq.id, pregunta: resolveText(qq.title, answers) ?? "", respuesta: describeAnswer(qq, answers) }))
        .filter((r) => !q || r.pregunta.toLowerCase().includes(q) || r.respuesta.toLowerCase().includes(q)),
    }))
    .filter((g) => g.rows.length > 0);

  const allOpen = filtered.every((g) => open.has(g.module));

  function toggle(module: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  return (
    <section className="bg-white border border-borde rounded-3xl overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-borde-suave flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Cuestionario completo</p>
          <p className="m-0 mt-0.5 text-[13.5px] text-tinta-tenue">Respuestas de la familia, tal como las dieron.</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en las respuestas…"
            className="flex-1 sm:w-56 min-h-10 px-3.5 rounded-full border-[1.5px] border-borde-campo bg-campo font-sans text-[14px] text-tinta"
          />
          <button
            type="button"
            onClick={() => setOpen(allOpen ? new Set() : new Set(filtered.map((g) => g.module)))}
            className="shrink-0 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none"
          >
            {allOpen ? "Cerrar todo" : "Abrir todo"}
          </button>
        </div>
      </div>
      {filtered.length === 0 && <p className="m-0 px-6 py-6 text-[14px] text-tinta-tenue">Ninguna respuesta coincide con "{query}".</p>}
      {filtered.map((g) => {
        const isOpen = open.has(g.module) || !!q;
        return (
          <div key={g.module} className="border-b border-borde-suave last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(g.module)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-transparent border-none cursor-pointer text-left font-sans hover:bg-campo"
            >
              <span className="font-serif text-[18px] text-tinta">{g.module}</span>
              <span className="flex items-center gap-3 text-[13px] text-tinta-tenue">
                {g.rows.length} {g.rows.length === 1 ? "respuesta" : "respuestas"}
                <span aria-hidden="true" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  ⌄
                </span>
              </span>
            </button>
            {isOpen && (
              <dl className="m-0 px-5 sm:px-6 pb-4 grid gap-0">
                {g.rows.map((r) => (
                  <div key={r.id} className="grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-1 sm:gap-5 py-2.5 border-t border-borde-suave first:border-t-0">
                    <dt className="text-[14px] text-tinta-tenue leading-snug">{r.pregunta}</dt>
                    <dd className="m-0 text-[14.5px] text-tinta font-medium leading-snug">{r.respuesta}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        );
      })}
    </section>
  );
}
