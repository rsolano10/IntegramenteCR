import { Link } from "react-router-dom";
import { NotifyButton, NotifyState } from "../../components/ui/NotifyBar";

export function Cambio() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-12 lg:pb-20">
      <div className="bg-white border-[1.5px] border-alerta-borde rounded-3xl overflow-hidden">
        <div className="bg-alerta p-5 sm:p-7.5">
          <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-[15px] font-bold text-alerta-texto">
            <span className="w-2.5 h-2.5 rounded-full bg-semaforo-rojo" />
            Requiere valoración médica
          </span>
          <h1 className="font-serif font-normal text-[26px] sm:text-[34px] leading-[1.16] lg:leading-[1.14] mt-4.5 mb-2.5">
            Un cambio brusco no es «la enfermedad avanzando»
          </h1>
          <p className="m-0 text-base sm:text-[18px] leading-relaxed text-[#6e4436]">
            Cuando algo cambia en horas o días, casi siempre hay una causa tratable detrás.
          </p>
        </div>
        <div className="p-5 sm:p-7.5 grid gap-5">
          <div>
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Causas frecuentes y tratables</p>
            <div className="grid gap-2 text-[17px] leading-relaxed text-tinta-suave">
              <span>Infección urinaria o respiratoria.</span>
              <span>Deshidratación o estreñimiento.</span>
              <span>Un medicamento nuevo o una dosis cambiada.</span>
              <span>Dolor no expresado.</span>
            </div>
          </div>
          <div className="bg-aviso rounded-2xl p-5 text-[17px] leading-relaxed text-semaforo-amarillo-texto">
            Consultá hoy si además hay fiebre, mucho sueño, no reconoce el lugar o dejó de comer y beber.
          </div>
          <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">
            Suspendimos las actividades nuevas hasta que haya una valoración. Anotá cuándo empezó y qué notaste: eso le sirve a quien la
            atienda.
          </p>
          <div className="border-t border-[#efeada] pt-5 flex gap-3 flex-wrap items-center">
            <NotifyButton />
            <Link
              to="/app/hoy"
              className="min-h-13 px-5.5 inline-flex items-center border-[1.5px] border-borde rounded-full font-sans text-[16px] font-semibold text-tinta hover:border-verde-serenidad"
            >
              Volver a Hoy
            </Link>
          </div>
          <NotifyState />
        </div>
      </div>
    </div>
  );
}
