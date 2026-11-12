import type { ReactNode } from "react";

// Línea gráfica de las pantallas de la clínica (Panel, Usuarios, Biblioteca,
// Plantillas, ficha del paciente). Toda pantalla es:
//
//   <Pagina>
//     [avisos de riesgo: lo único que va fuera de la caja, siempre arriba]
//     <Caja eyebrow titulo descripcion acciones>
//       <CajaPestanas/>   pestañas, si la pantalla tiene más de una vista
//       <CajaAviso/>      resultado de la última acción
//       <CajaBarra/>      búsqueda y filtros
//       <CajaCuerpo/>     el contenido
//     </Caja>
//     [otra Caja, si hay una sección aparte (p. ej. métricas)]
//   </Pagina>
//
// Excepción: en la ficha del paciente la caja contiene la identidad y las
// pestañas; el contenido de cada pestaña va debajo, porque ya está hecho de
// tarjetas propias (anidarlas en otra caja lo recargaría).

export function Pagina({ children, ancho = "max-w-[1200px]" }: { children: ReactNode; ancho?: string }) {
  return <div className={`im-in ${ancho} mx-auto px-4 py-6 pb-14 sm:px-8 lg:py-10 lg:pb-20 grid gap-6 content-start`}>{children}</div>;
}

export function Caja({
  id,
  eyebrow,
  titulo,
  descripcion,
  acciones,
  inicio,
  nivel = 1,
  pie,
  children,
}: {
  id?: string;
  /** Nombre de la sección, en versalitas sobre el título. */
  eyebrow?: ReactNode;
  titulo: ReactNode;
  descripcion?: ReactNode;
  /** A la derecha del título: la acción principal o un resumen. */
  acciones?: ReactNode;
  /** A la izquierda del título (p. ej. el avatar del paciente). */
  inicio?: ReactNode;
  /** h1 en la caja principal de la pantalla, h2 en las secundarias. */
  nivel?: 1 | 2;
  /** Pegado al borde inferior del encabezado (p. ej. las pestañas). */
  pie?: ReactNode;
  children?: ReactNode;
}) {
  const H = nivel === 1 ? "h1" : "h2";
  return (
    <section id={id} aria-labelledby={id ? `${id}-titulo` : undefined} className="scroll-mt-24 min-w-0 bg-white border border-borde rounded-[28px] overflow-hidden shadow-elevada">
      <div className={`relative overflow-hidden bg-[linear-gradient(120deg,#fbf3df_0%,#fdf9ef_38%,#ffffff_75%)] ${children ? "border-b border-borde-suave" : ""}`}>
        <SelloMarca />
        <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-[136px]">
          <div className="flex items-center gap-4 min-w-0">
            {inicio}
            <div className="min-w-0">
              {eyebrow && <p className="m-0 mb-1 flex flex-wrap items-center gap-2.5 text-[12.5px] font-extrabold tracking-[0.16em] uppercase text-aviso-texto">{eyebrow}</p>}
              <H id={id ? `${id}-titulo` : undefined} className="m-0 font-serif font-normal text-[27px] sm:text-[32px] leading-[1.12] text-tinta">
                {titulo}
              </H>
              {descripcion && <div className="m-0 mt-1.5 text-[15px] leading-snug text-tinta-suave max-w-[68ch]">{descripcion}</div>}
            </div>
          </div>
          {acciones && <div className="relative flex flex-wrap items-center gap-2.5">{acciones}</div>}
        </div>
        {pie && <div className="relative">{pie}</div>}
      </div>
      {children}
    </section>
  );
}

export interface PestanaCaja<T extends string> {
  id: T;
  label: string;
  /** Número junto al nombre. */
  n?: number;
  /** Número destacado (mostaza) o punto si no hay número. */
  aviso?: boolean;
}

// Pestañas: subrayado verde, dentro del encabezado de la caja.
export function CajaPestanas<T extends string>({ pestanas, activa, onCambiar, etiqueta }: { pestanas: PestanaCaja<T>[]; activa: T; onCambiar: (t: T) => void; etiqueta: string }) {
  return (
    <div role="tablist" aria-label={etiqueta} className="flex gap-6 sm:gap-8 px-5 sm:px-8 overflow-x-auto [scrollbar-width:none]">
      {pestanas.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activa === t.id}
          onClick={() => onCambiar(t.id)}
          className={`shrink-0 pb-3 pt-1 border-0 border-b-[3px] bg-transparent font-sans text-[15px] cursor-pointer inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
            activa === t.id ? "border-verde-profundo font-extrabold text-tinta" : "border-transparent font-semibold text-tinta-suave hover:text-tinta"
          }`}
        >
          {t.label}
          {t.n !== undefined ? (
            <span className={t.aviso ? "min-w-[22px] h-[22px] px-1.5 rounded-full bg-aviso text-aviso-texto border border-riesgo-borde text-[12px] font-extrabold inline-flex items-center justify-center" : "font-semibold text-tinta-suave"}>{t.n}</span>
          ) : (
            t.aviso && <span className="w-2 h-2 rounded-full bg-semaforo-amarillo" aria-label="requiere atención" />
          )}
        </button>
      ))}
    </div>
  );
}

// Búsqueda y filtros, en una franja suave bajo el encabezado.
export function CajaBarra({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-8 bg-[#fcfbf6] border-b border-borde-suave">{children}</div>;
}

export function CajaCuerpo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-6 sm:px-8 sm:py-7 ${className}`}>{children}</div>;
}

// Resultado de la última acción, a todo el ancho de la caja.
export function CajaAviso({ texto, error, onCerrar }: { texto: string; error?: boolean; onCerrar?: () => void }) {
  return (
    <div role="status" className={`flex items-center justify-between gap-4 px-5 py-3 sm:px-8 text-[14px] border-b border-borde-suave ${error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}>
      <span>{texto}</span>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="shrink-0 border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
          Cerrar
        </button>
      )}
    </div>
  );
}

// Sello de la marca: el isotipo de IntegraMente (las tres gotas: verde
// serenidad, beige y mostaza) grande y tenue, asomando por la esquina del
// encabezado. Dibujado en SVG para que se vea nítido a cualquier tamaño.
// Gota de 100×100 con la punta abajo a la derecha.
const GOTA = "M0 50A50 50 0 0 1 50 0A50 50 0 0 1 100 50V100H50A50 50 0 0 1 0 50Z";

export function Isotipo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 138 132" aria-hidden="true">
      <path d={GOTA} fill="#58979d" transform="translate(40 40) rotate(8) scale(0.7) translate(-50 -50)" />
      <path d={GOTA} fill="#ede8d0" transform="translate(109 40) rotate(98) scale(0.57) translate(-50 -50)" />
      <path d={GOTA} fill="#f4c372" transform="translate(29 106) rotate(-82) scale(0.57) translate(-50 -50)" />
    </svg>
  );
}

function SelloMarca() {
  return <Isotipo className="pointer-events-none absolute right-6 top-5 w-[84px] h-auto opacity-[0.55] max-sm:w-[46px] max-sm:right-4 max-sm:top-4 max-sm:opacity-[0.45]" />;
}
