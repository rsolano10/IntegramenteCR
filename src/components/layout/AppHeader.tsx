import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";

const crumbs: [string, string][] = [
  ["/app/login", "Ingreso"],
  ["/app/consent", "Consentimiento"],
  ["/app/perfil", "Perfil funcional"],
  ["/app/hoy/actividad", "Marcela · Actividad"],
  ["/app/hoy", "Marcela · Hoy"],
  ["/app/plan", "Marcela · Plan"],
  ["/app/actividades", "Marcela · Actividades"],
  ["/app/asistente", "Marcela · Dudas"],
  ["/app/revision", "Marcela · Revisión"],
  ["/app/resumen", "Marcela · Resumen"],
  ["/app/participante/gustos", "Rosa · Sus gustos"],
  ["/app/participante/hoy", "Rosa · Hoy"],
  ["/app/participante/pasos", "Rosa · Paso a paso"],
  ["/app/participante/ayuda", "Rosa · Pidió ayuda"],
  ["/app/profesional/panel", "Dra. Solano · Panel"],
  ["/app/profesional/ficha", "Dra. Solano · Ficha"],
  ["/app/profesional/editor", "Dra. Solano · Editor"],
  ["/app/profesional/alerta", "Dra. Solano · Alerta"],
  ["/app/alerta/ideacion", "Urgencia"],
  ["/app/alerta/maltrato", "Protección"],
  ["/app/alerta/caida", "Alerta · caída"],
  ["/app/alerta/cambio", "Alerta · cambio agudo"],
  ["/app/alerta/extravio", "Riesgo · extravío"],
  ["/app/alerta/rechazo", "Ajuste"],
  ["/app/estado/offline", "Sin conexión"],
  ["/app/estado/vacio", "Sin plan"],
];

function crumbFor(pathname: string): string {
  const hit = crumbs.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : "";
}

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = useAppStore((s) => s.role);
  const logout = useAppStore((s) => s.logout);

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-borde sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <Link to="/" className="flex items-baseline gap-1.5 sm:gap-2 font-serif text-lg sm:text-[22px] text-tinta no-underline shrink-0">
          Integra<em className="italic text-verde-profundo">Mente</em>{" "}
          <span className="hidden sm:inline font-sans text-[11px] tracking-[0.16em] uppercase text-tinta-tenue">en Casa</span>
        </Link>
        {crumbFor(pathname) && (
          <span className="hidden sm:inline text-sm text-tinta-tenue pl-5 border-l border-borde truncate">{crumbFor(pathname)}</span>
        )}
      </div>
      {role && (
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="shrink-0 min-h-10 sm:min-h-11 px-3.5 sm:px-4.5 rounded-full border-[1.5px] border-borde bg-transparent font-sans text-sm sm:text-[15px] font-semibold cursor-pointer hover:border-verde-serenidad"
        >
          Cerrar sesión
        </button>
      )}
    </header>
  );
}
