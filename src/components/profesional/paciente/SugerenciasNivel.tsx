import { useState } from "react";
import { nivelLabel, type Nivel } from "../../../lib/actividades/contrato";
import type { Sugerencia } from "../../../lib/actividades/nivelSugerido";
import { IconoInteractivo } from "../NivelInteractivo";

// Sugerencias de nivel para los juegos, según cómo le resultaron las dos
// últimas veces (lo que contó la familia al cerrar el juego). Nunca cambia
// solo: «Pasar a…» lo aplica a esta semana y a lo que se agregue después.
export function SugerenciasNivel({
  sugerencias,
  titulo,
  onAplicar,
  onIrAPlanificar,
}: {
  sugerencias: Sugerencia[];
  titulo: (resourceId: string) => string;
  onAplicar?: (resourceId: string, nivel: Nivel) => void;
  /** En Seguimiento: llevar al planificador en lugar de aplicar. */
  onIrAPlanificar?: () => void;
}) {
  const [descartadas, setDescartadas] = useState<string[]>([]);
  const visibles = sugerencias.filter((s) => !descartadas.includes(s.resourceId));
  if (!visibles.length) return null;
  return (
    <section aria-labelledby="sugerencias-nivel" className="rounded-[22px] border-[1.5px] border-mostaza-vital bg-[#fffaf0] p-4 sm:p-5 grid gap-3">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-[10px] bg-mostaza-vital text-tinta inline-flex items-center justify-center shrink-0" aria-hidden="true">
          <IconoInteractivo className="!w-4 !h-4" />
        </span>
        <div>
          <h3 id="sugerencias-nivel" className="m-0 text-[15.5px] font-extrabold text-tinta">
            {visibles.length === 1 ? "Sugerencia de nivel" : "Sugerencias de nivel"}
          </h3>
          <p className="m-0 text-[13px] text-tinta-suave">Según lo que contó la familia al terminar cada juego. Vos decidís.</p>
        </div>
      </div>
      <ul className="list-none m-0 p-0 grid gap-2">
        {visibles.map((s) => (
          <li key={s.resourceId} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white border border-borde-suave px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[14.5px] font-bold text-tinta">
                {titulo(s.resourceId)}{" "}
                <span className="font-semibold text-tinta-suave">
                  · {nivelLabel[s.actual]} {s.direccion === "subir" ? "↗" : "↘"} {nivelLabel[s.nivel]}
                </span>
              </p>
              <p className="m-0 text-[13px] text-tinta-suave">{s.motivo}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {onAplicar ? (
                <button
                  type="button"
                  onClick={() => onAplicar(s.resourceId, s.nivel)}
                  className="h-9 px-3.5 rounded-[10px] border-0 bg-verde-profundo text-white font-sans text-[13.5px] font-bold cursor-pointer hover:bg-tinta"
                >
                  Pasar a {nivelLabel[s.nivel].toLowerCase()}
                </button>
              ) : (
                onIrAPlanificar && (
                  <button
                    type="button"
                    onClick={onIrAPlanificar}
                    className="h-9 px-3.5 rounded-[10px] border-[1.5px] border-[#c9d8d9] bg-white text-verde-profundo font-sans text-[13.5px] font-bold cursor-pointer hover:border-verde-profundo"
                  >
                    Ir a planificar
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setDescartadas((d) => [...d, s.resourceId])}
                className="h-9 px-3 rounded-[10px] border-0 bg-transparent text-tinta-suave font-sans text-[13.5px] font-semibold cursor-pointer hover:text-tinta"
              >
                Ahora no
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
