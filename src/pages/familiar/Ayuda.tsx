import { useMyPatient } from "../../lib/useMyPatient";
import { programas } from "../../lib/programas";
import { waEquipo } from "../../lib/whatsapp";
import { BotonWhatsApp } from "../../components/ui/BotonWhatsApp";
import { Asistente } from "./Asistente";

// Ayuda = respuestas rápidas al momento (asistente con IA y reglas de
// riesgo) y, para lo que necesita a un profesional, WhatsApp: es el único
// canal con el equipo de salud, la app no tiene chat con la clínica.
export function Ayuda() {
  const { data: myPatient } = useMyPatient();
  const autoguiado = myPatient?.modalidad === "autoguiado";

  return (
    <div>
      <HablarConEquipo paciente={myPatient?.nombre} />
      {autoguiado && <SesionesEnVivo paciente={myPatient?.nombre} />}
      <Asistente embedded />
    </div>
  );
}

function HablarConEquipo({ paciente }: { paciente?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borde bg-white px-4.5 py-3.5">
      <div className="min-w-0">
        <p className="m-0 text-[15px] font-semibold text-tinta">¿Necesitás hablar con un profesional?</p>
        <p className="m-0 mt-0.5 text-[13.5px] text-tinta-tenue">Nuestro equipo de salud te atiende por WhatsApp.</p>
      </div>
      <BotonWhatsApp href={waEquipo(undefined, paciente)} />
    </div>
  );
}

// Los dos programas tienen al equipo de salud revisando el plan. Lo que
// suma Orientado son la evaluación, las sesiones en vivo y el
// acompañamiento cercano: se cuenta acá, sin interrumpir el chat.
function SesionesEnVivo({ paciente }: { paciente?: string }) {
  const orientado = programas.find((p) => p.id === "orientado")!;
  return (
    <details className="mb-5 rounded-2xl border border-borde bg-white px-4.5 py-3.5">
      <summary className="cursor-pointer text-[14.5px] font-semibold text-tinta">
        ¿Querés sesiones en vivo con nuestros profesionales? <span className="text-verde-profundo">Conocé el programa {orientado.nombre}</span>
      </summary>
      <ul className="list-none m-0 mt-3 p-0 grid gap-2">
        {orientado.incluye.slice(1).map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-tinta">
            <span className="text-verde-serenidad font-bold">✓</span>
            {i}
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 text-[13.5px] text-tinta-tenue">
        Para cambiarte,{" "}
        <a
          href={waEquipo(`Quiero información para pasarnos al programa ${orientado.nombre}.`, paciente)}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-verde-profundo"
        >
          escribinos por WhatsApp
        </a>
        .
      </p>
    </details>
  );
}
