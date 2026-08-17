import { useNavigate } from "react-router-dom";

export function Rechazo() {
  const navigate = useNavigate();
  return (
    <div className="max-w-[720px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-12 lg:pb-20">
      <div className="bg-white border-[1.5px] border-riesgo-borde rounded-3xl p-5 sm:p-8.5">
        <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-riesgo text-[15px] font-bold text-riesgo-texto">
          <span className="w-2.5 h-2.5 rounded-full bg-semaforo-amarillo" />
          Ajuste sugerido
        </span>
        <h1 className="font-serif font-normal text-[26px] sm:text-[34px] leading-[1.16] lg:leading-[1.14] mt-4.5 mb-3">
          Esta actividad no está funcionando
        </h1>
        <p className="m-0 mb-6 text-base sm:text-[18px] leading-relaxed text-tinta-suave">
          Tres registros seguidos sin realizarla. No es falta de voluntad: probablemente la consigna es demasiado larga o el momento del
          día no ayuda.
        </p>
        <div className="grid gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/app/plan")}
            className="text-left min-h-17 px-5 py-4 rounded-2xl border-[1.5px] border-verde-serenidad bg-[#edf4f4] font-sans cursor-pointer"
          >
            <strong className="block text-[17px] mb-1">Bajar la dificultad</strong>
            <span className="text-[16px] text-tinta-suave">Misma actividad, una sola consigna y menos tiempo.</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/actividades")}
            className="text-left min-h-17 px-5 py-4 rounded-2xl border-[1.5px] border-borde bg-white font-sans cursor-pointer hover:border-verde-serenidad"
          >
            <strong className="block text-[17px] mb-1">Cambiarla por otra</strong>
            <span className="text-[16px] text-tinta-suave">Elegimos algo de sus intereses con el mismo objetivo.</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/hoy")}
            className="text-left min-h-17 px-5 py-4 rounded-2xl border-[1.5px] border-borde bg-white font-sans cursor-pointer hover:border-verde-serenidad"
          >
            <strong className="block text-[17px] mb-1">Moverla a otra hora</strong>
            <span className="text-[16px] text-tinta-suave">Sus mejores registros son de mañana.</span>
          </button>
        </div>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-tenue">
          La Dra. Solano verá este ajuste en su próxima revisión. Nada de esto se registra como incumplimiento.
        </p>
      </div>
    </div>
  );
}
