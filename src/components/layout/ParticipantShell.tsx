import { useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { supabase } from "../../lib/supabase";
import { uploadAvatar } from "../../lib/avatar";
import { Modal } from "../ui/Modal";
import { WelcomeMessageModal } from "../ui/WelcomeMessageModal";
import { ProductTour } from "../ui/ProductTour";
import { participanteTourSteps } from "../../lib/tourSteps";
import { CalendarSyncCard } from "../ui/CalendarSyncCard";

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (session.status !== "authed") return null;
  const { nombre, foto_url } = session.profile;
  const initials = nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "P";

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

      {open && !showCalendar && (
        <Modal onClose={() => setOpen(false)}>
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full min-h-17 border-2 border-mostaza-vital rounded-2xl bg-aviso text-[#4a3a1b] font-sans text-[20px] font-bold cursor-pointer disabled:opacity-50"
            >
              {uploading ? "Subiendo…" : "Cambiar foto"}
            </button>
            {error && <p className="m-0 text-[15px] text-alerta-texto">{error}</p>}
            {myPatient?.id && (
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full min-h-17 border-2 border-verde-serenidad rounded-2xl bg-[#f5f9f9] text-verde-profundo font-sans text-[20px] font-bold cursor-pointer"
              >
                Avisos en tu teléfono
              </button>
            )}
            <button
              type="button"
              onClick={doLogout}
              className="w-full min-h-17 border-none rounded-2xl bg-tinta text-white font-sans text-[20px] font-bold cursor-pointer hover:bg-verde-profundo"
            >
              Cerrar sesión
            </button>
          </div>
        </Modal>
      )}

      {open && showCalendar && myPatient?.id && (
        <Modal onClose={() => setShowCalendar(false)}>
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
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
