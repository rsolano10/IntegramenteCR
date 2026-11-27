import { useState } from "react";
import {
  EJES,
  textoValor,
  useAgregarItem,
  useAjustarValoracion,
  useDecidirItem,
  useItemsRevision,
  useValoracion,
  type Eje,
  type ItemRevision,
} from "../../lib/revisiones";
import { EstadoRevisionChip } from "./EstadoRevision";
import { Tarjeta } from "./PanelRevision";
import { NuevaTareaModal } from "../profesional/tareas/NuevaTareaModal";

// Valoración del paciente: la etapa y los cuatro ejes, cada uno con de
// dónde sale (cuestionario, motor o ajuste de la clínica), su estado de
// revisión y las propuestas del equipo. Cada área es dueña de su eje: lo
// confirma o propone un cambio con motivo, y la coordinación lo acepta.
// Visible solo para el equipo, nunca para la familia.
const ETAPAS = ["preventivo", "dcl", "leve", "moderada", "avanzada"] as const;
const COLORES = ["verde", "amarillo", "rojo"] as const;
const PUNTO: Record<string, string> = { verde: "bg-semaforo-verde", amarillo: "bg-semaforo-amarillo", rojo: "bg-semaforo-rojo" };
const btn = "inline-flex items-center min-h-8 px-3 rounded-full text-[12.5px] font-semibold cursor-pointer font-sans disabled:opacity-50";
const selectCls = "min-h-9 px-2.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[13.5px] text-tinta";

export function ValoracionCard({
  patientId,
  patientNombre,
  modo,
  tareaId = null,
  ejeTarea = null,
  onAviso,
}: {
  patientId: string;
  patientNombre: string;
  modo: "duena" | "revisor";
  tareaId?: string | null;
  // El eje que le pidieron a quien revisa (se resalta).
  ejeTarea?: Eje | null;
  onAviso?: (msg: string, error?: boolean) => void;
}) {
  const { data: v, isLoading } = useValoracion(patientId);
  const { data: items } = useItemsRevision("valoracion", patientId);
  const [pedir, setPedir] = useState<Eje | null>(null);
  const primer = patientNombre.split(" ")[0];

  if (isLoading) return <p className="m-0 text-[14px] text-tinta-tenue">Cargando la valoración…</p>;
  if (!v) return null;

  const filas = EJES.map((e) => {
    if (e.id === "etapa") {
      const valor = v.etapa.ajuste ?? (v.etapa.derivadas.length ? v.etapa.derivadas.join(",") : null);
      return { eje: e, valor, fuente: v.etapa.ajuste ? "Ajuste de la clínica" : "Del cuestionario", ajuste: v.etapa.ajuste };
    }
    const x = v.ejes[e.id as Exclude<Eje, "etapa">];
    return { eje: e, valor: x.ajuste ?? x.motor, fuente: x.ajuste ? "Ajuste de la clínica" : x.motor ? "Motor (cuestionario)" : "Sin dato", ajuste: x.ajuste };
  });

  return (
    <section className="rounded-3xl border border-borde bg-white p-5 sm:p-6 grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-verde-serenidad">Valoración</p>
          <h3 className="m-0 mt-0.5 font-serif font-normal text-[24px] leading-tight text-tinta">Etapa y ejes de {primer}</h3>
        </div>
        <p className="m-0 text-[12.5px] text-tinta-tenue">Solo para el equipo · nunca la ve la familia</p>
      </div>
      <ul className="m-0 p-0 list-none grid gap-2.5">
        {filas.map((f) => (
          <Fila
            key={f.eje.id}
            eje={f.eje.id}
            label={f.eje.label}
            valor={f.valor}
            fuente={f.fuente}
            ajuste={f.ajuste}
            estado={v.estados[f.eje.id]}
            items={(items ?? []).filter((i) => i.eje === f.eje.id && i.estado === "abierta")}
            modo={modo}
            resaltada={ejeTarea === f.eje.id}
            patientId={patientId}
            tareaId={tareaId}
            onPedir={() => setPedir(f.eje.id)}
            onAviso={onAviso}
          />
        ))}
      </ul>
      {pedir && (
        <NuevaTareaModal
          contexto={{ tipo: "valorar_paciente", patientId, patientNombre, eje: pedir, areas: EJES.find((e) => e.id === pedir)?.area }}
          onClose={() => setPedir(null)}
          onCreada={(m) => {
            setPedir(null);
            onAviso?.(m);
          }}
        />
      )}
    </section>
  );
}

