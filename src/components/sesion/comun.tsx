import { useEffect, useState, type ReactNode } from "react";
import { detenerVoz, lecturaDisponible, leerEnVoz } from "../../lib/voz";
import { useSesion, useTam } from "./contexto";

export function Ceja({ children }: { children: ReactNode }) {
  const t = useTam();
  return <p className={`m-0 mb-2 tracking-[0.16em] uppercase font-semibold text-tinta-tenue ${t.ceja}`}>{children}</p>;
}

export function Titulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useTam();
  return <h1 className={`m-0 font-serif font-normal leading-tight text-tinta ${t.titulo} ${className}`}>{children}</h1>;
}

export function Nota({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useTam();
  return <p className={`m-0 leading-relaxed text-tinta-suave ${t.chico} ${className}`}>{children}</p>;
}

export const Marca = ({ className = "" }: { className?: string }) => (
  <span className={`ses-marca inline-flex items-center justify-center w-7 h-7 rounded-full bg-verde-profundo text-white shadow ${className}`}>
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

// Pie de cada escena: atrás, ayuda y la acción principal. Queda pegado
// abajo para que el pulgar lo encuentre siempre en el mismo lugar.
export function Pie({
  etiqueta,
  onClick,
  habilitado = true,
  tono = "principal",
  sinAtras = false,
  solo = false,
}: {
  etiqueta: string;
  onClick?: () => void;
  habilitado?: boolean;
  tono?: "principal" | "suave";
  sinAtras?: boolean;
  // Solo la acción principal, a lo ancho (portada y cierre).
  solo?: boolean;
}) {
  const { siguiente, anterior, abrirAyuda, large } = useSesion();
  const alto = large ? "min-h-[64px] text-[20px]" : "min-h-[56px] text-[17px]";
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-auto sm:mt-10 px-5 pt-6 pb-[max(18px,env(safe-area-inset-bottom))] sm:pb-10 bg-gradient-to-t from-fondo-papel from-70% to-transparent">
      <div className="flex items-center gap-2.5">
        {anterior && !sinAtras && !solo && (
          <button
            type="button"
            onClick={anterior}
            aria-label="Volver a la pantalla anterior"
            className={`shrink-0 ${large ? "w-16 h-16" : "w-14 h-14"} inline-flex items-center justify-center rounded-full border-[1.5px] border-borde bg-white text-tinta cursor-pointer hover:border-verde-serenidad`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {abrirAyuda && !solo && (
          <button
            type="button"
            onClick={abrirAyuda}
            className={`shrink-0 ${alto} px-3.5 sm:px-5 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border-[1.5px] border-verde-serenidad/50 bg-verde-tenue text-verde-profundo font-semibold cursor-pointer hover:bg-[#e6f0f0]`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.6M12 16.6v.1" />
            </svg>
            Ayuda
          </button>
        )}
        <button
          type="button"
          disabled={!habilitado}
          onClick={onClick ?? siguiente}
          className={`flex-1 min-w-0 ${alto} px-4 sm:px-6 whitespace-nowrap rounded-full font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            tono === "principal" ? "border-0 bg-tinta text-white hover:bg-verde-profundo" : "border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad"
          }`}
        >
          {etiqueta}
        </button>
      </div>
    </div>
  );
}

// Escuchar lo que dice la pantalla (sin texto, para no sumar otra cosa que leer).
export function BotonVoz({ texto }: { texto: string }) {
  const [leyendo, setLeyendo] = useState(false);
  useEffect(() => {
    setLeyendo(false);
    detenerVoz();
  }, [texto]);
  useEffect(() => () => detenerVoz(), []);
  if (!lecturaDisponible || !texto) return null;
  return (
    <button
      type="button"
      aria-label={leyendo ? "Detener la lectura" : "Escuchar"}
      aria-pressed={leyendo}
      onClick={() => {
        if (leyendo) {
          detenerVoz();
          setLeyendo(false);
        } else {
          setLeyendo(true);
          leerEnVoz(texto, () => setLeyendo(false));
        }
      }}
      className={`shrink-0 w-11 h-11 inline-flex items-center justify-center rounded-full border-[1.5px] cursor-pointer transition-colors ${
        leyendo ? "border-verde-profundo bg-verde-profundo text-white" : "border-borde bg-white text-verde-profundo hover:border-verde-serenidad"
      }`}
    >
      {leyendo ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        </svg>
      )}
    </button>
  );
}

// Panel que sube desde abajo (ayuda, parar).
export function Hoja({ titulo, onClose, children, tono = "normal" }: { titulo: string; onClose: () => void; children: ReactNode; tono?: "normal" | "alerta" }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="modal-backdrop-in absolute inset-0 border-0 bg-tinta/45 cursor-pointer" />
      <div
        className={`ses-hoja relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] bg-white px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-marco ${
          tono === "alerta" ? "border-t-[6px] border-semaforo-rojo" : ""
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-borde sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="m-0 font-serif font-normal text-[26px] leading-tight text-tinta">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full border-0 bg-campo text-tinta-suave cursor-pointer hover:bg-borde-suave"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
