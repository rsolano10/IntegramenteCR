import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { usePatients } from "../../../lib/patients";
import { rangoSemana } from "../../../lib/planWeek";
import { ROL_ETIQUETA } from "../../../lib/areasSalud";
import { TIPO_TAREA, useEquipoClinico, type TipoTarea } from "../../../lib/tareasEquipo";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";

// «Pedir revisión al equipo»: la coordinación le asigna una tarea a alguien
// del equipo clínico. Desde un paciente, una semana o una plantilla, llega
// con eso ya elegido.
export interface ContextoTarea {
  tipo?: TipoTarea;
  patientId?: string | null;
  patientNombre?: string;
  planId?: string | null;
  plantillaId?: string | null;
  plantillaNombre?: string;
}

const tituloSugerido = (tipo: TipoTarea, c: ContextoTarea) => {
  const quien = c.patientNombre?.split(" ")[0];
  if (tipo === "revisar_paciente") return quien ? `Revisar el caso de ${quien}` : "Revisar un caso";
  if (tipo === "revisar_semana") return quien ? `Revisar la semana de ${quien}` : "Revisar una semana";
  if (tipo === "armar_semana") return quien ? `Proponer la próxima semana de ${quien}` : "Proponer una semana";
  if (tipo === "revisar_plantilla") return c.plantillaNombre ? `Revisar la plantilla «${c.plantillaNombre}»` : "Revisar una plantilla";
  return "Consulta al equipo";
};

const campo = "w-full min-h-11 px-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none";

export function NuevaTareaModal({ contexto = {}, onClose, onCreada }: { contexto?: ContextoTarea; onClose: () => void; onCreada: (msg: string) => void }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoTarea>(contexto.tipo ?? (contexto.plantillaId ? "revisar_plantilla" : contexto.planId ? "revisar_semana" : "revisar_paciente"));
  const [titulo, setTitulo] = useState(() => tituloSugerido(contexto.tipo ?? (contexto.plantillaId ? "revisar_plantilla" : contexto.planId ? "revisar_semana" : "revisar_paciente"), contexto));
  const [tituloEditado, setTituloEditado] = useState(false);
  const [asignada, setAsignada] = useState("");
  const [patientId, setPatientId] = useState(contexto.patientId ?? "");
  const [planId, setPlanId] = useState(contexto.planId ?? "");
  const [plantillaId, setPlantillaId] = useState(contexto.plantillaId ?? "");
  const [vence, setVence] = useState("");
  const [detalle, setDetalle] = useState("");
  const { data: equipo } = useEquipoClinico();
  const { data: patients } = usePatients();
  const conPaciente = tipo !== "revisar_plantilla" && tipo !== "otra";
  const { data: planes } = useQuery({
    queryKey: ["planes-paciente", patientId],
    enabled: !!patientId && (tipo === "revisar_semana"),
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, publish_at, status").eq("patient_id", patientId).order("publish_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: plantillas } = useQuery({
    queryKey: ["plantillas-lista-min"],
    enabled: tipo === "revisar_plantilla",
    queryFn: async () => {
      const { data, error } = await supabase.from("plantillas_semana").select("id, nombre").eq("archivada", false).order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });
  const nombrePaciente = (patients ?? []).find((p) => p.id === patientId)?.nombre ?? contexto.patientNombre;

  const elegirTipo = (t: TipoTarea) => {
    setTipo(t);
    if (!tituloEditado) setTitulo(tituloSugerido(t, { ...contexto, patientNombre: nombrePaciente }));
  };

  const crear = useMutation({
    mutationFn: async () => {
      if (!asignada) throw new Error("Elegí a quién se lo pedís.");
      if (!titulo.trim()) throw new Error("Poné un título.");
      if (conPaciente && !patientId) throw new Error("Elegí el paciente.");
      if (tipo === "revisar_semana" && !planId) throw new Error("Elegí la semana.");
      if (tipo === "revisar_plantilla" && !plantillaId) throw new Error("Elegí la plantilla.");
      const { error } = await supabase.rpc("crear_tarea_equipo", {
        p_tipo: tipo,
        p_titulo: titulo.trim(),
        p_detalle: detalle.trim() || null,
        p_asignada_a: asignada,
        p_patient: conPaciente ? patientId : null,
        p_plan: tipo === "revisar_semana" ? planId : null,
        p_plantilla: tipo === "revisar_plantilla" ? plantillaId : null,
        p_vence: vence || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tareas-equipo"] });
      qc.invalidateQueries({ queryKey: ["equipo-clinico"] });
      const quien = equipo?.find((m) => m.profile_id === asignada)?.nombre.split(" ")[0];
      onCreada(`Le pediste la revisión a ${quien ?? "el equipo"}.`);
    },
  });

  return (
    <Modal onClose={onClose} size="lg">
      <h3 className="m-0 mb-1 pr-10 font-serif font-normal text-[24px] text-tinta">Pedir revisión al equipo</h3>
      <p className="m-0 mb-5 text-[14.5px] text-tinta-suave">Le llega a su perfil de equipo clínico. Cuando responda, lo ves en Tareas del equipo.</p>
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Qué necesitás
          <select value={tipo} onChange={(e) => elegirTipo(e.target.value as TipoTarea)} className={campo}>
            {(Object.keys(TIPO_TAREA) as TipoTarea[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_TAREA[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          A quién
          <select value={asignada} onChange={(e) => setAsignada(e.target.value)} className={campo}>
            <option value="">Elegí a alguien del equipo…</option>
            {(equipo ?? []).map((m) => (
              <option key={m.profile_id} value={m.profile_id}>
                {m.nombre} · {m.especialidad ?? ROL_ETIQUETA[m.rol]}
                {m.pendientes ? ` · ${m.pendientes} pendiente${m.pendientes === 1 ? "" : "s"}` : ""}
              </option>
            ))}
          </select>
        </label>
        {conPaciente && !contexto.patientId && (
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Paciente
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={campo}>
              <option value="">Elegí un paciente…</option>
              {(patients ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {tipo === "revisar_semana" && !contexto.planId && (
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Semana
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={campo} disabled={!patientId}>
              <option value="">{patientId ? "Elegí la semana…" : "Primero elegí el paciente"}</option>
              {(planes ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {rangoSemana(p.publish_at)}
                  {p.status !== "published" ? " (borrador)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        {tipo === "revisar_plantilla" && !contexto.plantillaId && (
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Plantilla
            <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)} className={campo}>
              <option value="">Elegí la plantilla…</option>
              {(plantillas ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Título
          <input
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              setTituloEditado(true);
            }}
            className={campo}
          />
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Qué querés que mire (opcional)
          <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={3} placeholder="Por ejemplo: ¿la dosis de gerontogimnasia es adecuada para su ruta?" className={`${campo} py-2.5 resize-y`} />
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta sm:max-w-[240px]">
          Para cuándo (opcional)
          <input type="date" value={vence} onChange={(e) => setVence(e.target.value)} className={campo} />
        </label>
        {crear.isError && <p className="m-0 text-[14px] text-alerta-texto">{(crear.error as Error).message}</p>}
        <Button variant="principal" onClick={() => crear.mutate()} disabled={crear.isPending}>
          {crear.isPending ? "Enviando…" : "Pedir revisión"}
        </Button>
      </div>
    </Modal>
  );
}
