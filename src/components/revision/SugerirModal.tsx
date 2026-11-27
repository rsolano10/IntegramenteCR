import { useState } from "react";
import { DIAS, HORAS } from "../../lib/planWeek";
import { NIVELES, nivelLabel, type Nivel } from "../../lib/actividades/contrato";
import { recDe, textoPos, useAgregarItem, type Cambio, type ObjetoRevision, type Pos, type Rec } from "../../lib/revisiones";
import type { MediaResource } from "../../lib/mediaResources";
import { Modal } from "../ui/Modal";
import { SelectorRecurso } from "../profesional/SelectorRecurso";

// Quien revisa toca una actividad (o una celda vacía) del mismo calendario
// de la clínica y sugiere sin escribir de más: cambiar el recurso, moverlo,
// cambiar el nivel, quitarlo, agregar algo o solo comentar.
export type Objetivo = { tipo: "actividad"; pos: Pos; recurso: Rec; interactivo: boolean; nivel: Nivel | null } | { tipo: "celda"; pos: Pos };
type Accion = "comentar" | "reemplazar" | "mover" | "nivel" | "quitar" | "agregar";

const FRASES = ["Más suave para empezar", "Por seguridad", "Repite mucho la misma área", "Le costó la semana pasada", "Mejor en la mañana"];
const campo = "w-full min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta focus:border-verde-serenidad focus:outline-none";

