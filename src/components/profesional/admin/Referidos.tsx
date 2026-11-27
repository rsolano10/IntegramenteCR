import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { enlaceReferido } from "../../../lib/referidos";
import { Indicador, Seccion } from "./Piezas";

// Referidos (Administración): qué profesionales refieren, cuántas personas,
// y cuántas pasan a pagar (autoguiado o con sesiones). También las personas
// que los referidores recomendaron desde su perfil, para contactarlas.
interface Metrica {
  referidor_id: string;
  nombre: string;
  especialidad: string | null;
  institucion: string | null;
  activo: boolean;
  referidos: number;
  en_revision: number;
  en_prueba: number;
  pagando: number;
  pagando_autoguiado: number;
  pagando_con_sesiones: number;
  no_continuaron: number;
  leads: number;
  leads_registrados: number;
  ultimo_referido: string | null;
}
interface Lead {
  id: string;
  referidor_id: string;
  nombre: string;
  telefono: string | null;
  motivo: string | null;
  estado: "nuevo" | "contactado" | "registrado" | "descartado";
  created_at: string;
}

const ESTADO_LEAD: Record<Lead["estado"], string> = { nuevo: "Nuevo", contactado: "Contactado", registrado: "Se registró", descartado: "Descartado" };
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export function Referidos({ onAviso }: { onAviso: (t: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const { data: metricas, isLoading } = useQuery({
    queryKey: ["metricas-referidos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("metricas_referidos");
      if (error) throw error;
      return (data ?? []) as Metrica[];
    },
  });
  const { data: codigos } = useQuery({
    queryKey: ["referidores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("referidores_lista");
      if (error) throw error;
      return new Map(((data ?? []) as { profile_id: string; codigo: string | null }[]).map((r) => [r.profile_id, r.codigo]));
    },
  });
  const { data: leads } = useQuery({
    queryKey: ["leads-referidos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads_referidos").select("id, referidor_id, nombre, telefono, motivo, estado, created_at").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });
  const cambiarLead = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Lead["estado"] }) => {
      const { error } = await supabase.rpc("actualizar_lead_referido", { p_id: id, p_estado: estado });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads-referidos"] });
      qc.invalidateQueries({ queryKey: ["metricas-referidos"] });
    },
    onError: (e) => onAviso((e as Error).message, true),
  });

  if (isLoading) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  const m = metricas ?? [];
  const tot = m.reduce(
    (a, x) => ({ referidos: a.referidos + x.referidos, pagando: a.pagando + x.pagando, auto: a.auto + x.pagando_autoguiado, ses: a.ses + x.pagando_con_sesiones, activos: a.activos + (x.referidos > 0 ? 1 : 0) }),
    { referidos: 0, pagando: 0, auto: 0, ses: 0, activos: 0 },
  );
  const nombreDe = new Map(m.map((x) => [x.referidor_id, x.nombre]));
  const nuevos = (leads ?? []).filter((l) => l.estado === "nuevo").length;

  return (
    <div className="grid gap-8">
      <Seccion titulo="En números">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador valor={String(m.length)} etiqueta="Profesionales referidores" detalle={`${tot.activos} ya refirieron a alguien`} />
          <Indicador valor={String(tot.referidos)} etiqueta="Personas referidas" detalle="Con enlace o asignadas por la clínica" />
          <Indicador valor={String(tot.pagando)} etiqueta="Pasaron a pagar" detalle={`${tot.auto} autoguiado · ${tot.ses} con sesiones`} tono="bien" />
          <Indicador valor={pct(tot.pagando, tot.referidos)} etiqueta="Conversión a pago" detalle="De las personas referidas" />
        </div>
      </Seccion>

      <Seccion titulo="Por profesional">
        {m.length === 0 ? (
          <p className="m-0 text-[14.5px] text-tinta-suave max-w-[62ch]">
            Todavía no hay profesionales referidores. Creá su cuenta en Usuarios › Equipo y referidores, con el tipo «Referidor»: cada uno recibe un enlace propio para referir.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[20px] border border-borde bg-white">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#fbf9f1] text-left text-[12.5px] font-bold text-tinta-suave">
                  <th className="px-4 py-2.5">Profesional</th>
                  <th className="px-3 py-2.5 text-right">Referidas</th>
                  <th className="px-3 py-2.5 text-right">En revisión</th>
                  <th className="px-3 py-2.5 text-right">En prueba</th>
                  <th className="px-3 py-2.5 text-right">Autoguiado</th>
                  <th className="px-3 py-2.5 text-right">Con sesiones</th>
                  <th className="px-3 py-2.5 text-right">No siguieron</th>
                  <th className="px-3 py-2.5 text-right">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {m.map((x) => (
                  <tr key={x.referidor_id} className={`border-t border-borde-suave ${x.activo ? "" : "opacity-60"}`}>
                    <td className="px-4 py-2.5">
                      <span className="block font-semibold text-tinta">{x.nombre}</span>
                      <span className="block text-[12.5px] text-tinta-suave">
                        {[x.especialidad, x.institucion, x.ultimo_referido ? `último: ${fecha(x.ultimo_referido)}` : null, x.leads ? `${x.leads} recomendado${x.leads === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
                      </span>
                      {codigos?.get(x.referidor_id) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const enlace = enlaceReferido(codigos.get(x.referidor_id)!);
                            try {
                              await navigator.clipboard.writeText(enlace);
                              onAviso(`Enlace de ${x.nombre.split(" ")[0]} copiado.`);
                            } catch {
                              window.prompt("Enlace:", enlace);
                            }
                          }}
                          className="mt-0.5 border-0 bg-transparent p-0 text-[12.5px] font-semibold text-verde-profundo cursor-pointer underline decoration-dotted"
                        >
                          Copiar su enlace
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{x.referidos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{x.en_revision}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{x.en_prueba}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{x.pagando_autoguiado}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{x.pagando_con_sesiones}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{x.no_continuaron}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{pct(x.pagando, x.referidos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Seccion titulo={nuevos ? `Recomendados por contactar (${nuevos})` : "Recomendados por los referidores"}>
        {(leads ?? []).length === 0 ? (
          <p className="m-0 text-[14.5px] text-tinta-suave">Cuando un referidor deja el contacto de alguien desde su perfil, aparece acá para que el equipo lo llame.</p>
        ) : (
          <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
            {(leads ?? []).map((l) => (
              <li key={l.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-tinta">
                    {l.nombre}
                    {l.telefono && (
                      <a href={`https://wa.me/506${l.telefono.replace(/\D/g, "").slice(-8)}`} target="_blank" rel="noreferrer" className="ml-2 text-[13.5px] font-semibold text-verde-profundo">
                        {l.telefono}
                      </a>
                    )}
                  </span>
                  <span className="block text-[13px] text-tinta-suave">
                    {[`De ${nombreDe.get(l.referidor_id) ?? "un referidor"}`, fecha(l.created_at), l.motivo].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <select
                  value={l.estado}
                  onChange={(e) => cambiarLead.mutate({ id: l.id, estado: e.target.value as Lead["estado"] })}
                  className="min-h-10 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14px] text-tinta"
                >
                  {(Object.keys(ESTADO_LEAD) as Lead["estado"][]).map((k) => (
                    <option key={k} value={k}>
                      {ESTADO_LEAD[k]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
