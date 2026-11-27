import type { ReactNode } from "react";
import { BotonVolver } from "../components/ui/BotonVolver";
import { Logo } from "../components/ui/Logo";
import { CONSENTIMIENTOS } from "../lib/consentimientos";
import { describeAnswer, groupAnswerableByModule, resolveText } from "../lib/onboardingSchema";
import { moodMeta } from "../lib/seguimiento";
import { planTiers } from "../lib/mockData";
import { descargarJson, useInformeDatos, type InformeDatos } from "../lib/misDatos";

// «Todo lo que tenemos sobre vos», legible: lo mismo que la copia técnica
// (exportar_mis_datos) pero en un documento con la línea de la marca, para
// leer, imprimir o guardar como PDF. Incluye las notas del equipo; nunca
// semáforos ni puntajes. Al abrirlo queda constancia del acceso.

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-CR", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const ROL: Record<string, string> = { familiar: "Familiar", paciente: "Participante del programa" };
const TAREA: Record<string, string> = { realizado: "Hecha", parcial: "En parte", no: "No se pudo", pendiente: "Sin registrar", futuro: "Por hacer" };
const ALERTA: Record<string, string> = { ideacion: "Pensamientos de hacerse daño", maltrato: "Posible maltrato", caida: "Caída", cambio: "Cambio repentino", extravio: "Extravío" };
const AVISO: Record<string, string> = { prep: "Qué preparar para mañana", start: "Recordatorio de una actividad", close: "Cierre de la semana" };
const SOLICITUD: Record<string, string> = { acceso: "Ver mis datos", rectificacion: "Corregir un dato", eliminacion: "Eliminar mis datos", oposicion: "Oponerme a un uso" };
const ESTADO_SOL: Record<string, string> = { pendiente: "Programada o en trámite", resuelta: "Hecha", rechazada: "No procede", cancelada: "Cancelada" };
const telefono = (t: string) => {
  const d = t.replace(/\D/g, "").replace(/^506/, "");
  return d.length === 8 ? `+506 ${d.slice(0, 4)} ${d.slice(4)}` : t;
};
const tituloPermiso = (t: string) => CONSENTIMIENTOS.find((c) => c.tipo === t)?.titulo ?? t;

export function InformeDatosPage() {
  const { data, isLoading, error } = useInformeDatos();
  return (
    <div className="im-in max-w-[860px] mx-auto px-4 py-8 pb-20 sm:px-8 grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="print:hidden grid gap-4">
        <BotonVolver respaldo="/app/mis-datos" />
        {data && (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full border-0 bg-verde-profundo text-white text-[15px] font-semibold cursor-pointer hover:bg-tinta font-sans"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
              </svg>
              Imprimir o guardar como PDF
            </button>
            <button
              type="button"
              onClick={() => descargarJson(data)}
              className="inline-flex items-center min-h-11 px-5 rounded-full border-[1.5px] border-borde bg-white text-tinta text-[15px] font-semibold cursor-pointer hover:border-verde-serenidad font-sans"
            >
              Copia técnica (para otro servicio)
            </button>
          </div>
        )}
      </div>
      {isLoading ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Preparando tu informe…</p>
      ) : error || !data ? (
        <p className="m-0 text-[15px] text-tinta-suave">No pudimos preparar el informe. Probá de nuevo en un momento.</p>
      ) : (
        <Informe d={data} />
      )}
    </div>
  );
}

