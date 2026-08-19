import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

type AppRole = "familiar" | "paciente" | "profesional";

interface AccountLink {
  patient_id: string;
  patient_nombre: string;
  relation: "familiar_admin" | "participante";
}

interface ManagedAccount {
  id: string;
  email: string;
  nombre: string;
  role: AppRole;
  especialidad: string | null;
  email_confirmed_at: string | null;
  invited_at: string | null;
  created_at: string;
  links: AccountLink[];
}

const relationLabel: Record<string, string> = {
  familiar_admin: "Familiar administrador",
  participante: "Participante",
};

const roleLabel: Record<AppRole, string> = {
  familiar: "Familiar",
  paciente: "Participante",
  profesional: "Clínica",
};

const roleBadgeClass: Record<AppRole, string> = {
  familiar: "bg-verde-serenidad/15 text-verde-profundo",
  paciente: "bg-[#e7edf3] text-[#3b4c51]",
  profesional: "bg-tinta text-white",
};

async function callAdminAccounts(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-accounts", { body: { action, ...payload } });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function Cuentas() {
  const queryClient = useQueryClient();
  const { data: accounts, isLoading, error: loadError } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editEmailFor, setEditEmailFor] = useState<ManagedAccount | null>(null);
  const [roleFor, setRoleFor] = useState<ManagedAccount | null>(null);
  const [deleteFor, setDeleteFor] = useState<ManagedAccount | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  };

  const resendMutation = useMutation({
    mutationFn: (account: ManagedAccount) => callAdminAccounts("resend", { userId: account.id }),
    onSuccess: () => {
      setActionError("");
      setActionMsg("Confirmación reenviada.");
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (account: ManagedAccount) => callAdminAccounts("delete_user", { userId: account.id }),
    onSuccess: (_data, account) => {
      setActionError("");
      setActionMsg(`${account.nombre} fue eliminado.`);
      setDeleteFor(null);
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const existingPatients = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => a.links.forEach((l) => map.set(l.patient_id, l.patient_nombre)));
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [accounts]);

  return (
    <div className="im-in max-w-[1100px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Cuentas</p>
            <h2 className="font-serif font-normal text-2xl sm:text-[30px] m-0">Usuarios y roles</h2>
          </div>
          <Button dense onClick={() => setCreateOpen(true)}>
            Crear cuenta
          </Button>
        </div>

        {(actionError || actionMsg) && (
          <div className={`px-5 py-3 sm:px-8 text-[14px] ${actionError ? "bg-alerta text-alerta-texto" : "bg-verde-serenidad/10 text-verde-profundo"}`}>
            {actionError || actionMsg}
          </div>
        )}

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
          {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar las cuentas.</p>}
          {accounts && accounts.length === 0 && <p className="m-0 text-sm text-tinta-tenue">Todavía no hay cuentas creadas.</p>}

          <div className="grid gap-3">
            {accounts?.map((a) => {
              const confirmed = !!a.email_confirmed_at;
              return (
                <div key={a.id} className="border border-[#efeada] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="m-0 text-[16px] font-bold text-tinta">{a.nombre}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${roleBadgeClass[a.role]}`}>{roleLabel[a.role]}</span>
                    </div>
                    <p className="m-0 text-[14px] text-tinta-tenue">{a.email}</p>
                    <p className="m-0 mt-1 text-[13px] text-tinta-suave">
                      {a.especialidad
                        ? a.especialidad
                        : a.links.length === 0
                          ? "Sin paciente vinculado"
                          : a.links.map((l) => `${relationLabel[l.relation]} de ${l.patient_nombre}`).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {confirmed ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold bg-verde-serenidad/15 text-verde-profundo">
                        Confirmado
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold bg-aviso text-semaforo-amarillo-texto">
                          Pendiente de confirmar
                        </span>
                        <Button variant="secondary" dense onClick={() => resendMutation.mutate(a)} disabled={resendMutation.isPending}>
                          Reenviar
                        </Button>
                        <Button variant="secondary" dense onClick={() => setEditEmailFor(a)}>
                          Editar correo
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" dense onClick={() => setRoleFor(a)}>
                      Cambiar rol
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteFor(a)}
                      className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateAccountModal
          existingPatients={existingPatients}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setActionError("");
            setActionMsg("Cuenta creada. Le enviamos una invitación por correo.");
            invalidate();
          }}
          onError={(msg) => setActionError(msg)}
        />
      )}

      {editEmailFor && (
        <EditEmailModal
          account={editEmailFor}
          onClose={() => setEditEmailFor(null)}
          onSaved={(warning) => {
            if (warning) {
              setActionError(warning);
              setActionMsg("");
            } else {
              setActionError("");
              setActionMsg("Correo actualizado y confirmación reenviada.");
            }
            invalidate();
          }}
          onError={(msg) => setActionError(msg)}
        />
      )}

      {roleFor && (
        <RoleChangeModal
          account={roleFor}
          onClose={() => setRoleFor(null)}
          onSaved={(warning) => {
            if (warning) {
              setActionError(warning);
              setActionMsg("");
            } else {
              setActionError("");
              setActionMsg("Rol actualizado.");
            }
            invalidate();
          }}
          onError={(msg) => setActionError(msg)}
        />
      )}

      {deleteFor && (
        <Modal onClose={() => setDeleteFor(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Eliminar cuenta</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">
            Esto borra el acceso de {deleteFor.nombre} ({deleteFor.email}) por completo. No se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteFor(null)}>
              Cancelar
            </Button>
            <Button variant="urgency" onClick={() => deleteMutation.mutate(deleteFor)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
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
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        Le enviamos un correo de invitación. Va a poder entrar en cuanto confirme y elija una contraseña.
      </p>

      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Tipo de cuenta
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as typeof accountType)}
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          >
            <option value="familiar_admin">Familiar administrador</option>
            <option value="participante">Participante (paciente)</option>
            <option value="profesional">Equipo clínico</option>
          </select>
        </label>

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
            <div className="grid grid-cols-3 gap-1.5 bg-[#f2eede] p-1.5 rounded-full">
              <button
                type="button"
                onClick={() => setPatientMode("none")}
                className={`min-h-10 rounded-full border-none font-sans text-[13px] font-semibold cursor-pointer ${patientMode === "none" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
              >
                Sin paciente
              </button>
              <button
                type="button"
                onClick={() => setPatientMode("new")}
                className={`min-h-10 rounded-full border-none font-sans text-[13px] font-semibold cursor-pointer ${patientMode === "new" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
              >
                Paciente nuevo
              </button>
              <button
                type="button"
                onClick={() => setPatientMode("existing")}
                disabled={existingPatients.length === 0}
                className={`min-h-10 rounded-full border-none font-sans text-[13px] font-semibold cursor-pointer disabled:opacity-40 ${patientMode === "existing" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
              >
                Existente
              </button>
            </div>

            {patientMode === "existing" && (
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Paciente
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

function EditEmailModal({
  account,
  onClose,
  onSaved,
  onError,
}: {
  account: ManagedAccount;
  onClose: () => void;
  onSaved: (warning?: string) => void;
  onError: (msg: string) => void;
}) {
  const [newEmail, setNewEmail] = useState(account.email);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit() {
    setLocalError("");
    if (!newEmail.trim() || newEmail.trim() === account.email) {
      setLocalError("Ingresá un correo distinto al actual.");
      return;
    }
    setLoading(true);
    try {
      const result = await callAdminAccounts("update_email", { userId: account.id, newEmail: newEmail.trim() });
      onSaved(result?.warning);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos actualizar el correo.";
      setLocalError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Corregir correo</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        {account.nombre} todavía no confirmó su cuenta. Corregí el correo y le reenviamos la invitación al nuevo.
      </p>
      <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
        Correo electrónico
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
        />
      </label>
      {localError && <p className="m-0 mt-3 text-[14px] text-alerta-texto">{localError}</p>}
      <div className="flex gap-3 mt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="ink" onClick={submit} disabled={loading}>
          {loading ? "Guardando…" : "Guardar y reenviar"}
        </Button>
      </div>
    </Modal>
  );
}

function RoleChangeModal({
  account,
  onClose,
  onSaved,
  onError,
}: {
  account: ManagedAccount;
  onClose: () => void;
  onSaved: (warning?: string) => void;
  onError: (msg: string) => void;
}) {
  const [role, setRole] = useState<AppRole>(account.role);
  const [especialidad, setEspecialidad] = useState(account.especialidad ?? "");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit() {
    setLocalError("");
    setLoading(true);
    try {
      const result = await callAdminAccounts("update_role", {
        userId: account.id,
        role,
        ...(role === "profesional" ? { especialidad: especialidad.trim() } : {}),
      });
      onSaved(result?.warning);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos cambiar el rol.";
      setLocalError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Cambiar rol</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">{account.nombre} · {account.email}</p>
      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Rol
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          >
            <option value="familiar">Familiar</option>
            <option value="paciente">Participante</option>
            <option value="profesional">Clínica</option>
          </select>
        </label>
        {role === "profesional" && (
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Especialidad
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        )}
        {account.links.length > 0 && (
          <p className="m-0 text-[13px] text-tinta-suave">
            Esta cuenta sigue vinculada a {account.links.map((l) => l.patient_nombre).join(", ")}. Si el vínculo ya no corresponde, corregilo desde
            Pacientes.
          </p>
        )}
        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}
        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading || role === account.role}>
            {loading ? "Guardando…" : "Guardar rol"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
