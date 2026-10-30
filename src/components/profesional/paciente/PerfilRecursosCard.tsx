import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { usePerfilRecursos } from "../../../lib/usePerfilRecursos";
import { nivelCognitivoLabel, type NivelCognitivo } from "../../../lib/mediaResources";
import type { Alergeno, NutricionFlags, Supervision } from "../../../lib/reglasRecursos";
import { rutasDescripcion, rutasIntro, supervisionLabel, supervisionYCognicion } from "../../../lib/bloquesGerontogimnasia";
import { Button } from "../../ui/Button";

const ETAPAS: NivelCognitivo[] = ["preventivo", "dcl", "leve", "moderada", "avanzada"];
const ALERGENOS: { key: Alergeno; label: string }[] = [
  { key: "pescado", label: "Pescado" },
  { key: "frutos_secos", label: "Frutos secos" },
  { key: "huevo", label: "Huevo" },
  { key: "leche", label: "Leche (proteína)" },
];
const FLAGS: { key: Exclude<keyof NutricionFlags, "alergias" | "textura_prescrita">; label: string }[] = [
  { key: "disfagia", label: "Disfagia" },
  { key: "restriccion_liquidos", label: "Restricción de líquidos" },
  { key: "potasio", label: "Restricción de potasio" },
  { key: "sodio", label: "Restricción de sodio" },
  { key: "renal", label: "Renal (fósforo/proteína)" },
  { key: "diabetes", label: "Diabetes" },
  { key: "anticoagulantes", label: "Warfarina / anticoagulantes" },
  { key: "celiaquia", label: "Celiaquía" },
  { key: "desnutricion", label: "Riesgo de desnutrición o bajo peso" },
  { key: "gota", label: "Gota" },
];

const selectCls = "w-full min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta";

// Perfil para asignar recursos (business/integramente-recursos-spec.md §1.1):
// etapa cognitiva, ruta física y supervisión, por separado, y los flags de
// nutrición. Un flag sin marcar significa "sin dato", no "sin restricción".
export function PerfilRecursosCard({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const { data: perfil, isLoading } = usePerfilRecursos(patientId);
  const [etapa, setEtapa] = useState("");
  const [ruta, setRuta] = useState("");
  const [supervision, setSupervision] = useState("");
  const [nut, setNut] = useState<NutricionFlags>({});
  const [estado, setEstado] = useState<{ texto: string; error?: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setEtapa(perfil.etapaOverride ?? "");
    setRuta(perfil.rutaOverride ?? "");
    setSupervision(perfil.supervision ?? "");
    setNut(perfil.nutricion ?? {});
  }, [perfil]);

  async function guardar() {
    setEstado(null);
    setGuardando(true);
    const { error } = await supabase.rpc("actualizar_perfil_recursos", {
      p_patient_id: patientId,
      p_etapa_override: etapa,
      p_ruta_override: ruta,
      p_supervision: supervision,
      p_nutricion: nut,
    });
    setGuardando(false);
    if (error) {
      setEstado({ texto: "No pudimos guardar el perfil. Probá de nuevo.", error: true });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["perfil-recursos", patientId] });
    setEstado({ texto: "Perfil guardado." });
  }

  if (isLoading || !perfil) return null;
  const derivadas = perfil.etapas.map((e) => nivelCognitivoLabel[e]).join(" o ");

  return (
    <details className="mb-5 rounded-3xl border border-borde bg-white px-5 py-4">
      <summary className="cursor-pointer text-[15.5px] font-semibold text-tinta">
        Perfil para recursos
        <span className="ml-2 font-normal text-[13.5px] text-tinta-tenue">
          {derivadas} · ruta {perfil.ruta ?? "sin dato"} · {supervision ? supervisionLabel[supervision as Supervision] : "supervisión sin dato"}
        </span>
      </summary>
      <div className="grid gap-5 mt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
            Etapa cognitiva
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={selectCls}>
              <option value="">Según el cuestionario ({derivadas})</option>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {nivelCognitivoLabel[e]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
            Ruta física
            <select value={ruta} onChange={(e) => setRuta(e.target.value)} className={selectCls}>
              <option value="">Según el perfil físico</option>
              <option value="verde">Verde</option>
              <option value="amarillo">Amarillo</option>
              <option value="rojo">Rojo</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
            Supervisión
            <select value={supervision} onChange={(e) => setSupervision(e.target.value)} className={selectCls}>
              <option value="">Sin dato</option>
              {(Object.keys(supervisionLabel) as Supervision[]).map((s) => (
                <option key={s} value={s}>
                  {supervisionLabel[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-1.5 text-[13.5px] leading-relaxed text-tinta-suave">
          <p className="m-0">
            <strong className="text-tinta">Ruta física actual: {perfil.ruta ?? "sin dato (se asume amarillo)"}.</strong> {rutasIntro}
          </p>
          <ul className="m-0 pl-5 grid gap-1">
            {(Object.keys(rutasDescripcion) as (keyof typeof rutasDescripcion)[]).map((r) => (
              <li key={r}>
                <strong className="text-tinta capitalize">{r}:</strong> {rutasDescripcion[r]}
              </li>
            ))}
          </ul>
          <p className="m-0">{supervisionYCognicion}</p>
        </div>

        <fieldset className="m-0 p-0 border-0 grid gap-2.5">
          <legend className="text-[13px] font-semibold text-tinta-suave mb-1">Nutrición (marcá solo lo que está confirmado)</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {ALERGENOS.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer">
                <input
                  type="checkbox"
                  checked={nut.alergias?.[a.key] === true}
                  onChange={(e) => setNut((n) => ({ ...n, alergias: { ...n.alergias, [a.key]: e.target.checked || undefined } }))}
                />
                Alergia: {a.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {FLAGS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer">
                <input type="checkbox" checked={nut[f.key] === true} onChange={(e) => setNut((n) => ({ ...n, [f.key]: e.target.checked || undefined }))} />
                {f.label}
              </label>
            ))}
          </div>
          {nut.disfagia && (
            <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave max-w-[420px]">
              Textura prescrita
              <input
                type="text"
                value={nut.textura_prescrita ?? ""}
                onChange={(e) => setNut((n) => ({ ...n, textura_prescrita: e.target.value || undefined }))}
                placeholder="Ej.: picada fina, puré"
                className={selectCls}
              />
            </label>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button dense onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar perfil"}
          </Button>
          {estado && <span className={`text-[13.5px] ${estado.error ? "text-alerta-texto" : "text-tinta-tenue"}`}>{estado.texto}</span>}
        </div>
      </div>
    </details>
  );
}
