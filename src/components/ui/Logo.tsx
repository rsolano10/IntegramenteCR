// Logo oficial de IntegraMente (isotipo + logotipo, archivos originales en
// public/marca, sin alterar colores ni proporciones) con "en Casa" como
// identificador de la aplicación, al lado y separado del logo.
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const alto = size === "sm" ? "h-8" : "h-9 sm:h-10 lg:h-11";
  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3">
      <span className={`inline-flex items-center gap-1.5 sm:gap-2 ${alto}`}>
        <img src="/marca/isotipo.png" alt="" className="h-full w-auto" />
        <img src="/marca/logotipo.png" alt="IntegraMente" className="h-[88%] w-auto" />
      </span>
      <span className="pl-2.5 sm:pl-3 border-l border-borde-campo text-[11px] sm:text-xs tracking-[0.16em] uppercase text-tinta-suave font-semibold whitespace-nowrap">
        en Casa
      </span>
    </span>
  );
}
