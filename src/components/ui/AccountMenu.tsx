import { useEffect, useState } from "react";
import { menuItemClass } from "./RowMenu";

export interface AccountMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  /** Título del grupo: se muestra antes del primer ítem de cada grupo. */
  seccion?: string;
}

export function AccountMenu({
  initials,
  name,
  subtitle,
  badge,
  items,
  etiqueta,
  cambio,
}: {
  initials: string;
  name: string;
  subtitle: string;
  /** Distintivo del rol (p. ej. «Administrador»): anillo mostaza en el avatar y etiqueta junto al nombre. */
  badge?: string;
  items: AccountMenuItem[];
  /** Si viene, el botón muestra solo el avatar y esta etiqueta (la familia: el nombre de la persona del programa). */
  etiqueta?: string;
  /** Cambiar de persona (familiar con varias): el encabezado del menú se vuelve un selector. */
  cambio?: { opciones: { id: string; texto: string }[]; onElegir: (id: string) => void; onNuevo?: () => void };
}) {
  const [open, setOpen] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const puedeCambiar = !!cambio && (cambio.opciones.length > 0 || !!cambio.onNuevo);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 pl-1 pr-2.5 sm:pr-3.5 py-1 rounded-full border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
      >
        <span
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center font-serif font-bold text-[13px] sm:text-sm shrink-0 ${badge ? "bg-tinta" : "bg-verde-serenidad"}`}
          style={badge ? { boxShadow: "0 0 0 2px #fff, 0 0 0 4px var(--color-mostaza-vital)" } : undefined}
          title={badge}
        >
          {initials}
        </span>
        {etiqueta ? (
          <span className="hidden md:block text-[15px] font-semibold text-tinta">{etiqueta}</span>
        ) : (
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-[13px] font-semibold text-tinta">{name}</span>
            {badge ? <BadgeRol texto={badge} /> : <span className="block text-[11px] text-tinta-tenue">{subtitle}</span>}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-tinta-tenue">
          <path d="M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default border-none bg-transparent p-0"
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 bg-white border border-borde rounded-2xl shadow-elevada overflow-hidden"
          >
            {puedeCambiar ? (
              // Con varias personas: el encabezado cambia entre ellas.
              <div className="border-b border-borde-suave bg-campo">
                <button
                  type="button"
                  onClick={() => setCambiando((v) => !v)}
                  aria-expanded={cambiando}
                  aria-label={`${subtitle}. ${cambio!.opciones.length > 0 ? "Cambiar de persona" : "Inscribir a otra persona"}`}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3.5 border-0 bg-transparent text-left cursor-pointer hover:bg-borde-suave/50 font-sans"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-tinta">{name}</span>
                    <span className="block text-[12px] text-tinta-tenue">{subtitle}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-verde-profundo">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${cambiando ? "rotate-180" : ""}`}>
                      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {cambiando && (
                  <div className="grid pb-2">
                    {cambio!.opciones.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false);
                          setCambiando(false);
                          cambio!.onElegir(o.id);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 border-0 bg-transparent text-left text-[14px] text-tinta cursor-pointer hover:bg-white font-sans"
                      >
                        <span className="w-7 h-7 shrink-0 rounded-full bg-beige-serenidad text-[12px] font-bold inline-flex items-center justify-center">{o.texto.charAt(0).toUpperCase()}</span>
                        <span className="min-w-0 truncate">Familiar de {o.texto}</span>
                      </button>
                    ))}
                    {cambio!.onNuevo && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false);
                          setCambiando(false);
                          cambio!.onNuevo!();
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 border-0 bg-transparent text-left text-[14px] font-semibold text-verde-profundo cursor-pointer hover:bg-white font-sans"
                      >
                        <span className="w-7 h-7 shrink-0 rounded-full border-[1.5px] border-dashed border-verde-serenidad inline-flex items-center justify-center text-[15px]">+</span>
                        Inscribir a otra persona
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-3.5 border-b border-borde-suave bg-campo">
                <p className="m-0 text-[14px] font-semibold text-tinta">{name}</p>
                <p className="m-0 text-[12px] text-tinta-tenue">{subtitle}</p>
                {badge && (
                  <p className="m-0 mt-2">
                    <BadgeRol texto={badge} />
                  </p>
                )}
              </div>
            )}
            <div className="grid py-1.5">
              {items.map((item, i) => (
                <div key={item.label} className="contents">
                {item.seccion && item.seccion !== items[i - 1]?.seccion && (
                  <p className={`m-0 px-4 pb-1 text-[11.5px] font-semibold tracking-[0.12em] uppercase text-tinta-tenue ${i > 0 ? "pt-3 mt-1.5 border-t border-borde-suave" : "pt-1.5"}`}>{item.seccion}</p>
                )}
                {!item.seccion && items[i - 1]?.seccion && <span aria-hidden="true" className="block mt-1.5 mb-1 border-t border-borde-suave" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={menuItemClass(item.danger)}
                >
                  {item.label}
                </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function BadgeRol({ texto }: { texto: string }) {
  return (
    <span className="inline-flex items-center gap-1 mt-0.5 h-[18px] px-1.5 rounded-md bg-tinta text-mostaza-vital text-[10.5px] font-extrabold tracking-[0.06em] uppercase">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" />
      </svg>
      {texto}
    </span>
  );
}
