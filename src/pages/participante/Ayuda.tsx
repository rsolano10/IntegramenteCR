import { useNavigate } from "react-router-dom";

export function Ayuda() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 flex-1 justify-center text-center">
      <p className="m-0 text-[32px] leading-snug font-serif">Ya le avisamos a Marcela</p>
      <p className="m-0 text-[22px] leading-relaxed text-tinta-suave">Esperá tranquila. No hace falta hacer nada más.</p>
      <div className="bg-[#edf4f4] rounded-2xl p-5.5 text-xl text-verde-profundo">
        Marcela · hija
        <br />
        Aviso enviado a las 10:42
      </div>
      <button
        type="button"
        onClick={() => navigate("/app/participante/hoy")}
        className="min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[22px] font-bold cursor-pointer hover:bg-verde-profundo"
      >
        Volver
      </button>
    </div>
  );
}
