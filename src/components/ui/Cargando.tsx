import { useEffect, useState } from "react";

// Mientras carga: en vez de una pantalla en blanco (que con mala conexión
// parece una app trabada), un «Cargando…» y las siluetas de la caja de
// avance y dos tarjetas. Aparece recién a los 300 ms para no parpadear
// cuando la carga es rápida.
export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div role="status" aria-live="polite" className="grid gap-4 flex-1">
      {visible && (
        <>
          <p className="m-0 text-[16px] text-tinta-suave">{texto}</p>
          <div className="h-[118px] rounded-[26px] bg-verde-serenidad/15 animate-pulse" aria-hidden="true" />
          <div className="h-[84px] rounded-[22px] bg-white/70 border border-borde animate-pulse" aria-hidden="true" />
          <div className="h-[84px] rounded-[22px] bg-white/70 border border-borde animate-pulse" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
