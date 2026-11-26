import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { RowMenu } from "../../ui/RowMenu";
import { PillToggle } from "../../ui/PillToggle";
import { Indicador, Seccion } from "./Piezas";
import { Servicios } from "./Servicios";

// Gastos (Administración): cuánto cuesta operar la app cada mes, y los
// interruptores de cada servicio con costo (Servicios.tsx).
//   Consumo      Gemini (tokens), ElevenLabs (créditos) y WhatsApp (mensajes),
//                registrado en cada llamada y valorado con las tarifas.
//   Registrados  suscripciones y pagos únicos que se anotan a mano
//                (Supabase, Vercel, plan de ElevenLabs, dominio…).
// Las tarifas se editan acá: un cambio recalcula todo el historial.

type Servicio = "gemini" | "elevenlabs" | "whatsapp";
interface Detalle {
  servicio: Servicio;
  funcion: string;
  veces: number;
  entrada: number;
  salida: number;
  creditos: number;
  segundos: number;
  usd: number;
}
interface Gasto {
  id: string;
  fecha: string;
  proveedor: string;
  concepto: string | null;
  categoria: string;
  monto: number;
  moneda: "USD" | "CRC";
  recurrente: boolean;
  hasta: string | null;
  nota: string | null;
  usd: number;
}
interface MesTendencia {
  mes: string;
  gemini: number;
  elevenlabs: number;
  whatsapp: number;
  registrados: number;
  ingresos_crc: number;
}
interface Resumen {
  mes: string;
  tipo_cambio: number;
  tendencia: MesTendencia[];
  detalle: Detalle[];
  gastos: Gasto[];
  familias_activas: number;
}
interface Tarifa {
  clave: string;
  valor: number;
  etiqueta: string;
  unidad: string;
  nota: string | null;
  orden: number;
}

const SERVICIO: Record<Servicio, string> = { gemini: "Gemini (IA de Google)", elevenlabs: "ElevenLabs (Clara y voz)", whatsapp: "WhatsApp" };
const FUNCION: Record<string, string> = {
  personalizar_semana: "Personalizar la semana desde una plantilla",
  seguimiento: "Panorama del caso (Seguimiento)",
  resumen_final: "Resumen del registro de la familia",
  mensaje_semana: "Mensaje para la familia al publicar",
  voz: "Voz que lee las actividades",
  clara: "Conversaciones con Clara",
  start: "Recordatorio de la próxima actividad",
  prep: "Qué preparar para mañana",
  close: "Cierre de actividad",
  programa_listo: "Semana publicada",
  semana_revisada: "Semana revisada",
  solicitud_revisada: "Solicitud revisada",
};
const CATEGORIA: Record<string, string> = { ia: "IA", whatsapp: "WhatsApp", infraestructura: "Servidores y app", correo: "Correo", dominio: "Dominio", otro: "Otro" };
const PROVEEDORES = ["Supabase", "Vercel", "ElevenLabs", "Google (Gemini)", "Meta (WhatsApp)", "Resend", "Dominio", "Google Workspace"];

