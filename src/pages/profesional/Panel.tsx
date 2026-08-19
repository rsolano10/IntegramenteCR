import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { getPatientName, computeAdherencia } from "../../lib/patient";
import { useAppStore } from "../../lib/store";
import { semaforoData } from "../../lib/rules";
import { PatientDetailModal, type PatientRow } from "../../components/profesional/PatientDetailModal";
import { planTiers, professional, type Semaforo } from "../../lib/mockData";

interface PendingThread {
  patient_id: string;
  patient_nombre: string;
  last_message: string;
  last_author_nombre: string | null;
  last_at: string;
}

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

export function Panel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Rosa is the only patient whose plan/adherencia is real data today (still
  // local Zustand, not Supabase — plans/plan_tasks migration is a future
  // phase) — the honest "adherencia" metric below is scoped to just her for
  // that reason, never presented as a program-wide average that doesn't exist.
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const plan = useAppStore((s) => s.plan);
  const rosaName = getPatientName(onboarding2);
  const { done, total } = computeAdherencia(plan);

  const [detailPatient, setDetailPatient] = useState<PatientRow | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });

  const { data: pendingThreads, isLoading: loadingThreads } = useQuery({
    queryKey: ["pending-threads"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_pending_threads");
      if (error) throw error;
      return data as PendingThread[];
    },
  });

  const porEvaluar = useMemo(
    () =>
      [...(patients ?? [])]
        .filter((p) => p.plan_status === "pendiente")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [patients],
  );

  const patientsById = useMemo(() => new Map((patients ?? []).map((p) => [p.id, p])), [patients]);

  const distribucion = useMemo(() => {
    const counts: Record<"verde" | "amarillo" | "rojo" | "sinEvaluar", number> = { verde: 0, amarillo: 0, rojo: 0, sinEvaluar: 0 };
    for (const p of patients ?? []) {
      if (p.overall === "verde" || p.overall === "amarillo" || p.overall === "rojo") counts[p.overall]++;
      else counts.sinEvaluar++;
    }
    return counts;
  }, [patients]);

  function handleChanged(message: string, isError?: boolean) {
    setStatusMsg({ text: message, error: isError });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["pending-threads"] });
  }

  function openThreadPatient(threadPatientId: string) {
    const match = patientsById.get(threadPatientId);
    if (match) setDetailPatient(match);
  }

  const pacientesActivos = patients?.length ?? 0;

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="mb-6">
        <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Panel · {professional.nombre}</p>
        <h1 className="font-serif font-normal text-[32px] sm:text-[36px] m-0">Pendientes del programa</h1>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-[#edf4f4] text-verde-profundo"}`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
            Cerrar
          </button>
        </div>
      )}

      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada mb-6">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada]">
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Pendientes</p>
          <h2 className="font-serif font-normal text-2xl m-0">Lo que necesita atención hoy</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#efeada]">
          <div className="px-5 py-6 sm:px-8 sm:py-7 lg:border-r border-[#efeada]">
            <div className="flex items-center justify-between mb-3.5">
              <p className="m-0 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Pacientes por evaluar</p>
              {porEvaluar.length > 0 && <span className="text-[13px] font-bold text-tinta-tenue">{porEvaluar.length}</span>}
            </div>

            {loadingPatients && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}

            {!loadingPatients && porEvaluar.length === 0 && (
              <p className="m-0 text-[15px] text-tinta-tenue">Todos los pacientes tienen un plan asignado.</p>
            )}

            {!loadingPatients && porEvaluar.length > 0 && (
              <div className="grid gap-2">
                {porEvaluar.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDetailPatient(p)}
                    className="flex items-center justify-between gap-3 bg-aviso rounded-xl px-4 py-3 text-left cursor-pointer border-none w-full"
                  >
                    <span>
                      <span className="block text-[15px] font-bold text-tinta">{p.nombre}</span>
                      <span className="block text-[13px] text-semaforo-amarillo-texto">
                        {modalidadLabel[p.modalidad] ?? p.modalidad} · esperando desde {timeAgo(p.created_at)}
                      </span>
                    </span>
                    <span className="text-[13px] font-semibold text-semaforo-amarillo-texto shrink-0">Asignar ›</span>
                  </button>
                ))}
                {porEvaluar.length > 5 && (
                  <button
                    type="button"
                    onClick={() => navigate("/app/profesional/usuarios?tab=pacientes")}
                    className="text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none text-left justify-self-start"
                  >
                    Ver los {porEvaluar.length - 5} restantes →
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex items-center justify-between mb-3.5">
              <p className="m-0 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Mensajes sin responder</p>
              {(pendingThreads?.length ?? 0) > 0 && <span className="text-[13px] font-bold text-tinta-tenue">{pendingThreads?.length}</span>}
            </div>

            {loadingThreads && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}

            {!loadingThreads && (pendingThreads?.length ?? 0) === 0 && (
              <p className="m-0 text-[15px] text-tinta-tenue">No hay mensajes de familias sin responder.</p>
            )}

            {!loadingThreads && (pendingThreads?.length ?? 0) > 0 && (
              <div className="grid gap-2">
                {pendingThreads!.slice(0, 5).map((t) => (
                  <button
                    key={t.patient_id}
                    type="button"
                    onClick={() => openThreadPatient(t.patient_id)}
                    className="grid gap-1 bg-campo rounded-xl px-4 py-3 text-left cursor-pointer border-none w-full"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-bold text-tinta">{t.patient_nombre}</span>
                      <span className="text-[12px] text-tinta-tenue shrink-0">{timeAgo(t.last_at)}</span>
                    </span>
                    <span className="text-[13px] text-tinta-suave truncate">
                      {t.last_author_nombre ?? "Familia"}: {t.last_message}
                    </span>
                  </button>
                ))}
                {(pendingThreads?.length ?? 0) > 5 && (
                  <p className="m-0 text-[13px] text-tinta-tenue">y {pendingThreads!.length - 5} más</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 sm:px-8 flex items-center gap-3 text-[14px] text-tinta-tenue">
          <span className="w-2 h-2 rounded-full bg-[#e3ddc4] shrink-0" />
          <span>Alertas sin revisar — sin sistema de alertas automáticas todavía.</span>
        </div>
      </div>

      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada]">
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Métricas generales</p>
          <h2 className="font-serif font-normal text-2xl m-0">El programa en conjunto</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#efeada]">
          <div className="bg-white px-5 py-5 sm:px-8 sm:py-6">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">{pacientesActivos}</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">pacientes activos</p>
          </div>

          <div className="bg-white px-5 py-5 sm:px-8 sm:py-6">
            <p className="m-0 mb-2.5 text-sm sm:text-[15px] text-tinta-tenue">distribución por semáforo</p>
            <div className="flex flex-wrap gap-2">
              {(["verde", "amarillo", "rojo"] as Semaforo[]).map((sem) => (
                <span key={sem} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold ${semaforoData[sem].bg} ${semaforoData[sem].ink}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${semaforoData[sem].dot}`} />
                  {distribucion[sem]}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-campo text-tinta-tenue">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d8d2ba]" />
                {distribucion.sinEvaluar} sin evaluar
              </span>
            </div>
          </div>

          <div className="bg-white px-5 py-5 sm:px-8 sm:py-6">
            <div className="font-serif text-2xl sm:text-[32px] text-verde-profundo">{total > 0 ? `${Math.round((done / total) * 100)}%` : "—"}</div>
            <p className="m-0 mt-0.5 text-sm sm:text-[15px] text-tinta-tenue">
              adherencia · {rosaName} ({done} de {total}) — único paciente con plan real hoy, de {pacientesActivos}
            </p>
          </div>
        </div>
      </div>

      {detailPatient && (
        <PatientDetailModal
          patient={detailPatient}
          onClose={() => setDetailPatient(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
