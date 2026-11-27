import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Caja, CajaAviso, CajaCuerpo, CajaPestanas, Pagina, type PestanaCaja } from "../../components/profesional/Caja";
import { Button } from "../../components/ui/Button";
import { RowMenu } from "../../components/ui/RowMenu";
import { NuevaTareaModal } from "../../components/profesional/tareas/NuevaTareaModal";
import { TareaFila } from "../../components/profesional/tareas/TareaFila";
import { useEquipoClinico, useResponderTarea, useTareasEquipo } from "../../lib/tareasEquipo";
import { ROL_ETIQUETA } from "../../lib/areasSalud";

// Tareas del equipo (clínica y coordinación): las revisiones pedidas al
// equipo clínico, quién las tiene y qué respondieron.
type Vista = "abiertas" | "resueltas" | "equipo";

export function TareasEquipo() {
  const { data: tareas, isLoading } = useTareasEquipo();
  const { data: equipo } = useEquipoClinico();
  const responder = useResponderTarea();
  const [vista, setVista] = useState<Vista>("abiertas");
  const [persona, setPersona] = useState("");
  const [nueva, setNueva] = useState(false);
  const [aviso, setAviso] = useState<{ text: string; error?: boolean } | null>(null);

  const filtradas = useMemo(
    () =>
      (tareas ?? []).filter(
        (t) =>
          (!persona || t.asignada_a === persona) &&
          (vista === "abiertas" ? t.estado === "pendiente" || t.estado === "en_curso" : vista === "resueltas" ? t.estado === "resuelta" || t.estado === "cancelada" : true),
      ),
    [tareas, persona, vista],
  );
  const abiertas = (tareas ?? []).filter((t) => t.estado === "pendiente" || t.estado === "en_curso").length;
  const pestanas: PestanaCaja<Vista>[] = [
    { id: "abiertas", label: abiertas ? `Abiertas (${abiertas})` : "Abiertas" },
    { id: "resueltas", label: "Resueltas" },
    { id: "equipo", label: "El equipo" },
  ];

  return (
    <Pagina>
      <Caja
        eyebrow="Clínica y coordinación"
        titulo="Tareas del equipo"
        descripcion="Pedile al equipo clínico que revise un paciente, una semana o una plantilla. Cada respuesta queda registrada."
        acciones={
          <Button dense onClick={() => setNueva(true)}>
            + Pedir revisión
          </Button>
        }
        pie={<CajaPestanas etiqueta="Tareas" pestanas={pestanas} activa={vista} onCambiar={setVista} />}
      >
        {aviso && <CajaAviso texto={aviso.text} error={aviso.error} onCerrar={() => setAviso(null)} />}
        <CajaCuerpo>
          {vista === "equipo" ? (
            <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
              {(equipo ?? []).map((m) => (
                <li key={m.profile_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-borde-suave last:border-b-0">
                  <span>
                    <span className="block text-[15px] font-semibold text-tinta">{m.nombre}</span>
                    <span className="block text-[13px] text-tinta-suave">{[m.especialidad, ROL_ETIQUETA[m.rol]].filter(Boolean).join(" · ")}</span>
                  </span>
                  <button type="button" onClick={() => { setPersona(m.profile_id); setVista("abiertas"); }} className="border-0 bg-transparent p-0 text-[14px] font-semibold text-verde-profundo cursor-pointer underline decoration-dotted">
                    {m.pendientes === 0 ? "Sin tareas abiertas" : `${m.pendientes} abierta${m.pendientes === 1 ? "" : "s"}`}
                  </button>
                </li>
              ))}
              {(equipo ?? []).length <= 1 && (
                <li className="px-4 py-4 text-[14px] text-tinta-suave">
                  Para sumar al equipo clínico, creá su cuenta en <Link to="/app/profesional/usuarios?tab=equipo" className="text-verde-profundo">Usuarios › Equipo</Link>, con su área.
                </li>
              )}
            </ul>
          ) : (
            <div className="grid gap-4">
              <label className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-tinta-suave">
                Persona
                <select value={persona} onChange={(e) => setPersona(e.target.value)} className="min-h-10 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14px] text-tinta">
                  <option value="">Todo el equipo</option>
                  {(equipo ?? []).map((m) => (
                    <option key={m.profile_id} value={m.profile_id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>
              {isLoading ? (
                <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>
              ) : filtradas.length === 0 ? (
                <p className="m-0 text-[15px] text-tinta-suave">{vista === "abiertas" ? "No hay tareas abiertas." : "Todavía no hay tareas resueltas."}</p>
              ) : (
                <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
                  {filtradas.map((t) => (
                    <li key={t.id}>
                      <TareaFila
                        t={t}
                        acciones={
                          <span className="flex items-center gap-2">
                            {t.patient_id && (
                              <Link to={`/app/profesional/paciente/${t.patient_id}`} className="text-[13px] font-semibold text-verde-profundo">
                                Ver paciente
                              </Link>
                            )}
                            {(t.estado === "pendiente" || t.estado === "en_curso") && (
                              <RowMenu
                                items={[
                                  {
                                    label: "Cancelar la tarea",
                                    danger: true,
                                    onClick: () =>
                                      window.confirm("¿Cancelar esta tarea?") &&
                                      responder.mutate({ id: t.id, estado: "cancelada" }, { onSuccess: () => setAviso({ text: "Tarea cancelada." }) }),
                                  },
                                ]}
                              />
                            )}
                          </span>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CajaCuerpo>
      </Caja>
      {nueva && (
        <NuevaTareaModal
          onClose={() => setNueva(false)}
          onCreada={(m) => {
            setNueva(false);
            setAviso({ text: m });
          }}
        />
      )}
    </Pagina>
  );
}
