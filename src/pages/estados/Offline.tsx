import { Button } from "../../components/ui/Button";

export function Offline() {
  return (
    <div className="max-w-[620px] mx-auto px-5 pt-12 pb-16 sm:px-8 lg:pt-16 lg:pb-20 text-center">
      <div className="w-16 h-16 rounded-full bg-beige-serenidad mx-auto mb-6" />
      <h1 className="font-serif font-normal text-[28px] sm:text-[34px] leading-[1.16] lg:leading-[1.14] m-0 mb-3">Sin conexión</h1>
      <p className="m-0 mb-6.5 text-base sm:text-lg leading-relaxed text-tinta-suave">
        La actividad de hoy y sus instrucciones ya están descargadas. Podés hacerla igual: el registro se guarda y se envía cuando vuelva
        el internet.
      </p>
      <div className="bg-white border border-borde rounded-2xl p-5 text-[16px] leading-relaxed text-tinta-tenue mb-6.5">
        Las actividades y la biblioteca no están disponibles ahora mismo.
      </div>
      <Button to="/app/hoy">Continuar sin conexión</Button>
    </div>
  );
}