const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const colones = (n: number) => `₡${miles(n)}`;
const dolares = (n: number) => `US$${n < 10 ? n.toFixed(2).replace(".", ",") : miles(n)}`;
const mesDe = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);
const nombreMes = (iso: string, conAnio = true) => mesDe(iso).toLocaleDateString("es-CR", { month: "long", ...(conAnio ? { year: "numeric" } : {}) });
const isoMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
const fechaCorta = (iso: string) => mesDe(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
const totalMes = (m: MesTendencia) => m.gemini + m.elevenlabs + m.whatsapp + m.registrados;

function unidades(d: Detalle): string {
  if (d.servicio === "gemini") return `${d.veces === 1 ? "1 uso" : `${miles(d.veces)} usos`} · ${miles((d.entrada + d.salida) / 1000)} mil tokens`;
  if (d.servicio === "elevenlabs") {
    const min = d.segundos ? ` · ${miles(d.segundos / 60)} min` : "";
    return `${d.veces === 1 ? "1 vez" : `${miles(d.veces)} veces`} · ${miles(d.creditos)} créditos${min}`;
  }
  return d.veces === 1 ? "1 mensaje" : `${miles(d.veces)} mensajes`;
}

export function Gastos({ onAviso }: { onAviso: (t: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const [mes, setMes] = useState(isoMes(hoy));
  const [editando, setEditando] = useState<Gasto | "nuevo" | null>(null);
  const esMesActual = mes === isoMes(hoy);

  const { data: r, isLoading } = useQuery({
    queryKey: ["resumen-gastos", mes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resumen_gastos", { p_mes: mes, p_meses: 6 });
      if (error) throw error;
      return data as Resumen;
    },
  });
  const { data: proveedores } = useQuery({
    queryKey: ["uso-proveedores"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("uso-proveedores", { body: {} });
      if (error) throw error;
      return data as { elevenlabs: { plan?: string; usados?: number; limite?: number; renueva?: string; error?: string } | null };
    },
  });
  const borrar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      onAviso("Gasto eliminado.");
      qc.invalidateQueries({ queryKey: ["resumen-gastos"] });
    },
    onError: (e) => onAviso((e as Error).message, true),
  });

  const moverMes = (n: number) => {
    const d = mesDe(mes);
    setMes(isoMes(new Date(d.getFullYear(), d.getMonth() + n, 1)));
  };

  if (isLoading || !r) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  const tc = r.tipo_cambio;
  const actual = r.tendencia[r.tendencia.length - 1];
  const anterior = r.tendencia[r.tendencia.length - 2];
  const total = actual ? totalMes(actual) : 0;
  const consumo = actual ? actual.gemini + actual.elevenlabs + actual.whatsapp : 0;
  const ingresosUsd = (actual?.ingresos_crc ?? 0) / tc;
  const resultadoCrc = (actual?.ingresos_crc ?? 0) - total * tc;
  const porFamilia = r.familias_activas > 0 ? total / r.familias_activas : null;

  // Por servicio: consumo estimado + lo registrado de cada categoría.
  const registradoPor = (cat: string[]) => r.gastos.filter((g) => cat.includes(g.categoria)).reduce((n, g) => n + g.usd, 0);
  const barras = [
    { id: "gemini", label: "Gemini", usd: actual?.gemini ?? 0 },
    { id: "elevenlabs", label: "ElevenLabs", usd: actual?.elevenlabs ?? 0 },
    { id: "whatsapp", label: "WhatsApp", usd: (actual?.whatsapp ?? 0) + registradoPor(["whatsapp"]) },
    ...Object.entries(
      r.gastos
        .filter((g) => g.categoria !== "whatsapp")
        .reduce<Record<string, number>>((acc, g) => {
          acc[g.proveedor] = (acc[g.proveedor] ?? 0) + g.usd;
          return acc;
        }, {}),
    ).map(([p, usd]) => ({ id: `g-${p}`, label: p, usd })),
  ]
    .reduce<{ id: string; label: string; usd: number }[]>((acc, b) => {
      // Un gasto registrado con el mismo nombre del servicio se suma a su barra.
      const igual = acc.find((x) => x.label.toLowerCase() === b.label.toLowerCase() || b.label.toLowerCase().includes(x.label.toLowerCase()));
      if (igual && b.id.startsWith("g-")) igual.usd += b.usd;
      else acc.push({ ...b });
      return acc;
    }, [])
    .filter((b) => b.usd > 0)
    .sort((a, b) => b.usd - a.usd);
  const maxBarra = Math.max(0.01, ...barras.map((b) => b.usd));
  const maxTendencia = Math.max(0.01, ...r.tendencia.map((m) => Math.max(totalMes(m), m.ingresos_crc / tc)));
  const el = proveedores?.elevenlabs;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <button type="button" onClick={() => moverMes(-1)} aria-label="Mes anterior" className="w-10 h-10 rounded-full border border-borde bg-white cursor-pointer text-[18px] text-tinta hover:border-verde-serenidad">
            ‹
          </button>
          <span className="min-w-[160px] text-center font-serif text-[22px] text-tinta first-letter:uppercase">{nombreMes(mes)}</span>
          <button
            type="button"
            onClick={() => moverMes(1)}
            disabled={esMesActual}
            aria-label="Mes siguiente"
            className="w-10 h-10 rounded-full border border-borde bg-white cursor-pointer text-[18px] text-tinta hover:border-verde-serenidad disabled:opacity-40 disabled:cursor-default"
          >
            ›
          </button>
        </div>
        <Button dense onClick={() => setEditando("nuevo")}>
          + Registrar gasto
        </Button>
      </div>

      <Seccion titulo="El mes en números">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            valor={colones(total * tc)}
            etiqueta={esMesActual ? "Gastado en lo que va del mes" : "Gastado en el mes"}
            detalle={`${dolares(total)}${anterior ? ` · mes anterior: ${colones(totalMes(anterior) * tc)}` : ""}`}
          />
          <Indicador valor={colones(consumo * tc)} etiqueta="Consumo de IA y WhatsApp" detalle="Estimado con las tarifas de abajo" />
          <Indicador valor={colones(actual?.ingresos_crc ?? 0)} etiqueta="Ingresos del mes" detalle={`Pagos registrados en Cobros (${dolares(ingresosUsd)})`} />
          <Indicador
            valor={`${resultadoCrc < 0 ? "−" : ""}${colones(Math.abs(resultadoCrc))}`}
            etiqueta="Resultado"
            detalle={porFamilia !== null ? `Costo por familia pagando: ${colones(porFamilia * tc)}` : "Ingresos menos gastos"}
            tono={resultadoCrc < 0 ? "aviso" : "bien"}
          />
        </div>
      </Seccion>

      <Servicios detalle={r.detalle} tc={tc} etiquetaMes={esMesActual ? "Este mes" : `En ${nombreMes(mes, false)}`} onAviso={onAviso} />

      <Seccion titulo="Por servicio">
        {barras.length === 0 ? (
          <p className="m-0 text-[14.5px] text-tinta-suave">Todavía no hay gastos en este mes.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2.5">
            {barras.map((b) => (
              <li key={b.id} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_96px] sm:grid-cols-[180px_minmax(0,1fr)_120px] items-center gap-3" title={`${b.label}: ${colones(b.usd * tc)} (${dolares(b.usd)})`}>
                <span className="text-[14px] text-tinta truncate">{b.label}</span>
                <span className="h-3 rounded-full bg-campo overflow-hidden">
                  <span className="block h-full rounded-r-[4px] rounded-l-full bg-verde-profundo" style={{ width: `${Math.max(2, (b.usd / maxBarra) * 100)}%` }} />
                </span>
                <span className="text-right text-[14px] font-semibold text-tinta tabular-nums">{colones(b.usd * tc)}</span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion titulo="Consumo en detalle">
        {r.detalle.length === 0 ? (
          <p className="m-0 text-[14.5px] text-tinta-suave">Sin consumo registrado en este mes. El registro de IA y voz empezó el 26 de noviembre de 2026; los WhatsApp se cuentan desde el primer envío.</p>
        ) : (
          <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
            {r.detalle.map((d) => (
              <li key={`${d.servicio}-${d.funcion}`} className="grid gap-0.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_110px] sm:items-center px-4 py-3 border-b border-borde-suave last:border-b-0">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-tinta">{FUNCION[d.funcion] ?? d.funcion}</span>
                  <span className="block text-[13px] text-tinta-suave">{SERVICIO[d.servicio]}</span>
                </span>
                <span className="text-[13.5px] text-tinta-suave">{unidades(d)}</span>
                <span className="sm:text-right text-[14px] font-semibold text-tinta tabular-nums">
                  {d.servicio === "elevenlabs" && d.usd === 0 ? "En el plan" : colones(d.usd * tc)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {el && (
          <p className="m-0 text-[13.5px] text-tinta-suave">
            {el.error
              ? `ElevenLabs: ${el.error}`
              : `ElevenLabs${el.plan ? ` (plan ${el.plan})` : ""}: ${miles(el.usados ?? 0)} de ${miles(el.limite ?? 0)} créditos usados${el.limite ? ` (${Math.round(((el.usados ?? 0) / el.limite) * 100)}%)` : ""}${el.renueva ? `, se renuevan el ${fechaCorta(el.renueva)}` : ""}.`}
          </p>
        )}
      </Seccion>

      <Seccion titulo="Gastos registrados">
        {r.gastos.length === 0 ? (
          <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave max-w-[62ch]">
            Anotá acá lo que se paga aparte: Supabase, Vercel, el plan de ElevenLabs, el dominio, el correo. Los mensuales se anotan una vez y se cuentan solos cada mes.
          </p>
        ) : (
          <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
            {r.gastos.map((g) => (
              <li key={g.id} className="grid grid-cols-[minmax(0,1fr)_auto_40px] items-center gap-3 px-4 py-3 border-b border-borde-suave last:border-b-0">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-tinta">
                    {g.proveedor}
                    {g.concepto ? <span className="font-normal text-tinta-suave"> · {g.concepto}</span> : null}
                  </span>
                  <span className="block text-[13px] text-tinta-suave">
                    {CATEGORIA[g.categoria] ?? g.categoria} · {g.recurrente ? `Mensual desde ${fechaCorta(g.fecha)}${g.hasta ? ` hasta ${fechaCorta(g.hasta)}` : ""}` : `Pago único del ${fechaCorta(g.fecha)}`}
                  </span>
                </span>
                <span className="text-right text-[14px] font-semibold text-tinta tabular-nums">{g.moneda === "CRC" ? colones(g.monto) : dolares(Number(g.monto))}</span>
                <RowMenu
                  items={[
                    { label: "Editar", onClick: () => setEditando(g) },
                    {
                      label: g.recurrente ? "Ya no se paga" : "Eliminar",
                      danger: !g.recurrente,
                      onClick: () => {
                        if (g.recurrente) setEditando({ ...g, hasta: isoMes(hoy) });
                        else if (window.confirm("¿Eliminar este gasto?")) borrar.mutate(g.id);
                      },
                    },
                    { label: "Eliminar", danger: true, hidden: !g.recurrente, onClick: () => window.confirm("¿Eliminar este gasto de todos los meses?") && borrar.mutate(g.id) },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion titulo="Últimos 6 meses">
        <ul className="list-none m-0 p-0 grid gap-3">
          {r.tendencia.map((m) => {
            const t = totalMes(m);
            const ing = m.ingresos_crc / tc;
            return (
              <li key={m.mes} className="grid grid-cols-[84px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)_220px] items-center gap-x-3 gap-y-1">
                <span className="text-[14px] text-tinta first-letter:uppercase">{nombreMes(m.mes, false)}</span>
                <span className="grid gap-1" title={`Gastos ${colones(t * tc)} · Ingresos ${colones(m.ingresos_crc)}`}>
                  <span className="h-2.5 rounded-full bg-campo overflow-hidden">
                    <span className="block h-full rounded-full bg-[#c08a3e]" style={{ width: `${t > 0 ? Math.max(2, (t / maxTendencia) * 100) : 0}%` }} />
                  </span>
                  <span className="h-2.5 rounded-full bg-campo overflow-hidden">
                    <span className="block h-full rounded-full bg-verde-profundo" style={{ width: `${ing > 0 ? Math.max(2, (ing / maxTendencia) * 100) : 0}%` }} />
                  </span>
                </span>
                <span className="col-start-2 sm:col-start-auto text-[13px] text-tinta-suave tabular-nums">
                  Gastos {colones(t * tc)} · Ingresos {colones(m.ingresos_crc)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="m-0 flex flex-wrap gap-4 text-[13px] text-tinta-suave">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#c08a3e]" /> Gastos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-verde-profundo" /> Ingresos
          </span>
        </p>
      </Seccion>

      <Tarifas onAviso={onAviso} />

      {editando && (
        <EditarGasto
          gasto={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
          onListo={(t) => {
            setEditando(null);
            onAviso(t);
            qc.invalidateQueries({ queryKey: ["resumen-gastos"] });
          }}
        />
      )}
    </div>
  );
}

function Tarifas({ onAviso }: { onAviso: (t: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tarifas-servicio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tarifas_servicio").select("clave, valor, etiqueta, unidad, nota, orden").order("orden");
      if (error) throw error;
      return (data ?? []) as Tarifa[];
    },
  });
  const [valores, setValores] = useState<Record<string, string>>({});
  const guardar = useMutation({
    mutationFn: async (t: Tarifa) => {
      const v = Number((valores[t.clave] ?? "").replace(",", "."));
      if (!Number.isFinite(v) || v < 0) throw new Error("Escribí un número válido.");
      const { error } = await supabase.rpc("actualizar_tarifa", { p_clave: t.clave, p_valor: v });
      if (error) throw error;
      return t;
    },
    onSuccess: (t) => {
      onAviso(`Tarifa «${t.etiqueta}» actualizada. Los montos se recalcularon.`);
      setValores((x) => {
        const { [t.clave]: _, ...resto } = x;
        return resto;
      });
      qc.invalidateQueries({ queryKey: ["tarifas-servicio"] });
      qc.invalidateQueries({ queryKey: ["resumen-gastos"] });
    },
    onError: (e) => onAviso((e as Error).message, true),
  });
  const campo = "w-28 min-h-10 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta tabular-nums focus:border-verde-serenidad focus:outline-none";
  return (
    <Seccion titulo="Tarifas">
      <p className="m-0 text-[14px] leading-relaxed text-tinta-suave max-w-[66ch]">
        Con estas tarifas se calcula el consumo. Si la factura de un proveedor dice otra cosa, cambiala acá y se recalcula todo, también los meses anteriores.
      </p>
      <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
        {(data ?? []).map((t) => {
          const cambiado = valores[t.clave] !== undefined && Number(valores[t.clave].replace(",", ".")) !== Number(t.valor);
          return (
            <li key={t.clave} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center px-4 py-3 border-b border-borde-suave last:border-b-0">
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-tinta">{t.etiqueta}</span>
                {t.nota && <span className="block text-[13px] leading-snug text-tinta-suave">{t.nota}</span>}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <input
                  inputMode="decimal"
                  aria-label={t.etiqueta}
                  value={valores[t.clave] ?? String(t.valor).replace(".", ",")}
                  onChange={(e) => setValores((x) => ({ ...x, [t.clave]: e.target.value }))}
                  className={campo}
                />
                <span className="text-[13px] text-tinta-suave">{t.unidad}</span>
                {cambiado && (
                  <Button dense onClick={() => guardar.mutate(t)} disabled={guardar.isPending}>
                    Guardar
                  </Button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}

function EditarGasto({ gasto, onClose, onListo }: { gasto: Gasto | null; onClose: () => void; onListo: (t: string) => void }) {
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const [proveedor, setProveedor] = useState(gasto?.proveedor ?? "");
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [categoria, setCategoria] = useState(gasto?.categoria ?? "infraestructura");
  const [monto, setMonto] = useState(gasto ? String(gasto.monto).replace(".", ",") : "");
  const [moneda, setMoneda] = useState<"USD" | "CRC">(gasto?.moneda ?? "USD");
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoyIso);
  const [recurrente, setRecurrente] = useState<"si" | "no">(gasto ? (gasto.recurrente ? "si" : "no") : "si");
  const [hasta, setHasta] = useState(gasto?.hasta ?? "");
  const [nota, setNota] = useState(gasto?.nota ?? "");
  const guardar = useMutation({
    mutationFn: async () => {
      const n = Number(monto.replace(/\./g, moneda === "CRC" ? "" : ".").replace(",", "."));
      if (!proveedor.trim()) throw new Error("Escribí el proveedor.");
      if (!Number.isFinite(n) || n <= 0) throw new Error("Escribí el monto.");
      const fila = {
        proveedor: proveedor.trim(),
        concepto: concepto.trim() || null,
        categoria,
        monto: n,
        moneda,
        fecha,
        recurrente: recurrente === "si",
        hasta: recurrente === "si" && hasta ? hasta : null,
        nota: nota.trim() || null,
      };
      const { error } = gasto ? await supabase.from("gastos").update(fila).eq("id", gasto.id) : await supabase.from("gastos").insert(fila);
      if (error) throw error;
    },
    onSuccess: () => onListo(gasto ? "Gasto actualizado." : "Gasto registrado."),
  });
  const campo = "w-full min-h-11 px-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none";
  return (
    <Modal onClose={onClose}>
      <h3 className="m-0 mb-5 pr-10 font-serif font-normal text-[24px] text-tinta">{gasto ? "Editar gasto" : "Registrar gasto"}</h3>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-[14px] font-semibold text-tinta">¿Cada cuánto?</span>
          <PillToggle
            value={recurrente}
            onChange={setRecurrente}
            options={[
              { value: "si", label: "Todos los meses" },
              { value: "no", label: "Una sola vez" },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Proveedor
            <input list="proveedores-gasto" value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Supabase, Vercel…" className={campo} />
            <datalist id="proveedores-gasto">
              {PROVEEDORES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Categoría
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
              {Object.entries(CATEGORIA).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Monto
            <span className="flex gap-2">
              <input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder={moneda === "USD" ? "25" : "12.500"} className={campo} />
              <select value={moneda} onChange={(e) => setMoneda(e.target.value as "USD" | "CRC")} aria-label="Moneda" className={`${campo} w-[96px]`}>
                <option value="USD">US$</option>
                <option value="CRC">₡</option>
              </select>
            </span>
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            {recurrente === "si" ? "Desde" : "Fecha"}
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
          </label>
          {recurrente === "si" && (
            <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
              Hasta
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} />
              <span className="text-[12.5px] font-normal text-tinta-tenue">Vacío si se sigue pagando.</span>
            </label>
          )}
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Concepto
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Plan Pro, dominio anual…" className={campo} />
          </label>
        </div>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Nota
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Opcional" className={campo} />
        </label>
        {guardar.isError && <p className="m-0 text-[14px] text-alerta-texto">{(guardar.error as Error).message}</p>}
        <Button variant="principal" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : gasto ? "Guardar cambios" : "Registrar gasto"}
        </Button>
      </div>
    </Modal>
  );
}
