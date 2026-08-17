import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { Button } from "../components/ui/Button";

export function Login() {
  const navigate = useNavigate();
  const email = useAppStore((s) => s.email);
  const loginHint = useAppStore((s) => s.loginHint);
  const setEmail = useAppStore((s) => s.setEmail);
  const setLoginHint = useAppStore((s) => s.setLoginHint);
  const loginAs = useAppStore((s) => s.loginAs);

  function quickLogin(role: "familiar" | "paciente" | "profesional", to: string) {
    loginAs(role);
    navigate(to);
  }

  function submit() {
    const e = email.trim().toLowerCase();
    if (e.startsWith("familiar")) quickLogin("familiar", "/app/consent");
    else if (e.startsWith("paciente")) quickLogin("paciente", "/app/participante/gustos");
    else if (e.startsWith("clinica") || e.startsWith("profesional")) quickLogin("profesional", "/app/profesional/panel");
    else setLoginHint("Usá familiar@test.com, paciente@test.com o clinica@test.com");
  }

  return (
    <div className="im-in max-w-[1080px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-14 lg:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div>
        <h1 className="font-serif font-normal text-[32px] sm:text-[38px] lg:text-[44px] leading-[1.15] lg:leading-[1.1] m-0 mb-3 lg:mb-4.5">
          Cuentas de prueba
        </h1>
        <p className="text-base lg:text-lg leading-relaxed text-tinta-suave m-0 mb-5 lg:mb-7.5 max-w-[30em]">
          Cualquier contraseña funciona. Cada cuenta abre su propio recorrido.
        </p>
        <div className="grid gap-3 max-w-[30em]">
          <button
            type="button"
            onClick={() => quickLogin("familiar", "/app/consent")}
            className="text-left grid grid-cols-[1fr_auto] items-center gap-4 px-5.5 py-4.5 rounded-2xl border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
          >
            <span>
              <strong className="block text-[17px] mb-1">familiar@test.com</strong>
              <span className="text-[15px] text-tinta-tenue">Marcela · organiza el cuidado de Rosa</span>
            </span>
            <span className="text-[15px] text-verde-profundo font-semibold">Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => quickLogin("paciente", "/app/participante/hoy")}
            className="text-left grid grid-cols-[1fr_auto] items-center gap-4 px-5.5 py-4.5 rounded-2xl border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
          >
            <span>
              <strong className="block text-[17px] mb-1">paciente@test.com</strong>
              <span className="text-[15px] text-tinta-tenue">Rosa · vista simplificada</span>
            </span>
            <span className="text-[15px] text-verde-profundo font-semibold">Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => quickLogin("profesional", "/app/profesional/panel")}
            className="text-left grid grid-cols-[1fr_auto] items-center gap-4 px-5.5 py-4.5 rounded-2xl border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
          >
            <span>
              <strong className="block text-[17px] mb-1">clinica@test.com</strong>
              <span className="text-[15px] text-tinta-tenue">Dra. Guiselle Solano · panel clínico</span>
            </span>
            <span className="text-[15px] text-verde-profundo font-semibold">Entrar</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-borde rounded-3xl p-6 sm:p-8 lg:p-9 shadow-elevada">
        <h2 className="font-serif font-normal text-2xl lg:text-[28px] m-0 mb-6">Iniciar sesión</h2>
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
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Contraseña
            <input
              type="password"
              placeholder="••••••••"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
            />
          </label>
          <Button variant="ink" fullWidth onClick={submit}>
            Entrar
          </Button>
          <p className="m-0 text-[15px] text-alerta-texto min-h-[22px]">{loginHint}</p>
          <Link to="/olvide-password" className="text-[15px] text-verde-profundo justify-self-start">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
