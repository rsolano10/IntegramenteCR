import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { Button } from "../../components/ui/Button";
import { planEditorRows, planRestrictions, planHistory } from "../../lib/mockData";

const restrictionDot: Record<"verde" | "amarillo", string> = {
  verde: "bg-semaforo-verde",
  amarillo: "bg-semaforo-amarillo",
};

export function Editor() {
  const navigate = useNavigate();
  const pushAudit = useAppStore((s) => s.pushAudit);

  function publish() {
    pushAudit("Plan", "publica el plan ajustado a la familia", "Dra. Guiselle Solano");
    navigate("/app/profesional/panel");
  }

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      <Link to="/app/profesional/panel" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver al panel
      </Link>
      <h1 className="font-serif font-normal text-[26px] sm:text-[34px] m-0 mb-1.5">Plan de Rosa · semana del 17 al 23</h1>
      <p className="m-0 mb-6.5 text-base sm:text-[17px] text-tinta-tenue">
        Propuesta generada por reglas. Cada cambio se registra y la familia ve el motivo.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div className="bg-white border border-borde rounded-3xl p-4 sm:p-7 grid gap-3">
          {planEditorRows.map((row) => (
            <div
              key={row.dia}
              className="flex flex-col sm:grid sm:grid-cols-[90px_1fr_auto] gap-2.5 sm:gap-3.5 sm:items-center p-3.5 sm:p-4 rounded-2xl bg-fila-fria"
            >
              <span className="text-sm font-bold text-verde-profundo">{row.dia}</span>
              <span className="text-[16px]">
                {row.titulo}
                {row.nota && (
                  <>
                    <br />
                    <span className="text-sm text-semaforo-amarillo-texto">{row.nota}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => pushAudit("Plan", `cambia ítem de ${row.dia}`, "Dra. Guiselle Solano")}
                className="self-start min-h-10 px-3.5 rounded-full border-[1.5px] border-borde bg-white font-sans text-sm font-semibold cursor-pointer hover:border-verde-serenidad"
              >
                Cambiar
              </button>
            </div>
          ))}
          <div className="border-t border-[#efeada] pt-4.5 mt-1.5 flex gap-3 flex-wrap">
            <Button variant="ink" dense onClick={publish}>
              Publicar a la familia
            </Button>
            <Button variant="secondary" dense onClick={() => pushAudit("Plan", "guarda borrador", "Dra. Guiselle Solano")}>
              Guardar borrador
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-white border border-borde rounded-2xl p-6">
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Restricciones activas</p>
            <div className="grid gap-2.5 text-[16px] leading-relaxed text-tinta-suave">
              {planRestrictions.map((r) => (
                <span key={r.texto} className="grid grid-cols-[12px_1fr] gap-3 items-start">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${restrictionDot[r.color]}`} />
                  {r.texto}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-campo border border-[#efeada] rounded-2xl p-6">
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Historial</p>
            <div className="grid gap-2.5 text-[15px] leading-relaxed text-tinta-tenue">
              {planHistory.map((h) => (
                <span key={h.quien}>
                  <strong className="text-tinta">{h.quien}</strong> {h.que}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
