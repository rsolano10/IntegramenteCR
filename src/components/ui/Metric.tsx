export function Metric({ value, label, tone = "verde" }: { value: string; label: string; tone?: "verde" | "amarillo" | "rojo" }) {
  const toneClass = tone === "amarillo" ? "text-semaforo-amarillo-texto" : tone === "rojo" ? "text-semaforo-rojo" : "text-verde-profundo";
  const bg = tone === "amarillo" ? "bg-fila-calida" : "bg-fila-fria";
  return (
    <div className={`rounded-2xl p-4.5 ${bg}`}>
      <div className={`font-serif text-[32px] ${toneClass}`}>{value}</div>
      <p className="m-0 mt-1 text-[15px] text-tinta-suave">{label}</p>
    </div>
  );
}
