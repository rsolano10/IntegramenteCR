import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { uploadAvatar } from "../../lib/avatar";
import { normalizeCrPhone } from "../../lib/phone";
import { useChangePassword, passwordStrength } from "../../lib/useChangePassword";
import { planTiers } from "../../lib/mockData";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { PillToggle } from "./PillToggle";
import { PasswordInput } from "./PasswordInput";

const modalidadOptions = planTiers.map((t) => ({ value: t.id, label: t.nombre }));

// One "Mi cuenta" for the three roles — each used to live in a different
// place with different powers (familiar/paciente had this real modal,
// profesional had a read-only block inlined in AppHeader, participante
// mínimo had a bespoke avatar-only menu). Field visibility branches on role
// internally (via useSession) so every caller just renders <MiPerfilModal/>.
export function MiPerfilModal({ onClose, isSelf = false }: { onClose: () => void; isSelf?: boolean }) {
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const role = session.status === "authed" ? session.profile.role : null;
  const email = session.status === "authed" ? session.session.user.email ?? "" : "";
  const fotoUrl = session.status === "authed" ? session.profile.foto_url : null;
  const isProfesional = role === "profesional";
  const hasPatientSection = !!myPatient;

  const [nombre, setNombre] = useState(session.status === "authed" ? session.profile.nombre : "");
  const [especialidad, setEspecialidad] = useState(session.status === "authed" ? session.profile.especialidad ?? "" : "");
  const [phone, setPhone] = useState(session.status === "authed" ? session.profile.whatsapp_phone ?? "" : "");
  const [patientNombre, setPatientNombre] = useState(myPatient?.nombre ?? "");
  const [patientEdad, setPatientEdad] = useState(myPatient?.edad ?? "");
  const [modalidad, setModalidad] = useState(myPatient?.modalidad ?? "orientado");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const { changePassword, loading: pwLoading, error: pwError, setError: setPwError } = useChangePassword(email);

  async function refreshSession() {
    // useSession() only re-reads profiles on an auth state change, not on a
    // plain DB write — force one so the header/modal pick up the new values
    // right away instead of waiting for the next token refresh or reload.
    await supabase.auth.refreshSession();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || session.status !== "authed") return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadAvatar(session.session.user.id, file);
      const { error: updateError } = await supabase.from("profiles").update({ foto_url: url }).eq("id", session.session.user.id);
      if (updateError) throw updateError;
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (session.status !== "authed") return;
    setError("");
    if (!nombre.trim()) {
      setError("Tu nombre no puede quedar vacío.");
      return;
    }
    const normalizedPhone = phone.trim() ? normalizeCrPhone(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setError("El número de WhatsApp no parece válido — usá los 8 dígitos costarricenses.");
      return;
    }
    setSaving(true);

    const profileUpdate: Record<string, string | null> = { nombre: nombre.trim() };
    if (isProfesional) profileUpdate.especialidad = especialidad.trim() || null;
    if (!isProfesional) profileUpdate.whatsapp_phone = normalizedPhone;

    const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", session.session.user.id);
    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    if (myPatient) {
      const { error: patientError } = await supabase
        .from("patients")
        .update({ nombre: patientNombre.trim() || myPatient.nombre, edad: patientEdad.trim() || null, modalidad })
        .eq("id", myPatient.id);
      if (patientError) {
        setSaving(false);
        setError(patientError.message);
        return;
      }
    }

    await refreshSession();
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["my-patient", session.session.user.id] });
    onClose();
  }

  async function submitPassword() {
    setPwError("");
    if (newPw !== confirmPw) {
      setPwError("Las contraseñas nuevas no coinciden.");
      return;
    }
    const ok = await changePassword(currentPw, newPw);
    if (ok) {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setChangingPassword(false);
      setStatusMsg("Contraseña actualizada.");
    }
  }

  const initials = (session.status === "authed" ? session.profile.nombre : "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Mi cuenta</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        Tus datos{hasPatientSection ? (isSelf ? " y los de tu perfil" : " y los de tu familiar") : ""}.
      </p>

      <div className="grid grid-cols-1 gap-4.5">
        <div className="flex items-center gap-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Cambiar foto"
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-borde shrink-0 cursor-pointer disabled:opacity-60"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-verde-serenidad text-white font-serif font-bold text-xl">
                {initials || "·"}
              </span>
            )}
          </button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo…" : "Cambiar foto"}
          </Button>
        </div>

        <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
          Tu nombre
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
          />
        </label>

        <div>
          <p className="m-0 mb-1 text-[15px] font-semibold text-tinta-suave">Correo</p>
          <p className="m-0 text-[15px] text-tinta-tenue">{email}</p>
        </div>

        {isProfesional && (
          <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
            Especialidad
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Ej.: Neuropsicología"
              className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        )}

        {!isProfesional && (
          <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
            WhatsApp (opcional)
            <input
              type="text"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="8888 8888"
              className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
            />
            <span className="text-[13px] font-normal text-tinta-tenue">Ahí te llegan los recordatorios de las actividades asignadas.</span>
          </label>
        )}

        {hasPatientSection && (
          <div className="pt-4 border-t border-borde-suave">
            <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">{isSelf ? "Tus datos" : "Datos de tu familiar"}</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
                <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
                  Nombre
                  <input
                    type="text"
                    value={patientNombre}
                    onChange={(e) => setPatientNombre(e.target.value)}
                    className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
                  />
                </label>
                <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
                  Edad
                  <input
                    type="text"
                    value={patientEdad}
                    onChange={(e) => setPatientEdad(e.target.value)}
                    className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
                  />
                </label>
              </div>
              <div>
                <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Modalidad</p>
                <PillToggle value={modalidad} onChange={setModalidad} options={modalidadOptions} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>

        <div className="pt-4 border-t border-borde-suave">
          {!changingPassword ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="m-0 text-[14px] text-tinta-tenue">{statusMsg || "Contraseña"}</p>
              <Button variant="secondary" size="sm" onClick={() => setChangingPassword(true)}>
                Cambiar contraseña
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              <p className="m-0 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Cambiar contraseña</p>
              <label className="grid grid-cols-1 gap-2 text-[14px] font-semibold text-tinta-suave">
                Contraseña actual
                <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
              </label>
              <label className="grid grid-cols-1 gap-2 text-[14px] font-semibold text-tinta-suave">
                Nueva contraseña
                <PasswordInput value={newPw} onChange={setNewPw} placeholder="••••••••" />
                {newPw && (
                  <span className="text-[12.5px] font-normal text-tinta-tenue">
                    Fuerza: <strong className="text-tinta-suave">{passwordStrength(newPw)}</strong> · al menos 8 caracteres, con letras y números
                  </span>
                )}
              </label>
              <label className="grid grid-cols-1 gap-2 text-[14px] font-semibold text-tinta-suave">
                Confirmar nueva contraseña
                <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
              </label>
              {pwError && <p className="m-0 text-[13px] text-alerta-texto">{pwError}</p>}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setChangingPassword(false);
                    setPwError("");
                    setCurrentPw("");
                    setNewPw("");
                    setConfirmPw("");
                  }}
                  disabled={pwLoading}
                >
                  Cancelar
                </Button>
                <Button variant="ink" size="sm" onClick={submitPassword} disabled={pwLoading || !currentPw || !newPw || !confirmPw}>
                  {pwLoading ? "Guardando…" : "Guardar contraseña"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
