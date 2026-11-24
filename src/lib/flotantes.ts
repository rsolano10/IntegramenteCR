import { useEffect, useState } from "react";

// Los botones flotantes se ocultan cuando el pie de página (que ya tiene
// WhatsApp y redes) o una sección marcada con data-sin-flotantes (el
// llamado final del home) está a la vista, para no tapar sus enlaces.
export function useOcultoEnElPie() {
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    const zonas = [document.getElementById("pie"), ...Array.from(document.querySelectorAll<HTMLElement>("[data-sin-flotantes]"))].filter(
      (z): z is HTMLElement => !!z,
    );
    if (zonas.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visibles = new Set<Element>();
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) visibles.add(e.target);
        else visibles.delete(e.target);
      }
      setOculto(visibles.size > 0);
    });
    zonas.forEach((z) => io.observe(z));
    return () => io.disconnect();
  }, []);
  return oculto;
}

export const flotanteBase =
  "fixed z-30 bg-white/95 backdrop-blur border border-borde shadow-[0_10px_28px_-14px_rgba(31,51,56,.45)] transition-[opacity,transform,border-color] duration-300";
export const flotanteBottom = { bottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" };

