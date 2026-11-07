import { lazy, Suspense, useState } from "react";
import { useMyPatient } from "../../lib/useMyPatient";
import { programas } from "../../lib/programas";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { Icono } from "../../components/landing/Piezas";

// Clara trae el SDK de ElevenLabs (voz en tiempo real, ~600 kB): se carga
// solo al entrar a Ayuda, no con el resto de la app.
const Asistente = lazy(() => import("./Asistente").then((m) => ({ default: m.Asistente })));

// Ayuda = Clara (agente de ElevenLabs, por texto o por voz, con las reglas
// de riesgo de siempre) en una pantalla tipo chat y, para lo que necesita a
// un profesional, WhatsApp (botón fijo en el encabezado): es el único canal
// con el equipo de salud, la app no tiene chat con la clínica.
export function Ayuda() {
  const { data: myPatient } = useMyPatient();
  const autoguiado = myPatient?.modalidad === "autoguiado";

  // Pantalla tipo WhatsApp: el saludo de siempre y la barra para escribir
  // quedan fijos. El aviso de la semana gratis ya se ve en Hoy y Mi semana,
  // así que acá no se repite; el acceso a una persona por WhatsApp es una
  // línea compacta dentro de la conversación.
  return (
    <Suspense fallback={<div className="h-full" />}>
      <Asistente extras={autoguiado ? <SesionesEnVivo paciente={myPatient?.nombre} /> : undefined} />
    </Suspense>
  );
}

// Lo que suma el programa con sesiones profesionales (id "orientado") sobre
// el Autoguiado, con su requisito de ingreso.
function SesionesEnVivo({ paciente }: { paciente?: string }) {
  const orientado = programas.find((p) => p.id === "orientado")!;
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-[24px] border border-borde bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center gap-3.5 px-4.5 py-4 bg-transparent border-0 cursor-pointer text-left font-sans"
      >
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-mostaza-vital text-tinta flex items-center justify-center">
          <Icono name="profesional" className="w-6 h-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-tinta">¿Querés sesiones con el equipo?</span>
          <span className="block mt-0.5 text-[13.5px] leading-snug text-tinta-tenue">Conocé el programa con sesiones profesionales.</span>
        </span>
        <span aria-hidden="true" className={`text-[20px] text-tinta-tenue transition-transform ${abierto ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      {abierto && (
        <div className="px-4.5 pb-4.5 border-t border-borde-suave pt-3.5">
          <ul className="list-none m-0 p-0 grid gap-2">
            {orientado.incluye.slice(1).map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-tinta">
                <span className="text-verde-serenidad font-bold">✓</span>
                {i}
              </li>
            ))}
          </ul>
          {orientado.requisito && <p className="m-0 mt-3 text-[13.5px] leading-relaxed text-tinta-suave">{orientado.requisito}</p>}
          <a
            href={waEquipo("Quiero información para pasarnos al programa con sesiones profesionales.", paciente)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-3.5 min-h-10 px-4 rounded-full bg-verde-profundo text-white text-[14px] font-semibold no-underline hover:bg-tinta"
          >
            <WhatsAppIcon size={16} /> Consultar por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
