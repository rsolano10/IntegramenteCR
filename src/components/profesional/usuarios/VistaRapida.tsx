import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { relationLabel, type ManagedAccount } from "../../../lib/adminAccounts";
import { detalleCuenta, validacionesCuenta, type FilaCuenta } from "../../../lib/cuentas";
import { patientPath, type PatientRow } from "../../../lib/patients";
import { planTiers } from "../../../lib/mockData";
import { siguientePaso, type Paso } from "../../../lib/siguientePaso";
import { useBodyScrollLock } from "../../../lib/useBodyScrollLock";
import { waLink } from "../../../lib/whatsapp";
import type { Answers } from "../../../lib/onboardingSchema";
import type { EstadoCuenta } from "../../../lib/useMyPatient";
import { RowMenu, type RowMenuItem } from "../../ui/RowMenu";
import { AlDia, Avatar, BotonPaso, EjesDetalle, Seccion } from "./piezas";
import { estadoFamiliar, textoEstadoFamiliar } from "../../../lib/usuariosVista";

// Vista rápida de una familia, en un panel lateral sobre la lista: el
// siguiente paso (con lo que hay que revisar antes de aprobar), el recorrido
// de la cuenta, cómo va la semana, la evaluación y la familia vinculada.
// Desde acá se abre la ficha completa.

const modalidad = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));
const RECORRIDO: { estados: EstadoCuenta[]; nombre: string }[] = [
  { estados: ["registrado"], nombre: "Registro" },
  { estados: ["cuestionario_pendiente"], nombre: "Cuestionario" },
  { estados: ["pendiente_aprobacion", "rechazada"], nombre: "Aprobación" },
  { estados: ["en_demo", "demo_finalizada"], nombre: "Semana gratis" },
  { estados: ["activa", "inactiva"], nombre: "Activa" },
];

