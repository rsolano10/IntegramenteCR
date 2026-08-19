import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SemaforoChip } from "../../components/ui/SemaforoChip";
import { planTiers, type Semaforo } from "../../lib/mockData";
import { PatientDetailModal, type PatientLink, type PatientRow } from "../../components/profesional/PatientDetailModal";

const relationLabel: Record<string, string> = {
  familiar_admin: "Familiar",
  participante: "Participante",
  profesional_asignado: "Clínica",
};

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

// Only Rosa has a real clinical detail screen (Ficha.tsx still only ever
// reads the local demo store) — never link any other real patient there,
// it would just show Rosa's data under someone else's name.
const FICHA_PATIENT_NAME = "Rosa Jiménez";

export function Pacientes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: patients,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<PatientRow | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
  }

  return (
    <div className="im-in max-w-[1100px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Pacientes</p>
            <h2 className="font-serif font-normal text-2xl sm:text-[30px] m-0">Roster de la clínica</h2>
          </div>
          <Button dense onClick={() => setCreateOpen(true)}>
            Nuevo paciente
          </Button>
        </div>

        {statusMsg && (
          <div className={`px-5 py-3 sm:px-8 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-serenidad/10 text-verde-profundo"}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
          {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los pacientes.</p>}
          {patients && patients.length === 0 && <p className="m-0 text-sm text-tinta-tenue">Todavía no hay pacientes.</p>}

          <div className="grid gap-3">
            {patients?.map((p) => (
              <div key={p.id} className="border border-[#efeada] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="m-0 text-[16px] font-bold text-tinta">{p.nombre}</p>
                    {p.overall && <SemaforoChip sem={p.overall as Semaforo} variant="bare" />}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${p.plan_status === "asignado" ? "bg-verde-serenidad/15 text-verde-profundo" : "bg-aviso text-semaforo-amarillo-texto"}`}>
                      {p.plan_status === "asignado" ? "Plan asignado" : "Plan pendiente"}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-[14px] text-tinta-tenue">
                    {p.edad ? `${p.edad} años · ` : ""}
                    {modalidadLabel[p.modalidad] ?? p.modalidad}
                  </p>
                  <p className="m-0 mt-1 text-[13px] text-tinta-suave">
                    {p.links.length === 0
                      ? "Sin cuentas vinculadas"
                      : p.links
                          .filter((l: PatientLink) => l.relation !== "profesional_asignado")
                          .map((l: PatientLink) => `${l.nombre} (${relationLabel[l.relation]})`)
                          .join(" · ") || "Solo vinculado a la clínica"}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {p.nombre === FICHA_PATIENT_NAME && (
                    <Button variant="secondary" dense onClick={() => navigate("/app/profesional/ficha")}>
                      Ficha clínica
                    </Button>
                  )}
                  <Button dense onClick={() => setDetailFor(p)}>
                    Gestionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {createOpen && (
        <NewPatientModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setStatusMsg({ text: "Paciente creado." });
            invalidate();
          }}
          onError={(msg) => setStatusMsg({ text: msg, error: true })}
        />
      )}

      {detailFor && (
        <PatientDetailModal
          patient={detailFor}
          onClose={() => setDetailFor(null)}
          onChanged={(msg, isError) => {
            setStatusMsg({ text: msg, error: isError });
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function NewPatientModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: () => void; onError: (msg: string) => void }) {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [modalidad, setModalidad] = useState("orientado");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit() {
    setLocalError("");
    if (!nombre.trim()) {
      setLocalError("Ingresá el nombre del paciente.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("create_patient", { p_nombre: nombre.trim(), p_edad: edad.trim() || null, p_modalidad: modalidad });
    setLoading(false);
    if (error) {
      setLocalError(error.message);
      onError(error.message);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Nuevo paciente</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Podés vincular cuentas (familiar/participante) después, desde "Gestionar".</p>
      <div className="grid gap-4.5">
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Rosa Jiménez"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Edad
            <input
              type="text"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="79"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        </div>
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Modalidad
          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          >
            {planTiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}
        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading}>
            {loading ? "Creando…" : "Crear paciente"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
