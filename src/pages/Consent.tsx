import { useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { CheckRow, RadioRow } from "../components/ui/CheckRow";

export function Consent() {
  const navigate = useNavigate();
  const c1 = useAppStore((s) => s.c1);
  const c2 = useAppStore((s) => s.c2);
  const notify = useAppStore((s) => s.notify);
  const toggleConsent1 = useAppStore((s) => s.toggleConsent1);
  const toggleConsent2 = useAppStore((s) => s.toggleConsent2);
  const setNotify = useAppStore((s) => s.setNotify);

  const canContinue = c1 && c2;

  return (
    <div className="im-in max-w-[760px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-14 lg:pb-20">
      <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Antes de empezar</p>
      <h1 className="font-serif font-normal text-[30px] sm:text-[40px] leading-[1.15] lg:leading-[1.12] m-0 mb-5">
        Qué es y qué no es este programa
      </h1>
      <div className="bg-white border border-borde rounded-3xl p-5 sm:p-7.5 mb-5 grid gap-4 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
        <p className="m-0">
          <strong className="text-tinta">Sí es:</strong> educación, organización del cuidado y actividades de estimulación adaptadas,
          con acompañamiento profesional.
        </p>
        <p className="m-0">
          <strong className="text-tinta">No es:</strong> un diagnóstico, una interpretación de pruebas ni una indicación para cambiar
          tratamientos médicos.
        </p>
        <p className="m-0 bg-aviso text-semaforo-amarillo-texto rounded-xl px-4 py-3.5">
          Ante una urgencia médica, llamá al <strong>9-1-1</strong>. No uses la aplicación para reportar una emergencia.
        </p>
      </div>
      <div className="bg-white border border-borde rounded-3xl p-5 sm:p-7.5 grid gap-4.5">
        <CheckRow checked={c1} onToggle={toggleConsent1}>
          Entiendo el alcance del programa y que no sustituye la atención médica.
        </CheckRow>
        <CheckRow checked={c2} onToggle={toggleConsent2}>
          Autorizo el uso de los datos ingresados para generar el plan y compartirlo con el equipo tratante.
        </CheckRow>
        <div className="border-t border-[#efeada] pt-4.5">
          <p className="m-0 mb-3 text-[15px] font-semibold text-[#3b4c51]">
            Si el sistema detecta una señal de riesgo, ¿querés que se avise a la profesional asignada?
          </p>
          <div className="grid gap-2.5">
            <RadioRow checked={notify === "si"} onSelect={() => setNotify("si")}>
              Sí, avisar a la Dra. Solano
            </RadioRow>
            <RadioRow checked={notify === "no"} onSelect={() => setNotify("no")}>
              No, prefiero decidirlo en el momento
            </RadioRow>
          </div>
          <p className="m-0 mt-3 text-[15px] text-tinta-tenue">Podés cambiarlo cuando aparezca la alerta.</p>
        </div>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => navigate("/app/perfil/bienvenida")}
          className={`min-h-14 rounded-full font-sans font-semibold text-[17px] border-none ${
            canContinue ? "bg-tinta text-white cursor-pointer hover:bg-verde-profundo" : "bg-[#cbd8d9] text-white cursor-not-allowed"
          }`}
        >
          Continuar al perfil funcional
        </button>
      </div>
    </div>
  );
}
