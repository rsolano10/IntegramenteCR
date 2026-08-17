import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen flex items-center justify-center px-5 py-14 sm:px-8">
      <div className="w-full max-w-[480px] bg-white border border-borde rounded-3xl p-6 sm:p-9 shadow-elevada">
        <Link to="/" className="inline-flex items-baseline gap-2 font-serif text-xl text-tinta mb-6 no-underline">
          Integra<em className="italic text-verde-profundo">Mente</em>
        </Link>

        {!sent ? (
          <>
            <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">¿Olvidaste tu contraseña?</h1>
            <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">
              Ingresá el correo con el que te registraste y te enviamos las instrucciones para crear una nueva contraseña.
            </p>
            <div className="grid gap-4.5">
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
              <Button variant="ink" fullWidth onClick={submit}>
                Enviar instrucciones
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">Revisá tu correo</h1>
            <p className="text-base leading-relaxed text-tinta-suave m-0">
              Si <strong>{email}</strong> tiene una cuenta con nosotros, le enviamos un enlace para restablecer la contraseña. Puede
              tardar unos minutos en llegar.
            </p>
          </>
        )}

        <Link to="/app/login" className="inline-block mt-6 text-[15px] text-verde-profundo">
          ‹ Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
