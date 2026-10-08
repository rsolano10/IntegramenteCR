import { useSearchParams } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { useUnreadMensajes } from "../../lib/useMensajes";
import { programas } from "../../lib/programas";
import { Asistente } from "./Asistente";
import { ConversacionProfesional } from "./Mensajes";

type Seccion = "profesional" | "dudas";

// Ayuda = las dos formas de resolver una duda: respuestas inmediatas
// (asistente con protocolos revisados) o tu profesional (programa
// Orientado). En Autoguiado no hay profesional asignada — en su lugar se
// explica qué agrega Orientado.
export function Ayuda() {
  const [params, setParams] = useSearchParams();
  const { data: myPatient } = useMyPatient();
  const unread = useUnreadMensajes(myPatient?.id);
  const orientado = myPatient?.modalidad !== "autoguiado";
  const requested = params.get("tab") as Seccion | null;
  const seccion: Seccion = requested ?? (orientado ? "profesional" : "dudas");

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

      {seccion === "profesional" && myPatient && (orientado ? <ConversacionProfesional patientId={myPatient.id} /> : <SinProfesional />)}
    </div>
  );
}

function SinProfesional() {
  const orientado = programas.find((p) => p.id === "orientado")!;
  return (
    <div className="bg-white border border-borde rounded-3xl p-5 sm:p-7">
      <p className="m-0 mb-1 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Programa Autoguiado</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-2.5">Tu programa no incluye una profesional asignada</h3>
      <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta-suave">
        Mientras tanto, las respuestas rápidas cubren las dudas más comunes del cuidado. Si querés a alguien que revise cómo les va cada
        semana y te responda directamente, el programa {orientado.nombre} agrega:
      </p>
      <ul className="list-none m-0 p-0 grid gap-2 mb-5">
        {orientado.incluye.slice(1).map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-[15px] text-tinta">
            <span className="text-verde-serenidad font-bold">✓</span>
            {i}
          </li>
        ))}
      </ul>
      <p className="m-0 text-[14px] text-tinta-tenue">
        {orientado.precio} {orientado.periodo}. Para cambiarte, escribinos a <strong className="text-tinta-suave">info@integramente.com</strong> o
        llamanos al <strong className="text-tinta-suave">+506 8343 5772</strong>.
      </p>
    </div>
  );
}
