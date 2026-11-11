import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { detalleCuenta, estadoInfo, validacionesCuenta, type FilaCuenta } from "../../lib/cuentas";
import type { EstadoCuenta } from "../../lib/useMyPatient";
import type { Answers } from "../../lib/onboardingSchema";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

// Seguimiento de cuentas dentro de Usuarios: el estado de la cuenta en cada
// tarjeta de paciente, con la acción que corresponde (aprobar, marcar
// pagada) y el resto en el menú ⋯. Los estados se calculan en la base
// (estado_cuenta_calculado); acá solo se muestran y se disparan las
// acciones manuales.

export function EstadoChip({ estado }: { estado: EstadoCuenta | null }) {
  if (!estado) return null;
  const e = estadoInfo[estado];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap ${e.clase}`}>{e.label}</span>;
}

// Franja de la tarjeta: estado, detalle y la acción principal.
export function CuentaLinea({
  fila,
  answers,
  ocupado,
  onAprobar,
  onPagar,
}: {
  fila: FilaCuenta;
  answers: Answers | null;
  ocupado: boolean;
  onAprobar: () => void;
  onPagar: () => void;
}) {
  const d = detalleCuenta(fila);
  const validaciones = fila.estado === "pendiente_aprobacion" ? validacionesCuenta(fila, answers) : [];
  const accion =
    fila.estado === "pendiente_aprobacion" ? (
      <Button dense onClick={onAprobar} disabled={ocupado}>
        Aprobar
      </Button>
    ) : (fila.estado === "en_demo" || fila.estado === "demo_finalizada") && !fila.pagada_desde ? (
      <Button dense variant="secondary" onClick={onPagar} disabled={ocupado}>
        Marcar pagada
      </Button>
    ) : null;
  return (
    <div onClick={(e) => e.stopPropagation()} className="cursor-default rounded-2xl bg-campo/70 px-3.5 py-2.5 grid gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <EstadoChip estado={fila.estado} />
          {d && <span className="text-[12.5px] text-tinta-suave">{d}</span>}
        </div>
        {accion}
      </div>
      {validaciones.length > 0 && <p className="m-0 text-[12.5px] text-aviso-texto">Revisá: {validaciones.join(" ")}</p>}
    </div>
  );
}

export function HistorialModal({ fila, onClose }: { fila: FilaCuenta; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["cuenta-historial", fila.profile_id],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("historial_cuenta", { p_profile_id: fila.profile_id });
      if (error) throw error;
      return (rows ?? []) as { id: number; de: EstadoCuenta | null; a: EstadoCuenta; motivo: string | null; created_at: string; responsable: string | null }[];
    },
  });
  return (
    <Modal onClose={onClose}>
      <h2 className="m-0 mb-1 font-serif font-normal text-[24px]">Historial de la cuenta</h2>
      <p className="m-0 mb-4 text-[14px] text-tinta-tenue">
        {fila.nombre}
        {fila.paciente_nombre && fila.paciente_nombre !== fila.nombre ? ` · ${fila.paciente_nombre}` : ""}
      </p>
      {isLoading ? (
        <p className="m-0 text-[14px] text-tinta-tenue">Cargando…</p>
      ) : (
        <ol className="list-none m-0 p-0 grid gap-2">
          {(data ?? []).map((h) => (
            <li key={h.id} className="rounded-xl bg-campo px-3.5 py-2.5 text-[13.5px] text-tinta-suave">
              <span className="block text-[12px] text-tinta-tenue">
                {new Date(h.created_at).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })} · {h.responsable ?? "Sistema"}
              </span>
              {h.de ? `${estadoInfo[h.de].label} → ` : ""}
              <strong className="text-tinta">{estadoInfo[h.a].label}</strong>
              {h.motivo && ` · ${h.motivo}`}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}

// Ajustes del seguimiento (días de demo, de inactividad y límite de la IA).
export function AjustesCuentasModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["config-clinica"],
    queryFn: async () => {
      const { data: row, error } = await supabase.from("config_clinica").select("dias_demo, dias_inactividad, max_cambios_ia_pct").eq("id", 1).single();
      if (error) throw error;
      return row as { dias_demo: number; dias_inactividad: number; max_cambios_ia_pct: number };
    },
  });
  const [v, setV] = useState<{ dias_demo: number; dias_inactividad: number; max_cambios_ia_pct: number } | null>(null);
  const valores = v ?? data ?? null;
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  async function guardar() {
    if (!valores) return;
    setGuardando(true);
    const { error: e } = await supabase.rpc("actualizar_config_clinica", {
      p_dias_demo: valores.dias_demo,
      p_dias_inactividad: valores.dias_inactividad,
      p_max_cambios_ia_pct: valores.max_cambios_ia_pct,
    });
    setGuardando(false);
    if (e) {
      setError(e.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["config-clinica"] });
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
    onClose();
  }
  const campo = "min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] w-28";
  return (
    <Modal onClose={onClose}>
      <h2 className="m-0 mb-4 font-serif font-normal text-[24px]">Ajustes de cuentas</h2>
      {valores && (
        <div className="grid gap-3">
          {(
            [
              ["dias_demo", "Días de la semana gratis"],
              ["dias_inactividad", "Días sin actividad para marcarla «inactiva»"],
              ["max_cambios_ia_pct", "Máximo de cambios de la IA en una plantilla (%)"],
            ] as const
          ).map(([k, t]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-[14px] font-semibold text-tinta-suave">
              {t}
              <input type="number" min={0} className={campo} value={valores[k]} onChange={(e) => setV({ ...valores, [k]: Number(e.target.value) })} />
            </label>
          ))}
        </div>
      )}
      <p className="m-0 mt-3 text-[13px] text-tinta-tenue">Los días de semana gratis aplican a las cuentas que se aprueben desde ahora.</p>
      {error && <p className="m-0 mt-2 text-[14px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2 mt-5">
        <Button dense onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <Button dense variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
