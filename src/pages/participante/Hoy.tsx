import { useNavigate } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { useAppStore } from "../../lib/store";
import { todayFeaturedTask } from "../../lib/patient";

export function ParticipanteHoy() {
  const navigate = useNavigate();
  const plan = useAppStore((s) => s.plan);
  const resetPasos = useAppStore((s) => s.resetPasos);
  const featured = todayFeaturedTask(plan);

  return (
    <>
      <div>
        <p className="m-0 mb-2.5 text-xl text-tinta-suave">Hoy toca:</p>
        <h3 className="font-serif font-normal text-[32px] leading-[1.15] m-0">
          {featured ? featured.task.titulo : "Todavía no hay actividad para hoy"}
        </h3>
      </div>
      <ImagePlaceholder label="foto de la actividad" height={170} rounded="rounded-[20px]" />
      <button
        type="button"
        disabled={!featured}
        onClick={() => {
          resetPasos();
          navigate("/app/participante/pasos");
        }}
        className="min-h-19 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-2xl font-bold cursor-pointer mt-auto hover:bg-verde-profundo disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Empezar
      </button>
      <button
        type="button"
        onClick={() => navigate("/app/participante/ayuda")}
        className="min-h-17 border-2 border-mostaza-vital rounded-2xl bg-aviso text-[#4a3a1b] font-sans text-[22px] font-bold cursor-pointer hover:bg-mostaza-vital"
      >
        Necesito ayuda
      </button>
    </>
  );
}
