import { useVolver } from "../../lib/useVolver";

// «‹ Volver» de las pantallas secundarias (todo lo que no es Hoy, Mi semana
// o Ayuda): regresa a la pantalla anterior, como el botón atrás del
// teléfono; si se entró directo (un enlace), va a `respaldo`.
export function BotonVolver({ respaldo, texto = "Volver", className = "" }: { respaldo: string; texto?: string; className?: string }) {
  const volver = useVolver(respaldo);
  return (
    <button
      type="button"
      onClick={volver}
      className={`inline-flex items-center gap-1 min-h-11 -ml-1 px-1 border-none bg-transparent font-sans text-[15px] font-semibold text-verde-profundo cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo rounded-lg ${className}`}
    >
      <span aria-hidden="true">‹</span> {texto}
    </button>
  );
}
