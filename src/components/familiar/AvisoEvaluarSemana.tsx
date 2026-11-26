import { Link } from "react-router-dom";
import { rangoSemana, semanaTerminada } from "../../lib/planWeek";

// El pedido de evaluar la semana, igual en Hoy (familia y participante) y
// en Mi semana: mismo texto, mismo botón. Si la semana ya terminó
// (`publishAt`), se dice que es la ANTERIOR y de qué fechas, para que no se
// confunda con la semana en curso. Si sigue en curso y se hizo todo:
// «¡Semana completa!».
export function AvisoEvaluarSemana({ to, large = false, completa = true, publishAt }: { to: string; large?: boolean; completa?: boolean; publishAt?: string | null }) {
  const anterior = !!publishAt && semanaTerminada(publishAt);
  const titulo = anterior ? "Falta evaluar la semana anterior" : completa ? "¡Semana completa!" : "Falta evaluar la semana anterior";
  const detalle = anterior ? `La del ${rangoSemana(publishAt!)}. Contanos cómo estuvo: son tres preguntas.` : "Contanos cómo estuvo: son tres preguntas.";
  return (
    <section className={`border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-[22px] ${large ? "p-5" : "p-4.5 sm:p-5"}`}>
      <p className={`m-0 mb-1 font-bold text-verde-profundo ${large ? "text-[22px]" : "text-[17px]"}`}>{titulo}</p>
      <p className={`m-0 mb-3.5 text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>{detalle}</p>
      <Link
        to={to}
        className={`inline-flex items-center justify-center rounded-full bg-verde-profundo text-white font-semibold no-underline hover:bg-tinta transition-colors ${
          large ? "w-full min-h-16 text-[20px]" : "min-h-12 px-6 text-[16px]"
        }`}
      >
        {anterior ? "Evaluar la semana anterior" : "Evaluar la semana"}
      </Link>
    </section>
  );
}

// Cuando ya la evaluaron y el equipo prepara la próxima.
export function AvisoSemanaEnRevision({ large = false }: { large?: boolean }) {
  return (
    <section className="border border-borde bg-white rounded-[22px] p-5">
      <p className={`m-0 leading-relaxed text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>
        El equipo está mirando la semana. Pronto vas a tener su mensaje y las actividades de la próxima.
      </p>
    </section>
  );
}
