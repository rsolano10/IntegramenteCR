import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { computeProfiles, overallTier } from "../../lib/clinicalEngine";
import { ClinicalRow } from "../../components/ui/ClinicalRow";
import { Button } from "../../components/ui/Button";
import { clinicPatients, professional } from "../../lib/mockData";

const destinoRoute: Record<"ficha" | "alerta" | "rechazo", string> = {
  ficha: "/app/profesional/ficha",
  alerta: "/app/profesional/alerta",
  rechazo: "/app/alerta/rechazo",
};

export function Panel() {
  const navigate = useNavigate();
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const rosaSem = overallTier(computeProfiles(onboarding2));

  return (
    <div className="im-in max-w-[1360px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada]">
          <div>
            <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Panel clínico · {professional.nombre}</p>
            <h2 className="font-serif font-normal text-2xl sm:text-[30px] m-0">Pacientes asignados</h2>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" dense to="/app/profesional/editor">
              Editor de plan
            </Button>
            <Button dense to="/app/profesional/ficha">
              Abrir ficha de Rosa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#efeada]">
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">18</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">pacientes activos</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">64%</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">adherencia semanal</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-semaforo-rojo">2</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">alertas sin revisar</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-semaforo-amarillo-texto">5</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">planes por renovar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] border-t border-[#efeada]">
          <div className="px-5 py-6 sm:px-8 sm:py-7 lg:border-r border-[#efeada]">
            <div
              className="hidden lg:grid gap-4 pb-3.5 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue border-b border-[#efeada]"
              style={{ gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr auto" }}
            >
              <span>Paciente</span>
              <span>Modalidad</span>
              <span>Estado</span>
              <span>Adherencia</span>
              <span>Plan</span>
            </div>
            <ClinicalRow
              nombre="Rosa Jiménez"
              meta="79 · Familiar: Marcela"
              modalidad="Orientado"
              semaforo={rosaSem}
              adherencia="4 de 5"
              cta="Revisar"
              onClick={() => navigate("/app/profesional/ficha")}
            />
            {clinicPatients.map((p) => (
              <ClinicalRow
                key={p.nombre}
                nombre={p.nombre}
                meta={`${p.edad} · Familiar: ${p.familiar}`}
                modalidad={p.modalidad}
                semaforo={p.semaforo}
                adherencia={p.adherencia}
                cta={p.destino === "alerta" ? "Atender" : "Revisar"}
                urgent={p.destino === "alerta"}
                onClick={() => navigate(destinoRoute[p.destino])}
              />
            ))}
          </div>
          <div className="px-5 py-6 sm:px-8 sm:py-7 grid gap-5 content-start bg-campo">
            <div>
              <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Alertas sin revisar</p>
              <div className="border-[1.5px] border-alerta-borde bg-alerta rounded-2xl p-4.5 mb-3">
                <p className="m-0 mb-1.5 text-[16px] font-bold text-alerta-texto">Marta Solís · caída reportada</p>
                <p className="m-0 mb-3 text-[15px] leading-relaxed text-[#6e4436]">
                  Ayer 18:40. El sistema suspendió los ejercicios de pie y mostró la ruta de atención a la familia.
                </p>
                <Button variant="urgency" dense onClick={() => navigate("/app/profesional/alerta")}>
                  Abrir
                </Button>
              </div>
              <div className="border border-riesgo-borde bg-riesgo rounded-2xl p-4.5">
                <p className="m-0 mb-1.5 text-[16px] font-bold text-riesgo-texto">Elena Vargas · rechazo repetido</p>
                <p className="m-0 text-[15px] leading-relaxed text-riesgo-texto">
                  Tres «no» seguidos en la misma actividad. Sugerencia: reducir dificultad o sustituir.
                </p>
              </div>
            </div>
            <div>
              <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Antes de la sesión · Rosa</p>
              <div className="border border-borde bg-white rounded-2xl p-5 grid gap-3 text-[16px] leading-relaxed text-tinta-suave">
                <span>
                  <strong className="text-tinta">Adherencia:</strong> 4 de 5.
                </span>
                <span>
                  <strong className="text-tinta">Respuesta:</strong> disfrutó lo de las fotos; rechazó la tarea de dos pasos.
                </span>
                <span>
                  <strong className="text-tinta">Reportado por Marcela:</strong> sin cambios agudos.
                </span>
                <span>
                  <strong className="text-tinta">Sugerencia:</strong> mantener objetivo, bajar complejidad de la consigna.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
