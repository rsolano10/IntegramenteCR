import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { MediaResource } from "../../lib/mediaResources";
import { contenidoDeRecurso } from "../../lib/contenidoRecurso";
import { useBodyScrollLock } from "../../lib/useBodyScrollLock";
import { ResourceDetailView } from "../ui/ResourceDetailView";
import { Button } from "../ui/Button";

// «Ver una actividad de ejemplo» del home: el recurso real de la biblioteca
// (se lee por código; los recursos activos son públicos) con los mismos
// componentes de la pantalla de actividad de la app (familiar/Actividad.tsx),
// así lo que se ve acá es exactamente lo que se ve adentro. Sin la tarjeta
// de introducción a la gerontogimnasia (en el home no tiene sentido «volver
// a ver la introducción»): solo la ficha del ejercicio. Se carga aparte
// (lazy) para no sumar el cliente de Supabase al home.
export default function EjemploActividad({ codigo, onClose }: { codigo: string; onClose: () => void }) {
  useBodyScrollLock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { data: recurso, isLoading, error } = useQuery({
    queryKey: ["ejemplo-home", codigo],
    queryFn: async () => {
      const { data, error: e } = await supabase.from("media_resources").select("*").eq("codigo", codigo).eq("activo", true).single();
      if (e) throw e;
      return data as MediaResource;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div role="dialog" aria-modal="true" aria-label={recurso?.titulo ?? "Actividad de ejemplo"} onClick={onClose} className="im-in fixed inset-0 z-50 bg-tinta/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-8">
      <div className="relative w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-[26px] bg-fondo-papel shadow-elevada" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 sm:px-7 py-3 bg-verde-profundo text-white">
          <span className="text-[12.5px] font-semibold tracking-[0.12em] uppercase text-[#c4dbdb]">Así se ve en la app</span>
          <button type="button" onClick={onClose} aria-label="Cerrar" autoFocus className="w-9 h-9 rounded-full bg-white/15 border-0 text-white text-[20px] leading-none cursor-pointer hover:bg-white/25">
            ×
          </button>
        </div>
        <div className="px-5 py-6 sm:px-7">
          {isLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
            </div>
          ) : error || !recurso ? (
            <p className="m-0 text-[16px] text-tinta-suave">No pudimos cargar la actividad. Probá de nuevo en un momento.</p>
          ) : (
            <>
              {/* Mismo encabezado y cuerpo que la pantalla de actividad. */}
              <h3 className="font-serif font-normal text-[26px] m-0 mb-3.5">{recurso.titulo}</h3>
              <div className="grid gap-4.5">
                <ResourceDetailView content={contenidoDeRecurso(recurso, `${recurso.tipo}${recurso.duracion ? ` · ${recurso.duracion}` : ""}`)} />
              </div>
            </>
          )}
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-3.5 bg-white border-t border-borde">
          <span className="text-[13.5px] text-tinta-suave">Actividad real de la biblioteca de IntegraMente.</span>
          <Button dense to="/ingresar?mode=register">
            Crear mi cuenta gratis
          </Button>
        </div>
      </div>
    </div>
  );
}
