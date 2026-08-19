import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { PillToggle } from "../ui/PillToggle";
import { RowMenu } from "../ui/RowMenu";
import { SemaforoChip } from "../ui/SemaforoChip";
import { planTiers, type Semaforo } from "../../lib/mockData";
import { semaforoData } from "../../lib/rules";
import { PatientDetailModal, type PatientRow } from "./PatientDetailModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

type SortKey = "nombre" | "creado";

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

// Every visible column, flattened to searchable text — typing "orientado"
// or "asignado" matches the same words the table already shows, instead of
// needing a separate filter control for each column.
function patientHaystack(p: PatientRow): string {
  return [
    p.nombre,
    p.edad ?? "",
    modalidadLabel[p.modalidad] ?? p.modalidad,
    p.overall ? semaforoData[p.overall as Semaforo].short : "Sin evaluar",
    p.plan_status === "asignado" ? "Asignado" : "Pendiente",
    ...p.links.map((l) => l.nombre),
  ]
    .join(" ")
    .toLowerCase();
}

// Only Rosa has a real clinical detail screen (Ficha.tsx still only ever
// reads the local demo store) — never link any other real patient there.
const FICHA_PATIENT_NAME = "Rosa Jiménez";

export function PacientesTab({
  createOpen,
  onCreateOpenChange,
  onChanged,
  pendingPatientId,
  onConsumePending,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onChanged: (message: string, isError?: boolean) => void;
  pendingPatientId: string | null;
  onConsumePending: () => void;
}) {
  const navigate = useNavigate();
  const { data: patients, isLoading, error: loadError } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("creado");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailFor, setDetailFor] = useState<PatientRow | null>(null);
  const [deleteFor, setDeleteFor] = useState<PatientRow | null>(null);

  useEffect(() => {
    if (!pendingPatientId || !patients) return;
    const match = patients.find((p) => p.id === pendingPatientId);
    if (match) setDetailFor(match);
    onConsumePending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPatientId, patients]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (patients ?? []).filter((p) => !q || patientHaystack(p).includes(q));
    list = [...list].sort((a, b) => {
      const cmp = sortKey === "nombre" ? a.nombre.localeCompare(b.nombre) : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [patients, search, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);
  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  return (
    <>
      <div className="px-5 py-6 sm:px-8 sm:py-7">
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre, modalidad, estado, plan o cuenta vinculada…"
            className="w-full min-h-11 px-4 rounded-full border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[15px] text-tinta"
          />
        </div>

        {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
        {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los pacientes.</p>}

        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[12px] tracking-[0.08em] uppercase text-tinta-tenue border-b border-[#efeada]">
                  <th className="py-2.5 pr-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort("nombre")}>
                    Nombre{sortIndicator("nombre")}
                  </th>
                  <th className="py-2.5 pr-3 font-semibold">Modalidad</th>
                  <th className="py-2.5 pr-3 font-semibold">Estado</th>
                  <th className="py-2.5 pr-3 font-semibold">Plan</th>
                  <th className="py-2.5 pr-3 font-semibold">Cuentas</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b border-[#f4f0e2]">
                    <td className="py-3 pr-3">
                      <p className="m-0 font-bold text-tinta">{p.nombre}</p>
                      <p className="m-0 text-[13px] text-tinta-tenue">{p.edad ? `${p.edad} años` : "—"}</p>
                    </td>
                    <td className="py-3 pr-3 text-tinta-suave">{modalidadLabel[p.modalidad] ?? p.modalidad}</td>
                    <td className="py-3 pr-3">
                      {p.overall ? <SemaforoChip sem={p.overall as Semaforo} variant="bare" /> : <span className="text-tinta-tenue">Sin evaluar</span>}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${p.plan_status === "asignado" ? "bg-verde-serenidad/15 text-verde-profundo" : "bg-aviso text-semaforo-amarillo-texto"}`}
                      >
                        {p.plan_status === "asignado" ? "Asignado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-tinta-suave">{p.links.filter((l) => l.relation !== "profesional_asignado").length}</td>
                    <td className="py-3 text-right">
                      <RowMenu
                        items={[
                          { label: "Ver ficha clínica", hidden: p.nombre !== FICHA_PATIENT_NAME, onClick: () => navigate("/app/profesional/ficha") },
                          { label: "Ver detalle", onClick: () => setDetailFor(p) },
                          { label: "Eliminar paciente", danger: true, onClick: () => setDeleteFor(p) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-tinta-tenue">
                      Ningún paciente coincide con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={effectivePage} pageSize={pageSize} totalCount={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {createOpen && (
        <NewPatientModal
          onClose={() => onCreateOpenChange(false)}
          onCreated={() => onChanged("Paciente creado.")}
          onError={(msg) => onChanged(msg, true)}
        />
      )}

      {detailFor && <PatientDetailModal patient={detailFor} onClose={() => setDetailFor(null)} onChanged={onChanged} />}

      {deleteFor && (
        <DeleteConfirmModal
          title={`¿Eliminar a ${deleteFor.nombre}?`}
          message="Se borran su perfil, su plan y todos sus registros. No se puede deshacer."
          onCancel={() => setDeleteFor(null)}
          onConfirm={async () => {
            const { error } = await supabase.from("patients").delete().eq("id", deleteFor.id);
            if (error) onChanged(error.message, true);
            else onChanged(`${deleteFor.nombre} fue eliminado.`);
            setDeleteFor(null);
          }}
        />
      )}
    </>
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
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Podés vincular cuentas (familiar/participante) después, desde "Ver detalle".</p>
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
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Modalidad</p>
          <PillToggle value={modalidad} onChange={setModalidad} options={planTiers.map((t) => ({ value: t.id, label: t.nombre }))} />
        </div>
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
