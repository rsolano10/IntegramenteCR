import { useState } from "react";
import type { MyPatient } from "../../lib/useMyPatient";
import { iniciarCompra } from "../../lib/pagos";
import { waEquipo } from "../../lib/whatsapp";
import { BotonWhatsApp } from "../ui/BotonWhatsApp";

// Avisos según el estado de la cuenta (Fase 4.1), arriba del contenido de
// la familia o del participante. Nunca bloquean la app (salvo el rechazo):
// el seguimiento al terminar la demo lo hace la clínica a mano.

function diasRestantes(fin: string | null): number {
  if (!fin) return 0;
  return Math.max(0, Math.ceil((new Date(fin).getTime() - Date.now()) / 86_400_000));
}

export function AvisoEstadoCuenta({ patient, nombreCuenta }: { patient: MyPatient; nombreCuenta: string }) {
  const [abriendo, setAbriendo] = useState(false);
  const comprar = async () => {
    setAbriendo(true);
    try {
      await iniciarCompra({ nombreCuenta, nombrePaciente: patient.nombre, programa: patient.modalidad === "orientado" ? "orientado" : "autoguiado" });
    } finally {
      setAbriendo(false);
    }
  };
  const boton = (texto: string) => (
    <button
      type="button"
      onClick={comprar}
      disabled={abriendo}
      className="shrink-0 inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-verde-profundo text-white font-semibold text-[15px] border-0 cursor-pointer hover:bg-tinta disabled:opacity-60"
    >
      {texto}
    </button>
  );
  const caja = "rounded-3xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3";

  switch (patient.estado_cuenta) {
    case "pendiente_aprobacion":
      if (!patient.tiene_plan_visible) return null;
      return (
        <div className={`${caja} bg-verde-tenue border border-borde`}>
          <div className="flex-1">
            <p className="m-0 text-[15.5px] font-semibold text-tinta">Estamos revisando tu cuenta</p>
            <p className="m-0 mt-0.5 text-[14px] leading-relaxed text-tinta-suave">
              Mientras tanto, conocé la app con estas actividades de bienvenida. Tu semana gratis empieza cuando la aprobemos.
            </p>
          </div>
        </div>
      );
    case "en_demo": {
      const n = diasRestantes(patient.demo_fin);
      return (
        <div className={`${caja} bg-fila-calida border border-mostaza-vital`}>
          <div className="flex-1">
            <p className="m-0 text-[15.5px] font-semibold text-tinta">
              Semana gratis: {n <= 1 ? "último día" : `te quedan ${n} días`}
            </p>
            <p className="m-0 mt-0.5 text-[14px] text-tinta-suave">Si te gusta, activá tu programa y seguimos juntos.</p>
          </div>
          {boton("Activar mi programa")}
        </div>
      );
    }
    case "demo_finalizada":
      return (
        <div className={`${caja} bg-white border-[1.5px] border-verde-serenidad`}>
          <div className="flex-1">
            <p className="m-0 text-[15.5px] font-semibold text-tinta">Terminó tu semana gratis</p>
            <p className="m-0 mt-0.5 text-[14px] text-tinta-suave">¿Seguimos? Activá tu programa o escribinos con tus dudas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {boton("Activar mi programa")}
            <BotonWhatsApp href={waEquipo("Terminó mi semana gratis y tengo una consulta.", patient.nombre)} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function CuentaRechazada({ patient }: { patient: MyPatient }) {
  return (
    <div className="max-w-[560px] mx-auto pt-4 pb-16">
      <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-tight m-0 mb-3">Revisamos la solicitud de {patient.nombre}</h1>
      <p className="m-0 mb-5 text-[16px] leading-relaxed text-tinta-suave">
        Gracias por confiar en IntegraMente. Por ahora no podemos habilitar esta cuenta. El equipo te dejó este mensaje:
      </p>
      {patient.rechazo_motivo && (
        <div className="bg-white border border-borde border-l-4 border-l-verde-serenidad rounded-3xl p-5 mb-6">
          <p className="m-0 text-[16px] leading-relaxed text-tinta whitespace-pre-wrap">{patient.rechazo_motivo}</p>
        </div>
      )}
      <div className="bg-campo border border-borde-suave rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="m-0 flex-1 text-[15px] leading-relaxed text-tinta-suave">¿Querés conversarlo? Con gusto vemos otras alternativas.</p>
        <BotonWhatsApp href={waEquipo("Quisiera conversar sobre la revisión de mi solicitud.", patient.nombre)} />
      </div>
    </div>
  );
}
