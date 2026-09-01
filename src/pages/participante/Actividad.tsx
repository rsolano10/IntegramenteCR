import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
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
          <button
            type="button"
            onClick={() => proceed(pendingMark)}
            className="min-h-19 border-none rounded-2xl bg-tinta text-white font-sans text-2xl font-bold cursor-pointer hover:bg-verde-profundo"
          >
            Sí, cambiar
          </button>
          <button
            type="button"
            onClick={() => setStep("detail")}
            className="min-h-17 border-2 border-borde rounded-2xl bg-white text-tinta font-sans text-[20px] font-bold cursor-pointer"
          >
            No, dejarlo así
          </button>
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
          className="w-full rounded-2xl border-[1.5px] border-[#ddd7be] bg-campo px-5 py-4 font-sans text-[20px] leading-relaxed text-tinta resize-y"
        />
        {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}
        <div className="grid gap-3 mt-auto">
          <button
            type="button"
            onClick={confirmHelp}
            disabled={!helpText.trim() || saving}
            className="min-h-19 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-2xl font-bold cursor-pointer hover:bg-verde-profundo disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setStep("detail")}
            disabled={saving}
            className="min-h-17 border-2 border-borde rounded-2xl bg-white text-tinta font-sans text-[20px] font-bold cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </>
    );
  }

  if (step === "askingWhy") {
    return (
      <>
        <p className="m-0 text-2xl leading-snug">¿Por qué no pudiste?</p>
        <div className="grid gap-3">
          {RAZONES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRazon(r)}
              className={`min-h-16 rounded-2xl border-2 font-sans text-[19px] font-semibold cursor-pointer ${
                razon === r ? "border-verde-serenidad bg-[#edf4f4]" : "border-borde bg-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="m-0 mt-4 text-2xl leading-snug">¿Necesitás que alguien te ayude?</p>
        {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}
        <div className="grid gap-3 mt-auto">
          <button
            type="button"
            onClick={() => confirmarNoPude(true)}
            disabled={saving}
            className="min-h-19 border-none rounded-2xl bg-tinta text-white font-sans text-2xl font-bold cursor-pointer hover:bg-verde-profundo"
          >
            Sí, necesito ayuda
          </button>
          <button
            type="button"
            onClick={() => confirmarNoPude(false)}
            disabled={saving}
            className="min-h-17 border-2 border-borde rounded-2xl bg-white text-tinta font-sans text-[20px] font-bold cursor-pointer"
          >
            No, está bien así
          </button>
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
      <ImagePlaceholder label={`${task.tipo}${task.duracion ? ` · ${task.duracion}` : ""}`} height={170} rounded="rounded-[20px]" />

      {task.notaClinica && (
        <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl px-4 py-3.5">
          <p className="m-0 mb-1 text-[15px] tracking-[0.08em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[17px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}

      {task.precaucion && (
        <p className="m-0 text-[17px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3.5">{task.precaucion}</p>
      )}

      {pasos.length > 0 && (
        <div className="grid gap-2.5 text-[19px] leading-relaxed text-tinta-suave">
          {pasos.map((p, i) => (
            <span key={p}>{i + 1}. {p}</span>
          ))}
        </div>
      )}

      {task.comentario && (
        <div className="bg-fila-calida rounded-2xl px-4 py-3.5">
          <p className="m-0 mb-1 text-[16px] font-bold text-semaforo-amarillo-texto">Ayuda que necesitaste</p>
          <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">{task.comentario}</p>
        </div>
      )}

      <button type="button" onClick={() => speak([task.titulo, ...pasos].join(". "))} className="min-h-17 border-none rounded-2xl bg-beige-serenidad text-tinta font-sans text-[22px] font-bold cursor-pointer">
        ▶ Escuchar
      </button>

      {error && <p className="m-0 text-[16px] text-alerta-texto">{error}</p>}

      <p className="m-0 text-[20px] font-bold">¿Se realizó?</p>
      <div className="grid gap-3">
        <button type="button" onClick={() => pick("done")} className="min-h-19 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-2xl font-bold cursor-pointer hover:bg-verde-profundo">
          Sí, lo hice
        </button>
        <button type="button" onClick={() => pick("partial")} className="min-h-17 border-2 border-verde-serenidad rounded-2xl bg-[#f5f9f9] text-verde-profundo font-sans text-[20px] font-bold cursor-pointer">
          Con ayuda
        </button>
        <button type="button" onClick={() => pick("no")} className="min-h-17 border-2 border-borde rounded-2xl bg-white text-tinta font-sans text-[20px] font-bold cursor-pointer">
          No pude
        </button>
      </div>

      <button type="button" onClick={() => navigate("/app/participante/ayuda")} className="min-h-17 border-2 border-mostaza-vital rounded-2xl bg-aviso text-[#4a3a1b] font-sans text-[22px] font-bold cursor-pointer hover:bg-mostaza-vital">
        Necesito ayuda
      </button>
    </>
  );
}
