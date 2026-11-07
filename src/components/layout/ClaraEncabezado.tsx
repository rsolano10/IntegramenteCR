import { useEffect, useState } from "react";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { EVENTO_ESTADO_CLARA } from "../../lib/claraEstado";

// Encabezado de Ayuda. Mismas medidas y estilo de texto que el saludo de
// las otras secciones («Hola, [nombre]»): arriba, en letra chica, «Tu
// asistente de IntegraMente» (o el estado en vivo: escribiendo, en
// llamada…) en lugar de la fecha, y el título «Hola, soy Clara». Cambia el
// color y suma el isotipo y el acceso a un profesional por WhatsApp, sin
// cambiar el alto.
export function ClaraEncabezado({ paciente }: { paciente?: string }) {
  const [estado, setEstado] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => setEstado((e as CustomEvent<string | null>).detail);
    window.addEventListener(EVENTO_ESTADO_CLARA, on);
    return () => window.removeEventListener(EVENTO_ESTADO_CLARA, on);
  }, []);

  return (
    <div className="shrink-0 relative overflow-hidden px-5 pt-6 pb-6 sm:px-8 lg:px-12" style={{ backgroundImage: "linear-gradient(120deg, #dfeceb 0%, #ebe6ce 100%)" }}>
      <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="absolute right-32 sm:right-56 -bottom-10 w-32 opacity-[0.14] rotate-12 select-none pointer-events-none" />
      <div className="relative max-w-3xl mx-auto flex items-center gap-4">
        {/* El isotipo cuelga en el margen (solo en pantallas anchas) para que
            el texto quede alineado igual que en «Hola, [nombre]». */}
        <span className="hidden xl:flex absolute -left-[72px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white shadow-[0_8px_20px_-12px_rgba(31,51,56,0.5)] items-center justify-center">
          <img src="/marca/isotipo.png" alt="" className="w-8 h-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 mb-1 text-sm text-tinta-suave truncate" aria-live="polite">
            {estado ?? "Tu asistente de IntegraMente"}
          </p>
          <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-tinta">Hola, soy Clara</h1>
        </div>
        <a
          href={waEquipo(undefined, paciente)}
          target="_blank"
          rel="noreferrer"
          aria-label="Hablar con un profesional por WhatsApp (se abre en otra pestaña)"
          className="shrink-0 inline-flex items-center gap-2 min-h-11 px-3.5 sm:px-4 rounded-full bg-[#25d366] text-white text-[14px] font-semibold no-underline shadow-[0_8px_18px_-10px_rgba(26,127,67,0.8)] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
        >
          <WhatsAppIcon size={18} />
          <span>
            <span className="sm:hidden">Profesional</span>
            <span className="hidden sm:inline">Hablar con un profesional</span>
          </span>
        </a>
      </div>
    </div>
  );
}
