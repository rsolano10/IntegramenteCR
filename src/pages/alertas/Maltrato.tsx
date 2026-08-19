import { Link } from "react-router-dom";
import { NotifyBar } from "../../components/ui/NotifyBar";
import { emergencyContacts } from "../../lib/mockData";

export function Maltrato() {
  const emergencia = emergencyContacts.find((c) => c.id === "emergencia")!;
  const conapam = emergencyContacts.find((c) => c.id === "conapam")!;

  return (
    <div className="min-h-[84vh] bg-alerta flex items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
      <div className="max-w-[680px] bg-white border-2 border-semaforo-rojo rounded-3xl p-6 sm:p-10">
        <p className="m-0 mb-2.5 text-[13px] tracking-[0.16em] uppercase text-alerta-texto">Situación de protección</p>
        <h1 className="font-serif font-normal text-[28px] sm:text-[38px] leading-[1.16] lg:leading-[1.12] m-0 mb-6.5">
          Si sospechás maltrato o abandono
        </h1>
        <p className="m-0 mb-6.5 text-base sm:text-[19px] leading-relaxed text-tinta-suave">
          Incluye golpes, gritos habituales, encierro, falta de comida o medicamentos, y uso indebido del dinero de la persona. No hace
          falta estar seguro para consultar.
        </p>
        <div className="grid gap-3 mb-6.5">
          <div className="bg-alerta rounded-2xl p-5.5">
            <p className="m-0 mb-1 text-[15px] text-alerta-texto font-bold">Riesgo inmediato</p>
            <p className="m-0 font-serif text-[30px]">{emergencia.value}</p>
          </div>
          <div className="bg-alerta rounded-2xl p-5.5">
            <p className="m-0 mb-1 text-[15px] text-alerta-texto font-bold">{conapam.label}</p>
            <p className="m-0 text-[17px] leading-relaxed text-[#6e4436]">{conapam.value} — {conapam.note}</p>
          </div>
          <div className="bg-campo border border-[#efeada] rounded-2xl p-5.5 text-[17px] leading-relaxed text-tinta-suave">
            Guardá lo que observaste con fechas. No confrontes a solas a la persona que te preocupa.
          </div>
        </div>
        <div className="border-t border-[#efeada] pt-5.5 grid gap-3.5">
          <p className="m-0 text-[16px] leading-relaxed text-tinta-suave">Podés hablarlo con la Dra. Solano de forma reservada.</p>
          <NotifyBar />
          <Link to="/app/hoy" className="justify-self-start border-none bg-transparent font-sans text-[15px] text-verde-profundo">
            Volver a la aplicación
          </Link>
        </div>
      </div>
    </div>
  );
}
