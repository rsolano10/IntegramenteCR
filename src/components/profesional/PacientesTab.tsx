import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { PillToggle } from "../ui/PillToggle";
import { FilterDropdown } from "../ui/FilterDropdown";
import { RowMenu } from "../ui/RowMenu";
import { SemaforoChip } from "../ui/SemaforoChip";
import { planTiers, type Semaforo } from "../../lib/mockData";
import { relationLabel, type ManagedAccount } from "../../lib/adminAccounts";
import { FormField } from "../ui/FormField";
import { patientHaystack } from "../../lib/usuariosSearch";
import { attentionFor, attentionMeta, attentionRankOf } from "../../lib/patientAttention";
import type { PatientRow } from "./PatientDetailModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

type SortMode = "accion" | "nombre" | "recientes";
type EstadoFacet = "accion" | "al_dia";

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

const ejes: { key: "cognitivo" | "fisico" | "funcional" | "nutricional"; label: string }[] = [
  { key: "cognitivo", label: "Cog" },
  { key: "fisico", label: "Fís" },
  { key: "funcional", label: "Func" },
  { key: "nutricional", label: "Nutr" },
];

// Only Rosa has a real clinical detail screen (Ficha.tsx still only ever
// reads the local demo store) — never link any other real patient there.
const FICHA_PATIENT_NAME = "Rosa Jiménez";

export function PacientesTab({
  createOpen,
  onCreateOpenChange,
  onChanged,
  onOpenPatient,
  onOpenAccount,
  search,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onChanged: (message: string, isError?: boolean) => void;
  onOpenPatient: (patient: PatientRow) => void;
  onOpenAccount: (account: ManagedAccount) => void;
  search: string;
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

  // Only read here for the family chips' confirmed/pending/desactivada dot —
  // same cached query CuentasTab already keeps warm, not a second fetch.
  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });
  const accountById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts]);

  const [sortMode, setSortMode] = useState<SortMode>("accion");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFacet | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteFor, setDeleteFor] = useState<PatientRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, estadoFilter, sortMode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (patients ?? []).filter((p) => !q || patientHaystack(p).includes(q));
    if (estadoFilter) list = list.filter((p) => (estadoFilter === "accion" ? attentionFor(p) !== null : attentionFor(p) === null));
    list = [...list].sort((a, b) => {
      if (sortMode === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortMode === "recientes") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      const rankCmp = attentionRankOf(a) - attentionRankOf(b);
      return rankCmp !== 0 ? rankCmp : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [patients, search, estadoFilter, sortMode]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);
  const necesitanAccion = (patients ?? []).filter((p) => attentionFor(p) !== null).length;

  function ejesChips(p: PatientRow) {
    if (!(p.cognitivo || p.fisico || p.funcional || p.nutricional)) {
      return <span className="text-tinta-tenue text-[13px]">Sin evaluar todavía</span>;
    }
    return (
      <div className="flex flex-wrap gap-x-3.5 gap-y-1">
        {ejes.map((e) =>
          p[e.key] ? (
            <span key={e.key} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-tinta-tenue" title={e.label}>
              <SemaforoChip sem={p[e.key] as Semaforo} variant="bare" />
              <span className="font-semibold">{e.label}</span>
            </span>
          ) : null,
        )}
      </div>
    );
  }

  function FamilyChips({ p }: { p: PatientRow }) {
    const linked = p.links.filter((l) => l.relation !== "profesional_asignado");
    if (linked.length === 0) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPatient(p);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-borde-campo text-[12px] font-semibold text-tinta-tenue cursor-pointer hover:border-verde-serenidad hover:text-verde-profundo"
        >
          + Vincular familiar
        </button>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {linked.map((l) => {
          const acc = accountById.get(l.profile_id);
          const state = !acc || !acc.is_active ? "desactivada" : acc.email_confirmed_at ? "confirmada" : "pendiente";
          const dotClass = state === "desactivada" ? "bg-tinta-tenue" : state === "pendiente" ? "bg-semaforo-amarillo" : "bg-semaforo-verde";
          return (
            <button
              key={l.profile_id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (acc) onOpenAccount(acc);
              }}
              title={`${relationLabel[l.relation]}${state === "pendiente" ? " · sin confirmar" : state === "desactivada" ? " · desactivada" : ""}`}
              disabled={!acc}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-campo text-tinta cursor-pointer hover:bg-borde-suave disabled:cursor-default"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {l.nombre}
            </button>
          );
        })}
      </div>
    );
  }

  function HouseholdCard({ p }: { p: PatientRow }) {
    const attention = attentionFor(p);
    const meta = attention ? attentionMeta[attention] : null;
    return (
      <div
        onClick={() => onOpenPatient(p)}
        className="group flex flex-col rounded-[22px] border border-borde bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevada"
      >
        {meta && (
          <div className={`flex items-center gap-2 px-4.5 py-2 text-[12.5px] font-bold ${meta.bg} ${meta.text}`}>
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            {meta.label}
          </div>
        )}
        <div className="p-4.5 flex flex-col gap-3.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="m-0 font-serif font-normal text-[20px] leading-snug text-tinta break-words group-hover:text-verde-profundo">{p.nombre}</h3>
              <p className="m-0 mt-0.5 text-[13px] text-tinta-tenue">
                {p.edad ? `${p.edad} años` : "Edad sin registrar"} · {modalidadLabel[p.modalidad] ?? p.modalidad}
                {p.plan_status === "asignado" && !meta && <span className="text-verde-profundo"> · Al día</span>}
              </p>
              {p.posible_duplicado_de && (
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-riesgo text-riesgo-texto">
                  Posible duplicado
                </span>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <RowMenu
                items={[
                  { label: "Ver ficha clínica", hidden: p.nombre !== FICHA_PATIENT_NAME, onClick: () => navigate("/app/profesional/ficha") },
                  { label: "Ver detalle", onClick: () => onOpenPatient(p) },
                  { label: "Eliminar paciente", danger: true, onClick: () => setDeleteFor(p) },
                ]}
              />
            </div>
          </div>

          {ejesChips(p)}

          <div className="mt-auto pt-3 border-t border-borde-suave">
            <p className="m-0 mb-1.5 text-[10.5px] uppercase tracking-[0.08em] text-tinta-tenue font-semibold">Familia</p>
            <FamilyChips p={p} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <FilterDropdown
            label="Estado"
            options={[
              { value: "accion", label: `Necesita acción${necesitanAccion ? ` (${necesitanAccion})` : ""}` },
              { value: "al_dia", label: "Al día" },
            ]}
            value={estadoFilter}
            onChange={(v) => setEstadoFilter(v as EstadoFacet | "")}
          />
          <label className="grid grid-cols-1 gap-1.5 text-[12px] font-semibold text-tinta-tenue">
            <span className="tracking-[0.08em] uppercase">Ordenar</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="min-h-10 px-3 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[14px] font-semibold text-tinta cursor-pointer"
            >
              <option value="accion">Acción primero</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="recientes">Más recientes</option>
            </select>
          </label>
        </div>

        {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
        {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los pacientes.</p>}

        {!isLoading && pageItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pageItems.map((p) => (
              <HouseholdCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {!isLoading && pageItems.length === 0 && (
          <div className="rounded-2xl border-[1.5px] border-dashed border-borde-campo py-12 text-center">
            <p className="m-0 text-tinta-tenue">Ningún paciente coincide con estos filtros.</p>
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
      <div className="grid grid-cols-1 gap-4.5">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
          <FormField label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <FormField label="Edad" type="text" value={edad} onChange={(e) => setEdad(e.target.value)} />
        </div>
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Modalidad</p>
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
