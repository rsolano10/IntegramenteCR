import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useEsAdmin } from "../../lib/useEsAdmin";
import { usePatients } from "../../lib/patients";
import { ORDEN_ESTADOS, useCuentaPorPaciente } from "../../lib/usePanelCuentas";
import { estadoInfo, type FilaCuenta } from "../../lib/cuentas";
import { planTiers } from "../../lib/mockData";
import { waLink } from "../../lib/whatsapp";
import { VERSION_LEGAL, CONSENTIMIENTOS } from "../../lib/consentimientos";
import { Caja, CajaAviso, CajaCuerpo, CajaPestanas, Pagina, type PestanaCaja } from "../../components/profesional/Caja";
import { BadgeRol } from "../../components/ui/AccountMenu";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { RowMenu } from "../../components/ui/RowMenu";
import { PillToggle } from "../../components/ui/PillToggle";
import { AjustesCuentasModal } from "../../components/profesional/CuentaSeguimiento";
import { SolicitudesDatos } from "../../components/profesional/SolicitudesDatos";
import { Indicador, Seccion } from "../../components/profesional/admin/Piezas";
import { Gastos } from "../../components/profesional/admin/Gastos";

// Administración: la vista de negocio del administrador (una persona de
// administración, no de salud). Ve todo lo de la clínica y además:
//   Resumen        familias, ingresos, conversión, embudo y bajas
//   Cobros         SINPE Móvil y transferencia: quién venció, quién vence,
//                  registrar pagos (cada pago cubre un período)
//   Gastos         IA, WhatsApp y suscripciones: cuánto cuesta operar
//   Equipo         profesionales, carga y confidencialidad
//   Configuración  semana gratis, inactividad, IA, horarios de WhatsApp
//   Cumplimiento   permisos (Ley 8968) y solicitudes de datos

type Pestana = "resumen" | "cobros" | "gastos" | "equipo" | "configuracion" | "cumplimiento";

interface EstadoCobro {
  patient_id: string;
  pagado_hasta: string | null;
  ultimo_pago: string | null;
  ultimo_monto: number | null;
  ultimo_medio: string | null;
}

interface Pago {
  id: string;
  patient_id: string;
  monto: number;
  medio: "sinpe" | "transferencia" | "otro";
  referencia: string | null;
  fecha_pago: string;
  cubre_desde: string;
  cubre_hasta: string;
  patients: { nombre: string } | { nombre: string }[] | null;
}

const MEDIO: Record<Pago["medio"], string> = { sinpe: "SINPE Móvil", transferencia: "Transferencia", otro: "Otro" };

