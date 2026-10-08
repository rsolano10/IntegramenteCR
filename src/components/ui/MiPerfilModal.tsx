import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession, type SessionState } from "../../lib/useSession";
import { useMyPatient, type MyPatient } from "../../lib/useMyPatient";
import { uploadAvatar } from "../../lib/avatar";
import { normalizeCrPhone } from "../../lib/phone";
import { useChangePassword } from "../../lib/useChangePassword";
import { planTiers } from "../../lib/mockData";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";

type Authed = Extract<SessionState, { status: "authed" }>;
type Tab = "perfil" | "familiar" | "seguridad";

// One "Mi cuenta" for every role. The outer component only waits for the
// session/patient to resolve: the form's useState initializers run once,
// so mounting it before the data arrived is what used to leave every field
// blank (useSession() starts in "loading" in each new component).
export function MiPerfilModal({ onClose, isSelf = false }: { onClose: () => void; isSelf?: boolean }) {
  const session = useSession();
  const { data: myPatient, isPending } = useMyPatient();
  const ready = session.status === "authed" && (session.profile.role === "profesional" || !isPending);

  return (
    <Modal onClose={onClose} bare>
      {ready ? (
        <MiPerfilContent session={session as Authed} myPatient={myPatient ?? null} isSelf={isSelf} onClose={onClose} />
      ) : (
        <div className="p-10 flex justify-center">
          <span className="inline-block w-7 h-7 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
        </div>
      )}
    </Modal>
  );
}

