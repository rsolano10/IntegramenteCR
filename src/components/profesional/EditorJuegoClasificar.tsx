import { useState } from "react";
import type { ExtrasClasificar } from "../../lib/clasificarNumeros";

// Configuración del juego «Clasificar números por valor» en el editor de
// recursos: campos simples para la clínica. Niveles: fácil con números
// lejos de la referencia (13, 20, 48); más difícil con números cercanos
// (39, 42).
export function EditorJuegoClasificar({ valor, onChange }: { valor: ExtrasClasificar | null; onChange: (v: ExtrasClasificar | null) => void }) {
  const activo = !!valor;
  const v: ExtrasClasificar = valor ?? { modo: "clasificar" };
  const referencia = v.referencia ?? 20;
  const [lista, setLista] = useState((v.numeros ?? []).join(", "));
  const usarLista = (v.numeros?.length ?? 0) > 0;
  const campo = "w-full min-w-0 min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta focus:border-verde-serenidad";
  const etiqueta = "grid gap-1 text-[13px] font-semibold text-tinta-suave";
  const cambiar = (cambios: Partial<ExtrasClasificar>) => onChange({ ...v, ...cambios });
  const cajasPorDefecto = (ref: number) => [
    { etiqueta: `Menores que ${ref}`, regla: "menor" as const },
    { etiqueta: `Mayores que ${ref}`, regla: "mayor" as const },
  ];

  return (
    <section className="rounded-2xl border border-borde bg-campo/60 p-4 grid gap-3.5">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { modo: "clasificar", referencia: 40, cajas: cajasPorDefecto(40), rango: { min: 10, max: 50 }, cantidad: 8, rondas: 5, mezclar: true, mostrarEjemplo: true }
                : null,
            )
          }
          className="mt-1"
        />
        <span>
          <span className="block text-[15px] font-bold text-tinta">Juego interactivo: clasificar números por valor</span>
          <span className="block text-[13px] text-tinta-suave">La persona toca un número y la caja donde va. Se muestra como «Tu actividad» y en el modo paso a paso.</span>
        </span>
      </label>

      {activo && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={etiqueta}>
              Título
              <input className={campo} value={v.titulo ?? ""} placeholder="Clasificar números por valor" onChange={(e) => cambiar({ titulo: e.target.value })} />
            </label>
            <label className={etiqueta}>
              Consigna
              <input className={campo} value={v.consigna ?? ""} placeholder="Clasificá los siguientes números." onChange={(e) => cambiar({ consigna: e.target.value })} />
            </label>
            <label className={etiqueta}>
              Número de referencia
              <input
                type="number"
                className={campo}
                value={referencia}
                onChange={(e) => {
                  const ref = Number(e.target.value);
                  // Si las cajas tenían los textos automáticos, se actualizan con la referencia.
                  const automaticas = !v.cajas || v.cajas.every((c, i) => c.etiqueta === cajasPorDefecto(referencia)[i]?.etiqueta);
                  cambiar({ referencia: ref, ...(automaticas ? { cajas: cajasPorDefecto(ref) } : {}) });
                }}
              />
            </label>
            <label className={etiqueta}>
              Rondas
              <input type="number" min={1} max={20} className={campo} value={v.rondas ?? 5} onChange={(e) => cambiar({ rondas: Number(e.target.value) })} />
            </label>
            {(v.cajas ?? cajasPorDefecto(referencia)).slice(0, 2).map((c, i) => (
              <label key={i} className={etiqueta}>
                Caja {i === 0 ? "izquierda" : "derecha"} ({c.regla === "menor" ? "menores" : c.regla === "mayor" ? "mayores" : c.regla})
                <input
                  className={campo}
                  value={c.etiqueta}
                  onChange={(e) => {
                    const cajas = [...(v.cajas ?? cajasPorDefecto(referencia))];
                    cajas[i] = { ...cajas[i], etiqueta: e.target.value };
                    cambiar({ cajas });
                  }}
                />
              </label>
            ))}
          </div>

          <fieldset className="m-0 p-0 border-0 grid gap-2.5">
            <legend className="text-[13px] font-semibold text-tinta-suave mb-1">Números</legend>
            <label className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer">
              <input type="radio" checked={!usarLista} onChange={() => cambiar({ numeros: undefined })} /> Al azar en un rango
            </label>
            <label className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer">
              <input
                type="radio"
                checked={usarLista}
                onChange={() => cambiar({ numeros: lista.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n !== referencia).slice(0, 12) })}
              />{" "}
              Lista fija en la primera ronda (después, al azar)
            </label>
            {usarLista && (
              <label className={etiqueta}>
                Lista (separada por comas)
                <input
                  className={campo}
                  value={lista}
                  placeholder="24, 42, 48, 20, 39, 49, 13, 47"
                  onChange={(e) => {
                    setLista(e.target.value);
                    cambiar({ numeros: e.target.value.split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n)).slice(0, 12) });
                  }}
                />
              </label>
            )}
            <div className="grid gap-3 grid-cols-3">
              <label className={etiqueta}>
                Desde
                <input type="number" className={campo} value={v.rango?.min ?? 10} onChange={(e) => cambiar({ rango: { min: Number(e.target.value), max: v.rango?.max ?? 50 } })} />
              </label>
              <label className={etiqueta}>
                Hasta
                <input type="number" className={campo} value={v.rango?.max ?? 50} onChange={(e) => cambiar({ rango: { min: v.rango?.min ?? 10, max: Number(e.target.value) } })} />
              </label>
              <label className={etiqueta}>
                Cantidad
                <input type="number" min={4} max={12} className={campo} value={v.cantidad ?? 8} onChange={(e) => cambiar({ cantidad: Number(e.target.value) })} />
              </label>
            </div>
            <p className="m-0 text-[12.5px] leading-relaxed text-tinta-tenue">
              Más fácil: números lejos de la referencia (13, 20, 48). Más difícil: números cercanos (39, 42). Siempre hay al menos 2 por caja.
            </p>
          </fieldset>

          <label className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer">
            <input type="checkbox" checked={v.mostrarEjemplo ?? true} onChange={(e) => cambiar({ mostrarEjemplo: e.target.checked })} /> Mostrar el ejemplo antes de empezar
          </label>
        </>
      )}
    </section>
  );
}
