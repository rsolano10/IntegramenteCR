import { useEffect, useState } from "react";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { EVENTO_ESTADO_CLARA } from "../../lib/claraEstado";

// Encabezado de Ayuda: queda fijo arriba, como la barra de un chat de
// WhatsApp. Isotipo, «Clara» y su estado en vivo (escribiendo, en llamada…),
// y a la derecha el acceso directo a un profesional por WhatsApp.
export function ClaraEncabezado({ paciente }: { paciente?: string }) {
  const [estado, setEstado] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => setEstado((e as CustomEvent<string | null>).detail);
    window.addEventListener(EVENTO_ESTADO_CLARA, on);
    return () => window.removeEventListener(EVENTO_ESTADO_CLARA, on);
  }, []);

  return (
    <div className="shrink-0 relative overflow-hidden border-b border-borde" style={{ backgroundImage: "linear-gradient(120deg, #dfeceb 0%, #ebe6ce 100%)" }}>
      <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="absolute right-28 sm:right-40 -bottom-9 w-32 opacity-[0.14] rotate-12 select-none pointer-events-none" />
      <div className="relative max-w-3xl mx-auto flex items-center gap-3 px-4 py-3 sm:px-8 lg:px-0">
        <span className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-[0_8px_20px_-12px_rgba(31,51,56,0.5)] flex items-center justify-center">
          <img src="/marca/isotipo.png" alt="" className="w-7 sm:w-8 h-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 font-serif font-normal text-[23px] sm:text-[26px] leading-none text-tinta">Clara</h1>
          <p className="m-0 mt-1 text-[13.5px] leading-snug text-tinta-suave" aria-live="polite">
            {estado ?? "Tu asistente de IntegraMente"}
          </p>
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
