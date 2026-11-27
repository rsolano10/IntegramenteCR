import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { elegirPacienteActivo, empezarNuevoFamiliar, useMisPacientes } from "../../lib/pacienteActivo";
import { useAppStore } from "../../lib/store";

// Para el familiar que acompaña a más de una persona: con quién está ahora
// (siempre a la vista, arriba) y cambiar en un toque. También el camino para
// registrar a otro familiar.
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

  if (session.status !== "authed" || session.profile.role !== "familiar" || !activo || !pacientes || pacientes.length < 2) return null;
  const uid = session.session.user.id;
  const primer = (n: string) => n.split(" ")[0];

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Acompañando a ${activo.nombre}. Cambiar de familiar`}
        className="inline-flex items-center gap-2 min-h-10 max-w-[170px] pl-1.5 pr-3 rounded-full border-[1.5px] border-verde-serenidad/60 bg-verde-tenue text-verde-profundo font-sans text-[14px] font-semibold cursor-pointer hover:border-verde-profundo"
      >
        <span className="shrink-0 w-7 h-7 rounded-full bg-verde-profundo text-white text-[12px] font-bold inline-flex items-center justify-center">{activo.nombre.charAt(0).toUpperCase()}</span>
        <span className="truncate">{primer(activo.nombre)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-30 w-[260px] rounded-[20px] border border-borde bg-white p-2 shadow-elevada">
          <p className="m-0 px-3 pt-1.5 pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-tinta-tenue">Tus familiares</p>
          {pacientes.map((p) => {
            const actual = p.id === activo.id;
            return (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={actual}
                onClick={() => {
                  setAbierto(false);
                  if (!actual) {
                    elegirPacienteActivo(uid, p.id);
                    navigate("/app/hoy");
                  }
                }}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 border-0 text-left font-sans cursor-pointer ${actual ? "bg-verde-tenue" : "bg-transparent hover:bg-campo"}`}
              >
                <span className={`shrink-0 w-9 h-9 rounded-full text-[14px] font-bold inline-flex items-center justify-center ${actual ? "bg-verde-profundo text-white" : "bg-beige-serenidad text-tinta"}`}>
                  {p.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-tinta">{p.nombre}</span>
                  {actual && <span className="block text-[12.5px] text-verde-profundo">Lo que ves ahora</span>}
                </span>
                {actual && (
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-verde-profundo">
                    <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
          <div className="my-1.5 h-px bg-borde-suave" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              empezarNuevoFamiliar();
              resetOnboardingForNewAccount(uid);
              navigate("/app/perfil/bienvenida");
            }}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 border-0 bg-transparent text-left font-sans text-[15px] font-semibold text-verde-profundo cursor-pointer hover:bg-campo"
          >
            <span className="shrink-0 w-9 h-9 rounded-full border-[1.5px] border-dashed border-verde-serenidad inline-flex items-center justify-center text-[18px]">+</span>
            Agregar otro familiar
          </button>
        </div>
      )}
    </div>
  );
}