function Seccion({ ceja, titulo, children }: { ceja: string; titulo: ReactNode; children: ReactNode }) {
  return (
    <section className="break-inside-avoid-page">
      <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">{ceja}</p>
      <h2 className="m-0 mt-0.5 mb-4 font-serif font-normal text-[23px] leading-tight text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function Filas({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <dl className="m-0 rounded-[20px] border border-borde divide-y divide-borde-suave overflow-hidden">
      {filas.map(([k, v]) => (
        <div key={k} className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-x-4 gap-y-0.5 px-4 py-3">
          <dt className="text-[13.5px] text-tinta-tenue">{k}</dt>
          <dd className="m-0 text-[15px] text-tinta break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Vacio = ({ children }: { children: ReactNode }) => <p className="m-0 text-[15px] text-tinta-tenue">{children}</p>;

function Informe({ d }: { d: InformeDatos }) {
  // Estado actual de cada permiso: el último registro de cada tipo.
  const permisos = new Map<string, { otorgado: boolean; created_at: string }>();
  for (const c of d.consentimientos) permisos.set(c.tipo, c);
  const avisosPorTipo = d.avisos_whatsapp.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.tipo]: (acc[a.tipo] ?? 0) + 1 }), {});

  return (
    <article className="resumen-doc min-w-0 overflow-hidden bg-white text-tinta rounded-[28px] border border-borde print:border-0 print:rounded-none">
      <header className="relative overflow-hidden bg-verde-profundo text-white px-5 sm:px-9 pt-7 pb-7">
        <div aria-hidden="true" className="absolute -right-16 -top-24 w-60 h-60 rounded-full bg-verde-serenidad/45" />
        <div aria-hidden="true" className="absolute right-24 -bottom-36 w-52 h-52 rounded-full bg-mostaza-vital/20" />
        <div className="relative">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#cfe2e2]">Tus datos en IntegraMente</p>
          <h1 className="m-0 mt-1.5 font-serif font-normal text-[30px] sm:text-[36px] leading-tight">{d.cuenta?.nombre ?? "Tu cuenta"}</h1>
          <p className="m-0 mt-2 max-w-[560px] text-[14.5px] leading-relaxed text-[#e1ecec]">
            Todo lo que guardamos sobre vos y {d.personas_participantes.length === 1 ? "la persona que acompañás" : "las personas que acompañás"}, al {fecha(d.generado_el)}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-semibold">
            {d.personas_participantes.map((p) => (
              <span key={p.nombre} className="rounded-full bg-white/15 px-3 py-1.5">
                {p.nombre}
              </span>
            ))}
            <span className="rounded-full bg-mostaza-vital text-tinta px-3 py-1.5">Generado el {fecha(d.generado_el)}</span>
          </div>
        </div>
      </header>

      <div className="px-5 sm:px-9 py-8 grid grid-cols-[minmax(0,1fr)] gap-10">
        <Seccion ceja="Tu cuenta" titulo="Tus datos">
          {d.cuenta ? (
            <Filas
              filas={[
                ["Nombre", d.cuenta.nombre],
                ["Tipo de cuenta", ROL[d.cuenta.rol] ?? d.cuenta.rol],
                ["Correo", d.cuenta.correo ?? "Sin correo"],
                ["WhatsApp", d.cuenta.telefono_whatsapp ? telefono(d.cuenta.telefono_whatsapp) : "Sin número"],
                ["Recordatorios por WhatsApp", d.cuenta.avisos_whatsapp ? "Activados" : "Desactivados"],
                ["Cuenta creada", fecha(d.cuenta.creada)],
              ]}
            />
          ) : (
            <Vacio>Sin datos de la cuenta.</Vacio>
          )}
        </Seccion>

        <Seccion ceja="Permisos" titulo="Qué usos autorizaste">
          {permisos.size === 0 ? (
            <Vacio>Sin registros.</Vacio>
          ) : (
            <Filas filas={[...permisos.entries()].map(([t, c]) => [tituloPermiso(t), `${c.otorgado ? "Autorizado" : "No autorizado"} desde el ${fecha(c.created_at)}`])} />
          )}
        </Seccion>

        {d.personas_participantes.map((p) => (
          <Persona key={p.nombre} p={p} />
        ))}

        <Seccion ceja="Inteligencia artificial" titulo="Conversaciones con Clara y el asistente">
          <div className="grid gap-4">
            <Filas
              filas={[
                ["Conversaciones con Clara", d.clara.conversaciones.length ? `${d.clara.conversaciones.length}, la última el ${fecha(d.clara.conversaciones[d.clara.conversaciones.length - 1].fecha)}` : "Ninguna"],
                ["Lo que Clara recuerda", d.clara.memoria || "Nada guardado"],
                ["Lo que el asistente recuerda", d.asistente.memoria || "Nada guardado"],
              ]}
            />
            {d.asistente.mensajes.length > 0 && (
              <ul className="m-0 p-0 list-none grid gap-2">
                {d.asistente.mensajes.map((m, i) => (
                  <li key={i} className={`rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed ${m.rol === "usuario" ? "bg-fondo-papel" : "bg-verde-tenue"}`}>
                    <span className="block text-[12.5px] font-semibold text-tinta-tenue">
                      {m.rol === "usuario" ? "Vos" : "Asistente"} · {fechaHora(m.fecha)}
                    </span>
                    <span className="whitespace-pre-wrap">{m.texto}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Seccion>

        <Seccion ceja="Avisos" titulo="Mensajes que te enviamos por WhatsApp">
          {d.avisos_whatsapp.length === 0 ? (
            <Vacio>Ninguno.</Vacio>
          ) : (
            <Filas filas={Object.entries(avisosPorTipo).map(([t, n]) => [AVISO[t] ?? t, `${n} ${n === 1 ? "mensaje" : "mensajes"}`])} />
          )}
        </Seccion>

        <Seccion ceja="Tus derechos" titulo="Lo que pediste sobre tus datos">
          {d.solicitudes.length === 0 ? (
            <Vacio>Ninguna solicitud.</Vacio>
          ) : (
            <Filas filas={d.solicitudes.map((s) => [`${SOLICITUD[s.tipo] ?? s.tipo}, ${fecha(s.created_at)}`, `${ESTADO_SOL[s.estado] ?? s.estado}${s.respuesta ? `. ${s.respuesta}` : ""}`])} />
          )}
        </Seccion>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-borde-suave bg-fondo-papel px-5 sm:px-9 py-5">
        <Logo />
        <p className="m-0 max-w-[470px] text-[12.5px] leading-relaxed text-tinta-tenue">
          Responsable: IntegraMente en Casa, Costa Rica. Informe generado el {fecha(d.generado_el)} a pedido de la persona titular de la cuenta (Ley 8968).
        </p>
      </footer>
    </article>
  );
}

function Persona({ p }: { p: InformeDatos["personas_participantes"][number] }) {
  const primer = p.nombre.split(" ")[0];
  const grupos = p.cuestionario ? groupAnswerableByModule(p.cuestionario) : [];
  const programa = planTiers.find((t) => t.id === p.modalidad)?.nombre ?? p.modalidad;
  return (
    <>
      <Seccion ceja={`El programa de ${primer}`} titulo={p.nombre}>
        <Filas
          filas={[
            ["Edad", p.edad ? `${p.edad} años` : "Sin dato"],
            ["Programa", programa ?? "Sin elegir"],
            ["En el programa desde", fecha(p.alta)],
          ]}
        />
      </Seccion>

      <Seccion ceja="Al inscribirse" titulo={`Lo que nos contaron de ${primer}`}>
        {grupos.length === 0 || !p.cuestionario ? (
          <Vacio>Sin respuestas guardadas.</Vacio>
        ) : (
          <div className="grid gap-3">
            {grupos.map((g) => (
              <div key={g.module} className="rounded-[20px] border border-borde px-4 py-3 break-inside-avoid">
                <p className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-verde-profundo">{g.module}</p>
                <dl className="m-0 grid">
                  {g.questions.map((q) => (
                    <div key={q.id} className="grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-x-4 gap-y-0.5 py-2 border-t border-borde-suave first:border-t-0">
                      <dt className="text-[13.5px] leading-snug text-tinta-tenue">{resolveText(q.title, p.cuestionario!)}</dt>
                      <dd className="m-0 text-[14.5px] leading-snug text-tinta">{describeAnswer(q, p.cuestionario!)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion ceja="Semana a semana" titulo="Actividades y registros">
        {p.planes.length === 0 ? (
          <Vacio>Todavía no hay semanas publicadas.</Vacio>
        ) : (
          <div className="grid gap-3">
            {[...p.planes].reverse().map((pl) => (
              <div key={pl.publicado} className="rounded-[20px] border border-borde px-4 py-3.5 break-inside-avoid">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 text-[15px] font-semibold">Semana del {fecha(pl.publicado)}</p>
                  {pl.animo_semana && moodMeta[pl.animo_semana] && (
                    <span className="rounded-full bg-fondo-papel border border-borde-suave px-2.5 py-0.5 text-[12.5px] text-tinta-suave">{moodMeta[pl.animo_semana].label}</span>
                  )}
                </div>
                <ul className="m-0 mt-2 p-0 list-none grid gap-1">
                  {pl.actividades.map((a, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-x-3 text-[14px]">
                      <span className="min-w-0">
                        <span className="text-tinta-tenue capitalize">{a.dia}</span> · {a.titulo}
                        {a.comentario && <span className="text-tinta-suave"> · «{a.comentario}»</span>}
                      </span>
                      <span className="text-tinta-suave">{TAREA[a.estado] ?? a.estado}</span>
                    </li>
                  ))}
                </ul>
                {(pl.favorita || pl.preocupacion || pl.comentario) && (
                  <div className="mt-2.5 pt-2.5 border-t border-borde-suave grid gap-0.5 text-[14px] text-tinta-suave">
                    {pl.favorita && <p className="m-0">Lo que más le gustó: «{pl.favorita}»</p>}
                    {pl.preocupacion && <p className="m-0">Les preocupó: «{pl.preocupacion}»</p>}
                    {pl.comentario && <p className="m-0">Comentario: «{pl.comentario}»</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion ceja="El equipo" titulo={`Notas del equipo sobre ${primer}`}>
        {p.notas_del_equipo.length === 0 ? (
          <Vacio>El equipo no tiene notas guardadas.</Vacio>
        ) : (
          <ul className="m-0 p-0 list-none grid gap-2.5">
            {p.notas_del_equipo.map((n, i) => (
              <li key={i} className="rounded-2xl bg-fondo-papel border border-borde-suave px-4 py-3 text-[14.5px] leading-relaxed break-inside-avoid">
                <span className="block text-[12.5px] font-semibold text-tinta-tenue">
                  {fecha(n.fecha)}
                  {n.autor ? ` · ${n.autor}` : ""}
                </span>
                <span className="whitespace-pre-wrap">{n.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {(p.mensajes.length > 0 || p.pedidos_de_ayuda.length > 0 || p.alertas.length > 0) && (
        <Seccion ceja="Contacto con el equipo" titulo="Mensajes, pedidos de ayuda y avisos">
          <div className="grid gap-2">
            {p.alertas.map((a, i) => (
              <p key={`a${i}`} className="m-0 rounded-2xl border border-borde px-4 py-2.5 text-[14.5px]">
                <span className="text-tinta-tenue">{fechaHora(a.fecha)} · </span>Aviso de {(ALERTA[a.tipo] ?? a.tipo).toLowerCase()}
              </p>
            ))}
            {p.pedidos_de_ayuda.map((h, i) => (
              <p key={`h${i}`} className="m-0 rounded-2xl border border-borde px-4 py-2.5 text-[14.5px]">
                <span className="text-tinta-tenue">{fechaHora(h.fecha)} · </span>Pedido de ayuda{h.nota ? `: «${h.nota}»` : ""}
              </p>
            ))}
            {p.mensajes.map((m, i) => (
              <p key={`m${i}`} className="m-0 rounded-2xl border border-borde px-4 py-2.5 text-[14.5px] whitespace-pre-wrap">
                <span className="text-tinta-tenue">
                  {fechaHora(m.fecha)} · {m.propio ? "Vos" : "Equipo"}:{" "}
                </span>
                {m.texto}
              </p>
            ))}
          </div>
        </Seccion>
      )}
    </>
  );
}