export function VistaRapida({
  p,
  f,
  cuentas,
  menu,
  ocupado,
  onAccion,
  onAbrirCuenta,
  onClose,
}: {
  p: PatientRow;
  f: FilaCuenta | undefined;
  cuentas: Map<string, ManagedAccount>;
  menu: RowMenuItem[];
  ocupado: boolean;
  onAccion: (paso: Paso) => void;
  onAbrirCuenta: (a: ManagedAccount) => void;
  onClose: () => void;
}) {
  useBodyScrollLock();
  const navigate = useNavigate();
  const cerrar = useRef<HTMLButtonElement>(null);
  const paso = siguientePaso(p, f);

  useEffect(() => {
    cerrar.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onClose]);

  // Antes de aprobar: las respuestas del cuestionario para las validaciones.
  const { data: answers } = useQuery({
    queryKey: ["onboarding-answers", p.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", p.id).maybeSingle();
      if (error) throw error;
      return (data?.answers ?? null) as Answers | null;
    },
    enabled: paso?.tipo === "aprobar",
  });
  const validaciones = paso?.tipo === "aprobar" && f ? validacionesCuenta(f, answers ?? null) : [];

  // La semana en curso: actividades registradas.
  const { data: semana } = useQuery({
    queryKey: ["vista-rapida-semana", p.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, created_at, plan_tasks(estado)").eq("patient_id", p.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const tareas = ((data.plan_tasks ?? []) as { estado: string }[]).map((t) => t.estado);
      return { tareas, registradas: tareas.filter((e) => e === "realizado" || e === "parcial" || e === "no").length };
    },
  });

  const familia = p.links.filter((l) => l.relation !== "profesional_asignado");
  const pasoActual = f?.estado ? RECORRIDO.findIndex((r) => r.estados.includes(f.estado!)) : -1;
  const detalle = f ? detalleCuenta(f) : null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="vista-rapida-titulo">
      <div className="absolute inset-0 bg-tinta/35 motion-safe:animate-[modal-backdrop-in_160ms_ease-out]" onClick={onClose} aria-hidden="true" />
      <aside className="absolute inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-[-18px_0_40px_rgba(31,51,56,0.18)] flex flex-col motion-safe:animate-[vista-entra_220ms_ease-out]">
        {/* Encabezado */}
        <header className="px-6 pt-6 pb-5 border-b border-borde-suave flex items-start gap-3.5">
          <Avatar id={p.id} nombre={p.nombre} size={52} />
          <div className="flex-1 min-w-0">
            <h2 id="vista-rapida-titulo" className="m-0 font-serif font-normal text-[27px] leading-tight text-tinta break-words">
              {p.nombre}
            </h2>
            <p className="m-0 mt-1 text-[14px] text-tinta-suave">
              {p.edad ? `${p.edad} años` : "Edad sin registrar"} · {modalidad[p.modalidad] ?? p.modalidad} · desde el{" "}
              {new Date(p.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
            </p>
          </div>
          <button
            ref={cerrar}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 shrink-0 rounded-xl border-0 bg-campo text-tinta cursor-pointer inline-flex items-center justify-center hover:bg-borde-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 grid gap-6 content-start">
          {/* Siguiente paso */}
          {paso ? (
            <section className={`rounded-2xl px-4.5 py-4 grid gap-3 ${paso.tono === "principal" ? "bg-verde-tenue border-[1.5px] border-verde-serenidad/40" : "bg-aviso border-[1.5px] border-riesgo-borde"}`}>
              <div>
                <p className="m-0 text-[12.5px] font-bold text-tinta-suave">Siguiente paso</p>
                <p className="m-0 mt-0.5 text-[16px] font-bold text-tinta">{paso.porque}</p>
              </div>
              {validaciones.length > 0 && (
                <ul className="m-0 pl-5 grid gap-1 text-[13.5px] leading-snug text-aviso-texto">
                  {validaciones.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              )}
              {paso.tipo === "aprobar" && validaciones.length === 0 && answers !== undefined && (
                <p className="m-0 text-[13.5px] text-semaforo-verde-texto">El cuestionario está completo: no hay nada para revisar.</p>
              )}
              {paso.tipo === "aprobar" && f?.requiere_contacto_nota && <p className="m-0 text-[13.5px] text-aviso-texto">Nota: {f.requiere_contacto_nota}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <BotonPaso paso={paso} onClick={() => onAccion(paso)} ocupado={ocupado} grande />
                {paso.tipo === "aprobar" && (
                  <button type="button" onClick={() => navigate(patientPath(p.id, "evaluacion"))} className="text-[13.5px] font-bold text-verde-profundo underline decoration-dotted underline-offset-4 bg-transparent border-0 cursor-pointer p-0">
                    Ver el cuestionario completo
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl px-4.5 py-3.5 bg-[#eef4ef]">
              <AlDia />
            </section>
          )}

          {/* Cuenta */}
          {f?.estado && (
            <Seccion titulo="Cuenta de la familia">
              <ol className="list-none m-0 p-0 grid grid-cols-5 gap-1.5" aria-label="Recorrido de la cuenta">
                {RECORRIDO.map((r, i) => {
                  const hecho = i < pasoActual;
                  const ahora = i === pasoActual;
                  return (
                    <li key={r.nombre} className="grid gap-1.5" aria-current={ahora ? "step" : undefined}>
                      <span className={`h-1.5 rounded-full ${hecho ? "bg-verde-profundo" : ahora ? (f.estado === "rechazada" || f.estado === "inactiva" ? "bg-tinta-tenue" : "bg-semaforo-amarillo") : "bg-beige-serenidad"}`} />
                      <span className={`hidden sm:block text-[12px] leading-tight ${ahora ? "font-extrabold text-tinta" : hecho ? "font-semibold text-tinta" : "font-semibold text-tinta-suave"}`}>{r.nombre}</span>
                    </li>
                  );
                })}
              </ol>
              {pasoActual >= 0 && (
                <p className="sm:hidden m-0 mt-2 text-[12.5px] text-tinta-suave">
                  <strong className="text-tinta">{RECORRIDO[pasoActual].nombre}</strong> · paso {pasoActual + 1} de {RECORRIDO.length}
                </p>
              )}
              <p className="m-0 mt-2.5 text-[13px] text-tinta-suave">
                {f.estado === "rechazada" ? "Rechazada" : f.estado === "inactiva" ? "Inactiva" : f.estado === "demo_finalizada" ? "Semana gratis terminada" : ""}
                {detalle ? `${f.estado === "rechazada" || f.estado === "inactiva" || f.estado === "demo_finalizada" ? " · " : ""}${detalle}` : ""}
                {f.pagada_desde ? ` · Pagada desde el ${new Date(f.pagada_desde).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}` : ""}
              </p>
            </Seccion>
          )}

          {/* La semana */}
          <section className="rounded-2xl border border-borde px-4.5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-[14px] font-extrabold text-tinta">Esta semana</h3>
              <button type="button" onClick={() => navigate(patientPath(p.id, "planificar"))} className="text-[13.5px] font-bold text-verde-profundo bg-transparent border-0 cursor-pointer p-0 hover:underline">
                Abrir planificador
              </button>
            </div>
            {semana && semana.tareas.length > 0 ? (
              <>
                <div className="mt-3 flex gap-1" role="img" aria-label={`${semana.registradas} de ${semana.tareas.length} actividades registradas`}>
                  {semana.tareas.map((e, i) => (
                    <span key={i} className={`flex-1 h-3 rounded-full ${e === "realizado" ? "bg-semaforo-verde" : e === "parcial" || e === "no" ? "bg-mostaza-vital" : "bg-beige-serenidad"}`} />
                  ))}
                </div>
                <p className="m-0 mt-2 text-[13.5px] text-tinta-suave">
                  <strong className="text-tinta">
                    {semana.registradas} de {semana.tareas.length}
                  </strong>{" "}
                  actividades registradas
                </p>
              </>
            ) : (
              <p className="m-0 mt-2 text-[13.5px] text-tinta-suave">Todavía no tiene una semana asignada.</p>
            )}
          </section>

          {/* Evaluación */}
          <Seccion
            titulo="Evaluación"
            accion={
              <button type="button" onClick={() => navigate(patientPath(p.id, "evaluacion"))} className="text-[13.5px] font-bold text-verde-profundo bg-transparent border-0 cursor-pointer p-0 hover:underline">
                Ver evaluación
              </button>
            }
          >
            <EjesDetalle p={p} />
          </Seccion>

          {/* Familia */}
          <Seccion titulo="Familia vinculada">
            <div className="grid gap-2">
              {familia.length === 0 && <p className="m-0 text-[13.5px] text-tinta-suave">Todavía no hay familiares vinculados.</p>}
              {familia.map((l) => {
                const acc = cuentas.get(l.profile_id);
                const estado = estadoFamiliar(acc);
                const tel = f?.profile_id === l.profile_id ? f.telefono : null;
                return (
                  <div key={l.profile_id} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-borde">
                    <span
                      aria-hidden="true"
                      className="w-[38px] h-[38px] shrink-0 rounded-full bg-beige-serenidad text-tinta text-[13px] font-extrabold inline-flex items-center justify-center"
                      style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 3.5px ${estado === "confirmada" ? "#4c7a4c" : estado === "pendiente" ? "#e8b857" : "#b9c1c2"}` }}
                    >
                      {l.nombre
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <button type="button" onClick={() => acc && onAbrirCuenta(acc)} disabled={!acc} className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default font-sans">
                      <span className="block text-[15px] font-bold text-tinta truncate">
                        {l.nombre} <span className="font-medium text-tinta-suave">· {relationLabel[l.relation]}</span>
                      </span>
                      <span className="block text-[13px] text-tinta-suave">
                        {textoEstadoFamiliar[estado]}
                        {tel ? ` · ${tel}` : ""}
                      </span>
                    </button>
                    {tel && (
                      <a
                        href={waLink(tel, `Hola ${l.nombre.split(" ")[0]}, te escribimos de IntegraMente en Casa.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 h-10 px-3 rounded-[10px] border-[1.5px] border-[#c9d8d9] bg-white text-verde-profundo text-[13.5px] font-bold no-underline inline-flex items-center hover:border-verde-profundo"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={() => navigate(patientPath(p.id, "cuentas"))} className="justify-self-start mt-0.5 min-h-10 text-[13.5px] font-bold text-verde-profundo bg-transparent border-0 cursor-pointer p-0 hover:underline">
                + Vincular un familiar
              </button>
            </div>
          </Seccion>
        </div>

        {/* Pie */}
        <footer className="px-6 py-4 border-t border-borde-suave flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(patientPath(p.id))}
            className="flex-1 min-h-12 rounded-xl border-0 bg-tinta text-white font-sans text-[15px] font-bold cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-verde-profundo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
          >
            Abrir la ficha completa
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <div className="w-12 h-12 rounded-xl border-[1.5px] border-borde-campo inline-flex items-center justify-center">
            <RowMenu items={menu} />
          </div>
        </footer>
      </aside>
    </div>
  );
}
