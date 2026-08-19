import { Link, useNavigate } from "react-router-dom";

const situations: { title: string; detail: string; to: string }[] = [
  { title: "Se cayó o se lastimó", detail: "Golpe, caída, dolor que antes no tenía.", to: "/app/alerta/caida" },
  {
    title: "Cambió de golpe",
    detail: "Confusión repentina, fiebre, ya no reconoce el lugar.",
    to: "/app/alerta/cambio",
  },
  { title: "No la encuentro / salió sola", detail: "Se fue de la casa y no sé dónde está.", to: "/app/alerta/extravio" },
  {
    title: "Me preocupa que se lastime a propósito",
    detail: "Dijo que no quiere seguir viviendo, o algo parecido.",
    to: "/app/alerta/ideacion",
  },
  { title: "Sospecho maltrato o abandono", detail: "De parte de otra persona que la cuida.", to: "/app/alerta/maltrato" },
];

// The one visible, always-there door into the crisis screens — before this,
// ideación/maltrato only opened if someone typed the right phrase into the
// Dudas chat. Deliberately calm, not alarming: this is "help me find the
// right thing", not itself a declaration of emergency.
export function Emergencia() {
  const navigate = useNavigate();

  return (
    <div className="im-in max-w-[680px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-14 lg:pb-20">
      <Link to="/app/asistente" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver a Dudas
      </Link>
      <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">¿Qué está pasando?</p>
      <h1 className="font-serif font-normal text-[26px] sm:text-[34px] leading-[1.16] m-0 mb-3">Contame para orientarte mejor</h1>
      <p className="m-0 mb-7 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
        Elegí lo que más se parece a lo que está pasando. Si es una urgencia médica que no puede esperar, llamá al{" "}
        <strong className="text-tinta">9-1-1</strong> ahora mismo.
      </p>

      <div className="grid gap-2.5 mb-6">
        {situations.map((s) => (
          <button
            key={s.to}
            type="button"
            onClick={() => navigate(s.to)}
            className="text-left px-5 py-4 rounded-2xl border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
          >
            <strong className="block text-[17px] mb-1">{s.title}</strong>
            <span className="text-[15px] text-tinta-suave">{s.detail}</span>
          </button>
        ))}
      </div>

      <div className="bg-alerta border border-alerta-borde rounded-2xl p-4.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[15px] text-alerta-texto">¿Nada de esto encaja, pero igual es urgente?</span>
        <a
          href="tel:911"
          className="min-h-11 px-4 inline-flex items-center rounded-full bg-semaforo-rojo text-white font-sans text-[15px] font-bold"
        >
          Llamar al 9-1-1
        </a>
      </div>
    </div>
  );
}
