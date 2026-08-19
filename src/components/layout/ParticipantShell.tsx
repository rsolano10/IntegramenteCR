import { Outlet } from "react-router-dom";
import { useAppStore } from "../../lib/store";

function PendienteRevision() {
  return (
    <div className="flex flex-col gap-6 flex-1 justify-center text-center">
      <p className="m-0 text-[30px] leading-snug font-serif">Ya casi está listo</p>
      <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">
        Tu equipo está preparando tus actividades. Pronto vas a tener novedades.
      </p>
    </div>
  );
}

export function ParticipantShell() {
  const planStatus = useAppStore((s) => s.planStatus);
  const pendiente = planStatus === "pendiente";

  return (
    <div className="im-in min-h-full flex flex-col">
      <div className="bg-beige-serenidad px-5 py-6 sm:px-8">
        <div className="max-w-xl mx-auto">
          <p className="m-0 mb-1.5 text-lg text-tinta-suave">Miércoles</p>
          <h1 className="font-serif font-normal text-[28px] sm:text-[32px] m-0">Hola, Rosa</h1>
        </div>
      </div>
      <div className="flex-1 px-5 py-6 sm:px-8 flex justify-center">
        <div className="w-full max-w-xl flex flex-col gap-5.5">{pendiente ? <PendienteRevision /> : <Outlet />}</div>
      </div>
    </div>
  );
}
