import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { aplicarCambios, tareasParaIA, useCatalogo, usePlantillas, type CambioVisible } from "../../../lib/plantillas";
import { usePerfilRecursos } from "../../../lib/usePerfilRecursos";
import { computeProfiles } from "../../../lib/clinicalEngine";
import { computeActiveAlerts } from "../../../lib/alertsEngine";
import { questions, type Answers, type Option } from "../../../lib/onboardingSchema";
import type { CambioIA } from "../../../../supabase/functions/_shared/validarCambiosIA.ts";
import type { DraftTask } from "./TaskEditorModal";
import { Button } from "../../ui/Button";

export interface CargaPlantilla {
  drafts: DraftTask[];
  cambios: CambioVisible[];
  aviso: string | null;
  plantillaId: string;
  iaId: string | null;
}

function intereses(a: Answers | null): string[] {
  const q = questions.find((x) => x.id === "intereses_actuales");
  const opts = (Array.isArray(q?.options) ? q.options : []) as Option[];
  const v = Array.isArray(a?.intereses_actuales) ? a!.intereses_actuales : [];
  return v.map((x) => opts.find((o) => o.value === x)?.label ?? x);
}

// "Partir de una plantilla" en el planificador (Fases 4.4 y 4.5). Sin IA
// copia la plantilla tal cual; con IA pide ajustes leves a
// personalizar-semana, que solo puede elegir entre los candidatos
// calculados acá con las reglas de seguridad del paciente.
export function DesdePlantilla({ patientId, days, onCargar }: { patientId: string; days: { dia: string }[]; onCargar: (c: CargaPlantilla) => void }) {
  const { data: plantillas } = usePlantillas();
  const { data: catalogo } = useCatalogo();
  const { data: perfil } = usePerfilRecursos(patientId);
  const { data: answers } = useQuery({
    queryKey: ["onboarding-answers", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", patientId).maybeSingle();
      if (error) throw error;
      return (data?.answers ?? null) as Answers | null;
    },
  });
  const { data: cfg } = useQuery({
    queryKey: ["config-clinica"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_clinica").select("dias_demo, dias_inactividad, max_cambios_ia_pct").eq("id", 1).single();
      if (error) throw error;
      return data as { dias_demo: number; dias_inactividad: number; max_cambios_ia_pct: number };
    },
  });
  const [plantillaId, setPlantillaId] = useState("");
  const [conIA, setConIA] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const activas = (plantillas ?? []).filter((p) => !p.archivada && p.tareas.length > 0);
  const plantilla = activas.find((p) => p.id === plantillaId) ?? null;

  async function cargar() {
    if (!plantilla || !catalogo) return;
    setError("");
    setCargando(true);
    let cambios: CambioIA[] = [];
    let aviso: string | null = null;
    let iaId: string | null = null;
    const tareas = tareasParaIA(plantilla, catalogo, perfil ?? null);
    if (conIA) {
      const { data, error: e } = await supabase.functions.invoke<{ estado: string; cambios: CambioIA[]; aviso: string | null; ia_id: string | null }>("personalizar-semana", {
        body: {
          patientId,
          plantillaId: plantilla.id,
          paciente: {
            intereses: intereses(answers ?? null),
            etapas: perfil?.etapas ?? [],
            ruta: perfil?.ruta ?? null,
            supervision: perfil?.supervision ?? null,
            niveles: answers ? computeProfiles(answers) : {},
            restricciones: answers ? computeActiveAlerts(answers).map((a) => a.etiqueta) : [],
          },
          tareas,
        },
      });
      if (e || !data) aviso = "La IA no respondió. La semana quedó igual a la plantilla.";
      else {
        cambios = data.cambios ?? [];
        aviso = data.aviso;
        iaId = data.ia_id;
      }
    }
    const { drafts, visibles, fueraDeSemana } = aplicarCambios(plantilla, cambios, catalogo, days);
    const noPermitidas = tareas.filter((t) => !t.permitido && !cambios.some((c) => c.tarea_id === t.id));
    const extras = [
      fueraDeSemana.length ? `No entraron en esta semana (tiene ${days.length} días): ${fueraDeSemana.join(", ")}.` : "",
      noPermitidas.length ? `Revisá: ${noPermitidas.map((t) => `«${t.titulo}» (${t.motivo})`).join(", ")}.` : "",
    ].filter(Boolean);
    setCargando(false);
    onCargar({ drafts, cambios: visibles, aviso: [aviso, ...extras].filter(Boolean).join(" ") || null, plantillaId: plantilla.id, iaId });
  }

  if ((plantillas ?? []).length === 0) return null;
  return (
    <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="grid gap-2">
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Partir de una plantilla
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className="min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta"
          >
            <option value="">Elegí una plantilla…</option>
            {activas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.perfil_objetivo ? ` · ${p.perfil_objetivo}` : ""} ({p.tareas.length})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-start gap-2 text-[13.5px] text-tinta-suave cursor-pointer">
          <input type="checkbox" checked={conIA} onChange={(e) => setConIA(e.target.checked)} className="mt-0.5" />
          <span>
            Ajustar a esta persona con IA: cambia como máximo el {cfg?.max_cambios_ia_pct ?? 30}% de la semana, solo con recursos del catálogo de la misma área y
            permitidos para su perfil. Queda en borrador para que lo revises.
          </span>
        </label>
        {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
      </div>
      <Button dense onClick={cargar} disabled={!plantilla || !catalogo || cargando}>
        {cargando ? (conIA ? "Personalizando…" : "Cargando…") : "Cargar en el borrador"}
      </Button>
    </section>
  );
}
