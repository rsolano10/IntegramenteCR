import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { semaforoData } from "../../lib/rules";
import { computeProfiles, overallTier } from "../../lib/clinicalEngine";
import { Button } from "../../components/ui/Button";

export function Ficha() {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const sem = overallTier(computeProfiles(onboarding2));
  const d = semaforoData[sem];
  const pushAudit = useAppStore((s) => s.pushAudit);

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      <Link to="/app/profesional/panel" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver al panel
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="bg-white border border-borde rounded-3xl p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-5.5">
            <div>
              <h1 className="font-serif font-normal text-[28px] sm:text-[34px] m-0 mb-1">Rosa Jiménez</h1>
              <p className="m-0 text-[16px] text-tinta-tenue">79 años · Orientado · familiar administradora: Marcela</p>
            </div>
            <span className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[15px] font-bold ${d.bg} ${d.ink}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
              {d.short}
            </span>
          </div>
          <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Perfil funcional declarado por la familia</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6.5">
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Autonomía</strong>
              Vestido con recordatorios · comida supervisada
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Movilidad</strong>
              Camina con bastón · una caída en 6 meses
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Comprensión</strong>
              Una instrucción por vez
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Intereses</strong>
              Cocina · música · plantas · fotos
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button dense onClick={() => pushAudit("Perfil", "valida el perfil funcional", "Dra. Guiselle Solano")}>
              Validar perfil
            </Button>
            <Button variant="secondary" dense to="/app/profesional/editor">
              Ajustar el plan
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-[#f4f2e7] border-[1.5px] border-dashed border-[#c7be9a] rounded-2xl p-6">
            <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-[#7a5c1c]">Nota interna · no visible para la familia</p>
            <textarea
              defaultValue="Perfil consistente con lo observado en consulta. Vigilar carga de la cuidadora: Marcela reporta agotamiento sin nombrarlo."
              className="w-full min-h-[120px] rounded-xl border-[1.5px] border-[#d8d2b8] bg-white p-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
            />
          </div>
          <div className="bg-white border border-borde rounded-2xl p-6">
            <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-verde-profundo">Mensaje visible para la familia</p>
            <textarea
              defaultValue="Marcela: mantengamos las actividades de la mañana. Bajé la merienda a una sola consigna."
              className="w-full min-h-[100px] rounded-xl border-[1.5px] border-verde-serenidad bg-campo p-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
            />
            <Button
              dense
              variant="ink"
              className="mt-3"
              onClick={() => pushAudit("Mensaje", "envía mensaje a la familia", "Dra. Guiselle Solano")}
            >
              Enviar a la familia
            </Button>
          </div>
          <p className="m-0 text-sm leading-relaxed text-tinta-tenue">
            Toda edición queda registrada con autor, fecha y versión del contenido mostrado a la familia.
          </p>
        </div>
      </div>
    </div>
  );
}
