import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { elegirPacienteActivo, empezarNuevoFamiliar, useMisPacientes } from "../../lib/pacienteActivo";
import { useAppStore } from "../../lib/store";
import { abrirVentanaCuenta } from "../../lib/abrirCuenta";

// El menú de la persona que acompaña la familia: un botón con su nombre,
// siempre arriba. Todo lo que es de ella (perfil, programa, resumen para el
// médico, quiénes la acompañan) y, si acompaña a más de una, cambiar de
// persona. El menú de la cuenta queda solo con lo de quien entra.
export function SelectorFamiliar() {
  const session = useSession();
  const navigate = useNavigate();
  const { data: pacientes } = useMisPacientes();
  const { data: activo } = useMyPatient();
  const resetOnboardingForNewAccount = useAppStore((s) => s.resetOnboardingForNewAccount);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  if (session.status !== "authed" || session.profile.role !== "familiar" || !activo) return null;
  const uid = session.session.user.id;
  const primer = (n: string) => n.split(" ")[0];
  const otras = (pacientes ?? []).filter((p) => p.id !== activo.id);
  const hacer = (f: () => void) => () => {
    setAbierto(false);
    f();
  };

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Menú de ${activo.nombre}`}
        className="inline-flex items-center gap-2 min-h-10 max-w-[170px] pl-1.5 pr-3 rounded-full border-[1.5px] border-verde-serenidad/60 bg-verde-tenue text-verde-profundo font-sans text-[14px] font-semibold cursor-pointer hover:border-verde-profundo"
      >
        <span className="shrink-0 w-7 h-7 rounded-full bg-verde-profundo text-white text-[12px] font-bold inline-flex items-center justify-center">{activo.nombre.charAt(0).toUpperCase()}</span>
        <span className="truncate">{primer(activo.nombre)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-30 w-[270px] rounded-[20px] border border-borde bg-white p-2 shadow-elevada">
          <p className="m-0 px-3 pt-1.5 pb-1 text-[15px] font-semibold text-tinta truncate">{activo.nombre}</p>
          <Item onClick={hacer(() => navigate("/app/perfil/resumen"))}>Su perfil</Item>
          <Item onClick={hacer(() => abrirVentanaCuenta("mi-programa"))}>Su programa</Item>
          <Item onClick={hacer(() => navigate("/app/resumen-medico"))}>Resumen para el médico</Item>
          <Item onClick={hacer(() => abrirVentanaCuenta("acompanante"))}>Quiénes acompañan a {primer(activo.nombre)}</Item>

          <div className="my-1.5 h-px bg-borde-suave" />
          {otras.length > 0 && (
            <>
              <p className="m-0 px-3 pt-1 pb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-tinta-tenue">Cambiar a</p>
              {otras.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  onClick={hacer(() => {
                    elegirPacienteActivo(uid, p.id);
                    navigate("/app/hoy");
                  })}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 border-0 bg-transparent text-left font-sans cursor-pointer hover:bg-campo"
                >
                  <span className="shrink-0 w-8 h-8 rounded-full bg-beige-serenidad text-tinta text-[13px] font-bold inline-flex items-center justify-center">{p.nombre.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 truncate text-[15px] font-semibold text-tinta">{p.nombre}</span>
                </button>
              ))}
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={hacer(() => {
              empezarNuevoFamiliar();
              resetOnboardingForNewAccount(uid);
              navigate("/app/perfil/bienvenida");
            })}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 border-0 bg-transparent text-left font-sans text-[14.5px] font-semibold text-verde-profundo cursor-pointer hover:bg-campo"
          >
            <span className="shrink-0 w-8 h-8 rounded-full border-[1.5px] border-dashed border-verde-serenidad inline-flex items-center justify-center text-[17px]">+</span>
            Inscribir a otra persona
          </button>
        </div>
      )}
    </div>
  );
}

function Item({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="w-full rounded-2xl px-3 py-2.5 border-0 bg-transparent text-left font-sans text-[15px] text-tinta cursor-pointer hover:bg-campo">
      {children}
    </button>
  );
}
