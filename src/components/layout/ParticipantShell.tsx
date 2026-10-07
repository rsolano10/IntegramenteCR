import { useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { supabase } from "../../lib/supabase";
import { uploadAvatar } from "../../lib/avatar";
import { useChangePassword, passwordStrength } from "../../lib/useChangePassword";
import { Modal } from "../ui/Modal";
import { WelcomeMessageModal } from "../ui/WelcomeMessageModal";
import { ProductTour } from "../ui/ProductTour";
import { participanteTourSteps } from "../../lib/tourSteps";
import { CalendarSyncCard } from "../ui/CalendarSyncCard";
import { BigActionButton } from "../ui/BigActionButton";

const bigInputClass = "w-full rounded-2xl border-[1.5px] border-borde-campo bg-campo px-5 py-4 font-sans text-[20px] text-tinta";

function PendienteRevision() {
  return (
    <div className="flex flex-col gap-6 flex-1 justify-center text-center">
      <p className="m-0 text-[30px] leading-snug font-serif">Ya casi está listo</p>
      <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">
        Tu equipo está preparando tus actividades. Pronto vas a tener novedades.
      </p>
    </div>
  );
}

// The participant experience has no AppHeader (deliberately minimal, see
// AppHeader.tsx's own guard) — so this is the only place a paciente without
// "vista completa" can see their photo or log out at all.
function AvatarMenu() {
  const navigate = useNavigate();
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const resetSessionState = useAppStore((s) => s.resetSessionState);
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<"menu" | "calendar" | "nombre" | "password">("menu");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombreValue, setNombreValue] = useState("");
  const [savingNombre, setSavingNombre] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const email = session.status === "authed" ? session.session.user.email ?? "" : "";
  const { changePassword, loading: pwLoading, error: pwError, setError: setPwError } = useChangePassword(email);

  if (session.status !== "authed") return null;
  const { nombre, foto_url } = session.profile;
  const initials = nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "P";

  function closeAll() {
    setOpen(false);
    setScreen("menu");
    setError("");
    setPwError("");
  }

  async function doLogout() {
    navigate("/");
    resetSessionState();
    await supabase.auth.signOut();
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
      await supabase.auth.refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function saveNombre() {
    if (session.status !== "authed" || !nombreValue.trim()) return;
    setSavingNombre(true);
    const { error: updateError } = await supabase.from("profiles").update({ nombre: nombreValue.trim() }).eq("id", session.session.user.id);
    setSavingNombre(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.refreshSession();
    setScreen("menu");
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
      setScreen("menu");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tu cuenta"
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shrink-0 cursor-pointer"
      >
        {foto_url ? (
          <img src={foto_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-verde-serenidad text-white font-serif font-bold text-lg">{initials}</span>
        )}
      </button>

      {open && screen === "menu" && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {foto_url ? (
                <img src={foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-verde-serenidad text-white font-serif font-bold text-2xl">{initials}</span>
              )}
            </div>
            <p className="m-0 text-[22px] font-serif">{nombre}</p>

            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <BigActionButton variant="caution" size="md" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Subiendo…" : "Cambiar foto"}
            </BigActionButton>
            {error && <p className="m-0 text-[15px] text-alerta-texto">{error}</p>}
            <BigActionButton
              variant="secondary"
              size="md"
              onClick={() => {
                setNombreValue(nombre);
                setScreen("nombre");
              }}
            >
              Cambiar mi nombre
            </BigActionButton>
            {myPatient?.id && (
              <BigActionButton variant="soft" size="md" onClick={() => setScreen("calendar")}>
                Avisos en tu teléfono
              </BigActionButton>
            )}
            <BigActionButton variant="secondary" size="md" onClick={() => setScreen("password")}>
              Cambiar contraseña
            </BigActionButton>
            <BigActionButton variant="ink" size="md" onClick={doLogout}>
              Cerrar sesión
            </BigActionButton>
          </div>
        </Modal>
      )}

      {open && screen === "nombre" && (
        <Modal onClose={closeAll}>
          <button type="button" onClick={() => setScreen("menu")} className="mb-3 border-none bg-transparent font-sans text-[16px] text-verde-profundo cursor-pointer p-0">
            ‹ Atrás
          </button>
          <p className="m-0 mb-4 text-[20px] leading-relaxed text-tinta">¿Cómo querés que te llamemos?</p>
          <input type="text" value={nombreValue} onChange={(e) => setNombreValue(e.target.value)} className={`${bigInputClass} mb-4`} />
          {error && <p className="m-0 mb-4 text-[15px] text-alerta-texto">{error}</p>}
          <BigActionButton variant="ink" disabled={savingNombre || !nombreValue.trim()} onClick={saveNombre}>
            {savingNombre ? "Guardando…" : "Guardar"}
          </BigActionButton>
        </Modal>
      )}

      {open && screen === "password" && (
        <Modal onClose={closeAll}>
          <button type="button" onClick={() => setScreen("menu")} className="mb-3 border-none bg-transparent font-sans text-[16px] text-verde-profundo cursor-pointer p-0">
            ‹ Atrás
          </button>
          <p className="m-0 mb-4 text-[20px] leading-relaxed text-tinta">Cambiar contraseña</p>
          <div className="grid grid-cols-1 gap-3.5 mb-4">
            <input type="password" placeholder="Contraseña actual" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={bigInputClass} />
            <input type="password" placeholder="Nueva contraseña" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={bigInputClass} />
            {newPw && <p className="m-0 text-[15px] text-tinta-tenue">Fuerza: {passwordStrength(newPw)} · al menos 8 caracteres, con letras y números</p>}
            <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={bigInputClass} />
          </div>
          {pwError && <p className="m-0 mb-4 text-[15px] text-alerta-texto">{pwError}</p>}
          <BigActionButton variant="ink" disabled={pwLoading || !currentPw || !newPw || !confirmPw} onClick={submitPassword}>
            {pwLoading ? "Guardando…" : "Guardar contraseña"}
          </BigActionButton>
        </Modal>
      )}

      {open && screen === "calendar" && myPatient?.id && (
        <Modal onClose={closeAll}>
          <button
            type="button"
            onClick={() => setScreen("menu")}
            className="mb-3 border-none bg-transparent font-sans text-[16px] text-verde-profundo cursor-pointer p-0"
          >
            ‹ Atrás
          </button>
          <p className="m-0 mb-4 text-[18px] leading-relaxed text-tinta">
            Agregá tus actividades al calendario de tu teléfono para recibir un aviso a la hora exacta de cada una.
          </p>
          <CalendarSyncCard patientId={myPatient.id} />
        </Modal>
      )}
    </>
  );
}

export function ParticipantShell() {
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const pendiente = myPatient?.plan_status === "pendiente";
  const nombre = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const [tourSeen, setTourSeen] = useState(false);

  function dismissTour() {
    setTourSeen(true);
    if (session.status === "authed") {
      supabase.from("profiles").update({ onboarding_tour_seen: true }).eq("id", session.session.user.id);
    }
  }

  return (
    <div className="im-in min-h-full flex flex-col">
      <div className="bg-beige-serenidad px-5 py-6 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="m-0 mb-1.5 text-lg text-tinta-suave">Miércoles</p>
            <h1 className="font-serif font-normal text-[28px] sm:text-[32px] m-0">Hola, {nombre}</h1>
          </div>
          <AvatarMenu />
        </div>
      </div>
      <div className="flex-1 px-5 py-6 sm:px-8 flex justify-center">
        <div className="w-full max-w-xl flex flex-col gap-5.5">{pendiente ? <PendienteRevision /> : <Outlet />}</div>
      </div>

      {(() => {
        const tourPending = session.status === "authed" && !session.profile.onboarding_tour_seen && !tourSeen;
        if (tourPending) return <ProductTour steps={participanteTourSteps} onFinish={dismissTour} />;
        if (!pendiente && myPatient?.welcome_message_pending) return <WelcomeMessageModal patientId={myPatient.id} />;
        return null;
      })()}
    </div>
  );
}
