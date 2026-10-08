import { useSearchParams } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { useUnreadMensajes } from "../../lib/useMensajes";
import { programas } from "../../lib/programas";
import { Asistente } from "./Asistente";
import { ConversacionProfesional } from "./Mensajes";

type Seccion = "profesional" | "dudas";

// Ayuda = las dos formas de resolver una duda: respuestas inmediatas
// (asistente con protocolos revisados) o la conversación con el equipo de
// salud, disponible en los dos programas.
export function Ayuda() {
  const [params, setParams] = useSearchParams();
  const { data: myPatient } = useMyPatient();
  const unread = useUnreadMensajes(myPatient?.id);
  const orientado = myPatient?.modalidad !== "autoguiado";
  const requested = params.get("tab") as Seccion | null;
  const seccion: Seccion = requested ?? "profesional";

  const opciones: { id: Seccion; label: string; badge?: number }[] = [
    { id: "profesional", label: "Tu profesional", badge: unread },
    { id: "dudas", label: "Respuestas rápidas" },
  ];

  return (
    <div>
      <div role="tablist" className="inline-flex p-1 rounded-full bg-pastilla-fondo mb-5">
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={seccion === o.id}
            onClick={() => setParams({ tab: o.id }, { replace: true })}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14.5px] font-semibold cursor-pointer border-none ${
              seccion === o.id ? "bg-white text-tinta shadow-sm" : "bg-transparent text-tinta-suave"
            }`}
          >
            {o.label}
            {!!o.badge && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-semaforo-rojo text-white text-[11.5px] font-bold inline-flex items-center justify-center">{o.badge}</span>
            )}
          </button>
        ))}
      </div>

      {seccion === "dudas" && <Asistente embedded />}

      {seccion === "profesional" && myPatient && (
        <>
          {!orientado && <SesionesEnVivo />}
          <ConversacionProfesional patientId={myPatient.id} />
        </>
      )}
    </div>
  );
}

// Los dos programas tienen al equipo de salud revisando el plan (y la
// conversación). Lo que suma Orientado son las sesiones en vivo y el
// acompañamiento cercano — se cuenta acá, sin interrumpir el chat.
function SesionesEnVivo() {
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
        {orientado.precio} {orientado.periodo}. Para cambiarte, escribinos por acá mismo o a <strong className="text-tinta-suave">info@integramente.com</strong>.
      </p>
    </details>
  );
}
