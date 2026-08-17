import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { todayFeaturedTask } from "../../lib/patient";

export function Pasos() {
  const navigate = useNavigate();
  const plan = useAppStore((s) => s.plan);
  const paso = useAppStore((s) => s.paso);
  const pasoNext = useAppStore((s) => s.pasoNext);
  const markRegistro = useAppStore((s) => s.markRegistro);

  const featured = todayFeaturedTask(plan);
  const pasos = featured?.task.pasos?.length ? featured.task.pasos : featured ? [featured.task.detalle ?? featured.task.titulo] : [];
  const totalPasos = pasos.length || 1;

  function next() {
    if (paso >= totalPasos) {
      // Finishing the steps herself counts as done, same as familiar registering it.
      if (featured) markRegistro(featured.task.id, "done");
      navigate("/app/participante/hoy");
    } else {
      pasoNext();
    }
  }

  return (
    <>
      <p className="m-0 text-lg text-tinta-tenue">
        Paso {paso} de {totalPasos}
      </p>
      <p className="m-0 text-[30px] leading-snug">{pasos[paso - 1] ?? "Seguí las indicaciones de tu familiar."}</p>
      <div className="h-[150px] rounded-[20px] im-placeholder" />
      <button
        type="button"
        className="min-h-17 border-none rounded-2xl bg-beige-serenidad text-tinta font-sans text-[22px] font-bold cursor-pointer"
      >
        ▶ Escuchar
      </button>
      <button
        type="button"
        onClick={next}
        className="min-h-19 border-none rounded-2xl bg-tinta text-white font-sans text-2xl font-bold cursor-pointer mt-auto hover:bg-verde-profundo"
      >
        {paso >= totalPasos ? "Ya lo hice" : "Listo, siguiente"}
      </button>
      <button
        type="button"
        onClick={() => navigate("/app/participante/ayuda")}
        className="min-h-17 border-2 border-mostaza-vital rounded-2xl bg-aviso text-[#4a3a1b] font-sans text-[22px] font-bold cursor-pointer"
      >
        Necesito ayuda
      </button>
    </>
  );
}
