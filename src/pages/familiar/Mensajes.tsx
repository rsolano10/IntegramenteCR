import { useAppStore } from "../../lib/store";
import { professional } from "../../lib/mockData";

export function Mensajes() {
  const mensajes = useAppStore((s) => s.mensajes);

  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Mensajes</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Lo que te escribió {professional.nombre}</h3>

      {mensajes.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Todavía no tenés mensajes.</p>
      ) : (
        <div className="grid gap-3">
          {mensajes.map((m, i) => (
            <div key={m.id} className={`rounded-2xl p-4.5 ${i === 0 ? "border-[1.5px] border-verde-serenidad bg-[#f5f9f9]" : "border border-borde bg-white"}`}>
              <p className="m-0 mb-1.5 text-[13px] text-tinta-tenue">{m.fecha}</p>
              <p className="m-0 text-[16px] leading-relaxed text-tinta">{m.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