function Valor({ eje, valor }: { eje: Eje; valor: string | null }) {
  if (eje === "etapa") {
    const actuales = (valor ?? "").split(",").filter(Boolean);
    return (
      <span className="flex flex-wrap gap-1">
        {ETAPAS.map((e) => (
          <span key={e} className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold border ${actuales.includes(e) ? "bg-tinta text-white border-tinta" : "bg-white text-tinta-tenue border-borde-suave"}`}>
            {textoValor("etapa", e)}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-tinta">
      <span className={`w-3 h-3 rounded-full ${valor ? PUNTO[valor] : "bg-borde"}`} />
      {valor ? textoValor(eje, valor) : "Sin dato"}
    </span>
  );
}

function Fila({
  eje,
  label,
  valor,
  fuente,
  ajuste,
  estado,
  items,
  modo,
  resaltada,
  patientId,
  tareaId,
  onPedir,
  onAviso,
}: {
  eje: Eje;
  label: string;
  valor: string | null;
  fuente: string;
  ajuste: string | null;
  estado: Parameters<typeof EstadoRevisionChip>[0]["estado"];
  items: ItemRevision[];
  modo: "duena" | "revisor";
  resaltada: boolean;
  patientId: string;
  tareaId: string | null;
  onPedir: () => void;
  onAviso?: (msg: string, error?: boolean) => void;
}) {
  const ajustar = useAjustarValoracion();
  const decidir = useDecidirItem();
  const agregar = useAgregarItem();
  const [abierta, setAbierta] = useState(resaltada);
  const [forma, setForma] = useState<"ajustar" | "proponer" | "comentar" | null>(resaltada && modo === "revisor" ? "proponer" : null);
  const [nuevo, setNuevo] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const opciones: string[] = eje === "etapa" ? [...ETAPAS] : [...COLORES];
  const sugerencias = items.filter((i) => i.clase === "sugerencia");
  const comentarios = items.filter((i) => i.clase === "comentario");

  async function aceptar(i: ItemRevision) {
    if (i.cambio?.op !== "valor") return;
    try {
      await ajustar.mutateAsync({ patientId, eje, valor: i.cambio.valor });
      await decidir.mutateAsync({ id: i.id, estado: "aceptada" });
      onAviso?.(`${label}: ajuste aceptado.`);
    } catch (e) {
      onAviso?.((e as Error).message, true);
    }
  }
  async function guardarAjuste() {
    try {
      await ajustar.mutateAsync({ patientId, eje, valor: nuevo === "motor" ? null : nuevo });
      setForma(null);
      onAviso?.(`${label} ajustado.`);
    } catch (e) {
      onAviso?.((e as Error).message, true);
    }
  }
  async function proponer() {
    try {
      if (forma === "comentar") {
        await agregar.mutateAsync({ objeto: "valoracion", objetoId: patientId, clase: "comentario", eje, texto: motivo, tareaId, ancla: { tipo: "eje", eje } });
      } else {
        await agregar.mutateAsync({
          objeto: "valoracion",
          objetoId: patientId,
          clase: "sugerencia",
          eje,
          tareaId,
          ancla: { tipo: "eje", eje },
          cambio: { op: "valor", eje, valor: nuevo === "motor" ? null : nuevo },
          texto: motivo || undefined,
        });
      }
      setForma(null);
      setMotivo("");
      setNuevo("");
      onAviso?.(forma === "comentar" ? "Comentario enviado." : "Propuesta enviada a la coordinación.");
    } catch (e) {
      onAviso?.((e as Error).message, true);
    }
  }

  return (
    <li className={`rounded-2xl border px-4 py-3 grid gap-2.5 ${resaltada ? "border-verde-profundo ring-2 ring-verde-profundo/15" : "border-borde"}`}>
      <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
        <span className="text-[14.5px] font-bold text-tinta">{label}</span>
        <span className="grid gap-1 min-w-0">
          <Valor eje={eje} valor={valor} />
          <span className="text-[12.5px] text-tinta-tenue">{fuente}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <EstadoRevisionChip estado={estado} compacto />
          {items.length > 0 && (
            <button type="button" onClick={() => setAbierta((a) => !a)} className={`${btn} border-0 bg-mostaza-vital/40 text-[#6e521c]`}>
              {items.length} {abierta ? "▴" : "▾"}
            </button>
          )}
        </span>
      </div>

      {abierta && items.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-2">
          {[...sugerencias, ...comentarios].map((i) => (
            <Tarjeta
              key={i.id}
              i={i}
              acciones={
                modo === "duena" ? (
                  i.clase === "sugerencia" ? (
                    <>
                      <button type="button" onClick={() => aceptar(i)} className={`${btn} border-0 bg-verde-profundo text-white`}>
                        Aceptar y ajustar
                      </button>
                      <button type="button" onClick={() => decidir.mutate({ id: i.id, estado: "descartada" })} className={`${btn} border-[1.5px] border-borde bg-white text-tinta`}>
                        Descartar
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => decidir.mutate({ id: i.id, estado: "resuelta" })} className={`${btn} border-[1.5px] border-borde bg-white text-tinta`}>
                      Marcar resuelto
                    </button>
                  )
                ) : null
              }
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5">
        {modo === "duena" ? (
          <>
            <button type="button" onClick={onPedir} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
              Pedir revisión
            </button>
            <button type="button" onClick={() => setForma(forma === "ajustar" ? null : "ajustar")} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
              Ajustar
            </button>
            {ajuste && (
              <button type="button" onClick={() => ajustar.mutate({ patientId, eje, valor: null })} className={`${btn} border-0 bg-transparent text-tinta-tenue underline decoration-dotted`}>
                Volver al cálculo
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => setForma(forma === "proponer" ? null : "proponer")} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
              Proponer cambio
            </button>
            <button type="button" onClick={() => setForma(forma === "comentar" ? null : "comentar")} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
              Comentar
            </button>
          </>
        )}
      </div>

      {forma && (
        <div className="grid gap-2 rounded-2xl bg-campo px-3 py-3">
          {forma !== "comentar" && (
            <select value={nuevo} onChange={(e) => setNuevo(e.target.value)} className={selectCls} aria-label={`Nuevo valor de ${label}`}>
              <option value="">Elegí…</option>
              {opciones.map((o) => (
                <option key={o} value={o}>
                  {textoValor(eje, o)}
                </option>
              ))}
              <option value="motor">Volver a lo que calcula el motor</option>
            </select>
          )}
          {forma !== "ajustar" && (
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder={forma === "comentar" ? "Tu comentario" : "Por qué (lo que viste en las semanas, en el cuestionario…)"}
              className="w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 py-2 font-sans text-[14px] text-tinta resize-y"
            />
          )}
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={(forma !== "comentar" && !nuevo) || (forma === "comentar" && !motivo.trim()) || ajustar.isPending || agregar.isPending}
              onClick={forma === "ajustar" ? guardarAjuste : proponer}
              className={`${btn} border-0 bg-verde-profundo text-white`}
            >
              {forma === "ajustar" ? "Guardar ajuste" : forma === "comentar" ? "Comentar" : "Enviar propuesta"}
            </button>
            <button type="button" onClick={() => setForma(null)} className={`${btn} border-[1.5px] border-borde bg-white text-tinta`}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
