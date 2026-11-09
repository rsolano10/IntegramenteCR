import { useMyPatient } from "../../lib/useMyPatient";
import { useSemanasAnteriores } from "../../lib/semanasAnteriores";
import { FilaSemana } from "../../components/familiar/FilaSemana";
import { BotonVolver } from "../../components/ui/BotonVolver";

// Historial completo de semanas anteriores (se llega desde «Ver historial
// completo» en Mi semana). «Volver» regresa a la pantalla de la que se vino.
export function HistorialSemanas() {
  const { data: myPatient } = useMyPatient();
  const { data, isLoading } = useSemanasAnteriores(myPatient?.id, null);
  const semanas = data?.semanas ?? [];

  // Agrupadas por mes («noviembre de 2026»), de lo más reciente a lo más viejo.
  const porMes = new Map<string, typeof semanas>();
  for (const s of semanas) {
    const mes = new Date(s.publish_at).toLocaleDateString("es-CR", { month: "long", year: "numeric" });
    porMes.set(mes, [...(porMes.get(mes) ?? []), s]);
  }

  return (
    <div>
      <BotonVolver respaldo="/app/plan" className="mb-1" />
      <h1 className="font-serif font-normal text-[26px] leading-tight m-0 text-tinta">Historial de semanas</h1>
      <p className="m-0 mt-1 mb-6 text-[15px] text-tinta-suave">
        {isLoading ? "Cargando…" : semanas.length ? `${semanas.length} ${semanas.length === 1 ? "semana anterior" : "semanas anteriores"}.` : "Todavía no hay semanas anteriores."}
      </p>
      <div className="grid gap-6">
        {[...porMes.entries()].map(([mes, lista]) => (
          <section key={mes} aria-label={mes}>
            <h2 className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave first-letter:uppercase">{mes}</h2>
            <div className="grid gap-2">
              {lista.map((s) => (
                <FilaSemana key={s.id} semana={s} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