export function SugerirModal({
  objetivo,
  objeto,
  objetoId,
  tareaId,
  dias,
  paraProxima = false,
  onClose,
  onListo,
}: {
  objetivo: Objetivo;
  objeto: ObjetoRevision;
  objetoId: string;
  tareaId: string | null;
  // Días que se pueden elegir al mover (0 = domingo).
  dias: number[];
  // Semana ya publicada: lo que se sugiere es para la próxima.
  paraProxima?: boolean;
  onClose: () => void;
  onListo: (msg: string) => void;
}) {
  const agregar = useAgregarItem();
  const esAct = objetivo.tipo === "actividad";
  const acciones: { id: Accion; label: string }[] = esAct
    ? [
        { id: "reemplazar", label: "Cambiar recurso" },
        { id: "mover", label: "Mover" },
        ...(objetivo.interactivo ? [{ id: "nivel" as const, label: "Nivel" }] : []),
        { id: "quitar", label: "Quitar" },
        { id: "comentar", label: "Comentar" },
      ]
    : [
        { id: "agregar", label: "Agregar actividad" },
        { id: "comentar", label: "Comentar el día" },
      ];
  const [accion, setAccion] = useState<Accion>(acciones[0].id);
  const [recurso, setRecurso] = useState<MediaResource | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [aDia, setADia] = useState(objetivo.pos.dia);
  const [aHora, setAHora] = useState(objetivo.pos.hora);
  const [nivel, setNivel] = useState<Nivel | null>(esAct ? objetivo.nivel : null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  function cambio(): Cambio | null {
    if (accion === "reemplazar" && esAct && recurso) return { op: "reemplazar", en: objetivo.pos, desde: objetivo.recurso, hacia: recDe(recurso) };
    if (accion === "mover" && esAct) return { op: "mover", en: objetivo.pos, recurso: objetivo.recurso, a: { dia: aDia, hora: aHora } };
    if (accion === "nivel" && esAct && nivel) return { op: "nivel", en: objetivo.pos, recurso: objetivo.recurso, nivel };
    if (accion === "quitar" && esAct) return { op: "quitar", en: objetivo.pos, recurso: objetivo.recurso };
    if (accion === "agregar" && recurso) return { op: "agregar", a: objetivo.pos, hacia: recDe(recurso) };
    return null;
  }

  async function enviar() {
    setError("");
    const c = accion === "comentar" ? null : cambio();
    if (accion !== "comentar" && !c) {
      setError(accion === "reemplazar" || accion === "agregar" ? "Elegí el recurso." : "Completá la sugerencia.");
      return;
    }
    if (accion === "mover" && esAct && aDia === objetivo.pos.dia && aHora === objetivo.pos.hora) {
      setError("Elegí otro día u hora.");
      return;
    }
    if (accion === "comentar" && !texto.trim()) {
      setError("Escribí el comentario.");
      return;
    }
    try {
      await agregar.mutateAsync({
        objeto,
        objetoId,
        tareaId,
        clase: c ? "sugerencia" : "comentario",
        cambio: c ?? undefined,
        texto: texto.trim() || undefined,
        paraProxima,
        ancla: esAct ? { tipo: "actividad", dia: objetivo.pos.dia, hora: objetivo.pos.hora, recurso: objetivo.recurso } : { tipo: "dia", dia: objetivo.pos.dia },
      });
      onListo(c ? "Sugerencia enviada." : "Comentario enviado.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Modal onClose={onClose}>
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-verde-serenidad">{paraProxima ? "Para la próxima semana" : "Sugerir"}</p>
        <h3 className="m-0 mt-0.5 mb-1 pr-10 font-serif font-normal text-[23px] leading-tight text-tinta">{esAct ? objetivo.recurso.titulo : `${textoPos(objetivo.pos)}`}</h3>
        <p className="m-0 mb-4 text-[13.5px] text-tinta-tenue">{esAct ? textoPos(objetivo.pos) : "Celda vacía"} · La coordinación lo acepta o lo descarta.</p>

        <div role="tablist" className="flex flex-wrap gap-1.5 mb-4">
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={accion === a.id}
              onClick={() => setAccion(a.id)}
              className={`min-h-9 px-3.5 rounded-full text-[13.5px] font-semibold cursor-pointer font-sans border-[1.5px] ${accion === a.id ? "bg-tinta text-white border-tinta" : "bg-white text-tinta-suave border-borde hover:border-verde-serenidad"}`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {(accion === "reemplazar" || accion === "agregar") && (
            <button
              type="button"
              onClick={() => setEligiendo(true)}
              className="text-left rounded-2xl border-[1.5px] border-dashed border-borde-campo bg-campo px-4 py-3 cursor-pointer font-sans hover:border-verde-serenidad"
            >
              {recurso ? (
                <>
                  <span className="block text-[12px] font-semibold text-tinta-tenue">{accion === "reemplazar" ? "En su lugar" : "Agregar"}</span>
                  <span className="block text-[15px] font-semibold text-tinta">
                    {recurso.codigo ? `${recurso.codigo} · ` : ""}
                    {recurso.titulo}
                  </span>
                  <span className="block text-[12.5px] text-verde-profundo font-semibold">Cambiar</span>
                </>
              ) : (
                <span className="text-[14.5px] font-semibold text-verde-profundo">Elegir el recurso de la biblioteca</span>
              )}
            </button>
          )}
          {accion === "mover" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[13px] font-semibold text-tinta-suave">
                Día
                <select value={aDia} onChange={(e) => setADia(Number(e.target.value))} className={campo}>
                  {dias.map((d) => (
                    <option key={d} value={d}>
                      {DIAS[d]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-tinta-suave">
                Hora
                <select value={aHora} onChange={(e) => setAHora(e.target.value)} className={campo}>
                  <option value="">Sin hora fija</option>
                  {HORAS.map((h) => {
                    const v = `${String(h).padStart(2, "0")}:00`;
                    return (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          )}
          {accion === "nivel" && (
            <div className="flex flex-wrap gap-1.5">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={`min-h-9 px-3.5 rounded-full text-[13.5px] font-semibold cursor-pointer font-sans border-[1.5px] ${nivel === n ? "bg-verde-profundo text-white border-verde-profundo" : "bg-white text-tinta border-borde"}`}
                >
                  {nivelLabel[n]}
                </button>
              ))}
            </div>
          )}
          <label className="grid gap-1 text-[13px] font-semibold text-tinta-suave">
            {accion === "comentar" ? "Comentario" : "Por qué (opcional)"}
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className={`${campo} py-2 resize-y`} />
          </label>
          {accion !== "comentar" && (
            <div className="flex flex-wrap gap-1.5">
              {FRASES.map((f) => (
                <button key={f} type="button" onClick={() => setTexto((t) => (t ? `${t} ${f}.` : `${f}.`))} className="min-h-8 px-3 rounded-full border border-borde bg-campo text-[12.5px] text-tinta-suave cursor-pointer font-sans hover:border-verde-serenidad">
                  {f}
                </button>
              ))}
            </div>
          )}
          {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enviar}
              disabled={agregar.isPending}
              className="inline-flex items-center min-h-11 px-5 rounded-full border-0 bg-verde-profundo text-white text-[14.5px] font-semibold cursor-pointer hover:bg-tinta disabled:opacity-60 font-sans"
            >
              {agregar.isPending ? "Enviando…" : accion === "comentar" ? "Comentar" : "Enviar sugerencia"}
            </button>
            <button type="button" onClick={onClose} className="inline-flex items-center min-h-11 px-5 rounded-full border-[1.5px] border-borde bg-white text-tinta text-[14.5px] font-semibold cursor-pointer font-sans">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
      {eligiendo && (
        <SelectorRecurso
          titulo={accion === "agregar" ? `Agregar ${textoPos(objetivo.pos)}` : "Elegí el recurso que sugerís"}
          onElegir={(r) => {
            setRecurso(r);
            setEligiendo(false);
          }}
          onClose={() => setEligiendo(false)}
        />
      )}
    </>
  );
}
