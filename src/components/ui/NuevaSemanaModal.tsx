import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CalendarIllustration, CalendarSyncActions } from "./CalendarSyncCard";
import { marcarCalendarioSuscrito, marcarSemanaVista } from "../../lib/calendarPrompt";
import type { PlanDay } from "../../lib/mockData";

// Cada vez que la clínica publica una semana nueva: un resumen de lo que
// trae y la opción de sumarla al calendario del teléfono. Deja de aparecer
// para siempre en cuanto la persona agrega el calendario (la suscripción
// trae las semanas siguientes sola); "Ahora no" solo la cierra hasta la
// próxima semana. También disponible desde el menú del nombre.
export function NuevaSemanaModal({
  userId,
  planId,
  patientId,
  patientNombre,
  plan,
  onClose,
}: {
  userId: string;
  planId: string;
  patientId: string;
  patientNombre: string;
  plan: PlanDay[];
  onClose: () => void;
}) {
  const [agregado, setAgregado] = useState(false);
  const total = plan.reduce((n, d) => n + d.tasks.length, 0);
  const conHora = plan.reduce((n, d) => n + d.tasks.filter((t) => t.hora).length, 0);
  const dias = plan.filter((d) => d.tasks.length > 0).length;

  function cerrar() {
    marcarSemanaVista(userId, planId);
    onClose();
  }

  return (
    <Modal onClose={cerrar}>
      <CalendarIllustration />
      <p className="m-0 mb-1 text-[12px] tracking-[0.14em] uppercase text-verde-profundo font-semibold">Semana nueva</p>
      <h2 className="font-serif font-normal text-[26px] leading-tight m-0 mb-2">La semana de {patientNombre.split(" ")[0]} ya está lista</h2>
      <p className="m-0 mb-5 text-[15px] leading-relaxed text-tinta-suave">
        {total} {total === 1 ? "actividad" : "actividades"} repartidas en {dias} {dias === 1 ? "día" : "días"}.
        {conHora > 0 && " ¿Querés recibir un aviso en tu teléfono a la hora de cada una?"}
      </p>

      {agregado ? (
        <div className="rounded-2xl bg-fila-fria border border-borde-suave p-4 mb-4">
          <p className="m-0 text-[15px] font-semibold text-semaforo-verde-texto">✓ Listo</p>
          <p className="m-0 mt-0.5 text-[14px] text-tinta-suave">Las próximas semanas se van a sumar solas a tu calendario.</p>
        </div>
      ) : (
        <div className="mb-4">
          <CalendarSyncActions
            patientId={patientId}
            onAdded={() => {
              marcarCalendarioSuscrito(userId);
              setAgregado(true);
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-borde-suave">
        <p className="m-0 text-[13px] text-tinta-tenue">Podés hacerlo después desde el menú con tu nombre.</p>
        <div className="flex gap-2">
          {!agregado && (
            <button
              type="button"
              onClick={() => {
                marcarCalendarioSuscrito(userId);
                cerrar();
              }}
              className="text-[13.5px] font-semibold text-tinta-tenue underline decoration-dotted cursor-pointer bg-transparent border-none"
            >
              Ya lo tengo
            </button>
          )}
          <Button variant={agregado ? "ink" : "secondary"} dense onClick={cerrar}>
            {agregado ? "Ver la semana" : "Ahora no"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
