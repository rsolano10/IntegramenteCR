import { useNavigate } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { useAppStore } from "../../lib/store";

export function ParticipanteHoy() {
  const navigate = useNavigate();
  const resetPasos = useAppStore((s) => s.resetPasos);

  return (
    <>
      <div>
        <p className="m-0 mb-2.5 text-xl text-tinta-suave">Hoy toca:</p>
        <h3 className="font-serif font-normal text-[32px] leading-[1.15] m-0">Preparar una merienda con Marcela</h3>
      </div>
      <ImagePlaceholder label="foto de la actividad" height={170} rounded="rounded-[20px]" />
      <button
        type="button"
        onClick={() => {
          resetPasos();
          navigate("/app/participante/pasos");
        }}
        className="min-h-19 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-2xl font-bold cursor-pointer mt-auto hover:bg-verde-profundo"
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