function MiPerfilContent({
  session,
  myPatient,
  isSelf,
  onClose,
}: {
  session: Authed;
  myPatient: MyPatient | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { profile } = session;
  const user = session.session.user;
  const email = user.email ?? "";
  const isProfesional = profile.role === "profesional";

  const [tab, setTab] = useState<Tab>("perfil");
  const [fotoUrl, setFotoUrl] = useState(profile.foto_url);
  const [nombre, setNombre] = useState(profile.nombre);
  const [especialidad, setEspecialidad] = useState(profile.especialidad ?? "");
  const [phone, setPhone] = useState(formatCrPhone(profile.whatsapp_phone));
  const [patientNombre, setPatientNombre] = useState(myPatient?.nombre ?? "");
  const [patientEdad, setPatientEdad] = useState(myPatient?.edad ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const phoneError = phone.trim() && !normalizeCrPhone(phone) ? "Usá los 8 dígitos de un número de Costa Rica." : null;
  const dirty =
    nombre.trim() !== profile.nombre ||
    (isProfesional && especialidad.trim() !== (profile.especialidad ?? "")) ||
    (!isProfesional && (phone.trim() ? normalizeCrPhone(phone) : null) !== (profile.whatsapp_phone ?? null)) ||
    (!!myPatient && (patientNombre.trim() !== myPatient.nombre || (patientEdad.trim() || null) !== (myPatient.edad ?? null)));

  const tabs: { id: Tab; label: string }[] = [
    { id: "perfil", label: "Mi perfil" },
    ...(myPatient ? [{ id: "familiar" as const, label: isSelf ? "Mi programa" : "Mi familiar" }] : []),
    { id: "seguridad", label: "Seguridad" },
  ];

  const roleLabel = isProfesional
    ? profile.especialidad || "Equipo clínico"
    : profile.role === "paciente"
      ? "Participante del programa"
      : myPatient
        ? `Familiar de ${myPatient.nombre}`
        : "Familiar";

  async function refreshSession() {
    // useSession() only re-reads profiles on an auth state change — force
    // one so the header picks up the new name/photo right away.
    await supabase.auth.refreshSession();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      const { error: updateError } = await supabase.from("profiles").update({ foto_url: url }).eq("id", user.id);
      if (updateError) throw updateError;
      setFotoUrl(url);
      await refreshSession();
    } catch {
      setError("No pudimos guardar la foto. Probá con otra imagen (JPG o PNG).");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError("");
    setSaved(false);
    if (!nombre.trim()) {
      setTab("perfil");
      setError("Tu nombre no puede quedar vacío.");
      return;
    }
    if (phoneError) {
      setTab("perfil");
      setError(phoneError);
      return;
    }
    if (myPatient && !patientNombre.trim()) {
      setTab("familiar");
      setError("El nombre no puede quedar vacío.");
      return;
    }
    setSaving(true);

    const profileUpdate: Record<string, string | null> = { nombre: nombre.trim() };
    if (isProfesional) profileUpdate.especialidad = especialidad.trim() || null;
    else profileUpdate.whatsapp_phone = phone.trim() ? normalizeCrPhone(phone) : null;

    const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
    if (profileError) {
      setSaving(false);
      setError("No pudimos guardar tus datos. Probá de nuevo.");
      return;
    }

    // Only nombre/edad — modalidad is clinic-only since the privilege fix
    // (set_patient_modalidad), and sending it here used to make every save
    // fail with a permission error.
    if (myPatient) {
      const { error: patientError } = await supabase
        .from("patients")
        .update({ nombre: patientNombre.trim(), edad: patientEdad.trim() || null })
        .eq("id", myPatient.id);
      if (patientError) {
        setSaving(false);
        setError("No pudimos guardar los datos de tu familiar. Probá de nuevo.");
        return;
      }
    }

    await refreshSession();
    await queryClient.invalidateQueries({ queryKey: ["my-patient", user.id] });
    setSaving(false);
    setSaved(true);
  }

  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      {/* Encabezado: identidad de la cuenta de un vistazo */}
      <div className="relative bg-verde-profundo text-white px-6 sm:px-7 pt-7 pb-6 overflow-hidden">
        <div aria-hidden="true" className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-verde-serenidad/40" />
        <div aria-hidden="true" className="absolute right-10 -bottom-24 w-40 h-40 rounded-full bg-mostaza-vital/20" />
        <div className="relative flex items-center gap-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Cambiar foto de perfil"
            className="group relative w-[72px] h-[72px] rounded-full overflow-hidden ring-4 ring-white/25 shrink-0 cursor-pointer disabled:opacity-60"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-beige-serenidad text-verde-profundo font-serif text-2xl">
                {initials || "·"}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-tinta/55 text-[11px] font-semibold opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              {uploading ? "Subiendo…" : "Cambiar"}
            </span>
          </button>
          <div className="min-w-0">
            <h2 className="font-serif font-normal text-[24px] leading-tight m-0 truncate text-white">{nombre.trim() || profile.nombre}</h2>
            <p className="m-0 mt-0.5 text-[14px] text-[#c4dbdb] truncate">{email}</p>
            <span className="inline-block mt-2 text-[11px] tracking-[0.1em] uppercase bg-white/15 rounded-full px-2.5 py-1">{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div role="tablist" className="flex gap-1 px-4 sm:px-5 border-b border-borde bg-campo sticky top-0 z-[1]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-3.5 text-[14.5px] font-semibold border-b-2 -mb-px cursor-pointer transition-colors ${
              tab === t.id ? "border-verde-serenidad text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 sm:px-7 py-6">
        {tab === "perfil" && (
          <div className="grid gap-4.5">
            <Field label="Tu nombre">
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className={inputClass} />
            </Field>
            {isProfesional ? (
              <Field label="Especialidad">
                <input
                  type="text"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  placeholder="Ej.: Neuropsicología"
                  className={inputClass}
                />
              </Field>
            ) : (
              <Field
                label="WhatsApp"
                hint={
                  phoneError ? undefined : profile.whatsapp_phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-semaforo-verde-claro" />
                      Acá te llegan los recordatorios de las actividades.
                    </span>
                  ) : (
                    "Agregalo para recibir recordatorios de las actividades."
                  )
                }
                error={phoneError ?? undefined}
              >
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border-[1.5px] border-r-0 border-borde-campo bg-pastilla-fondo text-[15px] text-tinta-suave">
                    +506
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="8888 8888"
                    className={`${inputClass} rounded-l-none`}
                  />
                </div>
              </Field>
            )}
            <ReadOnlyRow label="Correo" value={email} note="Es tu usuario para entrar. Para cambiarlo, escribinos." />
          </div>
        )}

        {tab === "familiar" && myPatient && (
          <div className="grid gap-4.5">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
              <Field label="Nombre">
                <input type="text" value={patientNombre} onChange={(e) => setPatientNombre(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Edad">
                <input type="text" inputMode="numeric" value={patientEdad} onChange={(e) => setPatientEdad(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <ProgramaCard
              patient={myPatient}
              onChoose={() => {
                onClose();
                navigate("/app/perfil/programa");
              }}
            />
          </div>
        )}

        {tab === "seguridad" && <SeguridadTab email={email} lastSignIn={user.last_sign_in_at} createdAt={user.created_at} />}

        {tab !== "seguridad" && (
          <div className="mt-6 pt-5 border-t border-borde-suave flex items-center justify-between gap-3 flex-wrap">
            <p className="m-0 text-[14px] min-h-5" aria-live="polite">
              {error ? (
                <span className="text-alerta-texto">{error}</span>
              ) : saved && !dirty ? (
                <span className="text-semaforo-verde-texto">✓ Cambios guardados</span>
              ) : dirty ? (
                <span className="text-tinta-tenue">Tenés cambios sin guardar</span>
              ) : null}
            </p>
            <Button variant="ink" dense onClick={save} disabled={saving || !dirty}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramaCard({ patient, onChoose }: { patient: MyPatient; onChoose: () => void }) {
  const tier = planTiers.find((t) => t.id === patient.modalidad);
  const pendiente = patient.plan_status === "pendiente";
  return (
    <div className="rounded-2xl border border-borde bg-fila-calida p-4.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[12px] tracking-[0.12em] uppercase text-tinta-tenue font-semibold">Programa</p>
          <p className="m-0 mt-1 font-serif text-[22px] text-tinta">{patient.programa_elegido && tier ? tier.nombre : "Sin elegir"}</p>
          {patient.programa_elegido && tier && (
            <p className="m-0 text-[14px] text-tinta-suave">
              {tier.precio} {tier.periodo}
            </p>
          )}
        </div>
        <span
          className={`text-[12px] font-semibold rounded-full px-2.5 py-1 ${
            pendiente ? "bg-aviso text-aviso-texto" : "bg-verde-tenue text-semaforo-verde-texto border border-borde-suave"
          }`}
        >
          {pendiente ? "En preparación" : "Activo"}
        </span>
      </div>
      <p className="m-0 mt-3 text-[13.5px] leading-relaxed text-tinta-suave">
        {pendiente
          ? "El equipo clínico está armando el plan. Mientras tanto podés cambiar de programa."
          : "Para cambiar de programa, escribile a tu clínica desde Mensajes."}
      </p>
      {pendiente && (
        <Button variant="secondary" size="sm" onClick={onChoose} className="mt-3">
          {patient.programa_elegido ? "Ver o cambiar programa" : "Elegir programa"}
        </Button>
      )}
    </div>
  );
}

function SeguridadTab({ email, lastSignIn, createdAt }: { email: string; lastSignIn?: string; createdAt: string }) {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [done, setDone] = useState(false);
  const { changePassword, loading, error, setError } = useChangePassword(email);
  const mismatch = !!confirmPw && confirmPw.length >= newPw.length && confirmPw !== newPw;

  async function submit() {
    setError("");
    if (newPw !== confirmPw) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (await changePassword(currentPw, newPw)) {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setOpen(false);
      setDone(true);
    }
  }

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" }) : "—");

  return (
    <div className="grid gap-4.5">
      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyRow label="Cuenta creada" value={fmt(createdAt)} />
        <ReadOnlyRow label="Último ingreso" value={fmt(lastSignIn)} />
      </div>
      <div className="rounded-2xl border border-borde p-4.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="m-0 text-[15px] font-semibold text-tinta">Contraseña</p>
            <p className="m-0 text-[13.5px] text-tinta-tenue">{done ? "✓ Actualizada hace un momento" : "Te recomendamos cambiarla cada cierto tiempo."}</p>
          </div>
          {!open && (
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              Cambiar
            </Button>
          )}
        </div>
        {open && (
          <div className="grid gap-3.5 mt-4 pt-4 border-t border-borde-suave">
            <Field label="Contraseña actual">
              <PasswordInput value={currentPw} onChange={setCurrentPw} autoComplete="current-password" placeholder="••••••••" />
            </Field>
            <Field label="Nueva contraseña">
              <PasswordInput value={newPw} onChange={setNewPw} autoComplete="new-password" placeholder="••••••••" />
              <PasswordRequirements password={newPw} />
            </Field>
            <Field label="Confirmar nueva contraseña" error={mismatch ? "Las contraseñas no coinciden." : undefined}>
              <PasswordInput value={confirmPw} onChange={setConfirmPw} onEnter={submit} autoComplete="new-password" invalid={mismatch} placeholder="••••••••" />
            </Field>
            {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => {
                  setOpen(false);
                  setError("");
                  setCurrentPw("");
                  setNewPw("");
                  setConfirmPw("");
                }}
              >
                Cancelar
              </Button>
              <Button variant="ink" size="sm" onClick={submit} disabled={loading || !currentPw || !newPw || !confirmPw}>
                {loading ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta focus:border-verde-serenidad";

function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="grid grid-cols-1 gap-2 text-[14.5px] font-semibold text-tinta-suave">
      {label}
      {children}
      {error ? (
        <span className="text-[13px] font-normal text-alerta-texto">{error}</span>
      ) : hint ? (
        <span className="text-[13px] font-normal text-tinta-tenue">{hint}</span>
      ) : null}
    </label>
  );
}

function ReadOnlyRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-campo border border-borde-suave px-4 py-3">
      <p className="m-0 text-[12px] tracking-[0.08em] uppercase text-tinta-tenue font-semibold">{label}</p>
      <p className="m-0 mt-0.5 text-[15px] text-tinta break-all">{value}</p>
      {note && <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">{note}</p>}
    </div>
  );
}

// "+50688887777" → "8888 7777" for display in the field (the +506 prefix
// is drawn beside it).
function formatCrPhone(e164: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "").replace(/^506/, "");
  return d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
}
