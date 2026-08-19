import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { computeProfiles, overallTier } from "../../lib/clinicalEngine";
import { getPatientName, getPatientAge, computeAdherencia } from "../../lib/patient";
import { semaforoData } from "../../lib/rules";
import { ClinicalRow } from "../../components/ui/ClinicalRow";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { planTiers, professional, type Semaforo } from "../../lib/mockData";

interface PatientRow {
  id: string;
  nombre: string;
  edad: string | null;
  modalidad: string;
  plan_status: "pendiente" | "asignado";
  overall: Semaforo | null;
  links: { profile_id: string; nombre: string; role: string; relation: string }[];
}

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

// Only Rosa has real plan/clinical data wired up today (still local
// Zustand) — her row keeps reading from there. Every other real patient in
// the roster comes from Supabase via list_patients() and only ever gets a
// lightweight summary here; the full CRUD surface lives at /pacientes.
const FICHA_PATIENT_NAME = "Rosa Jiménez";

export function Panel() {
  const navigate = useNavigate();
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const modalidad = useAppStore((s) => s.modalidad);
  const plan = useAppStore((s) => s.plan);
  const planStatus = useAppStore((s) => s.planStatus);
  const rosaSem = overallTier(computeProfiles(onboarding2));
  const rosaModalidad = planTiers.find((t) => t.id === modalidad)?.nombre ?? "Orientado";
  const { done, total } = computeAdherencia(plan);
  const [summaryPatient, setSummaryPatient] = useState<PatientRow | null>(null);

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });

  const otherPatients = (patients ?? []).filter((p) => p.nombre !== FICHA_PATIENT_NAME).slice(0, 6);
  const pacientesActivos = patients?.length ?? 1;
  const adherenciaPromedio = total > 0 ? Math.round((done / total) * 100) : 0;
  // The two cards in "Alertas sin revisar" stay illustrative content (no
  // real alerting pipeline exists yet) — this mirrors the one actionable
  // card below rather than querying something that doesn't exist.
  const alertasSinRevisar = 1;
  const casosEnRojo = (rosaSem === "rojo" ? 1 : 0) + otherPatients.filter((p) => p.overall === "rojo").length;

  return (
    <div className="im-in max-w-[1360px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada]">
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Panel clínico · {professional.nombre}</p>
          <h2 className="font-serif font-normal text-2xl sm:text-[30px] m-0">Pacientes asignados</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#efeada]">
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">{pacientesActivos}</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">pacientes activos</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">{adherenciaPromedio}%</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">adherencia de Rosa</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-semaforo-rojo">{alertasSinRevisar}</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">alertas sin revisar</p>
          </div>
          <div className="bg-white px-5 py-4.5 sm:px-8 sm:py-5.5">
            <div className="font-serif text-2xl sm:text-[32px] text-semaforo-amarillo-texto">{casosEnRojo}</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">casos en rojo</p>
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
              nombre={getPatientName(onboarding2)}
              meta={`${getPatientAge(onboarding2)} · Familiar: Marcela`}
              modalidad={rosaModalidad}
              semaforo={rosaSem}
              adherencia={`${done} de ${total}`}
              cta={planStatus === "pendiente" ? "Revisar y asignar" : "Revisar"}
              pending={planStatus === "pendiente"}
              onClick={() => navigate("/app/profesional/ficha")}
            />
            {otherPatients.map((p) => {
              const familiarLink = p.links.find((l) => l.relation === "familiar_admin");
              return (
                <ClinicalRow
                  key={p.id}
                  nombre={p.nombre}
                  meta={`${p.edad ?? "—"} · Familiar: ${familiarLink?.nombre ?? "sin asignar"}`}
                  modalidad={modalidadLabel[p.modalidad] ?? p.modalidad}
                  semaforo={p.overall ?? undefined}
                  adherencia={p.overall ? "—" : "Sin evaluar"}
                  cta="Ver resumen"
                  onClick={() => setSummaryPatient(p)}
                />
              );
            })}
            <div className="pt-4">
              <Button variant="secondary" dense onClick={() => navigate("/app/profesional/pacientes")}>
                Ver todos los pacientes →
              </Button>
            </div>
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
                  <strong className="text-tinta">Adherencia:</strong> {done} de {total}.
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

      {summaryPatient && (
        <Modal onClose={() => setSummaryPatient(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">{summaryPatient.nombre}</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">
            {summaryPatient.edad ?? "—"} años · {modalidadLabel[summaryPatient.modalidad] ?? summaryPatient.modalidad}
          </p>
          <div className="grid gap-3">
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-tinta-tenue">Estado</span>
              {summaryPatient.overall ? (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${semaforoData[summaryPatient.overall].bg} ${semaforoData[summaryPatient.overall].ink}`}
                >
                  <span className={`w-2 h-2 rounded-full ${semaforoData[summaryPatient.overall].dot}`} />
                  {semaforoData[summaryPatient.overall].short}
                </span>
              ) : (
                <span className="text-sm text-tinta-tenue">Sin evaluar</span>
              )}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-tinta-tenue">Plan</span>
              <span className="text-sm text-tinta">{summaryPatient.plan_status === "asignado" ? "Asignado" : "Pendiente"}</span>
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-tinta-tenue">Cuentas vinculadas</span>
              <span className="text-sm text-tinta">{summaryPatient.links.length}</span>
            </div>
          </div>
          <Button variant="secondary" dense className="mt-4" onClick={() => navigate("/app/profesional/pacientes")}>
            Gestionar en Pacientes →
          </Button>
        </Modal>
      )}
    </div>
  );
}
