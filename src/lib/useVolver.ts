import { useNavigate } from "react-router-dom";

// «Volver» a la pantalla de la que se vino (Hoy, Mi semana, la actividad…),
// como el botón atrás del teléfono. Si se entró directo (un enlace de
// WhatsApp, por ejemplo) y no hay pantalla anterior en la app, va a
// `respaldo`. React Router guarda en history.state.idx la posición dentro
// de la app: mayor que 0 = hay una pantalla anterior nuestra.
export function useVolver(respaldo: string) {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(respaldo, { replace: true });
  };
}

// Desde dónde se abrió una actividad: Mi semana (/app/plan/actividad/…) u Hoy.
export function origenDeActividad(pathname: string): { ruta: string; nombre: string } {
  return pathname.startsWith("/app/plan") ? { ruta: "/app/plan", nombre: "Mi semana" } : { ruta: "/app/hoy", nombre: "Hoy" };
}
