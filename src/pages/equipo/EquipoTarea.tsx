import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { moduloLabel } from "../../lib/modulos";
import { rangoSemana } from "../../lib/planWeek";
import { RESULTADO_TAREA, TIPO_TAREA, sobreQue, useResponderTarea, useTareasEquipo, type ResultadoTarea } from "../../lib/tareasEquipo";
import { Caja, CajaAviso, CajaCuerpo, Pagina } from "../../components/profesional/Caja";
import { ResumenSeguimiento, type ResumenDatos } from "../../components/resumen/ResumenSeguimiento";
import { Button } from "../../components/ui/Button";
import { PillToggle } from "../../components/ui/PillToggle";

// Una tarea del equipo clínico: el contexto (caso, semana o plantilla) y la
// respuesta. «Aprobado» en una plantilla la deja marcada como revisada.
interface Contexto {
  resumen: ResumenDatos | null;
  semana: { inicio: string; mensaje: string | null; tareas: { dia: string; hora: string | null; titulo: string; estado: string; modulo: string | null; codigo: string | null; indicacion: string | null; nota_clinica: string | null; comentario: string | null }[] } | null;
  plantilla: { nombre: string; descripcion: string | null; perfil_objetivo: string | null; tareas: { dia_idx: number; hora: string | null; titulo: string; modulo: string; codigo: string | null; duracion: string | null }[] } | null;
}

