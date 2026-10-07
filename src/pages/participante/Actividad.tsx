import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { BigActionButton } from "../../components/ui/BigActionButton";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { PlayIcon } from "../../components/ui/Icons";
import { speak } from "../../lib/speech";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useMarkRegistro } from "../../lib/usePlan";

const RAZONES = ["Me cansé", "No entendí", "No tenía ganas", "Me sentí mal"];

const estadoToReg: Record<string, "done" | "partial" | "no"> = {
  realizado: "done",
  parcial: "partial",
  no: "no",
};

const regLabel: Record<string, string> = { done: "Sí, lo hice", partial: "Con ayuda", no: "No pude" };

export function ParticipanteActividad() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const markRegistro = useMarkRegistro(myPatient?.id);

  const today = days?.find((d) => d.isToday);
  const task = today?.tasks.find((t) => t.id === taskId) ?? null;

  const [step, setStep] = useState<"detail" | "confirmReeval" | "helpPrompt" | "askingWhy">("detail");
  const [pendingMark, setPendingMark] = useState<"done" | "partial" | "no" | null>(null);
  const [helpText, setHelpText] = useState("");
  const [razon, setRazon] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loadingPlan) return <div className="flex-1" />;

  if (!task) {
    return (
      <>
        <Link to="/app/participante/hoy" className="inline-block border-none bg-transparent font-sans text-[17px] text-verde-profundo pb-3.5">
          ‹ Volver a Hoy
        </Link>
        <p className="m-0 text-[20px] text-tinta-suave">No encontramos esa actividad.</p>
      </>
    );
  }

  const showReg = estadoToReg[task.estado] ?? null;
  const pasos = task.pasos && task.pasos.length > 0 ? task.pasos : task.detalle ? [task.detalle] : [];

  function pick(v: "done" | "partial" | "no") {
    if (v === showReg) return; // ya está así — no hay nada que cambiar
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
    if (v === "no") {
      setRazon(null);
      setStep("askingWhy");
      return;
    }
    save("done");
  }

  async function save(v: "done" | "partial" | "no", comentario?: string) {
    setSaving(true);
    setError("");
    try {
      await markRegistro(task!.id, v, comentario);
      navigate("/app/participante/hoy");
    } catch {
      setSaving(false);
      setError("No pudimos guardar. Probá de nuevo.");
    }
  }

  function confirmHelp() {
    if (!helpText.trim()) return;
    save("partial", helpText.trim());
  }

  async function confirmarNoPude(pedirAyuda: boolean) {
    setSaving(true);
    setError("");
    try {
      await markRegistro(task!.id, "no", razon ?? undefined);
    } catch {
      setSaving(false);
      setError("No pudimos guardar. Probá de nuevo.");
      return;
    }
    if (pedirAyuda) {
      navigate("/app/participante/ayuda", {
        state: { draft: `No pude hacer "${task!.titulo}"${razon ? ` — ${razon}` : ""}.` },
      });
    } else {
      navigate("/app/participante/hoy");
    }
  }

  if (step === "confirmReeval" && pendingMark) {
    return (
      <>
        <p className="m-0 text-2xl leading-snug">
          Ya marcaste esta actividad como <strong>"{regLabel[showReg!]}"</strong>.
        </p>
        <p className="m-0 text-2xl leading-snug">
          ¿Querés cambiarla a <strong>"{regLabel[pendingMark]}"</strong>?
        </p>
        <div className="grid gap-3 mt-auto">
          <BigActionButton onClick={() => proceed(pendingMark)}>Sí, cambiar</BigActionButton>
          <BigActionButton variant="secondary" size="md" onClick={() => setStep("detail")}>
            No, dejarlo así
          </BigActionButton>
        </div>
      </>
    );
  }

  if (step === "helpPrompt") {
    return (
      <>
        <p className="m-0 text-2xl leading-snug">¿Qué ayuda necesitaste?</p>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Contanos qué ayuda necesitaste…"
          className="w-full rounded-2xl border-[1.5px] border-borde-campo bg-campo px-5 py-4 font-sans text-[20px] leading-relaxed text-tinta resize-y"
        />
        {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}
        <div className="grid gap-3 mt-auto">
          <BigActionButton variant="primary" disabled={!helpText.trim() || saving} onClick={confirmHelp}>
            {saving ? "Guardando…" : "Guardar"}
          </BigActionButton>
          <BigActionButton variant="secondary" size="md" disabled={saving} onClick={() => setStep("detail")}>
            Cancelar
          </BigActionButton>
        </div>
      </>
    );
  }

  if (step === "askingWhy") {
    return (
      <>
        <p className="m-0 text-2xl leading-snug">¿Por qué no pudiste?</p>
        <OptionGroup columns={1} value={razon ?? ""} onChange={setRazon} options={RAZONES.map((r) => ({ value: r, label: r }))} />

        <p className="m-0 mt-4 text-2xl leading-snug">¿Necesitás que alguien te ayude?</p>
        {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}
        <div className="grid gap-3 mt-auto">
          <BigActionButton disabled={saving} onClick={() => confirmarNoPude(true)}>
            Sí, necesito ayuda
          </BigActionButton>
          <BigActionButton variant="secondary" size="md" disabled={saving} onClick={() => confirmarNoPude(false)}>
            No, está bien así
          </BigActionButton>
        </div>
      </>
    );
  }

  return (
    <>
      <Link to="/app/participante/hoy" className="inline-block border-none bg-transparent font-sans text-[17px] text-verde-profundo pb-3.5">
        ‹ Volver a Hoy
      </Link>
      <h3 className="font-serif font-normal text-[28px] leading-snug m-0">{task.titulo}</h3>

      <Link
        to={`/app/participante/actividad/${task.id}/pasos`}
        className="inline-flex items-center gap-1.5 self-start px-4 py-2.5 rounded-full border-2 border-verde-serenidad bg-verde-tenue text-verde-profundo font-sans text-[16px] font-bold no-underline"
      >
        Modo paso a paso
      </Link>

      <div className="grid gap-4">
        <ResourceDetailView
          size="large"
          content={{
            mediaKind: task.mediaKind,
            storagePath: task.storagePath,
            externalUrl: task.externalUrl,
            materiales: task.materiales,
            adaptacion: task.adaptacion,
            ciencia: task.ciencia,
            porQue: task.porQue,
            pasos,
            fallbackLabel: `${task.tipo}${task.duracion ? ` · ${task.duracion}` : ""}`,
          }}
        />
      </div>

      {task.notaClinica && (
        <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-2xl px-4 py-3.5">
          <p className="m-0 mb-1 text-[15px] tracking-[0.08em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[17px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}

      {task.precaucion && (
        <p className="m-0 text-[17px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3.5">{task.precaucion}</p>
      )}

      {task.comentario && (
        <div className="bg-fila-calida rounded-2xl px-4 py-3.5">
          <p className="m-0 mb-1 text-[16px] font-bold text-semaforo-amarillo-texto">Ayuda que necesitaste</p>
          <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">{task.comentario}</p>
        </div>
      )}

      <BigActionButton variant="tertiary" size="md" onClick={() => speak([task.titulo, ...pasos].join(". "))} className="inline-flex items-center justify-center gap-2.5">
        <PlayIcon /> Escuchar
      </BigActionButton>

      {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}

      <p className="m-0 text-[20px] font-bold">¿Se realizó?</p>
      <div className="grid gap-3">
        <BigActionButton variant="primary" onClick={() => pick("done")}>
          Sí, lo hice
        </BigActionButton>
        <BigActionButton variant="soft" size="md" onClick={() => pick("partial")}>
          Con ayuda
        </BigActionButton>
        <BigActionButton variant="secondary" size="md" onClick={() => pick("no")}>
          No pude
        </BigActionButton>
      </div>

      <BigActionButton variant="caution" size="md" onClick={() => navigate("/app/participante/ayuda")}>
        Necesito ayuda
      </BigActionButton>
    </>
  );
}
