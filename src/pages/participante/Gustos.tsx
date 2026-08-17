import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { getInterestLabels } from "../../lib/patient";

export function Gustos() {
  const navigate = useNavigate();
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const options = getInterestLabels(onboarding2).slice(0, 3);

  return (
    <>
      <p className="m-0 text-2xl leading-snug">¿Cuál de estas cosas le gusta más?</p>
      <div className="grid gap-3">
        {options.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`min-h-19 rounded-2xl border-2 font-sans text-[22px] font-semibold cursor-pointer ${
              i === 0 ? "border-verde-serenidad bg-[#edf4f4]" : "border-borde bg-white"
            }`}
          >
            {label}
          </button>
        ))}
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
