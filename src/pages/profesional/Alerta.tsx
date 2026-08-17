import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { Button } from "../../components/ui/Button";

export function ProfesionalAlerta() {
  const navigate = useNavigate();
  const pushAudit = useAppStore((s) => s.pushAudit);

  return (
    <div className="im-in max-w-[900px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      <Link to="/app/profesional/panel" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver al panel
      </Link>
      <div className="bg-white border-[1.5px] border-alerta-borde rounded-3xl overflow-hidden">
        <div className="bg-alerta p-5 sm:p-7.5">
          <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-[15px] font-bold text-alerta-texto">
            <span className="w-2.5 h-2.5 rounded-full bg-semaforo-rojo" />
            Alerta roja · sin revisar
          </span>
          <h1 className="font-serif font-normal text-[26px] sm:text-[34px] mt-4.5 mb-2">Marta Solís · caída reportada</h1>
          <p className="m-0 text-base sm:text-[17px] text-[#6e4436]">11 de agosto, 18:40 · reportado por Laura (hija)</p>
        </div>
        <div className="p-5 sm:p-7.5 grid gap-5">
          <div>
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Qué hizo el sistema automáticamente</p>
            <div className="grid gap-2 text-[17px] leading-relaxed text-tinta-suave">
              <span>Suspendió todas las actividades físicas del plan.</span>
              <span>Mostró a la familia la ruta de atención y el 9-1-1.</span>
              <span>Marcó el caso como rojo y lo elevó a esta bandeja.</span>
            </div>
          </div>
          <div className="bg-campo border border-[#efeada] rounded-2xl p-5">
            <p className="m-0 mb-2 text-[15px] font-bold">Lo que escribió la familia</p>
            <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">
              «Se resbaló en el baño en la tarde. Camina pero se queja de la cadera.»
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="urgency" onClick={() => pushAudit("Alerta", "contacta a la familia", "Dra. Guiselle Solano")}>
              Contactar a la familia
            </Button>
            <Button variant="secondary" onClick={() => pushAudit("Alerta", "registra seguimiento", "Dra. Guiselle Solano")}>
              Registrar seguimiento
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                pushAudit("Plan", "reactiva plan con restricciones", "Dra. Guiselle Solano");
                navigate("/app/profesional/panel");
              }}
            >
              Reactivar plan con restricciones
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