const colones = (n: number) => `₡${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const hoyCR = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
const isoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fechaCorta = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
const diasEntre = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000);
const precioPrograma = (modalidad: string | null) => {
  const t = planTiers.find((x) => x.id === modalidad);
  const n = Number((t?.precio ?? "").replace(/\D/g, ""));
  return n > 0 ? n : null;
};

// ── Datos compartidos por las pestañas ─────────────────────────────────
function useCobros() {
  return useQuery({
    queryKey: ["estado-cobros"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("estado_cobros");
      if (error) throw error;
      return new Map(((data ?? []) as EstadoCobro[]).map((c) => [c.patient_id, c]));
    },
  });
}

function usePagos(desde: string) {
  return useQuery({
    queryKey: ["pagos", desde],
    queryFn: async () => {
      const { data, error } = await supabase.from("pagos").select("id, patient_id, monto, medio, referencia, fecha_pago, cubre_desde, cubre_hasta, patients(nombre)").gte("fecha_pago", desde).order("fecha_pago", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pago[];
    },
  });
}

// En qué situación de cobro está cada familia.
type SituacionCobro = "vencido" | "vence_pronto" | "al_dia" | "en_prueba" | "sin_periodo" | "otra";
function situacion(f: FilaCuenta, c: EstadoCobro | undefined, hoy: string): { tipo: SituacionCobro; detalle: string } {
  if (c?.pagado_hasta) {
    const d = diasEntre(hoy, c.pagado_hasta);
    if (d < 0) return { tipo: "vencido", detalle: `Venció el ${fechaCorta(c.pagado_hasta)} (hace ${-d} ${d === -1 ? "día" : "días"})` };
    if (d <= 7) return { tipo: "vence_pronto", detalle: d === 0 ? "Vence hoy" : `Vence el ${fechaCorta(c.pagado_hasta)} (en ${d} ${d === 1 ? "día" : "días"})` };
    return { tipo: "al_dia", detalle: `Pagado hasta el ${fechaCorta(c.pagado_hasta)}` };
  }
  if (f.estado === "demo_finalizada") return { tipo: "vencido", detalle: f.demo_fin ? `La semana gratis terminó el ${fechaCorta(f.demo_fin)}` : "La semana gratis terminó" };
  if (f.estado === "en_demo") return { tipo: "en_prueba", detalle: f.demo_fin ? `Semana gratis hasta el ${fechaCorta(f.demo_fin)}` : "En semana gratis" };
  if (f.pagada_desde) return { tipo: "sin_periodo", detalle: "Marcada como pagada, sin período registrado" };
  return { tipo: "otra", detalle: f.estado ? estadoInfo[f.estado].label : "" };
}

export function Administracion() {
  const esAdmin = useEsAdmin();
  const session = useSession();
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [aviso, setAviso] = useState<{ text: string; error?: boolean } | null>(null);
  const nombre = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";

  if (!esAdmin) {
    return (
      <Pagina>
        <Caja titulo="Administración" descripcion="Esta sección es solo para la administración del programa." />
      </Pagina>
    );
  }

  const pestanas: PestanaCaja<Pestana>[] = [
    { id: "resumen", label: "Resumen" },
    { id: "cobros", label: "Cobros" },
    { id: "gastos", label: "Gastos" },
    { id: "equipo", label: "Equipo" },
    { id: "configuracion", label: "Configuración" },
    { id: "cumplimiento", label: "Cumplimiento" },
  ];

  return (
    <Pagina>
      <Caja
        eyebrow={
          <>
            Administración <BadgeRol texto="Administrador" />
          </>
        }
        titulo={`Hola${nombre ? `, ${nombre}` : ""}`}
        descripcion="Cómo va el programa: familias, cobros, gastos, equipo y cumplimiento."
        pie={<CajaPestanas etiqueta="Administración" pestanas={pestanas} activa={pestana} onCambiar={setPestana} />}
      >
        {aviso && <CajaAviso texto={aviso.text} error={aviso.error} onCerrar={() => setAviso(null)} />}
        <CajaCuerpo>
          {pestana === "resumen" && <Resumen onIr={setPestana} />}
          {pestana === "cobros" && <Cobros onAviso={(text, error) => setAviso({ text, error })} />}
          {pestana === "gastos" && <Gastos onAviso={(text, error) => setAviso({ text, error })} />}
          {pestana === "equipo" && <Equipo />}
          {pestana === "configuracion" && <Configuracion />}
          {pestana === "cumplimiento" && <Cumplimiento />}
        </CajaCuerpo>
      </Caja>
    </Pagina>
  );
}

// ── Resumen ────────────────────────────────────────────────────────────
function Resumen({ onIr }: { onIr: (p: Pestana) => void }) {
  const navigate = useNavigate();
  const { porPaciente, isLoading } = useCuentaPorPaciente();
  const { data: cobros } = useCobros();
  const { data: patients } = usePatients();
  const hoy = hoyCR();
  const hoyStr = isoDia(hoy);
  const inicioMes = isoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const inicioMesAnterior = isoDia(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
  const { data: pagos } = usePagos(inicioMesAnterior);

  const r = useMemo(() => {
    const filas = [...porPaciente.values()];
    const sit = filas.map((f) => situacion(f, f.patient_id ? cobros?.get(f.patient_id) : undefined, hoyStr).tipo);
    const cuenta = (t: SituacionCobro) => sit.filter((x) => x === t).length;
    const ingresosMes = (pagos ?? []).filter((p) => p.fecha_pago >= inicioMes).reduce((n, p) => n + p.monto, 0);
    const ingresosAnterior = (pagos ?? []).filter((p) => p.fecha_pago < inicioMes).reduce((n, p) => n + p.monto, 0);
    // Conversión: de las semanas gratis que terminaron en los últimos 90 días, cuántas pagaron.
    const hace90 = Date.now() - 90 * 86_400_000;
    const terminadas = filas.filter((f) => f.demo_fin && new Date(f.demo_fin).getTime() < Date.now() && new Date(f.demo_fin).getTime() > hace90);
    const convertidas = terminadas.filter((f) => !!f.pagada_desde).length;
    const bajasMes = filas.filter((f) => (f.estado === "inactiva" || f.estado === "rechazada") && (f.estado_desde ?? "") >= inicioMes).length;
    const embudo = ORDEN_ESTADOS.filter((e) => e !== "inactiva" && e !== "rechazada").map((e) => ({ e, n: filas.filter((f) => f.estado === e).length }));
    return {
      pagandoAlDia: cuenta("al_dia") + cuenta("vence_pronto"),
      vencidos: cuenta("vencido"),
      vencePronto: cuenta("vence_pronto"),
      enPrueba: cuenta("en_prueba"),
      sinPeriodo: cuenta("sin_periodo"),
      ingresosMes,
      ingresosAnterior,
      conversion: terminadas.length ? Math.round((convertidas / terminadas.length) * 100) : null,
      terminadas: terminadas.length,
      bajasMes,
      embudo,
      total: filas.length,
    };
  }, [porPaciente, cobros, pagos, hoyStr, inicioMes]);

  const sinSemana = (patients ?? []).filter((p) => p.sin_semana).length;
  if (isLoading) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  const maxEmbudo = Math.max(1, ...r.embudo.map((x) => x.n));
  const mes = hoy.toLocaleDateString("es-CR", { month: "long" });

  return (
    <div className="grid gap-8">
      <Seccion titulo="Familias e ingresos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador valor={String(r.pagandoAlDia)} etiqueta="Pagando al día" detalle={r.vencePronto ? `${r.vencePronto} ${r.vencePronto === 1 ? "vence" : "vencen"} esta semana` : "Con su mensualidad vigente"} tono="bien" onClick={() => onIr("cobros")} />
          <Indicador valor={String(r.vencidos)} etiqueta="Por cobrar" detalle="Venció su mes o terminó la semana gratis" tono={r.vencidos ? "aviso" : "normal"} onClick={() => onIr("cobros")} />
          <Indicador valor={String(r.enPrueba)} etiqueta="En semana gratis" detalle="Todavía no pagan" onClick={() => onIr("cobros")} />
          <Indicador
            valor={colones(r.ingresosMes)}
            etiqueta={`Ingresos de ${mes}`}
            detalle={`Mes anterior: ${colones(r.ingresosAnterior)}`}
            onClick={() => onIr("cobros")}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            valor={r.conversion === null ? "Sin datos" : `${r.conversion} %`}
            etiqueta="De prueba a pago"
            detalle={r.terminadas ? `De ${r.terminadas} ${r.terminadas === 1 ? "semana gratis terminada" : "semanas gratis terminadas"} en 90 días` : "Todavía no terminó ninguna semana gratis"}
          />
          <Indicador valor={String(r.bajasMes)} etiqueta={`Bajas de ${mes}`} detalle="Cuentas inactivas o rechazadas este mes" tono={r.bajasMes ? "aviso" : "normal"} onClick={() => navigate("/app/profesional/usuarios")} />
          <Indicador valor={String(sinSemana)} etiqueta="Familias sin semana" detalle="Hoy no tienen actividades" tono={sinSemana ? "aviso" : "bien"} onClick={() => navigate("/app/profesional/panel")} />
          <Indicador valor={String(r.sinPeriodo)} etiqueta="Pagadas sin período" detalle="Registrá su próximo pago para saber cuándo vencen" onClick={() => onIr("cobros")} />
        </div>
      </Seccion>

      <Seccion titulo="Recorrido de las familias" accion={<span className="text-[13.5px] text-tinta-suave">{r.total} familias en total</span>}>
        <ul className="list-none m-0 p-0 grid gap-2">
          {r.embudo.map(({ e, n }) => (
            <li key={e} className="grid grid-cols-[170px_1fr_40px] sm:grid-cols-[210px_1fr_40px] items-center gap-3">
              <span className="text-[14px] text-tinta">{estadoInfo[e].label}</span>
              <span className="h-3 rounded-full bg-campo overflow-hidden">
                <span className="block h-full rounded-full bg-verde-profundo" style={{ width: `${(n / maxEmbudo) * 100}%` }} />
              </span>
              <span className="text-right text-[14px] font-semibold text-tinta">{n}</span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[13px] text-tinta-tenue">Dónde está cada familia hoy: desde que se registra hasta que paga.</p>
      </Seccion>
    </div>
  );
}

// ── Cobros ─────────────────────────────────────────────────────────────
function Cobros({ onAviso }: { onAviso: (t: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const esAdmin = useEsAdmin();
  const { porPaciente, isLoading } = useCuentaPorPaciente();
  const { data: cobros } = useCobros();
  const hoy = hoyCR();
  const hoyStr = isoDia(hoy);
  const inicioMes = isoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const { data: pagos } = usePagos(inicioMes);
  const [registrando, setRegistrando] = useState<FilaCuenta | null>(null);
  const [vista, setVista] = useState<"pendientes" | "todas">("pendientes");

  const filas = useMemo(
    () =>
      [...porPaciente.values()]
        .filter((f) => f.patient_id)
        .map((f) => ({ f, s: situacion(f, cobros?.get(f.patient_id!), hoyStr), c: cobros?.get(f.patient_id!) })),
    [porPaciente, cobros, hoyStr],
  );
  const grupo = (t: SituacionCobro) => filas.filter((x) => x.s.tipo === t);
  const anular = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("anular_pago", { p_pago_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      onAviso("Pago anulado.");
      qc.invalidateQueries({ queryKey: ["pagos"] });
      qc.invalidateQueries({ queryKey: ["estado-cobros"] });
    },
    onError: (e) => onAviso((e as Error).message, true),
  });

  if (isLoading) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  const totalMes = (pagos ?? []).reduce((n, p) => n + p.monto, 0);
  const porMedio = (m: Pago["medio"]) => (pagos ?? []).filter((p) => p.medio === m).reduce((n, p) => n + p.monto, 0);

  const bloques: { titulo: string; tipo: SituacionCobro; vacio: string; mostrar: boolean }[] = [
    { titulo: "Por cobrar", tipo: "vencido", vacio: "Nadie tiene pagos vencidos.", mostrar: true },
    { titulo: "Vencen en los próximos 7 días", tipo: "vence_pronto", vacio: "Nadie vence esta semana.", mostrar: true },
    { titulo: "En semana gratis", tipo: "en_prueba", vacio: "Nadie está en semana gratis.", mostrar: true },
    { titulo: "Pagadas sin período registrado", tipo: "sin_periodo", vacio: "", mostrar: true },
    { titulo: "Al día", tipo: "al_dia", vacio: "Todavía no hay pagos registrados.", mostrar: vista === "todas" },
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillToggle
          value={vista}
          onChange={setVista}
          options={[
            { value: "pendientes", label: "Lo que hay que cobrar" },
            { value: "todas", label: "Todas las familias" },
          ]}
        />
        <p className="m-0 text-[14px] text-tinta-suave">
          Cobrado en {hoy.toLocaleDateString("es-CR", { month: "long" })}: <strong className="text-tinta">{colones(totalMes)}</strong> · SINPE {colones(porMedio("sinpe"))} · Transferencia {colones(porMedio("transferencia"))}
        </p>
      </div>

      {bloques
        .filter((b) => b.mostrar && (b.vacio || grupo(b.tipo).length > 0))
        .map((b) => {
          const lista = grupo(b.tipo);
          return (
            <Seccion key={b.tipo} titulo={`${b.titulo}${lista.length ? ` · ${lista.length}` : ""}`}>
              {lista.length === 0 ? (
                <p className="m-0 text-[14.5px] text-tinta-tenue">{b.vacio}</p>
              ) : (
                <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
                  {lista.map(({ f, s, c }) => (
                    <li key={f.patient_id} className="grid gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center px-4 py-3 border-b border-borde-suave last:border-b-0">
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-tinta truncate">{f.paciente_nombre ?? f.nombre}</span>
                        <span className="block text-[13px] text-tinta-suave truncate">
                          {f.nombre} · {planTiers.find((t) => t.id === f.modalidad)?.nombre ?? "Programa"}
                        </span>
                      </span>
                      <span className={`text-[13.5px] ${s.tipo === "vencido" ? "text-alerta-texto font-semibold" : "text-tinta-suave"}`}>{s.detalle}</span>
                      <span className="text-[13px] text-tinta-tenue">
                        {c?.ultimo_pago ? `Último: ${colones(c.ultimo_monto ?? 0)} · ${MEDIO[(c.ultimo_medio ?? "otro") as Pago["medio"]]}` : "Sin pagos registrados"}
                      </span>
                      <span className="flex flex-wrap gap-2 sm:justify-end">
                        {f.telefono && (
                          <a
                            href={waLink(f.telefono, `Hola ${f.nombre.split(" ")[0]}, te escribimos de IntegraMente en Casa sobre el programa de ${f.paciente_nombre ?? "tu familiar"}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center min-h-9 px-3.5 rounded-full border-[1.5px] border-borde text-[13px] font-semibold text-verde-profundo no-underline hover:border-verde-serenidad"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setRegistrando(f)}
                          className="inline-flex items-center min-h-9 px-3.5 rounded-full border-0 bg-verde-profundo text-white text-[13px] font-semibold cursor-pointer hover:bg-tinta"
                        >
                          Registrar pago
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          );
        })}

      <Seccion titulo={`Pagos registrados en ${hoy.toLocaleDateString("es-CR", { month: "long" })}`}>
        {(pagos ?? []).length === 0 ? (
          <p className="m-0 text-[14.5px] text-tinta-tenue">Todavía no hay pagos este mes.</p>
        ) : (
          <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
            {pagos!.map((p) => {
              const pac = Array.isArray(p.patients) ? p.patients[0] : p.patients;
              return (
                <li key={p.id} className="grid gap-1 sm:grid-cols-[110px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_40px] sm:items-center px-4 py-2.5 border-b border-borde-suave last:border-b-0 text-[14px]">
                  <span className="text-tinta-suave">{fechaCorta(p.fecha_pago)}</span>
                  <span className="font-semibold text-tinta truncate">{pac?.nombre ?? "Familia"}</span>
                  <span className="text-tinta">
                    {colones(p.monto)} · {MEDIO[p.medio]}
                  </span>
                  <span className="text-tinta-tenue truncate">
                    Cubre {fechaCorta(p.cubre_desde)} al {fechaCorta(p.cubre_hasta)}
                    {p.referencia ? ` · Ref. ${p.referencia}` : ""}
                  </span>
                  {esAdmin ? (
                    <RowMenu items={[{ label: "Anular pago", danger: true, onClick: () => window.confirm("¿Anular este pago? La familia vuelve a la fecha de vencimiento anterior.") && anular.mutate(p.id) }]} />
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>

      {registrando && (
        <RegistrarPago
          fila={registrando}
          onClose={() => setRegistrando(null)}
          onListo={(t) => {
            setRegistrando(null);
            onAviso(t);
            qc.invalidateQueries({ queryKey: ["pagos"] });
            qc.invalidateQueries({ queryKey: ["estado-cobros"] });
            qc.invalidateQueries({ queryKey: ["panel-cuentas"] });
          }}
        />
      )}
    </div>
  );
}

function RegistrarPago({ fila, onClose, onListo }: { fila: FilaCuenta; onClose: () => void; onListo: (t: string) => void }) {
  const [monto, setMonto] = useState(String(precioPrograma(fila.modalidad) ?? ""));
  const [medio, setMedio] = useState<Pago["medio"]>("sinpe");
  const [referencia, setReferencia] = useState("");
  const [fecha, setFecha] = useState(isoDia(hoyCR()));
  const [meses, setMeses] = useState("1");
  const [nota, setNota] = useState("");
  const guardar = useMutation({
    mutationFn: async () => {
      const n = Number(monto.replace(/\D/g, ""));
      if (!n) throw new Error("Escribí el monto.");
      const { error } = await supabase.rpc("registrar_pago", {
        p_patient_id: fila.patient_id,
        p_monto: n,
        p_medio: medio,
        p_referencia: referencia,
        p_fecha: fecha,
        p_meses: Number(meses),
        p_nota: nota,
      });
      if (error) throw error;
      return n;
    },
    onSuccess: (n) => onListo(`Pago de ${colones(n)} registrado para ${fila.paciente_nombre ?? fila.nombre}.`),
  });
  const campo = "w-full min-h-11 px-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none";
  return (
    <Modal onClose={onClose}>
      <h3 className="m-0 mb-1 pr-10 font-serif font-normal text-[24px] text-tinta">Registrar pago</h3>
      <p className="m-0 mb-5 text-[14.5px] text-tinta-suave">
        {fila.paciente_nombre ?? fila.nombre} · {fila.nombre}
      </p>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-[14px] font-semibold text-tinta">Medio</span>
          <PillToggle
            value={medio}
            onChange={setMedio}
            options={[
              { value: "sinpe", label: "SINPE Móvil" },
              { value: "transferencia", label: "Transferencia" },
              { value: "otro", label: "Otro" },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Monto (₡)
            <input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} className={campo} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Fecha del pago
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            {medio === "sinpe" ? "Comprobante SINPE" : medio === "transferencia" ? "Número de transferencia" : "Referencia"}
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Opcional" className={campo} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
            Meses que cubre
            <select value={meses} onChange={(e) => setMeses(e.target.value)} className={campo}>
              {["1", "2", "3", "6", "12"].map((m) => (
                <option key={m} value={m}>
                  {m === "1" ? "1 mes" : `${m} meses`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Nota
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Opcional" className={campo} />
        </label>
        <p className="m-0 text-[13px] text-tinta-tenue">El período empieza al día siguiente del último mes pagado (o en la fecha del pago, si ya venció). La cuenta queda activa.</p>
        {guardar.isError && <p className="m-0 text-[14px] text-alerta-texto">{(guardar.error as Error).message}</p>}
        <Button variant="principal" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : "Registrar pago"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Equipo ─────────────────────────────────────────────────────────────
interface MiembroEquipo {
  profile_id: string;
  nombre: string;
  especialidad: string | null;
  es_admin: boolean;
  activo: boolean;
  familias: number;
  confidencialidad_vigente: boolean;
  ultimo_acceso: string | null;
}

function Equipo() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["equipo-resumen", VERSION_LEGAL],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("equipo_resumen", { p_version: VERSION_LEGAL });
      if (error) throw error;
      return (data ?? []) as MiembroEquipo[];
    },
  });
  if (isLoading) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave max-w-[60ch]">
          Cada profesional entra con su propia cuenta: así queda registrado quién vio o cambió qué, y cada quien acepta su compromiso de confidencialidad.
        </p>
        <Button dense onClick={() => navigate("/app/profesional/usuarios?tab=equipo")}>
          Agregar o desactivar profesionales
        </Button>
      </div>
      <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
        {(data ?? []).map((m) => (
          <li key={m.profile_id} className={`grid gap-1 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.1fr)] sm:items-center px-4 py-3 border-b border-borde-suave last:border-b-0 ${m.activo ? "" : "opacity-60"}`}>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-tinta">
                {m.nombre} {m.es_admin && <BadgeRol texto="Administrador" />}
              </span>
              <span className="block text-[13px] text-tinta-suave">{m.especialidad ?? (m.es_admin ? "Administración" : "Equipo clínico")}{m.activo ? "" : " · desactivada"}</span>
            </span>
            <span className="text-[13.5px] text-tinta">{m.familias === 1 ? "1 familia asignada" : `${m.familias} familias asignadas`}</span>
            <span className={`text-[13.5px] ${m.confidencialidad_vigente ? "text-semaforo-verde-texto" : "text-alerta-texto font-semibold"}`}>
              {m.confidencialidad_vigente ? "Confidencialidad aceptada" : "Falta aceptar la confidencialidad"}
            </span>
            <span className="text-[13px] text-tinta-tenue">{m.ultimo_acceso ? `Último acceso: ${fechaCorta(m.ultimo_acceso)}` : "Nunca entró"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Configuración ──────────────────────────────────────────────────────
function Configuracion() {
  const [ajustes, setAjustes] = useState(false);
  const fila = (t: string, d: string) => (
    <li className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 border-b border-borde-suave last:border-b-0">
      <span className="text-[14.5px] font-semibold text-tinta">{t}</span>
      <span className="text-[14px] text-tinta-suave">{d}</span>
    </li>
  );
  return (
    <div className="grid gap-8">
      <Seccion titulo="Cuentas e inteligencia artificial" accion={<Button dense onClick={() => setAjustes(true)}>Cambiar</Button>}>
        <p className="m-0 text-[14.5px] text-tinta-suave">Días de la semana gratis, días sin actividad para que una cuenta pase a inactiva y cuánto puede cambiar la IA de una semana.</p>
      </Seccion>
      <Seccion titulo="Programas y precios">
        <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
          {planTiers.filter((t) => t.id !== "clinico").map((t) => fila(t.nombre, `${t.precio} ${t.periodo ?? ""}`.trim()))}
        </ul>
      </Seccion>
      <Seccion titulo="Recordatorios por WhatsApp">
        <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
          {fila("Mañana", "8:00 a.m. · la próxima actividad del día")}
          {fila("Tarde", "2:45 p.m. · antes del café")}
          {fila("Noche anterior", "7:00 p.m. · qué preparar para mañana")}
          {fila("Semana nueva", "El día en que empieza, desde las 7:00 a.m.")}
          {fila("Tope", "3 mensajes por día y por familia, de 7:00 a.m. a 9:00 p.m.")}
        </ul>
        <p className="m-0 text-[13px] text-tinta-tenue">Solo para familias que dieron el permiso de WhatsApp. Cada mensaje se enciende, se apaga o se limita en Gastos → Servicios.</p>
      </Seccion>
      {ajustes && <AjustesCuentasModal onClose={() => setAjustes(false)} />}
    </div>
  );
}

// ── Cumplimiento ───────────────────────────────────────────────────────
function Cumplimiento() {
  const { data } = useQuery({
    queryKey: ["cobertura-permisos", VERSION_LEGAL],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cobertura_permisos", { p_version: VERSION_LEGAL });
      if (error) throw error;
      return (data ?? []) as { tipo: string; otorgados: number; total: number }[];
    },
  });
  const titulo = (t: string) => (t === "terminos" ? `Aceptaron la versión vigente (${VERSION_LEGAL})` : (CONSENTIMIENTOS.find((c) => c.tipo === t)?.titulo ?? t));
  return (
    <div className="grid gap-8">
      <Seccion titulo="Permisos de las familias (Ley 8968)">
        <ul className="list-none m-0 p-0 grid gap-2">
          {(data ?? []).map((c) => (
            <li key={c.tipo} className="grid grid-cols-[minmax(0,1fr)_120px_70px] sm:grid-cols-[minmax(0,1fr)_220px_70px] items-center gap-3">
              <span className="text-[14px] text-tinta">{titulo(c.tipo)}</span>
              <span className="h-3 rounded-full bg-campo overflow-hidden">
                <span className="block h-full rounded-full bg-verde-profundo" style={{ width: `${c.total ? (c.otorgados / c.total) * 100 : 0}%` }} />
              </span>
              <span className="text-right text-[14px] font-semibold text-tinta">
                {c.otorgados}/{c.total}
              </span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[13px] text-tinta-tenue">Sobre las cuentas activas de familias y participantes. Las que no aceptaron la versión vigente la aceptan al entrar.</p>
      </Seccion>
      <SolicitudesDatos />
    </div>
  );
}
