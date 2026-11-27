import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { DIAS, rangoSemana, weekDays } from "../../lib/planWeek";
import { esInteractivo } from "../../lib/clasificarNumeros";
import { nivelCognitivoLabel, type ResourceExtras } from "../../lib/mediaResources";
import { RESULTADO_TAREA, TIPO_TAREA, sobreQue, useResponderTarea, type TareaEquipo } from "../../lib/tareasEquipo";
import { hora5, useEstadoRevision, useItemsRevision, type Eje, type ObjetoRevision } from "../../lib/revisiones";
import type { Nivel } from "../../lib/actividades/contrato";
import type { DraftTask } from "../profesional/paciente/TaskEditorModal";
import { ResumenSeguimiento, type ResumenDatos } from "../resumen/ResumenSeguimiento";
import { CalendarioRevision, type ActividadCal } from "./CalendarioRevision";
import { PanelRevision } from "./PanelRevision";
import { SugerirModal, type Objetivo } from "./SugerirModal";
import { ValoracionCard } from "./ValoracionCard";
import { EstadoRevisionChip } from "./EstadoRevision";

// Una revisión abierta en modo revisión: el mismo calendario que usó la
// clínica (plantilla, borrador o semana publicada) o la valoración del
// paciente, con el perfil al costado. Quien revisa toca una actividad para
// sugerir o comentar, y al terminar aprueba o envía sus sugerencias; después
// pasa sola a la siguiente.
interface Contexto {
  resumen: ResumenDatos | null;
  perfil: { nombre: string; edad: string | null; etapas: string[]; etapaOverride: string | null; ruta: string | null; supervision: string | null; nutricion: Record<string, unknown> | null } | null;
  semana: {
    inicio: string;
    mensaje: string | null;
    tareas: { id: string; dia: string; hora: string | null; titulo: string; estado: string; modulo: string | null; codigo: string | null; media_resource_id: string | null; nivel_interactivo: Nivel | null; indicacion: string | null; comentario: string | null }[];
  } | null;
  borrador: { tareas: DraftTask[]; plantilla: string | null; actualizado: string } | null;
  plantilla: {
    nombre: string;
    descripcion: string | null;
    perfil_objetivo: string | null;
    tareas: { dia_idx: number; hora: string | null; titulo: string; modulo: string; codigo: string | null; media_resource_id: string; nivel_interactivo: Nivel | null; extras: ResourceExtras | null }[];
  } | null;
}

const SUPERVISION: Record<string, string> = {
  autonomia_comprobada: "Autonomía comprobada",
  guia_verbal: "Guía verbal",
  acompanamiento_presencial_continuo: "Acompañamiento presencial continuo",
  ayuda_fisica_entrenada: "Ayuda física entrenada",
};
const RUTA: Record<string, string> = { verde: "Ruta verde", amarillo: "Ruta amarilla", rojo: "Ruta roja" };
const NUTRI: Record<string, string> = { disfagia: "Disfagia", diabetes: "Diabetes", renal: "Enfermedad renal", celiaquia: "Celiaquía", anticoagulantes: "Anticoagulantes", desnutricion: "Desnutrición", gota: "Gota", restriccion_liquidos: "Restricción de líquidos" };

function objetoDe(t: TareaEquipo): { objeto: ObjetoRevision; id: string } | null {
  if (t.tipo === "revisar_plantilla" && t.plantilla_id) return { objeto: "plantilla", id: t.plantilla_id };
  if ((t.tipo === "revisar_borrador" || t.tipo === "armar_semana") && t.patient_id) return { objeto: "borrador", id: t.patient_id };
  if (t.tipo === "revisar_semana" && t.plan_id) return { objeto: "plan", id: t.plan_id };
  if ((t.tipo === "valorar_paciente" || t.tipo === "revisar_paciente") && t.patient_id) return { objeto: "valoracion", id: t.patient_id };
  return null;
}

