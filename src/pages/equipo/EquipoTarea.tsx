import { Navigate, useParams } from "react-router-dom";

// Enlaces viejos a una tarea (/app/equipo/tarea/:id): abren la bandeja con
// esa revisión elegida.
export function EquipoTarea() {
  const { id = "" } = useParams();
  return <Navigate to={`/app/equipo?t=${id}`} replace />;
}
