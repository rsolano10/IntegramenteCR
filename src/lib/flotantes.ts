import { useEffect, useState } from "react";

// Los botones flotantes se ocultan cuando el pie de página (que ya tiene
// WhatsApp y redes) está a la vista, para no tapar sus enlaces.
export function useOcultoEnElPie() {
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    const pie = document.getElementById("pie");
    if (!pie || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOculto(e.isIntersecting));
    io.observe(pie);
    return () => io.disconnect();
  }, []);
  return oculto;
}

export const flotanteBase =
  "fixed z-30 bg-white/95 backdrop-blur border border-borde shadow-[0_10px_28px_-14px_rgba(31,51,56,.45)] transition-[opacity,transform,border-color] duration-300";
export const flotanteBottom = { bottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" };

