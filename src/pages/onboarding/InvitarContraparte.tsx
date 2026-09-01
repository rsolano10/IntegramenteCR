import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession, roleHome } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { callAdminAccounts } from "../../lib/adminAccounts";
import { Button } from "../../components/ui/Button";

// Shown once, right after self_onboard creates the patient — asks whether
// there's a second person (patient or caregiver, depending on who just
// registered) who should get their own account, and invites them on the
// spot via the same real invite mechanism the clinic uses.
export function InvitarContraparte() {
  const navigate = useNavigate();
  const session = useSession();
  const { data: myPatient, isLoading } = useMyPatient();
  const role = session.status === "authed" ? session.profile.role : null;
  const isFamiliar = role === "familiar";

  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [nombre, setNombre] = useState("");
  const [nombreTouched, setNombreTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (isLoading || !myPatient || !role || role === "profesional") return <div className="min-h-[40vh]" />;

  const effectiveNombre = !nombreTouched && isFamiliar ? myPatient.nombre : nombre;

  function finish() {
    navigate(roleHome(role!));
  }

  async function sendInvite() {
    if (!effectiveNombre.trim() || !email.trim()) {
      setError("Completá el nombre y el correo.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await callAdminAccounts("invite_counterpart", { patientId: myPatient!.id, email: email.trim(), nombre: effectiveNombre.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar la invitación.");
    } finally {
      setSending(false);
    }
  }

  const question = isFamiliar
    ? `¿${myPatient.nombre || "esta persona"} puede usar la aplicación?`
    : "¿Hay alguien que te ayude con las actividades diarias?";

  if (answer === null) {
    return (
      <div className="im-in max-w-[560px] mx-auto px-5 py-14 sm:px-8 lg:py-20 text-center">
        <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-snug m-0 mb-6">{question}</h1>
        <div className="grid gap-3 max-w-[320px] mx-auto">
          <Button variant="ink" onClick={() => setAnswer("yes")}>
            Sí
          </Button>
          <Button variant="secondary" onClick={() => setAnswer("no")}>
            No
          </Button>
        </div>
      </div>
    );
  }

  if (answer === "no" || sent) {
    return (
      <div className="im-in max-w-[560px] mx-auto px-5 py-14 sm:px-8 lg:py-20 text-center">
        <h1 className="font-serif font-normal text-[28px] m-0 mb-4">{sent ? "Invitación enviada" : "Listo"}</h1>
        <p className="m-0 mb-6 text-[16px] leading-relaxed text-tinta-suave">
          {sent
            ? `Le enviamos un correo a ${email} para que cree su cuenta.`
            : "Podés invitarla más adelante si cambia de opinión."}
        </p>
        <Button variant="ink" fullWidth onClick={finish}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="im-in max-w-[560px] mx-auto px-5 py-14 sm:px-8 lg:py-20">
      <h1 className="font-serif font-normal text-[28px] m-0 mb-2">{isFamiliar ? `Invitá a ${myPatient.nombre || "la persona"}` : "Invitá a tu familiar"}</h1>
      <p className="m-0 mb-6 text-[15px] leading-relaxed text-tinta-suave">
        Le enviamos un correo para que cree su propia cuenta y pueda usar la aplicación también.
      </p>
      <div className="grid gap-4 mb-5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Nombre
          <input
            type="text"
            value={effectiveNombre}
            onChange={(e) => {
              setNombreTouched(true);
              setNombre(e.target.value);
            }}
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
          />
        </label>
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
          />
        </label>
      </div>
      {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={finish}>
          Omitir
        </Button>
        <Button variant="ink" onClick={sendInvite} disabled={sending}>
          {sending ? "Enviando…" : "Enviar invitación"}
        </Button>
      </div>
    </div>
  );
}
