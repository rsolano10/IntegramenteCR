import { Link } from "react-router-dom";
import { NotifyButton, NotifyState } from "../../components/ui/NotifyBar";

export function Extravio() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-12 lg:pb-20">
      <div className="bg-white border-[1.5px] border-riesgo-borde rounded-3xl overflow-hidden">
        <div className="bg-riesgo p-5 sm:p-7.5">
          <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-[15px] font-bold text-riesgo-texto">
            <span className="w-2.5 h-2.5 rounded-full bg-semaforo-amarillo" />
            Prevención activada
          </span>
          <h1 className="font-serif font-normal text-[26px] sm:text-[34px] leading-[1.16] lg:leading-[1.14] mt-4.5 mb-2.5">
            Desorientación y salidas de la casa
          </h1>
          <p className="m-0 text-base sm:text-[18px] leading-relaxed text-riesgo-texto">
            La mayoría de los extravíos ocurren en trayectos conocidos y a la misma hora del día.
          </p>
        </div>
        <div className="p-5 sm:p-7.5 grid gap-5">
          <div>
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Si no está en la casa ahora</p>
            <div className="grid gap-2 text-[17px] leading-relaxed text-tinta-suave">
              <span>
                Llamá al <strong>9-1-1</strong> sin esperar 24 horas: en personas mayores con deterioro cognitivo la búsqueda es urgente.
              </span>
              <span>Revisá primero los lugares de su historia: la casa anterior, la iglesia, la parada del bus.</span>
              <span>Tené a mano una foto reciente y la ropa que llevaba.</span>
            </div>
          </div>
          <div>
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Para prevenir</p>
            <div className="grid gap-2 text-[17px] leading-relaxed text-tinta-suave">
              <span>Identificación con nombre y teléfono en la ropa, el bolso y la billetera.</span>
              <span>Avisá a un vecino de confianza y al pulpero del barrio.</span>
              <span>Ofrecé una caminata acompañada a la hora en que suele querer salir.</span>
              <span>No discutas para retenerla: acompañá y redirigí.</span>
            </div>
          </div>
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
