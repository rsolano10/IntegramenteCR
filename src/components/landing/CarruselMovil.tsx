import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "../../lib/useScrollFx";

// Tarjetas lado a lado en celular: carrusel horizontal de borde a borde
// (se asoma la siguiente) con puntos debajo. Desde tablet (md) deja de ser
// carrusel y usa el diseño de escritorio que se pase en `escritorio`.
// Va dentro de un contenedor con relleno px-5 sm:px-8: el margen negativo
// lo lleva al borde de la pantalla sin perder la alineación del contenido.
export function CarruselMovil({
  etiqueta,
  escritorio,
  item = "",
  children,
}: {
  etiqueta: string;
  // Clases md:/lg: del contenedor en tablet y computadora.
  escritorio: string;
  // Clases md:/lg: de cada tarjeta en tablet y computadora.
  item?: string;
  children: ReactNode;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const hijos = Children.toArray(children);
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const onScroll = () => {
      const tarjetas = Array.from(el.children) as HTMLElement[];
      const inicio = tarjetas[0]?.offsetLeft ?? 0;
      const x = el.scrollLeft;
      let mejor = 0;
      tarjetas.forEach((t, i) => {
        if (Math.abs(t.offsetLeft - inicio - x) < Math.abs(tarjetas[mejor].offsetLeft - inicio - x)) mejor = i;
      });
      if (x + el.clientWidth >= el.scrollWidth - 4) mejor = tarjetas.length - 1;
      setActiva(mejor);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function irA(i: number) {
    const el = pista.current;
    const tarjetas = el ? (Array.from(el.children) as HTMLElement[]) : [];
    if (!el || !tarjetas[i]) return;
    el.scrollTo({ left: tarjetas[i].offsetLeft - tarjetas[0].offsetLeft, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <div>
      <ul
        ref={pista}
        aria-label={etiqueta}
        className={`relative list-none m-0 flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 sm:-mx-8 sm:px-8 scroll-px-5 sm:scroll-px-8 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:pb-0 md:overflow-visible ${escritorio}`}
      >
        {hijos.map((h, i) => (
          <li key={i} className={`snap-start shrink-0 w-[84%] sm:w-[62%] ${item}`}>
            {h}
          </li>
        ))}
      </ul>
      {hijos.length > 1 && (
        <div className="md:hidden flex justify-center gap-1.5 mt-3" role="tablist" aria-label={`Elegir: ${etiqueta}`}>
          {hijos.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activa}
              aria-label={`${i + 1} de ${hijos.length}`}
              onClick={() => irA(i)}
              className={`relative h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-300 after:absolute after:content-[''] after:-inset-y-[18px] after:-inset-x-[3px] ${
                i === activa ? "w-8 bg-verde-profundo" : "w-2 bg-borde-campo"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
