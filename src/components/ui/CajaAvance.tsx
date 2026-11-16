// La caja de avance, la misma en Hoy y en Mi semana: verde de la marca, el
// anillo a la izquierda (trazo mostaza) con «n de total» adentro, y a la
// derecha el título y el detalle. El anillo cuenta las actividades hechas
// (enteras o en parte), igual en todas las pantallas.

export function AnilloAvance({ hechas, total, lado, claro = true }: { hechas: number; total: number; lado: number; claro?: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total ? Math.min(1, hechas / total) : 0;
  const chico = lado < 60;
  return (
    <div className="relative shrink-0" style={{ width: lado, height: lado }} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke={claro ? "rgba(255,255,255,0.22)" : "#ebe6ce"} strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={claro ? "#f4d096" : "#e0b45f"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      {!chico && (
        <span className={`absolute inset-0 flex flex-col items-center justify-center font-serif leading-none ${claro ? "text-white" : "text-tinta"} ${lado >= 100 ? "text-[30px]" : "text-[26px]"}`}>
          {hechas}
          <span className={`font-sans font-semibold mt-0.5 ${claro ? "text-white/80" : "text-tinta-suave"} ${lado >= 100 ? "text-[15px]" : "text-[14px]"}`}>de {total}</span>
        </span>
      )}
    </div>
  );
}

export function CajaAvance({
  hechas,
  total,
  titulo,
  detalle,
  antetitulo,
  large = false,
}: {
  hechas: number;
  total: number;
  titulo: string;
  detalle: string;
  antetitulo?: string;
  large?: boolean;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[26px] px-5 py-5 sm:px-6 text-white flex items-center gap-4.5"
      style={{ backgroundImage: "linear-gradient(140deg, #4f7d83 0%, #3f6a70 55%, #2f5459 100%)" }}
      aria-label={`${hechas} de ${total} actividades hechas`}
    >
      <span aria-hidden="true" className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/[0.07]" />
      <span aria-hidden="true" className="absolute right-10 -bottom-14 w-28 h-28 rounded-full bg-mostaza-vital/15" />
      <AnilloAvance hechas={hechas} total={total} lado={large ? 104 : 88} />
      <div className="relative min-w-0">
        {antetitulo && <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase font-semibold text-[#c4dbdb]">{antetitulo}</p>}
        <p className={`m-0 font-serif leading-tight ${large ? "text-[26px]" : "text-[22px]"}`}>{titulo}</p>
        <p className={`m-0 mt-1 text-white/85 ${large ? "text-[18px]" : "text-[15px]"}`}>{detalle}</p>
      </div>
    </section>
  );
}