const DIAS = ["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "Día 7"];
const area = (m: string | null) => (m && m in moduloLabel ? moduloLabel[m as keyof typeof moduloLabel] : "Otra");
const ESTADO: Record<string, string> = { realizado: "Hecha", parcial: "En parte", no: "No se pudo", pendiente: "Pendiente", futuro: "Pendiente" };

export function EquipoTarea() {
  const { id = "" } = useParams();
  const { data: tareas } = useTareasEquipo();
  const t = (tareas ?? []).find((x) => x.id === id);
  const responder = useResponderTarea();
  const [resultado, setResultado] = useState<ResultadoTarea>("aprobado");
  const [respuesta, setRespuesta] = useState("");
  const [aviso, setAviso] = useState<{ text: string; error?: boolean } | null>(null);
  const { data: ctx, isLoading } = useQuery({
    queryKey: ["tarea-contexto", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tarea_contexto", { p_id: id });
      if (error) throw error;
      return data as Contexto;
    },
  });

  if (!t) return <Pagina ancho="max-w-[960px]"><p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p></Pagina>;
  const abierta = t.estado === "pendiente" || t.estado === "en_curso";

  const enviar = () =>
    responder.mutate(
      { id: t.id, estado: "resuelta", resultado, respuesta },
      {
        onSuccess: () => setAviso({ text: "Respuesta enviada a la coordinación." }),
        onError: (e) => setAviso({ text: (e as Error).message, error: true }),
      },
    );

  return (
    <Pagina ancho="max-w-[960px]">
      <Link to="/app/equipo" className="justify-self-start text-[14.5px] font-semibold text-verde-profundo no-underline">‹ Mis tareas</Link>
      <Caja eyebrow={TIPO_TAREA[t.tipo]} titulo={t.titulo} descripcion={[sobreQue(t), t.creada_por_nombre ? `Pedida por ${t.creada_por_nombre}` : null].filter(Boolean).join(" · ")}>
        {aviso && <CajaAviso texto={aviso.text} error={aviso.error} onCerrar={() => setAviso(null)} />}
        <CajaCuerpo>
          <div className="grid gap-6">
            {t.detalle && (
              <p className="m-0 rounded-2xl bg-verde-tenue border border-verde-serenidad/40 px-4 py-3 text-[15px] leading-relaxed text-tinta">
                <strong className="font-semibold">Lo que te piden:</strong> {t.detalle}
              </p>
            )}

            {/* Responder */}
            {abierta ? (
              <section className="rounded-[22px] border border-borde bg-white px-4 py-4 grid gap-3">
                <p className="m-0 font-serif text-[21px] text-tinta">Tu respuesta</p>
                <PillToggle
                  value={resultado}
                  onChange={setResultado}
                  options={(Object.keys(RESULTADO_TAREA) as ResultadoTarea[]).map((r) => ({ value: r, label: RESULTADO_TAREA[r] }))}
                />
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  rows={4}
                  placeholder={resultado === "aprobado" ? "Opcional: algo que quieras dejar anotado." : "Qué cambiarías y por qué."}
                  className="w-full rounded-xl border-[1.5px] border-borde-campo bg-campo px-3.5 py-2.5 font-sans text-[15px] leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={enviar} disabled={responder.isPending || (resultado !== "aprobado" && !respuesta.trim())}>
                    {responder.isPending ? "Enviando…" : "Enviar respuesta"}
                  </Button>
                  {t.estado === "pendiente" && (
                    <Button variant="secondary" onClick={() => responder.mutate({ id: t.id, estado: "en_curso" })}>
                      La estoy revisando
                    </Button>
                  )}
                </div>
                {resultado !== "aprobado" && !respuesta.trim() && <p className="m-0 text-[13px] text-tinta-tenue">Contá qué cambiarías para poder enviarla.</p>}
              </section>
            ) : (
              <section className="rounded-[22px] bg-campo px-4 py-4">
                <p className="m-0 text-[14.5px] text-tinta">
                  <strong className="font-semibold">{t.estado === "cancelada" ? "Cancelada por la coordinación." : t.resultado ? RESULTADO_TAREA[t.resultado] : "Resuelta"}</strong>
                  {t.respuesta ? ` ${t.respuesta}` : ""}
                </p>
              </section>
            )}

            {isLoading && <p className="m-0 text-[15px] text-tinta-tenue">Cargando el contexto…</p>}

            {/* La plantilla */}
            {ctx?.plantilla && (
              <section className="grid gap-3">
                <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Plantilla «{ctx.plantilla.nombre}»</h2>
                {(ctx.plantilla.perfil_objetivo || ctx.plantilla.descripcion) && (
                  <p className="m-0 text-[14.5px] text-tinta-suave">{[ctx.plantilla.perfil_objetivo, ctx.plantilla.descripcion].filter(Boolean).join(" · ")}</p>
                )}
                <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
                  {ctx.plantilla.tareas.map((x, i) => (
                    <li key={i} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 px-4 py-2.5 text-[14.5px]">
                      <span className="text-tinta-tenue">{DIAS[x.dia_idx] ?? `Día ${x.dia_idx + 1}`}</span>
                      <span>
                        <span className="font-semibold text-tinta">{x.titulo}</span>
                        <span className="text-tinta-suave"> · {area(x.modulo)}{x.codigo ? ` · ${x.codigo}` : ""}{x.duracion ? ` · ${x.duracion}` : ""}{x.hora ? ` · ${x.hora}` : ""}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* La semana */}
            {ctx?.semana && (
              <section className="grid gap-3">
                <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Semana del {rangoSemana(ctx.semana.inicio)}</h2>
                <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
                  {ctx.semana.tareas.map((x, i) => (
                    <li key={i} className="grid gap-0.5 sm:grid-cols-[110px_minmax(0,1fr)_100px] sm:gap-3 px-4 py-2.5 text-[14.5px]">
                      <span className="text-tinta-tenue">{x.dia}{x.hora ? ` ${x.hora}` : ""}</span>
                      <span>
                        <span className="font-semibold text-tinta">{x.titulo}</span>
                        <span className="text-tinta-suave"> · {area(x.modulo)}</span>
                        {x.indicacion && <span className="block text-[13px] text-tinta-suave">Indicación: {x.indicacion}</span>}
                        {x.comentario && <span className="block text-[13px] text-tinta-suave">La familia: «{x.comentario}»</span>}
                      </span>
                      <span className="sm:text-right font-semibold text-tinta">{ESTADO[x.estado] ?? x.estado}</span>
                    </li>
                  ))}
                </ul>
                {ctx.semana.mensaje && <p className="m-0 text-[14px] text-tinta-suave">Mensaje del equipo a la familia: «{ctx.semana.mensaje}»</p>}
              </section>
            )}

            {/* El caso */}
            {ctx?.resumen && (
              <section className="grid gap-3">
                <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Seguimiento en casa</h2>
                <ResumenSeguimiento datos={ctx.resumen} />
              </section>
            )}
          </div>
        </CajaCuerpo>
      </Caja>
    </Pagina>
  );
}
