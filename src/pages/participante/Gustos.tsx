import { useNavigate } from "react-router-dom";

export function Gustos() {
  const navigate = useNavigate();
  return (
    <>
      <p className="m-0 text-2xl leading-snug">¿Cuál de estas cosas le gusta más?</p>
      <div className="grid gap-3">
        <button type="button" className="min-h-19 rounded-2xl border-2 border-verde-serenidad bg-[#edf4f4] font-sans text-[22px] font-semibold cursor-pointer">
          Cocinar
        </button>
        <button type="button" className="min-h-19 rounded-2xl border-2 border-borde bg-white font-sans text-[22px] font-semibold cursor-pointer">
          La música
        </button>
        <button type="button" className="min-h-19 rounded-2xl border-2 border-borde bg-white font-sans text-[22px] font-semibold cursor-pointer">
          Las plantas
        </button>
      </div>
      <button
        type="button"
        className="min-h-17 border-none rounded-2xl bg-beige-serenidad text-tinta font-sans text-[22px] font-bold cursor-pointer mt-auto"
      >
        ▶ Escuchar la pregunta
      </button>
      <button
        type="button"
        onClick={() => navigate("/app/participante/hoy")}
        className="min-h-19 border-none rounded-2xl bg-tinta text-white font-sans text-2xl font-bold cursor-pointer hover:bg-verde-profundo"
      >
        Siguiente
      </button>
    </>
  );
}
