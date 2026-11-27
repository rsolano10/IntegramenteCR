import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../lib/useSession";
import { useTareasEquipo } from "../../lib/tareasEquipo";
import { Caja, CajaCuerpo, CajaPestanas, Pagina, type PestanaCaja } from "../../components/profesional/Caja";
import { TareaFila } from "../../components/profesional/tareas/TareaFila";

// Inicio del equipo clínico: las revisiones que le pidió la coordinación.
type Vista = "abiertas" | "resueltas";

export function EquipoInicio() {
  const session = useSession();
  const navigate = useNavigate();
  const { data: tareas, isLoading } = useTareasEquipo();
  const [vista, setVista] = useState<Vista>("abiertas");
  const nombre = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const area = session.status === "authed" ? session.profile.especialidad : null;
  const abiertas = (tareas ?? []).filter((t) => t.estado === "pendiente" || t.estado === "en_curso");
  const resueltas = (tareas ?? []).filter((t) => t.estado === "resuelta" || t.estado === "cancelada");
  const lista = vista === "abiertas" ? abiertas : resueltas;
  const pestanas: PestanaCaja<Vista>[] = [
    { id: "abiertas", label: abiertas.length ? `Por revisar (${abiertas.length})` : "Por revisar" },
    { id: "resueltas", label: "Resueltas" },
  ];
  return (
    <Pagina ancho="max-w-[960px]">
      <Caja
        eyebrow={`Equipo clínico${area ? ` · ${area}` : ""}`}
        titulo={`Hola${nombre ? `, ${nombre}` : ""}`}
        descripcion="Lo que la coordinación te pidió revisar. Abrí cada tarea para ver el caso, la semana o la plantilla, y respondé desde ahí."
        pie={<CajaPestanas etiqueta="Tareas" pestanas={pestanas} activa={vista} onCambiar={setVista} />}
      >
        <CajaCuerpo>
          {isLoading ? (
            <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="m-0 text-[15.5px] text-tinta-suave">{vista === "abiertas" ? "No tenés revisiones pendientes. Cuando la coordinación te pida algo, aparece acá." : "Todavía no resolviste tareas."}</p>
          ) : (
            <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
              {lista.map((t) => (
                <li key={t.id}>
                  <TareaFila t={t} mostrarAsignada={false} onAbrir={() => navigate(`/app/equipo/tarea/${t.id}`)} />
                </li>
              ))}
            </ul>
          )}
        </CajaCuerpo>
      </Caja>
    </Pagina>
  );
}
