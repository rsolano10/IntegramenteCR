import { useState } from "react";
import { moduloTheme } from "../../lib/modulos";
import type { Guion, Progreso } from "../../lib/sesiones";
import type { ResourceModulo } from "../../lib/modulos";
import { Icono } from "./Icono";

// En la pantalla de la actividad, cuando tiene sesión guiada: qué es en una
// frase y sus etiquetas, en lugar de la ficha larga (que queda plegada).
export function ResumenSesion({ guion, modulo, large = false }: { guion: Guion; modulo: ResourceModulo | null; large?: boolean }) {
  const tema = modulo ? moduloTheme[modulo] : moduloTheme.bienvenida;
  return (
    <div className="flex items-center gap-4 rounded-[24px] bg-white border border-borde px-4 py-4 mb-5">
      <span className="shrink-0 w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tema.from})` }}>
        <Icono nombre={guion.icono} className="w-11 h-11 text-tinta" relleno="#fff" />
      </span>
      <div className="min-w-0">
        <p className={`m-0 leading-snug text-tinta ${large ? "text-[20px]" : "text-[16.5px]"}`}>{guion.frase}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {guion.etiquetas.map((e) => (
            <span key={e} className={`rounded-full bg-campo border border-borde-suave px-2.5 py-0.5 font-semibold text-tinta-suave ${large ? "text-[15px]" : "text-[13px]"}`}>
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// La misión de la semana, para seguir marcando cualquier día.
export function MisionSemana({
  progreso,
  modulo,
  onGuardar,
  large = false,
}: {
  progreso: Progreso;
  modulo: ResourceModulo | null;
  onGuardar?: (p: Progreso) => Promise<void>;
  large?: boolean;
}) {
  const tema = modulo ? moduloTheme[modulo] : moduloTheme.bienvenida;
  const m = progreso.mision!;
  const [marcas, setMarcas] = useState(() => Array.from({ length: m.veces }, (_, i) => !!m.marcas[i]));
  const [error, setError] = useState(false);
  const hechas = marcas.filter(Boolean).length;
  async function tocar(i: number) {
    if (!onGuardar) return;
    const nuevas = marcas.map((v, k) => (k === i ? !v : v));
    setMarcas(nuevas);
    setError(false);
    try {
      await onGuardar({ ...progreso, mision: { ...m, marcas: nuevas } });
    } catch {
      setMarcas(marcas);
      setError(true);
    }
  }
  return (
    <section className="rounded-[24px] border-[1.5px] px-4 py-4 mb-5" style={{ borderColor: `${tema.to}66`, background: `${tema.from}33` }}>
      <p className={`m-0 mb-1 tracking-[0.14em] uppercase font-semibold ${large ? "text-[14px]" : "text-[12.5px]"}`} style={{ color: tema.ink }}>
        Misión de la semana
      </p>
      <p className={`m-0 font-serif leading-snug text-tinta ${large ? "text-[24px]" : "text-[20px]"}`}>{m.texto}</p>
      {m.detalle && <p className={`m-0 mt-0.5 text-tinta-suave ${large ? "text-[17px]" : "text-[14.5px]"}`}>{m.detalle}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {marcas.map((v, i) => (
          <button
            key={i}
            type="button"
            disabled={!onGuardar}
            aria-pressed={v}
            aria-label={`Vez ${i + 1}${v ? ", hecha" : ""}`}
            onClick={() => tocar(i)}
            className={`${m.veces > 3 ? "w-11 h-11" : "w-14 h-14"} rounded-full inline-flex items-center justify-center border-[2.5px] cursor-pointer disabled:cursor-default transition-colors ${
              v ? "bg-white border-verde-profundo" : "bg-white/70 border-dashed border-borde-campo"
            }`}
          >
            {v ? <Icono nombre={m.icono ?? "estrella"} className="ses-marca w-8 h-8 text-tinta" relleno={tema.from} /> : <span className="text-[14px] font-semibold text-tinta-tenue">{i + 1}</span>}
          </button>
        ))}
        <span className={`ml-1 font-semibold text-tinta ${large ? "text-[18px]" : "text-[15px]"}`} aria-live="polite">
          {hechas === m.veces ? "¡Cumplida!" : `${hechas} de ${m.veces}`}
        </span>
      </div>
      {error && <p className="m-0 mt-2 text-[14px] text-alerta-texto">No pudimos guardar. Probá de nuevo.</p>}
    </section>
  );
}