export function RevisionTarea({ t, onTerminada }: { t: TareaEquipo; onTerminada?: () => void }) {
  const responder = useResponderTarea();
  const [nota, setNota] = useState("");
  const [verNota, setVerNota] = useState(false);
  const [aviso, setAviso] = useState<{ text: string; error?: boolean } | null>(null);
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const obj = objetoDe(t);
  const { data: items } = useItemsRevision(obj?.objeto ?? "plantilla", obj?.objeto === "valoracion" ? null : (obj?.id ?? null));
  const { data: estado } = useEstadoRevision(obj?.objeto ?? "plantilla", obj?.id ?? null, (t.eje as Eje) ?? undefined);
  const { data: ctx, isLoading } = useQuery({
    queryKey: ["tarea-contexto", t.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tarea_contexto", { p_id: t.id });
      if (error) throw error;
      return data as Contexto;
    },
  });
  const abierta = t.estado === "pendiente" || t.estado === "en_curso";
  const misAportes = t.aportes;

  function terminar(resultado: "aprobado" | "con_cambios" | "comentario") {
    responder.mutate(
      { id: t.id, estado: "resuelta", resultado, respuesta: nota.trim() || undefined },
      {
        onSuccess: () => {
          setAviso({ text: resultado === "aprobado" ? "Aprobada. Gracias." : "Enviado a la coordinación." });
          onTerminada?.();
        },
        onError: (e) => setAviso({ text: (e as Error).message, error: true }),
      },
    );
  }

  // Actividades del calendario según lo que se revisa.
  let actividades: ActividadCal[] = [];
  let columnas = DIAS.map((d, i) => ({ dia: i, titulo: d }));
  if (ctx?.plantilla) {
    actividades = ctx.plantilla.tareas.map((x, i) => ({
      key: `p${i}`,
      dia: x.dia_idx,
      hora: hora5(x.hora),
      titulo: x.titulo,
      codigo: x.codigo,
      modulo: x.modulo,
      recursoId: x.media_resource_id,
      interactivo: esInteractivo(x.extras),
      nivel: x.nivel_interactivo,
    }));
  } else if (ctx?.borrador || t.tipo === "revisar_borrador" || t.tipo === "armar_semana") {
    actividades = (ctx?.borrador?.tareas ?? []).map((d) => ({
      key: d.key,
      dia: DIAS.indexOf(d.dia),
      hora: hora5(d.hora),
      titulo: d.titulo,
      modulo: d.modulo,
      recursoId: d.mediaResourceId,
      interactivo: !!d.nivelInteractivo,
      nivel: d.nivelInteractivo ?? null,
    }));
  } else if (ctx?.semana) {
    actividades = ctx.semana.tareas.map((x) => ({
      key: x.id,
      dia: DIAS.indexOf(x.dia),
      hora: hora5(x.hora),
      titulo: x.titulo,
      codigo: x.codigo,
      modulo: x.modulo,
      recursoId: x.media_resource_id,
      interactivo: !!x.nivel_interactivo,
      nivel: x.nivel_interactivo,
      estado: x.estado,
      comentario: x.comentario,
    }));
    columnas = weekDays(new Date(ctx.semana.inicio)).map((d) => ({ dia: d.date.getDay(), titulo: d.dia, detalle: d.date.toLocaleDateString("es-CR", { day: "numeric", month: "short" }) }));
  }
  const conCalendario = obj && obj.objeto !== "valoracion";
  const paraProxima = obj?.objeto === "plan";

  return (
    <div className="grid gap-5 min-w-0">
      <header className="relative overflow-hidden rounded-[24px] bg-verde-profundo text-white px-5 sm:px-7 py-5">
        <div aria-hidden="true" className="absolute -right-14 -top-20 w-48 h-48 rounded-full bg-verde-serenidad/45" />
        <div className="relative grid gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#cfe2e2]">{TIPO_TAREA[t.tipo]}</p>
              <h2 className="m-0 mt-1 font-serif font-normal text-[26px] leading-tight">{t.titulo}</h2>
              <p className="m-0 mt-1 text-[14px] text-[#e1ecec]">
                {[sobreQue(t), t.creada_por_nombre ? `Pedida por ${t.creada_por_nombre}` : null, t.vence ? `Para el ${new Date(`${t.vence}T12:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {obj && <EstadoRevisionChip estado={estado} />}
          </div>
          {abierta ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => terminar("aprobado")}
                disabled={responder.isPending}
                className="inline-flex items-center min-h-10 px-4.5 rounded-full border-0 bg-white text-verde-profundo text-[14px] font-bold cursor-pointer font-sans disabled:opacity-60"
              >
                ✓ Aprobar
              </button>
              <button
                type="button"
                onClick={() => terminar(misAportes > 0 ? "con_cambios" : "comentario")}
                disabled={responder.isPending || (misAportes === 0 && !nota.trim())}
                title={misAportes === 0 && !nota.trim() ? "Dejá al menos una sugerencia o una nota" : undefined}
                className="inline-flex items-center min-h-10 px-4.5 rounded-full border-[1.5px] border-white/60 bg-transparent text-white text-[14px] font-semibold cursor-pointer font-sans disabled:opacity-50"
              >
                Terminé: enviar {misAportes > 0 ? `${misAportes} ${misAportes === 1 ? "aporte" : "aportes"}` : "nota"}
              </button>
              <button type="button" onClick={() => setVerNota((v) => !v)} className="inline-flex items-center min-h-10 px-3 rounded-full border-0 bg-transparent text-[#e1ecec] text-[13.5px] font-semibold underline decoration-dotted cursor-pointer font-sans">
                {verNota ? "Sin nota" : "Agregar una nota"}
              </button>
            </div>
          ) : (
            <p className="m-0 text-[14px] text-[#e1ecec]">
              <strong className="text-white">{t.estado === "cancelada" ? "Cancelada" : t.resultado ? RESULTADO_TAREA[t.resultado] : "Resuelta"}</strong>
              {t.respuesta ? ` · ${t.respuesta}` : ""}
            </p>
          )}
          {verNota && abierta && (
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Una nota para la coordinación (opcional)"
              className="w-full rounded-xl border-0 bg-white/95 px-3 py-2 font-sans text-[14px] text-tinta resize-y"
            />
          )}
        </div>
      </header>

      {aviso && <p className={`m-0 rounded-2xl px-4 py-2.5 text-[14px] ${aviso.error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}>{aviso.text}</p>}
      {t.detalle && (
        <p className="m-0 rounded-2xl bg-mostaza-vital/30 px-4 py-3 text-[15px] leading-relaxed text-tinta">
          <strong className="font-semibold">Lo que te piden:</strong> {t.detalle}
        </p>
      )}
      {isLoading && <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>}

      {conCalendario && obj && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="grid gap-3 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="m-0 font-serif font-normal text-[22px] text-tinta">
                {ctx?.plantilla ? `Plantilla «${ctx.plantilla.nombre}»` : ctx?.semana ? `Semana del ${rangoSemana(ctx.semana.inicio)}` : "Semana en preparación"}
              </h3>
              <p className="m-0 text-[13px] text-tinta-tenue">
                {paraProxima ? "Ya publicada: lo que sugieras queda para la próxima semana." : abierta ? "Tocá una actividad o una celda para sugerir." : ""}
              </p>
            </div>
            {ctx?.plantilla?.perfil_objetivo && <p className="m-0 text-[14px] text-tinta-suave">Para: {ctx.plantilla.perfil_objetivo}</p>}
            {(t.tipo === "revisar_borrador" || t.tipo === "armar_semana") && !ctx?.borrador && (
              <p className="m-0 rounded-2xl bg-campo px-4 py-3 text-[14px] text-tinta-suave">
                {t.tipo === "armar_semana" ? "La semana está vacía: tocá las celdas para proponer las actividades." : "La clínica todavía no guardó el borrador de esta semana."}
              </p>
            )}
            <div className="rounded-[22px] border border-borde bg-white overflow-hidden">
              <CalendarioRevision
                columnas={columnas}
                actividades={actividades}
                items={items}
                onActividad={
                  abierta
                    ? (a) => setObjetivo({ tipo: "actividad", pos: { dia: a.dia, hora: a.hora }, recurso: { id: a.recursoId, titulo: a.titulo, codigo: a.codigo, modulo: a.modulo }, interactivo: a.interactivo, nivel: a.nivel })
                    : undefined
                }
                onCelda={abierta ? (p) => setObjetivo({ tipo: "celda", pos: p }) : undefined}
              />
            </div>
          </div>
          <div className="grid gap-4 xl:sticky xl:top-4">
            {ctx?.perfil && <PerfilAlCostado p={ctx.perfil} />}
            <div className="rounded-[22px] border border-borde bg-white p-4">
              <PanelRevision objeto={obj.objeto} objetoId={obj.id} modo="revisor" tareaId={t.id} sinComentar={!abierta} />
            </div>
          </div>
        </div>
      )}

      {obj?.objeto === "valoracion" && t.patient_id && (
        <ValoracionCard patientId={t.patient_id} patientNombre={t.paciente ?? ""} modo="revisor" tareaId={t.id} ejeTarea={(t.eje as Eje) ?? null} onAviso={(text, error) => setAviso({ text, error })} />
      )}

      {ctx?.resumen && (
        <details className="rounded-[22px] border border-borde bg-white px-4 py-3" open={obj?.objeto === "valoracion"}>
          <summary className="cursor-pointer font-serif text-[20px] text-tinta">Seguimiento en casa</summary>
          <div className="mt-3">
            <ResumenSeguimiento datos={ctx.resumen} />
          </div>
        </details>
      )}

      {objetivo && obj && (
        <SugerirModal
          objetivo={objetivo}
          objeto={obj.objeto}
          objetoId={obj.id}
          tareaId={t.id}
          dias={columnas.map((c) => c.dia)}
          paraProxima={paraProxima}
          onClose={() => setObjetivo(null)}
          onListo={(m) => {
            setObjetivo(null);
            setAviso({ text: m });
          }}
        />
      )}
    </div>
  );
}

function PerfilAlCostado({ p }: { p: NonNullable<Contexto["perfil"]> }) {
  const etapas = p.etapaOverride ? [p.etapaOverride] : p.etapas;
  const flags = Object.entries(p.nutricion ?? {})
    .filter(([k, v]) => v === true && NUTRI[k])
    .map(([k]) => NUTRI[k]);
  const alergias = Object.entries(((p.nutricion ?? {}) as { alergias?: Record<string, boolean> }).alergias ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k.replace("_", " "));
  return (
    <div className="rounded-[22px] bg-beige-serenidad/55 px-4 py-4 grid gap-2 text-[13.5px]">
      <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-verde-profundo">Perfil</p>
      <p className="m-0 font-serif text-[19px] text-tinta">
        {p.nombre}
        {p.edad ? `, ${p.edad} años` : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {etapas.map((e) => (
          <span key={e} className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-tinta">
            {nivelCognitivoLabel[e as keyof typeof nivelCognitivoLabel] ?? e}
          </span>
        ))}
        {p.ruta && <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-tinta">{RUTA[p.ruta] ?? p.ruta}</span>}
        {p.supervision && <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-tinta">{SUPERVISION[p.supervision] ?? p.supervision}</span>}
      </div>
      {(flags.length > 0 || alergias.length > 0) && (
        <p className="m-0 text-tinta-suave">
          {[...flags, ...alergias.map((a) => `Alergia: ${a}`)].join(" · ")}
        </p>
      )}
    </div>
  );
}
