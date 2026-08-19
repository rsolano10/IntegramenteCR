import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { PillToggle } from "../ui/PillToggle";
import { RowMenu } from "../ui/RowMenu";
import { callAdminAccounts, roleBadgeClass, roleLabel, type ManagedAccount } from "../../lib/adminAccounts";
import { AccountDetailModal } from "./AccountDetailModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

type SortKey = "nombre" | "creado" | "rol";

// Every visible column, flattened to searchable text — typing "familiar" or
// "confirmado" matches on the same words the table already shows, instead
// of needing a separate filter control for each column.
function accountHaystack(a: ManagedAccount): string {
  const confirmed = !!a.email_confirmed_at;
  return [
    a.nombre,
    a.email,
    roleLabel[a.role],
    a.especialidad ?? "",
    ...a.links.map((l) => l.patient_nombre),
    confirmed ? "Confirmado" : "Pendiente",
    new Date(a.created_at).toLocaleDateString("es-CR"),
  ]
    .join(" ")
    .toLowerCase();
}

export function CuentasTab({
  createOpen,
  onCreateOpenChange,
  onChanged,
  onViewPatient,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onChanged: (message: string, isError?: boolean) => void;
  onViewPatient: (patientId: string) => void;
}) {
  const { data: accounts, isLoading, error: loadError } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("creado");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailFor, setDetailFor] = useState<ManagedAccount | null>(null);
  const [deleteFor, setDeleteFor] = useState<ManagedAccount | null>(null);

  const resendMutation = useMutation({
    mutationFn: (account: ManagedAccount) => callAdminAccounts("resend", { userId: account.id }),
    onSuccess: () => onChanged("Confirmación reenviada."),
    onError: (err: Error) => onChanged(err.message, true),
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (accounts ?? []).filter((a) => !q || accountHaystack(a).includes(q));
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "nombre") cmp = a.nombre.localeCompare(b.nombre);
      else if (sortKey === "rol") cmp = a.role.localeCompare(b.role);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [accounts, search, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);
  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const existingPatients = Array.from(
    new Map((accounts ?? []).flatMap((a) => a.links).map((l) => [l.patient_id, l.patient_nombre])).entries(),
  ).map(([id, nombre]) => ({ id, nombre }));

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
            placeholder="Buscar por nombre, correo, rol, paciente vinculado o estado…"
            className="w-full min-h-11 px-4 rounded-full border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[15px] text-tinta"
          />
        </div>

        {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
        {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar las cuentas.</p>}

        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[12px] tracking-[0.08em] uppercase text-tinta-tenue border-b border-[#efeada]">
                  <th className="py-2.5 pr-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort("nombre")}>
                    Nombre{sortIndicator("nombre")}
                  </th>
                  <th className="py-2.5 pr-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort("rol")}>
                    Rol{sortIndicator("rol")}
                  </th>
                  <th className="py-2.5 pr-3 font-semibold">Vinculado a</th>
                  <th className="py-2.5 pr-3 font-semibold">Estado</th>
                  <th className="py-2.5 pr-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort("creado")}>
                    Creado{sortIndicator("creado")}
                  </th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => {
                  const confirmed = !!a.email_confirmed_at;
                  return (
                    <tr key={a.id} className="border-b border-[#f4f0e2]">
                      <td className="py-3 pr-3">
                        <p className="m-0 font-bold text-tinta">{a.nombre}</p>
                        <p className="m-0 text-[13px] text-tinta-tenue">{a.email}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${roleBadgeClass[a.role]}`}>{roleLabel[a.role]}</span>
                      </td>
                      <td className="py-3 pr-3 text-tinta-suave">
                        {a.especialidad ? a.especialidad : a.links.length === 0 ? "—" : a.links.map((l) => l.patient_nombre).join(", ")}
                      </td>
                      <td className="py-3 pr-3">
                        {confirmed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-verde-serenidad/15 text-verde-profundo">Confirmado</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-aviso text-semaforo-amarillo-texto">Pendiente</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-tinta-suave">{new Date(a.created_at).toLocaleDateString("es-CR")}</td>
                      <td className="py-3 text-right">
                        <RowMenu
                          items={[
                            { label: "Ver detalle", onClick: () => setDetailFor(a) },
                            { label: "Reenviar confirmación", hidden: confirmed, onClick: () => resendMutation.mutate(a) },
                            { label: "Eliminar cuenta", danger: true, onClick: () => setDeleteFor(a) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-tinta-tenue">
                      Ninguna cuenta coincide con estos filtros.
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
        <CreateAccountModal
          existingPatients={existingPatients}
          onClose={() => onCreateOpenChange(false)}
          onCreated={() => onChanged("Cuenta creada. Le enviamos una invitación por correo.")}
          onError={(msg) => onChanged(msg, true)}
        />
      )}

      {detailFor && (
        <AccountDetailModal
          account={detailFor}
          onClose={() => setDetailFor(null)}
          onChanged={onChanged}
          onViewPatient={(patientId) => {
            setDetailFor(null);
            onViewPatient(patientId);
          }}
        />
      )}

      {deleteFor && (
        <DeleteConfirmModal
          title={`¿Eliminar la cuenta de ${deleteFor.nombre}?`}
          message="Se borra su acceso por completo. No se puede deshacer."
          onCancel={() => setDeleteFor(null)}
          onConfirm={async () => {
            try {
              await callAdminAccounts("delete_user", { userId: deleteFor.id });
              onChanged(`${deleteFor.nombre} fue eliminado.`);
            } catch (err) {
              onChanged(err instanceof Error ? err.message : "No pudimos eliminar la cuenta.", true);
            } finally {
              setDeleteFor(null);
            }
          }}
        />
      )}
    </>
  );
}

function CreateAccountModal({
  existingPatients,
  onClose,
  onCreated,
  onError,
}: {
  existingPatients: { id: string; nombre: string }[];
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [accountType, setAccountType] = useState<"familiar_admin" | "participante" | "profesional">("familiar_admin");
  const [patientMode, setPatientMode] = useState<"none" | "new" | "existing">(existingPatients.length > 0 ? "existing" : "none");
  const [patientId, setPatientId] = useState(existingPatients[0]?.id ?? "");
  const [patientNombre, setPatientNombre] = useState("");
  const [patientEdad, setPatientEdad] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const isStaff = accountType === "profesional";

  const patientModeOptions: { value: typeof patientMode; label: string }[] = [
    { value: "none", label: "Sin paciente" },
    { value: "new", label: "Paciente nuevo" },
    ...(existingPatients.length > 0 ? [{ value: "existing" as const, label: "Existente" }] : []),
  ];

  async function submit() {
    setLocalError("");
    if (!nombre.trim() || !email.trim()) {
      setLocalError("Completá el nombre y el correo de la persona.");
      return;
    }
    if (!isStaff && patientMode === "new" && !patientNombre.trim()) {
      setLocalError("Completá el nombre del paciente.");
      return;
    }
    if (!isStaff && patientMode === "existing" && !patientId) {
      setLocalError("Elegí un paciente existente.");
      return;
    }
    setLoading(true);
    try {
      await callAdminAccounts("invite", {
        email: email.trim(),
        nombre: nombre.trim(),
        ...(isStaff
          ? { accountType: "profesional", especialidad: especialidad.trim() }
          : {
              relation: accountType,
              ...(patientMode === "existing" ? { patientId } : patientMode === "new" ? { patientNombre: patientNombre.trim(), patientEdad: patientEdad.trim() } : {}),
            }),
      });
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos crear la cuenta.";
      setLocalError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Crear cuenta</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Le enviamos un correo de invitación. Va a poder entrar en cuanto confirme y elija una contraseña.</p>

      <div className="grid gap-4.5">
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Tipo de cuenta</p>
          <PillToggle
            value={accountType}
            onChange={setAccountType}
            options={[
              { value: "familiar_admin", label: "Familiar" },
              { value: "participante", label: "Participante" },
              { value: "profesional", label: "Equipo clínico" },
            ]}
          />
        </div>

        {isStaff ? (
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Especialidad
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Neuropsicología"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        ) : (
          <>
            <div>
              <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Paciente</p>
              <PillToggle value={patientMode} onChange={setPatientMode} options={patientModeOptions} />
            </div>

            {patientMode === "existing" && (
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Cuál
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
                >
                  {existingPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {patientMode === "new" && (
              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                  Nombre del paciente
                  <input
                    type="text"
                    value={patientNombre}
                    onChange={(e) => setPatientNombre(e.target.value)}
                    placeholder="Rosa Jiménez"
                    className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
                  />
                </label>
                <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                  Edad
                  <input
                    type="text"
                    value={patientEdad}
                    onChange={(e) => setPatientEdad(e.target.value)}
                    placeholder="79"
                    className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
                  />
                </label>
              </div>
            )}
          </>
        )}

        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Nombre de la persona
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Marcela Jiménez"
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          />
        </label>

        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          />
        </label>

        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading}>
            {loading ? "Creando…" : "Crear e invitar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
