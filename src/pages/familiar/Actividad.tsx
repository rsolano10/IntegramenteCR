import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useMarkRegistro } from "../../lib/usePlan";

const estadoToReg: Record<string, "done" | "partial" | "no"> = {
  realizado: "done",
  parcial: "partial",
  no: "no",
};

const regMessages: Record<string, string> = {
  done: "Registrado. Mañana se repite para consolidar la rutina.",
  partial: "Registrado. Se acortará la próxima consigna.",
  no: "Registrado sin penalizar. Nadie tiene que justificar un día difícil.",
};

const regLabel: Record<string, string> = { done: "Sí", partial: "En parte", no: "No" };

export function Actividad() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const markRegistro = useMarkRegistro(myPatient?.id);

  const today = days?.find((d) => d.isToday);
  const task = today?.tasks.find((t) => t.id === taskId) ?? null;

  const [step, setStep] = useState<"detail" | "confirmReeval" | "helpPrompt">("detail");
  const [pendingMark, setPendingMark] = useState<"done" | "partial" | "no" | null>(null);
  const [helpText, setHelpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loadingPlan) return <div className="flex-1" />;

  if (!task) {
    return (
      <div>
        <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-3.5">
          ‹ Volver a Hoy
        </Link>
        <p className="m-0 text-[16px] text-tinta-suave">No encontramos esa actividad.</p>
      </div>
    );
  }

  const showReg = estadoToReg[task.estado] ?? null;
  const pasos = task.pasos && task.pasos.length > 0 ? task.pasos : task.detalle ? [task.detalle] : [];

  function pick(v: "done" | "partial" | "no") {
    if (v === showReg) return; // already set to this — nothing changed
    setPendingMark(v);
    if (showReg) {
      setStep("confirmReeval");
      return;
    }
    proceed(v);
  }

  function proceed(v: "done" | "partial" | "no") {
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
      navigate("/app/hoy");
    } catch {
      setSaving(false);
      setError("No pudimos guardar el registro. Probá de nuevo.");
    }
  }

  function confirmHelp() {
    if (!helpText.trim()) return;
    save("partial", helpText.trim());
  }

  if (step === "confirmReeval" && pendingMark) {
    return (
      <div>
        <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Volver a evaluar</p>
        <p className="m-0 mb-6 text-[18px] leading-relaxed text-tinta">
          Ya marcaste <strong>{task.titulo}</strong> como <strong>"{regLabel[showReg!]}"</strong>. ¿Querés cambiarla a{" "}
          <strong>"{regLabel[pendingMark]}"</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep("detail")}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={() => proceed(pendingMark)}>
            Sí, volver a evaluar
          </Button>
        </div>
      </div>
    );
  }

  if (step === "helpPrompt") {
    return (
      <div>
        <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">{task.titulo}</p>
        <p className="m-0 mb-4 text-[18px] font-semibold text-tinta">¿Qué ayuda necesitó?</p>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Ej.: hubo que recordarle el siguiente paso, se le acompañó físicamente…"
          className="w-full min-h-[100px] rounded-xl border-[1.5px] border-[#ddd7be] bg-campo px-4 py-3 font-sans text-[16px] leading-relaxed text-tinta resize-y mb-4.5"
        />
        {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep("detail")} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={confirmHelp} disabled={!helpText.trim() || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-3.5">
        ‹ Volver a Hoy
      </Link>
      <h3 className="font-serif font-normal text-[26px] m-0 mb-3.5">{task.titulo}</h3>
      <div className="mb-4.5">
        <ImagePlaceholder label={`${task.tipo}${task.duracion ? ` · ${task.duracion}` : ""}`} height={150} />
      </div>

      {task.notaClinica && (
        <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4 mb-4.5">
          <p className="m-0 mb-1 text-[13px] tracking-[0.1em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}

      {task.precaucion && (
        <p className="m-0 mb-4 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-3.5 py-3">{task.precaucion}</p>
      )}

      {pasos.length > 0 && (
        <>
          <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Cómo acompañar</p>
          <div className="grid gap-2.5 mb-4.5 text-[16px] leading-relaxed text-tinta-suave">
            {pasos.map((p, i) => (
              <span key={p}>
                {i + 1}. {p}
              </span>
            ))}
          </div>
        </>
      )}

      {task.porQue && (
        <div className="bg-fila-fria rounded-2xl p-4 mb-4.5">
          <p className="m-0 mb-1.5 text-[15px] font-bold text-verde-profundo">¿Por qué esta actividad?</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">{task.porQue}</p>
        </div>
      )}

      {task.comentario && (
        <div className="bg-fila-calida rounded-2xl p-4 mb-4.5">
          <p className="m-0 mb-1.5 text-[15px] font-bold text-semaforo-amarillo-texto">Ayuda que necesitó</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">{task.comentario}</p>
        </div>
      )}

      <div className="border-t border-borde pt-4.5">
        <p className="m-0 mb-2.5 text-[15px] font-semibold">¿Se realizó?</p>
        <div className="mb-3.5">
          <OptionGroup
            value={showReg ?? ""}
            onChange={(v) => pick(v as "done" | "partial" | "no")}
            options={[
              { value: "done", label: "Sí" },
              { value: "partial", label: "En parte" },
              { value: "no", label: "No" },
            ]}
          />
        </div>

        {error && <p className="m-0 mb-4.5 text-[14px] text-alerta-texto">{error}</p>}
        {showReg && !error && <p className="m-0 mb-4.5 text-[15px] leading-relaxed text-verde-profundo">{regMessages[showReg]}</p>}

        <Button variant="ink" fullWidth onClick={() => navigate("/app/hoy")}>
          Volver a Hoy
        </Button>
      </div>
    </div>
  );
}
