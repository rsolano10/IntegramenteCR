import { Button } from "../../components/ui/Button";

export function Vacio() {
  return (
    <div className="max-w-[620px] mx-auto px-5 pt-12 pb-16 sm:px-8 lg:pt-16 lg:pb-20 text-center">
      <div className="w-16 h-16 rounded-[20px] bg-[#edf4f4] mx-auto mb-6" />
      <h1 className="font-serif font-normal text-[28px] sm:text-[34px] leading-[1.16] lg:leading-[1.14] m-0 mb-3">Todavía no hay plan</h1>
      <p className="m-0 mb-6.5 text-base sm:text-lg leading-relaxed text-tinta-suave">
        Falta completar el perfil funcional. Son unos minutos y se guarda solo: podés dejarlo a medias y seguir después.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button to="/app/perfil/bienvenida">Continuar el perfil</Button>
        <Button variant="secondary" to="/app/actividades">
          Ver actividades
        </Button>
      </div>
    </div>
  );
}
