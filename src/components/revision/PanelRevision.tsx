import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "../../lib/useSession";
import { colorArea, describirCambio, ejeLabel, useAgregarItem, useDecidirItem, useItemsRevision, type Eje, type ItemRevision, type ObjetoRevision } from "../../lib/revisiones";

// Panel de revisión: las sugerencias y comentarios de un objeto, en el
// mismo lugar donde se trabaja. La dueña (coordinación) acepta o descarta de
// un toque, uno por uno o todo lo de un área; quien revisa ve lo suyo y
// puede retirarlo. Atajos: J/K para moverse, A aceptar, D descartar.
type Pestana = "sugerencias" | "comentarios" | "historial";

export function Avatar({ nombre, area, chico = false }: { nombre: string | null; area: string | null; chico?: boolean }) {
  const ini = (nombre ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`${chico ? "w-6 h-6 text-[10.5px]" : "w-7 h-7 text-[11.5px]"} shrink-0 rounded-full inline-flex items-center justify-center font-bold text-white`}
      style={{ background: colorArea(area) }}
    >
      {ini}
    </span>
  );
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "");
const btn = "inline-flex items-center min-h-8 px-3 rounded-full text-[12.5px] font-semibold cursor-pointer font-sans disabled:opacity-50";

export function PanelRevision({
  objeto,
  objetoId,
  modo,
  tareaId = null,
  eje = null,
  onAceptar,
  marcadas = {},
  arriba,
  onFoco,
  sinComentar = false,
}: {
  objeto: ObjetoRevision;
  objetoId: string | null;
  modo: "duena" | "revisor";
  tareaId?: string | null;
  // Solo lo de un eje (valoración).
  eje?: Eje | null;
  // Aplica la sugerencia en lo que se está editando. Devuelve un error para
  // mostrar, o null si se aplicó (la decisión la registra quien llama).
  onAceptar?: (item: ItemRevision) => Promise<string | null>;
  // Aceptadas en esta pantalla que se registran al guardar (plantillas).
  marcadas?: Record<string, true>;
  arriba?: ReactNode;
  onFoco?: (item: ItemRevision | null) => void;
  sinComentar?: boolean;
}) {
  const session = useSession();
  const uid = session.status === "authed" ? session.session.user.id : null;
  const { data: todos } = useItemsRevision(objeto, objetoId);
  const decidir = useDecidirItem();
  const agregar = useAgregarItem();
  const [pestana, setPestana] = useState<Pestana>("sugerencias");
  const [foco, setFoco] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const items = useMemo(() => (todos ?? []).filter((i) => !eje || i.eje === eje || (i.cambio?.op === "valor" && i.cambio.eje === eje)), [todos, eje]);
  const abiertas = items.filter((i) => i.clase === "sugerencia" && i.estado === "abierta" && !marcadas[i.id]);
  const comentarios = items.filter((i) => i.clase === "comentario" && i.estado === "abierta");
  const historial = items.filter((i) => i.estado !== "abierta" || marcadas[i.id]).slice().reverse();
  const porArea = useMemo(() => {
    const m = new Map<string, ItemRevision[]>();
    for (const i of abiertas) {
      const k = i.autor_area ?? "Equipo";
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return [...m.entries()].filter(([, xs]) => xs.length > 1);
  }, [abiertas]);

  const focoItem = pestana === "sugerencias" ? (abiertas[Math.min(foco, abiertas.length - 1)] ?? null) : null;
  useEffect(() => {
    onFoco?.(focoItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focoItem?.id]);

  async function aceptar(i: ItemRevision) {
    if (!onAceptar) return;
    setError(null);
    setOcupado(i.id);
    const e = await onAceptar(i);
    setOcupado(null);
    if (e) setError(e);
  }
  async function descartar(i: ItemRevision) {
    setError(null);
    setOcupado(i.id);
    try {
      await decidir.mutateAsync({ id: i.id, estado: "descartada" });
    } catch (e) {
      setError((e as Error).message);
    }
    setOcupado(null);
  }
  async function aceptarTodas(xs: ItemRevision[]) {
    for (const i of xs) await aceptar(i);
  }

  // Atajos de teclado (fuera de los campos de texto).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || pestana !== "sugerencias" || abiertas.length === 0) return;
      const k = e.key.toLowerCase();
      if (k === "j") setFoco((f) => Math.min(f + 1, abiertas.length - 1));
      else if (k === "k") setFoco((f) => Math.max(f - 1, 0));
      else if (k === "a" && modo === "duena" && focoItem) aceptar(focoItem);
      else if (k === "d" && modo === "duena" && focoItem) descartar(focoItem);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function comentar() {
    if (!objetoId || !comentario.trim()) return;
    setError(null);
    try {
      await agregar.mutateAsync({ objeto, objetoId, clase: "comentario", texto: comentario.trim(), eje, tareaId, ancla: eje ? { tipo: "eje", eje } : { tipo: "general" } });
      setComentario("");
      setPestana("comentarios");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const pestanas: { id: Pestana; label: string }[] = [
    { id: "sugerencias", label: `Sugerencias${abiertas.length ? ` · ${abiertas.length}` : ""}` },
    { id: "comentarios", label: `Comentarios${comentarios.length ? ` · ${comentarios.length}` : ""}` },
    { id: "historial", label: "Historial" },
  ];

  return (
    <aside aria-label="Revisión" className="grid gap-3 content-start min-w-0">
      <div role="tablist" className="flex gap-4 border-b border-borde">
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`pb-2 -mb-px border-0 border-b-[2.5px] bg-transparent text-[13px] font-bold cursor-pointer font-sans ${pestana === p.id ? "border-verde-profundo text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {arriba}
      {error && <p className="m-0 rounded-xl bg-alerta px-3 py-2 text-[13px] text-alerta-texto">{error}</p>}

      {pestana === "sugerencias" && (
        <>
          {abiertas.length === 0 ? (
            <p className="m-0 text-[13.5px] text-tinta-tenue">{modo === "duena" ? "No hay sugerencias pendientes." : "Tocá una actividad o una celda del calendario para sugerir un cambio."}</p>
          ) : (
            <ul className="m-0 p-0 list-none grid gap-2.5">
              {abiertas.map((i, n) => (
                <Tarjeta
                  key={i.id}
                  i={i}
                  enFoco={focoItem?.id === i.id}
                  onFoco={() => setFoco(n)}
                  acciones={
                    modo === "duena" ? (
                      <>
                        <button type="button" disabled={ocupado === i.id} onClick={() => aceptar(i)} className={`${btn} border-0 bg-verde-profundo text-white hover:bg-tinta`}>
                          Aceptar
                        </button>
                        <button type="button" disabled={ocupado === i.id} onClick={() => descartar(i)} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
                          Descartar
                        </button>
                      </>
                    ) : i.autor_id === uid ? (
                      <button type="button" onClick={() => decidir.mutate({ id: i.id, estado: "retirar" })} className={`${btn} border-[1.5px] border-borde bg-white text-tinta`}>
                        Retirar
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
          {modo === "duena" && porArea.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {porArea.map(([area, xs]) => (
                <button key={area} type="button" onClick={() => aceptarTodas(xs)} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
                  Aceptar todo de {area} ({xs.length})
                </button>
              ))}
            </div>
          )}
          {abiertas.length > 1 && (
            <p className="m-0 text-[12px] text-tinta-tenue">
              <Kbd>J</Kbd>/<Kbd>K</Kbd> moverse{modo === "duena" && <> · <Kbd>A</Kbd> aceptar · <Kbd>D</Kbd> descartar</>}
            </p>
          )}
        </>
      )}

      {pestana === "comentarios" && (
        <ul className="m-0 p-0 list-none grid gap-2">
          {comentarios.length === 0 && <li className="text-[13.5px] text-tinta-tenue">Sin comentarios abiertos.</li>}
          {comentarios.map((i) => (
            <Tarjeta
              key={i.id}
              i={i}
              acciones={
                modo === "duena" ? (
                  <button type="button" onClick={() => decidir.mutate({ id: i.id, estado: "resuelta" })} className={`${btn} border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad`}>
                    Marcar resuelto
                  </button>
                ) : i.autor_id === uid ? (
                  <button type="button" onClick={() => decidir.mutate({ id: i.id, estado: "retirar" })} className={`${btn} border-[1.5px] border-borde bg-white text-tinta`}>
                    Retirar
                  </button>
                ) : null
              }
            />
          ))}
        </ul>
      )}

      {pestana === "historial" && (
        <ul className="m-0 p-0 list-none grid gap-2">
          {historial.length === 0 && <li className="text-[13.5px] text-tinta-tenue">Todavía nada decidido.</li>}
          {historial.map((i) => (
            <Tarjeta key={i.id} i={i} decidida={marcadas[i.id] ? "Aceptada · se aplica al guardar" : undefined} />
          ))}
        </ul>
      )}

      {!sinComentar && objetoId && (
        <div className="grid gap-1.5">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={eje ? `Comentario sobre ${ejeLabel(eje).toLowerCase()}…` : "Comentario general…"}
            className="w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 py-2 font-sans text-[14px] text-tinta resize-y focus:border-verde-serenidad focus:outline-none"
          />
          <button type="button" onClick={comentar} disabled={!comentario.trim() || agregar.isPending} className={`${btn} justify-self-start border-0 bg-tinta text-white`}>
            Comentar
          </button>
        </div>
      )}
    </aside>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-block rounded-md border border-borde border-b-2 bg-white px-1 font-sans text-[10.5px] font-semibold text-tinta-suave">{children}</kbd>;
}

const DECISION: Record<string, string> = { aceptada: "Aceptada", descartada: "Descartada", resuelta: "Resuelto" };

export function Tarjeta({ i, acciones, enFoco = false, onFoco, decidida }: { i: ItemRevision; acciones?: ReactNode; enFoco?: boolean; onFoco?: () => void; decidida?: string }) {
  const d = i.cambio ? describirCambio(i.cambio) : null;
  return (
    <li
      onClick={onFoco}
      className={`rounded-2xl border bg-white px-3 py-2.5 grid gap-2 text-[13.5px] ${enFoco ? "border-verde-profundo ring-2 ring-verde-profundo/20" : "border-borde"} ${i.estado !== "abierta" && !decidida ? "opacity-80" : ""}`}
    >
      <div className="flex items-center gap-2 text-[12.5px] text-tinta-tenue min-w-0">
        <Avatar nombre={i.autor_nombre} area={i.autor_area} chico />
        <span className="min-w-0 truncate">
          {i.autor_nombre ?? "Equipo"}
          {i.autor_area ? ` · ${i.autor_area}` : ""}
        </span>
        <span className="ml-auto shrink-0">{fecha(i.created_at)}</span>
      </div>
      {(i.para_proxima || i.eje) && (
        <div className="flex flex-wrap gap-1">
          {i.para_proxima && <span className="rounded-full bg-verde-tenue px-2 py-0.5 text-[11px] font-semibold text-verde-profundo">Del seguimiento</span>}
          {i.eje && <span className="rounded-full bg-campo px-2 py-0.5 text-[11px] font-semibold text-tinta-suave">{ejeLabel(i.eje)}</span>}
        </div>
      )}
      {d && (
        <div className="grid gap-0.5 rounded-xl bg-campo px-2.5 py-2">
          {d.antes && <span className="text-tinta-tenue line-through">{d.antes}</span>}
          <span className="font-semibold text-tinta">{d.despues}</span>
        </div>
      )}
      {i.ancla.tipo === "actividad" && !d && <span className="text-[12.5px] text-tinta-tenue">Sobre «{i.ancla.recurso.titulo}»</span>}
      {i.texto && <span className="leading-relaxed text-tinta-suave whitespace-pre-wrap">{i.texto}</span>}
      {(decidida || i.estado !== "abierta") && (
        <span className="text-[12px] font-semibold text-tinta-tenue">
          {decidida ?? `${DECISION[i.estado] ?? i.estado}${i.decidida_nombre ? ` por ${i.decidida_nombre.split(" ")[0]}` : ""}`}
        </span>
      )}
      {acciones && <div className="flex flex-wrap gap-1.5">{acciones}</div>}
    </li>
  );
}
