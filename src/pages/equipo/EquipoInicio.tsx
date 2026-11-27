import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../../lib/useSession";
import { TIPO_TAREA, sobreQue, useTareasEquipo, type TareaEquipo } from "../../lib/tareasEquipo";
import { Pagina } from "../../components/profesional/Caja";
import { RevisionTarea } from "../../components/revision/RevisionTarea";

// Inicio del equipo clínico: una bandeja que trabaja en cola. A la izquierda,
// lo pendiente ordenado por fecha; a la derecha, la revisión abierta en el
// mismo calendario de la clínica. Al terminar una, se abre la siguiente
// (también con la tecla N).
type Vista = "abiertas" | "resueltas";

const hoy = () => new Date().toISOString().slice(0, 10);
function venceTexto(t: TareaEquipo) {
  if (!t.vence) return { texto: "Sin fecha", tarde: false };
  const v = t.vence;
  const h = hoy();
  if (v < h) return { texto: "Vencida", tarde: true };
  if (v === h) return { texto: "Para hoy", tarde: true };
  return { texto: `Para el ${new Date(`${v}T12:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "")}`, tarde: false };
}

export function EquipoInicio() {
  const session = useSession();
  const { data: tareas, isLoading } = useTareasEquipo();
  const [params, setParams] = useSearchParams();
  const [vista, setVista] = useState<Vista>("abiertas");
  const nombre = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const area = session.status === "authed" ? session.profile.especialidad : null;
  const abiertas = useMemo(() => (tareas ?? []).filter((t) => t.estado === "pendiente" || t.estado === "en_curso"), [tareas]);
  const resueltas = useMemo(() => (tareas ?? []).filter((t) => t.estado === "resuelta" || t.estado === "cancelada"), [tareas]);
  const lista = vista === "abiertas" ? abiertas : resueltas;
  const elegida = params.get("t");
  const actual = (tareas ?? []).find((t) => t.id === elegida) ?? null;

  const abrir = (id: string | null) => setParams(id ? { t: id } : {}, { replace: true });
  const siguiente = () => {
    const resto = abiertas.filter((t) => t.id !== actual?.id);
    abrir(resto[0]?.id ?? null);
  };

  // En pantallas grandes se abre sola la primera pendiente.
  useEffect(() => {
    if (!elegida && abiertas.length && window.matchMedia("(min-width: 1024px)").matches) abrir(abiertas[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abiertas.length, elegida]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && abiertas.length) {
        e.preventDefault();
        const i = abiertas.findIndex((x) => x.id === actual?.id);
        abrir(abiertas[(i + 1) % abiertas.length].id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Pagina ancho="max-w-[1400px]">
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* La cola */}
        <aside className={`grid gap-3 content-start ${actual ? "hidden lg:grid" : "grid"}`}>
          <div className="relative overflow-hidden rounded-[24px] bg-verde-profundo text-white px-5 py-5">
            <div aria-hidden="true" className="absolute -right-10 -top-14 w-36 h-36 rounded-full bg-verde-serenidad/45" />
            <p className="relative m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#cfe2e2]">Equipo clínico{area ? ` · ${area}` : ""}</p>
            <h1 className="relative m-0 mt-1 font-serif font-normal text-[28px] leading-tight">Hola{nombre ? `, ${nombre}` : ""}</h1>
            <p className="relative m-0 mt-1 text-[14px] text-[#e1ecec]">
              {abiertas.length ? `${abiertas.length} ${abiertas.length === 1 ? "revisión pendiente" : "revisiones pendientes"}` : "Nada pendiente por ahora"}
            </p>
          </div>
          <div role="tablist" className="inline-flex p-1 rounded-full bg-white border-[1.5px] border-borde-campo justify-self-start">
            {(["abiertas", "resueltas"] as Vista[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={`h-9 px-3.5 rounded-full border-0 font-sans text-[13.5px] cursor-pointer ${vista === v ? "bg-tinta text-white font-bold" : "bg-transparent text-tinta-suave font-semibold"}`}
              >
                {v === "abiertas" ? `Por revisar${abiertas.length ? ` · ${abiertas.length}` : ""}` : "Resueltas"}
              </button>
            ))}
          </div>
          {isLoading ? (
            <p className="m-0 text-[14px] text-tinta-tenue">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="m-0 text-[14.5px] text-tinta-suave">{vista === "abiertas" ? "Cuando la coordinación te pida una revisión, aparece acá y te llega un correo." : "Todavía no resolviste revisiones."}</p>
          ) : (
            <ul className="m-0 p-0 list-none grid gap-2">
              {lista.map((t) => {
                const v = venceTexto(t);
                const on = actual?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => abrir(t.id)}
                      className={`w-full text-left rounded-2xl bg-white px-3.5 py-3 grid gap-0.5 cursor-pointer font-sans ${on ? "border-2 border-verde-profundo" : "border border-borde hover:border-verde-serenidad"}`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-tinta-tenue">{TIPO_TAREA[t.tipo]}</span>
                      <span className="text-[14.5px] font-semibold text-tinta">{sobreQue(t) || t.titulo}</span>
                      <span className="flex justify-between gap-2 text-[12px]">
                        <span className={v.tarde && t.estado !== "resuelta" ? "font-bold text-alerta-texto" : "text-tinta-tenue"}>{t.estado === "resuelta" ? "Resuelta" : t.estado === "cancelada" ? "Cancelada" : v.texto}</span>
                        {t.aportes > 0 && <span className="text-verde-profundo font-semibold">{t.aportes} {t.aportes === 1 ? "aporte" : "aportes"}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {abiertas.length > 1 && (
            <p className="m-0 text-[12px] text-tinta-tenue">
              <kbd className="rounded-md border border-borde border-b-2 bg-white px-1 text-[10.5px] font-semibold">N</kbd> siguiente revisión
            </p>
          )}
        </aside>

        {/* La revisión abierta */}
        <section className={`min-w-0 ${actual ? "grid" : "hidden lg:grid"}`}>
          {actual ? (
            <div className="grid gap-3">
              <button type="button" onClick={() => abrir(null)} className="lg:hidden justify-self-start border-0 bg-transparent p-0 text-[14.5px] font-semibold text-verde-profundo cursor-pointer font-sans">
                ‹ Mis revisiones
              </button>
              <RevisionTarea key={actual.id} t={actual} onTerminada={() => window.setTimeout(siguiente, 900)} />
            </div>
          ) : (
            <div className="rounded-[24px] border-[1.5px] border-dashed border-borde-campo bg-campo/50 px-6 py-14 text-center">
              <p className="m-0 font-serif text-[22px] text-tinta">{abiertas.length ? "Elegí una revisión de la lista" : "Todo al día"}</p>
              <p className="m-0 mt-1 text-[14.5px] text-tinta-suave">Se abre en el mismo calendario que usa la clínica.</p>
            </div>
          )}
        </section>
      </div>
    </Pagina>
  );
}
